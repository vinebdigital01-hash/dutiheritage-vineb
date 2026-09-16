"use client";

import Barcode from "react-barcode";
import { buildGstInvoice, inr, type GstInvoiceOrder } from "@/lib/gst-invoice";

export function GstTaxInvoice({
  order,
  showPrintButton = false,
  seller: sellerOverride,
}: {
  order: GstInvoiceOrder;
  showPrintButton?: boolean;
  seller?: ReturnType<typeof import("@/lib/store-identity").getStoreIdentity>;
}) {
  const inv = buildGstInvoice(order, sellerOverride);
  const { seller, buyer } = inv;
  const billTo = `${buyer.name}\n${buyer.address}${buyer.apartment ? `\n${buyer.apartment}` : ""}\n${buyer.city}, ${buyer.state} ${buyer.pinCode}\nPhone: ${buyer.phone}${buyer.email ? `\n${buyer.email}` : ""}`;

  return (
    <div className="max-w-4xl mx-auto border border-gray-200 p-6 md:p-10 print:border-none print:p-0 bg-white text-black font-sans text-sm">
      <div className="flex justify-between items-start border-b border-gray-300 pb-4 mb-5">
        <div className="flex items-start gap-4">
          <img src="/logo.svg" alt="" className="h-14 w-14 object-contain" />
          <div>
            <h1 className="text-xl font-serif tracking-[2px] uppercase">{seller.legalName}</h1>
            <p className="text-[11px] leading-relaxed text-gray-700 mt-1 max-w-sm whitespace-pre-line">
              {seller.address}
            </p>
            <p className="text-[11px] mt-1">
              GSTIN: <span className="font-mono font-medium">{seller.gstin}</span>
              {inv.sellerPan ? (
                <>
                  {" · "}PAN: <span className="font-mono">{inv.sellerPan}</span>
                </>
              ) : null}
            </p>
            <p className="text-[11px] text-gray-600">
              State: {seller.state} ({seller.stateCode})
              {seller.supportEmail ? ` · ${seller.supportEmail}` : ""}
            </p>
          </div>
        </div>
        <div className="text-right flex flex-col items-end">
          <h2 className="text-lg font-medium uppercase tracking-wider text-gray-800">
            Tax Invoice
          </h2>
          <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-2">
            Original for recipient
          </p>
          <Barcode value={order.orderId} width={1} height={36} fontSize={11} margin={0} displayValue />
          <p className="text-xs mt-2 font-mono">Invoice no. {order.orderId}</p>
          <p className="text-xs text-gray-600">
            Date:{" "}
            {order.createdAt
              ? new Date(order.createdAt).toLocaleDateString("en-IN")
              : "—"}
          </p>
          {showPrintButton && (
            <button
              type="button"
              onClick={() => window.print()}
              className="mt-3 border border-black px-3 py-1.5 text-xs font-semibold uppercase tracking-wide hover:bg-black hover:text-white print:hidden"
            >
              Print PDF
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-5 text-xs">
        <div>
          <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Bill / ship to
          </h3>
          <p className="whitespace-pre-line leading-relaxed">{billTo}</p>
        </div>
        <div className="space-y-1">
          <p>
            <span className="text-gray-500">Place of supply:</span> {inv.placeOfSupply}
            {inv.placeOfSupplyCode ? ` (${inv.placeOfSupplyCode})` : ""}
          </p>
          <p>
            <span className="text-gray-500">Supply type:</span>{" "}
            {inv.intra ? "Intra-state (CGST + SGST)" : "Inter-state (IGST)"}
          </p>
          <p>
            <span className="text-gray-500">Reverse charge:</span> No
          </p>
          <p>
            <span className="text-gray-500">Payment:</span> {order.paymentMethod.toUpperCase()}
          </p>
          <p className="text-gray-500">All amounts in INR. Prices are GST-inclusive.</p>
        </div>
      </div>

      <table className="w-full text-left mb-4 text-[11px]">
        <thead>
          <tr className="border-y border-gray-300 text-[10px] uppercase tracking-wider text-gray-500">
            <th className="py-2 pr-2">Item</th>
            <th className="py-2">HSN</th>
            <th className="py-2 text-center">Qty</th>
            <th className="py-2 text-right">Taxable</th>
            <th className="py-2 text-right">GST %</th>
            {inv.intra ? (
              <>
                <th className="py-2 text-right">CGST</th>
                <th className="py-2 text-right">SGST</th>
              </>
            ) : (
              <th className="py-2 text-right">IGST</th>
            )}
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {inv.lines.map((line, idx) => (
            <tr key={idx} className="border-b border-gray-100 align-top">
              <td className="py-2 pr-2">
                <p className="font-medium text-xs text-black">{line.name}</p>
                {line.size ? <p className="text-gray-500">Size: {line.size}</p> : null}
                {line.discountShare > 0 ? (
                  <p className="text-gray-400">Disc. ₹{inr(line.discountShare)}</p>
                ) : null}
              </td>
              <td className="py-2 font-mono">{line.hsn}</td>
              <td className="py-2 text-center">{line.qty}</td>
              <td className="py-2 text-right">₹{inr(line.taxable)}</td>
              <td className="py-2 text-right">{line.gstRate}%</td>
              {inv.intra ? (
                <>
                  <td className="py-2 text-right">₹{inr(line.cgst)}</td>
                  <td className="py-2 text-right">₹{inr(line.sgst)}</td>
                </>
              ) : (
                <td className="py-2 text-right">₹{inr(line.igst)}</td>
              )}
              <td className="py-2 text-right font-medium">₹{inr(line.netGross)}</td>
            </tr>
          ))}
          {inv.charges.map((c) => (
            <tr key={c.label} className="border-b border-gray-100">
              <td className="py-2 pr-2">{c.label}</td>
              <td className="py-2">—</td>
              <td className="py-2 text-center">1</td>
              <td className="py-2 text-right">₹{inr(c.taxable)}</td>
              <td className="py-2 text-right">{c.gstRate}%</td>
              {inv.intra ? (
                <>
                  <td className="py-2 text-right">₹{inr(c.cgst)}</td>
                  <td className="py-2 text-right">₹{inr(c.sgst)}</td>
                </>
              ) : (
                <td className="py-2 text-right">₹{inr(c.igst)}</td>
              )}
              <td className="py-2 text-right font-medium">₹{inr(c.gross)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mb-5">
        <div className="w-72 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">Taxable value</span>
            <span>₹{inr(inv.totals.taxable)}</span>
          </div>
          {inv.intra ? (
            <>
              <div className="flex justify-between">
                <span className="text-gray-500">CGST</span>
                <span>₹{inr(inv.totals.cgst)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">SGST</span>
                <span>₹{inr(inv.totals.sgst)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between">
              <span className="text-gray-500">IGST</span>
              <span>₹{inr(inv.totals.igst)}</span>
            </div>
          )}
          {inv.totals.discount > 0 && (
            <div className="flex justify-between text-gray-500">
              <span>Coupon discount{inv.couponCode ? ` (${inv.couponCode})` : ""} already applied</span>
              <span>₹{inr(inv.totals.discount)}</span>
            </div>
          )}
          {inv.totals.prepaidDiscount > 0 && (
            <div className="flex justify-between text-gray-500">
              <span>Prepaid discount already applied</span>
              <span>₹{inr(inv.totals.prepaidDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between py-2 mt-1 border-t border-black text-sm font-bold">
            <span>Grand total</span>
            <span>₹{inr(inv.totals.grandTotal)}</span>
          </div>
        </div>
      </div>

      <div className="p-3 border border-gray-200 bg-gray-50 text-center mb-5">
        <p className="text-sm font-bold uppercase tracking-widest">
          {order.paymentMethod === "cod" ? (
            <span>Collect cash ₹{inr(order.total)}</span>
          ) : (
            <span>Do not collect cash</span>
          )}
        </p>
      </div>

      <div className="pt-3 border-t border-gray-200 text-[10px] text-gray-600 space-y-2">
        <p>
          Certified that the particulars given above are true and correct and the amount
          indicated represents the price actually charged and that there is no additional
          consideration.
        </p>
        <p className="border border-dashed border-gray-300 p-2 bg-yellow-50 text-yellow-900 text-[11px] text-center">
          Unboxing video is required for any exchange or return. Record continuously from
          breaking the seal to inspecting the items.
        </p>
        <p className="text-right pt-4">
          For {seller.legalName}
          <br />
          <span className="text-gray-400">Authorised signatory</span>
        </p>
      </div>
    </div>
  );
}
