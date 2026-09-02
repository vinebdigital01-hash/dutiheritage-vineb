"use client";
import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { Product, UserProfile } from "@/types";
import { trackMetaEvent } from "@/lib/meta-pixel";
import { trackEvent } from "@/lib/track-client";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { syncAuthToBackend } from "@/lib/auth-client";
import { syncCartToServer } from "@/lib/cart-client";

export interface CartItem extends Product {
  cartItemId: string; // unique ID for cart (id + size)
  selectedSize: string;
  selectedColor?: string;
  quantity: number;
}

interface AppContextType {
  cart: CartItem[];
  addToCart: (product: Product, size: string) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (isOpen: boolean) => void;
  recentlyViewed: Product[];
  addRecentlyViewed: (product: Product) => void;
  user: { name: string; email: string; uid: string; phone?: string } | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  adminRole: string | null;
  authLoading: boolean;
  login: (email: string) => void;
  logout: () => void;
  isInitialized: boolean;
  wishlist: string[];
  toggleWishlist: (productId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [user, setUser] = useState<{ name: string; email: string; uid: string; phone?: string } | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
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

        const synced = await syncAuthToBackend(firebaseUser);
        setUserProfile(synced.profile);
        setIsAdmin(synced.isAdmin);
        setAdminRole(synced.adminRole || null);

        // Fetch wishlist items
        try {
          const token = await firebaseUser.getIdToken();
          const wRes = await fetch("/api/wishlist", {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (wRes.ok) {
            const wData = await wRes.json();
            setWishlist(wData.wishlists.map((w: any) => w.productId));
          }
        } catch (e) {
          console.error("Failed to load wishlist", e);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setIsAdmin(false);
        setAdminRole(null);
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

    // Sync to Mongo for abandoned-cart automations (debounced)
    const t = setTimeout(() => {
      void syncCartToServer({
        items: cart.map((item) => ({
          productId: item.id,
          size: item.selectedSize,
          quantity: item.quantity,
          price: item.salePrice || item.price,
          name: item.name,
          image: item.image,
        })),
        email: user?.email,
        phone: user?.phone || userProfile?.phone,
      });
    }, 800);
    return () => clearTimeout(t);
  }, [cart, isInitialized, user?.email, user?.phone, userProfile?.phone]);

  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem("duti-heritage_recently_viewed", JSON.stringify(recentlyViewed));
    } catch {}
  }, [recentlyViewed, isInitialized]);

  const addToCart = React.useCallback((product: Product, size: string, color?: string) => {
    setCart((prev) => {
      const cartItemId = color ? `${product.id}-${size}-${color}` : `${product.id}-${size}`;
      const existing = prev.find((item) => item.cartItemId === cartItemId);
      if (existing) {
        return prev.map((item) =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, cartItemId, selectedSize: size, selectedColor: color, quantity: 1 }];
    });
    setIsCartOpen(true);
    trackMetaEvent("AddToCart", {
      content_ids: [product.id],
      content_name: product.name,
      currency: "INR",
      value: product.salePrice || product.price,
    });
    trackEvent({
      event: "add_to_cart",
      productId: product.id,
      productName: product.name,
    });
  }, []);

  const removeFromCart = React.useCallback((cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  }, []);

  const updateQuantity = React.useCallback((cartItemId: string, delta: number) => {
    setCart((prev) => prev.map((item) => {
      if (item.cartItemId === cartItemId) {
        const newQty = item.quantity + delta;
        return { ...item, quantity: Math.max(1, newQty) }; // minimum qty is 1
      }
      return item;
    }));
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

  
  const toggleWishlist = React.useCallback(async (productId: string) => {
    if (!user) {
      alert('Please login to save to your wishlist.');
      return;
    }
    
    // Optimistic UI update
    setWishlist(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );

    try {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
      await fetch('/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ productId })
      });
    } catch(e) {
      console.error('Failed to toggle wishlist', e);
      // Revert optimistic update
      setWishlist(prev => 
        prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
      );
    }
  }, [user]);

  const login = React.useCallback((_email: string) => {
    // Handled by account UI via Firebase; AppContext syncs on onAuthStateChanged.
  }, []);

  const logout = React.useCallback(async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  }, []);

  const contextValue = useMemo(() => ({
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isCartOpen,
    setIsCartOpen,
    isSearchOpen,
    setIsSearchOpen,
    recentlyViewed,
    addRecentlyViewed,
    user,
    userProfile,
    isAdmin,
    adminRole,
    authLoading,
    login,
    logout,
    isInitialized,
    wishlist,
    toggleWishlist,
  }), [
    cart, addToCart, removeFromCart, updateQuantity, clearCart,
    isCartOpen, isSearchOpen, recentlyViewed, addRecentlyViewed,
    user, userProfile, isAdmin, adminRole, authLoading, login, logout,
    isInitialized, wishlist, toggleWishlist
  ]);

  return (
    <AppContext.Provider value={contextValue}>
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

