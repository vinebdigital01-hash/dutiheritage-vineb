/**
 * Fire-and-forget text via the Express WhatsApp bot.
 * Never throws — failures are logged so order/admin flows stay up.
 */
export async function notifyBot(input: {
  phone: string;
  message: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const phone = String(input.phone || "").replace(/\D/g, "");
  const message = String(input.message || "").trim();
  if (!phone || !message) {
    return { sent: false, reason: "missing phone or message" };
  }

  const base = (process.env.BOT_SERVER_URL || "").replace(/\/$/, "");
  if (!base) {
    return { sent: false, reason: "BOT_SERVER_URL not set" };
  }

  const key = process.env.BOT_API_KEY || "";
  try {
    const res = await fetch(`${base}/api/notify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(key ? { "x-bot-api-key": key } : {}),
      },
      body: JSON.stringify({ phone, message }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.error("[bot-notify]", res.status, err.slice(0, 200));
      return { sent: false, reason: `bot ${res.status}` };
    }
    return { sent: true };
  } catch (e) {
    console.error("[bot-notify]", e instanceof Error ? e.message : e);
    return { sent: false, reason: "network" };
  }
}
