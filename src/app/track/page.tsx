import { Suspense } from "react";
import { TrackOrderClient } from "./TrackOrderClient";
import { SkeletonPage } from "@/components/ui/Skeleton";

export const metadata = {
  title: "Track order | Duti Heritage",
  description: "Check your Duti Heritage order status with order number and phone.",
  robots: { index: false, follow: false },
};

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <main className="w-full min-h-[70vh] flex items-center justify-center">
          <SkeletonPage />
        </main>
      }
    >
      <TrackOrderClient />
    </Suspense>
  );
}
