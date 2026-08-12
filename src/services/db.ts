import { Product, Collection } from "@/types";
import { products, collections } from "@/data/mock-products";

/**
 * DATABASE ACCESS LAYER (Repository Pattern)
 * ------------------------------------------
 * All UI components and pages must call these functions instead of directly
 * importing mock data or calling a specific database.
 * 
 * To migrate to Firebase, MongoDB, or AWS in the future, you ONLY need to
 * change the logic inside these functions. The rest of the app will remain untouched!
 */

export const db = {
  // --- PRODUCTS ---
  
  async getAllProducts(): Promise<Product[]> {
    // Future: return await firebase.firestore().collection('products').get()
    return products;
  },

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    // Future: return await firebase.firestore().collection('products').where('slug', '==', slug).get()
    return products.find(p => p.slug === slug);
  },

  async getProductsByCollectionId(collectionId: string): Promise<Product[]> {
    if (collectionId === "all") return products;
    return products.filter(p => p.collectionId === collectionId);
  },

  // --- COLLECTIONS ---

  async getAllCollections(): Promise<Collection[]> {
    return collections;
  },

  async getCollectionBySlug(slug: string): Promise<Collection | undefined> {
    return collections.find(c => c.slug === slug);
  }
};
