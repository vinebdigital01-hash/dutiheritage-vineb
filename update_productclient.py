with open("src/app/products/[slug]/ProductClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_state = """  const [selectedSize, setSelectedSize] = useState(sizes[0]);"""
new_state = """  const isInventoryTracked = product.trackInventory;
  const isTotallySoldOut = isInventoryTracked && (!product.inventory || product.inventory.every(i => i.stock === 0));
  
  const firstAvailableSize = sizes.find(s => {
    if (!isInventoryTracked) return true;
    const inv = product.inventory?.find(i => i.size === s);
    return inv ? inv.stock > 0 : false;
  }) || sizes[0];

  const [selectedSize, setSelectedSize] = useState(firstAvailableSize);"""
content = content.replace(old_state, new_state)

old_size = """                <div className="grid grid-cols-3 gap-3">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`
                        py-3 px-2 rounded-xl text-[14px] font-semibold flex flex-col items-center justify-center transition-all
                        ${selectedSize === size 
                          ? 'bg-[#EAF5EC] border-2 border-[#2E7D32] text-[#2E7D32]' 
                          : 'bg-gray-50 border-2 border-transparent text-gray-700 hover:bg-gray-100'}
                      `}
                    >
                      {size}
                    </button>
                  ))}
                </div>"""

new_size = """                <div className="grid grid-cols-3 gap-3">
                  {sizes.map((size) => {
                    let outOfStock = false;
                    let lowStock = false;
                    let stockLeft = 0;
                    
                    if (isInventoryTracked && product.inventory) {
                      const inv = product.inventory.find(i => i.size === size);
                      if (inv) {
                        stockLeft = inv.stock;
                        outOfStock = inv.stock === 0;
                        lowStock = inv.stock > 0 && inv.stock <= (product.lowStockThreshold || 3);
                      } else {
                        outOfStock = true; // explicitly tracked but size missing = out of stock
                      }
                    }

                    return (
                      <button
                        key={size}
                        disabled={outOfStock}
                        onClick={() => setSelectedSize(size)}
                        className={`
                          py-3 px-2 rounded-xl text-[14px] font-semibold flex flex-col items-center justify-center transition-all relative overflow-hidden group
                          ${outOfStock ? 'opacity-40 cursor-not-allowed bg-gray-50 text-gray-400 border-2 border-transparent line-through' :
                            selectedSize === size 
                            ? 'bg-[#EAF5EC] border-2 border-[#2E7D32] text-[#2E7D32]' 
                            : 'bg-gray-50 border-2 border-transparent text-gray-700 hover:bg-gray-100'}
                        `}
                      >
                        {size}
                        {lowStock && selectedSize === size && (
                           <span className="text-[10px] text-amber-600 mt-0.5 leading-none font-bold">
                             Only {stockLeft} left
                           </span>
                        )}
                        {outOfStock && (
                          <div className="absolute inset-0 bg-white/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] bg-red-100 text-red-600 px-1 py-0.5 rounded font-bold uppercase">Sold Out</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>"""
content = content.replace(old_size, new_size)

with open("src/app/products/[slug]/ProductClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated ProductClient logic")
