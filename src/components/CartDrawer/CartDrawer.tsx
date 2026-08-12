"use client";
import React from "react";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";

export const CartDrawer = () => {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, isInitialized } = useAppContext();

  if (!isCartOpen) return null;

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 transition-opacity" 
        onClick={() => setIsCartOpen(false)}
      />
      
      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-[400px] bg-white z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h2 className="text-sm tracking-[2px] uppercase">Your Cart ({cart.length})</h2>
          <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
          {cart.length === 0 ? (
            isInitialized ? (
              <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-muted)] gap-4">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/></svg>
                <p className="text-sm">Your cart is currently empty.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-4">
                {/* Invisible skeleton/spacer to prevent flash of text */}
              </div>
            )
          ) : (
            cart.map((item) => (
              <div key={item.cartItemId} className="flex gap-4">
                <div className="relative w-24 aspect-[3/4] bg-gray-50 shrink-0">
                  <Image src={item.image} alt={item.name} fill className="object-cover" />
                </div>
                <div className="flex flex-col flex-1">
                  <h3 className="text-xs tracking-[1px] uppercase">{item.name}</h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">Size: {item.selectedSize}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <p className="text-sm">Rs. {item.price.toLocaleString("en-IN")}</p>
                    <div className="flex items-center gap-4">
                      <span className="text-xs">Qty: {item.quantity}</span>
                      <button 
                        onClick={() => removeFromCart(item.cartItemId)}
                        className="text-xs underline text-[var(--color-text-muted)] hover:text-black"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-[var(--color-border)] bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm tracking-[1px] uppercase">Subtotal</span>
              <span className="text-sm font-medium">Rs. {cartTotal.toLocaleString("en-IN")}</span>
            </div>
            <p className="text-[11px] text-[var(--color-text-muted)] mb-4 text-center">Tax included and shipping calculated at checkout</p>
            <button 
              onClick={() => {
                setIsCartOpen(false);
                window.location.href = "/checkout";
              }}
              className="w-full py-4 bg-black text-white text-[12px] tracking-[2px] uppercase hover:bg-black/90"
            >
              Check out
            </button>
          </div>
        )}

      </div>
    </>
  );
};
