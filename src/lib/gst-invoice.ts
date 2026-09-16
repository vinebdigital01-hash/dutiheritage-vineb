import {
  customerStateCode,
  getStoreIdentity,
  round2,
  splitGstInclusive,
} from "@/lib/store-identity";

export type GstInvoiceItem = {
  name: string;
  size?: string;
  quantity: number;
  price: number;
  salePrice?: number;
  hsn?: string;
  gstRate?: number;
};

export type GstInvoiceOrder = {
  orderId: string;
  createdAt?: string;
  customer: {
    name: string;
    email?: string;
    phone: string;
    address: string;
    apartment?: string;
    city: string;
    state: string;
    pinCode: string;
    country?: string;
  };
  items: GstInvoiceItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  codCharge: number;
  prepaidDiscount: number;
  total: number;
  paymentMethod: string;
  couponCode?: string | null;
};

export type GstLine = {
  name: string;
  size?: string;
  hsn: string;
  qty: number;
  gstRate: number;
  unitGross: number;
  discountShare: number;
  netGross: number;
  taxable: number;
  gst: number;
  cgst: number;
  sgst: number;
  igst: number;
};

export type GstChargeLine = {
  label: string;
  gstRate: number;
  gross: number;
  taxable: number;
  gst: number;
  cgst: number;
  sgst: number;
  igst: number;
};

export type GstInvoiceModel = {
  seller: ReturnType<typeof getStoreIdentity>;
  sellerPan: string;
  buyer: GstInvoiceOrder["customer"];
  intra: boolean;
  placeOfSupply: string;
  placeOfSupplyCode: string;
  lines: GstLine[];
  charges: GstChargeLine[];
  couponCode?: string | null;
  totals: {
    taxable: number;
    cgst: number;
    sgst: number;
    igst: number;
    gst: number;
    goodsGross: number;
    discount: number;
    prepaidDiscount: number;
    grandTotal: number;
  };
};

function splitTax(gst: number, intra: boolean) {
  if (intra) {
    const half = round2(gst / 2);
    return { cgst: half, sgst: round2(gst - half), igst: 0 };
  }
  return { cgst: 0, sgst: 0, igst: round2(gst) };
}

export function inr(n: number) {
  return round2(n).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Store prices are GST-inclusive. Reverse-split into taxable + tax. */
export function buildGstInvoice(
  order: GstInvoiceOrder,
  sellerOverride?: ReturnType<typeof getStoreIdentity>
): GstInvoiceModel {
  const seller = sellerOverride || getStoreIdentity();
  const buyerCode = customerStateCode(order.customer.state);
  const intra = Boolean(seller.stateCode && buyerCode && seller.stateCode === buyerCode);

  const goodsGross = order.items.reduce(
    (s, item) => s + (item.salePrice ?? item.price) * item.quantity,
    0
  );
  const combinedDiscount = round2((order.discount || 0) + (order.prepaidDiscount || 0));

  const lines: GstLine[] = order.items.map((item) => {
    const unitGross = item.salePrice ?? item.price;
    const lineGross = round2(unitGross * item.quantity);
    const discountShare =
      goodsGross > 0 ? round2((lineGross / goodsGross) * combinedDiscount) : 0;
    const netGross = round2(Math.max(0, lineGross - discountShare));
    const gstRate = Number(item.gstRate ?? 5);
    const split = splitGstInclusive(netGross, gstRate);
    const tax = splitTax(split.gst, intra);
    return {
      name: item.name,
      size: item.size,
      hsn: item.hsn || "6104",
      qty: item.quantity,
      gstRate,
      unitGross: round2(unitGross),
      discountShare,
      netGross,
      taxable: split.taxable,
      gst: split.gst,
      ...tax,
    };
  });

  const charges: GstChargeLine[] = [];
  const pushCharge = (label: string, gross: number, gstRate: number) => {
    if (!gross) return;
    const split = splitGstInclusive(gross, gstRate);
    const tax = splitTax(split.gst, intra);
    charges.push({
      label,
      gstRate,
      gross: round2(gross),
      taxable: split.taxable,
      gst: split.gst,
      ...tax,
    });
  };
  pushCharge("Shipping", order.shipping || 0, 18);
  pushCharge("COD fee", order.codCharge || 0, 18);

  const all = [
    ...lines.map((l) => ({
      taxable: l.taxable,
      cgst: l.cgst,
      sgst: l.sgst,
      igst: l.igst,
      gst: l.gst,
    })),
    ...charges,
  ];

  return {
    seller,
    sellerPan: seller.gstin.replace(/\s/g, "").slice(2, 12),
    buyer: order.customer,
    intra,
    placeOfSupply: order.customer.state,
    placeOfSupplyCode: buyerCode,
    lines,
    charges,
    couponCode: order.couponCode,
    totals: {
      taxable: round2(all.reduce((s, r) => s + r.taxable, 0)),
      cgst: round2(all.reduce((s, r) => s + r.cgst, 0)),
      sgst: round2(all.reduce((s, r) => s + r.sgst, 0)),
      igst: round2(all.reduce((s, r) => s + r.igst, 0)),
      gst: round2(all.reduce((s, r) => s + r.gst, 0)),
      goodsGross: round2(goodsGross),
      discount: round2(order.discount || 0),
      prepaidDiscount: round2(order.prepaidDiscount || 0),
      grandTotal: round2(order.total),
    },
  };
}
