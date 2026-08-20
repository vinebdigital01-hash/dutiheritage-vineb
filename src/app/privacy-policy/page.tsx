import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Duti Heritage',
  description: 'Privacy Policy of Duti Heritage',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-12 uppercase tracking-widest text-center">Privacy Policy</h1>
      
      <div className="space-y-8 text-[var(--color-text-muted)] leading-relaxed">
        <section>
          <h2 className="text-xl font-medium text-[var(--color-text)] mb-4 uppercase tracking-wider">We protect your privacy</h2>
          <p>
            Our privacy policy is simple: any information you give us stays with us. We do not rent, sell, lend, or otherwise distribute your personal information to anyone for any reason. This includes your contact information, as well as specific order information.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-[var(--color-text)] mb-4 uppercase tracking-wider">We limit data access to those who need to know.</h2>
          <p>
            Within our organization, your personal data is accessible to only a limited number of employees with special access privileges. Although we may, from time to time, compile general demographic information based on your order, this information is shared within our organization only and has no identifiable personal data associated with it.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium text-[var(--color-text)] mb-4 uppercase tracking-wider">Information Collected</h2>
          <p>
            To enable you to place an order on our site, we need to have the following basic information about you: Your First Name, Your Last Name, and Your Address, City, Zip code, State, Country, Phone Number and Contact E-mail address.
          </p>
          <p className="mt-4">
            We do not allow any unauthorized person or organization be it other members, visitors, and anyone not in our organization to use any information collected from you.
          </p>
        </section>
      </div>
    </div>
  );
}
