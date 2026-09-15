export type Collection = {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
  seoDescription?: string;
  discountBanner?: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number | null;
  image: string;
  images?: string[]; // Additional gallery images
  description?: string;
  sizes?: string[];
  colors?: string[];
  collectionId: string;
  seoTitle?: string;
  seoDescription?: string;
  badge?: string; // Legacy
  tags?: string[]; // Multiple tags like "Best Seller", "Sale", etc.
  boughtLast7Days?: number; // e.g., 150, 500
  videoUrls?: string[]; // Array of UGC showcasing video URLs
  offers?: {
    title: string;
    description: string;
    code?: string; // If undefined, show "NO CODE REQUIRED"
  }[];
  codAvailable?: boolean;
  isPartialCOD?: boolean;
  partialCODAdvance?: number;
  inventory?: {
    size: string;
    stock: number;
    sku?: string;
  }[];
  trackInventory?: boolean;
  lowStockThreshold?: number;
  stockStatus?: "in_stock" | "low_stock" | "out_of_stock";
};

export type UserProfile = {
  phone?: string;
  address?: string;
  apartment?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  country?: string;
};
