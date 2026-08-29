import { apiGet, apiPost } from "../lib/http";
import { expectOk, expectStatus } from "../lib/assert";
import { suite, test, skip } from "../lib/report";
import { getAdminToken, getCustomerToken } from "../lib/auth";
import { ctx } from "../lib/context";

export async function runCustomerCases() {
  await suite("Customer (authenticated)", async () => {
    await test("Resolve auth tokens", async () => {
      if (!ctx.adminToken) {
        const admin = await getAdminToken();
        if (!admin) skip("TEST_ADMIN_EMAIL/PASSWORD not set");
        ctx.adminToken = admin!.idToken;
      }
      const customer = await getCustomerToken();
      if (customer) ctx.customerToken = customer.idToken;
    });

    await test("POST /api/auth/sync", async () => {
      if (!ctx.adminToken) skip("no admin token");
      const res = await apiPost(
        "/api/auth/sync",
        { name: "Test Admin Sync" },
        { token: ctx.adminToken }
      );
      expectStatus(res.status, [200, 201], "POST /api/auth/sync", res.text);
    });

    await test("POST /api/cart/sync upsert", async () => {
      if (!ctx.adminToken) skip("no admin token");
      expectOk(ctx.productId, "need productId");
      const res = await apiPost(
        "/api/cart/sync",
        {
          items: [
            {
              productId: ctx.productId,
              quantity: 1,
              size: "M",
              name: "Test item",
              price: 999,
            },
          ],
        },
        { token: ctx.adminToken }
      );
      expectStatus(res.status, 200, "POST /api/cart/sync", res.text);
    });

    await test("GET /api/cart/sync fetch", async () => {
      if (!ctx.adminToken) skip("no admin token");
      const res = await apiGet("/api/cart/sync", { token: ctx.adminToken });
      expectStatus(res.status, 200, "GET /api/cart/sync", res.text);
    });

    await test("POST /api/track page_view event", async () => {
      const res = await apiPost("/api/track", {
        sessionId: `test-session-${Date.now()}`,
        path: "/",
        events: [{ event: "page_view", path: "/" }],
      });
      expectStatus(res.status, [200, 201], "POST /api/track", res.text);
    });

    await test("GET /api/orders as authenticated user", async () => {
      if (!ctx.adminToken) skip("no admin token");
      const res = await apiGet<{ orders?: unknown[]; count?: number }>(
        "/api/orders?limit=10",
        { token: ctx.adminToken }
      );
      expectStatus(res.status, 200, "GET /api/orders", res.text);
      expectOk(Array.isArray(res.data.orders), "orders should be array");
    });

    await test("GET /api/orders/[id] for COD order (admin)", async () => {
      if (!ctx.adminToken) skip("no admin token");
      const id = ctx.orderMongoId || ctx.orderId;
      if (!id) skip("no order from checkout suite");
      const res = await apiGet(`/api/orders/${id}`, { token: ctx.adminToken });
      expectStatus(res.status, 200, "GET /api/orders/[id]", res.text);
    });

    await test("GET /api/reviews/eligibility", async () => {
      if (!ctx.adminToken) skip("no admin token");
      expectOk(ctx.productId, "need productId");
      const res = await apiGet(
        `/api/reviews/eligibility?productId=${ctx.productId}`,
        { token: ctx.adminToken }
      );
      expectStatus(res.status, 200, "reviews eligibility", res.text);
      expectOk(
        "eligible" in (res.data as object) || "reason" in (res.data as object) || "canReview" in (res.data as object),
        `unexpected eligibility shape: ${res.text.slice(0, 200)}`
      );
    });
  });
}
