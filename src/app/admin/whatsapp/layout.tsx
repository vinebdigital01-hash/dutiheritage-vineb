"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiMessageCircle, FiRadio, FiActivity, FiBarChart2 } from "react-icons/fi";

const WA_NAV = [
  { href: "/admin/whatsapp", label: "Live Inbox", icon: FiMessageCircle },
  { href: "/admin/whatsapp/broadcast", label: "Broadcast", icon: FiRadio },
  { href: "/admin/whatsapp/logs", label: "Activity Logs", icon: FiActivity },
  { href: "/admin/whatsapp/analytics", label: "Analytics", icon: FiBarChart2 },
];

export default function WhatsAppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {WA_NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  active
                    ? "bg-black text-white shadow-sm"
                    : "bg-white text-neutral-600 hover:bg-neutral-100 border border-[var(--color-border)]"
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full w-fit">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>WhatsApp Bot Active</span>
        </div>
      </div>
      {children}
    </div>
  );
}

