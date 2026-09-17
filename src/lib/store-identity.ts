/** Seller identity for GST invoices. Override with env; never commit secrets. */
export function getStoreIdentity() {
  return {
    legalName:
      process.env.NEXT_PUBLIC_STORE_LEGAL_NAME ||
      process.env.STORE_LEGAL_NAME ||
      "Duti Heritage",
    gstin:
      process.env.NEXT_PUBLIC_STORE_GSTIN ||
      process.env.STORE_GSTIN ||
      "06ANFPR1728Q2ZF",
    address:
      process.env.NEXT_PUBLIC_STORE_ADDRESS ||
      process.env.STORE_ADDRESS ||
      "Flat 103, 10th Floor, DLF Express Green M1, IMT Manesar, Gurugram, Haryana - 122052",
    state:
      process.env.NEXT_PUBLIC_STORE_STATE || process.env.STORE_STATE || "Haryana",
    stateCode:
      process.env.NEXT_PUBLIC_STORE_STATE_CODE || process.env.STORE_STATE_CODE || "06",
    supportEmail:
      process.env.NEXT_PUBLIC_STORE_SUPPORT_EMAIL ||
      process.env.STORE_SUPPORT_EMAIL ||
      "supportdutiheritage@gmail.com",
    supportPhone:
      process.env.NEXT_PUBLIC_STORE_SUPPORT_PHONE ||
      process.env.STORE_SUPPORT_PHONE ||
      "",
  };
}

const STATE_CODES: Record<string, string> = {
  AN: "35",
  AP: "37",
  AR: "12",
  AS: "18",
  BR: "10",
  CH: "04",
  CT: "22",
  CG: "22",
  DL: "07",
  GA: "30",
  GJ: "24",
  HR: "06",
  HP: "02",
  JK: "01",
  JH: "20",
  KA: "29",
  KL: "32",
  LA: "38",
  LD: "31",
  DN: "26",
  DD: "26",
  MP: "23",
  MH: "27",
  MN: "14",
  ML: "17",
  MZ: "15",
  NL: "13",
  OR: "21",
  OD: "21",
  PB: "03",
  PY: "34",
  RJ: "08",
  SK: "11",
  TN: "33",
  TS: "36",
  TG: "36",
  TR: "16",
  UP: "09",
  UK: "05",
  UT: "05",
  WB: "19",
};

export function customerStateCode(state?: string, pinStateHint?: string): string {
  const raw = (state || "").trim().toUpperCase();
  if (STATE_CODES[raw]) return STATE_CODES[raw];
  const name = (state || "").toLowerCase();
  if (name.includes("andaman")) return "35";
  if (name.includes("andhra")) return "37";
  if (name.includes("arunachal")) return "12";
  if (name.includes("assam")) return "18";
  if (name.includes("bihar")) return "10";
  if (name.includes("chandigarh")) return "04";
  if (name.includes("chhattisgarh")) return "22";
  if (name.includes("dadra") || name.includes("daman") || name.includes("diu")) return "26";
  if (name.includes("delhi") || name.includes("nct")) return "07";
  if (name.includes("goa")) return "30";
  if (name.includes("gujarat")) return "24";
  if (name.includes("haryana")) return "06";
  if (name.includes("himachal")) return "02";
  if (name.includes("jammu") || name.includes("kashmir")) return "01";
  if (name.includes("jharkhand")) return "20";
  if (name.includes("karnataka")) return "29";
  if (name.includes("kerala")) return "32";
  if (name.includes("ladakh")) return "38";
  if (name.includes("lakshadweep")) return "31";
  if (name.includes("madhya")) return "23";
  if (name.includes("maharashtra")) return "27";
  if (name.includes("manipur")) return "14";
  if (name.includes("meghalaya")) return "17";
  if (name.includes("mizoram")) return "15";
  if (name.includes("nagaland")) return "13";
  if (name.includes("odisha") || name.includes("orissa")) return "21";
  if (name.includes("puducherry") || name.includes("pondicherry")) return "34";
  if (name.includes("punjab")) return "03";
  if (name.includes("rajasthan")) return "08";
  if (name.includes("sikkim")) return "11";
  if (name.includes("tamil")) return "33";
  if (name.includes("telangana")) return "36";
  if (name.includes("tripura")) return "16";
  if (name.includes("uttarakhand") || name.includes("uttaranchal")) return "05";
  if (name.includes("uttar")) return "09";
  if (name.includes("west bengal") || name.includes("bengal")) return "19";
  return pinStateHint || "";
}

/** Prices on the store are GST-inclusive. */
export function splitGstInclusive(gross: number, gstRate: number) {
  const rate = Math.max(0, Number(gstRate) || 0);
  if (rate <= 0 || gross <= 0) {
    return { taxable: round2(gross), gst: 0, gross: round2(gross) };
  }
  const taxable = round2(gross / (1 + rate / 100));
  const gst = round2(gross - taxable);
  return { taxable, gst, gross: round2(gross) };
}

export function round2(n: number) {
  return Math.round((Number(n) || 0) * 100) / 100;
}
