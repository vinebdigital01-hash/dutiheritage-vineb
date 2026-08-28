"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { adminFetch } from "@/lib/admin-api";
import Barcode from "react-barcode";

export default function InvoicePage() {
  const { id } = useParams() as { id: string };
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminFetch(`/api/orders/${id}`)
      .then((res: any) => setOrder(res.order))
      .catch((err: any) => setError(err.message));
  }, [id]);

  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!order) return <div className="p-8 font-sans">Loading invoice...</div>;

  const cust = order.customer;
  const addressText = `${cust.name || ""}\n${cust.address}\n${cust.apartment ? cust.apartment + "\n" : ""}${cust.city}, ${cust.state} ${cust.pinCode}\n${cust.phone}`;

  return (
    <div className="bg-white text-black min-h-screen print:min-h-0 p-4 md:p-8 print:p-0 font-sans text-sm">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { margin: 0.5cm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}} />
      <div className="max-w-4xl mx-auto border border-gray-200 p-6 md:p-10 print:border-none print:p-0">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-gray-200 pb-4 mb-6">
          <div className="flex items-center gap-4">
            <img src="/logo.svg" alt="Logo" className="h-16 w-16 object-contain" />
            <h1 className="text-2xl font-serif tracking-[3px] uppercase mt-1">Duti Heritage</h1>
          </div>
          <div className="text-right flex flex-col items-end">
            <h2 className="text-2xl font-light text-gray-400 mb-2 uppercase tracking-wider">Invoice</h2>
            <Barcode value={order.orderId} width={1} height={40} fontSize={12} margin={0} displayValue={true} />
            <p className="text-gray-500 text-xs mt-2">Date: {new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
            
            <button 
              onClick={() => window.print()} 
              className="mt-4 border border-black px-3 py-1.5 text-xs font-semibold uppercase tracking-wide hover:bg-black hover:text-white transition-colors print:hidden cursor-pointer"
            >
              Print PDF
            </button>
          </div>
        </div>

        {/* Addresses */}
        <div className="flex gap-8 mb-6">
          <div className="flex-1">
            <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Sold By</h3>
            <p className="text-xs leading-relaxed text-gray-800">
              <strong>Duti Heritage</strong><br/>
              Flat 103, 10th Floor, DLF Express Green M1<br/>
              IMT Manesar, Gurugram, Haryana - 122052<br/>
              GSTIN: 06ANFPR1728Q2ZF<br/>
              support@dutiheritage.co.in
            </p>
          </div>
          <div className="flex-1">
            <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Ship To</h3>
            <p className="whitespace-pre-line text-xs leading-relaxed">{addressText}</p>
            <p className="mt-1 text-xs">{order.customer.email}</p>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-left mb-6">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="pb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Item Description</th>
              <th className="pb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-center">Qty</th>
              <th className="pb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">Unit Price</th>
              <th className="pb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item: any, idx: number) => (
              <tr key={idx} className="border-b border-gray-100">
                <td className="py-2">
                  <p className="font-medium text-xs">{item.name}</p>
                  {item.size && <p className="text-[10px] text-gray-500 mt-0.5">Size: {item.size}</p>}
                  <p className="text-[10px] text-gray-400 mt-0.5 font-mono">SKU: {item.productId.slice(-6).toUpperCase()}</p>
                </td>
                <td className="py-2 text-center text-xs">{item.quantity}</td>
                <td className="py-2 text-right text-xs">₹{item.price}</td>
                <td className="py-2 text-right text-xs font-medium">₹{item.price * item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary Box */}
        <div className="flex justify-end mb-6">
          <div className="w-64">
            <div className="flex justify-between py-1 text-xs">
              <span className="text-gray-500">Subtotal:</span>
              <span>₹{order.subtotal}</span>
            </div>
            
            {order.discount > 0 && (
              <div className="flex justify-between py-1 text-xs text-green-600">
                <span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}:</span>
                <span>-₹{order.discount}</span>
              </div>
            )}
            
            <div className="flex justify-between py-1 text-xs">
              <span className="text-gray-500">Shipping:</span>
              <span>₹{order.shipping}</span>
            </div>
            
            {order.codCharge > 0 && (
              <div className="flex justify-between py-1 text-xs">
                <span className="text-gray-500">COD Fee:</span>
                <span>₹{order.codCharge}</span>
              </div>
            )}
            
            <div className="flex justify-between py-2 mt-1 border-t border-black text-sm font-bold">
              <span>Total:</span>
              <span>₹{order.total}</span>
            </div>
          </div>
        </div>

        {/* Payment Notice */}
        <div className="p-4 border border-gray-200 bg-gray-50 rounded-sm text-center mb-6">
          <p className="text-sm font-bold uppercase tracking-widest text-black">
            {order.paymentMethod === "cod" ? (
              <span>Please collect Cash (₹{order.total})</span>
            ) : (
              <span>Please Do Not Collect Cash</span>
            )}
          </p>
          <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">
            Payment Method: {order.paymentMethod}
          </p>
        </div>

        {/* Footer Notes */}
        <div className="pt-4 border-t border-gray-200 text-xs text-gray-600 text-center">
          <p className="font-semibold text-black uppercase tracking-wider mb-1">Important Notice</p>
          <p className="mb-3 border border-dashed border-gray-300 p-2 inline-block bg-yellow-50 text-yellow-900 rounded-sm text-[11px]">
            📹 <strong>Unboxing Video is strictly necessary</strong> for any exchange or return requests.<br/>
            Please record a continuous video from breaking the seal to inspecting the items.
          </p>
          <p className="text-[10px] text-gray-400">Thank you for shopping with Duti Heritage.</p>
        </div>
      </div>
    </div>
  );
}
