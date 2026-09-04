import { Metadata } from "next";
import { PolicyPageShell } from "@/components/PolicyPageShell";
import { getPageContent } from "@/lib/site-content-server";

export const metadata: Metadata = {
  title: "Privacy Policy | Duti Heritage",
  description: "Privacy Policy of Duti Heritage",
};

export default async function PrivacyPolicyPage() {
  const live = await getPageContent("privacy-policy");

  return (
    <PolicyPageShell
      title={live?.title || "Privacy Policy"}
      content={live?.content}
    >
      <div className="space-y-8 text-[var(--color-text-muted)] leading-relaxed">

        <section>
          <p>
            This Privacy Policy describes how <strong>Duti Heritage</strong> (Proprietorship, GSTIN: 06ANFPR1728Q2ZF),
            operating at 103, Block D, DLF Express Green M1, IMT Manesar, Gurugram, Haryana — 122052,
            collects, uses, and protects your personal information when you visit or make a purchase from{" "}
            <strong>dutiheritage.co.in</strong>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-[var(--color-text)] mb-4 uppercase tracking-wider">
            Information We Collect
          </h2>
          <p className="mb-3">When you visit or make a purchase from our website, we may collect:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Personal Identification:</strong> Name, email address, phone number</li>
            <li><strong>Shipping Information:</strong> Delivery address, city, state, PIN code</li>
            <li><strong>Payment Information:</strong> Payment method (processed securely via Razorpay — we do not store card details)</li>
            <li><strong>Device & Usage Data:</strong> IP address, browser type, pages visited, time spent on site (via cookies)</li>
            <li><strong>Account Information:</strong> If you create an account — login credentials, order history, wishlist</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-medium text-[var(--color-text)] mb-4 uppercase tracking-wider">
            How We Use Your Information
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>To process and fulfil your orders</li>
            <li>To send order confirmation and delivery updates via email/WhatsApp</li>
            <li>To improve our website and customer experience</li>
            <li>To send promotional offers (only with your consent)</li>
            <li>To comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-medium text-[var(--color-text)] mb-4 uppercase tracking-wider">
            Third-Party Service Providers
          </h2>
          <p className="mb-3">
            To operate our business effectively, we share certain information with trusted third parties:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Razorpay</strong> — Payment processing. Your payment data is handled securely by Razorpay under their Privacy Policy.</li>
            <li><strong>Shipping Partners</strong> — Your name, address, and phone number are shared with our logistics/courier partners to fulfil delivery.</li>
            <li><strong>Firebase (Google)</strong> — Authentication services for account login.</li>
            <li><strong>WhatsApp / Meta</strong> — Order notifications and customer communications.</li>
          </ul>
          <p className="mt-3">
            We do <strong>not sell, rent, or trade</strong> your personal information to any third party for marketing purposes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-[var(--color-text)] mb-4 uppercase tracking-wider">
            Cookies
          </h2>
          <p className="mb-3">
            Our website uses cookies to enhance your browsing experience. Cookies are small files stored on
            your device that help us:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Remember your cart items and preferences</li>
            <li>Understand how visitors use our website (analytics)</li>
            <li>Show relevant promotions (via Meta Pixel / Facebook)</li>
          </ul>
          <p className="mt-3">
            You can disable cookies through your browser settings, but this may affect certain features of our website.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-[var(--color-text)] mb-4 uppercase tracking-wider">
            Data Security
          </h2>
          <p>
            We implement industry-standard security measures including SSL encryption (HTTPS) to protect your
            personal data. Access to your data within our organisation is restricted to authorised personnel only.
            Payment information is processed exclusively through Razorpay&apos;s PCI-DSS compliant gateway — we
            never store your card or UPI details.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-[var(--color-text)] mb-4 uppercase tracking-wider">
            Your Rights
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Request access to your personal data we hold</li>
            <li>Request correction or deletion of your personal data</li>
            <li>Opt out of marketing communications at any time</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-medium text-[var(--color-text)] mb-4 uppercase tracking-wider">
            Contact Us
          </h2>
          <p>
            For any privacy-related queries, please contact us at:
          </p>
          <ul className="mt-3 space-y-1">
            <li><strong>Email:</strong> hello@duti-heritage.com</li>
            <li><strong>Phone:</strong> +91 69010 80808</li>
            <li><strong>Address:</strong> 103, Block D, DLF Express Green M1, IMT Manesar, Gurugram, Haryana — 122052</li>
          </ul>
        </section>

      </div>
    </PolicyPageShell>
  );
}
