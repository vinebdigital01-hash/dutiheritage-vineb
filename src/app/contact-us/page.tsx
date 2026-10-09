import { Metadata } from "next";
import { PolicyPageShell } from "@/components/PolicyPageShell";
import { getPageContent } from "@/lib/site-content-server";
import { getStoreIdentity } from "@/lib/store-identity";

export const metadata: Metadata = {
  title: "Contact Us | Duti Heritage",
  description:
    "Contact Duti Heritage in Manesar, Gurugram. Email, WhatsApp, and boutique address for orders and support.",
};

export default async function ContactUsPage() {
  const live = await getPageContent("contact-us");
  const store = getStoreIdentity();
  const phone = store.supportPhone || "91-7017194982";
  const email = store.supportEmail || "supportdutiheritage@gmail.com";
  const waDigits = phone.replace(/\D/g, "");

  return (
    <PolicyPageShell title={live?.title || "Contact Us"} content={live?.content}>
      <div className="space-y-8 text-[var(--color-text-muted)] leading-relaxed">
        <section>
          <p>
            We are happy to help with orders, sizing, exchanges, and boutique visits.
            Reach us by email or WhatsApp — we aim to reply within one business day.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-[var(--color-text)] mb-4 uppercase tracking-wider">
            Boutique &amp; registered address
          </h2>
          <p className="whitespace-pre-line">{store.address}</p>
          {store.gstin ? (
            <p className="mt-2 text-sm">GSTIN: {store.gstin}</p>
          ) : null}
        </section>

        <section>
          <h2 className="text-xl font-medium text-[var(--color-text)] mb-4 uppercase tracking-wider">
            Hours
          </h2>
          <p>Monday – Saturday: 10:00 AM – 7:00 PM (IST)</p>
          <p>Sunday: Closed (online orders still accepted)</p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-[var(--color-text)] mb-4 uppercase tracking-wider">
            Email &amp; WhatsApp
          </h2>
          <ul className="space-y-2">
            <li>
              Email:{" "}
              <a href={`mailto:${email}`} className="underline text-[var(--color-text)]">
                {email}
              </a>
            </li>
            <li>
              WhatsApp / Phone:{" "}
              <a
                href={`https://wa.me/${waDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-[var(--color-text)]"
              >
                {phone}
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-medium text-[var(--color-text)] mb-4 uppercase tracking-wider">
            Track an order
          </h2>
          <p>
            Already ordered? Use{" "}
            <a href="/track" className="underline text-[var(--color-text)]">
              Track order
            </a>{" "}
            with your order number and phone.
          </p>
        </section>
      </div>
    </PolicyPageShell>
  );
}
