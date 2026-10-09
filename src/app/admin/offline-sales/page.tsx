"use client";

import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { adminFetch, AdminApiError } from "@/lib/admin-api";
import {
  PageHeader,
  AdminButton,
  AdminSelect,
  useToast,
} from "@/components/admin/ui";

type ProductOpt = {
  id: string;
  name: string;
  sizes?: string[];
  inventory?: { size: string; stock: number }[];
};

type ClaimResult = {
  claimId: string;
  productName: string;
  size: string;
  waUrl: string;
  price: number;
};

export default function OfflineSalesPage() {
  const { show, Toast } = useToast();
  const [products, setProducts] = useState<ProductOpt[]>([]);
  const [productId, setProductId] = useState("");
  const [size, setSize] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ClaimResult | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await adminFetch<{
          products: ProductOpt[];
        }>("/api/products?all=1&limit=100");
        setProducts(data.products || []);
        if (data.products?.[0]) {
          setProductId(data.products[0].id);
        }
      } catch (e) {
        show(
          e instanceof AdminApiError ? e.message : "Could not load products",
          "error"
        );
      }
    })();
  }, [show]);

  const selected = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId]
  );

  const sizes = useMemo(() => {
    if (!selected) return [];
    if (selected.inventory?.length) {
      return selected.inventory.map((i) => i.size).filter(Boolean);
    }
    return selected.sizes || [];
  }, [selected]);

  useEffect(() => {
    if (sizes.length && !sizes.includes(size)) {
      setSize(sizes[0] || "");
    }
  }, [sizes, size]);

  const createClaim = async () => {
    if (!productId || !size) {
      show("Pick a product and size", "error");
      return;
    }
    setBusy(true);
    try {
      const data = await adminFetch<ClaimResult>("/api/admin/offline-claims", {
        method: "POST",
        body: JSON.stringify({ productId, size }),
      });
      setResult(data);
      show(`Claim ${data.claimId} ready`);
    } catch (e) {
      show(e instanceof AdminApiError ? e.message : "Failed to create claim", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {Toast}
      <PageHeader
        title="Offline sales QR"
        subtitle="Generate a WhatsApp Claim-Order QR for boutique walk-ins"
      />

      <div className="bg-white border border-[var(--color-border)] rounded-xl p-5 md:p-8 shadow-sm space-y-4 max-w-xl">
        <AdminSelect
          label="Product"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </AdminSelect>

        <AdminSelect
          label="Size"
          value={size}
          onChange={(e) => setSize(e.target.value)}
        >
          {sizes.length === 0 ? (
            <option value="">No sizes</option>
          ) : (
            sizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))
          )}
        </AdminSelect>

        <AdminButton onClick={createClaim} disabled={busy || !size}>
          {busy ? "Creating…" : "Generate claim QR"}
        </AdminButton>
      </div>

      {result?.waUrl ? (
        <div className="mt-8 bg-white border border-[var(--color-border)] rounded-xl p-8 shadow-sm max-w-xl flex flex-col items-center gap-4 text-center">
          <p className="text-[12px] tracking-[2px] uppercase text-neutral-500">
            Scan to claim on WhatsApp
          </p>
          <p className="text-2xl font-medium tracking-widest">{result.claimId}</p>
          <p className="text-sm text-neutral-600">
            {result.productName} · Size {result.size}
            {result.price ? ` · ₹${result.price}` : ""}
          </p>
          <div className="p-4 bg-white border border-neutral-200 rounded-lg">
            <QRCodeSVG value={result.waUrl} size={240} level="M" includeMargin />
          </div>
          <p className="text-xs text-neutral-500 break-all max-w-sm">{result.waUrl}</p>
          <AdminButton
            variant="secondary"
            onClick={() => {
              void navigator.clipboard.writeText(result.waUrl);
              show("WhatsApp link copied");
            }}
          >
            Copy WhatsApp link
          </AdminButton>
        </div>
      ) : result && !result.waUrl ? (
        <p className="mt-6 text-sm text-amber-700">
          Claim <strong>{result.claimId}</strong> created, but{" "}
          <code>BOT_PHONE</code> is not set — add it to env for the QR URL.
        </p>
      ) : null}
    </div>
  );
}
