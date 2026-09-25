import React, { useState } from "react";
import { ChevronLeft, ShoppingBag, Upload, Check } from "lucide-react";
import { NavProps, Plant } from "../types";
import { createListing } from "../api";

export function CreateListingScreen({
  navigate,
  plants,
  onListingCreated,
}: {
  navigate: NavProps["navigate"];
  plants: Plant[];
  onListingCreated: () => void;
}) {
  const [selectedPlantId, setSelectedPlantId] = useState<string>(plants[0]?.id || "");
  const [plantName, setPlantName] = useState("");
  const [species, setSpecies] = useState("");
  const [price, setPrice] = useState("25");
  const [area, setArea] = useState("Brooklyn, NY");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);

  // Sync when selecting a plant from user's garden
  const handleSelectGardenPlant = (plant: Plant) => {
    setSelectedPlantId(plant.id);
    setPlantName(plant.nickname || plant.species);
    setSpecies(plant.species);
    setImage(plant.image);
    setDescription(`Healthy specimen from my garden. Well-established roots in aroid mix. Clean, pest-free, ready for repotting.`);
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await createListing({
        plantName: plantName || species,
        species,
        price: Number(price) || 20,
        area: area || "Local Area",
        image: image || (plants[0]?.image || "https://images.unsplash.com/photo-1545241047-6083a3684587?w=600&h=600&fit=crop&auto=format"),
        description: description || "Fresh cutting/plant ready for a new plant parent.",
      });
      onListingCreated();
      navigate("marketplace");
    } catch (e) {
      console.error("Failed to create listing:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 md:py-8">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("marketplace")}
          className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft size={16} />
          Marketplace
        </button>
        <span className="text-slate-300">/</span>
        <h1 className="font-serif text-xl font-bold text-slate-900">List Plant for Adoption / Sale</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Import from Garden */}
        {plants.length > 0 && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2.5">
              Quick Autofill from My Garden Collection
            </p>
            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
              {plants.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectGardenPlant(p)}
                  className={`shrink-0 flex items-center gap-2 p-1.5 pr-3 rounded-xl border transition-all ${
                    selectedPlantId === p.id
                      ? "border-emerald-600 bg-emerald-50/50 text-emerald-900"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-200 shrink-0">
                    <img src={p.image} alt={p.nickname} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs font-semibold truncate max-w-[100px]">{p.nickname}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Listing Photo */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
            Listing Photo
          </label>
          <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50 group">
            {image ? (
              <img src={image} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                <Upload size={24} className="text-slate-400" />
                <p className="text-xs text-slate-500 font-medium">Tap to upload a plant photo</p>
              </div>
            )}
            <label className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white text-xs font-bold gap-2">
              <Upload size={16} />
              Change Photo
              <input type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
            </label>
          </div>
        </div>

        {/* Details Form */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Title / Plant Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={plantName}
              onChange={(e) => setPlantName(e.target.value)}
              placeholder="e.g. Established Monstera Deliciosa Cutting"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Botanical Species <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                placeholder="e.g. Monstera deliciosa"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Asking Price (৳) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="25"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Pickup Area / Neighborhood
            </label>
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g. Brooklyn, NY (Williamsburg)"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Description & Notes
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe roots, pot size, pest checks, or propagation history..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !species.trim()}
          className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold text-sm shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2"
        >
          {loading ? "Publishing to Marketplace..." : "Publish Plant Listing"}
        </button>
      </form>
    </div>
  );
}
