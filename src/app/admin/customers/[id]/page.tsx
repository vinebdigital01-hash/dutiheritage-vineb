"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { adminFetch, AdminApiError } from "@/lib/admin-api";
import {
  PageHeader,
  AdminButton,
  AdminInput,
  Badge,
  useToast,
} from "@/components/admin/ui";
import type { CustomerDTO } from "@/lib/analytics";

type Profile = {
  customer: CustomerDTO;
  orders: Array<{
    orderId: string;
    total: number;
    status: string;
    createdAt?: string;
  }>;
  recentEvents: Array<{
    id: string;
    event: string;
    productName?: string;
    path?: string;
    createdAt?: string;
  }>;
  abandonedCarts: Array<{
    id: string;
    status: string;
    itemCount: number;
    lastUpdated?: string;
  }>;
  topProductViews: Array<{
    productId: string;
    name?: string;
    count: number;
  }>;
};

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { show, Toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminFetch<Profile>(`/api/customers/${id}`);
      setProfile(data);
    } catch (e) {
      show(e instanceof AdminApiError ? e.message : "Failed to load", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const addTag = async () => {
    const tag = tagInput.trim();
    if (!tag || !profile) return;
    if (!window.confirm("Are you sure you want to add this tag?")) return;
    setSaving(true);
    try {
      const data = await adminFetch<{ customer: CustomerDTO }>(
        `/api/customers/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ addTags: [tag] }),
        }
      );
      setProfile({ ...profile, customer: data.customer });
      setTagInput("");
      show("Tag added");
    } catch (e) {
      show(e instanceof AdminApiError ? e.message : "Update failed", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <p className="text-[13px] text-[var(--color-text-muted)] animate-pulse">
        Loading profile…
      </p>
    );
  }

  if (!profile) {
    return (
      <div>
        <p className="mb-4">Customer not found.</p>
        <Link href="/admin/customers" className="underline text-[13px]">
          Back to customers
        </Link>
      </div>
    );
  }

  const c = profile.customer;

  return (
    <div>
      {Toast}
      <PageHeader
        title={c.name || "Customer"}
        subtitle={c.email || c.phone || c.id}
        actions={
          <Link href="/admin/customers">
            <AdminButton variant="secondary">All customers</AdminButton>
          </Link>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6 mb-10">
        <div className="lg:col-span-2 bg-white border border-[var(--color-border)] rounded-xl p-6 shadow-sm">
          <h2 className="text-[13px] tracking-[2px] uppercase mb-4">Profile</h2>
          <dl className="grid sm:grid-cols-2 gap-4 text-[13px]">
            <div>
              <dt className="text-neutral-500 mb-1">Email</dt>
              <dd>{c.email || "—"}</dd>
            </div>
            <div>
              <dt className="text-neutral-500 mb-1">Phone</dt>
              <dd>{c.phone || "—"}</dd>
            </div>
            <div>
              <dt className="text-neutral-500 mb-1">Location</dt>
              <dd>
                {[c.city, c.state, c.pincode].filter(Boolean).join(", ") || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500 mb-1">Source</dt>
              <dd className="capitalize">{c.source?.replace("_", " ") || "—"}</dd>
            </div>
            <div>
              <dt className="text-neutral-500 mb-1">First visit</dt>
              <dd>
                {c.firstVisit
                  ? new Date(c.firstVisit).toLocaleString("en-IN")
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500 mb-1">Last visit</dt>
              <dd>
                {c.lastVisit
                  ? new Date(c.lastVisit).toLocaleString("en-IN")
                  : "—"}
              </dd>
            </div>
          </dl>

          <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
            <p className="text-[12px] uppercase tracking-wider text-neutral-500 mb-2">
              Tags
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {(c.tags || []).length === 0 ? (
                <span className="text-[13px] text-neutral-400">No tags</span>
              ) : (
                c.tags.map((t) => (
                  <Badge key={t} tone="neutral">
                    {t}
                  </Badge>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <AdminInput
                placeholder="Add tag…"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="flex-1"
              />
              <AdminButton onClick={addTag} disabled={saving}>
                Add
              </AdminButton>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[var(--color-border)] rounded-xl p-6 shadow-sm">
          <h2 className="text-[13px] tracking-[2px] uppercase mb-4">Value</h2>
          <div className="space-y-4 text-[13px]">
            <div>
              <p className="text-neutral-500">Total orders</p>
              <p className="text-2xl font-serif">{c.totalOrders}</p>
            </div>
            <div>
              <p className="text-neutral-500">Total spent</p>
              <p className="text-2xl font-serif">
                ₹{c.totalSpent.toLocaleString("en-IN")}
              </p>
            </div>
            <div>
              <p className="text-neutral-500">Avg order</p>
              <p className="text-lg">
                ₹{c.avgOrderValue.toLocaleString("en-IN")}
              </p>
            </div>
            <Badge tone={c.ltvScore === "HIGH" ? "success" : c.ltvScore === "MEDIUM" ? "info" : "neutral"}>
              LTV {c.ltvScore}
            </Badge>
          </div>
        </div>
      </div>

      {profile.topProductViews.length > 0 && (
        <section className="mb-10">
          <h2 className="text-[13px] tracking-[2px] uppercase mb-4">
            Product views (7 days)
          </h2>
          <ul className="bg-white border border-[var(--color-border)] rounded-xl divide-y divide-[var(--color-border)]">
            {profile.topProductViews.map((p) => (
              <li key={p.productId} className="px-5 py-3 text-[13px] flex justify-between">
                <span>{p.name || p.productId}</span>
                <span className="text-neutral-500">{p.count}× viewed</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <section>
          <h2 className="text-[13px] tracking-[2px] uppercase mb-4">
            Recent orders
          </h2>
          {profile.orders.length === 0 ? (
            <p className="text-[13px] text-neutral-500">No orders</p>
          ) : (
            <ul className="bg-white border border-[var(--color-border)] rounded-xl divide-y">
              {profile.orders.map((o) => (
                <li key={o.orderId} className="px-5 py-3 text-[13px]">
                  <Link
                    href={`/admin/orders/${o.orderId}`}
                    className="font-mono hover:underline"
                  >
                    {o.orderId}
                  </Link>
                  <span className="text-neutral-500 ml-2">
                    ₹{o.total.toLocaleString("en-IN")} · {o.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-[13px] tracking-[2px] uppercase mb-4">
            Recent activity
          </h2>
          {profile.recentEvents.length === 0 ? (
            <p className="text-[13px] text-neutral-500">No tracked events yet</p>
          ) : (
            <ul className="bg-white border border-[var(--color-border)] rounded-xl divide-y max-h-[320px] overflow-y-auto">
              {profile.recentEvents.map((e) => (
                <li key={e.id} className="px-5 py-2.5 text-[12px]">
                  <span className="font-medium">{e.event}</span>
                  {e.productName && (
                    <span className="text-neutral-600"> — {e.productName}</span>
                  )}
                  <span className="block text-neutral-400">
                    {e.createdAt
                      ? new Date(e.createdAt).toLocaleString("en-IN")
                      : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
