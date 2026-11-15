import { db } from "@/services/db";
import { getBaseUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const baseUrl = getBaseUrl();
  const products = await db.getAllProducts();
  const collections = await db.getAllCollections();

  const lines: string[] = [
    "# Duti Heritage",
    "",
    "> Premium Fashion & Luxury Apparel based in India.",
    "",
    "## About Us",
    "Duti Heritage is an authentic Indian ethnic and luxury wear brand. We specialize in pure cotton, premium nightwear, unstitched suits, and handcrafted apparel.",
    `- **Website:** [Duti Heritage Official Site](${baseUrl})`,
    "- **Contact Email:** [Support Email](mailto:supportdutiheritage@gmail.com)",
    "- **Contact Phone:** [Call Us](tel:+916901080808)",
    "- **Address:** 103, Block D, DLF Express Green M1, IMT Manesar, Gurugram, Haryana - 122052",
    "- **GSTIN:** 06ANFPR1728Q2ZF",
    "",
    "## Policies",
    `- **Shipping:** [Shipping Policy](${baseUrl}/shipping) - Free shipping on prepaid orders. Pan India delivery in 3-7 working days. COD available with a partial advance payment. Dispatch within 48-72 hours.`,
    `- **Returns & Exchanges:** [Exchange Policy](${baseUrl}/return-exchange) - Size exchanges and defective product exchanges are available within 24 hours of delivery.`,
    "",
    "## Key Collections",
  ];

  for (const c of collections) {
    lines.push(`- [${c.name}](${baseUrl}/collections/${c.slug})`);
  }

  lines.push("");
  lines.push("## Current Products");

  for (const p of products) {
    const priceText = p.salePrice && p.salePrice < p.price 
      ? `₹${p.salePrice} (MRP ₹${p.price})` 
      : `₹${p.price}`;
    const desc = p.description ? ` - ${p.description.replace(/\n+/g, " ").slice(0, 120)}` : "";
    lines.push(`- [${p.name}](${baseUrl}/products/${p.slug}): ${priceText}${desc}`);
  }

  lines.push("");
  lines.push("## Trust & Security");
  lines.push("- 100% Authentic Guaranteed Quality");
  lines.push("- Secure Encrypted Payments");
  lines.push("- Pan India Trackable Delivery");
  lines.push("- Hassle-Free Exchanges");

  const markdown = lines.join("\n");

  return new Response(markdown, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
