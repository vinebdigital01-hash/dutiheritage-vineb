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
      <div className="flex items-center gap-4 border-b border-[var(--color-border)] pb-4">
        {WA_NAV.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-black text-white"
                  : "bg-white text-neutral-600 hover:bg-neutral-100 border border-[var(--color-border)]"
              }`}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </div>
      {children}
    </div>
  );
}
