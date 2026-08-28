"use client";
import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { CldImage } from "next-cloudinary";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { getCatalogProducts } from "@/app/actions";
import { Product } from "@/types";

const isCloudinary = (src: string) => {
  if (!src) return false;
  if (src.includes("res.cloudinary.com")) return true;
  if (src.startsWith("/") || src.startsWith("http") || src.startsWith("blob:")) return false;
  return true;
};

export const CartDrawer = () => {
    const { 
    isCartOpen, 
    setIsCartOpen, 
    cart, 
    removeFromCart, 
    updateQuantity,
    isInitialized, 
    addToCart,
    wishlist
  } = useAppContext();
  const router = useRouter();
  const [addedCrossSell, setAddedCrossSell] = useState<Set<string>>(new Set());
  const [isNavigating, setIsNavigating] = useState(false);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [settings, setSettings] = useState<{ freeShippingAbove: number, flatShippingFee: number } | null>(null);

  useEffect(() => {
    if (isCartOpen && catalog.length === 0) {
      getCatalogProducts().then(setCatalog).catch(() => setCatalog([]));
      fetch('/api/checkout/config').then(res => res.json()).then(setSettings).catch(() => {});
    }
  }, [isCartOpen, catalog.length]);

  const cartTotal = cart.reduce((total, item) => total + ((item.salePrice || item.price) * item.quantity), 0);
  
  const FREE_SHIPPING_ABOVE = settings?.freeShippingAbove ?? 999;
  const isFreeShipping = cartTotal >= FREE_SHIPPING_ABOVE;
  const amountForFreeShipping = FREE_SHIPPING_ABOVE - cartTotal;

  const { title: crossSellTitle, products: crossSellProducts } = useMemo(() => {
    if (catalog.length === 0) return { title: "Recommended", products: [] };
    const cartIds = new Set(cart.map(item => item.id));
    
    // 1. Wishlist priority
    const wishlistItems = catalog.filter(p => wishlist?.includes(p.id) && !cartIds.has(p.id));
    if (wishlistItems.length > 0) {
      return { title: "From Your Wishlist", products: wishlistItems.slice(0, 3) };
    }

    if (cart.length === 0) return { title: "Recommended", products: [] };
    
    const cartCollectionIds = new Set(cart.map(item => item.collectionId));
    const related = catalog.filter(p => cartCollectionIds.has(p.collectionId) && !cartIds.has(p.id)).slice(0, 4);
    
    if (related.length < 3) {
      const extra = catalog.filter(p => !cartIds.has(p.id) && !related.find(r => r.id === p.id) && p.tags?.includes("Bestseller")).slice(0, 3 - related.length);
      related.push(...extra);
    }
    return { title: "People Also Bought", products: related.slice(0, 3) };
  }, [cart, catalog, wishlist]);

  const handleAddCrossSell = (product: Product) => {
    addToCart(product, product.sizes?.[0] || "Free Size");
    setAddedCrossSell(prev => new Set([...prev, product.id]));
  };

  useEffect(() => {
    if (!isCartOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCartOpen(false);
      }
      if (e.key === 'Tab') {
        const focusable = document.querySelectorAll('#cart-drawer button, #cart-drawer a, #cart-drawer input, #cart-drawer [tabindex]:not([tabindex="-1"])');
        if (focusable.length === 0) return;
        const first = focusable[0] as HTMLElement;
        const last = focusable[focusable.length - 1] as HTMLElement;
        if (e.shiftKey && document.activeElement === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && (document.activeElement === last || !document.activeElement?.closest('#cart-drawer'))) {
          first.focus();
          e.preventDefault();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, setIsCartOpen]);

  if (!isCartOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-[100] transition-opacity" 
        onClick={() => setIsCartOpen(false)}
      />
      
      {/* Drawer */}
      <div id="cart-drawer" className="fixed top-0 right-0 h-full w-full max-w-[420px] bg-white z-[100] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-[var(--color-border)] bg-gray-50">
          <h2 className="text-[13px] font-bold tracking-[2px] uppercase">Your Cart ({cart.reduce((a, b) => a + b.quantity, 0)})</h2>
          <button aria-label="Close cart" onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col">
          {cart.length === 0 ? (
            isInitialized ? (
              <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-muted)] gap-6">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/></svg>
                <p className="text-[14px]">Your cart is currently empty.</p>
                <button onClick={() => setIsCartOpen(false)} className="px-8 py-3 bg-black text-white text-[12px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors">
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full"></div>
            )
          ) : (
            <>
              <div className="flex flex-col gap-6">
                {cart.map((item) => (
                  <div key={item.cartItemId} className="flex gap-4">
                    <div className="relative w-24 aspect-[3/4] bg-gray-50 shrink-0 border border-[var(--color-border)] rounded-md overflow-hidden">
                      {isCloudinary(item.image) ? (
                        <CldImage src={item.image} alt={item.name} fill className="object-cover" sizes="96px" />
                      ) : (
                        <Image src={item.image} alt={item.name} fill className="object-cover" sizes="96px" />
                      )}
                    </div>
                    <div className="flex flex-col flex-1">
                      <h3 className="text-[13px] font-medium leading-tight">{item.name}</h3>
                      <p className="text-[12px] text-[var(--color-text-muted)] mt-1">Size: {item.selectedSize}</p>
                      <div className="flex items-center justify-between mt-auto pt-2">
                        <p className="text-[14px] font-bold">₹{((item.salePrice || item.price) * item.quantity).toLocaleString("en-IN")}</p>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded px-2 py-0.5">
                            <button 
                              onClick={() => updateQuantity(item.cartItemId, -1)}
                              disabled={item.quantity <= 1}
                              className="text-gray-500 hover:text-black disabled:opacity-30 disabled:hover:text-gray-500 px-1"
                            >
                              -
                            </button>
                            <span className="text-[12px] text-gray-700 font-medium min-w-[12px] text-center">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.cartItemId, 1)}
                              className="text-gray-500 hover:text-black px-1"
                            >
                              +
                            </button>
                          </div>
                          <button 
                            onClick={() => removeFromCart(item.cartItemId)}
                            className="text-[12px] text-gray-400 hover:text-red-600 font-medium transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CROSS-SELL / PEOPLE ALSO BOUGHT */}
              {crossSellProducts.length > 0 && (
                <div className="mt-8 pt-6 border-t border-[var(--color-border)] pb-4">
                  <h3 className="text-[12px] font-bold tracking-[1.5px] uppercase mb-4 text-center text-gray-500 flex items-center justify-center gap-2">
                    <span className="w-8 h-[1px] bg-gray-300"></span> {crossSellTitle} <span className="w-8 h-[1px] bg-gray-300"></span>
                  </h3>
                  <div className="flex flex-col gap-3">
                    {crossSellProducts.map((product) => {
                      const isAdded = addedCrossSell.has(product.id);
                      return (
                        <div key={product.id} className="flex gap-3 items-center p-2 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200">
                          <div className="relative w-16 h-20 bg-gray-50 shrink-0 border border-gray-200 rounded overflow-hidden shadow-sm">
                            {isCloudinary(product.image) ? (
                              <CldImage src={product.image} alt={product.name} fill className="object-cover" sizes="64px" />
                            ) : (
                              <Image src={product.image} alt={product.name} fill className="object-cover" sizes="64px" />
                            )}
                          </div>
                          <div className="flex flex-col flex-1 min-w-0">
                            <p className="text-[12px] font-medium truncate leading-tight">{product.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[12px] font-bold">₹{(product.salePrice || product.price).toLocaleString("en-IN")}</span>
                              {product.salePrice && <span className="text-[10px] text-gray-400 line-through">₹{product.price.toLocaleString("en-IN")}</span>}
                            </div>
                          </div>
                          <button 
                            type="button"
                            onClick={() => handleAddCrossSell(product)}
                            disabled={isAdded}
                            className={`shrink-0 text-[10px] font-bold tracking-wider uppercase px-4 py-2 rounded shadow-sm transition-colors ${isAdded ? "bg-green-100 text-green-800 border border-green-200" : "bg-white text-black border border-gray-300 hover:border-black"}`}
                          >
                            {isAdded ? "Added" : "+ Add"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t border-[var(--color-border)] bg-gray-50 flex flex-col shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
            
            {/* Shipping Progress */}
            <div className="p-4 border-b border-[var(--color-border)] bg-white text-center">
               {!isFreeShipping ? (
                 <>
                   <p className="text-[12px] font-medium mb-2.5">
                     You are <span className="font-bold text-black">₹{amountForFreeShipping.toLocaleString("en-IN")}</span> away from <span className="font-bold text-green-700">FREE SHIPPING</span>
                   </p>
                   <div className="w-full bg-gray-100 rounded-full h-1.5 shadow-inner">
                     <div className="bg-green-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${Math.min((cartTotal / FREE_SHIPPING_ABOVE) * 100, 100)}%` }}></div>
                   </div>
                 </>
               ) : (
                 <div className="bg-green-50 py-1.5 rounded-full border border-green-200 text-[12px] font-bold text-green-700">
                   ✅ You have unlocked FREE SHIPPING!
                 </div>
               )}
            </div>

            <div className="p-5">
              <div className="flex justify-between items-center mb-5">
                <span className="text-[13px] tracking-[1px] uppercase font-bold text-gray-600">Subtotal</span>
                <span className="text-xl font-bold">₹{cartTotal.toLocaleString("en-IN")}</span>
              </div>
              
              <button 
                onClick={() => {
                  setIsNavigating(true);
                  // Intentionally NOT closing the cart immediately so the user sees the spinner
                  router.push("/checkout");
                  // We could close it after a tiny delay or let the route change naturally hide it
                  setTimeout(() => {
                    setIsCartOpen(false);
                    setIsNavigating(false); // Reset in case they navigate back
                  }, 800);
                }}
                disabled={isNavigating}
                className={`w-full py-4.5 text-[13px] font-bold tracking-[2px] uppercase shadow-lg rounded transition-colors flex items-center justify-center gap-2 ${isNavigating ? 'bg-gray-800 text-gray-300 cursor-wait' : 'bg-black text-white hover:bg-gray-800'}`}
              >
                {isNavigating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </>
                ) : (
                  <>
                    Checkout Securely
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  </>
                )}
              </button>
              
              <div className="mt-4 flex justify-center gap-1.5 items-center">
                 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                 <span className="text-[11px] text-gray-500 font-medium">Guaranteed safe & secure checkout</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
};
