with open("src/types/index.ts", "r", encoding="utf-8") as f:
    content = f.read()

old_collection = """export type Collection = {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
};"""

new_collection = """export type Collection = {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
  seoDescription?: string;
  discountBanner?: string;
};"""

content = content.replace(old_collection, new_collection)

with open("src/types/index.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated Collection type")
