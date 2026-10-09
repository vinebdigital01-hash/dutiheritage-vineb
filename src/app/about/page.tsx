import React from "react";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-gray-800">
      <h1 className="text-3xl font-bold mb-8 uppercase tracking-widest text-center">About Us</h1>
      <div className="space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold mb-3 uppercase tracking-wider">Our Story</h2>
          <p>Welcome to Duti Heritage, where timeless elegance meets modern sophistication. Rooted in the rich cultural tapestry of India, we bring you meticulously crafted collections that celebrate the beauty of traditional craftsmanship through a contemporary lens.</p>
          <p className="mt-4">Duti Heritage was born out of a profound passion for high-quality fabrics, intricate designs, and the desire to provide our customers with garments that not only look stunning but feel luxurious. From our Premium Night Wear to our Exquisite Velvet Collections, every piece is a testament to our dedication to excellence.</p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3 uppercase tracking-wider">Our Vision</h2>
          <p>Our vision is to empower individuals to express their unique style and grace. We believe that fashion is more than just clothing; it is an extension of one\'s personality and heritage. We strive to be the ultimate destination for those who seek elegance, comfort, and authenticity in their wardrobe.</p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3 uppercase tracking-wider">Quality & Craftsmanship</h2>
          <p>At Duti Heritage, quality is our cornerstone. We source the finest materials and collaborate with skilled artisans to ensure that every stitch and pattern meets our rigorous standards. Whether it is our unstitched suits, ready-to-wear dresses, or popular ethnic picks, we guarantee a product that stands the test of time.</p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3 uppercase tracking-wider">Join Our Journey</h2>
          <p>We are more than just a brand; we are a community of fashion enthusiasts who appreciate the finer things in life. We invite you to explore our collections and become a part of the Duti Heritage family.</p>
          <p className="mt-4 font-medium italic">Thank you for choosing us to be a part of your style journey.</p>
        </section>
      </div>
    </div>
  );
}
