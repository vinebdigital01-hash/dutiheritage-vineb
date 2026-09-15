with open("src/components/ProductCard/ProductCard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_badges = """        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {product.tags && product.tags.map(tag => ("""

new_badges = """        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {product.trackInventory && (!product.inventory || product.inventory.every(i => i.stock === 0)) && (
            <div className="bg-red-600 text-white text-[10px] font-bold py-1 px-2 tracking-[1px] uppercase self-start shadow-sm">
              SOLD OUT
            </div>
          )}
          {product.tags && product.tags.map(tag => ("""

content = content.replace(old_badges, new_badges)

with open("src/components/ProductCard/ProductCard.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated ProductCard")
