"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { adminFetch, AdminApiError } from "@/lib/admin-api";
import {
  PageHeader,
  AdminButton,
  AdminInput,
  AdminSelect,
  AdminTextarea,
  Badge,
  useToast,
} from "@/components/admin/ui";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/admin-constants";
import type { OrderDTO } from "@/lib/mappers";

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { show, Toast } = useToast();
  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<OrderStatus>("Confirmation Pending");
  const [awb, setAwb] = useState("");
  const [courier, setCourier] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [notes, setNotes] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminFetch<{ order: OrderDTO }>(`/api/orders/${id}`);
      setOrder(data.order);
      setStatus(data.order.status);
      setAwb(data.order.trackingInfo?.awb || "");
      setCourier(data.order.trackingInfo?.courier || "");
      setTrackingUrl(data.order.trackingInfo?.trackingUrl || "");
      setNotes(data.order.notes || "");
    } catch (e) {
      show(e instanceof AdminApiError ? e.message : "Not found", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const save = async () => {
    setSaving(true);
    try {
      const data = await adminFetch<{ order: OrderDTO }>(`/api/orders/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          status,
          notes,
          trackingInfo: { awb, courier, trackingUrl },
        }),
      });
      setOrder(data.order);
      show("Order updated");
    } catch (e) {
      show(e instanceof AdminApiError ? e.message : "Update failed", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <p className="text-[13px] text-neutral-500 animate-pulse">Loading order…</p>
    );
  }

  if (!order) {
    return (
      <div>
        <p className="mb-4">Order not found.</p>
        <Link href="/admin/orders" className="underline text-[13px]">
          Back to orders
        </Link>
      </div>
    );
  }

  return (
    <div>
      {Toast}
      <PageHeader
        title={order.orderId}
        subtitle={`Placed ${order.createdAt ? new Date(order.createdAt).toLocaleString("en-IN") : ""}`}
        actions={
          <Link href="/admin/orders">
            <AdminButton variant="secondary">All orders</AdminButton>
          </Link>
        }
      />

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="space-y-6">
          <section className="bg-white border border-[var(--color-border)] rounded-xl p-5 shadow-sm">
            <h2 className="text-[12px] tracking-[2px] uppercase text-neutral-500 mb-4">
              Items
            </h2>
            <div className="space-y-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex gap-3 items-center">
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-neutral-100 border shrink-0">
                    {item.image && (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium truncate">{item.name}</p>
                    <p className="text-[12px] text-neutral-500">
                      {item.size || "—"} · Qty {item.quantity}
                    </p>
                  </div>
                  <p className="text-[14px] font-medium">
                    ₹
                    {(
                      (item.salePrice ?? item.price) * item.quantity
                    ).toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t text-[13px] space-y-1">
              <div className="flex justify-between">
                <span className="text-neutral-500">Subtotal</span>
                <span>₹{order.subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Shipping</span>
                <span>₹{order.shipping.toLocaleString("en-IN")}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount</span>
                  <span>-₹{order.discount.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between font-medium text-[15px] pt-2">
                <span>Total</span>
                <span>₹{order.total.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </section>

          <section className="bg-white border border-[var(--color-border)] rounded-xl p-5 shadow-sm">
            <h2 className="text-[12px] tracking-[2px] uppercase text-neutral-500 mb-4">
              Customer
            </h2>
            <div className="text-[14px] space-y-1">
              <p className="font-medium">{order.customer.name}</p>
              <p>{order.customer.phone}</p>
              {order.customer.email && <p>{order.customer.email}</p>}
              <p className="text-neutral-600 pt-2">
                {order.customer.address}
                {order.customer.apartment ? `, ${order.customer.apartment}` : ""}
                <br />
                {order.customer.city}, {order.customer.state}{" "}
                {order.customer.pinCode}
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="info">{order.paymentMethod}</Badge>
              <Badge>{order.paymentStatus}</Badge>
              {order.couponCode && <Badge tone="success">{order.couponCode}</Badge>}
            </div>
          </section>
        </div>

        <section className="bg-white border border-[var(--color-border)] rounded-xl p-5 shadow-sm h-fit space-y-4">
          <h2 className="text-[12px] tracking-[2px] uppercase text-neutral-500">
            Fulfillment
          </h2>
          <AdminSelect
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </AdminSelect>
          <AdminInput
            label="Courier"
            value={courier}
            onChange={(e) => setCourier(e.target.value)}
            placeholder="BlueDart / Delhivery…"
          />
          <AdminInput
            label="AWB / Tracking ID"
            value={awb}
            onChange={(e) => setAwb(e.target.value)}
          />
          <AdminInput
            label="Tracking URL"
            value={trackingUrl}
            onChange={(e) => setTrackingUrl(e.target.value)}
          />
          <AdminTextarea
            label="Internal notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <AdminButton onClick={save} disabled={saving} className="w-full">
            {saving ? "Saving…" : "Save & update status"}
          </AdminButton>
        </section>
      </div>
    </div>
  );
}
