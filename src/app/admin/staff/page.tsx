import { SkeletonTable } from '@/components/ui/Skeleton';
"use client";

import { useEffect, useState } from "react";
import { FiPlus, FiTrash2, FiShield, FiUserCheck } from "react-icons/fi";
import { useAppContext } from "@/context/AppContext";
import { useRouter } from "next/navigation";

import { auth } from "@/lib/firebase";

type StaffMember = {
  _id: string;
  email: string;
  name: string;
  role: "SUPERADMIN" | "ADMIN" | "MANAGER";
  active: boolean;
  isEnv?: boolean;
};

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, adminRole } = useAppContext();
  const router = useRouter();

  // New staff form
  const [isAdding, setIsAdding] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MANAGER">("ADMIN");

  useEffect(() => {
    if (adminRole && adminRole !== "SUPERADMIN") {
      router.replace("/admin");
    } else {
      fetchStaff();
    }
  }, [adminRole, router]);

  const fetchStaff = async () => {
    if (!user) return;
    try {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : "";
      const res = await fetch("/api/staff", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setStaff(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!window.confirm("Are you sure you want to add this staff member?")) return;
    try {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : "";
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, name, role }),
      });
      if (res.ok) {
        setIsAdding(false);
        setEmail("");
        setName("");
        fetchStaff();
      } else {
        alert(await res.text());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
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
  };

  if (loading) return <SkeletonTable />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif tracking-[2px] uppercase">Staff & Permissions</h1>
          <p className="text-[13px] text-neutral-500 mt-1">Manage who has access to your admin dashboard.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-black text-white px-4 py-2 text-[12px] uppercase tracking-[1px] flex items-center gap-2 hover:bg-black/90"
        >
          <FiPlus /> Add Staff
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-white p-6 border border-neutral-200 shadow-sm flex flex-col gap-4 max-w-xl">
          <h2 className="text-sm font-bold uppercase tracking-[1px]">Invite Team Member</h2>
          <div>
            <label className="block text-[11px] uppercase tracking-[1px] text-neutral-500 mb-1">Name</label>
            <input required value={name} onChange={e => setName(e.target.value)} className="w-full border p-2 text-sm" placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-[1px] text-neutral-500 mb-1">Email</label>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border p-2 text-sm" placeholder="john@example.com" />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-[1px] text-neutral-500 mb-1">Role</label>
            <select value={role} onChange={e => setRole(e.target.value as any)} className="w-full border p-2 text-sm bg-white">
              <option value="ADMIN">Admin (Full Access to store)</option>
              <option value="MANAGER">Manager (Orders & Customers only)</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 border text-[12px] uppercase tracking-[1px]">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-black text-white text-[12px] uppercase tracking-[1px]">Invite</button>
          </div>
        </form>
      )}

      <div className="bg-white border border-neutral-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-200 text-[11px] uppercase tracking-[1px] text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name & Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {staff.map((s) => (
              <tr key={s._id} className="hover:bg-neutral-50/50">
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
              </tr>
            ))}
            {staff.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-neutral-400 text-sm">
                  No staff members found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
