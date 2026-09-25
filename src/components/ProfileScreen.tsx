import React from "react";
import { User, Bell, Settings, Leaf, Package, LogOut, ChevronRight, MapPin, Database } from "lucide-react";
import { NavProps, UserProfile, Plant } from "../types";

export function ProfileScreen({
  navigate,
  user,
  plants,
  onLogout,
}: {
  navigate: NavProps["navigate"];
  user: UserProfile | null;
  plants: Plant[];
  onLogout: () => void;
}) {
  const sections = [
    {
      title: "Botanical Space",
      items: [
        { icon: Leaf, label: "My Garden Plant Collection", onClick: () => navigate("garden") },
        { icon: Package, label: "Marketplace Listings", onClick: () => navigate("marketplace") },
      ],
    },
    {
      title: "Settings & Cloud Sync",
      items: [
        { icon: Database, label: "PostgreSQL Database Health", onClick: () => {} },
        { icon: Bell, label: "Watering Reminders & Push Alerts", onClick: () => {} },
        { icon: Settings, label: "Climate & Hardiness Zone", onClick: () => {} },
      ],
    },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 py-6 md:py-8 space-y-6">
      {/* Profile Card */}
      <div className="flex flex-col items-center text-center bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div className="relative w-22 h-22 rounded-full overflow-hidden border-4 border-emerald-100 shadow-md mb-3">
          <img
            src={user?.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&auto=format"}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        </div>

        <h1 className="font-serif text-xl font-bold text-slate-900">{user?.name || "Emma Hartwell"}</h1>
        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 justify-center">
          <MapPin size={12} className="text-slate-400" />
          {user?.location || "Brooklyn, NY"} • Zone 7b
        </p>
        <p className="text-xs text-slate-600 max-w-xs mt-2 italic">
          "{user?.bio || "Passionate urban jungle collector & rare aroid lover"}"
        </p>

        <div className="flex items-center gap-1 mt-3 text-[11px] bg-emerald-50 text-emerald-800 font-semibold px-3 py-1 rounded-full border border-emerald-200/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Cloud SQL Connected
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 text-center shadow-xs">
          <p className="font-serif text-xl font-bold text-slate-900">{plants.length}</p>
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Plants</p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 text-center shadow-xs">
          <p className="font-serif text-xl font-bold text-emerald-700">
            {plants.filter((p) => p.status === "healthy").length}
          </p>
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Healthy</p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 text-center shadow-xs">
          <p className="font-serif text-xl font-bold text-slate-900">4</p>
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Traded</p>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="space-y-4">
        {sections.map((sec) => (
          <div key={sec.title} className="space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
              {sec.title}
            </p>
            <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs divide-y divide-slate-100">
              {sec.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                        <Icon size={16} />
                      </div>
                      <span className="text-xs font-semibold text-slate-800">{item.label}</span>
                    </div>
                    <ChevronRight size={14} className="text-slate-400" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 p-4 bg-rose-50 hover:bg-rose-100/80 text-rose-700 rounded-2xl text-xs font-bold transition-colors border border-rose-100"
        >
          <LogOut size={16} />
          Sign Out of Floracare
        </button>
      </div>
    </div>
  );
}
