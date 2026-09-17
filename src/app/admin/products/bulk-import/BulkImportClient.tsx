"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { adminFetch, AdminApiError } from "@/lib/admin-api";
import { PageHeader, AdminButton, useToast } from "@/components/admin/ui";

export function BulkImportClient() {
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<{ imported: number; errors?: string[] } | null>(null);
  const { show, Toast } = useToast();
  const router = useRouter();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const name = file.name.toLowerCase();
    if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      show("Save the file as CSV (not Excel .xlsx), then upload again", "error");
      e.target.value = "";
      return;
    }

    setUploading(true);
    setResults(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.replace(/^\uFEFF/, "").trim(),
      complete: async (parsed) => {
        try {
          const rows = (parsed.data as Record<string, unknown>[]).filter((row) =>
            Object.values(row).some((v) => String(v ?? "").trim())
          );
          if (rows.length === 0) {
            show("The spreadsheet has no product rows", "error");
            setUploading(false);
            e.target.value = "";
            return;
          }
          const res = await adminFetch<{ imported: number; errors?: string[] }>("/api/products/bulk-import", {
            method: "POST",
            body: JSON.stringify({ products: rows }),
          });
          
          setResults({ imported: res.imported, errors: res.errors });
          if (res.errors?.length) {
            show(`Imported ${res.imported}. ${res.errors.length} row(s) skipped.`, "error");
          } else {
            show(`Imported ${res.imported} products`, "success");
          }
        } catch (err: unknown) {
          show(err instanceof AdminApiError ? err.message : "Import failed", "error");
        } finally {
          setUploading(false);
          e.target.value = "";
        }
      },
      error: (error) => {
        show(error.message, "error");
        setUploading(false);
      },
    });
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
        isActive: "true"
      }
    ];
    
    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
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
        subtitle="One spreadsheet creates many products. New collections are created if the name is new."
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
            Use this file so columns match. Required: name, price, collectionName, image. Separate sizes, tags, or extra images with commas. Same slug updates that product instead of failing.
          </p>
          <AdminButton variant="secondary" onClick={downloadTemplate}>
            Download CSV Template
          </AdminButton>
        </div>

        <hr className="border-neutral-100" />

        <div>
          <h2 className="text-lg font-serif mb-2">2. Upload CSV File</h2>
          <p className="text-sm text-neutral-500 mb-4">
            Upload your filled CSV file here. The system will process it row by row.
          </p>
          
          <div className="relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={uploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${uploading ? 'bg-neutral-50 border-neutral-200' : 'hover:border-black border-neutral-300'}`}>
              {uploading ? (
                <div className="animate-pulse text-sm font-medium">Uploading and processing...</div>
              ) : (
                <div>
                  <div className="font-medium text-sm mb-1">Click to upload or drag and drop</div>
                  <div className="text-xs text-neutral-500">CSV files only</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {results && (
          <div className="bg-neutral-50 rounded-xl p-6 border">
            <h3 className="font-medium mb-2">Import Results</h3>
            <p className="text-sm text-emerald-600 mb-4">
              Successfully imported {results.imported} products.
            </p>
            
            {results.errors && results.errors.length > 0 && (
              <div>
                <p className="text-sm text-red-600 font-medium mb-2">The following rows had errors and were skipped:</p>
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
