import { loadTestEnv } from "./lib/env";
import { assertServerUp } from "./lib/http";
import { exitFromSummary, printSummary, resetResults } from "./lib/report";
import { runSmokeCases } from "./cases/smoke";

async function main() {
  loadTestEnv();
  resetResults();
  console.log("Duti Heritage — smoke tests");
  console.log(`Base URL: ${process.env.TEST_BASE_URL || "http://localhost:3000"}`);
  await assertServerUp();
  await runSmokeCases();
  exitFromSummary(printSummary("Smoke"));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
