"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAppContext } from "@/context/AppContext";
import { FiUser, FiChevronLeft } from "react-icons/fi";
import { authHeaders } from "@/lib/checkout-client";

export default function ProfileSettingsPage() {
  const { user, userProfile } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
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
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers,
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to save profile");
      setSuccess("Profile updated successfully. Refreshing...");
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full p-4 md:p-8 lg:p-12 bg-white min-h-screen">
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

        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded text-[13px]">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded text-[13px]">{success}</div>}

        <form onSubmit={handleSave} className="flex flex-col gap-5">
          <div>
            <label className="block text-[12px] font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-300 rounded px-4 py-3 text-[14px] outline-none focus:border-black transition-colors bg-white" />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-gray-700 mb-1 flex justify-between">
              Email Address <span className="text-gray-400 font-normal">Cannot be changed</span>
            </label>
            <input type="email" disabled value={user?.email || ""} className="w-full border border-gray-200 rounded px-4 py-3 text-[14px] outline-none bg-gray-100 text-gray-500 cursor-not-allowed" />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-gray-700 mb-1">Phone Number</label>
            <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border border-gray-300 rounded px-4 py-3 text-[14px] outline-none focus:border-black transition-colors bg-white" placeholder="+91" />
          </div>

          <button type="submit" disabled={loading} className="w-full mt-4 bg-black text-white py-3.5 text-[12px] font-bold uppercase tracking-widest rounded transition-opacity hover:bg-gray-800 disabled:opacity-50">
            {loading ? "Saving Changes..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}