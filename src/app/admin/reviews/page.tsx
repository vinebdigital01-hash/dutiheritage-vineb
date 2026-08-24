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
} from "@/components/admin/ui";
import type { ReviewDTO } from "@/lib/reviews";

type StatusFilter = "all" | "pending" | "approved" | "rejected";

export default function AdminReviewsPage() {
  const { show, Toast } = useToast();
  const [reviews, setReviews] = useState<ReviewDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);

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

  return (
    <div>
      {Toast}
      <PageHeader
        title="Reviews"
        subtitle="Moderate customer reviews before they appear on product pages"
        actions={
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
    </div>
  );
}
