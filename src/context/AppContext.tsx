"use client";
import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from "react";
import { Product, UserProfile } from "@/types";
import { trackMetaEvent } from "@/lib/meta-pixel";
import { trackEvent } from "@/lib/track-client";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { syncAuthToBackend } from "@/lib/auth-client";
import { maxPurchasableQty, qtyOfProductSizeInCart } from "@/lib/cart-stock";
import {
  syncCartToServer,
  fetchServerCart,
  userCartStorageKey,
  cartLineKey,
  type ServerCartItem,
} from "@/lib/cart-client";

export interface CartItem extends Product {
  cartItemId: string; // unique ID for cart (id + size)
  selectedSize: string;
  selectedColor?: string;
  quantity: number;
}

const CART_LS_KEY = "duti-heritage_cart";
const CART_OWNER_KEY = "duti-heritage_cart_owner";

function parseCartJson(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

/** Merge cart sources by line key; keep richer product fields and max qty (avoids double-count). */
function mergeCartSources(sources: CartItem[][]): CartItem[] {
  const map = new Map<string, CartItem>();
  for (const list of sources) {
    for (const item of list) {
      if (!item?.id) continue;
      const key =
        item.cartItemId ||
        cartLineKey(item.id, item.selectedSize, item.selectedColor);
      const prev = map.get(key);
      if (!prev) {
        map.set(key, { ...item, cartItemId: key, quantity: Math.max(1, Number(item.quantity) || 1) });
        continue;
      }
      const richer =
        (item.name && item.name !== "Product" && (!prev.name || prev.name === "Product")) ||
        (item.image && !prev.image) ||
        (Array.isArray(item.inventory) && !prev.inventory);
      const base = richer ? { ...prev, ...item, cartItemId: key } : prev;
      map.set(key, {
        ...base,
        quantity: Math.max(Number(prev.quantity) || 0, Number(item.quantity) || 0, 1),
      });
    }
  }
  return Array.from(map.values());
}

async function serverItemsToCartItems(items: ServerCartItem[]): Promise<CartItem[]> {
  const out: CartItem[] = [];
  await Promise.all(
    items.map(async (item) => {
      let product: Product | null = null;
      try {
        const res = await fetch(`/api/products/${item.productId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.product) product = data.product as Product;
        }
      } catch {
        /* use snapshot fields */
      }
      const size = item.size || "";
      const color = item.color;
      const key = cartLineKey(item.productId, size, color);
      out.push({
        id: item.productId,
        name: product?.name || item.name || "Product",
        slug: product?.slug || "",
        price: product?.price ?? item.price ?? 0,
        salePrice: product?.salePrice,
        image: product?.image || item.image || "",
        images: product?.images,
        description: product?.description,
        sizes: product?.sizes,
        colors: product?.colors,
        collectionId: product?.collectionId || "",
        inventory: product?.inventory,
        trackInventory: product?.trackInventory,
        lowStockThreshold: product?.lowStockThreshold,
        stockStatus: product?.stockStatus,
        tags: product?.tags,
        cartItemId: key,
        selectedSize: size,
        selectedColor: color,
        quantity: Math.max(1, Number(item.quantity) || 1),
      });
    })
  );
  return out;
}

interface AppContextType {
  cart: CartItem[];
  addToCart: (product: Product, size: string, color?: string) => void;
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
  isFrozen: boolean;
  adminRole: string | null;
  authLoading: boolean;
  login: (email: string) => void;
  logout: (redirectTo?: string) => void;
  isInitialized: boolean;
  wishlist: string[];
  toggleWishlist: (productId: string) => Promise<void>;
  setUserProfile: (profile: UserProfile | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [user, setUser] = useState<{ name: string; email: string; uid: string; phone?: string } | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const cartMergedForUid = useRef<string | null>(null);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_LS_KEY);
      const savedRecentlyViewed = localStorage.getItem("duti-heritage_recently_viewed");
      const savedWishlist = localStorage.getItem("duti-heritage_wishlist");
      
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (savedCart) setCart(JSON.parse(savedCart));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (savedRecentlyViewed) setRecentlyViewed(JSON.parse(savedRecentlyViewed));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (savedWishlist) {
        const ids = JSON.parse(savedWishlist);
        if (Array.isArray(ids)) setWishlist(ids.filter((id: unknown) => typeof id === "string"));
      }
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

        const token = await firebaseUser.getIdToken();
        let guestIds: string[] = [];
        try {
          const raw = localStorage.getItem("duti-heritage_wishlist");
          const parsed = raw ? JSON.parse(raw) : [];
          if (Array.isArray(parsed)) guestIds = parsed.filter((id: unknown) => typeof id === "string");
        } catch {}

        const [synced, wRes] = await Promise.all([
          syncAuthToBackend(firebaseUser),
          fetch("/api/wishlist", { headers: { Authorization: `Bearer ${token}` } }).catch(() => null)
        ]);

        setUserProfile(synced.profile);
        setIsAdmin(synced.isAdmin);
        setIsFrozen(synced.isFrozen || false);
        setAdminRole(synced.adminRole || null);

        let serverIds: string[] = [];
        if (wRes && wRes.ok) {
          const wData = await wRes.json();
          serverIds = wData.wishlists?.map((w: { productId?: string }) => String(w.productId || "")).filter(Boolean) || [];
        }
        const merged = Array.from(new Set([...guestIds, ...serverIds]));
        setWishlist(merged);
        const toAdd = guestIds.filter((id) => !serverIds.includes(id));
        if (toAdd.length > 0) {
          await fetch("/api/wishlist/merge", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ productIds: toAdd }),
          }).catch(() => null);
        }

        // Cart: restore/merge once per uid (local + uid backup + server)
        if (cartMergedForUid.current !== firebaseUser.uid) {
          cartMergedForUid.current = firebaseUser.uid;
          try {
            const owner = localStorage.getItem(CART_OWNER_KEY);
            const localCart = parseCartJson(localStorage.getItem(CART_LS_KEY));
            const backupCart = parseCartJson(
              localStorage.getItem(userCartStorageKey(firebaseUser.uid))
            );
            const serverRaw = await fetchServerCart();
            const serverCart = await serverItemsToCartItems(serverRaw);

            let mergedCart: CartItem[];
            if (!owner || owner === firebaseUser.uid) {
              mergedCart = mergeCartSources([localCart, backupCart, serverCart]);
            } else {
              // Local cart belongs to a different account — do not steal their lines
              mergedCart = mergeCartSources([backupCart, serverCart]);
            }

            setCart(mergedCart);
            localStorage.setItem(CART_LS_KEY, JSON.stringify(mergedCart));
            localStorage.setItem(
              userCartStorageKey(firebaseUser.uid),
              JSON.stringify(mergedCart)
            );
            localStorage.setItem(CART_OWNER_KEY, firebaseUser.uid);

            void syncCartToServer({
              items: mergedCart.map((item) => ({
                productId: item.id,
                size: item.selectedSize,
                color: item.selectedColor,
                quantity: item.quantity,
                price: item.salePrice || item.price,
                name: item.name,
                image: item.image,
              })),
              email: firebaseUser.email,
              phone: firebaseUser.phoneNumber,
            });
          } catch (e) {
            console.warn("[cart-restore]", e);
          }
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setIsAdmin(false);
        setIsFrozen(false);
        setAdminRole(null);
        cartMergedForUid.current = null;
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Save to LocalStorage on change
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(CART_LS_KEY, JSON.stringify(cart));
      if (user?.uid) {
        localStorage.setItem(userCartStorageKey(user.uid), JSON.stringify(cart));
        localStorage.setItem(CART_OWNER_KEY, user.uid);
      }
    } catch {}

    // Sync to Mongo for abandoned-cart automations (debounced)
    const t = setTimeout(() => {
      void syncCartToServer({
        items: cart.map((item) => ({
          productId: item.id,
          size: item.selectedSize,
          color: item.selectedColor,
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
  }, [cart, isInitialized, user?.uid, user?.email, user?.phone, userProfile?.phone]);

  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem("duti-heritage_recently_viewed", JSON.stringify(recentlyViewed));
    } catch {}
  }, [recentlyViewed, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem("duti-heritage_wishlist", JSON.stringify(wishlist));
    } catch {}
  }, [wishlist, isInitialized]);

  const addToCart = React.useCallback((product: Product, size: string, color?: string) => {
    setCart((prev) => {
      const cartItemId = color ? `${product.id}-${size}-${color}` : `${product.id}-${size}`;
      const max = maxPurchasableQty(product, size);
      const used = qtyOfProductSizeInCart(prev, product.id, size);
      if (max !== null && used >= max) {
        return prev;
      }
      const room = max === null ? Infinity : Math.max(0, max - used);
      if (room < 1) return prev;
      const existing = prev.find((item) => item.cartItemId === cartItemId);
      if (existing) {
        return prev.map((item) =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: item.quantity + Math.min(1, room) }
            : item
        );
      }
      return [
        ...prev,
        {
          ...product,
          cartItemId,
          selectedSize: size,
          selectedColor: color,
          quantity: 1,
        },
      ];
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
    setCart((prev) =>
      prev.map((item) => {
        if (item.cartItemId !== cartItemId) return item;
        const newQty = item.quantity + delta;
        if (newQty < 1) return item;
        if (delta > 0) {
          const max = maxPurchasableQty(item, item.selectedSize);
          if (max !== null) {
            const usedByOthers = qtyOfProductSizeInCart(prev, item.id, item.selectedSize) - item.quantity;
            const allowed = Math.max(0, max - usedByOthers);
            if (newQty > allowed) {
              return { ...item, quantity: Math.max(item.quantity, allowed) };
            }
          }
        }
        return { ...item, quantity: newQty };
      })
    );
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
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );

    if (!auth.currentUser) return;

    try {
      const token = await auth.currentUser.getIdToken();
      await fetch("/api/wishlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId }),
      });
    } catch (e) {
      console.error("Failed to toggle wishlist", e);
      setWishlist((prev) =>
        prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
      );
    }
  }, []);

  const login = React.useCallback((_email: string) => {
    // Handled by account UI via Firebase; AppContext syncs on onAuthStateChanged.
  }, []);

  const logout = React.useCallback(async (redirectTo = "/") => {
    try {
      const uid = auth.currentUser?.uid;
      if (uid) {
        try {
          const snapshot = localStorage.getItem(CART_LS_KEY) || JSON.stringify(cart);
          localStorage.setItem(userCartStorageKey(uid), snapshot);
          localStorage.removeItem(CART_LS_KEY);
          localStorage.removeItem(CART_OWNER_KEY);
          localStorage.removeItem(CART_LS_KEY);
          localStorage.removeItem(CART_OWNER_KEY);
          // Keep CART_OWNER_KEY so a later different login does not inherit this cart
          localStorage.setItem(CART_OWNER_KEY, uid);
        } catch {}
      }
      await signOut(auth);
      window.location.href = redirectTo;
    } catch (error) {
      console.error("Error signing out", error);
    }
  }, [cart]);

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
    isFrozen,
    authLoading,
    login,
    logout,
    isInitialized,
    wishlist,
    toggleWishlist,
    setUserProfile,
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

