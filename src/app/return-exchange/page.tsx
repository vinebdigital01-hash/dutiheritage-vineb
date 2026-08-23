import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Return and Exchange Policy | Duti Heritage',
  description: 'Return and Exchange Policy for Duti Heritage',
};

export default function ReturnExchangePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-12 uppercase tracking-widest text-center">Return And Exchange Policy</h1>
      
      <div className="space-y-10 text-[var(--color-text-muted)] leading-relaxed">
        <section>
          <h2 className="text-xl font-medium text-[var(--color-text)] mb-6 uppercase tracking-wider">Exchange and Cancellation Policy</h2>
          
          <div className="space-y-4">
            <p>
              <strong>Size Exchange:</strong> If the customer has any size issue with the product delivered then he/she needs to inform us within 24 Hours from the date of delivery. Please Note: In case of exchange customer is requested to send back with customer name and mobile on it. Exchange are allowed on size issues only. Exchange will not be issued on product exchange. The exchange charges are to be borne by customer that is 150.
            </p>
            
            <p>
              <strong>Return:</strong> We humbly don&apos;t take returns on items sold once.
            </p>
            
            <p>
              <strong>Damaged/Wrong Delivery:</strong> If it&apos;s a damaged/defective product, incorrect item sent, such cases are to be informed us within 24 hours of delivery. we will replace the product with the next fastest possible courier facility.
            </p>
            
            <p>
              Only products which are unused, unworn, unwashed, undamaged, with all its labels and tags completely intact, in original packaging and eligible for exchange.
            </p>
            
            <p className="font-medium text-[var(--color-text)] border-l-2 border-[var(--color-text)] pl-4 py-1 mt-6">
              Opening Video of the parcel for the first time is mandatory in both the scenarios otherwise we will not be able to proceed with the exchange.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-medium text-[var(--color-text)] mb-4 uppercase tracking-wider">Can I cancel my order?</h2>
          <div className="space-y-4">
            <p>Prepaid orders are not eligible for cancellation.</p>
            <p>You can cancel your Cash on Delivery order within 24 hours of order. Please call or ping us on 6901080808 to request a cancellation.</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-medium text-[var(--color-text)] mb-4 uppercase tracking-wider">Why my exchange is not accepted?</h2>
          <p className="mb-4">
            We endeavour to ensure that every transaction at our website is seamless. We take great care in delivering our products and adhere to the highest quality standards.
          </p>
          <ul className="list-disc pl-5 space-y-3">
            <li>Exchange/Return not accepted if Customer does not like the material or colour of the dress, we suggest that the customer should read the product description & have a look at all the pictures before ordering.</li>
            <li>Our products are made and handled by human hands involving various processes. There is bound to be variations in colour, finish and overall look. The colours you see on our website will depend on the accuracy of your monitor for which subtle variations must be acknowledged.</li>
            <li>10-12% Colour difference depends on the screen resolution of the device used by the client and camera lights, please don&apos;t expect an exchange or return for the same.</li>
            <li>We have made every effort to display the colours of our products that appear on dutiheritage.co.in as accurately as possible. However, as computer monitors, tablets and mobile devices vary, we cannot guarantee that your monitor&apos;s display of a colour will be completely accurate.</li>
            <li>Exchange/Return not accepted if the product is washed and worn.</li>
            <li>Purchase made from SALE section are not eligible for any kind of return or exchange. All the sale, discounted, brought with a coupon and gift voucher purchases are non returnable, non refundable & non exchangeable.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
