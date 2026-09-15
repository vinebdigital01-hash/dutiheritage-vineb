with open("src/app/admin/coupons/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update the state
old_state = """  const [form, setForm] = useState({
    code: "",
    discountType: "PERCENT" as "PERCENT" | "FLAT",
    discountValue: "",
    minOrderAmount: "0",
    scope: "ALL_PRODUCTS" as "ALL_PRODUCTS" | "SPECIFIC_PRODUCTS" | "SPECIFIC_CATEGORY",
    targetIds: [] as string[]
  });"""

new_state = """  const [form, setForm] = useState({
    code: "",
    discountType: "PERCENT" as "PERCENT" | "FLAT" | "BUY_X_PERCENT" | "BUY_X_GET_Y_FREE",
    discountValue: "",
    minOrderAmount: "0",
    minQuantity: "2",
    freeQuantity: "1",
    scope: "ALL_PRODUCTS" as "ALL_PRODUCTS" | "SPECIFIC_PRODUCTS" | "SPECIFIC_CATEGORY",
    targetIds: [] as string[]
  });"""
content = content.replace(old_state, new_state)

# 2. Update the create function body
old_create = """          discountType: form.discountType,
          discountValue: Number(form.discountValue),
          minOrderAmount: Number(form.minOrderAmount) || 0,
          scope: form.scope,
          targetIds: form.targetIds,
          active: true,"""

new_create = """          discountType: form.discountType,
          discountValue: Number(form.discountValue) || 0,
          minOrderAmount: Number(form.minOrderAmount) || 0,
          minQuantity: Number(form.minQuantity) || 0,
          freeQuantity: Number(form.freeQuantity) || 0,
          scope: form.scope,
          targetIds: form.targetIds,
          active: true,"""
content = content.replace(old_create, new_create)

# 3. Update the form reset
old_reset = """      setForm({
        code: "",
        discountType: "PERCENT",
        discountValue: "",
        minOrderAmount: "0",
        scope: "ALL_PRODUCTS",
        targetIds: []
      });"""

new_reset = """      setForm({
        code: "",
        discountType: "PERCENT",
        discountValue: "",
        minOrderAmount: "0",
        minQuantity: "2",
        freeQuantity: "1",
        scope: "ALL_PRODUCTS",
        targetIds: []
      });"""
content = content.replace(old_reset, new_reset)

# 4. Update the select options for discountType
old_select = """          <AdminSelect label="Type" value={form.discountType} onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value as "PERCENT" | "FLAT" }))}>
            <option value="PERCENT">Percent %</option>
            <option value="FLAT">Flat ₹</option>
          </AdminSelect>
          <AdminInput label="Value *" type="number" min={0} required value={form.discountValue} onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))} />"""

new_select = """          <AdminSelect label="Type" value={form.discountType} onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value as any }))}>
            <option value="PERCENT">Percent %</option>
            <option value="FLAT">Flat ₹</option>
            <option value="BUY_X_PERCENT">Buy X Get Y% Off</option>
            <option value="BUY_X_GET_Y_FREE">Buy X Get Y Free</option>
          </AdminSelect>
          
          {(form.discountType === "PERCENT" || form.discountType === "FLAT" || form.discountType === "BUY_X_PERCENT") && (
            <AdminInput label={form.discountType === "BUY_X_PERCENT" ? "Discount % *" : "Value *"} type="number" min={0} required value={form.discountValue} onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))} />
          )}
          
          {(form.discountType === "BUY_X_PERCENT" || form.discountType === "BUY_X_GET_Y_FREE") && (
            <AdminInput label="Min Quantity *" type="number" min={1} required value={form.minQuantity} onChange={(e) => setForm((f) => ({ ...f, minQuantity: e.target.value }))} />
          )}

          {form.discountType === "BUY_X_GET_Y_FREE" && (
            <AdminInput label="Free Items Qty *" type="number" min={1} required value={form.freeQuantity} onChange={(e) => setForm((f) => ({ ...f, freeQuantity: e.target.value }))} />
          )}"""
content = content.replace(old_select, new_select)

# 5. Fix table display
old_table_value = """{c.discountType === "PERCENT" ? `${c.discountValue}%` : `₹${c.discountValue}`}"""
new_table_value = """{c.discountType === "PERCENT" ? `${c.discountValue}%` : 
                       c.discountType === "FLAT" ? `₹${c.discountValue}` : 
                       c.discountType === "BUY_X_PERCENT" ? `Buy ${c.minQuantity} Get ${c.discountValue}% Off` : 
                       c.discountType === "BUY_X_GET_Y_FREE" ? `Buy ${c.minQuantity} Get ${c.freeQuantity} Free` : 
                       `${c.discountValue}`}"""
content = content.replace(old_table_value, new_table_value)

with open("src/app/admin/coupons/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated admin coupons page")
