import React from "react";

export default function ReturnExchangePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-gray-800">
      <h1 className="text-3xl font-bold mb-8 uppercase tracking-widest text-center">Cancellation, Return & Refund Policy</h1>
      <div className="space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold mb-3 uppercase tracking-wider">Our Exchange Policy</h2>
          <p>At Duti Heritage, we take great pride in the quality of our products and ensure each item goes through a thorough quality check before dispatch. Please read our exchange policy carefully.</p>
        </section>

        <section>
          <h3 className="font-bold text-lg mb-2">No Returns Policy</h3>
          <p>We do not accept returns on any items sold. All sales are final. We request customers to carefully check the size chart and product details before placing an order.</p>
        </section>

        <section>
          <h3 className="font-bold text-lg mb-2">Exchange — Size Issues</h3>
          <p>If you have received a product with a size issue, you are eligible for a size exchange of the same product. You must notify us within 24 hours of delivery via WhatsApp or email with your order number and a photo of the item received.</p>
        </section>

        <section>
          <h3 className="font-bold text-lg mb-2">Exchange — Defective / Wrong Product</h3>
          <p>In the unlikely event that you receive a defective or incorrect product, please inform us within 24 hours of delivery. We will arrange an exchange at no additional cost to you. Please share a clear unboxing video/photo as proof when contacting us.</p>
        </section>

        <section>
          <h3 className="font-bold text-lg mb-2">Conditions for Exchange</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Item must be unused, unwashed, and in original condition with all tags intact.</li>
            <li>Exchange request must be raised within 24 hours of delivery.</li>
            <li>Items marked as "Final Sale" are not eligible for exchange.</li>
            <li>Exchange is subject to availability of the replacement product.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 uppercase tracking-wider mt-12">Order Cancellation & Refunds</h2>
          <p className="mb-4">Prepaid orders once placed are not eligible for cancellation. We begin processing orders immediately to ensure fast delivery.</p>
          <p>COD (Cash on Delivery) orders may be cancelled before dispatch by contacting us via WhatsApp or email.</p>
        </section>

        <section>
          <h3 className="font-bold text-lg mb-2">Refund Policy</h3>
          <p className="mb-4">As we have a strict No Returns policy, we do not offer refunds on any orders successfully delivered.</p>
          <p>In the rare event that a prepaid order cannot be fulfilled by us due to inventory issues, or if a COD order is cancelled prior to dispatch with an advance payment made, a full refund will be processed to your original payment method. The refund will reflect in your bank account within 5-7 business days.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 uppercase tracking-wider mt-12">How to Raise an Exchange Request</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>WhatsApp us at <strong>91-7017194982</strong> or email us at <strong>supportdutiheritage@gmail.com</strong></li>
            <li>Share your Order ID and photos/video of the item received</li>
            <li>Our team will review your request within 24-48 business hours</li>
            <li>Once approved, we will arrange pickup and send the replacement</li>
          </ul>
          <p className="mt-4">For any queries, contact us at <strong>supportdutiheritage@gmail.com</strong></p>
        </section>
      </div>
    </div>
  );
}
