/** Normalize to digits; 10-digit Indian mobiles become 91XXXXXXXXXX. */
export function normalizeBotPhone(phone: string): string {
  let digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 10) digits = "91" + digits;
  if (digits.startsWith("0") && digits.length === 11) {
    digits = "91" + digits.slice(1);
  }
  return digits;
}

/** Last 10 digits for loose matching across +91 / 91 / bare formats. */
export function phoneLast10(phone: string): string {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

/** Mongo $or for Order.customer.phone / Customer.phone variants. */
export function phoneMatchOr(field: string, phone: string): Record<string, unknown>[] {
  const raw = String(phone || "").trim();
  const normalized = normalizeBotPhone(raw);
  const last10 = phoneLast10(raw);
  const variants = new Set<string>();
  if (raw) variants.add(raw);
  if (normalized) variants.add(normalized);
  if (last10) {
    variants.add(last10);
    variants.add("91" + last10);
    variants.add("+91" + last10);
  }
  return Array.from(variants).map((v) => ({ [field]: v }));
}
