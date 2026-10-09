import { Metadata } from "next";
import { PolicyPageShell } from "@/components/PolicyPageShell";
import { getPageContent } from "@/lib/site-content-server";

export const metadata: Metadata = {
  title: "Cancellation, Return & Refund | Duti Heritage",
  description:
    "No returns on sold items. Size and defective exchanges within 24 hours of delivery. How to cancel prepaid or COD orders.",
};

export default async function ReturnExchangePage() {
  const live = await getPageContent("return-exchange");

  return (
    <PolicyPageShell
      title={live?.title || "Cancellation, Return & Refund"}
      content={live?.content}
    >
      <div className="space-y-10 text-[var(--color-text-muted)] leading-relaxed">
        <section>
          <h2 className="text-xl font-medium text-[var(--color-text)] mb-6 uppercase tracking-wider">
            Returns &amp; exchanges
          </h2>
          <div className="space-y-5">
            <p>
              At Duti Heritage, we take great pride in the quality of our products and ensure each item
              goes through a thorough quality check before dispatch. Please read our exchange policy carefully.
            </p>

            <div className="border-l-4 border-[var(--color-text)] pl-4 space-y-2">
              <p className="font-medium text-[var(--color-text)]">No Returns Policy</p>
              <p>
                We do <strong>not accept returns</strong> on any items sold. All sales are final. We
                request customers to carefully check the size chart and product details before placing an order.
              </p>
            </div>

            <div className="border-l-4 border-[var(--color-text)] pl-4 space-y-2">
              <p className="font-medium text-[var(--color-text)]">Exchange — Size Issues</p>
              <p>
                If you have received a product with a size issue, you are eligible for a size exchange
                of the <strong>same product</strong>. You must notify us within <strong>24 hours</strong> of
                delivery via WhatsApp or email with your order number and a photo of the item received.
              </p>
            </div>

            <div className="border-l-4 border-[var(--color-text)] pl-4 space-y-2">
              <p className="font-medium text-[var(--color-text)]">Exchange — Defective / Wrong Product</p>
              <p>
                In the unlikely event that you receive a <strong>defective or incorrect product</strong>, please
                inform us within <strong>24 hours</strong> of delivery. We will arrange an exchange at no
                additional cost to you. Please share a clear unboxing video/photo as proof when contacting us.
              </p>
            </div>

            <div className="border-l-4 border-[var(--color-text)] pl-4 space-y-2">
              <p className="font-medium text-[var(--color-text)]">Conditions for Exchange</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Item must be unused, unwashed, and in original condition with all tags intact.</li>
                <li>Exchange request must be raised within 24 hours of delivery.</li>
                <li>Items marked as &quot;Final Sale&quot; are not eligible for exchange.</li>
                <li>Exchange is subject to availability of the replacement product.</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-medium text-[var(--color-text)] mb-4 uppercase tracking-wider">
            Order cancellation
          </h2>
          <div className="space-y-3">
            <p>
              <strong>Prepaid orders:</strong> you may request cancellation from your account or by
              contacting us before the order is packed/dispatched. If we approve, any eligible refund
              is processed to the original payment method via Razorpay (bank timelines apply).
              Requests after dispatch may be declined.
            </p>
            <p>
              <strong>COD (Cash on Delivery) orders:</strong> you may cancel before dispatch via your
              account, WhatsApp, or email. There is no bank refund for COD — the order is simply not
              collected.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-medium text-[var(--color-text)] mb-4 uppercase tracking-wider">
            How to Raise an Exchange Request
          </h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>WhatsApp us at <strong>91-7017194982</strong> or email us at <strong>supportdutiheritage@gmail.com</strong></li>
            <li>Share your Order ID and photos/video of the item received</li>
            <li>Our team will review your request within 24-48 business hours</li>
            <li>Once approved, we will arrange pickup and send the replacement</li>
          </ol>
          <p className="mt-4 text-sm">
            For any queries, contact us at{" "}
            <a href="mailto:supportdutiheritage@gmail.com" className="underline">supportdutiheritage@gmail.com</a>
          </p>
        </section>
      </div>
    </PolicyPageShell>
  );
}
