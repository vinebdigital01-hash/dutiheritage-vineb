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
      <div className="space-y-8 text-[var(--color-text-muted)] leading-relaxed">

        <section>
          <h2 className="text-xl font-medium text-[var(--color-text)] mb-4 uppercase tracking-wider">
            Dispatch & Delivery Time
          </h2>
          <div className="space-y-3">
            <p>
              We normally dispatch all orders within{" "}
              <strong className="text-[var(--color-text)]">48–72 hours</strong> of receiving the order.
            </p>
            <p>
              Depending on your location, delivery takes approximately{" "}
              <strong className="text-[var(--color-text)]">3 to 7 working days</strong> after dispatch.
            </p>
            <p>
              Shipping timelines are approximate and may vary due to public holidays, natural events, or
              courier delays. We recommend placing your order early if you have a specific deadline.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-medium text-[var(--color-text)] mb-4 uppercase tracking-wider">
            Shipping Charges
          </h2>
          <div className="space-y-3">
            <p>
              <strong className="text-[var(--color-text)]">Free Shipping</strong> is available on prepaid orders above a minimum order value (as displayed at checkout).
            </p>
            <p>
              A nominal shipping fee may apply to orders below the free shipping threshold, which will be
              clearly shown at checkout before payment.
            </p>
            <p>
              <strong className="text-[var(--color-text)]">COD (Cash on Delivery)</strong> orders may have an
              additional handling charge, which will be shown at checkout.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-medium text-[var(--color-text)] mb-4 uppercase tracking-wider">
            Delivery Coverage
          </h2>
          <p>
            We deliver <strong>Pan India</strong> — to all states and union territories across India.
            International shipping is currently not available.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-[var(--color-text)] mb-4 uppercase tracking-wider">
            Cash on Delivery (COD)
          </h2>
          <div className="space-y-3">
            <p>
              COD is available on eligible orders. Some products may require a partial advance payment
              at the time of order, with the remaining balance paid at delivery.
            </p>
            <p>
              COD availability is subject to your delivery pincode and order value. You will be informed
              at checkout if COD is available for your order.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-medium text-[var(--color-text)] mb-4 uppercase tracking-wider">
            Order Tracking
          </h2>
          <p>
            Once your order is dispatched, you will receive a tracking number via SMS/WhatsApp/email.
            You can use this to track your shipment on the courier partner&apos;s website.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-[var(--color-text)] mb-4 uppercase tracking-wider">
            Contact Us
          </h2>
          <p>For shipping queries, reach out to us at:</p>
          <ul className="mt-2 space-y-1">
            <li><strong>Email:</strong> hello@duti-heritage.com</li>
            <li><strong>Phone:</strong> +91 69010 80808</li>
          </ul>
        </section>

      </div>
    </PolicyPageShell>
  );
}
