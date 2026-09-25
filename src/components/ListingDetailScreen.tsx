import React, { useState } from "react";
import { ChevronLeft, MapPin, Clock, Star, MessageCircle, Info, ShieldCheck } from "lucide-react";
import { NavProps, Listing } from "../types";
import { CareGuide } from "./Common";
import { openConversation } from "../api";

export function ListingDetailScreen({
  navigate,
  listing,
  userId,
  onRefreshConversations,
}: {
  navigate: NavProps["navigate"];
  listing: Listing;
  userId: string;
  onRefreshConversations: () => void;
}) {
  const [openingChat, setOpeningChat] = useState(false);
  const currentUserId = userId;
  const isOwnListing = Boolean(currentUserId && listing.sellerId === currentUserId);

  const handleMessageSeller = async () => {
    try {
      setOpeningChat(true);
      const conv = await openConversation(listing.id, currentUserId);
      // Refresh list in background but immediately navigate with returned object to avoid blank screen (stale conversations closure)
      onRefreshConversations();
      navigate("conversation", { conversationId: conv.id, conversation: conv });
    } catch (e: any) {
      console.error(e);
      // Self-messaging guard from server
      if (e.message?.includes("own listing") || String(e).includes("own listing")) {
        alert("You cannot message your own listing.");
        return;
      }
      navigate("messages");
    } finally {
      setOpeningChat(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-12">
      {/* Photo header */}
      <div className="relative aspect-square sm:aspect-[16/10] bg-slate-900 overflow-hidden sm:rounded-b-3xl">
        <img src={listing.image} alt={listing.plantName} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <button
          onClick={() => navigate("marketplace")}
          className="absolute top-4 left-4 bg-black/40 backdrop-blur-md text-white p-2.5 rounded-full hover:bg-black/60 transition-colors z-10"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
          <div>
            <span className="bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
              Available for Pickup
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1.5">
              {listing.plantName}
            </h1>
            <p className="font-serif italic text-emerald-200 text-xs sm:text-sm">{listing.species}</p>
          </div>
          <div className="text-right">
            <span className="text-2xl sm:text-3xl font-bold text-white">৳{listing.price}</span>
            <p className="text-[11px] text-slate-300">Cash or Trade</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* Meta Info */}
        <div className="flex items-center gap-4 text-xs text-slate-500 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="flex items-center gap-1.5 font-medium text-slate-700">
            <MapPin size={15} className="text-emerald-700" />
            {listing.area}
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1.5">
            <Clock size={15} className="text-slate-400" />
            Listed on {listing.date || "recent"}
          </span>
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-xs space-y-2">
          <h2 className="font-semibold text-slate-900 text-sm">Plant Condition & Details</h2>
          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
            {listing.description}
          </p>
        </div>

        {/* Seller profile card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4.5 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
              <img
                src={listing.seller?.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&auto=format"}
                alt={listing.seller?.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">{listing.seller?.name || "Community Member"}</p>
              <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                <Star size={13} className="text-amber-400 fill-amber-400" />
                <span className="font-semibold text-slate-700">{listing.seller?.rating || 4.9}</span>
                <span className="text-slate-400">• Verified Green Thumb</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold border border-emerald-100">
            <ShieldCheck size={13} />
            Verified
          </div>
        </div>

        {/* Plant Care reference */}
        <CareGuide />

        {/* Notice */}
        <div className="flex items-start gap-2.5 bg-slate-100/80 rounded-2xl p-4 text-xs text-slate-600">
          <Info size={16} className="text-slate-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Floracare connects local plant hobbyists without transaction fees. Meet in public plant shops, cafes, or community gardens for plant inspections.
          </p>
        </div>

        {/* Message Seller CTA */}
        <button
          onClick={handleMessageSeller}
          disabled={openingChat || isOwnListing}
          title={isOwnListing ? "You cannot message your own listing" : undefined}
          className={`w-full py-4 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${isOwnListing ? "bg-slate-200 text-slate-500 cursor-not-allowed shadow-none" : "bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white shadow-emerald-700/20"}`}
        >
          <MessageCircle size={18} />
          {isOwnListing ? "This is your listing" : openingChat ? "Connecting to Seller..." : "Message Seller (Direct Chat)"}
        </button>
      </div>
    </div>
  );
}
