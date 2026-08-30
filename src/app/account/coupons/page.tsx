import { SkeletonCardGrid } from '@/components/ui/Skeleton';
"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FiTag, FiCopy, FiCheck, FiChevronLeft } from "react-icons/fi";
import { PublicCouponDTO } from "@/lib/coupons";

export default function MyCouponsPage() {
  const [coupons, setCoupons] = useState<PublicCouponDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/coupons?public=1")
      .then(r => r.json())
      .then(data => {
        if (!cancelled) {
          setCoupons(data.coupons || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="w-full h-full p-4 md:p-8 lg:p-12 bg-white min-h-screen">
      <div className="flex items-center gap-4 mb-8 border-b border-[var(--color-border)] pb-6">
        <Link href="/account" className="md:hidden p-2 -ml-2 rounded-full hover:bg-gray-100">
          <FiChevronLeft className="text-xl" />
        </Link>
        <h1 className="text-2xl md:text-3xl font-serif tracking-[2px] uppercase">My Coupons</h1>
      </div>

      {loading ? (
        <div className="w-full py-12 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
        </div>
      ) : coupons.length === 0 ? (
        <div className="py-16 flex flex-col items-center text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
            <FiTag className="text-2xl text-gray-400" />
          </div>
          <h3 className="text-lg font-serif mb-2">No active coupons</h3>
          <p className="text-[13px] text-gray-500 mb-6 max-w-sm">There are no special offers available at this moment. Check back later for exclusive deals!</p>
          <Link href="/collections/all" className="px-8 py-3 bg-black text-white text-[12px] font-bold uppercase tracking-widest hover:bg-gray-800 rounded-lg transition-colors">
            Keep Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {coupons.map((coupon) => (
            <div key={coupon.code} className="border-2 border-dashed border-[var(--color-border)] rounded-xl flex overflow-hidden bg-white hover:border-black transition-colors group">
              <div className="bg-green-50 px-6 py-8 flex flex-col items-center justify-center border-r border-dashed border-[var(--color-border)] w-[120px] shrink-0">
                <span className="text-green-700 text-3xl font-bold">
                  {coupon.discountType === "PERCENT" ? `${coupon.discountValue}%` : `â‚¹${coupon.discountValue}`}
                </span>
                <span className="text-[10px] text-green-800 font-bold tracking-widest uppercase mt-1">OFF</span>
              </div>
              <div className="p-5 flex flex-col justify-center flex-1">
                <p className="text-[14px] font-bold tracking-wide mb-1 text-gray-800">
                  {(coupon.discountType === "PERCENT" ? `${coupon.discountValue}% Off your order` : `Flat â‚¹${coupon.discountValue} Off`)}
                </p>
                {coupon.minOrderAmount > 0 && (
                  <p className="text-[12px] text-gray-500 mb-3">On orders above â‚¹{coupon.minOrderAmount}</p>
                )}
                <div className="mt-auto flex items-center justify-between bg-gray-50 border border-gray-200 rounded p-2">
                  <span className="text-[13px] font-mono font-bold tracking-widest text-black pl-2">{coupon.code}</span>
                  <button 
                    onClick={() => handleCopy(coupon.code)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-[10px] font-bold uppercase tracking-wider rounded hover:bg-gray-800 transition-colors"
                  >
                    {copiedCode === coupon.code ? <><FiCheck /> Copied</> : <><FiCopy /> Copy</>}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
