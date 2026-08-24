import { Metadata } from "next";
import { PolicyPageShell } from "@/components/PolicyPageShell";
import { getPageContent } from "@/lib/site-content-server";

export const metadata: Metadata = {
  title: "Return and Exchange Policy | Duti Heritage",
  description: "Return and Exchange Policy for Duti Heritage",
};

export default async function ReturnExchangePage() {
  const live = await getPageContent("return-exchange");

  return (
    <PolicyPageShell
      title={live?.title || "Return And Exchange Policy"}
      content={live?.content}
    >
      <div className="space-y-10 text-[var(--color-text-muted)] leading-relaxed">
        <section>
          <h2 className="text-xl font-medium text-[var(--color-text)] mb-6 uppercase tracking-wider">
            Exchange and Cancellation Policy
          </h2>
          <div className="space-y-4">
            <p>
              <strong>Size Exchange:</strong> If the customer has any size issue
              with the product delivered then he/she needs to inform us within 24
              Hours from the date of delivery.
            </p>
            <p>
              <strong>Return:</strong> We humbly don&apos;t take returns on items
              sold once.
            </p>
            <p>
              <strong>Damaged/Wrong Delivery:</strong> Such cases are to be
              informed us within 24 hours of delivery.
            </p>
          </div>
        </section>
        <section>
          <h2 className="text-xl font-medium text-[var(--color-text)] mb-4 uppercase tracking-wider">
            Can I cancel my order?
          </h2>
          <p>Prepaid orders are not eligible for cancellation.</p>
        </section>
      </div>
    </PolicyPageShell>
  );
}
