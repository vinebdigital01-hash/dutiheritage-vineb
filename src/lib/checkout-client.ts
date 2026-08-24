"use client";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: { ondismiss?: () => void };
};

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);

    const existing = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout(input: {
  key: string;
  razorpayOrderId: string;
  amountPaise: number;
  name: string;
  email?: string;
  phone?: string;
  description?: string;
}): Promise<{
  orderId: string;
  paymentId: string;
  signature: string;
} | null> {
  const ready = await loadRazorpayScript();
  if (!ready || !window.Razorpay) {
    throw new Error("Could not load Razorpay. Check your network and try again.");
  }

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: input.key,
      amount: input.amountPaise,
      currency: "INR",
      name: "Duti Heritage",
      description: input.description || "Order payment",
      order_id: input.razorpayOrderId,
      prefill: {
        name: input.name,
        email: input.email,
        contact: input.phone,
      },
      theme: { color: "#111111" },
      handler: (response) => {
        resolve({
          orderId: response.razorpay_order_id,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
        });
      },
      modal: {
        ondismiss: () => resolve(null),
      },
    });

    try {
      rzp.open();
    } catch (error) {
      reject(error);
    }
  });
}

export async function authHeaders(): Promise<HeadersInit> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  try {
    const { auth } = await import("@/lib/firebase");
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    /* guest */
  }
  return headers;
}
