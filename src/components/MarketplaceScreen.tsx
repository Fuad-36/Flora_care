import React, { useState } from "react";
import { Search, ShoppingBag, Plus, MapPin, Star, Tag } from "lucide-react";
import { NavProps, Listing } from "../types";

export function MarketplaceScreen({
  navigate,
  listings,
  onSearch,
}: {
  navigate: NavProps["navigate"];
  listings: Listing[];
  onSearch: (q: string) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPrice, setFilterPrice] = useState<string>("All");

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    onSearch(val);
  };

  const filtered = listings.filter((l) => {
    if (filterPrice === "Under ৳25") return l.price < 25;
    if (filterPrice === "৳25–৳50") return l.price >= 25 && l.price <= 50;
    if (filterPrice === "৳50+") return l.price > 50;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingBag size={22} className="text-emerald-700" />
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-slate-900">
              Community Plant Marketplace
            </h1>
          </div>
          <p className="text-slate-500 text-xs mt-0.5">
            Buy, trade & adopt cuttings directly from local plant parents (Chat without fees)
          </p>
        </div>

        <button
          onClick={() => navigate("create-listing")}
          className="flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-emerald-700/20 transition-all shrink-0"
        >
          <Plus size={16} />
          List a Plant for Sale
        </button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search monsteras, pothos cuttings, rare philodendrons or location..."
            className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-xs"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {["All", "Under ৳25", "৳25–৳50", "৳50+"].map((tag) => (
            <button
              key={tag}
              onClick={() => setFilterPrice(tag)}
              className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterPrice === tag
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Listings Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center">
          <ShoppingBag size={32} className="text-slate-300 mx-auto mb-2" />
          <p className="font-serif font-bold text-slate-700 text-base">No plant listings found</p>
          <p className="text-xs text-slate-500 mt-1">Try altering your search or create the first listing!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate("listing-detail", { listingId: item.id })}
              className="group bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs hover:shadow-md transition-all text-left flex flex-col"
            >
              <div className="aspect-square bg-slate-100 overflow-hidden relative">
                <img
                  src={item.image}
                  alt={item.plantName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2.5 right-2.5 bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-xs font-bold">
                  ৳{item.price}
                </div>
              </div>

              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif font-bold text-slate-900 text-sm truncate group-hover:text-emerald-700 transition-colors">
                    {item.plantName}
                  </h3>
                  <p className="text-slate-400 text-xs italic truncate mt-0.5">{item.species}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 truncate max-w-[100px]">
                    <MapPin size={11} className="text-slate-400 shrink-0" />
                    <span className="truncate">{item.area}</span>
                  </span>
                  <span className="font-medium text-emerald-700 shrink-0">
                    {item.seller?.name?.split(" ")[0] || "Seller"}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
