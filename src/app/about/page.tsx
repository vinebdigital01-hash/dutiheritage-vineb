import { Metadata } from "next";
import { PolicyPageShell } from "@/components/PolicyPageShell";
import { getPageContent } from "@/lib/site-content-server";
import { getStoreIdentity } from "@/lib/store-identity";

export const metadata: Metadata = {
  title: "About Us | Duti Heritage",
  description:
    "Our story — Duti Heritage is a premium ethnic wear boutique in Manesar, Gurugram, serving Delhi NCR with cotton suits, unstitched sets, and luxury nightwear.",
};

export default async function AboutPage() {
  const live = await getPageContent("about");
  const store = getStoreIdentity();

  return (
    <PolicyPageShell title={live?.title || "Our Story"} content={live?.content}>
      <div className="space-y-8 text-[var(--color-text-muted)] leading-relaxed">
        <section>
          <p>
            <strong className="text-[var(--color-text)]">Duti Heritage</strong> began as a
            boutique for women who want ethnic wear that feels special — soft cotton suits,
            carefully chosen unstitched sets, and luxury nightwear you can wear every day.
          </p>
          <p className="mt-4">
            From our base in Manesar, Gurugram, we ship across India and welcome shoppers from
            Delhi NCR who prefer to see and feel the fabric in person. Online, you shop the same
            pieces at{" "}
            <a href="https://dutiheritage.co.in" className="underline text-[var(--color-text)]">
              dutiheritage.co.in
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-[var(--color-text)] mb-4 uppercase tracking-wider">
            What we believe
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Quality over hype — each piece is checked before it leaves us.</li>
            <li>Clear pricing — prices you see include GST.</li>
            <li>Honest service — tracking, exchanges, and support without jargon.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-medium text-[var(--color-text)] mb-4 uppercase tracking-wider">
            Visit or write to us
          </h2>
          <p>{store.address}</p>
          {store.supportEmail ? (
            <p className="mt-2">
              Email:{" "}
              <a href={`mailto:${store.supportEmail}`} className="underline">
                {store.supportEmail}
              </a>
            </p>
          ) : null}
          {store.supportPhone ? <p>Phone / WhatsApp: {store.supportPhone}</p> : null}
          <p className="mt-4">
            Full contact details:{" "}
            <a href="/contact-us" className="underline text-[var(--color-text)]">
              Contact Us
            </a>
          </p>
        </section>
      </div>
    </PolicyPageShell>
  );
}
