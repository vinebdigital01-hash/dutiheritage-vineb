"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { Product } from "@/types";

export interface CartItem extends Product {
  cartItemId: string; // unique ID for cart (id + size)
  selectedSize: string;
  quantity: number;
}

interface AppContextType {
  cart: CartItem[];
  addToCart: (product: Product, size: string) => void;
  removeFromCart: (cartItemId: string) => void;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (isOpen: boolean) => void;
  recentlyViewed: Product[];
  addRecentlyViewed: (product: Product) => void;
  user: { name: string; email: string } | null;
  login: (email: string) => void;
  logout: () => void;
  isInitialized: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("duti-heritage_cart");
      const savedRecentlyViewed = localStorage.getItem("duti-heritage_recently_viewed");
      const savedUser = localStorage.getItem("duti-heritage_user");
      
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (savedCart) setCart(JSON.parse(savedCart));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (savedRecentlyViewed) setRecentlyViewed(JSON.parse(savedRecentlyViewed));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (savedUser) setUser(JSON.parse(savedUser));
    } catch {}
    setIsInitialized(true);
  }, []);

  // Save to LocalStorage on change
  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem("duti-heritage_cart", JSON.stringify(cart));
  }, [cart, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem("duti-heritage_recently_viewed", JSON.stringify(recentlyViewed));
  }, [recentlyViewed, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    if (user) {
      localStorage.setItem("duti-heritage_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("duti-heritage_user");
    }
  }, [user, isInitialized]);

  const addToCart = React.useCallback((product: Product, size: string) => {
    setCart((prev) => {
      const cartItemId = `${product.id}-${size}`;
      const existing = prev.find((item) => item.cartItemId === cartItemId);
      if (existing) {
        return prev.map((item) =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, cartItemId, selectedSize: size, quantity: 1 }];
    });
    setIsCartOpen(true);
  }, []);

  const removeFromCart = React.useCallback((cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  }, []);

  const addRecentlyViewed = React.useCallback((product: Product) => {
    setRecentlyViewed((prev) => {
      // If it's already the first item, don't update state to prevent unnecessary re-renders
      if (prev[0]?.id === product.id) return prev;
      
      const filtered = prev.filter((p) => p.id !== product.id);
      return [product, ...filtered].slice(0, 6);
    });
  }, []);

  const login = React.useCallback((email: string) => {
    // Basic mock login: just strip the @domain and use it as a name
    const name = email.split("@")[0];
    setUser({ name, email });
  }, []);

  const logout = React.useCallback(() => {
    setUser(null);
  }, []);

  return (
    <AppContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        isCartOpen,
        setIsCartOpen,
        isSearchOpen,
        setIsSearchOpen,
        recentlyViewed,
        addRecentlyViewed,
        user,
        login,
        logout,
        isInitialized,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
