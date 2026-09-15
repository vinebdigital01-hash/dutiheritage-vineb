with open("src/app/admin/staff/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add handleToggleFreeze
old_delete = """  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this staff member?")) return;
    if (!user) return;
    try {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : "";
      await fetch(`/api/staff/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchStaff();
    } catch (err) {
      console.error(err);
    }
  };"""

new_delete = """  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently remove this staff member?")) return;
    if (!user) return;
    try {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : "";
      await fetch(`/api/staff/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchStaff();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFreeze = async (id: string, currentActive: boolean) => {
    if (!confirm(`Are you sure you want to ${currentActive ? 'freeze' : 'unfreeze'} this staff member?`)) return;
    if (!user) return;
    try {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : "";
      await fetch(`/api/staff/${id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ active: !currentActive }),
      });
      fetchStaff();
    } catch (err) {
      console.error(err);
    }
  };"""

content = content.replace(old_delete, new_delete)

# Update table
old_table_headers = """            <tr>
              <th className="px-4 py-3 font-medium">Name & Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>"""

new_table_headers = """            <tr>
              <th className="px-4 py-3 font-medium">Name & Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>"""
            
content = content.replace(old_table_headers, new_table_headers)

old_row = """              <tr key={s._id} className="hover:bg-neutral-50/50">
                <td className="px-4 py-3">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-neutral-500 text-xs">{s.email}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold tracking-[1px] uppercase ${s.role === "SUPERADMIN" ? "bg-amber-100 text-amber-800" : s.role === "ADMIN" ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"}`}>
                    {s.role === "SUPERADMIN" ? <FiShield /> : <FiUserCheck />}
                    {s.role}
                  </span>
                  {s.isEnv && <span className="ml-2 text-[10px] text-neutral-400">(.env.local)</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  {!s.isEnv && (
                    <button onClick={() => handleDelete(s._id)} className="p-2 text-neutral-400 hover:text-red-500 transition-colors" title="Remove staff">
                      <FiTrash2 />
                    </button>
                  )}
                </td>
              </tr>"""
              
new_row = """              <tr key={s._id} className={`hover:bg-neutral-50/50 ${s.active === false ? "opacity-60 bg-neutral-100/50" : ""}`}>
                <td className="px-4 py-3">
                  <div className={`font-medium ${s.active === false ? "line-through text-neutral-500" : ""}`}>{s.name}</div>
                  <div className="text-neutral-500 text-xs">{s.email}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold tracking-[1px] uppercase ${s.role === "SUPERADMIN" ? "bg-amber-100 text-amber-800" : s.role === "ADMIN" ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"}`}>
                    {s.role === "SUPERADMIN" ? <FiShield /> : <FiUserCheck />}
                    {s.role}
                  </span>
                  {s.isEnv && <span className="ml-2 text-[10px] text-neutral-400">(.env.local)</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold tracking-[1px] uppercase ${s.active !== false ? "text-emerald-700 bg-emerald-50" : "text-red-700 bg-red-50"}`}>
                    {s.active !== false ? "🟢 Active" : "🔴 Frozen"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {!s.isEnv && (
                    <div className="flex justify-end items-center gap-3">
                      <button 
                        onClick={() => handleToggleFreeze(s._id, s.active !== false)} 
                        className={`text-[11px] font-bold tracking-[1px] uppercase transition-colors ${s.active !== false ? "text-red-600 hover:text-red-800" : "text-emerald-600 hover:text-emerald-800"}`}
                      >
                        {s.active !== false ? "Freeze" : "Unfreeze"}
                      </button>
                      <button onClick={() => handleDelete(s._id)} className="p-2 text-neutral-400 hover:text-red-500 transition-colors" title="Delete permanently">
                        <FiTrash2 />
                      </button>
                    </div>
                  )}
                </td>
              </tr>"""

content = content.replace(old_row, new_row)
content = content.replace('colSpan={3}', 'colSpan={4}')

with open("src/app/admin/staff/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated Staff Page")
