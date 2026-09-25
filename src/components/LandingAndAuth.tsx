import React, { useState } from "react";
import { Leaf, ArrowRight, Check, Sparkles } from "lucide-react";
import { NavProps } from "../types";
import { loginUser } from "../api";

export function LandingScreen({ navigate }: { navigate: NavProps["navigate"] }) {
  const features = [
    {
      title: "Botanical AI Lens",
      desc: "Instant plant identification and leaf disease diagnosis using Gemini Vision.",
      image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop&auto=format",
    },
    {
      title: "Smart Care Schedules",
      desc: "Custom watering cycles, soil formulas & logging backed by PostgreSQL.",
      image: "https://images.unsplash.com/photo-1467694273773-a6f4e5a68b78?w=400&h=300&fit=crop&auto=format",
    },
    {
      title: "Flora AI Advisor",
      desc: "Conversational houseplant pathologist ready 24/7 for tailored guidance.",
      image: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=400&h=300&fit=crop&auto=format",
    },
    {
      title: "Plant Marketplace",
      desc: "Buy, adopt & trade cuttings locally with direct peer-to-peer messaging.",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&auto=format",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f9faf7]">
      {/* Top Floating Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-18 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md">
            <Leaf size={16} className="text-white" />
          </div>
          <span className="font-serif font-bold text-white text-xl tracking-tight">Floracare</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("login")}
            className="text-white/90 text-xs font-bold hover:text-white px-3 py-2 rounded-xl transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate("signup")}
            className="bg-white hover:bg-emerald-50 text-emerald-900 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            Get Started Free
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative min-h-[620px] h-[85vh] flex items-center bg-slate-900 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=1800&h=1000&fit=crop&auto=format"
          alt="Lush Botanical Greenhouse"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />

        <div className="relative z-10 max-w-2xl ml-6 md:ml-16 lg:ml-24 px-4 pt-12">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 rounded-full px-3.5 py-1.5 mb-5 text-emerald-200 text-xs font-semibold">
            <Sparkles size={13} className="text-emerald-300" />
            AI Plant Intelligence & PostgreSQL Cloud Storage
          </div>

          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white font-bold leading-tight mb-5">
            Identify, Diagnose & Grow With{" "}
            <span className="text-emerald-400 italic">Confidence.</span>
          </h1>

          <p className="text-white/80 text-sm md:text-base leading-relaxed mb-8 max-w-lg">
            Your pocket botanist and community garden exchange. Track watering cycles, detect foliar pests, chat with AI, and trade cuttings locally.
          </p>

          <div className="flex items-center gap-3.5 flex-wrap">
            <button
              onClick={() => navigate("home")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-7 py-3.5 rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all"
            >
              Open Garden Dashboard <ArrowRight size={15} />
            </button>
            <button
              onClick={() => navigate("login")}
              className="bg-white/15 hover:bg-white/25 backdrop-blur-md text-white border border-white/20 px-6 py-3.5 rounded-xl font-bold text-xs transition-all"
            >
              Sign In to Account
            </button>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center max-w-xl mx-auto mb-14">
          <h2 className="font-serif text-3xl md:text-4xl text-slate-900 font-bold mb-2">
            Everything your plants need to flourish
          </h2>
          <p className="text-slate-500 text-xs md:text-sm">
            Powered by a Node.js fullstack backend with relational PostgreSQL database storage.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs hover:shadow-md transition-all group flex flex-col"
            >
              <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                <img
                  src={f.image}
                  alt={f.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif font-bold text-slate-900 text-base mb-1">{f.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AuthScreens({
  mode,
  navigate,
  onAuthSuccess,
  onAuthError,
}: {
  mode: "login" | "signup";
  navigate: NavProps["navigate"];
  onAuthSuccess: (user: any) => void;
  onAuthError?: (message: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const user = await loginUser(email, mode === "signup" ? name : undefined, mode);
      onAuthSuccess(user);
      navigate("home");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to authenticate";
      console.error(err);
      onAuthError?.(message);
      if (mode === "login" && /no account/i.test(message)) {
        navigate("signup");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left side Image */}
      <div className="hidden md:block w-1/2 relative bg-slate-900">
        <img
          src="https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=1000&h=1300&fit=crop&auto=format"
          alt="Botanical collection"
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute bottom-10 left-10 right-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Leaf size={14} className="text-white" />
            </div>
            <span className="font-serif font-bold text-white text-xl">Floracare</span>
          </div>
          <p className="font-serif text-white/90 text-2xl italic">
            "To plant a garden is to believe in tomorrow."
          </p>
        </div>
      </div>

      {/* Right side form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm space-y-6">
          <div>
            <div className="md:hidden flex items-center gap-2 mb-6">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
                <Leaf size={14} className="text-white" />
              </div>
              <span className="font-serif font-bold text-slate-900 text-xl">Floracare</span>
            </div>

            <h1 className="font-serif text-3xl font-bold text-slate-900">
              {mode === "login" ? "Welcome back" : "Create Account"}
            </h1>
            <p className="text-slate-500 text-xs mt-1">
              {mode === "login" ? "Sign in to manage your garden database" : "Start tracking your botanical collection"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3.5 rounded-xl font-bold text-xs shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? "Connecting..." : mode === "login" ? "Sign In" : "Register Garden Profile"}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-500">
            {mode === "login" ? (
              <p>
                Don't have an account?{" "}
                <button
                  onClick={() => navigate("signup")}
                  className="font-bold text-emerald-700 hover:underline"
                >
                  Sign Up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <button
                  onClick={() => navigate("login")}
                  className="font-bold text-emerald-700 hover:underline"
                >
                  Log In
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
