import { logSystemEvent } from "./logger";
import { NextResponse } from "next/server";

type RateLimitConfig = {
  limit: number;
  windowMs: number;
};

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function pruneExpired(now: number) {
  if (rateLimitMap.size < 500) return;
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) rateLimitMap.delete(key);
  }
}

export function applyRateLimit(req: Request, config: RateLimitConfig, identifier: string = "") {
  const ip = req.headers?.get("x-forwarded-for") || "unknown-ip";
  let pathname = "";
  try {
    pathname = new URL(req.url).pathname;
  } catch {
    pathname = req.url || "unknown-path";
  }

  const key = `${pathname}_${ip}_${identifier}`;
  const now = Date.now();
  pruneExpired(now);

  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + config.windowMs });
    return null;
  }

  if (record.count >= config.limit) {
    logSystemEvent({
      level: "warning",
      source: "rate_limiter",
      message: `Rate limit exceeded: ${config.limit} requests per ${config.windowMs}ms`,
      path: pathname,
      ip: ip,
    }).catch(() => {});
    return NextResponse.json(
      { error: "Too many requests, please try again later." },
      { status: 429 }
    );
  }

  record.count += 1;
  return null;
}
