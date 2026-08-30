const fs = require('fs');
let code = fs.readFileSync('src/components/Footer/Footer.tsx', 'utf8');

// 1. Add useState import if not present
if (!code.includes('useState')) {
  code = code.replace(/import React from "react";/, 'import React, { useState } from "react";');
}

// 2. Insert the state and onSubmit handler
const handlerCode = `
  const [subscribeResult, setSubscribeResult] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubscribeSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubscribeResult("");
    
    const formData = new FormData(event.currentTarget);
    // Add default name since we only have email field in this specific UI, but web3forms requires 'name' if you want a complete contact form, though we can just send email.
    formData.append("name", "Newsletter Subscriber"); 
    formData.append("access_key", "26f12f2a-a465-46c9-9355-892de2f8117d");

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setSubscribeResult("Thanks for subscribing!");
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
  // Inject before return (
  code = code.replace(/  return \(/, handlerCode + '\n  return (');
}

// 3. Update the form
code = code.replace(/onSubmit=\{\(e\) => e.preventDefault\(\)\}/, 'onSubmit={onSubscribeSubmit}');

// 4. Update the input to have name="email"
code = code.replace(/type="email"\s+placeholder="Enter your email"/, 'type="email"\n                name="email"\n                placeholder="Enter your email"');

// 5. Add the result message below the form
const formEndRegex = /<\/form>/;
code = code.replace(formEndRegex, `</form>\n            {subscribeResult && <p className="text-xs mt-2 text-green-600">{subscribeResult}</p>}`);

fs.writeFileSync('src/components/Footer/Footer.tsx', code);
console.log("Updated Footer with Web3Forms");
