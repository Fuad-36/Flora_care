import "dotenv/config";
import express, { type Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { pool } from "./src/db/index.js";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import {
  FALLBACK_USER,
  FALLBACK_PLANTS,
  FALLBACK_LISTINGS,
  FALLBACK_CONVERSATIONS,
} from "./src/fallbackData.js";
import { apiLogger } from "./src/middleware/apiLogger.js";
import { formatDhakaDate, formatDhakaTime } from "./src/utils/dateTime.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: "25mb" }));
app.use(apiLogger);

// Initialize Gemini Client if API key is present
const geminiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (geminiApiKey) {
  ai = new GoogleGenAI({ apiKey: geminiApiKey });
}

// In-memory runtime state for when local database isn't yet migrated or reachable
let memoryUser = { ...FALLBACK_USER };
let memoryUsers: Record<string, any> = { [FALLBACK_USER.id]: { ...FALLBACK_USER } };
let memoryPlants = [...FALLBACK_PLANTS];
let memoryListings = [...FALLBACK_LISTINGS];
let memoryConversations = [...FALLBACK_CONVERSATIONS];
let memoryDiagnoses: any[] = [];
let memoryCareLogs: any[] = [];
let memoryIvyMessages: any[] = []; // {id, role, text, time, userId?} — filtered per user on fallback

// Helper to test if DB query works, otherwise use fallback gracefully
async function safeDbQuery(query: string, params: any[] = []) {
  try {
    return await pool.query(query, params);
  } catch (err: any) {
    console.warn(`[Database Warning] Query failed (${err.code || err.message}). Using local in-memory fallback store.`);
    return null;
  }
}

type ConversationStreamClient = {
  userId: string;
  response: Response;
};

type UserStreamClient = {
  response: Response;
};

const conversationStreams = new Map<string, Set<ConversationStreamClient>>();
const userStreams = new Map<string, Set<UserStreamClient>>();

/**
 * Send a realtime event to every browser currently viewing a conversation.
 * REST remains the source of truth; this only pushes the new message immediately.
 */
function broadcastConversationEvent(
  conversationId: string,
  event: { type: string; conversationId: string; message?: any }
) {
  const clients = conversationStreams.get(conversationId);
  if (!clients) return;

  const payload = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
  for (const client of clients) {
    if (client.response.writableEnded) {
      clients.delete(client);
      continue;
    }
    try {
      client.response.write(payload);
    } catch {
      clients.delete(client);
    }
  }

  if (clients.size === 0) conversationStreams.delete(conversationId);
}

function broadcastUserEvent(
  userId: string,
  event: { type: string; conversationId: string; message?: any }
) {
  const clients = userStreams.get(userId);
  if (!clients) return;

  const payload = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
  for (const client of clients) {
    if (client.response.writableEnded) {
      clients.delete(client);
      continue;
    }
    try {
      client.response.write(payload);
    } catch {
      clients.delete(client);
    }
  }

  if (clients.size === 0) userStreams.delete(userId);
}

async function getConversationParticipants(conversationId: string) {
  const result = await safeDbQuery(
    "SELECT buyer_id, seller_id FROM conversations WHERE id = $1",
    [conversationId]
  );

  if (result && result.rows.length > 0) {
    return {
      buyerId: result.rows[0].buyer_id as string,
      sellerId: result.rows[0].seller_id as string,
    };
  }

  const memoryConversation = memoryConversations.find((c) => c.id === conversationId);
  if (memoryConversation) {
    return {
      buyerId: memoryConversation.buyerId,
      sellerId: memoryConversation.sellerId,
    };
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// API ROUTES
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_USER_ID = "user_emma";

// 1. GET Current User Profile
app.get("/api/user", async (req, res) => {
  const userId = (req.query.userId as string) || DEFAULT_USER_ID;
  const result = await safeDbQuery("SELECT * FROM users WHERE id = $1", [userId]);
  if (result && result.rows.length > 0) {
    const u = result.rows[0];
    memoryUsers[u.id] = u;
    return res.json(u);
  }
  // Return fallback user — per-id map to avoid Emma overwrite
  if (memoryUsers[userId]) return res.json(memoryUsers[userId]);
  res.json(memoryUser);
});

// 2. Auth: Sign In or Sign Up mock/real DB sync
app.post("/api/auth/login", async (req, res) => {
  const { email, name, mode = "login" } = req.body;
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Email is required" });
  }

  const result = await safeDbQuery("SELECT * FROM users WHERE email = $1", [email]);
  if (result && result.rows.length > 0) {
    const u = result.rows[0];
    memoryUsers[u.id] = u;
    memoryUser = u;
    return res.json(u);
  }

  // A login must never create an account implicitly.
  if (mode === "login") {
    return res.status(404).json({ error: "No account found for this email. Please sign up first." });
  }

  // Fallback in-memory — keep per-email map so refresh keeps name
  const existingFallback = Object.values(memoryUsers).find((u: any) => u.email === email);
  if (existingFallback) {
    return res.json(existingFallback);
  }

  if (result) {
    const id = "user_" + Date.now();
    const insertResult = await safeDbQuery(
      "INSERT INTO users (id, email, name, avatar, bio, location) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [
        id,
        email,
        name || email.split("@")[0],
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&auto=format",
        "Plant lover & green thumb explorer",
        "New York, NY",
      ]
    );
    if (insertResult && insertResult.rows.length > 0) {
      const u = insertResult.rows[0];
      memoryUsers[u.id] = u;
      memoryUser = u;
      return res.status(201).json(u);
    }
  }

  const newUser = {
    id: "user_" + Date.now(),
    email,
    name: name || email.split("@")[0],
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&auto=format",
    bio: "Urban gardener and green thumb explorer",
    location: "New York, NY",
  };
  memoryUser = newUser;
  memoryUsers[newUser.id] = newUser;
  res.status(201).json(newUser);
});

// 3. GET Plants for user
app.get("/api/plants", async (req, res) => {
  const userId = (req.query.userId as string) || DEFAULT_USER_ID;
  const result = await safeDbQuery(
    "SELECT * FROM plants WHERE user_id = $1 ORDER BY created_at DESC",
    [userId]
  );

  if (result && result.rows.length > 0) {
    const now = Date.now();
    const plants = result.rows.map((row) => {
      const lastWateredDate = new Date(row.last_watered).getTime();
      const daysSince = Math.floor((now - lastWateredDate) / (1000 * 60 * 60 * 24));
      const freq = row.watering_frequency || 7;

      let computedStatus = "healthy";
      if (daysSince >= freq + 2) computedStatus = "overdue";
      else if (daysSince >= freq - 1) computedStatus = "due-soon";

      return {
        id: row.id,
        userId: row.user_id,
        nickname: row.nickname,
        species: row.species,
        scientificName: row.scientific_name || row.species,
        status: computedStatus,
        image: row.image,
        wateringFrequency: row.watering_frequency,
        lastWatered: row.last_watered,
        notes: row.notes || "",
        sunlight: row.sunlight,
        soil: row.soil,
        temperature: row.temperature,
        humidity: row.humidity,
        fertilizer: row.fertilizer,
        createdAt: row.created_at,
      };
    });
    return res.json(plants);
  }

  // Fallback in-memory plants — filter by userId so new users don't see Emma's plants
  const filtered = memoryPlants.filter((p) => p.userId === userId);
  // If user has no plants yet but is Emma, show fallback Emma plants; else show only theirs (or empty)
  if (filtered.length > 0) return res.json(filtered);
  if (userId === FALLBACK_USER.id || userId === DEFAULT_USER_ID) return res.json(memoryPlants.filter((p) => p.userId === FALLBACK_USER.id));
  return res.json(filtered);
});

// 4. POST Create Plant
app.post("/api/plants", async (req, res) => {
  const {
    nickname,
    species,
    scientificName,
    wateringFrequency,
    image,
    notes,
    sunlight,
    soil,
    temperature,
    humidity,
    fertilizer,
    userId = DEFAULT_USER_ID,
  } = req.body;

  const id = "plant_" + Date.now();
  const defaultImage =
    image ||
    "https://images.unsplash.com/photo-1545241047-6083a3684587?w=800&h=800&fit=crop&auto=format";

  const result = await safeDbQuery(
    `INSERT INTO plants (
      id, user_id, nickname, species, scientific_name, status, image,
      watering_frequency, last_watered, notes, sunlight, soil,
      temperature, humidity, fertilizer
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, $10, $11, $12, $13, $14)
    RETURNING *`,
    [
      id,
      userId,
      nickname || species,
      species,
      scientificName || species,
      "healthy",
      defaultImage,
      Number(wateringFrequency) || 7,
      notes || "",
      sunlight || "Bright indirect light",
      soil || "Well-draining potting mix",
      temperature || "65–85°F (18–29°C)",
      humidity || "Moderate (50%+)",
      fertilizer || "Monthly in spring & summer",
    ]
  );

  const newPlant = {
    id,
    userId,
    nickname: nickname || species,
    species,
    scientificName: scientificName || species,
    status: "healthy" as const,
    image: defaultImage,
    wateringFrequency: Number(wateringFrequency) || 7,
    lastWatered: new Date().toISOString(),
    notes: notes || "",
    sunlight: sunlight || "Bright indirect light",
    soil: soil || "Well-draining potting mix",
    temperature: temperature || "65–85°F (18–29°C)",
    humidity: humidity || "Moderate (50%+)",
    fertilizer: fertilizer || "Monthly in spring & summer",
    createdAt: new Date().toISOString(),
  };

  memoryPlants.unshift(newPlant);
  res.status(201).json(result ? result.rows[0] : newPlant);
});

// 5. GET Single Plant with Care Logs & Diagnoses
app.get("/api/plants/:id", async (req, res) => {
  const { id } = req.params;
  const plantRes = await safeDbQuery("SELECT * FROM plants WHERE id = $1", [id]);

  if (plantRes && plantRes.rows.length > 0) {
    const row = plantRes.rows[0];
    const logsRes = await safeDbQuery(
      "SELECT * FROM care_logs WHERE plant_id = $1 ORDER BY logged_at DESC",
      [id]
    );
    const diagnosesRes = await safeDbQuery(
      "SELECT * FROM diagnoses WHERE plant_id = $1 ORDER BY date DESC",
      [id]
    );

    const now = Date.now();
    const lastWateredDate = new Date(row.last_watered).getTime();
    const daysSince = Math.floor((now - lastWateredDate) / (1000 * 60 * 60 * 24));
    const freq = row.watering_frequency || 7;
    let computedStatus = "healthy";
    if (daysSince >= freq + 2) computedStatus = "overdue";
    else if (daysSince >= freq - 1) computedStatus = "due-soon";

    return res.json({
      id: row.id,
      userId: row.user_id,
      nickname: row.nickname,
      species: row.species,
      scientificName: row.scientific_name || row.species,
      status: computedStatus,
      image: row.image,
      wateringFrequency: row.watering_frequency,
      lastWatered: row.last_watered,
      notes: row.notes || "",
      sunlight: row.sunlight,
      soil: row.soil,
      temperature: row.temperature,
      humidity: row.humidity,
      fertilizer: row.fertilizer,
      createdAt: row.created_at,
      careLogs: logsRes ? logsRes.rows : [],
      diagnoses: diagnosesRes ? diagnosesRes.rows : [],
    });
  }

  // Memory fallback
  const found = memoryPlants.find((p) => p.id === id) || memoryPlants[0];
  const logs = memoryCareLogs.filter((l) => l.plantId === id);
  const diags = memoryDiagnoses.filter((d) => d.plantId === id);

  res.json({
    ...found,
    careLogs: logs.length > 0 ? logs : [
      { id: "cl_1", plantId: id, type: "water", notes: "Regular watering", loggedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
      { id: "cl_2", plantId: id, type: "water", notes: "Deep soak with filtered water", loggedAt: new Date(Date.now() - 9 * 86400000).toISOString() },
    ],
    diagnoses: diags,
  });
});

// 6. POST Log Care / Water a Plant
app.post("/api/plants/:id/care", async (req, res) => {
  const { id } = req.params;
  const { type = "water", notes = "Watered plant" } = req.body;
  const logId = "log_" + Date.now();

  await safeDbQuery(
    "INSERT INTO care_logs (id, plant_id, type, notes, logged_at) VALUES ($1, $2, $3, $4, NOW())",
    [logId, id, type, notes]
  );

  if (type === "water") {
    await safeDbQuery(
      "UPDATE plants SET last_watered = NOW(), status = 'healthy' WHERE id = $1",
      [id]
    );
  }

  // In-memory update
  const pIndex = memoryPlants.findIndex((p) => p.id === id);
  if (pIndex !== -1 && type === "water") {
    memoryPlants[pIndex].lastWatered = new Date().toISOString();
    memoryPlants[pIndex].status = "healthy";
  }
  memoryCareLogs.unshift({
    id: logId,
    plantId: id,
    type,
    notes,
    loggedAt: new Date().toISOString(),
  });

  res.json({ success: true, logId, loggedAt: new Date().toISOString() });
});

// 7. PUT Update Plant
app.put("/api/plants/:id", async (req, res) => {
  const { id } = req.params;
  const { nickname, notes, wateringFrequency } = req.body;

  await safeDbQuery(
    "UPDATE plants SET nickname = COALESCE($1, nickname), notes = COALESCE($2, notes), watering_frequency = COALESCE($3, watering_frequency) WHERE id = $4",
    [nickname, notes, wateringFrequency ? Number(wateringFrequency) : null, id]
  );

  const p = memoryPlants.find((pl) => pl.id === id);
  if (p) {
    if (nickname) p.nickname = nickname;
    if (notes !== undefined) p.notes = notes;
    if (wateringFrequency) p.wateringFrequency = Number(wateringFrequency);
  }

  res.json({ success: true });
});

// 8. DELETE Plant
app.delete("/api/plants/:id", async (req, res) => {
  const { id } = req.params;
  await safeDbQuery("DELETE FROM plants WHERE id = $1", [id]);
  memoryPlants = memoryPlants.filter((p) => p.id !== id);
  res.json({ success: true });
});

// 9. AI Scan Endpoint
app.post("/api/ai/scan", async (req, res) => {
  try {
    const { mode, imageBase64, plantContext } = req.body;

    if (!ai) {
      if (mode === "identify") {
        return res.json({
          species: "Monstera Deliciosa",
          scientificName: "Monstera deliciosa",
          confidence: "High Confidence Match (98%)",
          description:
            "Also known as the Swiss Cheese Plant. Native to tropical forests of southern Mexico and Central America. Famous for its natural leaf fenestrations.",
          sunlight: "Bright indirect light",
          water: "Every 7 days when top 2 inches feel dry",
          soil: "Chunky aroid potting mix with orchid bark and perlite",
          temperature: "65–85°F (18–29°C)",
          humidity: "High, 60%+",
          fertilizer: "Monthly during spring and summer",
        });
      } else {
        return res.json({
          issue: "Spider Mites",
          scientificIssue: "Tetranychus urticae",
          confidence: "High Confidence Match (94%)",
          description:
            "Fine webbing clusters detected along leaf joints and undersides. Pale stippled discoloration on leaves caused by mites extracting chlorophyll.",
          organicTreatment:
            "Mix 1 tsp pure cold-pressed neem oil, 1/2 tsp mild Castile soap, and 1 liter lukewarm water. Spray thoroughly under leaves every 3 days for 2 weeks. Isolate plant and wipe down foliage with damp microfiber cloth.",
          chemicalTreatment:
            "Apply a pyrethrin or sulfur-based miticide spray following container instructions. Treat outdoors in shaded, well-ventilated area with protective gloves.",
        });
      }
    }

    if (mode === "identify") {
      const prompt = `You are a world-class master botanist. Analyze this plant photo and provide identification in exact JSON format:
{
  "species": "Common plant name (e.g. Monstera Deliciosa)",
  "scientificName": "Scientific Latin name (e.g. Monstera deliciosa)",
  "confidence": "e.g. High Confidence Match (98%)",
  "description": "2-3 concise, informative sentences about origins, leaf characteristics, and indoor habits.",
  "sunlight": "Ideal light recommendation",
  "water": "Watering frequency recommendation in days / signs to look for",
  "soil": "Best potting mix composition",
  "temperature": "Ideal temperature range",
  "humidity": "Ideal humidity range",
  "fertilizer": "Feeding recommendation"
}
Return only valid JSON, no markdown tags.`;

      const contents: any[] = [{ text: prompt }];
      if (imageBase64 && imageBase64.startsWith("data:")) {
        const parts = imageBase64.split(",");
        const mimeType = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg";
        contents.push({
          inlineData: { mimeType, data: parts[1] },
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
      });

      const text = response.text || "";
      const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
      return res.json(JSON.parse(cleaned));
    } else {
      const prompt = `You are an expert plant pathologist and clinical botanist.
${plantContext ? `Plant Context: The user notes this is a ${plantContext}.` : ""}
Analyze the symptoms shown in the photo or described. Provide diagnosis in exact JSON format:
{
  "issue": "Diagnosis name (e.g. Spider Mites, Overwatering, Powdery Mildew, Nutrient Burn)",
  "scientificIssue": "Scientific organism or pathogen name (e.g. Tetranychus urticae, Pythium spp.)",
  "confidence": "High Confidence Match (95%)",
  "description": "2-3 clear sentences describing visual symptoms, damage mechanism, and progression.",
  "organicTreatment": "Step-by-step natural/organic remedies, isolating tips, moisture control, neem/soap ratios, etc.",
  "chemicalTreatment": "Conventional treatment, active ingredient recommendation and safety steps."
}
Return only valid JSON, no markdown formatting.`;

      const contents: any[] = [{ text: prompt }];
      if (imageBase64 && imageBase64.startsWith("data:")) {
        const parts = imageBase64.split(",");
        const mimeType = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg";
        contents.push({
          inlineData: { mimeType, data: parts[1] },
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
      });

      const text = response.text || "";
      const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
      return res.json(JSON.parse(cleaned));
    }
  } catch (err: any) {
    console.error("AI scan error:", err);
    res.json({
      issue: "Leaf Stress & Potential Pest Feeding",
      scientificIssue: "Chlorosis / Tetranychidae",
      confidence: "Moderate Confidence (88%)",
      description:
        "Foliage displays mottled discoloration and mild leaf curling indicative of either moisture fluctuation or early mite activity.",
      organicTreatment:
        "Wipe leaves gently with diluted neem oil solution or mild soap water. Inspect leaf undersides regularly and maintain humidity above 55%.",
      chemicalTreatment:
        "Apply horticultural oil or targeted insecticidal soap as directed by manufacturer label.",
    });
  }
});

// 10. POST Save Diagnosis
app.post("/api/diagnoses", async (req, res) => {
  const {
    plantId,
    issue,
    scientificIssue,
    confidence,
    description,
    organicTreatment,
    chemicalTreatment,
    imageUrl,
    userId = DEFAULT_USER_ID,
  } = req.body;

  const id = "diag_" + Date.now();
  const result = await safeDbQuery(
    `INSERT INTO diagnoses (
      id, plant_id, user_id, issue, scientific_issue, confidence,
      description, organic_treatment, chemical_treatment, image_url, date
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
    RETURNING *`,
    [
      id,
      plantId || null,
      userId,
      issue,
      scientificIssue || "",
      confidence || "High Confidence Match",
      description,
      organicTreatment,
      chemicalTreatment,
      imageUrl || null,
    ]
  );

  const diagObj = {
    id,
    plantId,
    userId,
    issue,
    scientificIssue,
    confidence,
    description,
    organicTreatment,
    chemicalTreatment,
    imageUrl,
    date: new Date().toISOString(),
  };

  memoryDiagnoses.unshift(diagObj);

  if (plantId) {
    await safeDbQuery(
      "INSERT INTO care_logs (id, plant_id, type, notes, logged_at) VALUES ($1, $2, $3, $4, NOW())",
      ["log_" + Date.now(), plantId, "diagnosis", `Diagnosed: ${issue}`]
    );
    memoryCareLogs.unshift({
      id: "log_" + Date.now(),
      plantId,
      type: "diagnosis",
      notes: `Diagnosed: ${issue}`,
      loggedAt: new Date().toISOString(),
    });
  }

  res.status(201).json(result ? result.rows[0] : diagObj);
});

// 11. AI Ivy Chat Advisor
app.post("/api/ivy/chat", async (req, res) => {
  const { message, history, userId = DEFAULT_USER_ID } = req.body;
  const userCreatedAt = new Date().toISOString();

  await safeDbQuery(
    "INSERT INTO ivy_messages (id, user_id, role, text, created_at) VALUES ($1, $2, $3, $4, NOW())",
    ["ivy_u_" + Date.now(), userId, "user", message]
  );

  let replyText = "";
  if (ai) {
    try {
      const systemInstruction = `You are Flora, a compassionate, warm, and highly knowledgeable botanical advisor and houseplant expert.
You provide encouraging, practical, scientifically sound plant care advice.
Keep answers concise (2 to 4 short paragraphs or actionable bullet points) so they are effortless to read.`;

      const contents: any[] = [];
      if (Array.isArray(history)) {
        for (const item of history.slice(-6)) {
          contents.push({
            role: item.role === "ivy" ? "model" : "user",
            parts: [{ text: item.text }],
          });
        }
      }
      contents.push({ role: "user", parts: [{ text: message }] });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: { systemInstruction },
      });
      replyText = response.text || "I am happy to help you nurture your garden! Check your soil moisture 2 inches down.";
    } catch (e) {
      replyText = "Houseplants thrive with consistent light and proper drainage. Always avoid standing stagnant water!";
    }
  } else {
    replyText =
      "Great question! Based on what you're describing, common culprits include inconsistent moisture or fluctuating light. Check the soil 2 inches down: if dry, provide a deep soak; if moist, hold off and ensure good air circulation.";
  }

  const ivyMsgId = "ivy_r_" + Date.now();
  const replyCreatedAt = new Date().toISOString();
  await safeDbQuery(
    "INSERT INTO ivy_messages (id, user_id, role, text, created_at) VALUES ($1, $2, $3, $4, NOW())",
    [ivyMsgId, userId, "ivy", replyText]
  );

  memoryIvyMessages.push(
    {
      id: "u_" + Date.now(),
      role: "user",
      text: message,
      time: formatDhakaTime(userCreatedAt),
      createdAt: userCreatedAt,
      userId,
    },
    {
      id: ivyMsgId,
      role: "ivy",
      text: replyText,
      time: formatDhakaTime(replyCreatedAt),
      createdAt: replyCreatedAt,
      userId,
    }
  );

  res.json({
    reply: replyText,
    id: ivyMsgId,
    time: formatDhakaTime(replyCreatedAt),
    createdAt: replyCreatedAt,
  });
});

// 12. GET Ivy History
app.get("/api/ivy/history", async (req, res) => {
  const userId = (req.query.userId as string) || DEFAULT_USER_ID;
  const result = await safeDbQuery(
    "SELECT * FROM ivy_messages WHERE user_id = $1 ORDER BY created_at ASC LIMIT 50",
    [userId]
  );
  if (result && result.rows.length > 0) {
    return res.json(
      result.rows.map((row) => ({
        id: row.id,
        role: row.role,
        text: row.text,
        time: formatDhakaTime(row.created_at),
        createdAt: row.created_at,
      }))
    );
  }
  const filtered = memoryIvyMessages.filter((m: any) => !m.userId || m.userId === userId);
  if (filtered.length > 0) return res.json(filtered);
  res.json(filtered);
});

// 13. GET Listings
app.get("/api/listings", async (req, res) => {
  const { search } = req.query;
  let query = `
    SELECT l.*, u.name as seller_name, u.avatar as seller_avatar 
    FROM listings l
    JOIN users u ON l.seller_id = u.id
    WHERE l.available = true
  `;
  const params: any[] = [];
  if (search) {
    params.push(`%${search}%`);
    query += ` AND (l.plant_name ILIKE $${params.length} OR l.species ILIKE $${params.length} OR l.area ILIKE $${params.length})`;
  }
  query += " ORDER BY l.created_at DESC";

  const result = await safeDbQuery(query, params);
  if (result && result.rows.length > 0) {
    return res.json(
      result.rows.map((row) => ({
        id: row.id,
        sellerId: row.seller_id,
        plantName: row.plant_name,
        species: row.species,
        price: row.price,
        area: row.area,
        image: row.image,
        description: row.description,
        available: row.available,
        date: formatDhakaDate(row.created_at),
        createdAt: row.created_at,
        seller: {
          id: row.seller_id,
          name: row.seller_name,
          avatar: row.seller_avatar,
          rating: 4.9,
        },
      }))
    );
  }

  // Filter in-memory fallback
  let list = memoryListings;
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter((l) => l.plantName.toLowerCase().includes(q) || l.species.toLowerCase().includes(q));
  }
  res.json(list);
});

// 14. POST Create Listing
app.post("/api/listings", async (req, res) => {
  const {
    plantName,
    species,
    price,
    area,
    image,
    description,
    sellerId = DEFAULT_USER_ID,
  } = req.body;

  const id = "listing_" + Date.now();
  const result = await safeDbQuery(
    `INSERT INTO listings (id, seller_id, plant_name, species, price, area, image, description, available, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW())
     RETURNING *`,
    [
      id,
      sellerId,
      plantName || species,
      species,
      Number(price) || 25,
      area || "New York, NY",
      image || "https://images.unsplash.com/photo-1545241047-6083a3684587?w=600&h=600&fit=crop&auto=format",
      description || "Healthy plant ready for a new home.",
    ]
  );

  const sellerUser = memoryUsers[sellerId] || memoryUser;
  const newListing = {
    id,
    sellerId,
    plantName: plantName || species,
    species,
    price: Number(price) || 25,
    area: area || "New York, NY",
    image: image || "https://images.unsplash.com/photo-1545241047-6083a3684587?w=600&h=600&fit=crop&auto=format",
    description: description || "Healthy plant ready for a new home.",
    available: true,
    createdAt: new Date().toISOString(),
    seller: {
      id: sellerId,
      name: sellerUser.name,
      avatar: sellerUser.avatar,
      rating: 5.0,
    },
  };
  memoryListings.unshift(newListing);
  res.status(201).json(result ? result.rows[0] : newListing);
});

// 15. GET Single Listing
app.get("/api/listings/:id", async (req, res) => {
  const { id } = req.params;
  const result = await safeDbQuery(
    `SELECT l.*, u.name as seller_name, u.avatar as seller_avatar 
     FROM listings l
     JOIN users u ON l.seller_id = u.id
     WHERE l.id = $1`,
    [id]
  );

  if (result && result.rows.length > 0) {
    const row = result.rows[0];
    return res.json({
      id: row.id,
      sellerId: row.seller_id,
      plantName: row.plant_name,
      species: row.species,
      price: row.price,
      area: row.area,
      image: row.image,
      description: row.description,
      available: row.available,
      date: formatDhakaDate(row.created_at),
      createdAt: row.created_at,
      seller: {
        id: row.seller_id,
        name: row.seller_name,
        avatar: row.seller_avatar,
        rating: 4.9,
      },
    });
  }

  const found = memoryListings.find((l) => l.id === id) || memoryListings[0];
  res.json(found);
});

// 16. GET User Conversations
app.get("/api/conversations", async (req, res) => {
  const userId = (req.query.userId as string) || DEFAULT_USER_ID;
  const convsRes = await safeDbQuery(
    `SELECT c.*, 
            l.plant_name as listing_name, l.image as listing_image, l.price as listing_price,
            u_buyer.name as buyer_name, u_buyer.avatar as buyer_avatar,
            u_seller.name as seller_name, u_seller.avatar as seller_avatar
     FROM conversations c
     JOIN listings l ON c.listing_id = l.id
     JOIN users u_buyer ON c.buyer_id = u_buyer.id
     JOIN users u_seller ON c.seller_id = u_seller.id
     WHERE c.buyer_id = $1 OR c.seller_id = $1
     ORDER BY c.updated_at DESC`,
    [userId]
  );

  if (convsRes && convsRes.rows.length > 0) {
    const conversations = [];
    for (const row of convsRes.rows) {
      const msgsRes = await safeDbQuery(
        "SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC",
        [row.id]
      );
      const isUserBuyer = row.buyer_id === userId;
      const otherName = isUserBuyer ? row.seller_name : row.buyer_name;
      const otherAvatar = isUserBuyer ? row.seller_avatar : row.buyer_avatar;
      const otherId = isUserBuyer ? row.seller_id : row.buyer_id;
      const msgs = (msgsRes ? msgsRes.rows : []).filter(
        (message: any) => !String(message.id).startsWith("m_reply_")
      );
      const lastMsg = msgs[msgs.length - 1];

      conversations.push({
        id: row.id,
        listingId: row.listing_id,
        listing: row.listing_name,
        listingImage: row.listing_image,
        listingPrice: row.listing_price,
        sellerId: row.seller_id,
        buyerId: row.buyer_id,
        otherParty: {
          id: otherId,
          name: otherName,
          avatar: otherAvatar,
        },
        lastMessage: lastMsg ? lastMsg.text : "Conversation opened",
        time: lastMsg ? formatDhakaTime(lastMsg.created_at) : "Recently",
        unread: 0,
        messages: msgs.map((m: any) => ({
          id: m.id,
          role: m.sender_id === userId ? "user" : "other",
          senderId: m.sender_id,
          text: m.text,
          time: formatDhakaTime(m.created_at),
          createdAt: m.created_at,
        })),
      });
    }
    return res.json(conversations);
  }

  // Filter fallback per user so new users don't see Emma's DMs
  const filteredConvs = memoryConversations
    .filter((c) => c.buyerId === userId || c.sellerId === userId)
    .map((conversation) => ({
      ...conversation,
      messages: conversation.messages.filter((message) => !message.id.startsWith("m_reply_")),
    }));
  res.json(filteredConvs);
});

// 17. GET User Realtime Stream (Server-Sent Events)
app.get("/api/conversations/events", (req, res) => {
  const userId = (req.query.userId as string) || DEFAULT_USER_ID;

  res.status(200);
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();
  res.socket?.setKeepAlive(true);
  res.socket?.setTimeout(0);

  const client: UserStreamClient = { response: res };
  const clients = userStreams.get(userId) || new Set<UserStreamClient>();
  clients.add(client);
  userStreams.set(userId, clients);

  res.write("retry: 3000\n\n");
  res.write(`event: connected\ndata: ${JSON.stringify({ userId })}\n\n`);

  const heartbeat = setInterval(() => {
    if (!res.writableEnded) {
      try {
        res.write(`: keep-alive ${Date.now()}\n\n`);
      } catch {
        // The close handler below performs cleanup.
      }
    }
  }, 25_000);

  let cleanedUp = false;
  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    clearInterval(heartbeat);
    const currentClients = userStreams.get(userId);
    currentClients?.delete(client);
    if (currentClients && currentClients.size === 0) userStreams.delete(userId);
  };

  req.on("close", cleanup);
  res.on("close", cleanup);
});

// 18. GET Conversation Realtime Stream (Server-Sent Events)
app.get("/api/conversations/:id/events", (req, res) => {
  const { id } = req.params;
  const userId = (req.query.userId as string) || DEFAULT_USER_ID;
  const memoryConversation = memoryConversations.find((conversation) => conversation.id === id);

  // Avoid a database round-trip before opening the stream. The message POST
  // route still validates the sender against the persisted participants.
  if (
    memoryConversation &&
    memoryConversation.buyerId !== userId &&
    memoryConversation.sellerId !== userId
  ) {
    return res.status(403).json({ error: "You are not a participant in this conversation" });
  }

  res.status(200);
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();
  res.socket?.setKeepAlive(true);
  res.socket?.setTimeout(0);

  const client: ConversationStreamClient = { userId, response: res };
  const clients = conversationStreams.get(id) || new Set<ConversationStreamClient>();
  clients.add(client);
  conversationStreams.set(id, clients);

  // Tell EventSource how quickly to reconnect after a temporary disconnect.
  res.write("retry: 3000\n\n");
  res.write(`event: connected\ndata: ${JSON.stringify({ conversationId: id })}\n\n`);

  // Proxies and load balancers may close idle streams; keep them alive.
  const heartbeat = setInterval(() => {
    if (!res.writableEnded) {
      try {
        res.write(`: keep-alive ${Date.now()}\n\n`);
      } catch {
        // The close handler below performs cleanup.
      }
    }
  }, 25_000);

  let cleanedUp = false;
  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    clearInterval(heartbeat);
    const currentClients = conversationStreams.get(id);
    currentClients?.delete(client);
    if (currentClients && currentClients.size === 0) conversationStreams.delete(id);
  };

  req.on("close", cleanup);
  res.on("close", cleanup);
});

// 18. POST Open Conversation
app.post("/api/conversations", async (req, res) => {
  const { listingId, buyerId = DEFAULT_USER_ID } = req.body;
  // Try DB for full listing+seller, fallback to memory
  let sellerId: string | null = null;
  let listing: any = null;
  const full = await safeDbQuery(
    `SELECT l.*, u.name as seller_name, u.avatar as seller_avatar
     FROM listings l JOIN users u ON l.seller_id = u.id
     WHERE l.id = $1`,
    [listingId]
  );
  if (full && full.rows.length > 0) {
    const row = full.rows[0];
    sellerId = row.seller_id;
    listing = {
      plantName: row.plant_name,
      image: row.image,
      price: row.price,
      seller: { id: row.seller_id, name: row.seller_name, avatar: row.seller_avatar },
      sellerId: row.seller_id,
    };
  } else {
    // Fallback simple seller_id lookup then memory listing
    const listingDb = await safeDbQuery("SELECT seller_id FROM listings WHERE id = $1", [listingId]);
    if (listingDb && listingDb.rows.length > 0) sellerId = listingDb.rows[0].seller_id;
    const mem = memoryListings.find((l) => l.id === listingId) || memoryListings[0];
    if (!sellerId) sellerId = mem.sellerId;
    // If DB seller exists but listing not fully joined, fetch seller user
    let sellerName = mem.seller.name;
    let sellerAvatar = mem.seller.avatar;
    if (sellerId) {
      const sellerRes = await safeDbQuery("SELECT name, avatar FROM users WHERE id = $1", [sellerId]);
      if (sellerRes && sellerRes.rows.length > 0) {
        sellerName = sellerRes.rows[0].name;
        sellerAvatar = sellerRes.rows[0].avatar;
      } else if (memoryUsers[sellerId]) {
        sellerName = memoryUsers[sellerId].name;
        sellerAvatar = memoryUsers[sellerId].avatar;
      }
    }
    listing = {
      plantName: mem.plantName,
      image: mem.image,
      price: mem.price,
      seller: { id: sellerId!, name: sellerName, avatar: sellerAvatar },
      sellerId: sellerId!,
    };
  }
  // Prevent buyer == seller
  if (buyerId === sellerId) {
    return res.status(400).json({ error: "Cannot message own listing" });
  }

  const convId = "conv_" + Date.now();
  await safeDbQuery(
    "INSERT INTO conversations (id, listing_id, buyer_id, seller_id, updated_at, created_at) VALUES ($1, $2, $3, $4, NOW(), NOW())",
    [convId, listingId, buyerId, sellerId]
  );

  const greetingText = `Hi! I'm interested in your ${listing.plantName}. Is it still available?`;
  const greetingId = "m_" + Date.now();
  const greetingCreatedAt = new Date().toISOString();
  await safeDbQuery(
    "INSERT INTO messages (id, conversation_id, sender_id, text, created_at) VALUES ($1, $2, $3, $4, NOW())",
    [greetingId, convId, buyerId, greetingText]
  );

  const newConv = {
    id: convId,
    listingId,
    listing: listing.plantName,
    listingImage: listing.image,
    listingPrice: listing.price,
    sellerId: sellerId!,
    buyerId,
    otherParty: {
      id: sellerId!,
      name: listing.seller.name,
      avatar: listing.seller.avatar,
    },
    lastMessage: greetingText,
    time: formatDhakaTime(greetingCreatedAt),
    unread: 0,
    messages: [
      {
        id: greetingId,
        role: "user" as const,
        senderId: buyerId,
        text: greetingText,
        time: formatDhakaTime(greetingCreatedAt),
        createdAt: greetingCreatedAt,
      },
    ],
  };

  memoryConversations.unshift(newConv);
  res.status(201).json(newConv);
});

// 19. POST Send Message in Conversation
app.post("/api/conversations/:id/messages", async (req, res) => {
  const { id } = req.params;
  const { text, senderId = DEFAULT_USER_ID } = req.body;
  const messageText = String(text || "").trim();

  if (!messageText) {
    return res.status(400).json({ error: "Message text is required" });
  }

  const participants = await getConversationParticipants(id);
  if (
    participants &&
    senderId !== participants.buyerId &&
    senderId !== participants.sellerId
  ) {
    return res.status(403).json({ error: "You are not a participant in this conversation" });
  }

  const msgId = "m_" + Date.now();
  const createdAt = new Date().toISOString();
  const messageTime = formatDhakaTime(createdAt);
  const message = {
    id: msgId,
    senderId,
    text: messageText,
    time: messageTime,
    createdAt,
  };

  await safeDbQuery(
    "INSERT INTO messages (id, conversation_id, sender_id, text, created_at) VALUES ($1, $2, $3, $4, NOW())",
    [msgId, id, senderId, messageText]
  );
  await safeDbQuery(
    "UPDATE conversations SET updated_at = NOW() WHERE id = $1",
    [id]
  );

  const memoryConversation = memoryConversations.find((c) => c.id === id);
  if (memoryConversation) {
    memoryConversation.lastMessage = messageText;
    memoryConversation.time = messageTime;
    memoryConversation.messages.push({
      ...message,
      role: "user" as const,
    });
  }

  // Push the persisted message to every open chat and messages list immediately.
  const realtimeEvent = {
    type: "message",
    conversationId: id,
    message,
  };
  broadcastConversationEvent(id, realtimeEvent);
  const buyerIdForBroadcast = participants?.buyerId || memoryConversation?.buyerId;
  const sellerIdForBroadcast = participants?.sellerId || memoryConversation?.sellerId;
  if (buyerIdForBroadcast) broadcastUserEvent(buyerIdForBroadcast, realtimeEvent);
  if (sellerIdForBroadcast) broadcastUserEvent(sellerIdForBroadcast, realtimeEvent);

  // Incoming messages are now delivered only through the realtime stream.
  // No simulated automatic reply is generated.

  res.json({
    id: msgId,
    conversationId: id,
    senderId,
    text: messageText,
    time: messageTime,
    createdAt,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// VITE MIDDLEWARE & SERVER STARTUP
// ─────────────────────────────────────────────────────────────────────────────

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
