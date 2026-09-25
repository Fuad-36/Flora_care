import { Status } from "./types";

function getStoredUserId(): string | null {
  try {
    const saved = localStorage.getItem("verdant_user");
    if (saved) return JSON.parse(saved).id || null;
  } catch {}
  return null;
}
function getStoredUser(): any | null {
  try {
    const saved = localStorage.getItem("verdant_user");
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
}

export async function fetchUser(userId?: string) {
  const uid = userId || getStoredUserId();
  const url = uid ? `/api/user?userId=${encodeURIComponent(uid)}` : "/api/user";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json();
}

export async function loginUser(
  email: string,
  name?: string,
  mode: "login" | "signup" = "login"
) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name, mode }),
  });
  if (!res.ok) {
    let message = mode === "signup" ? "Failed to create account" : "Failed to log in";
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {}
    throw new Error(message);
  }
  return res.json();
}

export async function fetchPlants(userId?: string) {
  const uid = userId || getStoredUserId();
  const url = uid ? `/api/plants?userId=${encodeURIComponent(uid)}` : "/api/plants";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch plants");
  return res.json();
}

export async function fetchPlantDetail(id: string) {
  const res = await fetch(`/api/plants/${id}`);
  if (!res.ok) throw new Error("Failed to fetch plant detail");
  return res.json();
}

export async function createPlant(plantData: any) {
  const uid = getStoredUserId();
  const payload = uid ? { ...plantData, userId: plantData.userId || uid } : plantData;
  const res = await fetch("/api/plants", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create plant");
  return res.json();
}

export async function logPlantCare(plantId: string, type: string, notes?: string) {
  const res = await fetch(`/api/plants/${plantId}/care`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, notes }),
  });
  if (!res.ok) throw new Error("Failed to log care");
  return res.json();
}

export async function updatePlant(plantId: string, data: any) {
  const res = await fetch(`/api/plants/${plantId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update plant");
  return res.json();
}

export async function deletePlant(plantId: string) {
  const res = await fetch(`/api/plants/${plantId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete plant");
  return res.json();
}

export async function scanPlantWithAI(mode: "identify" | "diagnose", imageBase64?: string, plantContext?: string) {
  const res = await fetch("/api/ai/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode, imageBase64, plantContext }),
  });
  if (!res.ok) throw new Error("Failed to scan plant");
  return res.json();
}

export async function saveDiagnosisToDb(diagnosisData: any) {
  const uid = getStoredUserId();
  const payload = uid ? { ...diagnosisData, userId: diagnosisData.userId || uid } : diagnosisData;
  const res = await fetch("/api/diagnoses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to save diagnosis");
  return res.json();
}

export async function sendIvyMessage(message: string, history: any[]) {
  const uid = getStoredUserId();
  const res = await fetch("/api/ivy/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history, userId: uid }),
  });
  if (!res.ok) throw new Error("Failed to communicate with Flora");
  return res.json();
}

export async function fetchIvyHistory() {
  const uid = getStoredUserId();
  const url = uid ? `/api/ivy/history?userId=${encodeURIComponent(uid)}` : "/api/ivy/history";
  const res = await fetch(url);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchListings(search?: string) {
  const url = search ? `/api/listings?search=${encodeURIComponent(search)}` : "/api/listings";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch listings");
  return res.json();
}

export async function fetchListingDetail(id: string) {
  const res = await fetch(`/api/listings/${id}`);
  if (!res.ok) throw new Error("Failed to fetch listing");
  return res.json();
}

export async function createListing(listingData: any) {
  const uid = getStoredUserId();
  const payload = uid ? { ...listingData, sellerId: listingData.sellerId || uid } : listingData;
  const res = await fetch("/api/listings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create listing");
  return res.json();
}

export async function fetchConversations(userId?: string) {
  const uid = userId || getStoredUserId();
  const url = uid ? `/api/conversations?userId=${encodeURIComponent(uid)}` : "/api/conversations";
  // Realtime refreshes must not be satisfied from the browser cache.
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch conversations");
  return res.json();
}

export async function openConversation(listingId: string, buyerId?: string) {
  const uid = buyerId || getStoredUserId();
  const res = await fetch("/api/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ listingId, buyerId: uid }),
  });
  if (!res.ok) {
    let msg = "Failed to open conversation";
    try { const body = await res.json(); if (body?.error) msg = body.error; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export async function sendDirectMessage(conversationId: string, text: string, senderId?: string) {
  const uid = senderId || getStoredUserId();
  const res = await fetch(`/api/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, senderId: uid }),
  });
  if (!res.ok) throw new Error("Failed to send message");
  return res.json();
}
