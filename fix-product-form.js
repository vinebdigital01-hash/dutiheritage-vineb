const fs = require('fs');
const file = 'src/components/admin/ProductForm.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /COD available for this product\s*<\/label>/;

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
            <div className="mt-4 p-4 border border-blue-100 bg-blue-50/50 rounded-lg">
              <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-2">Advance Payment Amount (₹)</label>
              <input
                type="number"
                value={form.partialCODAdvance}
                onChange={(e) => set("partialCODAdvance", e.target.value)}
                placeholder="e.g. 500"
                className="w-full border border-gray-300 p-2 text-[14px] rounded-lg focus:border-black outline-none bg-white"
              />
              <p className="text-[12px] text-gray-500 mt-2">Customer will pay this amount online to confirm the COD order.</p>
            </div>
          )}`;

if (regex.test(content)) {
  content = content.replace(regex, (match) => match + '\n' + partialCODUI);
  fs.writeFileSync(file, content, 'utf8');
  console.log("Successfully injected Partial COD UI!");
} else {
  console.log("Failed to find injection point.");
}
