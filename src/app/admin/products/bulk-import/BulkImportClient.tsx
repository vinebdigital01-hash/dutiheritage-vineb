"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { adminFetch, AdminApiError } from "@/lib/admin-api";
import { PageHeader, AdminButton, useToast } from "@/components/admin/ui";

export function BulkImportClient() {
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<{ imported: number; errors?: string[] } | null>(null);
  const { show } = useToast();
  const router = useRouter();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setResults(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const res = await adminFetch<{ imported: number; errors?: string[] }>("/api/products/bulk-import", {
            method: "POST",
            body: JSON.stringify({ products: results.data }),
          });
          
          setResults({ imported: res.imported, errors: res.errors });
          show(`Successfully imported ${res.imported} products`, "success");
        } catch (err: any) {
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
        image: "https://example.com/main.jpg",
        images: "https://example.com/2.jpg,https://example.com/3.jpg",
        sizes: "S,M,L",
        colors: "Red",
        tags: "Trending,Summer",
        seoTitle: "Buy Sample Product",
        seoDescription: "Best product in town",
        boughtLast7Days: "12",
        videoUrls: "https://youtube.com/watch?v=123",
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
      <PageHeader 
        title="Bulk Import Products" 
        subtitle="Upload a CSV to add multiple products at once. New collections will be created automatically."
        actions={
          <AdminButton variant="secondary" onClick={() => router.push("/admin/products")}>
            Back to Products
          </AdminButton>
        }
      />

      <div className="bg-white rounded-2xl border p-6 md:p-8 space-y-8">
        <div>
          <h2 className="text-lg font-serif mb-2">1. Download Template</h2>
          <p className="text-sm text-neutral-500 mb-4">
            Start with our template to ensure your data is formatted correctly. 
            For multiple sizes, tags, or images, separate them with commas.
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
