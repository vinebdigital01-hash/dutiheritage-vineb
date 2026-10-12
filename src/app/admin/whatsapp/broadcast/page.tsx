"use client";

import { useState, useEffect } from "react";
import { AdminButton, AdminInput, AdminSelect, AdminTextarea, useToast } from "@/components/admin/ui";
import { adminFetch, AdminApiError } from "@/lib/admin-api";
import { ImageUploader } from "@/components/admin/ImageUploader";
import Link from "next/link";
import Image from "next/image";
import {
  FiSend,
  FiImage,
  FiLink,
  FiMessageSquare,
  FiSmartphone,
  FiTrash2,
  FiPlus,
  FiExternalLink,
  FiCheck,
  FiClock,
  FiUsers,
  FiInfo,
} from "react-icons/fi";

type ButtonMode = "none" | "cta" | "reply";

export default function BroadcastPage() {
  const { show, Toast } = useToast();

  // Audience
  const [audience, setAudience] = useState<"all" | "active" | "custom">("all");
  const [phones, setPhones] = useState("");

  // Kind
  const [kind, setKind] = useState<"rich" | "template">("rich");
  const [templateName, setTemplateName] = useState("");

  // Content
  const [header, setHeader] = useState("");
  const [message, setMessage] = useState("");
  const [footer, setFooter] = useState("Duti Heritage • Handcrafted Luxury");
  const [imageUrl, setImageUrl] = useState("");
  const [manualImageUrl, setManualImageUrl] = useState("");

  // Interactive Buttons
  const [buttonMode, setButtonMode] = useState<ButtonMode>("cta");
  const [ctaText, setCtaText] = useState("Shop Now");
  const [ctaUrl, setCtaUrl] = useState("https://dutiheritage.com");
  const [quickReplies, setQuickReplies] = useState<string[]>([
    "Explore Sarees",
    "Track My Order",
  ]);

  // States
  const [loading, setLoading] = useState(false);
  const [testNumber, setTestNumber] = useState("");
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [reason, setReason] = useState("");

  const checkStatus = () => {
    setConfigured(null);
    adminFetch<{ configured: boolean; reason?: string }>("/api/bot/broadcast")
      .then((d) => {
        setConfigured(d.configured);
        setReason(d.reason || "");
      })
      .catch(() => {
        setConfigured(false);
        setReason("Could not check WhatsApp connection. Sign in again if you were logged out.");
      });
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleAddQuickReply = () => {
    if (quickReplies.length < 3) {
      setQuickReplies([...quickReplies, `Option ${quickReplies.length + 1}`]);
    }
  };

  const handleRemoveQuickReply = (index: number) => {
    setQuickReplies(quickReplies.filter((_, i) => i !== index));
  };

  const handleQuickReplyChange = (index: number, val: string) => {
    const updated = [...quickReplies];
    updated[index] = val;
    setQuickReplies(updated);
  };

  const activeImage = imageUrl || manualImageUrl;

  const buildPayload = (overrideAudience?: "all" | "active" | "custom", overridePhones?: string) => {
    if (kind === "template") {
      return {
        audience: overrideAudience || audience,
        phones: overrideAudience === "custom" ? overridePhones : (audience === "custom" ? phones : undefined),
        message: templateName.trim(),
        type: "template",
      };
    }

    const payload: Record<string, any> = {
      audience: overrideAudience || audience,
      phones: overrideAudience === "custom" ? overridePhones : (audience === "custom" ? phones : undefined),
      message: message.trim(),
      header: header.trim() || undefined,
      footer: footer.trim() || undefined,
      imageUrl: activeImage.trim() || undefined,
      buttonType: buttonMode,
      type: "text",
    };

    if (buttonMode === "cta") {
      payload.ctaText = ctaText.trim().slice(0, 20) || "Visit Website";
      payload.ctaUrl = ctaUrl.trim() || "https://dutiheritage.com";
    } else if (buttonMode === "reply") {
      payload.buttons = quickReplies
        .filter((t) => t.trim().length > 0)
        .slice(0, 3)
        .map((t, idx) => ({
          id: `btn_${idx + 1}`,
          title: t.trim().slice(0, 20),
        }));
    }

    return payload;
  };

  const validateForm = () => {
    if (!configured) {
      show("WhatsApp is not connected. Connect bot first.", "error");
      return false;
    }
    if (kind === "template") {
      if (!templateName.trim()) {
        show("Please enter the approved template name.", "error");
        return false;
      }
      return true;
    }
    if (!message.trim() && !activeImage.trim()) {
      show("Please enter a message or upload a photo.", "error");
      return false;
    }
    if (buttonMode === "cta" && !ctaUrl.trim()) {
      show("Please enter a website link for the CTA button.", "error");
      return false;
    }
    if (buttonMode === "reply" && quickReplies.filter((r) => r.trim()).length === 0) {
      show("Please add at least one button title.", "error");
      return false;
    }
    return true;
  };

  const sendBroadcast = async (isTest = false, specificPhone = "") => {
    if (!validateForm()) return;

    if (!isTest && audience === "custom" && !phones.trim()) {
      show("Enter at least one phone number to send to.", "error");
      return;
    }

    if (isTest && !specificPhone.trim()) {
      show("Enter your phone number for the test.", "error");
      return;
    }

    setLoading(true);
    try {
      const payload = isTest
        ? buildPayload("custom", specificPhone)
        : buildPayload();

      const data = await adminFetch<{ message?: string; sent?: number; failed?: number }>(
        "/api/bot/broadcast",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      show(data.message || `Successfully sent to ${data.sent || 0} recipient(s)!`);
      if (isTest) {
        setIsTestModalOpen(false);
      }
    } catch (e) {
      show(e instanceof AdminApiError ? e.message : "Broadcast failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {Toast}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl text-neutral-900 tracking-wide">
            WhatsApp Broadcast & Interactive Campaigns
          </h1>
          <p className="text-[13px] text-neutral-600 mt-1">
            Send rich broadcast messages with photos, clickable website link buttons (CTA), and quick replies.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/whatsapp"
            className="text-xs px-3 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-100 text-neutral-700 transition"
          >
            Live Inbox
          </Link>
          <Link
            href="/admin/whatsapp/logs"
            className="text-xs px-3 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-100 text-neutral-700 transition"
          >
            Message Logs
          </Link>
          <button
            type="button"
            onClick={checkStatus}
            className="text-xs text-neutral-500 hover:text-black underline pl-1"
          >
            Check status
          </button>
        </div>
      </div>

      {/* Bot Connection Banner */}
      {configured === false && (
        <div className="text-[13px] text-[#8B3A2A] bg-[#8B3A2A]/5 border border-[#8B3A2A]/20 p-4 rounded-xl flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FiInfo className="text-lg shrink-0" />
            <span>{reason || "WhatsApp bot is not connected. Broadcasts cannot be delivered."}</span>
          </div>
          <button
            type="button"
            onClick={checkStatus}
            className="text-xs font-semibold underline shrink-0 ml-3"
          >
            Retry Connection
          </button>
        </div>
      )}
      {configured === true && (
        <div className="text-[13px] text-emerald-900 bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium">
              WhatsApp Meta Cloud Bot is active & connected. Ready to send rich interactive broadcasts!
            </span>
          </div>
          <div className="text-xs text-emerald-800 bg-emerald-100/70 px-2.5 py-1 rounded-md font-mono">
            Rate Limit: Max 200 numbers / blast
          </div>
        </div>
      )}

      {/* Main 2-Column Grid: Form on Left, Live Smartphone Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Audience */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900 uppercase tracking-wider">
              <FiUsers className="text-base text-neutral-500" />
              <span>1. Target Audience</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setAudience("all")}
                className={`p-3 text-left rounded-xl border transition text-xs font-medium ${
                  audience === "all"
                    ? "border-black bg-neutral-900 text-white shadow-sm"
                    : "border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700"
                }`}
              >
                <div className="font-semibold text-[13px]">All Customers</div>
                <div className="text-[11px] opacity-80 mt-0.5">With phone in DB (up to 200)</div>
              </button>

              <button
                type="button"
                onClick={() => setAudience("active")}
                className={`p-3 text-left rounded-xl border transition text-xs font-medium ${
                  audience === "active"
                    ? "border-black bg-neutral-900 text-white shadow-sm"
                    : "border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700"
                }`}
              >
                <div className="font-semibold text-[13px]">Active (24h)</div>
                <div className="text-[11px] opacity-80 mt-0.5">Chatted in last 24 hours</div>
              </button>

              <button
                type="button"
                onClick={() => setAudience("custom")}
                className={`p-3 text-left rounded-xl border transition text-xs font-medium ${
                  audience === "custom"
                    ? "border-black bg-neutral-900 text-white shadow-sm"
                    : "border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700"
                }`}
              >
                <div className="font-semibold text-[13px]">Specific Numbers</div>
                <div className="text-[11px] opacity-80 mt-0.5">Custom phone list</div>
              </button>
            </div>

            {audience === "custom" && (
              <div className="space-y-1.5 pt-1">
                <AdminTextarea
                  label="Enter Phone Numbers (comma, space, or newline separated)"
                  value={phones}
                  onChange={(e) => setPhones(e.target.value)}
                  placeholder="9876543210, 919876543210&#10;9812345678"
                  rows={3}
                />
                <p className="text-[11px] text-neutral-500">
                  Tip: 10-digit Indian numbers will automatically be prefixed with 91.
                </p>
              </div>
            )}
          </div>

          {/* Section 2: Format & Content */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900 uppercase tracking-wider">
                <FiMessageSquare className="text-base text-neutral-500" />
                <span>2. Message Format & Content</span>
              </div>
              <div className="flex bg-neutral-100 p-1 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setKind("rich")}
                  className={`px-3 py-1 rounded-md transition font-medium ${
                    kind === "rich" ? "bg-white text-black shadow-sm" : "text-neutral-500 hover:text-black"
                  }`}
                >
                  Interactive / Rich
                </button>
                <button
                  type="button"
                  onClick={() => setKind("template")}
                  className={`px-3 py-1 rounded-md transition font-medium ${
                    kind === "template" ? "bg-white text-black shadow-sm" : "text-neutral-500 hover:text-black"
                  }`}
                >
                  Meta Template
                </button>
              </div>
            </div>

            {kind === "template" ? (
              <div className="space-y-3">
                <AdminInput
                  label="Approved WhatsApp Template Name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g. festive_offer_broadcast or order_update"
                />
                <p className="text-[12px] text-neutral-500">
                  Must be an active, approved template name registered in your Meta WhatsApp Manager.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Header Tagline */}
                <div>
                  <AdminInput
                    label="Header Headline (Optional - Shown in Bold at top)"
                    value={header}
                    onChange={(e) => setHeader(e.target.value)}
                    placeholder="e.g. Exclusive Festive Collection Drop ✨"
                    maxLength={60}
                  />
                  <div className="text-[11px] text-neutral-400 text-right mt-0.5">{header.length}/60</div>
                </div>

                {/* Body Text */}
                <div>
                  <AdminTextarea
                    label="Message Body (Text with emojis & styling)"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Hi! Check out our handcrafted pure tissue and silk sarees with flat 15% festive discount today only. Tap below to view the exclusive collection!"
                    rows={4}
                  />
                  <p className="text-[11px] text-neutral-400 mt-1 flex justify-between">
                    <span>Use *bold* for bold text, _italic_ for italics.</span>
                    <span>{message.length} chars</span>
                  </p>
                </div>

                {/* Photo / Banner Upload */}
                <div className="border-t border-neutral-100 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] tracking-[1px] uppercase font-semibold text-neutral-700 flex items-center gap-1.5">
                      <FiImage className="text-neutral-500" />
                      Attach Photo / Poster (Optional)
                    </span>
                    {activeImage && (
                      <button
                        type="button"
                        onClick={() => {
                          setImageUrl("");
                          setManualImageUrl("");
                        }}
                        className="text-xs text-red-600 hover:underline flex items-center gap-1"
                      >
                        <FiTrash2 /> Remove Photo
                      </button>
                    )}
                  </div>

                  <ImageUploader
                    label="Upload image banner"
                    value={imageUrl}
                    onChange={(url) => setImageUrl(url)}
                    folder="dutiheritage/whatsapp"
                    forceJpeg={true}
                  />

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-neutral-400">or paste image URL:</span>
                    <input
                      type="url"
                      value={manualImageUrl}
                      onChange={(e) => setManualImageUrl(e.target.value)}
                      placeholder="https://... image link"
                      className="text-xs border border-neutral-300 rounded-lg px-2.5 py-1.5 flex-1 focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                {/* Footer Text */}
                <div className="border-t border-neutral-100 pt-3">
                  <AdminInput
                    label="Footer Subtext (Optional - Shown in light gray)"
                    value={footer}
                    onChange={(e) => setFooter(e.target.value)}
                    placeholder="e.g. Duti Heritage • Pure Elegance"
                    maxLength={60}
                  />
                  <div className="text-[11px] text-neutral-400 text-right mt-0.5">{footer.length}/60</div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Interactive Buttons (Only in Rich mode) */}
          {kind === "rich" && (
            <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900 uppercase tracking-wider">
                  <FiLink className="text-base text-neutral-500" />
                  <span>3. Interactive Buttons</span>
                </div>
                <span className="text-[11px] text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                  No typing required for customers
                </span>
              </div>

              {/* Button Type Selector Tabs */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setButtonMode("none")}
                  className={`p-3 text-center rounded-xl border text-xs font-semibold transition ${
                    buttonMode === "none"
                      ? "border-black bg-neutral-900 text-white"
                      : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  No Button
                </button>

                <button
                  type="button"
                  onClick={() => setButtonMode("cta")}
                  className={`p-3 text-center rounded-xl border text-xs font-semibold transition flex flex-col items-center justify-center gap-1 ${
                    buttonMode === "cta"
                      ? "border-black bg-neutral-900 text-white"
                      : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <FiExternalLink /> Website Link (CTA)
                  </span>
                  <span className="text-[10px] opacity-75 font-normal">Opens URL in browser</span>
                </button>

                <button
                  type="button"
                  onClick={() => setButtonMode("reply")}
                  className={`p-3 text-center rounded-xl border text-xs font-semibold transition flex flex-col items-center justify-center gap-1 ${
                    buttonMode === "reply"
                      ? "border-black bg-neutral-900 text-white"
                      : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <FiMessageSquare /> Quick Reply
                  </span>
                  <span className="text-[10px] opacity-75 font-normal">Up to 3 reply buttons</span>
                </button>
              </div>

              {/* Mode A: CTA Button Settings */}
              {buttonMode === "cta" && (
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <AdminInput
                        label="Button Title (Max 20 chars)"
                        value={ctaText}
                        onChange={(e) => setCtaText(e.target.value)}
                        placeholder="e.g. Shop Now / View Collection"
                        maxLength={20}
                      />
                      <div className="text-[11px] text-neutral-400 text-right mt-0.5">{ctaText.length}/20</div>
                    </div>
                    <div>
                      <AdminInput
                        label="Website URL (Starts with https://)"
                        value={ctaUrl}
                        onChange={(e) => setCtaUrl(e.target.value)}
                        placeholder="https://dutiheritage.com/collections/saree"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    When the customer taps this button on WhatsApp, it directly opens this website link in their phone browser.
                  </p>
                </div>
              )}

              {/* Mode B: Quick Reply Buttons */}
              {buttonMode === "reply" && (
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-3">
                  <div className="space-y-2">
                    {quickReplies.map((reply, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs font-mono text-neutral-400 w-5">#{idx + 1}</span>
                        <input
                          type="text"
                          value={reply}
                          maxLength={20}
                          onChange={(e) => handleQuickReplyChange(idx, e.target.value)}
                          placeholder={`Button ${idx + 1} Title`}
                          className="flex-1 text-sm border border-neutral-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-black"
                        />
                        <span className="text-[11px] text-neutral-400 w-10 text-right">{reply.length}/20</span>
                        {quickReplies.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveQuickReply(idx)}
                            className="text-neutral-400 hover:text-red-600 p-1"
                            title="Remove button"
                          >
                            <FiTrash2 />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {quickReplies.length < 3 && (
                    <button
                      type="button"
                      onClick={handleAddQuickReply}
                      className="text-xs text-neutral-700 hover:text-black font-semibold flex items-center gap-1.5 py-1 px-2.5 rounded-lg border border-dashed border-neutral-300 hover:border-black transition"
                    >
                      <FiPlus /> Add another button (max 3)
                    </button>
                  )}
                  <p className="text-[11px] text-neutral-500">
                    When tapped, the reply text is sent back to the bot, which triggers automatic category exploration or assistance.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons: Send & Test */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <AdminButton
              onClick={() => sendBroadcast(false)}
              disabled={loading || configured !== true}
              className="flex-1 sm:flex-initial !px-8 !py-3 !text-[13px] bg-black text-white hover:bg-neutral-800"
            >
              {loading ? (
                "Sending Broadcast…"
              ) : (
                <span className="flex items-center gap-2">
                  <FiSend /> Send Broadcast Now
                </span>
              )}
            </AdminButton>

            <button
              type="button"
              disabled={loading || configured !== true}
              onClick={() => setIsTestModalOpen(true)}
              className="px-5 py-3 text-[12px] tracking-[1px] uppercase font-semibold border border-neutral-300 hover:border-black rounded-lg transition bg-white text-neutral-800 flex items-center gap-2 disabled:opacity-50"
            >
              <FiSmartphone /> Send Test to My Phone
            </button>
          </div>
        </div>

        {/* Right Column: Live WhatsApp Smartphone Screen Mockup (5 cols) */}
        <div className="lg:col-span-5 sticky top-6">
          <div className="bg-neutral-900 rounded-[36px] p-3 shadow-2xl border-4 border-neutral-800 max-w-[360px] mx-auto">
            {/* Phone Screen Container */}
            <div className="bg-[#EFEAE2] rounded-[28px] overflow-hidden flex flex-col h-[580px] border border-neutral-700/50 shadow-inner">
              {/* WhatsApp App Header */}
              <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between shadow-md shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#075E54] font-serif font-bold text-xs shrink-0 overflow-hidden shadow">
                    DH
                  </div>
                  <div className="leading-tight">
                    <div className="font-semibold text-xs flex items-center gap-1">
                      <span>Duti Heritage</span>
                      <span className="bg-emerald-400 text-white rounded-full p-0.5 text-[8px]">✓</span>
                    </div>
                    <div className="text-[10px] text-emerald-200">Official Business Account</div>
                  </div>
                </div>
                <div className="text-[11px] font-mono opacity-80">9:41</div>
              </div>

              {/* Chat Canvas with WhatsApp Background Wallpaper */}
              <div
                className="flex-1 p-3 overflow-y-auto flex flex-col justify-end space-y-2"
                style={{
                  backgroundImage:
                    "radial-gradient(#d4cbbe 1px, transparent 1px), radial-gradient(#d4cbbe 1px, #EFEAE2 1px)",
                  backgroundSize: "20px 20px",
                  backgroundPosition: "0 0, 10px 10px",
                }}
              >
                {/* Outgoing Message Bubble */}
                <div className="max-w-[92%] ml-auto bg-[#E7FFDB] rounded-2xl rounded-tr-sm shadow-md overflow-hidden text-neutral-900 border border-[#d2f3c3]">
                  {/* Photo Header (if any) */}
                  {activeImage && (
                    <div className="relative w-full h-40 bg-neutral-200 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activeImage}
                        alt="Broadcast Banner"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Bubble Content Body */}
                  <div className="p-3 text-[12px] leading-relaxed space-y-1.5">
                    {/* Header Headline */}
                    {header && (
                      <div className="font-bold text-[13px] text-neutral-950 leading-snug">
                        {header}
                      </div>
                    )}

                    {/* Body Text */}
                    <div className="whitespace-pre-wrap text-neutral-800 break-words">
                      {message || (kind === "template" ? `[Template: ${templateName || "template_name"}]` : "Hi! Your message preview will appear here in real-time as you type.")}
                    </div>

                    {/* Footer Text */}
                    {footer && (
                      <div className="text-[10px] text-neutral-500 pt-1 border-t border-[#d2f3c3]">
                        {footer}
                      </div>
                    )}

                    {/* Time & Read Receipts */}
                    <div className="flex items-center justify-end gap-1 text-[9px] text-neutral-400 pt-0.5">
                      <span>12:00 PM</span>
                      <span className="text-[#34B7F1] font-bold">✓✓</span>
                    </div>
                  </div>

                  {/* Interactive Button Preview inside WhatsApp */}
                  {kind === "rich" && buttonMode === "cta" && (
                    <div className="border-t border-[#d2f3c3] bg-[#E7FFDB] hover:bg-[#dffad1] transition py-2.5 px-3 flex items-center justify-center gap-1.5 text-sky-600 font-semibold text-[12px] cursor-pointer">
                      <FiExternalLink className="text-xs" />
                      <span>{ctaText || "Shop Now"}</span>
                    </div>
                  )}
                </div>

                {/* Quick Reply Buttons rendered outside bubble (Native WhatsApp Style) */}
                {kind === "rich" && buttonMode === "reply" && quickReplies.length > 0 && (
                  <div className="space-y-1.5 max-w-[92%] ml-auto">
                    {quickReplies
                      .filter((r) => r.trim().length > 0)
                      .map((reply, idx) => (
                        <div
                          key={idx}
                          className="bg-white hover:bg-neutral-50 text-sky-600 text-[12px] font-semibold text-center py-2 px-3 rounded-xl shadow-sm border border-neutral-200 transition"
                        >
                          {reply}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Fake WhatsApp Bottom Bar */}
              <div className="bg-[#F0F2F5] px-3 py-2 flex items-center gap-2 border-t border-neutral-200 shrink-0">
                <div className="flex-1 bg-white rounded-full px-3 py-1.5 text-[11px] text-neutral-400 border border-neutral-200">
                  Type a message…
                </div>
                <div className="w-7 h-7 rounded-full bg-[#00A884] text-white flex items-center justify-center text-xs shadow">
                  <FiSend className="text-[10px] -ml-0.5" />
                </div>
              </div>
            </div>
          </div>
          <p className="text-center text-[11px] text-neutral-500 mt-2">
            Live Preview: Real-time rendering as seen by recipients
          </p>
        </div>
      </div>

      {/* Test Message Modal */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-neutral-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <FiSmartphone className="text-emerald-600" />
                Send Test Broadcast
              </h3>
              <button
                type="button"
                onClick={() => setIsTestModalOpen(false)}
                className="text-neutral-400 hover:text-black text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Before sending this campaign to your customers, test it on your own WhatsApp number to verify photos, formatting, and buttons!
            </p>

            <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-[11px] text-amber-900 leading-relaxed space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-amber-950">
                <span>⚠️ WhatsApp 24-Hour Policy Requirement</span>
              </div>
              <p>
                Meta WhatsApp Cloud API will <strong>only deliver</strong> custom interactive buttons and photos if this number has sent at least one message (like <strong>&quot;Hi&quot;</strong>) to your business bot in the last 24 hours.
              </p>
              <p className="text-amber-800 font-medium">
                👉 If you haven&apos;t messaged the bot today, send &quot;Hi&quot; from your phone to your store&apos;s WhatsApp first!
              </p>
            </div>

            <AdminInput
              label="Your Personal WhatsApp Number"
              value={testNumber}
              onChange={(e) => setTestNumber(e.target.value)}
              placeholder="e.g. 9870487659"
              autoFocus
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsTestModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-black rounded-lg border border-neutral-200"
              >
                Cancel
              </button>
              <AdminButton
                onClick={() => sendBroadcast(true, testNumber)}
                disabled={loading || !testNumber.trim()}
                className="!px-5 !py-2 !text-xs bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                {loading ? "Sending Test…" : "Send Test Message"}
              </AdminButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
