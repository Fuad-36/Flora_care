import React from "react";
import { Home, Leaf, Sparkles, ShoppingBag, MessageCircle, Camera, Bell } from "lucide-react";
import { NavProps, Screen, UserProfile } from "../types";

export function DesktopNav({
  screen,
  navigate,
  user,
}: NavProps & { user?: UserProfile | null }) {
  const links: { label: string; s: Screen; icon: React.ReactNode }[] = [
    { label: "Home", s: "home", icon: <Home size={15} /> },
    { label: "My Garden", s: "garden", icon: <Leaf size={15} /> },
    { label: "Scan & Diagnose", s: "identify", icon: <Camera size={15} /> },
    { label: "Ask Flora AI", s: "ivy", icon: <Sparkles size={15} /> },
    { label: "Marketplace", s: "marketplace", icon: <ShoppingBag size={15} /> },
    { label: "Messages", s: "messages", icon: <MessageCircle size={15} /> },
  ];

  return (
    <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 h-16 items-center px-8 gap-4">
      <button onClick={() => navigate("home")} className="flex items-center gap-2.5 mr-6 group">
        <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
          <Leaf size={16} className="text-white" />
        </div>
        <span className="font-serif font-bold text-slate-900 text-xl tracking-tight">Floracare</span>
      </button>

      <div className="flex items-center gap-1.5 flex-1">
        {links.map((link) => (
          <button
            key={link.s}
            onClick={() => navigate(link.s)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
              screen === link.s
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
            }`}
          >
            {link.icon}
            {link.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("messages")}
          className="relative p-2.5 rounded-full hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
          title="Notifications & Messages"
        >
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full" />
        </button>

        <button
          onClick={() => navigate("profile")}
          className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full hover:bg-slate-100 transition-colors border border-slate-200"
        >
          <div className="w-7 h-7 rounded-full bg-emerald-100 overflow-hidden border border-emerald-300 shrink-0">
            <img
              src={user?.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&auto=format"}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-xs font-semibold text-slate-700 max-w-[90px] truncate">
            {user?.name || "Emma"}
          </span>
        </button>
      </div>
    </nav>
  );
}

export function MobileNav({ screen, navigate }: NavProps) {
  const tabs: { label: string; s: Screen; icon: typeof Home }[] = [
    { label: "Home", s: "home", icon: Home },
    { label: "Garden", s: "garden", icon: Leaf },
    { label: "Scan", s: "identify", icon: Camera },
    { label: "Market", s: "marketplace", icon: ShoppingBag },
    { label: "Flora AI", s: "ivy", icon: Sparkles },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 shadow-lg">
      <div className="flex items-center justify-around px-2 py-1.5">
        {tabs.map((tab, i) => {
          const Icon = tab.icon;
          const isCenter = i === 2;
          const isActive = screen === tab.s;

          if (isCenter) {
            return (
              <button
                key={tab.s}
                onClick={() => navigate(tab.s)}
                className="flex flex-col items-center -mt-6 group"
              >
                <div className="w-13 h-13 rounded-full bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/30 border-4 border-white group-hover:scale-105 transition-transform">
                  <Camera size={20} className="text-white" />
                </div>
                <span className="text-[11px] mt-0.5 text-emerald-700 font-bold">Scan</span>
              </button>
            );
          }

          return (
            <button
              key={tab.s}
              onClick={() => navigate(tab.s)}
              className={`flex flex-col items-center py-1.5 px-3 transition-colors ${
                isActive ? "text-emerald-700 font-semibold" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon size={19} />
              <span className="text-[11px] mt-1">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
