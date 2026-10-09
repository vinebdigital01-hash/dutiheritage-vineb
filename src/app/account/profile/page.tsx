"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAppContext } from "@/context/AppContext";
import { FiChevronLeft } from "react-icons/fi";
import { authHeaders } from "@/lib/checkout-client";
import { useConfirm } from "@/components/ConfirmDialog";
import { useStoreToast } from "@/components/ToastProvider";

export default function ProfileSettingsPage() {
  const { user, userProfile, setUserProfile } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [otpModal, setOtpModal] = useState<{ isOpen: boolean; type: "email" | "phone"; target: string } | null>(null);
  const [otp, setOtp] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || userProfile?.phone || "",
      });
    }
  }, [user, userProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");

    try {
      const headers = await authHeaders();

      // Check if email changed
      if (formData.email !== user?.email && formData.email) {
        const res = await fetch("/api/profile/update-contact/send", {
          method: "POST",
          headers,
          body: JSON.stringify({ target: formData.email, type: "email" }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed to send email OTP");
        setOtpModal({ isOpen: true, type: "email", target: formData.email });
        setLoading(false);
        return;
      }

      // Check if phone changed
      if (formData.phone !== (user?.phone || userProfile?.phone) && formData.phone) {
        const res = await fetch("/api/profile/update-contact/send", {
          method: "POST",
          headers,
          body: JSON.stringify({ target: formData.phone, type: "phone" }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed to send phone OTP");
        setOtpModal({ isOpen: true, type: "phone", target: formData.phone });
        setLoading(false);
        return;
      }

      // If only name changed
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers,
        body: JSON.stringify({ name: formData.name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error("Failed to save profile");
      if (data.profile) setUserProfile(data.profile);
      setSuccess("Profile updated.");
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpModal) return;
    setLoading(true);
    setError("");
    try {
      const headers = await authHeaders();
      const res = await fetch("/api/profile/update-contact/verify", {
        method: "POST",
        headers,
        body: JSON.stringify({ target: otpModal.target, type: otpModal.type, otp }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Invalid OTP");
      
      // Update name as well if changed
      if (formData.name !== user?.name) {
        await fetch("/api/profile", {
          method: "PUT",
          headers,
          body: JSON.stringify({ name: formData.name }),
        });
      }

      setSuccess("Contact updated.");
      setOtpModal(null);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Invalid OTP");
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full p-4 md:p-8 lg:p-12 bg-white min-h-screen relative">
      {/* OTP Modal */}
      {otpModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl max-w-sm w-full">
            <h2 className="text-lg font-bold uppercase mb-2">Verify {otpModal.type}</h2>
            <p className="text-[13px] text-gray-500 mb-4">
              Enter the 6-digit code sent to <strong>{otpModal.target}</strong>
            </p>
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3">
              <input 
                type="text" 
                maxLength={6} 
                required 
                value={otp} 
                onChange={(e) => setOtp(e.target.value)} 
                className="w-full border border-gray-300 rounded px-4 py-3 text-center tracking-[4px] outline-none focus:border-black"
                placeholder="123456"
              />
              {error && <div className="text-red-500 text-[12px]">{error}</div>}
              <button type="submit" disabled={loading} className="w-full bg-black text-white py-3 text-[12px] uppercase font-bold rounded">
                {loading ? "Verifying..." : "Verify & Save"}
              </button>
              <button type="button" onClick={() => setOtpModal(null)} className="text-[12px] text-gray-500 underline mt-2">
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 mb-8 border-b border-[var(--color-border)] pb-6">
        <Link href="/account" className="md:hidden p-2 -ml-2 rounded-full hover:bg-gray-100">
          <FiChevronLeft className="text-xl" />
        </Link>
        <h1 className="text-2xl md:text-3xl font-serif tracking-[2px] uppercase">Profile Settings</h1>
      </div>

      <div className="max-w-[600px] border border-[var(--color-border)] rounded-xl p-6 md:p-8 bg-gray-50/50">
        <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-200">
          <div className="w-16 h-16 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center text-2xl font-serif border border-gray-300">
            {user?.name?.split(" ").map(n => n[0]).join("").substring(0,2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-[16px] font-bold uppercase tracking-wider">{user?.name}</h2>
            <span className="text-[11px] font-medium tracking-widest text-green-700 bg-green-100 px-2 py-0.5 rounded-full mt-1 inline-block">VERIFIED</span>
          </div>
        </div>

        {error && !otpModal && <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded text-[13px]">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded text-[13px]">{success}</div>}

        <form onSubmit={handleSave} className="flex flex-col gap-5">
          <div>
            <label className="block text-[12px] font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-300 rounded px-4 py-3 text-[14px] outline-none focus:border-black transition-colors bg-white" />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-gray-700 mb-1">Email Address</label>
            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border border-gray-300 rounded px-4 py-3 text-[14px] outline-none focus:border-black transition-colors bg-white" placeholder="your@email.com" />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-gray-700 mb-1">Phone Number</label>
            <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border border-gray-300 rounded px-4 py-3 text-[14px] outline-none focus:border-black transition-colors bg-white" placeholder="+91" />
          </div>

          <button type="submit" disabled={loading} className="w-full mt-4 bg-black text-white py-3.5 text-[12px] font-bold uppercase tracking-widest rounded transition-opacity hover:bg-gray-800 disabled:opacity-50">
            {loading ? "Processing..." : "Save Changes"}
          </button>
        </form>
      </div>

      <LinkAnotherAccount
        onLinked={(msg) => {
          setSuccess(msg);
          setError("");
        }}
      />

      <PrivacyRequests />
    </div>
  );
}

function LinkAnotherAccount({ onLinked }: { onLinked: (msg: string) => void }) {
  const [type, setType] = useState<"email" | "phone">("email");
  const [target, setTarget] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"idle" | "sent">("idle");
  const [masked, setMasked] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const headers = await authHeaders();
      const res = await fetch("/api/account/merge/send", {
        method: "POST",
        headers,
        body: JSON.stringify({ target, type }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not send code");
      setMasked(data.masked || target);
      setStep("sent");
      setOtp("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not send code");
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const headers = await authHeaders();
      const res = await fetch("/api/account/merge/verify", {
        method: "POST",
        headers,
        body: JSON.stringify({ otp }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Invalid code");
      setStep("idle");
      setTarget("");
      setOtp("");
      onLinked(data.message || "Accounts linked.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Invalid code");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-[600px] mt-10 border border-[var(--color-border)] rounded-xl p-6 md:p-8 bg-gray-50/50">
      <h2 className="text-[14px] font-bold uppercase tracking-wider mb-2">Link another account</h2>
      <p className="text-[13px] text-gray-600 mb-4">
        Ordered as a guest with a different email or phone? Prove you own it with a one-time code
        and we will move those orders, wishlist items, and addresses into this account.
      </p>
      {err ? <p className="text-[13px] text-red-600 mb-3">{err}</p> : null}

      {step === "idle" ? (
        <form onSubmit={sendCode} className="flex flex-col gap-3">
          <div className="flex gap-2 text-[12px] uppercase tracking-wider font-medium">
            <button
              type="button"
              onClick={() => setType("email")}
              className={`px-3 py-1.5 rounded border ${type === "email" ? "border-black bg-black text-white" : "border-gray-300 bg-white"}`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => setType("phone")}
              className={`px-3 py-1.5 rounded border ${type === "phone" ? "border-black bg-black text-white" : "border-gray-300 bg-white"}`}
            >
              Phone
            </button>
          </div>
          <input
            type={type === "email" ? "email" : "tel"}
            required
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder={type === "email" ? "guest@email.com" : "+91…"}
            className="w-full border border-gray-300 rounded px-4 py-3 text-[14px] outline-none focus:border-black bg-white"
          />
          <button
            type="submit"
            disabled={busy || !target.trim()}
            className="w-full bg-black text-white py-3 text-[12px] font-bold uppercase tracking-widest rounded disabled:opacity-50"
          >
            {busy ? "Sending…" : "Send code"}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="flex flex-col gap-3">
          <p className="text-[13px] text-gray-600">
            Enter the 6-digit code sent to <strong>{masked}</strong>
          </p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="w-full border border-gray-300 rounded px-4 py-3 text-center tracking-[4px] outline-none focus:border-black bg-white"
            placeholder="123456"
          />
          <button
            type="submit"
            disabled={busy || otp.length !== 6}
            className="w-full bg-black text-white py-3 text-[12px] font-bold uppercase tracking-widest rounded disabled:opacity-50"
          >
            {busy ? "Linking…" : "Verify & link"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("idle");
              setOtp("");
              setErr("");
            }}
            className="text-[12px] text-gray-500 underline"
          >
            Use a different email or phone
          </button>
        </form>
      )}
    </div>
  );
}

function PrivacyRequests() {
  const { userProfile, setUserProfile } = useAppContext();
  const { confirm, ConfirmDialog } = useConfirm();
  const toast = useStoreToast();
  const [busy, setBusy] = useState<"export" | "delete" | null>(null);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const downloadData = async () => {
    setBusy("export");
    setErr("");
    setMsg("");
    try {
      const headers = await authHeaders();
      const res = await fetch("/api/account/data-export", { method: "POST", headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not export data");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `duti-heritage-my-data.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMsg("Download started.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not export data");
    } finally {
      setBusy(null);
    }
  };

  const requestDelete = async () => {
    const ok = await confirm({
      title: "Request account deletion",
      description:
        "Staff will finish this by hand. Orders already placed stay in our records.",
      confirmText: "Request deletion",
      confirmStyle: "danger",
    });
    if (!ok) return;
    setBusy("delete");
    setErr("");
    setMsg("");
    try {
      const headers = await authHeaders();
      const res = await fetch("/api/account/delete-request", {
        method: "POST",
        headers,
        body: JSON.stringify({ note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not submit request");
      if (data.profile) setUserProfile(data.profile);
      setMsg(data.message || "Request submitted.");
      toast.show(data.message || "Request submitted.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not submit request");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="max-w-[600px] mt-10 border border-[var(--color-border)] rounded-xl p-6 md:p-8">
      {ConfirmDialog}
      <h2 className="text-[14px] font-bold uppercase tracking-wider mb-2">Your data</h2>
      <p className="text-[13px] text-gray-600 mb-4">
        Download a copy of your profile, orders, and wishlist, or ask us to delete your account.
        Staff complete deletion by hand — we do not wipe orders automatically.
      </p>
      {msg ? <p className="text-[13px] text-green-700 mb-3">{msg}</p> : null}
      {err ? <p className="text-[13px] text-red-600 mb-3">{err}</p> : null}
      {userProfile?.deleteRequestedAt ? (
        <p className="text-[13px] text-amber-800 mb-4">
          Delete request received on{" "}
          {new Date(userProfile.deleteRequestedAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
          . We will write when it is done.
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => void downloadData()}
        disabled={busy !== null}
        className="w-full mb-3 border border-black py-3 text-[12px] font-bold uppercase tracking-widest rounded hover:bg-gray-50 disabled:opacity-50"
      >
        {busy === "export" ? "Preparing…" : "Download my data"}
      </button>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional note for staff"
        className="w-full border border-gray-300 rounded px-4 py-3 text-[14px] mb-3 min-h-[72px]"
      />
      <button
        type="button"
        onClick={() => void requestDelete()}
        disabled={busy !== null || Boolean(userProfile?.deleteRequestedAt)}
        className="w-full border border-red-200 text-red-700 bg-red-50 py-3 text-[12px] font-bold uppercase tracking-widest rounded disabled:opacity-50"
      >
        {busy === "delete" ? "Submitting…" : "Request account deletion"}
      </button>
    </div>
  );
}
