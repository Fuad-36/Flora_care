import React, { useState, useEffect, useRef } from "react";
import { Screen, Plant, Listing, Conversation, ScanMode, UserProfile } from "./types";
import { DesktopNav, MobileNav } from "./components/Navigation";
import { HomeScreen } from "./components/HomeScreen";
import { GardenScreen } from "./components/GardenScreen";
import { PlantDetailScreen } from "./components/PlantDetailScreen";
import { AddPlantScreen } from "./components/AddPlantScreen";
import { ScanScreen } from "./components/ScanScreen";
import { IvyScreen } from "./components/IvyScreen";
import { MarketplaceScreen } from "./components/MarketplaceScreen";
import { ListingDetailScreen } from "./components/ListingDetailScreen";
import { CreateListingScreen } from "./components/CreateListingScreen";
import { MessagesScreen, ConversationScreen } from "./components/MessagesScreen";
import { ProfileScreen } from "./components/ProfileScreen";
import { LandingScreen, AuthScreens } from "./components/LandingAndAuth";
import { LoadingSpinner } from "./components/Common";
import {
  fetchUser,
  fetchPlants,
  fetchPlantDetail,
  fetchListings,
  fetchListingDetail,
  fetchConversations,
} from "./api";

function readStoredUser(): UserProfile | null {
  try {
    const saved = localStorage.getItem("verdant_user");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function hasValidStoredSession(): boolean {
  return localStorage.getItem("verdant_authenticated") === "true" && !!readStoredUser();
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(() => {
    return hasValidStoredSession() ? "home" : "landing";
  });
  const [user, setUser] = useState<UserProfile | null>(() => readStoredUser());
  const authenticatedRef = useRef<boolean>(hasValidStoredSession());
  const [plants, setPlants] = useState<Plant[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedPlant, setSelectedPlant] = useState<any | null>(null);
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [scanMode, setScanMode] = useState<ScanMode>("identify");
  const [scanPrefilledPlantId, setScanPrefilledPlantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Initial load from backend API — use stored user id to avoid reverting to Emma
  useEffect(() => {
    if (authenticatedRef.current) {
      void loadAppData();
    } else {
      setLoading(false);
    }
  }, []);

  const loadAppData = async (activeUserId?: string) => {
    try {
      setLoading(true);
      const storedId = (() => {
        try {
          const s = localStorage.getItem("verdant_user");
          return s ? JSON.parse(s).id : null;
        } catch { return null; }
      })();
      const requestUserId = activeUserId || user?.id || storedId;

      const [userData, plantsData, listingsData, convsData] = await Promise.all([
        (requestUserId ? fetchUser(requestUserId) : fetchUser()).catch(() => null),
        (requestUserId ? fetchPlants(requestUserId) : fetchPlants()).catch(() => []),
        fetchListings().catch(() => []),
        (requestUserId ? fetchConversations(requestUserId) : fetchConversations()).catch(() => []),
      ]);

      if (userData && (!requestUserId || userData.id === requestUserId)) {
        setUser(userData);
        localStorage.setItem("verdant_user", JSON.stringify(userData));
      }
      if (plantsData) setPlants(plantsData);
      if (listingsData) setListings(listingsData);
      if (convsData) setConversations(convsData);
    } catch (err) {
      console.error("Error loading app data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (authenticatedUser: UserProfile) => {
    authenticatedRef.current = true;
    setUser(authenticatedUser);
    localStorage.setItem("verdant_authenticated", "true");
    localStorage.setItem("verdant_user", JSON.stringify(authenticatedUser));
    setScreen("home");
    setSelectedPlant(null);
    setSelectedListing(null);
    setSelectedConversation(null);
    setPlants([]);
    setConversations([]);
    void loadAppData(authenticatedUser.id);
  };

  const navigate = async (
    s: Screen,
    opts?: {
      plantId?: string;
      listingId?: string;
      scanMode?: ScanMode;
      diagnosePlantId?: string;
      conversationId?: string;
      conversation?: Conversation;
    }
  ) => {
    const isPublicScreen = s === "landing" || s === "login" || s === "signup";
    if (!authenticatedRef.current && !isPublicScreen) {
      setScreen("signup");
      setToast("You don't have an account yet. Please sign up to access Floracare.");
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }

    setScreen(s);

    if (opts?.plantId) {
      try {
        const detail = await fetchPlantDetail(opts.plantId);
        setSelectedPlant(detail);
      } catch (e) {
        console.error(e);
      }
    }

    if (opts?.listingId) {
      try {
        const detail = await fetchListingDetail(opts.listingId);
        setSelectedListing(detail);
      } catch (e) {
        console.error(e);
      }
    }

    if (opts?.conversation || opts?.conversationId) {
      // Direct object passed from ListingDetailScreen avoids stale-closure blank screen
      if (opts?.conversation) {
        setSelectedConversation(opts.conversation);
        // Also merge into conversations list if not present
        setConversations((prev) => (prev.find((c) => c.id === opts.conversation!.id) ? prev : [opts.conversation!, ...prev]));
      } else if (opts?.conversationId) {
        let conv = conversations.find((c) => c.id === opts.conversationId);
        if (conv) {
          setSelectedConversation(conv);
        } else {
          // Fallback: fetch fresh conversations (fixes blank screen when new conv not yet in state)
          try {
            const uid = user?.id || (() => { try { return JSON.parse(localStorage.getItem("verdant_user") || "null")?.id; } catch { return null; } })();
            const fresh = await (uid ? fetchConversations(uid) : fetchConversations());
            setConversations(fresh);
            const found = fresh.find((c: Conversation) => c.id === opts.conversationId);
            if (found) setSelectedConversation(found);
            else console.warn("[Navigation] Conversation not found after refresh", opts.conversationId);
          } catch (e) {
            console.error("[Navigation] Failed to load conversation", e);
          }
        }
      }
    }

    if (s === "identify") {
      setScanMode(opts?.scanMode ?? "identify");
      setScanPrefilledPlantId(opts?.diagnosePlantId ?? null);
    }

    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const handleRefreshPlants = async () => {
    try {
      const uid = user?.id || (()=>{ try{ return JSON.parse(localStorage.getItem("verdant_user")||"null")?.id } catch{return null}})();
      const data = await (uid ? fetchPlants(uid) : fetchPlants());
      setPlants(data);
      if (selectedPlant) {
        const detail = await fetchPlantDetail(selectedPlant.id);
        setSelectedPlant(detail);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRefreshListings = async () => {
    try {
      const data = await fetchListings();
      setListings(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRefreshConversations = async () => {
    try {
      const uid = user?.id || (()=>{ try{ return JSON.parse(localStorage.getItem("verdant_user")||"null")?.id } catch{return null}})();
      const data = await (uid ? fetchConversations(uid) : fetchConversations());
      setConversations(data);
      if (selectedConversation) {
        const updated = data.find((c: Conversation) => c.id === selectedConversation.id);
        if (updated) setSelectedConversation(updated);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isAuth = screen === "landing" || screen === "login" || screen === "signup";

  return (
    <div className="min-h-screen bg-[#f9faf7] text-slate-800 font-sans">
      {!isAuth && <DesktopNav screen={screen} navigate={navigate} user={user} />}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-4 right-4 z-[100] max-w-sm rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900 shadow-lg"
        >
          <div className="flex items-start gap-3">
            <span>{toast}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="Dismiss notification"
              className="text-amber-700 hover:text-amber-950"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <main className={!isAuth ? "md:pt-16 pb-24 md:pb-8" : ""}>
        {loading && !isAuth && plants.length === 0 ? (
          <LoadingSpinner message="Connecting to PostgreSQL database..." />
        ) : (
          <>
            {screen === "landing" && <LandingScreen navigate={navigate} />}
            {screen === "login" && (
              <AuthScreens
                mode="login"
                navigate={navigate}
                onAuthSuccess={handleAuthSuccess}
                onAuthError={(message) => setToast(message)}
              />
            )}
            {screen === "signup" && (
              <AuthScreens
                mode="signup"
                navigate={navigate}
                onAuthSuccess={handleAuthSuccess}
                onAuthError={(message) => setToast(message)}
              />
            )}

            {screen === "home" && (
              <HomeScreen
                navigate={navigate}
                plants={plants}
                conversations={conversations}
                user={user}
              />
            )}

            {screen === "garden" && (
              <GardenScreen navigate={navigate} plants={plants} />
            )}

            {screen === "plant-detail" && selectedPlant && (
              <PlantDetailScreen
                navigate={navigate}
                plant={selectedPlant}
                onRefresh={handleRefreshPlants}
              />
            )}

            {screen === "add-plant" && (
              <AddPlantScreen navigate={navigate} onPlantAdded={handleRefreshPlants} />
            )}

            {screen === "identify" && (
              <ScanScreen
                key={`${scanMode}-${scanPrefilledPlantId}`}
                navigate={navigate}
                initialMode={scanMode}
                prefilledPlantId={scanPrefilledPlantId}
                plants={plants}
                onDiagnosisSaved={handleRefreshPlants}
              />
            )}

            {screen === "ivy" && <IvyScreen navigate={navigate} />}

            {screen === "marketplace" && (
              <MarketplaceScreen
                navigate={navigate}
                listings={listings}
                onSearch={async (q) => {
                  const res = await fetchListings(q);
                  setListings(res);
                }}
              />
            )}

            {screen === "listing-detail" && selectedListing && (
              <ListingDetailScreen
                navigate={navigate}
                listing={selectedListing}
                userId={user?.id || ""}
                onRefreshConversations={handleRefreshConversations}
              />
            )}

            {screen === "create-listing" && (
              <CreateListingScreen
                navigate={navigate}
                plants={plants}
                onListingCreated={handleRefreshListings}
              />
            )}

            {screen === "messages" && (
              <MessagesScreen
                navigate={navigate}
                conversations={conversations}
                userId={user?.id || ""}
                onRefresh={handleRefreshConversations}
              />
            )}

            {screen === "conversation" && selectedConversation && (
              <ConversationScreen
                navigate={navigate}
                conversation={selectedConversation}
                userId={user?.id || ""}
                onRefresh={handleRefreshConversations}
              />
            )}
            {screen === "conversation" && !selectedConversation && (
              <div className="max-w-2xl mx-auto px-4 py-16 text-center">
                <LoadingSpinner message="Loading conversation..." />
                <button onClick={() => navigate("messages")} className="mt-4 text-xs font-semibold text-emerald-700 hover:underline">Back to messages</button>
              </div>
            )}

            {screen === "profile" && (
              <ProfileScreen
                navigate={navigate}
                user={user}
                plants={plants}
                onLogout={() => {
                  authenticatedRef.current = false;
                  localStorage.removeItem("verdant_authenticated");
                  localStorage.removeItem("verdant_user");
                  setUser(null);
                  setPlants([]);
                  setConversations([]);
                  setSelectedConversation(null);
                  navigate("landing");
                }}
              />
            )}
          </>
        )}
      </main>

      {!isAuth && <MobileNav screen={screen} navigate={navigate} />}
    </div>
  );
}
