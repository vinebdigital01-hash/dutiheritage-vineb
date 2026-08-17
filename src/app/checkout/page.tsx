"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { firestore } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { State, City } from "country-state-city";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, user, userProfile, clearCart } = useAppContext();
  const [discountCode, setDiscountCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [saveToProfile, setSaveToProfile] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    country: "India",
    firstName: "",
    lastName: "",
    address: "",
    apartment: "",
    city: "",
    state: "",
    pinCode: "",
    phone: ""
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        email: user.email || prev.email,
        firstName: user.name?.split(" ")[0] || prev.firstName,
        lastName: user.name?.split(" ").slice(1).join(" ") || prev.lastName,
        phone: user.phone || userProfile?.phone || prev.phone,
        address: userProfile?.address || prev.address,
        apartment: userProfile?.apartment || prev.apartment,
        city: userProfile?.city || prev.city,
        state: userProfile?.state || prev.state,
        pinCode: userProfile?.pinCode || prev.pinCode,
        country: userProfile?.country || prev.country
      }));
    }
  }, [user, userProfile]);

  const indianStates = State.getStatesOfCountry("IN");
  const selectedState = indianStates.find(s => s.name === formData.state);
  const indianCities = selectedState ? City.getCitiesOfState("IN", selectedState.isoCode) : [];

  const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const shipping = subtotal > 0 ? 150 : 0; // Flat Rs. 150 shipping, or 0 if empty
  const discountAmount = discountApplied ? subtotal * 0.1 : 0; // 10% mock discount
  const total = subtotal + shipping - discountAmount;

  const handleApplyDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    if (discountCode.trim().toUpperCase() === "WELCOME10") {
      setDiscountApplied(true);
    } else {
      alert("Invalid discount code. Try 'WELCOME10'");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // 1. Gather all order data
    const orderPayload = {
      customer: formData,
      items: cart,
      summary: {
        subtotal,
        shipping,
        discountAmount,
        total
      }
    };

    console.log("Initiating Payment with Payload:", orderPayload);

    // 2. Save profile data if checked (running in background, not blocking)
    if (user && saveToProfile) {
      setDoc(doc(firestore, "users", user.uid), {
        phone: formData.phone,
        address: formData.address,
        apartment: formData.apartment,
        city: formData.city,
        state: formData.state,
        pinCode: formData.pinCode,
        country: formData.country
      }, { merge: true })
        .then(() => console.log("Profile updated successfully!"))
        .catch((error) => console.error("Error saving profile:", error));
    }

    // 3. Simulate successful payment processing
    setTimeout(() => {
      clearCart();
      router.push("/checkout/success");
    }, 1500); // Small delay to feel like it's processing
  };

  if (cart.length === 0) {
    return (
      <main className="w-full min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 bg-[var(--color-bg)]">
        <div className="max-w-[800px] w-full text-center">
          <h1 className="text-3xl font-serif tracking-[3px] uppercase mb-8">Checkout</h1>
          <div className="flex flex-col items-center gap-6">
            <p className="text-[var(--color-text-muted)]">Your cart is empty.</p>
            <Link href="/collections/all" className="border border-black px-8 py-3 text-[13px] tracking-[2px] uppercase hover:bg-black hover:text-white transition-colors">
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full min-h-screen bg-[var(--color-bg)]">
      <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row min-h-screen">
        
        {/* LEFT COLUMN: Forms */}
        <div className="w-full lg:w-[55%] xl:w-[60%] lg:pr-12 xl:pr-16 py-10 px-4 lg:px-8 border-r border-[var(--color-border)]">
          <Link href="/" className="text-3xl font-normal tracking-[3px] uppercase font-serif mb-8 block">
            DUTI HERITAGE
          </Link>

          <form className="flex flex-col gap-8" onSubmit={handlePaymentSubmit}>
            
            {/* Contact */}
            <section>
              <div className="flex justify-between items-end mb-4">
                <h2 className="text-xl font-serif tracking-wide">Contact</h2>
                {!user && <Link href="/account" className="text-[13px] underline">Log in</Link>}
              </div>
              <input
                type="text"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email or mobile phone number"
                className="w-full border border-[var(--color-border)] p-3 text-[14px] rounded focus:border-black outline-none transition-colors"
                required
              />
              <div className="flex items-center gap-2 mt-3">
                <input type="checkbox" id="news" className="w-4 h-4 accent-black" />
                <label htmlFor="news" className="text-[14px] text-[var(--color-text-muted)]">
                  {formData.email.includes('@') 
                    ? "Email me with news and offers" 
                    : formData.email.trim() !== '' 
                      ? "Text me with news and offers" 
                      : "Email or text me with news and offers"}
                </label>
              </div>
            </section>

            {/* Delivery */}
            <section>
              <h2 className="text-xl font-serif tracking-wide mb-4">Delivery</h2>
              <div className="flex flex-col gap-4">
                <div className="w-full">
                  <select 
                    name="country" 
                    value={formData.country} 
                    onChange={handleInputChange}
                    className="w-full border border-[var(--color-border)] p-3 text-[14px] rounded focus:border-black outline-none transition-colors bg-white"
                  >
                    <option>India</option>
                    <option>United States</option>
                    <option>United Kingdom</option>
                  </select>
                </div>
                
                <div className="flex gap-4">
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="First name"
                    className="w-1/2 border border-[var(--color-border)] p-3 text-[14px] rounded focus:border-black outline-none transition-colors"
                    required
                  />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Last name"
                    className="w-1/2 border border-[var(--color-border)] p-3 text-[14px] rounded focus:border-black outline-none transition-colors"
                    required
                  />
                </div>
                
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Address"
                  className="w-full border border-[var(--color-border)] p-3 text-[14px] rounded focus:border-black outline-none transition-colors"
                  required
                />
                
                <input
                  type="text"
                  name="apartment"
                  value={formData.apartment}
                  onChange={handleInputChange}
                  placeholder="Apartment, suite, etc. (optional)"
                  className="w-full border border-[var(--color-border)] p-3 text-[14px] rounded focus:border-black outline-none transition-colors"
                />

                <div className="flex gap-4">
                  <input
                    type="text"
                    name="city"
                    list="cityList"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="City"
                    className="w-1/3 border border-[var(--color-border)] p-3 text-[14px] rounded focus:border-black outline-none transition-colors"
                    required
                  />
                  <datalist id="cityList">
                    {indianCities.map(c => (
                      <option key={c.name} value={c.name} />
                    ))}
                  </datalist>
                  <select 
                    name="state" 
                    value={formData.state} 
                    onChange={handleInputChange}
                    className="w-1/3 border border-[var(--color-border)] p-3 text-[14px] rounded focus:border-black outline-none transition-colors bg-white" 
                    required
                  >
                    <option value="">State</option>
                    {indianStates.map(s => (
                      <option key={s.isoCode} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    name="pinCode"
                    value={formData.pinCode}
                    onChange={handleInputChange}
                    placeholder="PIN code"
                    className="w-1/3 border border-[var(--color-border)] p-3 text-[14px] rounded focus:border-black outline-none transition-colors"
                    required
                  />
                </div>

                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Phone"
                  className="w-full border border-[var(--color-border)] p-3 text-[14px] rounded focus:border-black outline-none transition-colors"
                  required
                />
              </div>
            </section>

            {/* Payment Dummy */}
            <section>
              <h2 className="text-xl font-serif tracking-wide mb-4">Payment</h2>
              <p className="text-[13px] text-[var(--color-text-muted)] mb-4">All transactions are secure and encrypted.</p>
              <div className="border border-[var(--color-border)] p-4 rounded bg-gray-50 flex flex-col items-center justify-center py-8 text-center">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-4 text-gray-400">
                  <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                  <line x1="2" y1="10" x2="22" y2="10"></line>
                </svg>
                <p className="text-[14px] text-gray-500">Upon clicking &apos;Pay now&apos;, your payment gateway will open.</p>
              </div>
            </section>

            {user && (
              <div className="flex items-start gap-3 mt-4 bg-gray-50 p-4 border border-[var(--color-border)] rounded">
                <input 
                  type="checkbox" 
                  id="saveProfile" 
                  checked={saveToProfile} 
                  onChange={(e) => setSaveToProfile(e.target.checked)} 
                  className="w-4 h-4 mt-0.5 accent-black shrink-0" 
                />
                <label htmlFor="saveProfile" className="text-[13px] leading-tight text-[var(--color-text-muted)] cursor-pointer">
                  Save this delivery information to my profile for faster checkout next time.
                </label>
              </div>
            )}

            <button 
              type="submit"
              disabled={isProcessing}
              className={`w-full py-4 text-[14px] font-medium tracking-[1px] rounded transition-colors mt-4 relative overflow-hidden flex items-center justify-center gap-3 ${isProcessing ? 'bg-gray-800 text-gray-300 cursor-not-allowed' : 'bg-black text-white hover:bg-black/90'}`}
            >
              {isProcessing && (
                <svg className="animate-spin h-5 w-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isProcessing ? "Processing..." : "Pay now"}
            </button>
            
          </form>
          
          <div className="mt-12 border-t border-[var(--color-border)] pt-6 text-[12px] text-[var(--color-text-muted)] flex gap-4">
            <Link href="#" className="hover:underline">Refund policy</Link>
            <Link href="#" className="hover:underline">Shipping policy</Link>
            <Link href="#" className="hover:underline">Privacy policy</Link>
            <Link href="#" className="hover:underline">Terms of service</Link>
          </div>
        </div>

        {/* RIGHT COLUMN: Order Summary */}
        <div className="w-full lg:w-[45%] xl:w-[40%] bg-gray-50/50 py-10 px-4 lg:px-8 xl:px-12">
          
          {/* Cart Items */}
          <div className="flex flex-col gap-4 mb-6">
            {cart.map((item) => (
              <div key={item.cartItemId} className="flex gap-4 items-center">
                <div className="relative w-16 h-16 rounded border border-[var(--color-border)] bg-white shrink-0">
                  <Image src={item.image} alt={item.name} fill className="object-cover rounded" />
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-gray-500 text-white text-[11px] flex items-center justify-center rounded-full">
                    {item.quantity}
                  </div>
                </div>
                <div className="flex flex-col flex-1">
                  <span className="text-[14px] font-medium leading-tight">{item.name}</span>
                  <span className="text-[12px] text-[var(--color-text-muted)]">{item.selectedSize}</span>
                </div>
                <div className="text-[14px]">
                  Rs. {(item.price * item.quantity).toLocaleString("en-IN")}
                </div>
              </div>
            ))}
          </div>

          {/* Discount Code */}
          <form onSubmit={handleApplyDiscount} className="flex gap-2 py-6 border-t border-b border-[var(--color-border)] mb-6">
            <input
              type="text"
              placeholder="Discount code (Try WELCOME10)"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              className="flex-1 border border-[var(--color-border)] p-3 text-[14px] rounded focus:border-black outline-none transition-colors bg-white"
            />
            <button 
              type="submit"
              className="px-6 bg-gray-200 text-black text-[14px] font-medium rounded hover:bg-gray-300 transition-colors"
            >
              Apply
            </button>
          </form>

          {/* Totals */}
          <div className="flex flex-col gap-3 text-[14px]">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Subtotal</span>
              <span className="font-medium">Rs. {subtotal.toLocaleString("en-IN")}</span>
            </div>
            
            {discountApplied && (
              <div className="flex justify-between text-[var(--color-save-badge)]">
                <span className="flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                  WELCOME10
                </span>
                <span className="font-medium">- Rs. {discountAmount.toLocaleString("en-IN")}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Shipping</span>
              <span className="font-medium">Rs. {shipping.toLocaleString("en-IN")}</span>
            </div>
            
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-[var(--color-border)]">
              <span className="text-lg font-medium">Total</span>
              <div className="flex items-end gap-2">
                <span className="text-[12px] text-[var(--color-text-muted)] mb-1">INR</span>
                <span className="text-2xl font-medium">Rs. {total.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
