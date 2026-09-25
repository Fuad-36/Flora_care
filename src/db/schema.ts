import { pgTable, text, timestamp, integer, boolean, uuid, doublePrecision } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  avatar: text("avatar"),
  bio: text("bio"),
  location: text("location").default("New York, NY"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const plants = pgTable("plants", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  nickname: text("nickname").notNull(),
  species: text("species").notNull(),
  scientificName: text("scientific_name"),
  status: text("status").notNull().default("healthy"), // 'healthy' | 'due-soon' | 'overdue'
  image: text("image").notNull(),
  wateringFrequency: integer("watering_frequency").notNull().default(7),
  lastWatered: timestamp("last_watered").defaultNow().notNull(),
  notes: text("notes").default(""),
  sunlight: text("sunlight").default("Bright indirect light"),
  soil: text("soil").default("Well-draining mix"),
  temperature: text("temperature").default("65–85°F (18–29°C)"),
  humidity: text("humidity").default("Medium to High (50-70%)"),
  fertilizer: text("fertilizer").default("Monthly during growing season"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const careLogs = pgTable("care_logs", {
  id: text("id").primaryKey(),
  plantId: text("plant_id").notNull().references(() => plants.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'water' | 'fertilize' | 'prune' | 'repot' | 'mist' | 'diagnosis'
  notes: text("notes"),
  loggedAt: timestamp("logged_at").defaultNow().notNull(),
});

export const diagnoses = pgTable("diagnoses", {
  id: text("id").primaryKey(),
  plantId: text("plant_id").references(() => plants.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  issue: text("issue").notNull(),
  scientificIssue: text("scientific_issue"),
  confidence: text("confidence").default("High Confidence Match"),
  description: text("description").notNull(),
  organicTreatment: text("organic_treatment").notNull(),
  chemicalTreatment: text("chemical_treatment").notNull(),
  imageUrl: text("image_url"),
  date: timestamp("date").defaultNow().notNull(),
});

export const listings = pgTable("listings", {
  id: text("id").primaryKey(),
  sellerId: text("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  plantName: text("plant_name").notNull(),
  species: text("species").notNull(),
  price: doublePrecision("price").notNull(),
  area: text("area").notNull(),
  image: text("image").notNull(),
  description: text("description").notNull(),
  available: boolean("available").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const conversations = pgTable("conversations", {
  id: text("id").primaryKey(),
  listingId: text("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  buyerId: text("buyer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sellerId: text("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: text("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ivyMessages = pgTable("ivy_messages", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // 'user' | 'ivy'
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
