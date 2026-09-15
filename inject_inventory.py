with open("src/components/admin/ProductForm.tsx", "r", encoding="utf-8") as f:
    content = f.read()

inventory_block = """
        {/* INVENTORY SECTION */}
        <section className="space-y-6 border border-[var(--color-border)] rounded-xl p-5 bg-neutral-50/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] font-bold tracking-[1px] uppercase text-neutral-800 mb-1">
                Inventory Management
              </p>
              <p className="text-[12px] text-neutral-500">
                Track per-size stock. If disabled, product is always in stock.
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.trackInventory}
                onChange={(e) => set("trackInventory", e.target.checked)}
                className="w-4 h-4 accent-black"
              />
              <span className="text-[13px] font-medium">Track Inventory</span>
            </label>
          </div>

          {form.trackInventory && (
            <div className="space-y-4 pt-4 border-t border-[var(--color-border)]">
              <div className="flex justify-between items-end">
                <div className="max-w-[200px]">
                  <AdminInput
                    label="Low Stock Alert Threshold"
                    type="number"
                    min="0"
                    value={form.lowStockThreshold}
                    onChange={(e) => set("lowStockThreshold", e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const newInventory = form.sizes.map(size => {
                        const existing = form.inventory.find(i => i.size === size);
                        return { size, stock: "0", sku: existing?.sku || "" };
                      });
                      set("inventory", newInventory as any);
                    }}
                    className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider bg-white border border-neutral-300 rounded hover:bg-neutral-50"
                  >
                    Set All Out of Stock
                  </button>
                </div>
              </div>

              <div className="bg-white border border-[var(--color-border)] rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 text-[11px] font-bold tracking-[1px] uppercase text-neutral-500">
                      <th className="p-3 border-b">Size</th>
                      <th className="p-3 border-b">Stock Qty</th>
                      <th className="p-3 border-b">SKU (Optional)</th>
                      <th className="p-3 border-b">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {form.sizes.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-[13px] text-neutral-500">
                          Please add sizes above first.
                        </td>
                      </tr>
                    ) : (
                      form.sizes.map((size) => {
                        const invIndex = form.inventory.findIndex(i => i.size === size);
                        const currentStock = invIndex >= 0 ? form.inventory[invIndex].stock : "0";
                        const currentSku = invIndex >= 0 ? form.inventory[invIndex].sku : "";
                        const stockNum = Number(currentStock) || 0;
                        const lowThreshold = Number(form.lowStockThreshold) || 3;
                        
                        let statusColor = "bg-emerald-100 text-emerald-800";
                        let statusText = "In Stock";
                        if (stockNum === 0) {
                          statusColor = "bg-red-100 text-red-800";
                          statusText = "Out of Stock";
                        } else if (stockNum <= lowThreshold) {
                          statusColor = "bg-amber-100 text-amber-800";
                          statusText = "Low Stock";
                        }

                        return (
                          <tr key={size}>
                            <td className="p-3 font-medium text-[14px]">{size}</td>
                            <td className="p-3 max-w-[120px]">
                              <input
                                type="number"
                                min="0"
                                value={currentStock}
                                onChange={(e) => {
                                  const newInventory = [...form.inventory];
                                  const idx = newInventory.findIndex(i => i.size === size);
                                  if (idx >= 0) {
                                    newInventory[idx].stock = e.target.value;
                                  } else {
                                    newInventory.push({ size, stock: e.target.value, sku: "" });
                                  }
                                  set("inventory", newInventory as any);
                                }}
                                className="w-full border border-[var(--color-border)] rounded px-2 py-1.5 text-[14px]"
                              />
                            </td>
                            <td className="p-3">
                              <input
                                type="text"
                                value={currentSku}
                                onChange={(e) => {
                                  const newInventory = [...form.inventory];
                                  const idx = newInventory.findIndex(i => i.size === size);
                                  if (idx >= 0) {
                                    newInventory[idx].sku = e.target.value;
                                  } else {
                                    newInventory.push({ size, stock: "0", sku: e.target.value });
                                  }
                                  set("inventory", newInventory as any);
                                }}
                                className="w-full border border-[var(--color-border)] rounded px-2 py-1.5 text-[14px]"
                                placeholder={`DH-${form.slug || 'sku'}-${size}`}
                              />
                            </td>
                            <td className="p-3">
                              <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded ${statusColor}`}>
                                {statusText}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
"""

content = content.replace('        <section className="grid md:grid-cols-2 gap-5">', inventory_block + '\n        <section className="grid md:grid-cols-2 gap-5">')

with open("src/components/admin/ProductForm.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Injected inventory section into ProductForm")
