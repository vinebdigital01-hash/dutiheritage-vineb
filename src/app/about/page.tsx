import { Metadata } from "next";
import { PolicyPageShell } from "@/components/PolicyPageShell";
import { getPageContent } from "@/lib/site-content-server";
import { getStoreIdentity } from "@/lib/store-identity";

export const metadata: Metadata = {
  title: "About | Duti Heritage",
  description:
    "Duti Heritage is a premium ethnic wear boutique in Manesar, Gurugram, serving Delhi NCR with cotton suits, unstitched sets, and luxury nightwear.",
};

export default async function AboutPage() {
  const live = await getPageContent("about");
  const store = getStoreIdentity();

  return (
    <PolicyPageShell title={live?.title || "About Duti Heritage"} content={live?.content}>
      <div className="space-y-8 text-[var(--color-text-muted)] leading-relaxed">
        <section>
          <p>
            <strong className="text-[var(--color-text)]">Duti Heritage</strong> is a premium fashion house
            for ethnic wear, pure cotton suits, unstitched sets, and luxury nightwear. We serve shoppers
            across Delhi NCR, Gurugram, and Manesar — online at dutiheritage.co.in and from our boutique.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-medium text-[var(--color-text)] mb-4 uppercase tracking-wider">
            Our boutique
          </h2>
          <p>{store.address}</p>
          {store.supportEmail ? (
            <p className="mt-2">
              Email: {store.supportEmail}
            </p>
          ) : null}
          {store.supportPhone ? (
            <p>Phone: {store.supportPhone}</p>
          ) : null}
        </section>
        <section>
          <h2 className="text-xl font-medium text-[var(--color-text)] mb-4 uppercase tracking-wider">
            How we sell
          </h2>
          <p>
            Prices include GST. You can pay online or with cash on delivery where your pincode allows.
            After you order, we confirm, pack, and add courier tracking. Track anytime at{" "}
            <a href="/track" className="underline">
              Track order
            </a>{" "}
            with your order number and phone.
          </p>
        </section>
      </div>
    </PolicyPageShell>
  );
}
