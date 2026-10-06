"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { adminFetch, AdminApiError } from "@/lib/admin-api";
import { PageHeader, AdminButton, useToast } from "@/components/admin/ui";
import { parseSpreadsheetFile, SPREADSHEET_ACCEPT } from "@/lib/spreadsheet-client";

type DuplicateMode = "skip" | "update";

export function BulkImportClient() {
  const [uploading, setUploading] = useState(false);
  const [onDuplicate, setOnDuplicate] = useState<DuplicateMode>("skip");
  const [results, setResults] = useState<{
    imported: number;
    updated?: number;
    skipped?: number;
    errors?: string[];
  } | null>(null);
  const { show, Toast } = useToast();
  const router = useRouter();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setResults(null);
    try {
      const rows = await parseSpreadsheetFile(file);
      if (rows.length === 0) {
        show("The spreadsheet has no product rows", "error");
        return;
      }
      const res = await adminFetch<{
        imported: number;
        updated?: number;
        skipped?: number;
        errors?: string[];
      }>("/api/products/bulk-import", {
        method: "POST",
        body: JSON.stringify({ products: rows, onDuplicate }),
      });

      setResults({
        imported: res.imported,
        updated: res.updated,
        skipped: res.skipped,
        errors: res.errors,
      });
      const parts = [
        res.imported ? `created ${res.imported}` : null,
        res.updated ? `updated ${res.updated}` : null,
        res.skipped ? `skipped ${res.skipped}` : null,
      ].filter(Boolean);
      if (res.errors?.length) {
        show(`${parts.join(", ") || "Done"}. ${res.errors.length} row(s) had errors.`, "error");
      } else {
        show(parts.join(", ") || "Nothing to import", "success");
      }
    } catch (err: unknown) {
      show(err instanceof AdminApiError ? err.message : err instanceof Error ? err.message : "Import failed", "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        name: "Sample Product",
        slug: "sample-product",
        price: "1999",
        salePrice: "1499",
        description: "This is a great product",
        collectionName: "New Arrivals",
        image: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        images: "",
        sizes: "S,M,L",
        colors: "Red",
        tags: "Trending,Summer",
        stock: "10",
        seoTitle: "Buy Sample Product",
        seoDescription: "Best product in town",
        boughtLast7Days: "12",
        videoUrls: "",
        hsn: "6104",
        gstRate: "5",
        codAvailable: "true",
        isActive: "true",
      },
    ];

    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "products_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      {Toast}
      <PageHeader
        title="Add many products"
        subtitle="Upload Excel (.xlsx) or CSV. New collections are created if the name is new."
        actions={
          <AdminButton variant="secondary" onClick={() => router.push("/admin/products")}>
            Back to Products
          </AdminButton>
        }
      />

      <div className="bg-white rounded-2xl border p-6 md:p-8 space-y-8">
        <div>
          <h2 className="text-lg font-serif mb-2">1. Download spreadsheet template</h2>
          <p className="text-sm text-neutral-500 mb-4">
            Required: name, price, collectionName, image. Separate sizes, tags, or extra images with commas. You can fill this in Excel and upload the .xlsx.
          </p>
          <AdminButton variant="secondary" onClick={downloadTemplate}>
            Download CSV template
          </AdminButton>
        </div>

        <hr className="border-neutral-100" />

        <div>
          <h2 className="text-lg font-serif mb-2">2. If a slug already exists</h2>
          <p className="text-sm text-neutral-500 mb-3">
            We will not silently overwrite. Choose what to do when the spreadsheet has a product slug that is already in the shop.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="flex items-start gap-2 text-[13px] cursor-pointer border border-neutral-200 rounded-xl p-3 flex-1">
              <input
                type="radio"
                name="onDuplicate"
                className="mt-1"
                checked={onDuplicate === "skip"}
                onChange={() => setOnDuplicate("skip")}
              />
              <span>
                <strong className="block">Skip</strong>
                Leave the existing product alone. Safer default.
              </span>
            </label>
            <label className="flex items-start gap-2 text-[13px] cursor-pointer border border-neutral-200 rounded-xl p-3 flex-1">
              <input
                type="radio"
                name="onDuplicate"
                className="mt-1"
                checked={onDuplicate === "update"}
                onChange={() => setOnDuplicate("update")}
              />
              <span>
                <strong className="block">Update</strong>
                Replace name, price, stock, and other columns for that slug.
              </span>
            </label>
          </div>
        </div>

        <hr className="border-neutral-100" />

        <div>
          <h2 className="text-lg font-serif mb-2">3. Upload spreadsheet</h2>
          <p className="text-sm text-neutral-500 mb-4">
            Excel (.xlsx) or CSV. Up to 500 products per upload.
          </p>

          <div className="relative">
            <input
              type="file"
              accept={SPREADSHEET_ACCEPT}
              onChange={handleFileUpload}
              disabled={uploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                uploading
                  ? "bg-neutral-50 border-neutral-200"
                  : "hover:border-black border-neutral-300"
              }`}
            >
              {uploading ? (
                <div className="animate-pulse text-sm font-medium">Uploading and processing…</div>
              ) : (
                <div>
                  <div className="font-medium text-sm mb-1">Click to upload or drag and drop</div>
                  <div className="text-xs text-neutral-500">.xlsx or .csv</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {results && (
          <div className="bg-neutral-50 rounded-xl p-6 border">
            <h3 className="font-medium mb-2">Import results</h3>
            <p className="text-sm text-emerald-700 mb-2">
              Created {results.imported}
              {results.updated != null ? ` · Updated ${results.updated}` : ""}
              {results.skipped != null ? ` · Skipped ${results.skipped}` : ""}
            </p>

            {results.errors && results.errors.length > 0 && (
              <div>
                <p className="text-sm text-red-600 font-medium mb-2">
                  These rows had errors:
                </p>
                <ul className="text-xs text-red-500 space-y-1 list-disc pl-4">
                  {results.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
