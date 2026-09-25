import React, { useState } from "react";
import { Plus, Leaf, Droplets, Calendar, Sparkles } from "lucide-react";
import { NavProps, Plant } from "../types";
import { StatusPill } from "./Common";

export function GardenScreen({
  navigate,
  plants,
}: {
  navigate: NavProps["navigate"];
  plants: Plant[];
}) {
  const [filter, setFilter] = useState<"all" | "needs-water" | "healthy">("all");

  const filtered = plants.filter((p) => {
    if (filter === "healthy") return p.status === "healthy";
    if (filter === "needs-water") return p.status !== "healthy";
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-slate-900">My Garden Collection</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {plants.length} botanical companions tracked with live care schedules
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate("identify")}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors"
          >
            <Sparkles size={14} className="text-purple-600" />
            AI Scanner
          </button>
          <button
            onClick={() => navigate("add-plant")}
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm shadow-emerald-700/20 transition-all"
          >
            <Plus size={16} />
            Add New Plant
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: "all", label: `All Plants (${plants.length})` },
          {
            key: "needs-water",
            label: `Needs Water (${plants.filter((p) => p.status !== "healthy").length})`,
          },
          {
            key: "healthy",
            label: `Thriving (${plants.filter((p) => p.status === "healthy").length})`,
          },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as typeof filter)}
            className={`shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              filter === f.key
                ? "bg-emerald-700 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Plants Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 py-16 text-center px-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
            <Leaf size={24} className="text-emerald-600" />
          </div>
          <h3 className="font-serif text-lg font-bold text-slate-800">No plants match this view</h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto mt-1">
            All your botanical specimens are healthy and hydrated, or no plants have been cataloged yet.
          </p>
          <button
            onClick={() => navigate("add-plant")}
            className="mt-4 inline-flex items-center gap-2 bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-emerald-800 transition-colors"
          >
            <Plus size={14} /> Add your first plant
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((plant) => (
            <button
              key={plant.id}
              onClick={() => navigate("plant-detail", { plantId: plant.id })}
              className="group relative bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-200 transition-all text-left flex flex-col"
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
              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <p className="font-serif font-bold text-slate-900 text-sm truncate group-hover:text-emerald-700 transition-colors">
                    {plant.nickname}
                  </p>
                  <p className="text-slate-400 text-xs italic truncate mt-0.5">{plant.species}</p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 font-medium text-slate-600">
                    <Droplets size={12} className="text-blue-500" />
                    {plant.wateringFrequency}d cycle
                  </span>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-md">View details</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Floating Add Button for quick capture */}
      <button
        onClick={() => navigate("add-plant")}
        className="fixed bottom-22 md:bottom-8 right-6 w-14 h-14 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full flex items-center justify-center shadow-xl shadow-emerald-700/30 transition-transform active:scale-95 z-40"
        title="Add a plant"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
