"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { adminFetch } from "@/lib/admin-api";
import Barcode from "react-barcode";

export default function BulkInvoicePage() {
  const searchParams = useSearchParams();
  const idsParam = searchParams.get("ids");
  
  const [orders, setOrders] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!idsParam) {
      setError("No order IDs provided");
      setLoading(false);
      return;
    }

    const ids = idsParam.split(",").map(id => id.trim()).filter(Boolean);
    if (ids.length === 0) {
      setError("No valid order IDs provided");
      setLoading(false);
      return;
    }

    const fetchAll = async () => {
      try {
        const fetchedOrders = [];
        for (const id of ids) {
          const res: any = await adminFetch(`/api/orders/${id}`);
          fetchedOrders.push(res.order);
        }
        setOrders(fetchedOrders);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [idsParam]);

  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (loading) return <div className="p-8 font-sans">Loading invoices...</div>;
  if (orders.length === 0) return <div className="p-8 font-sans">No invoices found.</div>;

  return (
    <div className="bg-neutral-100 min-h-screen text-black print:bg-white">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { margin: 0.5cm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page-break { page-break-after: always; break-after: page; }
          .page-break:last-child { page-break-after: auto; break-after: auto; }
        }
      `}} />
      
      <div className="fixed top-4 right-4 print:hidden z-50">
        <button 
          onClick={() => window.print()} 
          className="bg-black text-white px-6 py-3 text-sm font-bold uppercase tracking-widest hover:bg-gray-800 shadow-xl"
        >
          🖨️ Print All ({orders.length})
        </button>
      </div>

      {orders.map((order, i) => {
        const cust = order.customer;
        const addressText = `${cust.name || ""}\n${cust.address}\n${cust.apartment ? cust.apartment + "\n" : ""}${cust.city}, ${cust.state} ${cust.pinCode}\n${cust.phone}`;
        
        return (
          <div key={order.orderId} className="page-break bg-white p-4 md:p-8 print:p-0 font-sans text-sm mx-auto max-w-4xl border-b-[10px] border-neutral-100 print:border-none mb-8 print:mb-0">
            <div className="border border-gray-200 p-6 md:p-10 print:border-none print:p-0">
              
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
      })}
    </div>
  );
}
