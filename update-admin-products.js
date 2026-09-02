const fs = require('fs');
const file = 'src/app/admin/products/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add selectedIds state and bulk actions handler
const stateInjection = `const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(p => p.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkAction = async (actionType: string) => {
    if (selectedIds.size === 0) return;
    
    let action = 'update';
    let updates: any = {};
    
    if (actionType === 'delete') {
      if (!window.confirm("Are you sure you want to delete " + selectedIds.size + " products?")) return;
      action = 'delete';
    } else if (actionType === 'activate') {
      updates = { isActive: true };
    } else if (actionType === 'deactivate') {
      updates = { isActive: false };
    } else if (actionType === 'enable_cod') {
      updates = { codAvailable: true };
    } else if (actionType === 'disable_cod') {
      updates = { codAvailable: false };
    } else if (actionType === 'enable_partial_cod') {
      const amt = window.prompt("Enter Partial COD Advance amount (e.g. 500):", "500");
      if (amt === null) return;
      updates = { isPartialCOD: true, partialCODAdvance: Number(amt) || 0, codAvailable: true };
    } else if (actionType === 'disable_partial_cod') {
      updates = { isPartialCOD: false, partialCODAdvance: 0 };
    }

    setBulkActionLoading(true);
    try {
      await adminFetch('/api/products/bulk-update', {
        method: 'POST',
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          action,
          updates
        })
      });
      show("Bulk action applied successfully", 'success');
      setSelectedIds(new Set());
      await load();
    } catch (err: any) {
      show(err.message || 'Bulk action failed', 'error');
    } finally {
      setBulkActionLoading(false);
    }
  };
`;

content = content.replace('const [busyId, setBusyId] = useState<string | null>(null);', 'const [busyId, setBusyId] = useState<string | null>(null);\n' + stateInjection);

// 2. Add bulk action bar above the table
const bulkBarInjection = `
          {selectedIds.size > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800">{selectedIds.size} selected</span>
              <div className="flex gap-2">
                <select 
                  className="text-sm border border-blue-200 rounded px-2 py-1 bg-white outline-none"
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkAction(e.target.value);
                      e.target.value = "";
                    }
                  }}
                  disabled={bulkActionLoading}
                >
                  <option value="">-- Bulk Actions --</option>
                  <option value="activate">Activate</option>
                  <option value="deactivate">Deactivate</option>
                  <option value="enable_cod">Enable COD</option>
                  <option value="disable_cod">Disable COD</option>
                  <option value="enable_partial_cod">Enable Partial COD</option>
                  <option value="disable_partial_cod">Disable Partial COD</option>
                  <option value="delete">Delete</option>
                </select>
              </div>
            </div>
          )}
          <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm">`;

content = content.replace('<div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm">', bulkBarInjection);

// 3. Add checkboxes to table head
content = content.replace(
  '<th className="px-4 py-3 font-medium">Product</th>',
  '<th className="px-4 py-3 w-10"><input type="checkbox" className="accent-black" checked={filtered.length > 0 && selectedIds.size === filtered.length} onChange={toggleAll} /></th><th className="px-4 py-3 font-medium">Product</th>'
);

// 4. Add checkboxes to table body
content = content.replace(
  '<td className="px-4 py-3">\n                        <div className="flex items-center gap-3 min-w-[220px]">',
  '<td className="px-4 py-3 w-10"><input type="checkbox" className="accent-black" checked={selectedIds.has(p.id)} onChange={() => toggleOne(p.id)} /></td><td className="px-4 py-3">\n                        <div className="flex items-center gap-3 min-w-[220px]">'
);


fs.writeFileSync(file, content, 'utf8');
console.log('Admin products page updated with bulk actions.');
