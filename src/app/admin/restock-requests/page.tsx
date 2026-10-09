"use client";

import React, { useEffect, useState } from "react";
import { useToast, PageHeader } from "@/components/admin/ui";
import { adminFetch } from "@/lib/admin-api";


interface RestockReq {
  _id: string;
  email: string;
  productId: string;
  productName: string;
  size?: string;
  status: "pending" | "notified";
  createdAt: string;
}

export default function RestockRequestsPage() {
  const { show } = useToast();
  const [requests, setRequests] = useState<RestockReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await adminFetch<{ requests: RestockReq[] }>("/api/admin/restock-requests");
      setRequests(data.requests || []);
    } catch (err: any) {
      show(err.message || "Failed to load requests", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleNotify = async (id: string) => {
    setSendingId(id);
    try {
      const res = await adminFetch<{ message: string }>("/api/admin/restock-requests", {
        method: "POST",
        body: JSON.stringify({ requestId: id }),
      });
      show(res.message || "Customer notified!", "success");
      loadRequests();
    } catch (err: any) {
      show(err.message || "Failed to notify", "error");
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up">
      <PageHeader
        title="Restock Requests"
        description="Customers who want to be notified when products are back in stock."
      />

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-neutral-500">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">No restock requests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-neutral-50 border-b border-[var(--color-border)] text-neutral-500">
                <tr>
                  <th className="px-5 py-3 font-medium uppercase tracking-wider text-[11px]">Date</th>
                  <th className="px-5 py-3 font-medium uppercase tracking-wider text-[11px]">Product</th>
                  <th className="px-5 py-3 font-medium uppercase tracking-wider text-[11px]">Size</th>
                  <th className="px-5 py-3 font-medium uppercase tracking-wider text-[11px]">Email</th>
                  <th className="px-5 py-3 font-medium uppercase tracking-wider text-[11px]">Status</th>
                  <th className="px-5 py-3 font-medium uppercase tracking-wider text-[11px] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {requests.map((req) => (
                  <tr key={req._id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-5 py-3 text-neutral-500">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 font-medium">{req.productName}</td>
                    <td className="px-5 py-3">{req.size || "?"}</td>
                    <td className="px-5 py-3 text-neutral-600">{req.email}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-1 text-[11px] font-medium uppercase tracking-wider rounded-full ${
                          req.status === "notified"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {req.status === "pending" && (
                        <button
                          onClick={() => handleNotify(req._id)}
                          disabled={sendingId === req._id}
                          className="bg-black text-white px-3 py-1.5 rounded-lg text-[12px] font-medium hover:bg-neutral-800 disabled:opacity-50 transition-colors"
                        >
                          {sendingId === req._id ? "Sending..." : "Send Email"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
