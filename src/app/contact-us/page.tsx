import React from "react";

export default function ContactUsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-gray-800">
      <h1 className="text-3xl font-bold mb-8 uppercase tracking-widest text-center">Contact Us</h1>
      <div className="space-y-8 text-sm leading-relaxed text-center">
        <p className="max-w-2xl mx-auto text-base">We are here to help! If you have any questions, concerns, or need assistance with your order, please feel free to reach out to us using the contact details below. Our support team will get back to you as soon as possible.</p>
        
        <div className="mt-12 p-8 bg-gray-50 rounded-xl inline-block text-left shadow-sm">
          <h2 className="text-xl font-semibold mb-6 uppercase tracking-wider">Customer Support</h2>
          <div className="space-y-4">
            <p>Email: <a href="mailto:supportdutiheritage@gmail.com" className="font-bold hover:underline">supportdutiheritage@gmail.com</a></p>
            <p>Phone / WhatsApp: <a href="https://wa.me/917017194982" target="_blank" rel="noopener noreferrer" className="font-bold hover:underline">+91 7017194982</a></p>
            <p className="text-gray-500 italic mt-4">Our support hours are Monday to Saturday, 10:00 AM to 6:00 PM (IST).</p>
          </div>

          <h2 className="text-xl font-semibold mt-10 mb-4 uppercase tracking-wider">Registered Office</h2>
          <address className="not-italic text-gray-700 leading-relaxed">
            Duti Heritage (Proprietorship Sonia Rajput)<br/>
            103, Block D, DLF Express Green M1,<br/>
            IMT Manesar, Gurugram,<br/>
            Haryana - 122052, India
          </address>
        </div>
      </div>
    </div>
  );
}
