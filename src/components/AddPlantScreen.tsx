import React, { useState } from "react";
import { ChevronLeft, Upload, Leaf, Droplets, Sun, Sparkles, Check } from "lucide-react";
import { NavProps } from "../types";
import { createPlant } from "../api";

const PRESET_PLANT_IMAGES = [
  {
    name: "Monstera Deliciosa",
    scientific: "Monstera deliciosa",
    image: "https://images.unsplash.com/photo-1545241047-6083a3684587?w=800&h=800&fit=crop&auto=format",
    freq: 7,
  },
  {
    name: "Golden Pothos",
    scientific: "Epipremnum aureum",
    image: "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=800&h=800&fit=crop&auto=format",
    freq: 5,
  },
  {
    name: "Snake Plant",
    scientific: "Sansevieria trifasciata",
    image: "https://images.unsplash.com/photo-1593691509543-c55fb32e3de5?w=800&h=800&fit=crop&auto=format",
    freq: 14,
  },
  {
    name: "Peace Lily",
    scientific: "Spathiphyllum wallisii",
    image: "https://images.unsplash.com/photo-1560717789-0ac7c58ac90a?w=800&h=800&fit=crop&auto=format",
    freq: 7,
  },
  {
    name: "Fiddle Leaf Fig",
    scientific: "Ficus lyrata",
    image: "https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=800&h=800&fit=crop&auto=format",
    freq: 10,
  },
  {
    name: "Succulents / Jade",
    scientific: "Crassula ovata",
    image: "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=800&h=800&fit=crop&auto=format",
    freq: 18,
  },
];

export function AddPlantScreen({
  navigate,
  onPlantAdded,
}: {
  navigate: NavProps["navigate"];
  onPlantAdded: () => void;
}) {
  const [nickname, setNickname] = useState("");
  const [species, setSpecies] = useState("");
  const [scientificName, setScientificName] = useState("");
  const [wateringFrequency, setWateringFrequency] = useState(7);
  const [imageUrl, setImageUrl] = useState(PRESET_PLANT_IMAGES[0].image);
  const [notes, setNotes] = useState("");
  const [sunlight, setSunlight] = useState("Bright indirect light");
  const [loading, setLoading] = useState(false);

  const handleSelectPreset = (preset: (typeof PRESET_PLANT_IMAGES)[0]) => {
    setImageUrl(preset.image);
    if (!species) setSpecies(preset.name);
    if (!scientificName) setScientificName(preset.scientific);
    setWateringFrequency(preset.freq);
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!species.trim()) return;

    try {
      setLoading(true);
      await createPlant({
        nickname: nickname.trim() || species.trim(),
        species: species.trim(),
        scientificName: scientificName.trim() || species.trim(),
        wateringFrequency: Number(wateringFrequency) || 7,
        image: imageUrl,
        notes: notes.trim(),
        sunlight,
      });
      onPlantAdded();
      navigate("garden");
    } catch (err) {
      console.error("Failed to add plant:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 md:py-8">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("garden")}
          className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft size={16} />
          Back to Garden
        </button>
        <span className="text-slate-300">/</span>
        <h1 className="font-serif text-xl font-bold text-slate-900">Add Botanical Companion</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
            Plant Photograph
          </label>
          <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50 group">
            {imageUrl ? (
              <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                <Upload size={24} className="text-slate-400" />
                <p className="text-xs text-slate-500 font-medium">Upload or select a preset below</p>
              </div>
            )}

            <label className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white text-xs font-bold gap-2">
              <Upload size={16} />
              Change Photo
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFile}
                className="hidden"
              />
            </label>
          </div>

          <p className="text-[11px] text-slate-500 mt-2 mb-2 font-medium">
            Or choose a photo template:
          </p>
          <div className="grid grid-cols-6 gap-2">
            {PRESET_PLANT_IMAGES.map((preset, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`aspect-square rounded-xl overflow-hidden border-2 transition-all relative ${
                  imageUrl === preset.image ? "border-emerald-600 scale-105 shadow-xs" : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <img src={preset.image} alt={preset.name} className="w-full h-full object-cover" />
                {imageUrl === preset.image && (
                  <div className="absolute inset-0 bg-emerald-700/20 flex items-center justify-center">
                    <Check size={14} className="text-white drop-shadow-sm" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Nickname <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. Big Mo, Office Philodendron"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Species Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                placeholder="e.g. Monstera Deliciosa"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Scientific / Botanical Name
              </label>
              <input
                type="text"
                value={scientificName}
                onChange={(e) => setScientificName(e.target.value)}
                placeholder="e.g. Monstera deliciosa"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 italic"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Watering Frequency (Days)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={wateringFrequency}
                  onChange={(e) => setWateringFrequency(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                <Droplets size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Sunlight Requirement
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={sunlight}
                  onChange={(e) => setSunlight(e.target.value)}
                  placeholder="e.g. Bright indirect light"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                <Sun size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Care Observations & Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Purchased at Brooklyn market, prefers pebble tray for humidity..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !species.trim()}
          className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold text-sm shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2"
        >
          {loading ? "Saving to PostgreSQL Database..." : "Save Plant to My Garden"}
        </button>
      </form>
    </div>
  );
}
