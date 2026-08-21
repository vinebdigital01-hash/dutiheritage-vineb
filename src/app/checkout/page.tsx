"use client";
import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { State, City } from "country-state-city";
import { Product } from "@/types";
import { products as allProducts } from "@/data/mock-products";

// ============================================================
// DEMO CONFIG — Will be replaced by MongoDB settings later
// ============================================================
const DEMO_CONFIG = {
  freeShippingAbove: 999,
  flatShippingFee: 99,
  codExtraCharge: 49,
  prepaidDiscount: { type: "FLAT" as const, value: 50 },
  // Major city pincodes for COD demo
  codPrefixes: ["1100","4000","5600","3020","5000","6000","7000","3800","4110","2260","2080"],
  demoCoupons: [
    { code: "WELCOME10", discountType: "PERCENT" as const, discountValue: 10, minOrderAmount: 0 },
    { code: "FLAT200", discountType: "FLAT" as const, discountValue: 200, minOrderAmount: 1500 },
    { code: "DUTI25", discountType: "PERCENT" as const, discountValue: 25, minOrderAmount: 2000 },
  ],
};

function isCodAvailableForPin(pin: string): boolean {
  return DEMO_CONFIG.codPrefixes.some(prefix => pin.startsWith(prefix));
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, user, userProfile, clearCart, addToCart } = useAppContext();
  const [discountCode, setDiscountCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState<{ code: string; type: "PERCENT" | "FLAT"; value: number } | null>(null);
  const [discountError, setDiscountError] = useState("");
  const [saveToProfile, setSaveToProfile] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"prepaid" | "cod">("prepaid");
  const [codAvailable, setCodAvailable] = useState<boolean | null>(null);
  const [codChecking, setCodChecking] = useState(false);
  const [addedCrossSell, setAddedCrossSell] = useState<Set<string>>(new Set());

  // FOMO / Urgency States
  const [timeLeft, setTimeLeft] = useState(600); // 10 mins
  const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false);
  const [liveViewers, setLiveViewers] = useState(14);

  const [formData, setFormData] = useState({
    email: "", country: "India", firstName: "", lastName: "", address: "", apartment: "", city: "", state: "", pinCode: "", phone: ""
  });

  // Pre-fill from user profile
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

  // Countdown timer for FOMO banner
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  // Live viewers simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveViewers(prev => prev + (Math.random() > 0.5 ? 1 : -1));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Check COD availability when pincode changes
  useEffect(() => {
    const pin = formData.pinCode.trim();
    if (pin.length === 6) {
      setCodChecking(true);
      const timer = setTimeout(() => {
        const isAvailable = isCodAvailableForPin(pin);
        setCodAvailable(isAvailable);
        if (!isAvailable) setPaymentMethod("prepaid");
        setCodChecking(false);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setCodAvailable(null);
    }
  }, [formData.pinCode]);

  const indianStates = State.getStatesOfCountry("IN");
  const selectedState = indianStates.find(s => s.name === formData.state);
  const indianCities = selectedState ? City.getCitiesOfState("IN", selectedState.isoCode) : [];

  // ---- PRICING CALCULATIONS ----
  const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const isFreeShipping = subtotal >= DEMO_CONFIG.freeShippingAbove;
  const shipping = subtotal > 0 ? (isFreeShipping ? 0 : DEMO_CONFIG.flatShippingFee) : 0;
  const amountForFreeShipping = DEMO_CONFIG.freeShippingAbove - subtotal;

  const discountAmount = discountApplied
    ? discountApplied.type === "PERCENT"
      ? Math.round(subtotal * discountApplied.value / 100)
      : discountApplied.value
    : 0;

  const codCharge = paymentMethod === "cod" ? DEMO_CONFIG.codExtraCharge : 0;
  const prepaidDiscount = paymentMethod === "prepaid" ? DEMO_CONFIG.prepaidDiscount.value : 0;
  const total = subtotal + shipping - discountAmount + codCharge - prepaidDiscount;
  const totalSavings = discountAmount + prepaidDiscount + (isFreeShipping ? DEMO_CONFIG.flatShippingFee : 0);

  // ---- CROSS-SELL PRODUCTS ----
  const crossSellProducts = useMemo(() => {
    const cartIds = new Set(cart.map(item => item.id));
    const cartCollectionIds = new Set(cart.map(item => item.collectionId));
    const related = allProducts.filter(p => cartCollectionIds.has(p.collectionId) && !cartIds.has(p.id)).slice(0, 6);
    if (related.length < 4) {
      const extra = allProducts.filter(p => !cartIds.has(p.id) && !related.find(r => r.id === p.id) && p.tags?.includes("Bestseller")).slice(0, 4 - related.length);
      related.push(...extra);
    }
    return related.slice(0, 4);
  }, [cart]);

  // ---- HANDLERS ----
  const handleApplyDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    setDiscountError("");
    const code = discountCode.trim().toUpperCase();
    if (discountApplied) {
      setDiscountApplied(null);
      setDiscountCode("");
      return;
    }
    const coupon = DEMO_CONFIG.demoCoupons.find(c => c.code === code);
    if (!coupon) {
      setDiscountError("Invalid coupon code. Try WELCOME10, FLAT200, or DUTI25");
      return;
    }
    if (subtotal < coupon.minOrderAmount) {
      setDiscountError(`Minimum order of ₹${coupon.minOrderAmount} required for this coupon`);
      return;
    }
    setDiscountApplied({ code: coupon.code, type: coupon.discountType, value: coupon.discountValue });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddCrossSell = (product: Product) => {
    addToCart(product, product.sizes?.[0] || "Free Size");
    setAddedCrossSell(prev => new Set([...prev, product.id]));
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    const orderPayload = {
      customer: formData,
      items: cart,
      paymentMethod,
      summary: { subtotal, shipping, discountAmount, codCharge, prepaidDiscount, total, couponCode: discountApplied?.code || null }
    };
    console.log("Order Payload:", orderPayload);
    if (user && saveToProfile) console.log("TODO: Save profile to MongoDB");
    setTimeout(() => {
      clearCart();
      router.push("/checkout/success");
    }, 2000);
  };

  // ---- EMPTY CART ----
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

  // ============================================
  // SHARED ORDER SUMMARY CONTENT
  // ============================================
  const OrderSummaryContent = (
    <div className="flex flex-col w-full h-full">
      {/* Free Shipping Progress */}
      {!isFreeShipping && subtotal > 0 && (
        <div className="mb-6 p-3 rounded-lg bg-amber-50 border border-amber-100 shadow-sm">
          <p className="text-[13px] text-amber-800 font-medium mb-2">
            🎉 Add ₹{amountForFreeShipping.toLocaleString("en-IN")} more for <span className="font-bold">FREE Shipping!</span>
          </p>
          <div className="w-full bg-amber-200 rounded-full h-2">
            <div className="bg-amber-500 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min((subtotal / DEMO_CONFIG.freeShippingAbove) * 100, 100)}%` }}></div>
          </div>
        </div>
      )}
      {isFreeShipping && (
        <div className="mb-6 p-3 rounded-lg bg-green-50 border border-green-100 shadow-sm text-[13px] text-green-700 font-medium">
          ✅ You&apos;ve unlocked <span className="font-bold">FREE Shipping!</span>
        </div>
      )}

      {/* FOMO Live Viewers */}
      <div className="mb-4 flex items-center gap-2 text-[12px] text-red-600 font-medium bg-red-50 py-2 px-3 rounded">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
        {liveViewers} people are viewing items in your cart
      </div>

      {/* Cart Items */}
      <div className="flex flex-col gap-4 mb-6">
        {cart.map((item) => (
          <div key={item.cartItemId} className="flex gap-4 items-center">
            <div className="relative w-16 h-16 rounded border border-[var(--color-border)] bg-white shrink-0 shadow-sm">
              <Image src={item.image} alt={item.name} fill className="object-cover rounded" sizes="64px" />
              <div className="absolute -top-2 -right-2 w-5 h-5 bg-gray-600 text-white text-[11px] flex items-center justify-center rounded-full shadow-md">{item.quantity}</div>
            </div>
            <div className="flex flex-col flex-1">
              <span className="text-[14px] font-medium leading-tight">{item.name}</span>
              <span className="text-[12px] text-[var(--color-text-muted)]">{item.selectedSize}</span>
              {/* Fake Low Stock Warning */}
              <span className="text-[11px] text-red-600 font-medium mt-0.5">🔥 Only 2 left!</span>
            </div>
            <div className="text-[14px] font-medium">₹{(item.price * item.quantity).toLocaleString("en-IN")}</div>
          </div>
        ))}
      </div>

      {/* Discount Code */}
      <form onSubmit={handleApplyDiscount} className="flex gap-2 py-6 border-t border-b border-[var(--color-border)] mb-4">
        <div className="flex-1 flex flex-col">
          <input type="text" placeholder="Discount code" value={discountCode} onChange={(e) => { setDiscountCode(e.target.value); setDiscountError(""); }} disabled={!!discountApplied} className="w-full border border-[var(--color-border)] p-3 text-[14px] rounded focus:border-black outline-none transition-colors bg-white shadow-sm disabled:bg-gray-100" />
          {discountError && <p className="text-[12px] text-red-500 mt-1">{discountError}</p>}
        </div>
        <button type="submit" className={`px-6 text-[14px] font-medium rounded transition-colors shadow-sm shrink-0 h-[46px] ${discountApplied ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-gray-800 text-white hover:bg-black"}`}>
          {discountApplied ? "Remove" : "Apply"}
        </button>
      </form>

      {/* Available Coupons */}
      {!discountApplied && (
        <div className="mb-6">
          <p className="text-[11px] text-[var(--color-text-muted)] mb-2 font-medium uppercase tracking-wider">Available coupons:</p>
          <div className="flex flex-wrap gap-2">
            {DEMO_CONFIG.demoCoupons.map(c => (
              <button key={c.code} type="button" onClick={() => setDiscountCode(c.code)} className="text-[11px] border border-dashed border-gray-400 bg-white px-2 py-1.5 rounded hover:border-black transition-colors shadow-sm font-medium">
                {c.code} — {c.discountType === "PERCENT" ? `${c.discountValue}% off` : `₹${c.discountValue} off`}
                {c.minOrderAmount > 0 && <span className="font-normal text-gray-500"> (min ₹{c.minOrderAmount})</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Totals */}
      <div className="flex flex-col gap-3 text-[14px]">
        <div className="flex justify-between">
          <span className="text-[var(--color-text-muted)]">Subtotal ({cart.reduce((t, i) => t + i.quantity, 0)} items)</span>
          <span className="font-medium">₹{subtotal.toLocaleString("en-IN")}</span>
        </div>

        {discountApplied && (
          <div className="flex justify-between text-green-700 font-medium">
            <span className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
              {discountApplied.code}
            </span>
            <span>- ₹{discountAmount.toLocaleString("en-IN")}</span>
          </div>
        )}

        {prepaidDiscount > 0 && (
          <div className="flex justify-between text-green-700 font-medium">
            <span>✨ Prepaid Discount</span>
            <span>- ₹{prepaidDiscount.toLocaleString("en-IN")}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-[var(--color-text-muted)]">Shipping</span>
          <span className="font-medium">{isFreeShipping ? <span className="text-green-700">FREE 🎉</span> : `₹${shipping.toLocaleString("en-IN")}`}</span>
        </div>

        {codCharge > 0 && (
          <div className="flex justify-between text-amber-700 font-medium">
            <span>COD Handling Charge</span>
            <span>+ ₹{codCharge.toLocaleString("en-IN")}</span>
          </div>
        )}

        <div className="flex justify-between items-center mt-4 pt-4 border-t border-[var(--color-border)]">
          <span className="text-lg font-medium">Total</span>
          <div className="flex items-end gap-2">
            <span className="text-[12px] text-[var(--color-text-muted)] mb-1">INR</span>
            <span className="text-2xl font-bold">₹{total.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {totalSavings > 0 && (
          <div className="text-center mt-3 py-2.5 bg-green-50 border border-green-100 rounded-lg text-[13px] text-green-700 font-bold shadow-sm">
            🎊 You&apos;re saving ₹{totalSavings.toLocaleString("en-IN")} on this order!
          </div>
        )}
      </div>

      {/* CROSS-SELL: Complete Your Look */}
      {crossSellProducts.length > 0 && (
        <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
          <h3 className="text-[14px] font-bold tracking-wide uppercase mb-4 flex items-center gap-2">
            ✨ Complete Your Look
          </h3>
          <div className="flex flex-col gap-3">
            {crossSellProducts.map((product) => {
              const isAdded = addedCrossSell.has(product.id);
              const savings = product.salePrice ? product.price - product.salePrice : 0;
              return (
                <div key={product.id} className="flex items-center gap-3 p-2.5 bg-white border border-[var(--color-border)] rounded-lg hover:border-gray-400 transition-colors shadow-sm">
                  <div className="relative w-14 h-14 rounded bg-gray-50 shrink-0">
                    <Image src={product.image} alt={product.name} fill className="object-cover rounded" sizes="56px" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">{product.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[13px] font-bold">₹{(product.salePrice || product.price).toLocaleString("en-IN")}</span>
                      {product.salePrice && <span className="text-[11px] text-[var(--color-text-muted)] line-through">₹{product.price.toLocaleString("en-IN")}</span>}
                      {savings > 0 && <span className="text-[10px] text-white bg-red-600 px-1 rounded font-bold uppercase tracking-wider">Save ₹{savings.toLocaleString("en-IN")}</span>}
                    </div>
                  </div>
                  <button type="button" onClick={() => handleAddCrossSell(product)} disabled={isAdded} className={`text-[11px] font-bold uppercase tracking-wider px-4 py-2 rounded transition-colors shrink-0 shadow-sm ${isAdded ? "bg-green-100 text-green-800" : "bg-black text-white hover:bg-gray-800"}`}>
                    {isAdded ? "Added" : "Add"}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Upsell Nudge */}
          {!isFreeShipping && amountForFreeShipping > 0 && amountForFreeShipping <= 500 && (
            <div className="mt-4 p-3 border border-dashed border-green-400 rounded-lg bg-green-50 text-center shadow-sm">
              <p className="text-[12px] text-green-800">
                💡 <span className="font-bold">Pro tip:</span> Add one more item worth ₹{amountForFreeShipping.toLocaleString("en-IN")}+ to get <span className="font-bold">FREE shipping</span> &amp; save ₹{DEMO_CONFIG.flatShippingFee}!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Delivery Info */}
      <div className="mt-8 pt-4 border-t border-[var(--color-border)] flex flex-col gap-3 text-[12px] text-[var(--color-text-muted)]">
        <div className="flex items-center gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
          <span className="font-medium">Prepaid orders dispatched within 48 hours</span>
        </div>
        <div className="flex items-center gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          <span className="font-medium">Delivery across India in 5-7 business days</span>
        </div>
        <div className="flex items-center gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
          <span className="font-medium">7-day easy return &amp; exchange policy</span>
        </div>
      </div>
    </div>
  );

  return (
    <main className="w-full min-h-screen bg-[var(--color-bg)] pb-24 lg:pb-0">
      
      {/* 🚨 FOMO BANNER - STICKY TOP */}
      <div className="bg-red-600 text-white text-[12px] md:text-[13px] text-center py-2 px-4 font-bold tracking-wide sticky top-0 z-50 shadow-md flex items-center justify-center gap-2">
        <span className="animate-bounce">⚡</span> 
        High demand! Your cart is reserved for 
        <span className="bg-white text-red-600 px-2 py-0.5 rounded ml-1">{timeString}</span>
      </div>

      <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row min-h-screen">

        {/* ============================================ */}
        {/* MOBILE ORDER SUMMARY ACCORDION               */}
        {/* ============================================ */}
        <div className="lg:hidden w-full bg-gray-50 border-b border-[var(--color-border)]">
          <button 
            type="button"
            onClick={() => setIsMobileSummaryOpen(!isMobileSummaryOpen)}
            className="w-full flex items-center justify-between p-4 px-4 sm:px-6 hover:bg-gray-100 transition-colors"
          >
            <span className="flex items-center gap-2 text-[14px] text-blue-600 font-medium">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
              {isMobileSummaryOpen ? "Hide order summary" : "Show order summary"}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transform transition-transform ${isMobileSummaryOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
            </span>
            <span className="text-lg font-bold">₹{total.toLocaleString("en-IN")}</span>
          </button>
          
          <div className={`overflow-hidden transition-all duration-300 ${isMobileSummaryOpen ? 'max-h-[2500px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="p-4 sm:px-6 pt-0 border-t border-[var(--color-border)]">
               {OrderSummaryContent}
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* LEFT COLUMN: Forms                           */}
        {/* ============================================ */}
        <div className="w-full lg:w-[55%] xl:w-[60%] lg:pr-12 xl:pr-16 py-8 px-4 lg:px-8 lg:border-r border-[var(--color-border)]">
          
          {/* Desktop Logo */}
          <Link href="/" className="hidden lg:block text-3xl font-normal tracking-[3px] uppercase font-serif mb-8">
            DUTI HERITAGE
          </Link>

          {/* Social Proof Banner */}
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3 items-center shadow-sm">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
              <span className="text-xl">⭐️</span>
            </div>
            <div>
              <p className="text-[13px] font-bold text-green-800">Trusted by 10,000+ women across India</p>
              <p className="text-[12px] text-green-700">Join the Duti Heritage family today.</p>
            </div>
          </div>

          <form className="flex flex-col gap-8" onSubmit={handlePaymentSubmit}>

            {/* Contact */}
            <section>
              <div className="flex justify-between items-end mb-4">
                <h2 className="text-xl font-serif tracking-wide font-bold">Contact</h2>
                {!user && <Link href="/account" className="text-[13px] font-bold text-blue-600 hover:underline">Log in</Link>}
              </div>
              <input type="text" name="email" value={formData.email} onChange={handleInputChange} placeholder="Email or mobile phone number" className="w-full border border-gray-300 p-3.5 text-[15px] rounded-lg focus:border-black focus:ring-1 focus:ring-black outline-none transition-all shadow-sm bg-white" required />
              <div className="flex items-center gap-2 mt-3">
                <input type="checkbox" id="news" className="w-4 h-4 accent-black rounded" defaultChecked />
                <label htmlFor="news" className="text-[14px] text-gray-600">
                  {formData.email.includes("@") ? "Email me with news and exclusive offers" : formData.email.trim() !== "" ? "Text me with news and exclusive offers" : "Email or text me with news and exclusive offers"}
                </label>
              </div>
            </section>

            {/* Delivery */}
            <section>
              <h2 className="text-xl font-serif tracking-wide font-bold mb-4">Delivery Address</h2>
              <div className="flex flex-col gap-3.5">
                <select name="country" value={formData.country} onChange={handleInputChange} className="w-full border border-gray-300 p-3.5 text-[15px] rounded-lg focus:border-black focus:ring-1 focus:ring-black outline-none transition-all bg-white shadow-sm">
                  <option>India</option>
                  <option>United States</option>
                  <option>United Kingdom</option>
                </select>

                <div className="flex gap-3.5">
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="First name" className="w-1/2 border border-gray-300 p-3.5 text-[15px] rounded-lg focus:border-black focus:ring-1 focus:ring-black outline-none transition-all bg-white shadow-sm" required />
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Last name" className="w-1/2 border border-gray-300 p-3.5 text-[15px] rounded-lg focus:border-black focus:ring-1 focus:ring-black outline-none transition-all bg-white shadow-sm" required />
                </div>

                <input type="text" name="address" value={formData.address} onChange={handleInputChange} placeholder="Address (House No, Building, Street)" className="w-full border border-gray-300 p-3.5 text-[15px] rounded-lg focus:border-black focus:ring-1 focus:ring-black outline-none transition-all bg-white shadow-sm" required />
                <input type="text" name="apartment" value={formData.apartment} onChange={handleInputChange} placeholder="Apartment, suite, etc. (optional)" className="w-full border border-gray-300 p-3.5 text-[15px] rounded-lg focus:border-black focus:ring-1 focus:ring-black outline-none transition-all bg-white shadow-sm" />

                <div className="flex gap-3.5">
                  <div className="w-1/3">
                    <input type="text" name="city" list="cityList" value={formData.city} onChange={handleInputChange} placeholder="City" className="w-full border border-gray-300 p-3.5 text-[15px] rounded-lg focus:border-black focus:ring-1 focus:ring-black outline-none transition-all bg-white shadow-sm" required />
                    <datalist id="cityList">
                      {indianCities.map(c => <option key={c.name} value={c.name} />)}
                    </datalist>
                  </div>
                  <select name="state" value={formData.state} onChange={handleInputChange} className="w-1/3 border border-gray-300 p-3.5 text-[15px] rounded-lg focus:border-black focus:ring-1 focus:ring-black outline-none transition-all bg-white shadow-sm" required>
                    <option value="">State</option>
                    {indianStates.map(s => <option key={s.isoCode} value={s.name}>{s.name}</option>)}
                  </select>
                  <input type="text" name="pinCode" value={formData.pinCode} onChange={handleInputChange} placeholder="PIN code" maxLength={6} className="w-1/3 border border-gray-300 p-3.5 text-[15px] rounded-lg focus:border-black focus:ring-1 focus:ring-black outline-none transition-all bg-white shadow-sm font-medium tracking-wide" required />
                </div>

                <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Mobile number (For delivery updates)" className="w-full border border-gray-300 p-3.5 text-[15px] rounded-lg focus:border-black focus:ring-1 focus:ring-black outline-none transition-all bg-white shadow-sm" required />

                {/* COD Availability Indicator */}
                {formData.pinCode.length === 6 && (
                  <div className={`flex items-center gap-2 text-[13px] px-4 py-3 rounded-lg font-medium shadow-sm border ${codChecking ? "bg-gray-50 border-gray-200 text-gray-600" : codAvailable ? "bg-green-50 border-green-200 text-green-800" : "bg-amber-50 border-amber-200 text-amber-800"}`}>
                    {codChecking ? (
                      <><span className="animate-pulse">●</span> Checking delivery options...</>
                    ) : codAvailable ? (
                      <><span>✅</span> COD &amp; Prepaid both available for {formData.pinCode}</>
                    ) : (
                      <><span>⚠️</span> Only Prepaid available for {formData.pinCode}. COD not serviceable.</>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Payment Method */}
            <section>
              <h2 className="text-xl font-serif tracking-wide font-bold mb-4">Payment Method</h2>
              <p className="text-[13px] text-gray-500 mb-4 flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                All transactions are secure and encrypted.
              </p>

              <div className="flex flex-col gap-4">
                {/* Prepaid */}
                <label className={`flex items-start gap-4 border-2 rounded-xl p-5 cursor-pointer transition-all shadow-sm ${paymentMethod === "prepaid" ? "border-black bg-blue-50/30" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                  <input type="radio" name="paymentMethod" value="prepaid" checked={paymentMethod === "prepaid"} onChange={() => setPaymentMethod("prepaid")} className="mt-1 accent-black w-5 h-5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-[15px] font-bold">Pay Online (UPI / Card / Net Banking)</span>
                      <span className="text-[12px] font-bold bg-green-100 text-green-800 border border-green-200 px-2 py-1 rounded shadow-sm animate-pulse">SAVE ₹{DEMO_CONFIG.prepaidDiscount.value}</span>
                    </div>
                    <p className="text-[13px] text-gray-600 mt-1">Get ₹{DEMO_CONFIG.prepaidDiscount.value} instant off on prepaid orders</p>
                    {paymentMethod === "prepaid" && (
                      <div className="mt-4 flex items-center gap-2 flex-wrap">
                        {["UPI", "Visa", "MasterCard", "RuPay", "GPay", "PhonePe"].map(m => (
                          <span key={m} className="text-[11px] font-bold tracking-wide border border-gray-300 px-2.5 py-1 rounded bg-white text-gray-600 shadow-sm">{m}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </label>

                {/* COD */}
                <label className={`flex items-start gap-4 border-2 rounded-xl p-5 transition-all shadow-sm ${codAvailable === false || codChecking ? "opacity-50 cursor-not-allowed bg-gray-50" : "cursor-pointer bg-white"} ${paymentMethod === "cod" ? "border-black bg-gray-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === "cod"} onChange={() => { if (codAvailable !== false) setPaymentMethod("cod"); }} disabled={codAvailable === false || codChecking} className="mt-1 accent-black w-5 h-5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-[15px] font-bold">Cash on Delivery (COD)</span>
                      <span className="text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 px-2 py-1 rounded shadow-sm">+₹{DEMO_CONFIG.codExtraCharge} charge</span>
                    </div>
                    <p className="text-[13px] text-gray-600 mt-1">
                      {codAvailable === false ? "COD is not available for your pincode" : codAvailable === null ? "Enter your pincode to check COD availability" : `A non-refundable ₹${DEMO_CONFIG.codExtraCharge} handling charge will be added.`}
                    </p>
                  </div>
                </label>
              </div>
            </section>

            {/* Save to profile */}
            {user && (
              <div className="flex items-start gap-3 bg-gray-50 p-4 border border-gray-200 rounded-lg shadow-sm">
                <input type="checkbox" id="saveProfile" checked={saveToProfile} onChange={(e) => setSaveToProfile(e.target.checked)} className="w-4 h-4 mt-0.5 accent-black shrink-0" />
                <label htmlFor="saveProfile" className="text-[14px] leading-tight text-gray-700 cursor-pointer font-medium">
                  Save this delivery information to my profile for faster checkout next time.
                </label>
              </div>
            )}

            {/* Desktop Submit Button (Hidden on Mobile due to Sticky Footer) */}
            <div className="hidden lg:block">
              <button type="submit" disabled={isProcessing} className={`w-full py-4.5 text-[15px] font-bold tracking-[1px] uppercase rounded-lg transition-colors shadow-lg relative overflow-hidden flex items-center justify-center gap-3 ${isProcessing ? "bg-gray-800 text-gray-300 cursor-not-allowed" : paymentMethod === "prepaid" ? "bg-black text-white hover:bg-black/90" : "bg-green-700 text-white hover:bg-green-800"}`}>
                {isProcessing && (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isProcessing ? "Processing..." : paymentMethod === "prepaid" ? `Pay ₹${total.toLocaleString("en-IN")} Securely` : `Confirm COD Order — ₹${total.toLocaleString("en-IN")}`}
              </button>
            </div>
            
            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-6 text-[11px] font-medium text-gray-500 mt-2 flex-wrap">
              <span className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                Secure Checkout
              </span>
              <span className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                100% Safe
              </span>
              <span className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line></svg>
                Easy Returns
              </span>
            </div>
          </form>

          {/* Footer Links */}
          <div className="mt-12 border-t border-[var(--color-border)] pt-6 text-[13px] text-[var(--color-text-muted)] flex gap-6 flex-wrap justify-center lg:justify-start">
            <Link href="/return-exchange" className="hover:text-black font-medium transition-colors">Refund policy</Link>
            <Link href="/shipping" className="hover:text-black font-medium transition-colors">Shipping policy</Link>
            <Link href="/privacy-policy" className="hover:text-black font-medium transition-colors">Privacy policy</Link>
            <Link href="/terms-conditions" className="hover:text-black font-medium transition-colors">Terms of service</Link>
          </div>
        </div>

        {/* ============================================ */}
        {/* RIGHT COLUMN: Desktop Order Summary          */}
        {/* ============================================ */}
        <div className="hidden lg:block w-full lg:w-[45%] xl:w-[40%] bg-gray-50/80 py-10 px-8 xl:px-12 border-l border-gray-200">
           {OrderSummaryContent}
        </div>
      </div>

      {/* ============================================ */}
      {/* MOBILE STICKY FOOTER (Pay Button)            */}
      {/* ============================================ */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40">
        <button 
          type="submit" 
          onClick={handlePaymentSubmit}
          disabled={isProcessing} 
          className={`w-full py-4 text-[15px] font-bold tracking-[1px] uppercase rounded-lg transition-colors shadow-lg relative overflow-hidden flex items-center justify-center gap-3 ${isProcessing ? "bg-gray-800 text-gray-300 cursor-not-allowed" : paymentMethod === "prepaid" ? "bg-black text-white hover:bg-black/90" : "bg-green-700 text-white hover:bg-green-800"}`}
        >
          {isProcessing && (
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {isProcessing ? "Processing..." : paymentMethod === "prepaid" ? `Pay ₹${total.toLocaleString("en-IN")} Securely` : `Confirm COD Order — ₹${total.toLocaleString("en-IN")}`}
        </button>
      </div>

    </main>
  );
}
