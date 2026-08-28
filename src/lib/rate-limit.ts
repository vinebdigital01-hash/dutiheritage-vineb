import { logSystemEvent } from "./logger";
﻿import { NextResponse } from "next/server";

type RateLimitConfig = {
  limit: number;
  windowMs: number;
};

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 300000);

export function applyRateLimit(req: any, config: RateLimitConfig, identifier: string = "") {
  const ip = req.headers?.get("x-forwarded-for") || req.ip || "unknown-ip";
  let pathname = "";
  try {
    pathname = new URL(req.url).pathname;
  } catch (e) {
    pathname = req.url || "unknown-path";
  }
  
  const key = `${pathname}_${ip}_${identifier}`;
  const now = Date.now();

  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + config.windowMs });
    return null; // Allowed
  }

  if (record.count >= config.limit) {
    
    logSystemEvent({
      level: "warning",
      source: "rate_limiter",
      message: `Rate limit exceeded: ${config.limit} requests per ${config.windowMs}ms`,
      path: pathname,
      ip: ip,
    }).catch(() => {});
    return NextResponse.json({ error: "Too many requests, please try again later." }, { status: 429 });
  }

  record.count += 1;
  return null; // Allowed
}
