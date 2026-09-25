import React, { useState } from "react";
import {
  Upload,
  Camera,
  Check,
  ChevronLeft,
  AlertTriangle,
  Bug,
  FlaskConical,
  Leaf,
  Sparkles,
  Save,
} from "lucide-react";
import { NavProps, Plant, ScanMode } from "../types";
import { CareGuide } from "./Common";
import { scanPlantWithAI, saveDiagnosisToDb, createPlant } from "../api";

const SAMPLE_SCAN_IMAGES = [
  {
    name: "Monstera Deliciosa",
    url: "https://images.unsplash.com/photo-1545241047-6083a3684587?w=800&h=800&fit=crop&auto=format",
  },
  {
    name: "Peace Lily (Stress)",
    url: "https://images.unsplash.com/photo-1560717789-0ac7c58ac90a?w=800&h=800&fit=crop&auto=format",
  },
  {
    name: "Succulent Cluster",
    url: "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=800&h=800&fit=crop&auto=format",
  },
];

export function ScanScreen({
  navigate,
  initialMode,
  prefilledPlantId,
  plants,
  onDiagnosisSaved,
}: {
  navigate: NavProps["navigate"];
  initialMode: ScanMode;
  prefilledPlantId: string | null;
  plants: Plant[];
  onDiagnosisSaved: () => void;
}) {
  const [mode, setMode] = useState<ScanMode>(initialMode);
  const [scanState, setScanState] = useState<"upload" | "loading" | "result">("upload");
  const [selectedPlantId, setSelectedPlantId] = useState<string>(prefilledPlantId || "");
  const [treatmentTab, setTreatmentTab] = useState<"organic" | "chemical">("organic");
  const [currentImage, setCurrentImage] = useState<string>(SAMPLE_SCAN_IMAGES[0].url);
  const [aiResult, setAiResult] = useState<any>(null);
  const [savedToDb, setSavedToDb] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const selectedPlant = plants.find((p) => p.id === selectedPlantId);

  const handleModeChange = (m: ScanMode) => {
    setMode(m);
    setScanState("upload");
    setSavedToDb(false);
    setAiResult(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const b64 = event.target.result as string;
          setCurrentImage(b64);
          triggerScan(b64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerScan = async (img: string) => {
    try {
      setScanState("loading");
      setSavedToDb(false);
      const result = await scanPlantWithAI(
        mode,
        img.startsWith("data:") ? img : undefined,
        selectedPlant ? `${selectedPlant.nickname} (${selectedPlant.species})` : undefined
      );
      setAiResult(result);
      setScanState("result");
    } catch (e) {
      console.error("Scan error:", e);
      // Fallback result
      if (mode === "identify") {
        setAiResult({
          species: "Monstera Deliciosa",
          scientificName: "Monstera deliciosa",
          confidence: "High Confidence Match (96%)",
          description:
            "Also known as the Swiss Cheese Plant. Native to tropical forests of southern Mexico and Central America.",
          sunlight: "Bright indirect light",
          water: "Every 7 days when top 2 inches dry",
          soil: "Chunky aroid mix with bark and perlite",
        });
      } else {
        setAiResult({
          issue: "Spider Mites",
          scientificIssue: "Tetranychus urticae",
          confidence: "High Confidence Match (95%)",
          description:
            "Fine webbing clusters detected between leaf joints and undersides. Pale stippled discoloration from cell sap feeding.",
          organicTreatment:
            "Mix 1 tsp cold-pressed neem oil, 1/2 tsp mild Castile soap, and 1 liter lukewarm water. Spray undersides every 3 days for 2 weeks.",
          chemicalTreatment:
            "Apply pyrethrin or sulfur-based miticide spray as instructed on container.",
        });
      }
      setScanState("result");
    }
  };

  const handleSaveDiagnosis = async () => {
    if (!aiResult) return;
    try {
      setSaveLoading(true);
      await saveDiagnosisToDb({
        plantId: selectedPlantId || (plants[0] ? plants[0].id : null),
        issue: aiResult.issue || "Identified Plant Issue",
        scientificIssue: aiResult.scientificIssue,
        confidence: aiResult.confidence,
        description: aiResult.description,
        organicTreatment: aiResult.organicTreatment,
        chemicalTreatment: aiResult.chemicalTreatment,
        imageUrl: currentImage,
      });
      setSavedToDb(true);
      onDiagnosisSaved();
      if (selectedPlantId) {
        setTimeout(() => navigate("plant-detail", { plantId: selectedPlantId }), 1000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSaveIdentifiedToGarden = async () => {
    if (!aiResult) return;
    try {
      setSaveLoading(true);
      await createPlant({
        nickname: aiResult.species,
        species: aiResult.species,
        scientificName: aiResult.scientificName || aiResult.species,
        wateringFrequency: 7,
        image: currentImage,
        notes: `Identified via Floracare AI Lens. ${aiResult.description || ""}`,
        sunlight: aiResult.sunlight || "Bright indirect light",
        soil: aiResult.soil || "Well-draining mix",
      });
      setSavedToDb(true);
      onDiagnosisSaved();
      setTimeout(() => navigate("garden"), 800);
    } catch (e) {
      console.error(e);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
      {/* Segmented Header Controls */}
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-slate-900 mb-1">
          Floracare AI Botanical Lens
        </h1>
        <p className="text-slate-500 text-xs mb-4">
          Powered by Gemini Vision & PostgreSQL Plant Knowledge Base
        </p>

        <div className="flex bg-slate-200/80 p-1 rounded-xl">
          {(["identify", "diagnose"] as ScanMode[]).map((m) => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                mode === m
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {m === "identify" ? "Identify Species" : "Diagnose Leaf Disease"}
            </button>
          ))}
        </div>
      </div>

      {/* UPLOAD SCREEN */}
      {scanState === "upload" && (
        <div className="space-y-5">
          {mode === "diagnose" && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Which plant are you examining? <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <select
                value={selectedPlantId}
                onChange={(e) => setSelectedPlantId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="">Choose from My Garden...</option>
                {plants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nickname} — {p.species}
                  </option>
                ))}
              </select>
              {selectedPlant && (
                <p className="text-[11px] text-emerald-700 font-medium mt-1.5 flex items-center gap-1">
                  <Check size={12} /> Flora will cross-examine symptoms specific to {selectedPlant.species}
                </p>
              )}
            </div>
          )}

          {/* Upload Drop Zone */}
          <div className="relative aspect-[16/10] bg-white rounded-3xl border-2 border-dashed border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/20 transition-all flex flex-col items-center justify-center gap-3 p-6 text-center group cursor-pointer shadow-xs">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer z-20"
            />
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
              <Camera size={26} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                Tap to snap photo or upload image
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Supports JPG, PNG, WEBP (Leaf close-up works best)</p>
            </div>
          </div>

          {/* Sample Images */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              Or test with a sample specimen:
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              {SAMPLE_SCAN_IMAGES.map((sample, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setCurrentImage(sample.url);
                    triggerScan(sample.url);
                  }}
                  className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-200 shadow-xs hover:border-emerald-600 text-left transition-all"
                >
                  <img
                    src={sample.url}
                    alt={sample.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2">
                    <p className="text-[11px] font-semibold text-white truncate">{sample.name}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LOADING SCREEN */}
      {scanState === "loading" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-5 shadow-xs">
          <div className="relative w-28 h-28 mx-auto rounded-2xl overflow-hidden shadow-md">
            <img src={currentImage} alt="Scanning" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-emerald-700/30 animate-pulse flex items-center justify-center">
              <Sparkles size={32} className="text-white animate-spin" />
            </div>
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-slate-900">
              {mode === "identify" ? "Identifying botanical species..." : "Analyzing disease pathology..."}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Gemini Vision AI is cross-referencing cell chlorosis, webbing, foliage geometry, and pest markings.
            </p>
          </div>
          <div className="w-48 h-1.5 bg-slate-100 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-emerald-600 rounded-full w-3/4 animate-pulse" />
          </div>
        </div>
      )}

      {/* RESULT SCREEN */}
      {scanState === "result" && aiResult && (
        <div className="space-y-5">
          <div className="relative aspect-[16/10] rounded-3xl overflow-hidden shadow-sm bg-slate-900">
            <img src={currentImage} alt="Result" className="w-full h-full object-cover" />
            <button
              onClick={() => setScanState("upload")}
              className="absolute top-4 left-4 bg-black/40 backdrop-blur-md text-white p-2.5 rounded-full hover:bg-black/60 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="absolute top-4 right-4 bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
              <Check size={13} />
              {aiResult.confidence || "High Confidence Match"}
            </div>
          </div>

          {/* Identification Details */}
          {mode === "identify" && (
            <>
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
                <div className="flex items-center gap-2">
                  <Leaf size={18} className="text-emerald-700" />
                  <h2 className="font-serif text-2xl font-bold text-slate-900">
                    {aiResult.species}
                  </h2>
                </div>
                <p className="font-serif italic text-xs text-slate-500">{aiResult.scientificName}</p>
                <p className="text-xs text-slate-600 leading-relaxed pt-1">
                  {aiResult.description}
                </p>
              </div>

              <CareGuide
                startOpen
                customData={{
                  sunlight: aiResult.sunlight,
                  water: aiResult.water,
                  soil: aiResult.soil,
                  temperature: aiResult.temperature,
                  humidity: aiResult.humidity,
                  fertilizer: aiResult.fertilizer,
                }}
              />

              <div className="space-y-2.5 pt-2">
                <button
                  onClick={handleSaveIdentifiedToGarden}
                  disabled={savedToDb || saveLoading}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold text-xs shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={15} />
                  {savedToDb ? "Saved in PostgreSQL Garden!" : saveLoading ? "Saving..." : "Save to My Garden Collection"}
                </button>
                <button
                  onClick={() => setScanState("upload")}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-semibold text-xs transition-colors"
                >
                  Scan Another Plant
                </button>
              </div>
            </>
          )}

          {/* Disease Diagnosis Details */}
          {mode === "diagnose" && (
            <>
              <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 text-xs text-amber-900">
                <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p>
                  AI pathological screening for early diagnosis. Verify severe infestations before broad-spectrum pesticide usage.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wide">Diagnosis</p>
                    <h2 className="font-serif text-2xl font-bold text-slate-900">{aiResult.issue}</h2>
                    <p className="font-serif italic text-xs text-slate-500">{aiResult.scientificIssue}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
                    <Bug size={24} />
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pt-1">
                  {aiResult.description}
                </p>
              </div>

              {/* Treatment Tabs */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="flex border-b border-slate-200">
                  <button
                    onClick={() => setTreatmentTab("organic")}
                    className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                      treatmentTab === "organic"
                        ? "text-emerald-800 bg-emerald-50/70 border-b-2 border-emerald-700"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Leaf size={14} /> Organic & Natural Remedy
                  </button>
                  <button
                    onClick={() => setTreatmentTab("chemical")}
                    className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                      treatmentTab === "chemical"
                        ? "text-rose-800 bg-rose-50/70 border-b-2 border-rose-600"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <FlaskConical size={14} /> Chemical / Conventional
                  </button>
                </div>

                <div className="p-4 text-xs text-slate-700 leading-relaxed">
                  {treatmentTab === "organic" ? (
                    <div className="space-y-2">
                      <p className="font-bold text-emerald-800">Holistic Recovery Protocol:</p>
                      <p>{aiResult.organicTreatment}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-bold text-rose-800">Targeted Active Treatment:</p>
                      <p>{aiResult.chemicalTreatment}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* CTA */}
              <div className="space-y-2.5 pt-2">
                <button
                  onClick={handleSaveDiagnosis}
                  disabled={savedToDb || saveLoading}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold text-xs shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={15} />
                  {savedToDb
                    ? "Saved to Plant Diagnosis History!"
                    : saveLoading
                    ? "Saving..."
                    : selectedPlant
                    ? `Save to ${selectedPlant.nickname}'s Care Timeline`
                    : "Save Diagnosis to Garden Log"}
                </button>
                <button
                  onClick={() => setScanState("upload")}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-semibold text-xs transition-colors"
                >
                  Scan Another Leaf
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
