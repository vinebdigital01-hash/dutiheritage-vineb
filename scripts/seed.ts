/**
 * Seed MongoDB with mock catalog + default store settings / coupons.
 *
 * Usage (from frontend/):
 *   npm run seed
 *
 * Requires MONGODB_URI in .env.local
 */
import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env") });

import mongoose from "mongoose";
import {
  products as mockProducts,
  collections as mockCollections,
} from "../src/data/mock-products";
import { Product } from "../src/models/Product";
import { Collection } from "../src/models/Collection";
import { Coupon } from "../src/models/Coupon";
import { Settings } from "../src/models/Settings";
import { SiteContent } from "../src/models/SiteContent";

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ Missing MONGODB_URI. Add it to .env.local first.");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri);
  console.log("Connected.\n");

  const wipe = process.argv.includes("--wipe");
  if (wipe) {
    console.log("Wiping products, collections, coupons, settings, siteContent...");
    await Promise.all([
      Product.deleteMany({}),
      Collection.deleteMany({}),
      Coupon.deleteMany({}),
      Settings.deleteMany({}),
      SiteContent.deleteMany({}),
    ]);
  }

  // --- Collections (map mock c1..c13 → Mongo ids) ---
  const collectionIdMap = new Map<string, string>();

  for (const c of mockCollections) {
    const doc = await Collection.findOneAndUpdate(
      { slug: c.slug },
      {
        $set: {
          name: c.name,
          slug: c.slug,
          productCount: c.productCount ?? 0,
          isActive: true,
        },
      },
      { upsert: true, new: true }
    );
    collectionIdMap.set(c.id, doc._id.toString());
    console.log(`  collection: ${c.slug} → ${doc._id}`);
  }

  // --- Products ---
  let productCount = 0;
  for (const p of mockProducts) {
    const mappedCollectionId = collectionIdMap.get(p.collectionId);
    if (!mappedCollectionId) {
      console.warn(`  skip ${p.slug}: unknown collectionId ${p.collectionId}`);
      continue;
    }

    await Product.findOneAndUpdate(
      { slug: p.slug },
      {
        $set: {
          name: p.name,
          slug: p.slug,
          price: p.price,
          salePrice: p.salePrice ?? null,
          description: p.description ?? "",
          collectionId: mappedCollectionId,
          image: p.image,
          images: p.images ?? [],
          sizes: p.sizes ?? ["XS", "S", "M", "L", "XL"],
          colors: p.colors ?? [],
          tags: p.tags ?? [],
          badge: p.badge,
          seoTitle: p.seoTitle,
          seoDescription: p.seoDescription,
          boughtLast7Days: p.boughtLast7Days ?? 0,
          videoUrls: p.videoUrls ?? [],
          offers: (p.offers ?? []).map((o) => ({
            title: o.title,
            description: o.description,
            ...(o.code ? { code: o.code } : {}),
          })),
          codAvailable: p.codAvailable ?? true,
          isActive: true,
        },
      },
      { upsert: true, new: true }
    );
    productCount += 1;
  }
  console.log(`\n  products upserted: ${productCount}`);

  // Refresh productCount on collections
  for (const [, mongoId] of collectionIdMap) {
    const count = await Product.countDocuments({
      collectionId: mongoId,
      isActive: true,
    });
    await Collection.findByIdAndUpdate(mongoId, { productCount: count });
  }

  // --- Default COD / shipping settings ---
  await Settings.findOneAndUpdate(
    { _id: "cod" },
    {
      $set: {
        codEnabled: true,
        codMode: "PINCODE_LIST",
        codPrefixes: [
          "1100",
          "4000",
          "5600",
          "3020",
          "5000",
          "6000",
          "7000",
          "3800",
          "4110",
          "2260",
          "2080",
        ],
        codExtraCharge: 49,
        prepaidDiscount: { type: "FLAT", value: 50 },
        partialCodAdvance: 199,
        freeShippingAbove: 999,
        flatShippingFee: 99,
      },
    },
    { upsert: true }
  );
  console.log("  settings: cod defaults");

  // --- Demo coupons ---
  const coupons = [
    {
      code: "WELCOME10",
      discountType: "PERCENT" as const,
      discountValue: 10,
      minOrderAmount: 0,
    },
    {
      code: "FLAT200",
      discountType: "FLAT" as const,
      discountValue: 200,
      minOrderAmount: 1500,
    },
    {
      code: "DUTI25",
      discountType: "PERCENT" as const,
      discountValue: 25,
      minOrderAmount: 2000,
    },
  ];

  for (const coupon of coupons) {
    await Coupon.findOneAndUpdate(
      { code: coupon.code },
      {
        $set: {
          ...coupon,
          scope: "ALL_PRODUCTS",
          active: true,
          usedCount: 0,
        },
      },
      { upsert: true }
    );
  }
  console.log("  coupons: WELCOME10, FLAT200, DUTI25");

  // --- Site content ---
  await SiteContent.findOneAndUpdate(
    { _id: "global" },
    {
      $setOnInsert: {
        announcementText: "NEW ARRIVALS UPTO 40% OFF",
        homepageSlugs: mockCollections.map((c) => c.slug),
      },
    },
    { upsert: true }
  );
  console.log("  siteContent: global");

  await mongoose.disconnect();
  console.log("\n✅ Seed complete. Run the app with MONGODB_URI set.");
}

seed().catch(async (err) => {
  console.error("Seed failed:", err);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
