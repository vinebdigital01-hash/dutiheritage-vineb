import { apiGet } from "../lib/http";
import { expectOk, expectStatus } from "../lib/assert";
import { suite, test } from "../lib/report";

export async function runSmokeCases() {
  await suite("Smoke — health & env readiness", async () => {
    await test("GET /api/health → ok mongodb connected", async () => {
      const res = await apiGet<{
        ok?: boolean;
        mongodb?: string;
        adminEmailsConfigured?: boolean;
        firebaseAdminConfigured?: boolean;
        error?: string;
      }>("/api/health");
      expectStatus(res.status, 200, "GET /api/health", res.text);
      expectOk(
        res.data.ok === true,
        `health.ok expected true, got ${JSON.stringify(res.data)}`
      );
      expectOk(
        res.data.mongodb === "connected",
        `mongodb expected connected, got ${JSON.stringify(res.data.mongodb)}`
      );
      expectOk(
        res.data.adminEmailsConfigured === true,
        "ADMIN_EMAILS should be configured"
      );
      expectOk(
        res.data.firebaseAdminConfigured === true,
        "Firebase Admin should be configured"
      );
    });
  });
}
