"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { FiHelpCircle, FiChevronDown } from "react-icons/fi";
import { getAdminGuide } from "@/lib/admin-guide";

export function AdminHowTo() {
  const pathname = usePathname();
  const guide = getAdminGuide(pathname);
  const [open, setOpen] = useState(true);

  if (!guide) return null;

  return (
    <div className="mb-6 print:hidden border border-sky-200 bg-sky-50 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-3 text-left px-4 py-3"
      >
        <FiHelpCircle className="text-sky-800 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-sky-900">What to do here</p>
          <p className="text-[14px] text-neutral-800 mt-0.5 leading-snug">{guide.inOneLine}</p>
        </div>
        <FiChevronDown
          className={`mt-1 shrink-0 text-sky-800 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <ol className="px-4 pb-4 pl-11 space-y-1.5 text-[14px] text-neutral-800 list-decimal">
          {guide.steps.map((step) => (
            <li key={step} className="ml-4 leading-snug">
              {step}
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
