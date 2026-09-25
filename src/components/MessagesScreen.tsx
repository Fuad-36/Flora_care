import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, Send, MessageCircle, MoreVertical, ShoppingBag, MapPin } from "lucide-react";
import { NavProps, Conversation, ConvMessage } from "../types";
import { sendDirectMessage } from "../api";
import { formatDhakaTime } from "../utils/dateTime";

export function MessagesScreen({
  navigate,
  conversations,
  userId,
  onRefresh,
}: {
  navigate: NavProps["navigate"];
  conversations: Conversation[];
  userId: string;
  onRefresh: () => void | Promise<void>;
}) {
  const onRefreshRef = useRef<() => void | Promise<void>>(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    let disposed = false;
    let eventSource: EventSource | null = null;

    try {
      if (userId) {
        eventSource = new EventSource(
          `/api/conversations/events?userId=${encodeURIComponent(userId)}`
        );
        eventSource.addEventListener("message", () => {
          if (!disposed) void onRefreshRef.current();
        });
      }
    } catch {
      // The REST refresh path remains available if EventSource is unavailable.
    }

    return () => {
      disposed = true;
      eventSource?.close();
    };
  }, [userId]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-slate-900">Direct Messages</h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Peer-to-peer plant buyer and seller communications
          </p>
        </div>
      </div>

      {conversations.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center">
          <MessageCircle size={32} className="text-slate-300 mx-auto mb-2" />
          <p className="font-serif font-bold text-slate-700 text-base">No conversations yet</p>
          <p className="text-xs text-slate-500 mt-1">
            Browse the marketplace and tap "Message Seller" to arrange a cutting exchange.
          </p>
          <button
            onClick={() => navigate("marketplace")}
            className="mt-4 inline-flex items-center gap-2 bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-emerald-800 transition-colors"
          >
            Explore Marketplace
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => navigate("conversation", { conversationId: c.id })}
              className="w-full bg-white border border-slate-200/90 rounded-2xl p-4 flex items-center gap-3.5 hover:shadow-xs transition-all text-left group"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                <img
                  src={c.otherParty.avatar}
                  alt={c.otherParty.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold text-slate-900 text-sm">{c.otherParty.name}</p>
                  <span className="text-[11px] text-slate-400">{c.time}</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-md overflow-hidden bg-slate-100 shrink-0">
                    <img src={c.listingImage} alt={c.listing} className="w-full h-full object-cover" />
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    <span className="font-semibold text-emerald-700">{c.listing}</span>: {c.lastMessage}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ConversationScreen({
  navigate,
  conversation,
  userId,
  onRefresh,
}: {
  navigate: NavProps["navigate"];
  conversation: Conversation;
  userId: string;
  onRefresh: () => void;
}) {
  const [messages, setMessages] = useState<ConvMessage[]>(conversation.messages || []);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const onRefreshRef = useRef<() => void | Promise<void>>(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    setMessages(conversation.messages || []);
  }, [conversation]);

  useEffect(() => {
    let disposed = false;
    let eventSource: EventSource | null = null;

    try {
      if (userId) {
        const streamUrl = `/api/conversations/${encodeURIComponent(conversation.id)}/events?userId=${encodeURIComponent(userId)}`;
        eventSource = new EventSource(streamUrl);
        eventSource.onopen = () => {
          if (!disposed) setIsLive(true);
        };
        eventSource.addEventListener("message", (event: MessageEvent) => {
        if (disposed) return;

        try {
          const payload = JSON.parse(event.data);
          const incoming = payload?.message;
          if (payload?.type !== "message" || !incoming?.id) return;

          const myId = userId || conversation.buyerId;
          const liveMessage: ConvMessage = {
            id: incoming.id,
            role: incoming.senderId === myId ? "user" : "other",
            senderId: incoming.senderId,
            text: incoming.text,
            time: incoming.time || "Just now",
            createdAt: incoming.createdAt || new Date().toISOString(),
          };

          setMessages((previous) => {
            const existingIndex = previous.findIndex((message) => message.id === liveMessage.id);
            if (existingIndex >= 0) {
              return previous.map((message, index) => (index === existingIndex ? liveMessage : message));
            }

            // Replace the optimistic temporary message with the server-confirmed event.
            const temporaryIndex = previous.findIndex(
              (message) =>
                message.id.startsWith("temp_") &&
                message.senderId === liveMessage.senderId &&
                message.text === liveMessage.text
            );
            if (temporaryIndex >= 0) {
              return previous.map((message, index) => (index === temporaryIndex ? liveMessage : message));
            }

            return [...previous, liveMessage];
          });

          // Keep the conversation list and timestamps synchronized too.
          void onRefreshRef.current();
        } catch {
          // Ignore malformed events; REST refresh remains the fallback.
        }
      });
        eventSource.onerror = () => {
          if (!disposed) setIsLive(false);
        };
      }
    } catch {
      setIsLive(false);
    }

    return () => {
      disposed = true;
      eventSource?.close();
    };
  }, [conversation.id, userId]);

  // If a proxy blocks SSE, keep the chat usable with a lightweight safety refresh.
  useEffect(() => {
    if (isLive) return;

    const pollTimer = window.setInterval(() => {
      if (!document.hidden) void onRefreshRef.current();
    }, 5_000);

    return () => window.clearInterval(pollTimer);
  }, [conversation.id, isLive]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!text.trim() || sending) return;
    const currentText = text.trim();
    setText("");

    const myId = userId || conversation.buyerId;
    const optimistic: ConvMessage = {
      id: "temp_" + Date.now(),
      role: "user",
      senderId: myId,
      text: currentText,
      time: "Just now",
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      setSending(true);
      await sendDirectMessage(conversation.id, currentText, userId);
      onRefresh();
    } catch (e) {
      console.error("Error sending message:", e);
    } finally {
      setSending(false);
    }
  };

  const visibleMessages = messages.filter((message) => !message.id.startsWith("m_reply_"));

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-4.5rem)] md:h-[calc(100vh-5.5rem)]">
      {/* Header bar */}
      <div className="px-4 py-3 border-b border-slate-200/90 bg-white/80 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("messages")}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="w-10 h-10 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
            <img
              src={conversation.otherParty.avatar}
              alt={conversation.otherParty.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">{conversation.otherParty.name}</p>
            <button
              onClick={() => navigate("listing-detail", { listingId: conversation.listingId })}
              className="text-[11px] text-emerald-700 font-medium hover:underline flex items-center gap-1"
            >
              Re: {conversation.listing} (৳{conversation.listingPrice})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`} />
            {isLive ? "Live" : "Connecting"}
          </span>
          <button
            onClick={() => navigate("listing-detail", { listingId: conversation.listingId })}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors text-xs font-semibold flex items-center gap-1.5"
          >
            <ShoppingBag size={14} />
            <span className="hidden sm:inline">View Listing</span>
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {visibleMessages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs ${
                m.role === "user"
                  ? "bg-emerald-700 text-white rounded-br-xs"
                  : "bg-white border border-slate-200 text-slate-800 rounded-bl-xs"
              }`}
            >
              <p>{m.text}</p>
              <p
                className={`text-[9px] mt-1 text-right ${
                  m.role === "user" ? "text-emerald-200/80" : "text-slate-400"
                }`}
              >
                {m.createdAt ? formatDhakaTime(m.createdAt) : m.time}
              </p>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input bar */}
      <div className="p-3 border-t border-slate-200/90 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 focus-within:ring-2 focus-within:ring-emerald-600 focus-within:bg-white transition-all"
        >
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Message ${conversation.otherParty.name.split(" ")[0]} regarding pickup...`}
            className="flex-1 bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="w-8 h-8 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white flex items-center justify-center transition-colors shrink-0"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
