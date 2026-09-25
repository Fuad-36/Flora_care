import React, { useState } from "react";
import { Sun, Droplets, Zap, Thermometer, Wind, Sparkles, ChevronUp, ChevronDown } from "lucide-react";
import { Status } from "../types";

export function StatusPill({ status }: { status: Status }) {
  const map = {
    healthy: { label: "Healthy", bg: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" },
    "due-soon": { label: "Due Soon", bg: "bg-amber-100 text-amber-800", dot: "bg-amber-500" },
    overdue: { label: "Overdue", bg: "bg-rose-100 text-rose-800", dot: "bg-rose-500" },
  }[status] || { label: "Healthy", bg: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${map.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${map.dot}`} />
      {map.label}
    </span>
  );
}

export function CareGuide({
  startOpen = false,
  customData,
}: {
  startOpen?: boolean;
  customData?: {
    sunlight?: string;
    water?: string;
    soil?: string;
    temperature?: string;
    humidity?: string;
    fertilizer?: string;
  };
}) {
  const [open, setOpen] = useState(startOpen);

  const items = [
    { icon: Sun, label: "Sunlight", value: customData?.sunlight || "Bright indirect light", color: "text-amber-500" },
    { icon: Droplets, label: "Water", value: customData?.water || "Every 7 days in summer", color: "text-blue-500" },
    { icon: Zap, label: "Soil", value: customData?.soil || "Well-draining mix", color: "text-yellow-600" },
    { icon: Thermometer, label: "Temperature", value: customData?.temperature || "65–85°F (18–29°C)", color: "text-rose-500" },
    { icon: Wind, label: "Humidity", value: customData?.humidity || "High, 60%+", color: "text-cyan-500" },
    { icon: Sparkles, label: "Fertilizer", value: customData?.fertilizer || "Monthly, spring & summer", color: "text-purple-500" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors"
      >
        <span className="font-semibold text-slate-800 text-sm">Care Guide & Requirements</span>
        {open ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
      </button>
      {open && (
        <div className="px-4 pb-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
          {items.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="flex items-start gap-2">
              <Icon size={15} className={`${color} mt-0.5 shrink-0`} />
              <div>
                <p className="text-xs font-semibold text-slate-700">{label}</p>
                <p className="text-xs text-slate-500 leading-snug">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function LoadingSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-9 h-9 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-xs font-medium text-slate-500">{message}</p>
    </div>
  );
}
