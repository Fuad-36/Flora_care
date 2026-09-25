import React, { useState } from "react";
import {
  ChevronLeft,
  Droplets,
  Clock,
  Sun,
  AlertTriangle,
  Edit3,
  ShoppingBag,
  Trash2,
  Check,
  Bug,
  Sparkles,
  Layers,
  Save,
} from "lucide-react";
import { NavProps, Plant } from "../types";
import { StatusPill, CareGuide } from "./Common";
import { logPlantCare, updatePlant, deletePlant } from "../api";

export function PlantDetailScreen({
  navigate,
  plant,
  onRefresh,
}: {
  navigate: NavProps["navigate"];
  plant: any;
  onRefresh: () => void;
}) {
  const [notes, setNotes] = useState(plant.notes || "");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [wateringLoading, setWateringLoading] = useState(false);
  const [wateredToast, setWateredToast] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const handleLogWater = async () => {
    try {
      setWateringLoading(true);
      await logPlantCare(plant.id, "water", "Watered plant thoroughly");
      setWateredToast(true);
      onRefresh();
      setTimeout(() => setWateredToast(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setWateringLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      setSavingNotes(true);
      await updatePlant(plant.id, { notes });
      setIsEditingNotes(false);
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDeletePlant = async () => {
    try {
      await deletePlant(plant.id);
      navigate("garden");
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const careLogs = plant.careLogs || [];
  const diagnoses = plant.diagnoses || [];

  return (
    <div className="max-w-3xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="relative aspect-[16/10] sm:aspect-[21/9] bg-slate-900 overflow-hidden sm:rounded-b-3xl">
        <img
          src={plant.image}
          alt={plant.nickname}
          className="w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        <button
          onClick={() => navigate("garden")}
          className="absolute top-4 left-4 bg-black/40 backdrop-blur-md text-white p-2.5 rounded-full hover:bg-black/60 transition-colors z-10"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white leading-tight">
              {plant.nickname}
            </h1>
            <p className="font-serif text-emerald-200/90 italic text-sm mt-0.5 sm:text-base">
              {plant.scientificName || plant.species}
            </p>
          </div>
          <StatusPill status={plant.status} />
        </div>
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* Quick Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div>
            <p className="text-xs text-slate-400 font-medium">Watering Schedule</p>
            <p className="text-sm font-bold text-slate-800">
              Every {plant.wateringFrequency} days
            </p>
          </div>

          <button
            onClick={handleLogWater}
            disabled={wateringLoading || wateredToast}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
              wateredToast
                ? "bg-emerald-100 text-emerald-800"
                : "bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/20"
            }`}
          >
            {wateredToast ? (
              <>
                <Check size={15} /> Logged for Today!
              </>
            ) : (
              <>
                <Droplets size={15} /> Log Watering Now
              </>
            )}
          </button>
        </div>

        {/* Plant Environment Specs */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-white rounded-2xl p-3 border border-slate-200/80 text-center shadow-xs">
            <Droplets size={16} className="text-blue-500 mx-auto mb-1" />
            <p className="text-xs font-bold text-slate-800">Every {plant.wateringFrequency}d</p>
            <p className="text-[10px] text-slate-400">Frequency</p>
          </div>
          <div className="bg-white rounded-2xl p-3 border border-slate-200/80 text-center shadow-xs">
            <Clock size={16} className="text-slate-400 mx-auto mb-1" />
            <p className="text-xs font-bold text-slate-800 truncate">
              {plant.lastWatered ? new Date(plant.lastWatered).toLocaleDateString() : "Never"}
            </p>
            <p className="text-[10px] text-slate-400">Last Hydrated</p>
          </div>
          <div className="bg-white rounded-2xl p-3 border border-slate-200/80 text-center shadow-xs">
            <Sun size={16} className="text-amber-500 mx-auto mb-1" />
            <p className="text-xs font-bold text-slate-800 truncate">{plant.sunlight || "Indirect"}</p>
            <p className="text-[10px] text-slate-400">Sun Exposure</p>
          </div>
        </div>

        {/* Detailed Care Guide */}
        <CareGuide
          customData={{
            sunlight: plant.sunlight,
            soil: plant.soil,
            temperature: plant.temperature,
            humidity: plant.humidity,
            fertilizer: plant.fertilizer,
          }}
        />

        {/* Unwell Diagnostic Quick CTA */}
        <button
          onClick={() =>
            navigate("identify", {
              scanMode: "diagnose",
              diagnosePlantId: plant.id,
            })
          }
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 hover:bg-amber-100/60 transition-colors group text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">Does this plant look unhealthy?</p>
              <p className="text-[11px] text-amber-700">Run an instant AI disease diagnosis with photo scan</p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-900 group-hover:translate-x-1 transition-transform">
            Diagnose →
          </span>
        </button>

        {/* Care Logs & Timeline */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-slate-500" />
              <h2 className="font-semibold text-slate-800 text-sm">Care History & Timeline</h2>
            </div>
            <span className="text-xs text-slate-400">PostgreSQL Logs</span>
          </div>

          {careLogs.length === 0 && diagnoses.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">No care logs recorded yet.</p>
          ) : (
            <div className="space-y-2.5 pt-1">
              {diagnoses.map((dx: any) => (
                <div
                  key={dx.id}
                  className="flex items-start gap-3 bg-amber-50/60 p-3 rounded-xl border border-amber-100"
                >
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <Bug size={13} />
                        Diagnosed: {dx.issue}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {new Date(dx.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{dx.description}</p>
                    <div className="mt-2 text-[11px] bg-white p-2 rounded-lg border border-amber-200/50 text-slate-700">
                      <span className="font-semibold text-emerald-700">Organic Remedy: </span>
                      {dx.organicTreatment}
                    </div>
                  </div>
                </div>
              ))}

              {careLogs.map((log: any) => (
                <div key={log.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors">
                  <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <Droplets size={13} className="text-blue-500 shrink-0" />
                    <p className="text-xs font-medium text-slate-700 truncate">
                      {log.notes || "Watered plant"}
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {new Date(log.loggedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botanical Notes */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 text-sm">Botanist Notes</h2>
            {!isEditingNotes ? (
              <button
                onClick={() => setIsEditingNotes(true)}
                className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-1"
              >
                <Edit3 size={12} /> Edit
              </button>
            ) : (
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="text-xs bg-emerald-700 text-white px-3 py-1 rounded-lg font-semibold flex items-center gap-1 hover:bg-emerald-800 transition-colors"
              >
                <Save size={12} /> {savingNotes ? "Saving..." : "Save Notes"}
              </button>
            )}
          </div>

          {isEditingNotes ? (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Add personal observations, repotting dates, cutting roots..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent leading-relaxed"
            />
          ) : (
            <p className="text-xs text-slate-600 leading-relaxed min-h-[40px] whitespace-pre-wrap">
              {notes || "No notes added yet. Tap edit to write observations."}
            </p>
          )}
        </div>

        {/* Plant Actions Footer */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => navigate("create-listing")}
            className="flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-xs transition-colors"
          >
            <ShoppingBag size={14} className="text-emerald-700" />
            List for Sale
          </button>

          {deleteConfirm ? (
            <div className="flex gap-2">
              <button
                onClick={handleDeletePlant}
                className="flex-1 py-3 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors"
              >
                Confirm Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-3 py-3 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="flex items-center justify-center gap-2 py-3 rounded-xl border border-rose-100 bg-rose-50/50 hover:bg-rose-100/70 text-rose-700 text-xs font-semibold transition-colors"
            >
              <Trash2 size={14} />
              Remove Plant
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
