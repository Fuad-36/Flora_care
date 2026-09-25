export type Status = "healthy" | "due-soon" | "overdue";

export interface Plant {
  id: string;
  userId: string;
  nickname: string;
  species: string;
  scientificName: string;
  status: Status;
  image: string;
  wateringFrequency: number;
  lastWatered: string; // ISO date string
  notes: string;
  sunlight: string;
  soil: string;
  temperature: string;
  humidity: string;
  fertilizer: string;
  createdAt: string;
}

export interface CareLogEntry {
  id: string;
  plantId: string;
  type: "water" | "fertilize" | "prune" | "repot" | "mist" | "diagnosis";
  notes?: string;
  loggedAt: string;
}

export interface DiagnosisEntry {
  id: string;
  plantId?: string;
  userId: string;
  issue: string;
  scientificIssue?: string;
  confidence: string;
  description: string;
  organicTreatment: string;
  chemicalTreatment: string;
  imageUrl?: string;
  date: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar: string;
  bio: string;
  location: string;
}

export interface Listing {
  id: string;
  sellerId: string;
  plantName: string;
  species: string;
  price: number;
  area: string;
  image: string;
  description: string;
  available: boolean;
  date?: string;
  createdAt: string;
  seller: {
    id: string;
    name: string;
    avatar: string;
    rating: number;
  };
}

export interface ConvMessage {
  id: string;
  role: "user" | "other" | "ivy";
  senderId: string;
  text: string;
  time: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  listingId: string;
  listing: string;
  listingImage: string;
  listingPrice: number;
  sellerId: string;
  buyerId: string;
  otherParty: {
    id: string;
    name: string;
    avatar: string;
  };
  lastMessage: string;
  time: string;
  unread: number;
  messages: ConvMessage[];
}

export type ScanMode = "identify" | "diagnose";

export type Screen =
  | "landing"
  | "login"
  | "signup"
  | "home"
  | "identify"
  | "garden"
  | "plant-detail"
  | "add-plant"
  | "ivy"
  | "marketplace"
  | "listing-detail"
  | "create-listing"
  | "messages"
  | "conversation"
  | "profile";

export interface NavProps {
  screen: Screen;
  navigate: (
    s: Screen,
    opts?: {
      plantId?: string;
      listingId?: string;
      scanMode?: ScanMode;
      diagnosePlantId?: string;
      conversationId?: string;
      conversation?: Conversation;
    }
  ) => void;
}
