import React from "react";
import { ShieldCheck, Truck, RefreshCw, BadgeCheck } from "lucide-react";

interface TrustBadgesProps {
  className?: string;
}

export const TrustBadges: React.FC<TrustBadgesProps> = ({ className = "" }) => {
  const badges = [
    {
      icon: <BadgeCheck className="w-6 h-6 mb-2 text-black/80" strokeWidth={1.5} />,
      title: "100% Authentic",
      desc: "Guaranteed Quality"
    },
    {
      icon: <ShieldCheck className="w-6 h-6 mb-2 text-black/80" strokeWidth={1.5} />,
      title: "Secure Payment",
      desc: "Safe & Encrypted"
    },
    {
      icon: <Truck className="w-6 h-6 mb-2 text-black/80" strokeWidth={1.5} />,
      title: "Pan India Delivery",
      desc: "Fast & Trackable"
    },
    {
      icon: <RefreshCw className="w-6 h-6 mb-2 text-black/80" strokeWidth={1.5} />,
      title: "Easy Exchange",
      desc: "Hassle-Free Returns"
    }
  ];

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 py-8 border-t border-b border-gray-100 ${className}`}>
      {badges.map((badge, idx) => (
        <div key={idx} className="flex flex-col items-center justify-center text-center p-2">
          {badge.icon}
          <h4 className="text-xs uppercase tracking-widest font-semibold text-gray-900 mb-1">
            {badge.title}
          </h4>
          <p className="text-[10px] text-gray-500 tracking-wide uppercase">
            {badge.desc}
          </p>
        </div>
      ))}
    </div>
  );
};
