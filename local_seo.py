import re

path = "src/app/layout.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update metadata
new_desc = "Shop the finest premium ethnic wear, pure cotton suits, and luxury nightwear in Delhi NCR, Gurugram, and Manesar. Experience elegance with Duti Heritage."
new_keywords = '["ethnic wear Delhi NCR", "premium fashion Gurugram", "cotton suits Manesar", "luxury nightwear Gurgaon", "boutique Delhi", "Duti Heritage", "women clothing Gurgaon"]'

content = re.sub(r'description: "Shop the finest premium fashion.*?",', f'description: "{new_desc}",', content)
content = re.sub(r'keywords: \[.*?\],', f'keywords: {new_keywords},', content)

# 2. Add localBusinessJsonLd
local_business = """
  // LocalBusiness JSON-LD (For Local SEO in Delhi NCR / Gurugram)
  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    "name": "Duti Heritage",
    "image": `${baseUrl}/images/velvet.jpg`,
    "@id": baseUrl,
    "url": baseUrl,
    "telephone": "+916901080808",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "103, Block D, DLF Express Green M1, IMT",
      "addressLocality": "Manesar, Gurugram",
      "addressRegion": "Haryana",
      "postalCode": "122052",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 28.3564, 
      "longitude": 76.9388
    },
    "areaServed": [
      { "@type": "City", "name": "Gurugram" },
      { "@type": "City", "name": "Manesar" },
      { "@type": "City", "name": "Delhi" },
      { "@type": "City", "name": "Noida" },
      { "@type": "State", "name": "Delhi NCR" }
    ],
    "priceRange": "$$"
  };
"""

if "localBusinessJsonLd =" not in content:
    content = content.replace('const organizationJsonLd = {', local_business + '\n  const organizationJsonLd = {')

# 3. Add script tag to layout
if "JSON.stringify(localBusinessJsonLd)" not in content:
    script_tag = '          <script\n            type="application/ld+json"\n            dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}\n          />'
    content = content.replace(
        '<script\n            type="application/ld+json"\n            dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}\n          />',
        script_tag + '\n          <script\n            type="application/ld+json"\n            dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}\n          />'
    )

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
