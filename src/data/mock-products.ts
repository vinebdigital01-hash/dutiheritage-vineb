import { Product, Collection } from "@/types";

export const collections: Collection[] = [
  { id: "c1", name: "New Arrivals", slug: "new-arrivals", productCount: 4 },
  { id: "c2", name: "New Western Launch", slug: "new-western-launch", productCount: 4 },
  { id: "c3", name: "ON SALE", slug: "on-sale", productCount: 4 },
  { id: "c4", name: "Duti Heritage Luxe", slug: "duti-heritage-luxe", productCount: 4 },
  { id: "c5", name: "UNSTITCHED SALE Collection", slug: "unstitched-sale", productCount: 5 },
  { id: "c6", name: "Premium Night Wear", slug: "premium-night-wear", productCount: 5 },
  { id: "c7", name: "Unstitched Collection", slug: "unstitched", productCount: 4 },
  { id: "c8", name: "Velvet Collection", slug: "velvet", productCount: 4 },
  { id: "c9", name: "Wedding / Trousseau Collection", slug: "wedding", productCount: 4 },
  { id: "c10", name: "Best Sellers", slug: "best-sellers", productCount: 4 },
  { id: "c11", name: "Dresses", slug: "dresses", productCount: 4 },
  { id: "c12", name: "Tops & Shirts", slug: "tops-shirts", productCount: 4 },
  { id: "c13", name: "Popular Picks", slug: "popular-picks", productCount: 4 },
];

export const products: Product[] = [
  // New Arrivals
  {
    id: "p1",
    name: "Midnight Velvet Gown",
    slug: "midnight-velvet-gown",
    price: 8999,
    image: "/images/velvet.jpg",
    colors: ["Emerald"],
    collectionId: "c1",
    tags: ["Bestseller", "Fast Selling"],
    boughtLast7Days: 524,
    videoUrls: [
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
      "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
    ],
    offers: [
      {
        title: "Free Shipping",
        description: "On all orders above ₹499",
        code: undefined
      },
      {
        title: "Welcome Discount",
        description: "Get 10% off your first order",
        code: "WELCOME10"
      },
      {
        title: "Buy 2 Get 1 Free",
        description: "On all accessories today",
        code: undefined
      }
    ]
  },
  { id: "p2", name: "Beige Co-Ord Set", slug: "beige-coord-set", price: 4599, image: "/images/western.jpg", collectionId: "c1", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },
  { id: "p3", name: "Maroon Silk Suit", slug: "maroon-silk-suit", price: 12500, image: "/images/unstitched.jpg", collectionId: "c1", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },
  { id: "p4", name: "Emerald Evening Dress", slug: "emerald-evening-dress", price: 7999, image: "/images/velvet.jpg", collectionId: "c1", tags: ["Wedding Guest", "Premium"], videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },
  
  // New Western Launch
  { id: "p5", name: "Linen Blazer Set", slug: "linen-blazer-set", price: 5499, image: "/images/western.jpg", collectionId: "c2", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },
  { id: "p6", name: "Satin Wrap Top", slug: "satin-wrap-top", price: 2499, image: "/images/western.jpg", collectionId: "c2", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },
  { id: "p7", name: "High Waisted Trousers", slug: "high-waisted-trousers", price: 3299, image: "/images/western.jpg", collectionId: "c2", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },
  { id: "p8", name: "Pleated Midi Skirt", slug: "pleated-midi-skirt", price: 2899, image: "/images/western.jpg", collectionId: "c2", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },

  // ON SALE
  { id: "p9", name: "Classic Red Anarkali", slug: "classic-red-anarkali", price: 15999, salePrice: 10999, image: "/images/unstitched.jpg", collectionId: "c3", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },
  { id: "p10", name: "Sequence Party Gown", slug: "sequence-party-gown", price: 12999, salePrice: 8999, image: "/images/velvet.jpg", collectionId: "c3", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },
  { id: "p11", name: "Casual Summer Dress", slug: "casual-summer-dress", price: 3999, salePrice: 1999, image: "/images/western.jpg", collectionId: "c3", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },
  { id: "p12", name: "Georgette Maxi", slug: "georgette-maxi", price: 6599, salePrice: 4299, image: "/images/velvet.jpg", collectionId: "c3", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },

  // Duti Heritage Luxe
  { id: "p13", name: "Handcrafted Zari Lehenga", slug: "handcrafted-zari-lehenga", price: 35000, image: "/images/unstitched.jpg", collectionId: "c4", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },
  { id: "p14", name: "Pure Silk Saree", slug: "pure-silk-saree", price: 28500, image: "/images/unstitched.jpg", collectionId: "c4", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },
  { id: "p15", name: "Designer Velvet Kurta", slug: "designer-velvet-kurta", price: 18999, image: "/images/velvet.jpg", collectionId: "c4", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },
  { id: "p16", name: "Embroidered Cape Set", slug: "embroidered-cape-set", price: 22500, image: "/images/western.jpg", collectionId: "c4", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },

  // UNSTITCHED SALE Collection (5 products)
  { id: "p17", name: "Floral Print Chiffon", slug: "floral-print-chiffon", price: 4999, salePrice: 2999, image: "/images/unstitched.jpg", collectionId: "c5", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },
  { id: "p18", name: "Cotton Silk Block Print", slug: "cotton-silk-block", price: 3599, salePrice: 2199, image: "/images/unstitched.jpg", collectionId: "c5", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },
  { id: "p19", name: "Banarasi Brocade Fabric", slug: "banarasi-brocade", price: 8999, salePrice: 5999, image: "/images/unstitched.jpg", collectionId: "c5", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },
  { id: "p20", name: "Chanderi Suit Material", slug: "chanderi-suit", price: 5499, salePrice: 3499, image: "/images/unstitched.jpg", collectionId: "c5", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },
  { id: "p21", name: "Organza Pastel Set", slug: "organza-pastel", price: 6999, salePrice: 4599, image: "/images/unstitched.jpg", collectionId: "c5", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },

  // Premium Night Wear (5 products)
  { id: "p22", name: "Silk Satin Robe", slug: "silk-satin-robe", price: 3499, image: "/images/velvet.jpg", collectionId: "c6", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },
  { id: "p23", name: "Lace Trim Slip Dress", slug: "lace-trim-slip", price: 2899, image: "/images/western.jpg", collectionId: "c6", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },
  { id: "p24", name: "Cotton Pajama Set", slug: "cotton-pajama-set", price: 1999, image: "/images/western.jpg", collectionId: "c6", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },
  { id: "p25", name: "Velvet Lounge Suit", slug: "velvet-lounge-suit", price: 4599, image: "/images/velvet.jpg", collectionId: "c6", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },
  { id: "p26", name: "Modal Sleep Shirt", slug: "modal-sleep-shirt", price: 1699, image: "/images/western.jpg", collectionId: "c6", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },

  // Unstitched Collection
  { id: "p27", name: "Premium Muslin Set", slug: "premium-muslin", price: 5999, image: "/images/unstitched.jpg", collectionId: "c7", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },
  { id: "p28", name: "Handloom Cotton", slug: "handloom-cotton", price: 2499, image: "/images/unstitched.jpg", collectionId: "c7", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },
  { id: "p29", name: "Festive Silk Blend", slug: "festive-silk-blend", price: 8499, image: "/images/unstitched.jpg", collectionId: "c7", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },
  { id: "p30", name: "Georgette with Chikankari", slug: "georgette-chikankari", price: 7299, image: "/images/unstitched.jpg", collectionId: "c7", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },

  // Velvet Collection
  { id: "p31", name: "Royal Blue Tunic", slug: "royal-blue-tunic", price: 6499, image: "/images/velvet.jpg", collectionId: "c8", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },
  { id: "p32", name: "Wine Velvet Kaftan", slug: "wine-velvet-kaftan", price: 5899, image: "/images/velvet.jpg", collectionId: "c8", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },
  { id: "p33", name: "Black Velvet Blazer", slug: "black-velvet-blazer", price: 8999, image: "/images/velvet.jpg", collectionId: "c8", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },
  { id: "p34", name: "Teal Velvet Suit Set", slug: "teal-velvet-suit", price: 14500, image: "/images/velvet.jpg", collectionId: "c8", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },

  // Wedding / Trousseau Collection
  { id: "p35", name: "Bridal Red Lehenga", slug: "bridal-red-lehenga", price: 85000, image: "/images/unstitched.jpg", collectionId: "c9", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },
  { id: "p36", name: "Reception Gown", slug: "reception-gown", price: 45000, image: "/images/velvet.jpg", collectionId: "c9", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },
  { id: "p37", name: "Haldi Yellow Suit", slug: "haldi-yellow-suit", price: 12500, image: "/images/unstitched.jpg", collectionId: "c9", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },
  { id: "p38", name: "Sangeet Sequin Saree", slug: "sangeet-sequin-saree", price: 28000, image: "/images/velvet.jpg", collectionId: "c9", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },

  // Best Sellers
  { id: "p39", name: "Everyday White Shirt", slug: "everyday-white-shirt", price: 1899, image: "/images/western.jpg", collectionId: "c10", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },
  { id: "p40", name: "Floral Wrap Dress", slug: "floral-wrap-dress", price: 3499, image: "/images/western.jpg", collectionId: "c10", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },
  { id: "p41", name: "Classic Denim Jacket", slug: "classic-denim-jacket", price: 4299, image: "/images/western.jpg", collectionId: "c10", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },
  { id: "p42", name: "Silk Blend Kurta", slug: "silk-blend-kurta", price: 2999, image: "/images/unstitched.jpg", collectionId: "c10", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },

  // Dresses
  { id: "p43", name: "Polka Dot Midi", slug: "polka-dot-midi", price: 2799, image: "/images/western.jpg", collectionId: "c11", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },
  { id: "p44", name: "Ruffled Mini Dress", slug: "ruffled-mini-dress", price: 2499, image: "/images/western.jpg", collectionId: "c11", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },
  { id: "p45", name: "Elegant Maxi", slug: "elegant-maxi", price: 4599, image: "/images/velvet.jpg", collectionId: "c11", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },
  { id: "p46", name: "Bodycon Evening Dress", slug: "bodycon-evening", price: 3899, image: "/images/velvet.jpg", collectionId: "c11", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },

  // Tops & Shirts
  { id: "p47", name: "Lace Trim Cami", slug: "lace-trim-cami", price: 1299, image: "/images/western.jpg", collectionId: "c12", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },
  { id: "p48", name: "Oversized Linen Shirt", slug: "oversized-linen-shirt", price: 2199, image: "/images/western.jpg", collectionId: "c12", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },
  { id: "p49", name: "Puff Sleeve Blouse", slug: "puff-sleeve-blouse", price: 1899, image: "/images/western.jpg", collectionId: "c12", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },
  { id: "p50", name: "Ribbed Knit Top", slug: "ribbed-knit-top", price: 1499, image: "/images/western.jpg", collectionId: "c12", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },

  // Popular Picks
  { id: "p51", name: "Signature Tote Bag", slug: "signature-tote", price: 3599, image: "/images/western.jpg", collectionId: "c13", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },
  { id: "p52", name: "Wide Leg Trousers", slug: "wide-leg-trousers", price: 2699, image: "/images/western.jpg", collectionId: "c13", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },
  { id: "p53", name: "Cashmere Blend Scarf", slug: "cashmere-blend-scarf", price: 1899, image: "/images/unstitched.jpg", collectionId: "c13", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },
  { id: "p54", name: "Statement Earrings", slug: "statement-earrings", price: 899, image: "/images/western.jpg", collectionId: "c13", videoUrls: [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
] },
];

export const getProductsByCollectionId = (id: string) => {
  return products.filter((p) => p.collectionId === id);
};
