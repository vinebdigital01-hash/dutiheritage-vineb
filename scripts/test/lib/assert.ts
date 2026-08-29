export class AssertError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssertError";
  }
}

export function expectStatus(
  actual: number,
  expected: number | number[],
  label: string,
  bodySnippet?: string
) {
  const allowed = Array.isArray(expected) ? expected : [expected];
  if (!allowed.includes(actual)) {
    const snippet = bodySnippet
      ? bodySnippet.slice(0, 280).replace(/\s+/g, " ")
      : "";
    throw new AssertError(
      `${label}: expected status ${allowed.join("|")}, got ${actual}` +
        (snippet ? ` — ${snippet}` : "")
    );
  }
}

export function expectOk(condition: unknown, message: string) {
  if (!condition) throw new AssertError(message);
}

export function expectField(
  obj: unknown,
  path: string,
  message?: string
): unknown {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") {
      throw new AssertError(message || `Missing field ${path}`);
    }
    cur = (cur as Record<string, unknown>)[p];
  }
  if (cur === undefined) {
    throw new AssertError(message || `Missing field ${path}`);
  }
  return cur;
}

export function expectEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new AssertError(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}
