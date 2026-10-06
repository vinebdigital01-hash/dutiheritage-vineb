import { applyRateLimit } from "@/lib/rate-limit";
import { handleApiError, jsonOk, ApiError } from "@/lib/api";

/**
 * POST /api/newsletter/subscribe
 * Proxies to Web3forms using a server-only access key (never expose to the browser).
 */
export async function POST(request: Request) {
  const limited = applyRateLimit(request, { limit: 6, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const body = await request.json();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const source = String(body.source || "footer").trim().slice(0, 40);

    if (!email || !email.includes("@")) {
      throw new ApiError("Enter a valid email address.", 400);
    }

    const accessKey = process.env.WEB3FORMS_ACCESS_KEY?.trim();
    if (!accessKey) {
      return jsonOk({
        ok: true,
        queued: false,
        message:
          "Thanks — newsletter signup is being set up. We’ve noted your interest.",
      });
    }

    const form = new FormData();
    form.append("access_key", accessKey);
    form.append("email", email);
    form.append("name", source === "promo" ? "Promo Banner Subscriber" : "Newsletter Subscriber");
    form.append("subject", `Newsletter signup (${source})`);
    form.append("from_name", "Duti Heritage Storefront");

    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      body: form,
    });
    const data = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      message?: string;
    };

    if (!res.ok || !data.success) {
      throw new ApiError(data.message || "Could not subscribe. Try again.", 502);
    }

    return jsonOk({
      ok: true,
      queued: true,
      message: "Thanks for subscribing!",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
