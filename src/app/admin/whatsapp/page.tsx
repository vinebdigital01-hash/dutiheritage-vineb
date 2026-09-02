"use client";

import { useState, useEffect, useRef } from "react";
import { FiSend, FiUser, FiCpu, FiMessageCircle, FiClock, FiCheck } from "react-icons/fi";
import { adminFetch } from "@/lib/admin-api";

type Session = {
  phone: string;
  customerName?: string;
  unreadCount: number;
  lastMessageAt: string;
  mode: "bot" | "human";
};

type ChatMessage = {
  id: string;
  direction: "inbound" | "outbound" | "admin";
  body: string;
  createdAt: string;
  messageType: string;
  sentBy: "user" | "bot" | "admin";
};

export default function WhatsAppInboxPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchSessions = async () => {
    try {
      const data = await adminFetch<any>("/api/bot/chat");
      if (data) {
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (phone: string) => {
    try {
      const data = await adminFetch<any>(`/api/bot/chat/${phone}`);
      if (data) {
        setMessages(data.messages || []);
        scrollToBottom();
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchMessages(selectedSession.phone);
      const interval = setInterval(() => fetchMessages(selectedSession.phone), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedSession]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedSession) return;

    const newMessage = replyText;
    setReplyText("");

    // Optimistic update
    const tempMsg: ChatMessage = {
      id: Date.now().toString(),
      direction: "admin",
      body: newMessage,
      createdAt: new Date().toISOString(),
      messageType: "text",
      sentBy: "admin",
    };
    setMessages((prev) => [...prev, tempMsg]);
    scrollToBottom();

    try {
      await fetch(`/api/bot/chat/${selectedSession.phone}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          direction: "admin",
          body: newMessage,
          sentBy: "admin",
          messageType: "text",
        }),
      });
      // fetchMessages(selectedSession.phone); // let polling handle it
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleToggleMode = async () => {
    if (!selectedSession) return;
    const newMode = selectedSession.mode === "bot" ? "human" : "bot";
    
    // Optimistic update
    setSelectedSession({ ...selectedSession, mode: newMode });
    setSessions(prev => prev.map(s => s.phone === selectedSession.phone ? { ...s, mode: newMode } : s));

    try {
      await fetch(`/api/bot/chat/${selectedSession.phone}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: newMode }),
      });
    } catch (error) {
      console.error("Error toggling mode:", error);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-white rounded-xl shadow-sm border border-[var(--color-border)] overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        {/* Left Pane - Sessions */}
        <div className="w-1/3 border-r border-[var(--color-border)] flex flex-col bg-[#f8f9fa]">
          <div className="p-4 border-b border-[var(--color-border)] bg-white">
            <h2 className="text-lg font-serif tracking-[1px] uppercase flex items-center gap-2">
              <FiMessageCircle /> Live Inbox
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sessions.length === 0 ? (
              <div className="p-8 text-center text-sm text-neutral-500">
                No active conversations.
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.phone}
                  onClick={() => setSelectedSession(session)}
                  className={`p-4 border-b border-[var(--color-border)] cursor-pointer hover:bg-neutral-100 transition-colors ${
                    selectedSession?.phone === session.phone ? "bg-neutral-100" : ""
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm">
                      {session.customerName || session.phone}
                    </span>
                    {session.unreadCount > 0 && (
                      <span className="bg-black text-white text-[10px] px-2 py-0.5 rounded-full">
                        {session.unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      {session.mode === "bot" ? <FiCpu size={12}/> : <FiUser size={12}/>}
                      {session.mode === "bot" ? "Bot" : "Human"}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiClock size={12} />
                      {new Date(session.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Pane - Chat */}
        <div className="flex-1 flex flex-col bg-[#efeae2]">
          {selectedSession ? (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-white border-b border-[var(--color-border)] flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{selectedSession.customerName || selectedSession.phone}</h3>
                  <p className="text-xs text-neutral-500">{selectedSession.phone}</p>
                </div>
                <button
                  onClick={handleToggleMode}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full flex items-center gap-2 transition-colors ${
                    selectedSession.mode === "bot"
                      ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  }`}
                >
                  {selectedSession.mode === "bot" ? (
                    <><FiCpu /> Bot Mode (Click to pause)</>
                  ) : (
                    <><FiUser /> Human Mode (Click to resume bot)</>
                  )}
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-sm text-neutral-500 mt-10 bg-white/50 py-2 rounded-lg mx-auto max-w-xs">
                    No messages in this conversation yet.
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isOutbound = msg.direction === "outbound" || msg.direction === "admin";
                    return (
                      <div
                        key={msg.id || idx}
                        className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-lg shadow-sm ${
                            isOutbound
                              ? "bg-[#dcf8c6] rounded-tr-none"
                              : "bg-white rounded-tl-none"
                          }`}
                        >
                          <p className="text-sm text-black whitespace-pre-wrap">{msg.body}</p>
                          <div className="flex justify-end items-center gap-1 mt-1 text-[10px] text-neutral-500">
                            {msg.sentBy === "bot" && <span>Bot</span>}
                            {msg.sentBy === "admin" && <span>Admin</span>}
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isOutbound && <FiCheck size={10} />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-3 bg-[#f0f2f5]">
                <form onSubmit={handleSendReply} className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 text-sm border border-transparent rounded-full focus:outline-none focus:ring-1 focus:ring-green-500 bg-white shadow-sm"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    <FiSend />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 bg-[#f8f9fa]">
              <FiMessageCircle size={48} className="mb-4 opacity-20" />
              <p>Select a conversation to view chat</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
