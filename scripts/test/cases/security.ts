import { apiGet, apiPost } from "../lib/http";
import { expectOk, expectStatus } from "../lib/assert";
import { suite, test, skip } from "../lib/report";
import { getCustomerToken, getAdminToken } from "../lib/auth";
import { loadTestEnv } from "../lib/env";
import { ctx } from "../lib/context";

export async function runSecurityCases() {
  await suite("Security / auth guards", async () => {
    await test("Admin products list without token → 401", async () => {
      const res = await apiGet("/api/products?all=1");
      expectStatus(res.status, 401, "GET /api/products?all=1 no auth", res.text);
    });

    await test("Admin customers without token → 401", async () => {
      const res = await apiGet("/api/customers");
      expectStatus(res.status, 401, "GET /api/customers no auth", res.text);
    });

    await test("Admin analytics without token → 401", async () => {
      const res = await apiGet("/api/analytics");
      expectStatus(res.status, 401, "GET /api/analytics no auth", res.text);
    });

    await test("Orders list without token → 401", async () => {
      const res = await apiGet("/api/orders");
      expectStatus(res.status, 401, "GET /api/orders no auth", res.text);
    });

    await test("Cron abandoned-carts wrong secret → 401", async () => {
      const res = await apiGet("/api/cron/abandoned-carts", {
        token: "definitely-wrong-secret",
      });
      expectStatus(res.status, 401, "cron bad secret", res.text);
    });

    await test("Cron abandoned-carts no auth → 401", async () => {
      const res = await apiGet("/api/cron/abandoned-carts");
      expectStatus(res.status, 401, "cron no auth", res.text);
    });

    await test("Cron abandoned-carts with CRON_SECRET → 200", async () => {
      loadTestEnv();
      const secret = process.env.CRON_SECRET;
      if (!secret) skip("CRON_SECRET not set");
      const res = await apiGet("/api/cron/abandoned-carts", { token: secret });
      expectStatus(res.status, 200, "cron valid secret", res.text);
    });

    await test("Non-admin token on admin route → 403", async () => {
      const customer = await getCustomerToken();
      if (!customer) skip("TEST_CUSTOMER_EMAIL/PASSWORD not set");
      // Ensure this email is not also an admin
      const adminCheck = await apiGet<{ isAdmin?: boolean }>("/api/admin/check", {
        token: customer!.idToken,
      });
      expectStatus(adminCheck.status, 200, "admin check as customer", adminCheck.text);
      if (adminCheck.data.isAdmin) {
        skip("TEST_CUSTOMER_EMAIL is listed in ADMIN_EMAILS");
      }
      const res = await apiGet("/api/customers", { token: customer!.idToken });
      expectStatus(res.status, 403, "customer on admin API", res.text);
    });

    await test("Admin check with admin token → isAdmin true", async () => {
      const admin = await getAdminToken();
      if (!admin) skip("TEST_ADMIN_EMAIL/PASSWORD not set");
      ctx.adminToken = admin!.idToken;
      const res = await apiGet<{ isAdmin?: boolean; email?: string }>(
        "/api/admin/check",
        { token: admin!.idToken }
      );
      expectStatus(res.status, 200, "GET /api/admin/check", res.text);
      expectOk(res.data.isAdmin === true, `expected isAdmin true, got ${JSON.stringify(res.data)}`);
    });
  });
}
