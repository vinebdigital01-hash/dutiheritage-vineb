/** India Standard Time (UTC+05:30) — store “today” and coupon midnight in IST. */

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

export function istCalendarParts(at: Date = new Date()): {
  y: number;
  m: number;
  d: number;
} {
  const shifted = new Date(at.getTime() + IST_OFFSET_MS);
  return {
    y: shifted.getUTCFullYear(),
    m: shifted.getUTCMonth(),
    d: shifted.getUTCDate(),
  };
}

/** 00:00:00.000 IST on the IST calendar day of `at`. */
export function startOfIstDay(at: Date = new Date()): Date {
  const { y, m, d } = istCalendarParts(at);
  return new Date(Date.UTC(y, m, d) - IST_OFFSET_MS);
}

export function startOfIstDayDaysAgo(days: number, at: Date = new Date()): Date {
  const start = startOfIstDay(at);
  start.setUTCDate(start.getUTCDate() - Math.max(0, days - 1));
  return start;
}

/**
 * End of the given IST calendar date (23:59:59.999 IST).
 * Accepts YYYY-MM-DD or a Date/ISO string.
 */
export function endOfIstCalendarDay(value: string | Date | null | undefined): Date | undefined {
  if (value == null || value === "") return undefined;
  const s = typeof value === "string" ? value.trim() : "";
  const ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  let y: number;
  let m: number;
  let d: number;
  if (ymd) {
    y = Number(ymd[1]);
    m = Number(ymd[2]) - 1;
    d = Number(ymd[3]);
  } else {
    const dt = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(dt.getTime())) return undefined;
    const parts = istCalendarParts(dt);
    y = parts.y;
    m = parts.m;
    d = parts.d;
  }
  return new Date(Date.UTC(y, m, d, 18, 29, 59, 999));
}

export function istYmd(value: string | Date | null | undefined): string {
  if (!value) return "";
  const dt = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(dt.getTime())) return "";
  const { y, m, d } = istCalendarParts(dt);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}
