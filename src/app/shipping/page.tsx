import { Metadata } from "next";
import { PolicyPageShell } from "@/components/PolicyPageShell";
import { getPageContent } from "@/lib/site-content-server";

export const metadata: Metadata = {
  title: "Delivery & Shipping Policy | Duti Heritage",
  description: "Delivery and Shipping Policy for Duti Heritage",
};

export default async function ShippingPolicyPage() {
  const live = await getPageContent("shipping");

  return (
    <PolicyPageShell
      title={live?.title || "Delivery & Shipping Policy"}
      content={live?.content}
    >
      <div className="space-y-6 text-[var(--color-text-muted)] leading-relaxed text-center max-w-2xl mx-auto">
        <p>
          We normally dispatch all our orders within{" "}
          <strong className="text-[var(--color-text)] font-medium">
            48-72 hours
          </strong>{" "}
          of receiving the order.
        </p>
        <p>
          Depending on the geographic location of the customer it may take about{" "}
          <strong className="text-[var(--color-text)] font-medium">
            3 to 7 working days
          </strong>{" "}
          to deliver the product to the customer door.
        </p>
        <p>
          The shipping time mentioned anywhere on the website are approximate and
          we cannot guarantee them. Customers are recommended to place an order
          early on if they have a deadline to meet.
        </p>
      </div>
    </PolicyPageShell>
  );
}
