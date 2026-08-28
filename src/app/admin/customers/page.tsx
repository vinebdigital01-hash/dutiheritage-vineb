"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch, AdminApiError } from "@/lib/admin-api";
import {
  PageHeader,
  AdminInput,
  AdminSelect,
  Badge,
  EmptyState,
  useToast,
} from "@/components/admin/ui";
import type { CustomerDTO } from "@/lib/analytics";

export default function AdminCustomersPage() {
  const { show, Toast } = useToast();
  const [customers, setCustomers] = useState<CustomerDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [ltv, setLtv] = useState("");
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);

  const load = async (search = q, ltvFilter = ltv) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (search.trim()) params.set("q", search.trim());
      if (ltvFilter) params.set("ltv", ltvFilter);
      const data = await adminFetch<{ customers: CustomerDTO[]; count: number }>(
        `/api/customers?${params}`
      );
      setCustomers(data.customers || []);
    } catch (e) {
      show(e instanceof AdminApiError ? e.message : "Failed to load", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    setSelectedCustomers([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedCustomers(customers.map(c => c.id));
    else setSelectedCustomers([]);
  };

  const toggleCustomer = (id: string) => {
    if (selectedCustomers.includes(id)) setSelectedCustomers(selectedCustomers.filter(x => x !== id));
    else setSelectedCustomers([...selectedCustomers, id]);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedCustomers.length === 0) return;
    setCreatingGroup(true);
    try {
      await adminFetch("/api/groups", {
        method: "POST",
        body: JSON.stringify({
          name: groupName.trim(),
          type: "manual",
          memberIds: selectedCustomers,
        }),
      });
      show(`Group "${groupName}" created with ${selectedCustomers.length} members`, "success");
      setShowGroupModal(false);
      setGroupName("");
      setSelectedCustomers([]);
    } catch (err: any) {
      show(err.message, "error");
    } finally {
      setCreatingGroup(false);
    }
  };

  const ltvTone = (s: string) => {
    if (s === "HIGH") return "success" as const;
    if (s === "MEDIUM") return "info" as const;
    return "neutral" as const;
  };

  return (
    <div>
      {Toast}
      <PageHeader
        title="Customers"
        subtitle="Unified profiles from Firebase, checkout, and on-site tracking"
        actions={
          selectedCustomers.length > 0 && (
            <button
              onClick={() => setShowGroupModal(true)}
              className="text-[12px] font-bold uppercase tracking-[1px] px-4 py-2 bg-black text-white rounded hover:bg-neutral-800 transition-colors"
            >
              + Create Group ({selectedCustomers.length})
            </button>
          )
        }
      />

      {showGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateGroup} className="bg-white p-6 max-w-sm w-full rounded-xl shadow-lg">
            <h2 className="text-lg font-serif tracking-[1px] mb-2 uppercase">Create Manual Group</h2>
            <p className="text-[12px] text-neutral-500 mb-4">Adding {selectedCustomers.length} selected customers.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-[1px] text-neutral-500 mb-1">Group Name</label>
                <input 
                  type="text" 
                  value={groupName} 
                  onChange={e => setGroupName(e.target.value)} 
                  className="w-full border p-2 text-sm bg-white rounded outline-none focus:border-black"
                  placeholder="e.g. VIP Buyers"
                  required
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowGroupModal(false)} className="text-[12px] uppercase tracking-[1px] px-4 py-2 border hover:bg-neutral-50 transition-colors rounded">Cancel</button>
              <button type="submit" disabled={creatingGroup} className="text-[12px] uppercase tracking-[1px] px-4 py-2 bg-black text-white hover:bg-black/90 transition-colors rounded">
                {creatingGroup ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <AdminInput
          placeholder="Search email, phone, name, city…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1"
        />
        <AdminSelect
          value={ltv}
          onChange={(e) => setLtv(e.target.value)}
          className="min-w-[140px]"
        >
          <option value="">All LTV</option>
          <option value="HIGH">High LTV</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </AdminSelect>
        <button
          type="button"
          onClick={() => load(q, ltv)}
          className="border border-black px-5 py-2.5 text-[12px] tracking-[1.5px] uppercase rounded-lg hover:bg-black hover:text-white transition-colors"
        >
          Search
        </button>
      </div>

      {loading ? (
        <p className="text-[13px] text-[var(--color-text-muted)] animate-pulse">
          Loading customers…
        </p>
      ) : customers.length === 0 ? (
        <EmptyState
          title="No customers yet"
          description="Profiles appear after signup, checkout, or tracked sessions."
        />
      ) : (
        <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-neutral-50 text-[11px] uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-4 py-3 w-[40px]">
                  <input
                    type="checkbox"
                    checked={customers.length > 0 && selectedCustomers.length === customers.length}
                    onChange={toggleAll}
                    className="cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3 hidden md:table-cell">Source</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Spent</th>
                <th className="px-4 py-3">LTV</th>
                <th className="px-4 py-3 hidden lg:table-cell">Last visit</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-[var(--color-border)] hover:bg-neutral-50/80"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.includes(c.id)}
                      onChange={() => toggleCustomer(c.id)}
                      className="cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/customers/${c.id}`}
                      className="block hover:underline"
                    >
                      <span className="font-medium">{c.name || "—"}</span>
                      <span className="block text-[12px] text-neutral-500">
                        {c.email || c.phone || "Guest"}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell capitalize text-neutral-600">
                    {c.source?.replace("_", " ") || "—"}
                  </td>
                  <td className="px-4 py-3">{c.totalOrders}</td>
                  <td className="px-4 py-3">
                    ₹{c.totalSpent.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={ltvTone(c.ltvScore)}>{c.ltvScore}</Badge>
                  </td>
                  <td className="px-4 py-3 text-neutral-500 hidden lg:table-cell">
                    {c.lastVisit
                      ? new Date(c.lastVisit).toLocaleDateString("en-IN")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
