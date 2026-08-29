import { loadTestEnv } from "./lib/env";
import { assertServerUp } from "./lib/http";
import { exitFromSummary, printSummary, resetResults } from "./lib/report";
import { runSmokeCases } from "./cases/smoke";
import { runCatalogCases } from "./cases/catalog";
import { runCheckoutCases } from "./cases/checkout";
import { runSecurityCases } from "./cases/security";
import { runCustomerCases } from "./cases/customer";
import { runAdminCases } from "./cases/admin";

async function main() {
  loadTestEnv();
  resetResults();
  console.log("Duti Heritage — API integration tests");
  console.log(`Base URL: ${process.env.TEST_BASE_URL || "http://localhost:3000"}`);
  await assertServerUp();

  // Order matters: catalog fills ctx → checkout uses product → customer/admin use order
  await runSmokeCases();
  await runCatalogCases();
  await runCheckoutCases();
  await runSecurityCases();
  await runCustomerCases();
  await runAdminCases();

  exitFromSummary(printSummary("API"));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
