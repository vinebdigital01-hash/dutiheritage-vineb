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
          <h2 className="text-xl font-medium text-[var(--color-text)] mb-4 uppercase tracking-wider">
            We protect your privacy
          </h2>
          <p>
            Our privacy policy is simple: any information you give us stays with
            us. We do not rent, sell, lend, or otherwise distribute your personal
            information to anyone for any reason. This includes your contact
            information, as well as specific order information.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-medium text-[var(--color-text)] mb-4 uppercase tracking-wider">
            We limit data access to those who need to know.
          </h2>
          <p>
            Within our organization, your personal data is accessible to only a
            limited number of employees with special access privileges.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-medium text-[var(--color-text)] mb-4 uppercase tracking-wider">
            Information Collected
          </h2>
          <p>
            To enable you to place an order on our site, we need basic contact
            and shipping information. We do not allow unauthorized use of any
            information collected from you.
          </p>
        </section>
      </div>
    </PolicyPageShell>
  );
}
