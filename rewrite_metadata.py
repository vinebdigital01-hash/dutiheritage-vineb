import re

path = "src/app/products/[slug]/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# I will find export async function generateMetadata ... until the end of the function block.
# Wait, it's safer to just split by "export async function generateMetadata" and replace up to "export default async function"

parts = content.split('export async function generateMetadata({ params }: Props): Promise<Metadata> {')
before = parts[0]
after_split = parts[1].split('export default async function ProductPage')
inside_metadata = after_split[0]
after_metadata = 'export default async function ProductPage' + after_split[1]

new_metadata = """
  const { slug } = await params;
  
  // Uses the central db adapter for future migrations
  const product = await db.getProductBySlug(slug);
  const baseUrl = getBaseUrl();

  if (!product) {
    return {
      title: "Product Not Found | Duti Heritage",
    };
  }

  const fallbackDesc = `Discover the exquisite ${product.name} at Duti Heritage. Shop our premium collection of luxury fashion, handcrafted for unmatched elegance, style, and comfort.`;
  const absoluteImageUrl = product.image.startsWith('http') ? product.image : `${baseUrl}${product.image}`;

  const localKeywords = ["Delhi NCR", "Gurugram", "Manesar", "Haryana"];
  const autoKeywords = [
    product.name,
    `buy ${product.name} online`,
    ...localKeywords.map(loc => `${product.name} in ${loc}`),
    ...localKeywords.map(loc => `premium ${product.name.split(" ")[0] || "ethnic wear"} in ${loc}`),
    "Duti Heritage"
  ];

  return {
    title: product.seoTitle || `${product.name} | Duti Heritage`,
    description: product.seoDescription || product.description || fallbackDesc,
    keywords: autoKeywords,
    alternates: {
      canonical: `${baseUrl}/products/${slug}`,
    },
    openGraph: {
      title: product.seoTitle || product.name,
      description: product.seoDescription || product.description || fallbackDesc,
      siteName: "Duti Heritage",
      images: [
        {
          url: absoluteImageUrl,
          width: 800,
          height: 800,
          alt: product.name,
        }
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.seoTitle || product.name,
      description: product.seoDescription || product.description || fallbackDesc,
      images: [absoluteImageUrl],
    },
  };
}

"""

with open(path, "w", encoding="utf-8") as f:
    f.write(before + 'export async function generateMetadata({ params }: Props): Promise<Metadata> {' + new_metadata + after_metadata)
