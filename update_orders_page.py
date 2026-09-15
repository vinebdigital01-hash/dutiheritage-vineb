with open("src/app/admin/orders/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    'const [exportEnd, setExportEnd] = useState("");',
    'const [exportEnd, setExportEnd] = useState("");\n  const [exportPayment, setExportPayment] = useState("");'
)

content = content.replace(
    'if (exportEnd) qs.set("endDate", exportEnd);',
    'if (exportEnd) qs.set("endDate", exportEnd);\n    if (exportPayment) qs.set("paymentMethod", exportPayment);'
)

old_ui = """            <div>
              <label className="block text-[11px] uppercase tracking-[1px] text-neutral-500 mb-1">Status</label>
              <select value={exportStatus} onChange={e => setExportStatus(e.target.value)} className="w-full border p-2 text-sm bg-white rounded">
                <option value="">All Statuses</option>
                <option value="New">New</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Returned">Returned</option>
              </select>
            </div>"""

new_ui = """            <div>
              <label className="block text-[11px] uppercase tracking-[1px] text-neutral-500 mb-1">Status</label>
              <select value={exportStatus} onChange={e => setExportStatus(e.target.value)} className="w-full border p-2 text-sm bg-white rounded">
                <option value="">All Statuses</option>
                <option value="New">New</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Returned">Returned</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-[1px] text-neutral-500 mb-1">Payment Method</label>
              <select value={exportPayment} onChange={e => setExportPayment(e.target.value)} className="w-full border p-2 text-sm bg-white rounded">
                <option value="">All Methods</option>
                <option value="Prepaid">Prepaid</option>
                <option value="COD">COD</option>
                <option value="Partial COD">Partial COD</option>
              </select>
            </div>"""

content = content.replace(old_ui, new_ui)

with open("src/app/admin/orders/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated AdminOrdersPage Export UI")
