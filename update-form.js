const fs = require('fs');
const file = 'src/components/admin/ProductForm.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update FormState type
content = content.replace(
  'codAvailable: boolean;',
  'codAvailable: boolean;\n  isPartialCOD: boolean;\n  partialCODAdvance: string;'
);

// 2. Update default state
content = content.replace(
  'codAvailable: true,\n  isActive: true,',
  'codAvailable: true,\n  isPartialCOD: false,\n  partialCODAdvance: "0",\n  isActive: true,'
);

// 3. Update productToForm
content = content.replace(
  'function productToForm(p: Product & { isActive?: boolean; codAvailable?: boolean }): FormState {',
  'function productToForm(p: Product & { isActive?: boolean; codAvailable?: boolean; isPartialCOD?: boolean; partialCODAdvance?: number }): FormState {'
);
content = content.replace(
  'codAvailable: p.codAvailable !== false,',
  'codAvailable: p.codAvailable !== false,\n    isPartialCOD: p.isPartialCOD || false,\n    partialCODAdvance: String(p.partialCODAdvance || 0),'
);

// 4. Update payload submission
content = content.replace(
  'codAvailable: form.codAvailable,',
  'codAvailable: form.codAvailable,\n          isPartialCOD: form.isPartialCOD,\n          partialCODAdvance: Number(form.partialCODAdvance) || 0,'
);

// 5. Add UI inputs
const codCheckboxUI = `<label className="flex items-center gap-2 text-[14px] cursor-pointer">
            <input
              type="checkbox"
              checked={form.codAvailable}
              onChange={(e) => set("codAvailable", e.target.checked)}
              className="accent-black w-4 h-4"
            />
            COD available for this product
          </label>`;

const partialCODUI = `
          <label className="flex items-center gap-2 text-[14px] cursor-pointer mt-2">
            <input
              type="checkbox"
              checked={form.isPartialCOD}
              onChange={(e) => set("isPartialCOD", e.target.checked)}
              disabled={!form.codAvailable}
              className="accent-black w-4 h-4"
            />
            Partial COD (Require advance payment)
          </label>
          
          {form.isPartialCOD && (
            <div className="mt-4">
              <AdminInput
                label="Advance Payment Amount (₹)"
                type="number"
                value={form.partialCODAdvance}
                onChange={(e) => set("partialCODAdvance", e.target.value)}
                placeholder="e.g. 500"
              />
              <p className="text-[12px] text-gray-500 mt-1">Customer will pay this amount online to confirm the COD order.</p>
            </div>
          )}`;

content = content.replace(codCheckboxUI, codCheckboxUI + '\n' + partialCODUI);

fs.writeFileSync(file, content, 'utf8');
console.log('ProductForm updated');
