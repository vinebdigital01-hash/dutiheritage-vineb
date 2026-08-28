"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAppContext } from "@/context/AppContext";
import { FiMapPin, FiPlus, FiEdit2, FiChevronLeft } from "react-icons/fi";
import { authHeaders } from "@/lib/checkout-client";
import { State, City } from "country-state-city";

export default function MyAddressesPage() {
  const { userProfile, user } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  
  const [formData, setFormData] = useState({
    address: "",
    apartment: "",
    city: "",
    state: "",
    pinCode: "",
    country: "IN",
  });

  const [availableStates, setAvailableStates] = useState(State.getStatesOfCountry("IN"));
  const [availableCities, setAvailableCities] = useState<any[]>([]);

  useEffect(() => {
    if (userProfile) {
      setFormData({
        address: userProfile.address || "",
        apartment: userProfile.apartment || "",
        city: userProfile.city || "",
        state: userProfile.state || "",
        pinCode: userProfile.pinCode || "",
        country: userProfile.country || "IN",
      });
    }
  }, [userProfile]);

  useEffect(() => {
    if (formData.state) {
      setAvailableCities(City.getCitiesOfState("IN", formData.state));
    } else {
      setAvailableCities([]);
    }
  }, [formData.state]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    try {
      const headers = await authHeaders();
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers,
        body: JSON.stringify({ address: formData }),
      });
      if (!res.ok) throw new Error("Failed to save address");
      setSuccess("Address saved successfully. Please refresh the page or it will automatically sync.");
      setIsEditing(false);
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const hasAddress = Boolean(userProfile?.address || userProfile?.pinCode);

  return (
    <div className="w-full h-full p-4 md:p-8 lg:p-12 bg-white min-h-screen">
      <div className="flex items-center gap-4 mb-8 border-b border-[var(--color-border)] pb-6">
        <Link href="/account" className="md:hidden p-2 -ml-2 rounded-full hover:bg-gray-100">
          <FiChevronLeft className="text-xl" />
        </Link>
        <h1 className="text-2xl md:text-3xl font-serif tracking-[2px] uppercase">My Addresses</h1>
      </div>

      {isEditing ? (
        <div className="max-w-[600px] border border-[var(--color-border)] rounded-xl p-6 bg-gray-50/50">
          <h2 className="text-[14px] font-bold uppercase tracking-wider mb-6">Delivery Address</h2>
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-1">Street Address</label>
              <input type="text" required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full border border-gray-300 rounded px-4 py-3 text-[14px] outline-none focus:border-black transition-colors bg-white" placeholder="House no, Street name, Area" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-1">Apartment, suite, etc. (optional)</label>
              <input type="text" value={formData.apartment} onChange={e => setFormData({...formData, apartment: e.target.value})} className="w-full border border-gray-300 rounded px-4 py-3 text-[14px] outline-none focus:border-black transition-colors bg-white" placeholder="Apartment, suite, etc." />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1">State</label>
                <select required value={formData.state} onChange={e => setFormData({...formData, state: e.target.value, city: ""})} className="w-full border border-gray-300 rounded px-4 py-3 text-[14px] outline-none focus:border-black transition-colors bg-white">
                  <option value="">Select State</option>
                  {availableStates.map((s) => (
                    <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1">City</label>
                {availableCities.length > 0 ? (
                  <select required value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full border border-gray-300 rounded px-4 py-3 text-[14px] outline-none focus:border-black transition-colors bg-white">
                    <option value="">Select City</option>
                    {availableCities.map((c) => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                ) : (
                  <input type="text" required value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full border border-gray-300 rounded px-4 py-3 text-[14px] outline-none focus:border-black transition-colors bg-white" placeholder="City" />
                )}
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-1">PIN Code</label>
              <input type="text" required value={formData.pinCode} onChange={e => setFormData({...formData, pinCode: e.target.value})} className="w-full border border-gray-300 rounded px-4 py-3 text-[14px] outline-none focus:border-black transition-colors bg-white" placeholder="6-digit PIN" maxLength={6} pattern="[0-9]{6}" />
            </div>

            <div className="flex gap-4 mt-4">
              <button type="submit" disabled={loading} className="flex-1 bg-black text-white py-3.5 text-[12px] font-bold uppercase tracking-widest rounded transition-opacity hover:bg-gray-800 disabled:opacity-50">
                {loading ? "Saving..." : "Save Address"}
              </button>
              <button type="button" onClick={() => setIsEditing(false)} className="flex-1 border border-black text-black py-3.5 text-[12px] font-bold uppercase tracking-widest rounded transition-colors hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hasAddress ? (
            <div className="border-2 border-black rounded-xl p-6 bg-white relative shadow-sm">
              <span className="absolute -top-3 left-6 bg-black text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                Default
              </span>
              <div className="flex items-start gap-4 mb-4 mt-2">
                <FiMapPin className="text-xl text-gray-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[15px] mb-1">{user?.name}</p>
                  <p className="text-[14px] text-gray-600 leading-relaxed">
                    {userProfile?.address}<br/>
                    {userProfile?.apartment && <>{userProfile.apartment}<br/></>}
                    {userProfile?.city}, {userProfile?.state} {userProfile?.pinCode}<br/>
                    India
                  </p>
                  {user?.phone && <p className="text-[14px] text-gray-600 mt-2">Ph: {user.phone}</p>}
                </div>
              </div>
              <button onClick={() => setIsEditing(true)} className="w-full flex items-center justify-center gap-2 border border-[var(--color-border)] py-2.5 text-[12px] font-bold uppercase tracking-widest rounded hover:bg-gray-50 transition-colors">
                <FiEdit2 /> Edit
              </button>
            </div>
          ) : (
            <button onClick={() => setIsEditing(true)} className="border-2 border-dashed border-gray-300 rounded-xl p-6 bg-gray-50 flex flex-col items-center justify-center text-center gap-3 min-h-[200px] hover:border-black hover:bg-gray-100 transition-colors group">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200 group-hover:scale-110 transition-transform">
                <FiPlus className="text-xl text-gray-600" />
              </div>
              <h3 className="text-[14px] font-medium uppercase tracking-wide">Add New Address</h3>
            </button>
          )}
          {success && <div className="col-span-full p-4 bg-green-50 text-green-700 border border-green-200 rounded text-[13px]">{success}</div>}
        </div>
      )}
    </div>
  );
}