import React from "react";
import { Camera, Sparkles, Bell, ArrowRight, Droplets, ChevronRight, AlertCircle, ShoppingBag } from "lucide-react";
import { NavProps, Plant, Conversation, UserProfile } from "../types";
import { StatusPill } from "./Common";

export function HomeScreen({
  navigate,
  plants,
  conversations,
  user,
}: {
  navigate: NavProps["navigate"];
  plants: Plant[];
  conversations: Conversation[];
  user: UserProfile | null;
}) {
  const attentionPlants = plants.filter((p) => p.status !== "healthy");
  const healthyCount = plants.filter((p) => p.status === "healthy").length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 space-y-7">
      {/* Header greeting */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Welcome back</p>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-slate-900 mt-0.5">
            {user?.name || "Emma"} 🌿
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-3.5 py-1.5 rounded-full text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Cloud SQL Synced
          </div>
          <button
            onClick={() => navigate("messages")}
            className="relative p-2.5 rounded-full bg-white border border-slate-200 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <Bell size={18} className="text-slate-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full" />
          </button>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs">
          <p className="text-slate-400 text-xs font-medium">Total Plants</p>
          <p className="font-serif text-2xl font-bold text-slate-800 mt-0.5">{plants.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs">
          <p className="text-slate-400 text-xs font-medium">Thriving</p>
          <p className="font-serif text-2xl font-bold text-emerald-600 mt-0.5">{healthyCount}</p>
        </div>
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs">
          <p className="text-slate-400 text-xs font-medium">Needs Water</p>
          <p className={`font-serif text-2xl font-bold mt-0.5 ${attentionPlants.length > 0 ? "text-amber-600" : "text-slate-800"}`}>
            {attentionPlants.length}
          </p>
        </div>
      </div>

      {/* Hero Quick action buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <button
          onClick={() => navigate("identify")}
          className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl p-5 text-left transition-all group shadow-sm shadow-emerald-700/20 relative overflow-hidden"
        >
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Camera size={20} className="text-white" />
            </div>
            <p className="font-bold text-lg">AI Plant Lens</p>
            <p className="text-emerald-100/85 text-xs mt-0.5">Identify species or diagnose leaf diseases</p>
          </div>
          <div className="absolute right-3 bottom-3 opacity-15">
            <Camera size={70} />
          </div>
        </button>

        <button
          onClick={() => navigate("ivy")}
          className="bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-900 rounded-2xl p-5 text-left transition-all group shadow-xs relative overflow-hidden"
        >
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Sparkles size={20} className="text-purple-600" />
            </div>
            <p className="font-bold text-lg">Ask Flora Botanist</p>
            <p className="text-slate-500 text-xs mt-0.5">Instant AI diagnosis, repotting & light advice</p>
          </div>
          <div className="absolute right-3 bottom-3 opacity-10 text-purple-600">
            <Sparkles size={70} />
          </div>
        </button>
      </div>

      {/* Plants needing attention */}
      {attentionPlants.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-500" />
              <h2 className="font-serif text-lg font-bold text-slate-900">Needs Attention ({attentionPlants.length})</h2>
            </div>
            <button
              onClick={() => navigate("garden")}
              className="text-emerald-700 text-xs font-semibold hover:underline flex items-center gap-0.5"
            >
              View all <ChevronRight size={14} />
            </button>
          </div>

          <div className="flex gap-3.5 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
            {attentionPlants.map((plant) => (
              <button
                key={plant.id}
                onClick={() => navigate("plant-detail", { plantId: plant.id })}
                className="shrink-0 w-44 bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-md transition-all text-left group"
              >
                <div className="aspect-square bg-slate-100 overflow-hidden relative">
                  <img
                    src={plant.image}
                    alt={plant.nickname}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 right-2.5">
                    <StatusPill status={plant.status} />
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-serif font-bold text-slate-900 text-sm truncate">{plant.nickname}</p>
                  <p className="text-slate-500 text-xs italic truncate mt-0.5">{plant.species}</p>
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1 text-blue-600 font-medium">
                      <Droplets size={12} />
                      Every {plant.wateringFrequency}d
                    </span>
                    <span>Tap to log</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent community messages */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-slate-900">Recent Marketplace Conversations</h2>
          <button
            onClick={() => navigate("messages")}
            className="text-emerald-700 text-xs font-semibold hover:underline flex items-center gap-0.5"
          >
            All messages <ChevronRight size={14} />
          </button>
        </div>

        {conversations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-6 text-center">
            <ShoppingBag size={24} className="mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-medium text-slate-700">No active conversations</p>
            <p className="text-xs text-slate-500 mt-1">Explore the Marketplace to connect with local plant parents.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {conversations.slice(0, 2).map((msg) => (
              <button
                key={msg.id}
                onClick={() => navigate("conversation", { conversationId: msg.id })}
                className="w-full bg-white border border-slate-200/80 rounded-2xl p-3.5 flex items-center gap-3.5 hover:shadow-xs transition-all text-left"
              >
                <div className="w-11 h-11 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                  <img src={msg.otherParty.avatar} alt={msg.otherParty.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900">{msg.otherParty.name}</p>
                    <p className="text-xs text-slate-400">{msg.time}</p>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    <span className="font-medium text-emerald-700">{msg.listing}</span> · {msg.lastMessage}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Flora Tip of the day */}
      <div className="bg-gradient-to-br from-emerald-50/70 to-teal-50/40 border border-emerald-100 rounded-2xl p-4.5">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Flora’s Botanical Tip</p>
            <p className="text-sm text-slate-700 font-serif italic mt-1 leading-relaxed">
              "Never let Peace Lilies or Fiddle Leaf Figs sit in stagnant water trays. Root rot starts silently in waterlogged soil long before symptoms show on the leaves."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
