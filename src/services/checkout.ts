import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Product, Settings } from "@/models";
import { ApiError } from "@/lib/api";

export type CheckoutSettings = {
  freeShippingAbove: number;
  flatShippingFee: number;
  codExtraCharge: number;
  prepaidDiscount: { type: "FLAT" | "PERCENT"; value: number };
  partialCodAdvance: number;
  codPrefixes: string[];
  codPincodes: string[];
  codCities: string[];
  codMode: "ALL_INDIA" | "CITY_LIST" | "PINCODE_LIST";
  codEnabled: boolean;
};

const DEFAULT_SETTINGS: CheckoutSettings = {
  freeShippingAbove: 999,
  flatShippingFee: 99,
  codExtraCharge: 49,
  prepaidDiscount: { type: "FLAT", value: 50 },
  partialCodAdvance: 199,
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
  codPincodes: [],
  codCities: [],
  codMode: "PINCODE_LIST",
  codEnabled: true,
};

export async function getCheckoutSettings(): Promise<CheckoutSettings> {
  if (!process.env.MONGODB_URI) return DEFAULT_SETTINGS;

  await connectDB();
  const doc = await Settings.findById("cod").lean();
  if (!doc) return DEFAULT_SETTINGS;

  return {
    freeShippingAbove: doc.freeShippingAbove ?? DEFAULT_SETTINGS.freeShippingAbove,
    flatShippingFee: doc.flatShippingFee ?? DEFAULT_SETTINGS.flatShippingFee,
    codExtraCharge: doc.codExtraCharge ?? DEFAULT_SETTINGS.codExtraCharge,
    prepaidDiscount: {
      type: (doc.prepaidDiscount?.type as "FLAT" | "PERCENT") || "FLAT",
      value: doc.prepaidDiscount?.value ?? 50,
    },
    partialCodAdvance:
      doc.partialCodAdvance ?? DEFAULT_SETTINGS.partialCodAdvance,
    codPrefixes: doc.codPrefixes?.length
      ? doc.codPrefixes
      : DEFAULT_SETTINGS.codPrefixes,
    codPincodes: doc.codPincodes ?? [],
    codCities: doc.codCities ?? [],
    codMode: (doc.codMode as CheckoutSettings["codMode"]) || "PINCODE_LIST",
    codEnabled: doc.codEnabled !== false,
  };
}

export function isCodAvailableForPin(
  pin: string,
  settings: CheckoutSettings,
  city?: string
): boolean {
  if (!settings.codEnabled) return false;
  if (settings.codMode === "ALL_INDIA") return true;
  if (pin.length !== 6) return false;

  if (settings.codMode === "CITY_LIST") {
    if (!city) return false;
    const normalized = city.trim().toLowerCase();
    return settings.codCities.some((c) => c.trim().toLowerCase() === normalized);
  }

  // PINCODE_LIST: exact match OR prefix match
  if (settings.codPincodes.includes(pin)) return true;
  if (settings.codPrefixes.some((p) => pin.startsWith(p))) return true;
  return false;
}

export type CartLineInput = {
  productId: string;
  quantity: number;
  size?: string;
  color?: string;
};

export type PricedLine = {
  productId: string;
  slug: string;
  name: string;
  image: string;
  collectionId: string;
  size?: string;
  color?: string;
  quantity: number;
  price: number;
  salePrice?: number | null;
};

export async function priceCartLines(
  lines: CartLineInput[]
): Promise<PricedLine[]> {
  if (!lines.length) throw new ApiError("Cart is empty");

  await connectDB();
  const ids = [...new Set(lines.map((l) => l.productId))].filter((id) =>
    mongoose.Types.ObjectId.isValid(id)
  );

  if (ids.length === 0) {
    throw new ApiError(
      "No valid product ids in cart. Clear your cart and add products again after seeding MongoDB.",
      400
    );
  }

  const products = await Product.find({ isActive: true })
    .where("_id")
    .in(ids)
    .lean();

  const byId = new Map(products.map((p) => [p._id.toString(), p]));

  return lines.map((line) => {
    const product = byId.get(line.productId);
    if (!product) {
      throw new ApiError(`Product not found or inactive: ${line.productId}`, 400);
    }
    const qty = Math.max(1, Number(line.quantity) || 1);
    return {
      productId: line.productId,
      slug: product.slug,
      name: product.name,
      image: product.image,
      collectionId: String(product.collectionId ?? ""),
      size: line.size,
      color: line.color,
      quantity: qty,
      price: product.price,
      salePrice: product.salePrice ?? null,
    };
  });
}

export async function resolveCouponDiscount(
  code: string | undefined | null,
  subtotal: number,
  opts?: { productIds?: string[]; collectionIds?: string[] }
): Promise<{ code: string; amount: number } | null> {
  if (!code?.trim()) return null;
  const { validateCouponCode } = await import("@/lib/coupons");
  const result = await validateCouponCode({
    code,
    subtotal,
    productIds: opts?.productIds,
    collectionIds: opts?.collectionIds,
  });
  return { code: result.code, amount: result.amount };
}

export function computeCheckoutTotals(input: {
  lines: PricedLine[];
  paymentMethod: "prepaid" | "cod" | "partial";
  settings: CheckoutSettings;
  discountAmount: number;
  pinCode: string;
  city?: string;
}) {
  const { lines, paymentMethod, settings, discountAmount, pinCode, city } =
    input;

  const subtotal = lines.reduce(
    (sum, line) => sum + (line.salePrice ?? line.price) * line.quantity,
    0
  );

  const isFreeShipping = subtotal >= settings.freeShippingAbove;
  const shipping =
    subtotal > 0 ? (isFreeShipping ? 0 : settings.flatShippingFee) : 0;

  if (paymentMethod === "cod" || paymentMethod === "partial") {
    if (!isCodAvailableForPin(pinCode, settings, city)) {
      throw new ApiError("COD is not available for this pincode", 400);
    }
  }

  const codCharge = paymentMethod === "cod" ? settings.codExtraCharge : 0;

  let prepaidDiscount = 0;
  if (paymentMethod === "prepaid") {
    prepaidDiscount =
      settings.prepaidDiscount.type === "PERCENT"
        ? Math.round((subtotal * settings.prepaidDiscount.value) / 100)
        : settings.prepaidDiscount.value;
  }

  const total = Math.max(
    0,
    subtotal + shipping - discountAmount + codCharge - prepaidDiscount
  );

  const advanceAmount =
    paymentMethod === "partial"
      ? Math.min(settings.partialCodAdvance, total)
      : 0;

  const amountToPayNow =
    paymentMethod === "cod"
      ? 0
      : paymentMethod === "partial"
        ? advanceAmount
        : total;

  return {
    subtotal,
    shipping,
    discountAmount,
    codCharge,
    prepaidDiscount,
    total,
    advanceAmount,
    amountToPayNow,
    isFreeShipping,
  };
}
