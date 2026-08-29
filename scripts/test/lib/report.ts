import { AssertError } from "./assert";

export type TestFn = () => void | Promise<void>;

type Result = {
  name: string;
  ok: boolean;
  skipped?: boolean;
  ms: number;
  error?: string;
};

const results: Result[] = [];

export function skip(reason: string): never {
  const err = new Error(reason);
  err.name = "SkipError";
  throw err;
}

export async function test(name: string, fn: TestFn) {
  const start = Date.now();
  try {
    await fn();
    const ms = Date.now() - start;
    results.push({ name, ok: true, ms });
    console.log(`  ✓ ${name} (${ms}ms)`);
  } catch (err) {
    const ms = Date.now() - start;
    if (err instanceof Error && err.name === "SkipError") {
      results.push({ name, ok: true, skipped: true, ms, error: err.message });
      console.log(`  ○ ${name} — skipped: ${err.message}`);
      return;
    }
    const message =
      err instanceof AssertError || err instanceof Error
        ? err.message
        : String(err);
    results.push({ name, ok: false, ms, error: message });
    console.log(`  ✗ ${name} (${ms}ms)`);
    console.log(`    ${message}`);
  }
}

export async function suite(title: string, fn: () => void | Promise<void>) {
  console.log(`\n▸ ${title}`);
  await fn();
}

export function printSummary(label = "Tests") {
  const passed = results.filter((r) => r.ok && !r.skipped).length;
  const skipped = results.filter((r) => r.skipped).length;
  const failed = results.filter((r) => !r.ok).length;
  const total = results.length;
  console.log("\n" + "─".repeat(50));
  console.log(
    `${label}: ${passed} passed, ${failed} failed, ${skipped} skipped (${total} total)`
  );
  if (failed) {
    console.log("\nFailures:");
    for (const r of results.filter((x) => !x.ok)) {
      console.log(`  • ${r.name}`);
      console.log(`    ${r.error}`);
    }
  }
  return failed === 0;
}

export function resetResults() {
  results.length = 0;
}

export function exitFromSummary(ok: boolean) {
  process.exit(ok ? 0 : 1);
}
