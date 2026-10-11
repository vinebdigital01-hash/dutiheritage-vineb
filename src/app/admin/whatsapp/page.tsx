"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  FiSend,
  FiUser,
  FiCpu,
  FiMessageCircle,
  FiClock,
  FiCheck,
  FiPlus,
  FiSearch,
  FiRefreshCw,
  FiAlertCircle,
  FiX,
} from "react-icons/fi";
import { adminFetch } from "@/lib/admin-api";
import { useAppContext } from "@/context/AppContext";

type Session = {
  phone: string;
  customerName?: string;
  unreadCount: number;
  lastMessageAt: string;
  mode: "bot" | "human";
  assignedTo?: string;
  assignedName?: string;
};

type ChatMessage = {
  id: string;
  direction: "inbound" | "outbound" | "admin" | "incoming" | "outgoing";
  body: string;
  createdAt: string;
  messageType: string;
  sentBy: "user" | "bot" | "admin" | "customer";
  delivered?: boolean;
};

type LinkedOrder = {
  orderId: string;
  status: string;
  total: number;
  paymentMethod: string;
  name?: string;
  href: string;
};

type Canned = { id: string; title: string; body: string };

export default function WhatsAppInboxPage() {
  const { user } = useAppContext();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [order, setOrder] = useState<LinkedOrder | null>(null);
  const [canned, setCanned] = useState<Canned[]>([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [newChatPhone, setNewChatPhone] = useState("");
  const [newChatError, setNewChatError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchSessions = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const data = await adminFetch<{ sessions?: Session[] }>("/api/bot/chat");
      if (data && Array.isArray(data.sessions)) {
        setSessions(data.sessions);
        setError("");
      }
    } catch (err: any) {
      console.error("Error fetching sessions:", err);
      setError("Could not load WhatsApp chats. Please ensure you are logged in as admin.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchMessages = async (phone: string) => {
    try {
      const data = await adminFetch<{
        messages?: ChatMessage[];
        session?: Session;
        order?: LinkedOrder | null;
      }>(`/api/bot/chat/${encodeURIComponent(phone)}`);
      if (data) {
        setMessages(data.messages || []);
        setOrder(data.order || null);
        if (data.session) {
          setSelectedSession((prev) =>
            prev && prev.phone === phone ? { ...prev, ...data.session } : prev
          );
        }
        scrollToBottom();
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  useEffect(() => {
    fetchSessions();
    adminFetch<{ replies: Canned[] }>("/api/bot/canned")
      .then((d) => setCanned(d.replies || []))
      .catch(() => undefined);
    const interval = setInterval(() => fetchSessions(false), 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchMessages(selectedSession.phone);
      void adminFetch(`/api/bot/chat/${encodeURIComponent(selectedSession.phone)}`, {
        method: "PATCH",
        body: JSON.stringify({ markAsRead: true }),
      }).catch(() => undefined);
      const interval = setInterval(() => fetchMessages(selectedSession.phone), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedSession?.phone]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedSession) return;

    const newMessage = replyText;
    setReplyText("");

    const tempMsg: ChatMessage = {
      id: Date.now().toString(),
      direction: "admin",
      body: newMessage,
      createdAt: new Date().toISOString(),
      messageType: "text",
      sentBy: "admin",
      delivered: true,
    };
    setMessages((prev) => [...prev, tempMsg]);
    scrollToBottom();

    try {
      await adminFetch(`/api/bot/chat/${encodeURIComponent(selectedSession.phone)}`, {
        method: "POST",
        body: JSON.stringify({
          body: newMessage,
          sentBy: "admin",
          messageType: "text",
        }),
      });
      // Refresh messages after send
      fetchMessages(selectedSession.phone);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleToggleMode = async () => {
    if (!selectedSession) return;
    const newMode = selectedSession.mode === "bot" ? "human" : "bot";
    setSelectedSession({ ...selectedSession, mode: newMode });
    setSessions((prev) =>
      prev.map((s) => (s.phone === selectedSession.phone ? { ...s, mode: newMode } : s))
    );
    try {
      await adminFetch(`/api/bot/chat/${encodeURIComponent(selectedSession.phone)}`, {
        method: "PATCH",
        body: JSON.stringify({ mode: newMode }),
      });
    } catch (err) {
      console.error("Error toggling mode:", err);
    }
  };

  const assignToMe = async () => {
    if (!selectedSession || !user?.email) return;
    try {
      await adminFetch(`/api/bot/chat/${encodeURIComponent(selectedSession.phone)}`, {
        method: "PATCH",
        body: JSON.stringify({ assignedTo: user.email, assignedName: user.email }),
      });
      setSelectedSession({ ...selectedSession, assignedTo: user.email, assignedName: user.email });
    } catch (err) {
      console.error("Error assigning:", err);
    }
  };

  const handleStartNewChat = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newChatPhone.replace(/\D/g, "");
    if (clean.length < 10) {
      setNewChatError("Please enter a valid phone number (at least 10 digits)");
      return;
    }
    const formattedPhone = clean.length === 10 ? `91${clean}` : clean;
    const existing = sessions.find((s) => s.phone.endsWith(clean.slice(-10)));
    if (existing) {
      setSelectedSession(existing);
    } else {
      const newSession: Session = {
        phone: formattedPhone,
        customerName: "",
        unreadCount: 0,
        lastMessageAt: new Date().toISOString(),
        mode: "human",
      };
      setSessions((prev) => [newSession, ...prev]);
      setSelectedSession(newSession);
    }
    setNewChatPhone("");
    setNewChatError("");
    setNewChatModalOpen(false);
  };

  const filteredSessions = sessions.filter((s) => {
    if (unreadOnly && (s.unreadCount || 0) <= 0) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchPhone = s.phone.toLowerCase().includes(q);
      const matchName = (s.customerName || "").toLowerCase().includes(q);
      return matchPhone || matchName;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral-500 text-sm">
        <FiRefreshCw className="animate-spin mr-2" /> Loading WhatsApp chats...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-xl shadow-sm border border-[var(--color-border)] overflow-hidden">
      {/* New Chat Modal */}
      {newChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-base">Start New Conversation</h3>
              <button
                type="button"
                onClick={() => setNewChatModalOpen(false)}
                className="text-neutral-400 hover:text-black"
              >
                <FiX size={18} />
              </button>
            </div>
            <p className="text-xs text-neutral-500">
              Enter customer mobile number with or without country code.
            </p>
            <form onSubmit={handleStartNewChat} className="space-y-3">
              <div>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={newChatPhone}
                  onChange={(e) => {
                    setNewChatPhone(e.target.value);
                    setNewChatError("");
                  }}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                  autoFocus
                />
                {newChatError && <p className="text-xs text-red-600 mt-1">{newChatError}</p>}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewChatModalOpen(false)}
                  className="px-3 py-1.5 text-xs border rounded-lg hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs bg-black text-white rounded-lg hover:bg-neutral-800"
                >
                  Start Chat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-2 text-xs flex justify-between items-center border-b border-red-200">
          <span className="flex items-center gap-1.5">
            <FiAlertCircle /> {error}
          </span>
          <button
            type="button"
            onClick={() => fetchSessions(true)}
            className="underline font-medium hover:text-red-900"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Session List */}
        <div className="w-full md:w-1/3 border-r border-[var(--color-border)] flex flex-col bg-[#f8f9fa]">
          <div className="p-3 border-b border-[var(--color-border)] bg-white space-y-2.5">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-semibold tracking-wide uppercase flex items-center gap-2">
                <FiMessageCircle /> WhatsApp Chats
              </h2>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => fetchSessions(true)}
                  disabled={refreshing}
                  title="Refresh chats"
                  className="p-1.5 text-neutral-500 hover:text-black rounded-md hover:bg-neutral-100 transition-colors"
                >
                  <FiRefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
                </button>
                <button
                  type="button"
                  onClick={() => setNewChatModalOpen(true)}
                  title="Start new conversation"
                  className="flex items-center gap-1 px-2.5 py-1 text-xs bg-black text-white rounded-md hover:bg-neutral-800 transition-colors"
                >
                  <FiPlus size={12} /> New
                </button>
              </div>
            </div>

            <div className="relative">
              <FiSearch className="absolute left-2.5 top-2.5 text-neutral-400 text-xs" />
              <input
                type="text"
                placeholder="Search phone or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-neutral-600">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={unreadOnly}
                  onChange={(e) => setUnreadOnly(e.target.checked)}
                  className="rounded text-black"
                />
                Unread only
              </label>
              <span className="text-[11px] text-neutral-400">
                {filteredSessions.length} conversation{filteredSessions.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredSessions.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-500 space-y-3">
                <p>No conversations found.</p>
                <button
                  type="button"
                  onClick={() => setNewChatModalOpen(true)}
                  className="inline-flex items-center gap-1 text-xs text-black border border-neutral-300 px-3 py-1.5 rounded-lg hover:bg-neutral-100"
                >
                  <FiPlus size={12} /> Start a conversation
                </button>
              </div>
            ) : (
              filteredSessions.map((session) => (
                <div
                  key={session.phone}
                  onClick={() => setSelectedSession(session)}
                  className={`p-3.5 border-b border-[var(--color-border)] cursor-pointer hover:bg-neutral-100 transition-colors ${
                    selectedSession?.phone === session.phone ? "bg-neutral-100 border-l-2 border-l-black" : ""
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm text-neutral-900 truncate">
                      {session.customerName ? `${session.customerName} (${session.phone})` : session.phone}
                    </span>
                    {session.unreadCount > 0 && (
                      <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {session.unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      {session.mode === "bot" ? <FiCpu size={12} className="text-blue-500" /> : <FiUser size={12} className="text-emerald-600" />}
                      {session.assignedName || (session.mode === "bot" ? "Bot active" : "Human mode")}
                    </span>
                    <span className="flex items-center gap-1 text-[11px]">
                      <FiClock size={11} />
                      {session.lastMessageAt
                        ? new Date(session.lastMessageAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Pane: Active Chat Conversation */}
        <div className="flex-1 flex flex-col bg-[#efeae2]">
          {selectedSession ? (
            <>
              {/* Top Chat Header */}
              <div className="p-3.5 bg-white border-b border-[var(--color-border)] flex justify-between items-center gap-3">
                <div>
                  <h3 className="font-semibold text-sm text-neutral-900">
                    {selectedSession.customerName || selectedSession.phone}
                  </h3>
                  <p className="text-xs text-neutral-500">{selectedSession.phone}</p>
                  {selectedSession.assignedTo ? (
                    <p className="text-[11px] text-neutral-400">Assigned: {selectedSession.assignedName}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={assignToMe}
                    className="px-3 py-1.5 text-xs border rounded-full hover:bg-neutral-50 transition-colors"
                  >
                    Assign to me
                  </button>
                  <button
                    onClick={handleToggleMode}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full flex items-center gap-1.5 transition-colors ${
                      selectedSession.mode === "bot"
                        ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    }`}
                  >
                    {selectedSession.mode === "bot" ? (
                      <>
                        <FiCpu /> Bot Mode
                      </>
                    ) : (
                      <>
                        <FiUser /> Human Mode
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Order Card if customer has recent order */}
              {order ? (
                <Link
                  href={order.href}
                  className="mx-4 mt-3 bg-white border border-[var(--color-border)] rounded-lg px-4 py-3 text-sm shadow-sm hover:bg-neutral-50 transition-colors"
                >
                  <p className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                    Recent Customer Order (Click to open)
                  </p>
                  <p className="font-medium text-neutral-900">{order.orderId}</p>
                  <p className="text-neutral-500 text-xs">
                    {order.status} · {order.paymentMethod} · ₹{Number(order.total).toLocaleString("en-IN")}
                  </p>
                </Link>
              ) : null}

              {/* Chat Message History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-xs text-neutral-500 mt-10 bg-white/70 backdrop-blur py-3 px-4 rounded-xl mx-auto max-w-sm border border-neutral-200">
                    <p className="font-medium text-neutral-700 mb-1">No messages recorded yet</p>
                    <p>Type a message below to start communicating with this customer via WhatsApp.</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isOutbound =
                      msg.direction === "outbound" ||
                      msg.direction === "outgoing" ||
                      msg.direction === "admin";
                    return (
                      <div
                        key={msg.id || idx}
                        className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] p-3 rounded-xl shadow-sm ${
                            isOutbound
                              ? "bg-[#dcf8c6] rounded-tr-none text-neutral-900"
                              : "bg-white rounded-tl-none text-neutral-900"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                          <div className="flex justify-end items-center gap-1.5 mt-1 text-[10px] text-neutral-500">
                            {msg.sentBy === "bot" && <span className="text-blue-600 font-medium">Bot</span>}
                            {msg.sentBy === "admin" && <span className="text-emerald-700 font-medium">Admin</span>}
                            <span>
                              {msg.createdAt
                                ? new Date(msg.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : ""}
                            </span>
                            {isOutbound && <FiCheck size={11} className="text-emerald-600" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Saved Canned Replies & Compose Reply Bar */}
              <div className="p-3 bg-[#f0f2f5] space-y-2 border-t border-[var(--color-border)]">
                {canned.length > 0 ? (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    <span className="shrink-0 self-center text-[11px] text-neutral-500">Quick replies:</span>
                    {canned.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setReplyText(c.body)}
                        className="shrink-0 px-3 py-1 text-[11px] bg-white border border-neutral-200 rounded-full hover:bg-neutral-50 transition-colors shadow-2xs"
                      >
                        {c.title}
                      </button>
                    ))}
                  </div>
                ) : null}
                <form onSubmit={handleSendReply} className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type message to send via WhatsApp..."
                    className="flex-1 px-4 py-2 text-sm border border-transparent rounded-full focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white shadow-sm"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="p-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    <FiSend size={15} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 bg-[#f8f9fa] p-8 space-y-3">
              <FiMessageCircle size={52} className="opacity-20" />
              <p className="text-sm font-medium text-neutral-600">Select a conversation or start a new chat</p>
              <p className="text-xs text-neutral-400 max-w-sm text-center">
                When customers chat with the bot or when orders update, their conversation updates live here.
              </p>
              <button
                type="button"
                onClick={() => setNewChatModalOpen(true)}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors shadow-sm"
              >
                <FiPlus size={13} /> Start New Conversation
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
