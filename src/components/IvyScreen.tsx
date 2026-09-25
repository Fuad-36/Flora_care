import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Leaf, Bot, User } from "lucide-react";
import { NavProps, ConvMessage } from "../types";
import { sendIvyMessage, fetchIvyHistory } from "../api";
import { formatDhakaTime } from "../utils/dateTime";

export function IvyScreen({ navigate }: { navigate: NavProps["navigate"] }) {
  const [messages, setMessages] = useState<ConvMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const prompts = [
    "Why are my Monstera leaf tips turning brown?",
    "How often should I water my Golden Pothos in winter?",
    "Which houseplants are non-toxic to cats and dogs?",
    "How do I prune and propagate trailing succulents?",
  ];

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const history = await fetchIvyHistory();
      if (history && history.length > 0) {
        setMessages(history);
      } else {
        setMessages([
          {
            id: "initial",
            role: "ivy",
            senderId: "ivy",
            text: "Hello! I'm Flora, your personal AI botanical advisor powered by Gemini & Floracare's database. Ask me anything about pest control, potting soil mixtures, lighting, or leaf care!",
            time: "Just now",
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: ConvMessage = {
      id: "u_" + Date.now(),
      role: "user",
      senderId: "user",
      text,
      time: "Just now",
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await sendIvyMessage(text, messages);
      const ivyMsg: ConvMessage = {
        id: response.id || "i_" + Date.now(),
        role: "ivy",
        senderId: "ivy",
        text: response.reply,
        time: response.time || "Just now",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, ivyMsg]);
    } catch (e) {
      console.error("Failed to send:", e);
      setMessages((prev) => [
        ...prev,
        {
          id: "err_" + Date.now(),
          role: "ivy",
          senderId: "ivy",
          text: "I'm having a brief connection flutter. But as a rule of thumb: always allow the top 2 inches of soil to dry out before watering again!",
          time: "Just now",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-4.5rem)] md:h-[calc(100vh-5.5rem)]">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-slate-200/90 bg-white/80 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-700 flex items-center justify-center text-white shadow-sm shadow-emerald-700/20">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-serif font-bold text-slate-900 text-sm">Flora AI Botanist</p>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-400">Gemini 2.5 Flash & Soil Knowledge</p>
          </div>
        </div>

        <span className="text-[11px] bg-emerald-50 text-emerald-800 font-semibold px-2.5 py-1 rounded-full border border-emerald-200/50">
          Always Online
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "ivy" && (
              <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 text-xs shadow-xs mt-0.5">
                <Leaf size={14} />
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed ${
                m.role === "user"
                  ? "bg-emerald-700 text-white rounded-br-xs shadow-xs"
                  : "bg-white border border-slate-200/90 text-slate-800 rounded-bl-xs shadow-xs"
              }`}
            >
              <p className="whitespace-pre-wrap">{m.text}</p>
              <p
                className={`text-[10px] mt-1.5 text-right ${
                  m.role === "user" ? "text-emerald-200/80" : "text-slate-400"
                }`}
              >
                {m.createdAt ? formatDhakaTime(m.createdAt) : m.time}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Leaf size={14} />
            </div>
            <div className="bg-white border border-slate-200/90 rounded-2xl rounded-bl-xs p-3.5 shadow-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]" />
              <span className="text-[11px] text-slate-500 font-medium ml-1">Flora is typing...</span>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Suggested prompts if short chat */}
      {messages.length <= 2 && (
        <div className="px-4 pb-3">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Suggested questions:
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {prompts.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSend(p)}
                className="shrink-0 bg-white border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/40 text-slate-700 px-3 py-1.5 rounded-full text-xs font-medium transition-colors shadow-xs"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="p-3 border-t border-slate-200/90 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 focus-within:ring-2 focus-within:ring-emerald-600 focus-within:bg-white transition-all"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Flora anything about plant ailments, care & light..."
            className="flex-1 bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-8 h-8 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white flex items-center justify-center transition-colors shrink-0"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
