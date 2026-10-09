import React from "react";

export default function ShippingPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-gray-800">
      <h1 className="text-3xl font-bold mb-8 uppercase tracking-widest text-center">Delivery & Shipping Policy</h1>
      <div className="space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold mb-3 uppercase tracking-wider">Dispatch & Delivery Time</h2>
          <p className="mb-3">We normally dispatch all orders within 48–72 hours of receiving the order.</p>
          <p className="mb-3">Depending on your location, delivery takes approximately 3 to 7 working days after dispatch.</p>
          <p>Shipping timelines are approximate and may vary due to public holidays, natural events, or courier delays. We recommend placing your order early if you have a specific deadline.</p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3 uppercase tracking-wider">Shipping Charges</h2>
          <p className="mb-3">Free Shipping is available on prepaid orders above a minimum order value (as displayed at checkout).</p>
          <p className="mb-3">A nominal shipping fee may apply to orders below the free shipping threshold, which will be clearly shown at checkout before payment.</p>
          <p>COD (Cash on Delivery) orders may have an additional handling charge, which will be shown at checkout.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 uppercase tracking-wider">Delivery Coverage</h2>
          <p>We deliver Pan India — to all states and union territories across India. International shipping is currently not available.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 uppercase tracking-wider">Cash on Delivery (COD)</h2>
          <p className="mb-3">COD is available on eligible orders. Some products may require a partial advance payment at the time of order, with the remaining balance paid at delivery.</p>
          <p>COD availability is subject to your delivery pincode and order value. You will be informed at checkout if COD is available for your order.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 uppercase tracking-wider">Order Tracking</h2>
          <p>Once your order is dispatched, you will receive a tracking number via SMS/WhatsApp/email. You can use this to track your shipment on the courier partner\'s website.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 uppercase tracking-wider">Contact Us</h2>
          <p>For shipping queries, reach out to us at:</p>
          <p className="mt-2">Email: <strong>supportdutiheritage@gmail.com</strong></p>
          <p>Phone: <strong>91-7017194982</strong></p>
        </section>
      </div>
    </div>
  );
}
