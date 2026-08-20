import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Delivery & Shipping Policy | Duti Heritage',
  description: 'Delivery and Shipping Policy for Duti Heritage',
};

export default function ShippingPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-12 uppercase tracking-widest text-center">Delivery & Shipping Policy</h1>
      
      <div className="space-y-6 text-[var(--color-text-muted)] leading-relaxed text-center max-w-2xl mx-auto">
        <p>
          We normally dispatch all our orders within <strong className="text-[var(--color-text)] font-medium">48-72 hours</strong> of receiving the order.
        </p>
        
        <p>
          Depending on the geographic location of the customer it may take about <strong className="text-[var(--color-text)] font-medium">3 to 7 working days</strong> to deliver the product to the customer door.
        </p>
        
        <p>
          The shipping time mentioned anywhere on the website are approximate and we cannot guarantee them. Customers are recommended to place an order early on if they have a deadline to meet.
        </p>
      </div>
    </div>
  );
}
