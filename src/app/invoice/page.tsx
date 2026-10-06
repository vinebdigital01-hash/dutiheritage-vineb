import { Suspense } from "react";
import { InvoiceClient } from "./InvoiceClient";

export default function InvoicePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-[14px] text-gray-500">Loading invoice…</div>
      }
    >
      <InvoiceClient />
    </Suspense>
  );
}
