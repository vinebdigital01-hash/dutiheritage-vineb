import React from "react";

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-gray-800">
      <h1 className="text-3xl font-bold mb-8 uppercase tracking-widest text-center">Privacy Policy</h1>
      <div className="space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold mb-3 uppercase tracking-wider">We protect your privacy</h2>
          <p>Our privacy policy is simple: any information you give us stays with us. We do not rent, sell, lend, or otherwise distribute your personal information to anyone for any reason. This includes your contact information, as well as specific order information.</p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3 uppercase tracking-wider">We limit data access to those who need to know</h2>
          <p>Within our organization, your personal data is accessible to only a limited number of employees with special access privileges.</p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3 uppercase tracking-wider">Information Collected</h2>
          <p>To enable you to place an order on our site, we need basic contact and shipping information. We do not allow unauthorized use of any information collected from you.</p>
        </section>
      </div>
    </div>
  );
}
