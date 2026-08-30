const fs = require('fs');
let code = fs.readFileSync('src/components/PromoBanner/PromoBanner.tsx', 'utf8');

if (!code.includes('useState')) {
  code = code.replace(/import React from "react";/, 'import React, { useState } from "react";');
}

const handlerCode = `
  const [subscribeResult, setSubscribeResult] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubscribeSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubscribeResult("");
    
    const formData = new FormData(event.currentTarget);
    formData.append("name", "Promo Banner Subscriber"); 
    formData.append("access_key", "26f12f2a-a465-46c9-9355-892de2f8117d");

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setSubscribeResult("Thanks for joining the Heritage Club!");
        (event.target as HTMLFormElement).reset();
      } else {
        setSubscribeResult("Something went wrong. Try again.");
      }
    } catch (err) {
      setSubscribeResult("Connection error. Try again.");
    }
    setIsSubmitting(false);
  };
`;

if (!code.includes('onSubscribeSubmit')) {
  code = code.replace(/  return \(/, handlerCode + '\n  return (');
}

// update form
code = code.replace(/onSubmit=\{\(e\) => e.preventDefault\(\)\}/, 'onSubmit={onSubscribeSubmit}');

// add name="email" to input
code = code.replace(/type="email"\s+placeholder="Enter your email address"/, 'type="email"\n            name="email"\n            placeholder="Enter your email address"');

// update button
code = code.replace(
  /className="py-3 px-8 bg-\[var\(--color-accent\)\] text-\[var\(--color-bg\)\] text-sm uppercase tracking-\[1px\] transition-opacity duration-200 hover:opacity-80"/,
  'disabled={isSubmitting}\n            className="py-3 px-8 bg-[var(--color-accent)] text-[var(--color-bg)] text-sm uppercase tracking-[1px] transition-opacity duration-200 hover:opacity-80 disabled:opacity-50"'
);

code = code.replace(
  /\{buttonText\}/,
  '{isSubmitting ? "Subscribing..." : buttonText}'
);

const formEndRegex = /<\/form>/;
code = code.replace(formEndRegex, `</form>\n        {subscribeResult && <p className="text-sm mt-4 text-[var(--color-text)]">{subscribeResult}</p>}`);

fs.writeFileSync('src/components/PromoBanner/PromoBanner.tsx', code);
console.log("Updated PromoBanner");
