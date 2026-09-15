new_page = """"use client";
import React, { useState } from "react";
import { PageHeader, AdminButton } from "@/components/admin/ui";
import { adminFetch } from "@/lib/admin-api";
import { FiMail, FiDownload, FiCheckCircle } from "react-icons/fi";

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [targetEmail, setTargetEmail] = useState("liveproject072@gmail.com");

  const handleGenerateReport = async () => {
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      const res = await adminFetch<any>("/api/reports/monthly", {
        method: "POST",
        body: JSON.stringify({ email: targetEmail })
      });
      if (res.success) {
        setSuccessMsg(`Report successfully generated and emailed to ${targetEmail}`);
      } else {
        setErrorMsg("Failed to generate report.");
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to generate report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Generate and email store performance reports"
      />
      
      <div className="bg-white border border-[var(--color-border)] rounded-xl p-6 shadow-sm max-w-2xl">
        <h2 className="text-lg font-bold mb-4">Monthly Store Report</h2>
        <p className="text-sm text-neutral-500 mb-6">
          This report includes a summary of revenue, orders, inventory alerts, and abandoned carts over the last 30 days. It is automatically sent to the super admin on the 1st of every month via cron, but you can manually trigger it here.
        </p>

        <div className="flex flex-col gap-4 mb-6">
          <div>
            <label className="block text-[13px] font-bold text-gray-700 tracking-[1px] uppercase mb-2">Recipient Email</label>
            <input 
              type="email" 
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-[14px] font-medium outline-none focus:border-gray-900 focus:bg-white transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleGenerateReport}
            disabled={loading}
            className={`flex items-center gap-2 py-3 px-6 rounded-xl text-[13px] font-bold tracking-[1px] uppercase transition-colors ${loading ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-black'}`}
          >
            {loading ? "Generating..." : <><FiMail size={16}/> Email Report</>}
          </button>
        </div>

        {successMsg && (
          <div className="mt-6 flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
            <FiCheckCircle size={18} />
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm font-medium">
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
}
"""

import os
os.makedirs("src/app/admin/reports", exist_ok=True)
with open("src/app/admin/reports/page.tsx", "w", encoding="utf-8") as f:
    f.write(new_page)
print("Created reports page")
