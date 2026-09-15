"use client";

import { useState } from "react";
import { PageHeader, AdminButton, useToast } from "@/components/admin/ui";
import { FiDownload, FiUpload, FiCheckCircle } from "react-icons/fi";
import Papa from "papaparse";
import { adminFetch } from "@/lib/admin-api";
import Link from "next/link";

export default function BulkInventoryPage() {
  const { show, Toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ updatedCount: number } | null>(null);

  const handleDownload = () => {
    window.location.href = "/api/products/bulk-inventory";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return show("Please select a file first", "error");
    
    setLoading(true);
    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const res = await adminFetch<{ updatedCount: number }>("/api/products/bulk-inventory", {
              method: "POST",
              body: JSON.stringify({ items: results.data }),
            });
            setResult({ updatedCount: res.updatedCount });
            show(`Successfully updated ${res.updatedCount} stock entries`, "success");
          } catch (e: any) {
            show(e.message || "Upload failed", "error");
          } finally {
            setLoading(false);
          }
        },
        error: (error) => {
          show(error.message, "error");
          setLoading(false);
        }
      });
    } catch (e: any) {
      show(e.message, "error");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-8">
      {Toast}
      <PageHeader
        title="Bulk Inventory Update"
        subtitle="Download current inventory, edit stock, and re-upload"
      />

      <div className="bg-white border border-neutral-200 rounded-xl p-8 space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-bold tracking-[1px] uppercase">Step 1: Download Inventory</h3>
          <p className="text-[13px] text-neutral-500">
            Download the current stock levels of all products tracking inventory.
          </p>
          <AdminButton variant="secondary" onClick={handleDownload} className="flex items-center gap-2">
            <FiDownload /> Download CSV
          </AdminButton>
        </div>

        <hr className="border-neutral-100" />

        <div className="space-y-4">
          <h3 className="text-sm font-bold tracking-[1px] uppercase">Step 2: Upload Updated Inventory</h3>
          <p className="text-[13px] text-neutral-500">
            Upload the edited CSV. Do not change the <code>productId</code> or <code>size</code> columns.
          </p>
          
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center bg-neutral-50">
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileChange}
              className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-neutral-800 cursor-pointer"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <AdminButton 
              onClick={handleUpload} 
              disabled={!file || loading}
              className="flex items-center gap-2"
            >
              <FiUpload /> {loading ? "Uploading..." : "Upload & Update Stock"}
            </AdminButton>
            <Link href="/admin/products">
              <AdminButton variant="ghost">Cancel</AdminButton>
            </Link>
          </div>
        </div>

        {result && (
          <div className="mt-8 bg-emerald-50 text-emerald-800 p-4 rounded-xl flex items-start gap-3">
            <FiCheckCircle className="mt-0.5" size={18} />
            <div>
              <h4 className="font-bold text-sm">Update Complete</h4>
              <p className="text-[13px] mt-1">Successfully updated {result.updatedCount} stock entries.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
