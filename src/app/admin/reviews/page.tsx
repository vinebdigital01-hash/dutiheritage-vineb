"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch, AdminApiError } from "@/lib/admin-api";
import {
  PageHeader,
  AdminButton,
  AdminSelect,
  Badge,
  EmptyState,
  useToast,
  AdminInput,
  AdminTextarea,
} from "@/components/admin/ui";
import type { ReviewDTO } from "@/lib/reviews";
import Papa from "papaparse";

type StatusFilter = "all" | "pending" | "approved" | "rejected";

export default function AdminReviewsPage() {
  const { show, Toast } = useToast();
  const [reviews, setReviews] = useState<ReviewDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);

  // Marketing Review State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    productId: "",
    userName: "",
    rating: 5,
    comment: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const load = async (status: StatusFilter = filter) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ all: "1" });
      if (status !== "all") qs.set("status", status);
      const data = await adminFetch<{ reviews: ReviewDTO[] }>(
        `/api/reviews?${qs.toString()}`
      );
      setReviews(data.reviews || []);
    } catch (e) {
      show(e instanceof AdminApiError ? e.message : "Failed to load", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const setStatus = async (id: string, status: ReviewDTO["status"]) => {
    if (!window.confirm(`Are you sure you want to change the status to ${status}?`)) return;
    setBusyId(id);
    try {
      await adminFetch(`/api/reviews/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      show(
        status === "approved"
          ? "Review approved"
          : status === "rejected"
            ? "Review rejected"
            : "Moved to pending"
      );
      await load();
    } catch (e) {
      show(e instanceof AdminApiError ? e.message : "Update failed", "error");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this review permanently?")) return;
    setBusyId(id);
    try {
      await adminFetch(`/api/reviews/${id}`, { method: "DELETE" });
      show("Review deleted");
      await load();
    } catch (e) {
      show(e instanceof AdminApiError ? e.message : "Delete failed", "error");
    } finally {
      setBusyId(null);
    }
  };

  const badgeTone = (s: string) => {
    if (s === "approved") return "success" as const;
    if (s === "rejected") return "danger" as const;
    return "warning" as const;
  };

  const openModal = async () => {
    setIsModalOpen(true);
    if (products.length === 0) {
      try {
        const data = await adminFetch<{ products: { id: string; name: string }[] }>("/api/products");
        setProducts(data.products || []);
        if (data.products?.length > 0) {
          setForm(prev => ({ ...prev, productId: data.products[0].id }));
        }
      } catch (e) {
        show("Failed to load products", "error");
      }
    }
  };

  const submitMarketingReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productId || !form.userName || !form.comment) {
      show("Please fill all fields", "error");
      return;
    }
    setSubmitting(true);
    try {
      await adminFetch("/api/reviews", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          isMarketing: true,
        }),
      });
      show("Marketing review published!");
      setIsModalOpen(false);
      setForm({ productId: products[0]?.id || "", userName: "", rating: 5, comment: "" });
      load();
    } catch (e) {
      show(e instanceof AdminApiError ? e.message : "Failed to add review", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const data = await adminFetch<{ products: { id: string; name: string }[] }>("/api/products");
      const templateData = data.products.map(p => ({
        productId: p.id,
        productName: p.name,
        userName: "Priya Sharma",
        rating: "5",
        comment: "Amazing product! highly recommended."
      }));
      
      const csv = Papa.unparse(templateData);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "reviews_template.csv";
      link.click();
    } catch (e) {
      show("Failed to generate template", "error");
    }
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm("Upload reviews from this CSV? They will be immediately approved and published.")) {
      e.target.value = "";
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const res = await adminFetch<{ success: boolean; count: number; message: string }>("/api/reviews/bulk", {
            method: "POST",
            body: JSON.stringify({ reviews: results.data }),
          });
          show(res.message);
          load();
        } catch (err) {
          show(err instanceof AdminApiError ? err.message : "Bulk upload failed", "error");
        }
        e.target.value = "";
      },
      error: () => {
        show("Failed to parse CSV file", "error");
        e.target.value = "";
      }
    });
  };

  return (
    <div>
      {Toast}
      <PageHeader
        title="Reviews"
        subtitle="Moderate customer reviews before they appear on product pages"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <AdminSelect
              value={filter}
              onChange={(e) => setFilter(e.target.value as StatusFilter)}
              className="min-w-[160px]"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="all">All</option>
            </AdminSelect>
            <AdminButton variant="secondary" onClick={downloadTemplate}>
              Download CSV
            </AdminButton>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleBulkUpload}
              />
              <span className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[12px] tracking-[1.5px] uppercase font-medium transition-colors bg-white border border-black hover:bg-neutral-50 rounded-lg">
                Upload CSV
              </span>
            </label>
            <AdminButton onClick={openModal}>Add Review</AdminButton>
          </div>
        }
      />

      {loading ? (
        <p className="text-[13px] text-[var(--color-text-muted)] animate-pulse">
          Loading reviews…
        </p>
      ) : reviews.length === 0 ? (
        <EmptyState
          title="No reviews"
          description={
            filter === "pending"
              ? "Nothing waiting for moderation."
              : "No reviews match this filter."
          }
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="bg-white border border-[var(--color-border)] rounded-xl p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-[14px] font-medium">{r.userName}</p>
                    <Badge tone={badgeTone(r.status)}>{r.status}</Badge>
                    {r.isVerifiedPurchase && (
                      <Badge tone="neutral">Verified</Badge>
                    )}
                  </div>
                  <p className="text-[12px] text-[var(--color-text-muted)]">
                    {"★".repeat(r.rating)}
                    {"☆".repeat(5 - r.rating)}
                    {r.createdAt
                      ? ` · ${new Date(r.createdAt).toLocaleString("en-IN")}`
                      : ""}
                  </p>
                  <p className="text-[12px] text-[var(--color-text-muted)] mt-1">
                    Product{" "}
                    <code className="text-[11px] bg-neutral-100 px-1 rounded">
                      {r.productId}
                    </code>
                    {" · "}
                    <Link
                      href={`/admin/products/${r.productId}/edit`}
                      className="underline underline-offset-2"
                    >
                      Edit product
                    </Link>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {r.status !== "approved" && (
                    <AdminButton
                      disabled={busyId === r.id}
                      onClick={() => setStatus(r.id, "approved")}
                    >
                      Approve
                    </AdminButton>
                  )}
                  {r.status !== "rejected" && (
                    <AdminButton
                      variant="secondary"
                      disabled={busyId === r.id}
                      onClick={() => setStatus(r.id, "rejected")}
                    >
                      Reject
                    </AdminButton>
                  )}
                  {r.status !== "pending" && (
                    <AdminButton
                      variant="ghost"
                      disabled={busyId === r.id}
                      onClick={() => setStatus(r.id, "pending")}
                    >
                      Pending
                    </AdminButton>
                  )}
                  <AdminButton
                    variant="danger"
                    disabled={busyId === r.id}
                    onClick={() => remove(r.id)}
                  >
                    Delete
                  </AdminButton>
                </div>
              </div>
              {r.comment ? (
                <p className="text-[14px] leading-relaxed whitespace-pre-wrap">
                  {r.comment}
                </p>
              ) : (
                <p className="text-[13px] text-[var(--color-text-muted)] italic">
                  No written comment
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Marketing Review Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-medium">Add Marketing Review</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-black">
                ✕
              </button>
            </div>
            <form onSubmit={submitMarketingReview} className="p-5 space-y-4">
              <AdminSelect
                label="Product"
                value={form.productId}
                onChange={(e) => setForm({ ...form, productId: e.target.value })}
                required
              >
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </AdminSelect>
              
              <AdminInput
                label="Customer Name"
                placeholder="e.g. Priya Sharma"
                value={form.userName}
                onChange={(e) => setForm({ ...form, userName: e.target.value })}
                required
              />

              <AdminSelect
                label="Rating"
                value={form.rating.toString()}
                onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                required
              >
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </AdminSelect>

              <AdminTextarea
                label="Review Comment"
                placeholder="Write the review here..."
                value={form.comment}
                onChange={(e) => setForm({ ...form, comment: e.target.value })}
                required
              />

              <div className="pt-2 flex justify-end gap-2">
                <AdminButton variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </AdminButton>
                <AdminButton type="submit" disabled={submitting}>
                  {submitting ? "Publishing..." : "Publish Review"}
                </AdminButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
