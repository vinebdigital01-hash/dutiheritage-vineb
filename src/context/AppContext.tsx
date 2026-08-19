"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { Product } from "@/types";
import { trackMetaEvent } from "@/lib/meta-pixel";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

export interface CartItem extends Product {
  cartItemId: string; // unique ID for cart (id + size)
  selectedSize: string;
  quantity: number;
}

export interface UserProfile {
  phone?: string;
  address?: string;
  apartment?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  country?: string;
}

interface AppContextType {
  cart: CartItem[];
  addToCart: (product: Product, size: string) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (isOpen: boolean) => void;
  recentlyViewed: Product[];
  addRecentlyViewed: (product: Product) => void;
  user: { name: string; email: string; uid: string; phone?: string } | null;
  userProfile: UserProfile | null;
  authLoading: boolean;
  login: (email: string) => void;
  logout: () => void;
  isInitialized: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [user, setUser] = useState<{ name: string; email: string; uid: string; phone?: string } | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("duti-heritage_cart");
      const savedRecentlyViewed = localStorage.getItem("duti-heritage_recently_viewed");
      
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (savedCart) setCart(JSON.parse(savedCart));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (savedRecentlyViewed) setRecentlyViewed(JSON.parse(savedRecentlyViewed));
    } catch {}
    setIsInitialized(true);

    // Listen to live Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
          phone: firebaseUser.phoneNumber || undefined
        });

        // TODO: Fetch user profile from MongoDB backend when built
        setUserProfile(null); // Temporarily null until MongoDB is hooked up
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Save to LocalStorage on change
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem("duti-heritage_cart", JSON.stringify(cart));
    } catch {}
  }, [cart, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem("duti-heritage_recently_viewed", JSON.stringify(recentlyViewed));
    } catch {}
  }, [recentlyViewed, isInitialized]);

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
    trackMetaEvent("AddToCart", {
      content_ids: [product.id],
      content_name: product.name,
      currency: "INR",
      value: product.salePrice || product.price,
    });
  }, []);

  const removeFromCart = React.useCallback((cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  }, []);

  const clearCart = React.useCallback(() => {
    setCart([]);
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
    // This is now handled by the UI calling Firebase directly, 
    // but keeping it here to avoid breaking other components if they use it.
  }, []);

  const logout = React.useCallback(async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        isSearchOpen,
        setIsSearchOpen,
        recentlyViewed,
        addRecentlyViewed,
        user,
        userProfile,
        authLoading,
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
