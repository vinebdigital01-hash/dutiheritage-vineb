import { apiDelete, apiGet, apiPost, apiPut } from "../lib/http";
import { expectField, expectOk, expectStatus } from "../lib/assert";
import { suite, test, skip } from "../lib/report";
import { getAdminToken } from "../lib/auth";
import { ctx } from "../lib/context";

export async function runAdminCases() {
  await suite("Admin CRUD", async () => {
    await test("Ensure admin token", async () => {
      if (!ctx.adminToken) {
        const admin = await getAdminToken();
        if (!admin) skip("TEST_ADMIN_EMAIL/PASSWORD not set");
        ctx.adminToken = admin!.idToken;
      }
    });

    const stamp = Date.now();

    await test("POST /api/collections create disposable", async () => {
      if (!ctx.adminToken) skip("no admin token");
      const res = await apiPost<{ collection?: { id?: string; slug?: string } }>(
        "/api/collections",
        {
          name: `Test Collection ${stamp}`,
          slug: `test-collection-${stamp}`,
        },
        { token: ctx.adminToken }
      );
      expectStatus(res.status, 201, "POST /api/collections", res.text);
      const id = expectField(res.data, "collection.id") as string;
      ctx.createdCollectionId = id;
    });

    await test("POST /api/products create disposable", async () => {
      if (!ctx.adminToken) skip("no admin token");
      const collectionId = ctx.createdCollectionId || ctx.collectionId;
      expectOk(collectionId, "need a collectionId");
      const res = await apiPost<{ product?: { id?: string; slug?: string } }>(
        "/api/products",
        {
          name: `Test Product ${stamp}`,
          slug: `test-product-${stamp}`,
          price: 1499,
          salePrice: 1299,
          description: "Disposable product for API tests",
          collectionId,
          image: "https://placehold.co/600x800/png",
          sizes: ["S", "M", "L"],
          colors: ["Black"],
          isActive: true,
          codAvailable: true,
        },
        { token: ctx.adminToken }
      );
      expectStatus(res.status, 201, "POST /api/products", res.text);
      ctx.createdProductId = expectField(res.data, "product.id") as string;
    });

    await test("GET /api/products/[id] created product", async () => {
      if (!ctx.adminToken) skip("no admin token");
      expectOk(ctx.createdProductId, "need createdProductId");
      const res = await apiGet(`/api/products/${ctx.createdProductId}`, {
        token: ctx.adminToken,
      });
      expectStatus(res.status, 200, "GET created product", res.text);
    });

    await test("PUT /api/products/[id] patch price", async () => {
      if (!ctx.adminToken) skip("no admin token");
      expectOk(ctx.createdProductId, "need createdProductId");
      const res = await apiPut(
        `/api/products/${ctx.createdProductId}`,
        { price: 1599, description: "Updated by API test" },
        { token: ctx.adminToken }
      );
      expectStatus(res.status, 200, "PUT product", res.text);
    });

    await test("GET /api/products?all=1 includes created", async () => {
      if (!ctx.adminToken) skip("no admin token");
      const res = await apiGet<{ products?: { id: string }[] }>(
        "/api/products?all=1",
        { token: ctx.adminToken }
      );
      expectStatus(res.status, 200, "GET products all", res.text);
      expectOk(
        (res.data.products || []).some((p) => p.id === ctx.createdProductId),
        "created product not in admin list"
      );
    });

    await test("POST /api/coupons create disposable", async () => {
      if (!ctx.adminToken) skip("no admin token");
      const code = `TEST${stamp.toString().slice(-6)}`;
      const res = await apiPost<{ coupon?: { id?: string; code?: string } }>(
        "/api/coupons",
        {
          code,
          discountType: "PERCENT",
          discountValue: 5,
          minOrderAmount: 0,
          active: true,
        },
        { token: ctx.adminToken }
      );
      expectStatus(res.status, 201, "POST /api/coupons", res.text);
      ctx.createdCouponId = expectField(res.data, "coupon.id") as string;
      ctx.createdCouponCode = expectField(res.data, "coupon.code") as string;
    });

    await test("POST /api/coupons/validate created coupon", async () => {
      if (!ctx.createdCouponCode) skip("no created coupon (admin auth skipped)");
      const res = await apiPost<{ valid?: boolean }>("/api/coupons/validate", {
        code: ctx.createdCouponCode,
        subtotal: 1000,
      });
      expectStatus(res.status, 200, "validate created coupon", res.text);
      expectOk(res.data.valid === true, "created coupon should validate");
    });

    await test("PUT /api/coupons/[id] deactivate", async () => {
      if (!ctx.adminToken) skip("no admin token");
      expectOk(ctx.createdCouponId, "need createdCouponId");
      const res = await apiPut(
        `/api/coupons/${ctx.createdCouponId}`,
        { active: false },
        { token: ctx.adminToken }
      );
      expectStatus(res.status, 200, "PUT coupon", res.text);
    });

    await test("GET /api/orders admin list", async () => {
      if (!ctx.adminToken) skip("no admin token");
      const res = await apiGet("/api/orders?limit=20", {
        token: ctx.adminToken,
      });
      expectStatus(res.status, 200, "GET /api/orders admin", res.text);
    });

    await test("PUT /api/orders/[id] status update", async () => {
      if (!ctx.adminToken) skip("no admin token");
      const id = ctx.orderMongoId || ctx.orderId;
      if (!id) skip("no order from checkout suite");
      const res = await apiPut(
        `/api/orders/${id}`,
        { status: "Confirmed" },
        { token: ctx.adminToken }
      );
      expectStatus(res.status, 200, "PUT order status", res.text);
    });

    await test("GET+PUT /api/site-content announcement (restore)", async () => {
      if (!ctx.adminToken) skip("no admin token");
      const getRes = await apiGet<{ content?: { announcementText?: string } }>(
        "/api/site-content"
      );
      expectStatus(getRes.status, 200, "GET site-content", getRes.text);
      const backup = getRes.data.content?.announcementText ?? "";
      ctx.siteAnnouncementBackup = backup;

      const marker = `TEST_ANNOUNCE_${stamp}`;
      const putRes = await apiPut(
        "/api/site-content",
        { announcementText: marker },
        { token: ctx.adminToken }
      );
      expectStatus(putRes.status, 200, "PUT site-content", putRes.text);

      const restore = await apiPut(
        "/api/site-content",
        { announcementText: backup },
        { token: ctx.adminToken }
      );
      expectStatus(restore.status, 200, "restore site-content", restore.text);
    });

    await test("GET /api/customers", async () => {
      if (!ctx.adminToken) skip("no admin token");
      const res = await apiGet("/api/customers", { token: ctx.adminToken });
      expectStatus(res.status, 200, "GET /api/customers", res.text);
    });

    await test("GET /api/groups", async () => {
      if (!ctx.adminToken) skip("no admin token");
      const res = await apiGet("/api/groups", { token: ctx.adminToken });
      expectStatus(res.status, 200, "GET /api/groups", res.text);
    });

    await test("GET /api/analytics", async () => {
      if (!ctx.adminToken) skip("no admin token");
      const res = await apiGet("/api/analytics?days=7", {
        token: ctx.adminToken,
      });
      expectStatus(res.status, 200, "GET /api/analytics", res.text);
    });

    await test("GET /api/campaigns", async () => {
      if (!ctx.adminToken) skip("no admin token");
      const res = await apiGet("/api/campaigns", { token: ctx.adminToken });
      expectStatus(res.status, 200, "GET /api/campaigns", res.text);
    });

    await test("GET /api/reviews?all=1 admin moderation", async () => {
      if (!ctx.adminToken) skip("no admin token");
      const res = await apiGet("/api/reviews?all=1", { token: ctx.adminToken });
      expectStatus(res.status, 200, "GET /api/reviews?all=1", res.text);
    });

    await test("GET /api/settings/cod + admin PUT no-op restore", async () => {
      if (!ctx.adminToken) skip("no admin token");
      const getRes = await apiGet<{ settings?: { codEnabled?: boolean } }>(
        "/api/settings/cod"
      );
      expectStatus(getRes.status, 200, "GET settings/cod", getRes.text);
      const enabled = getRes.data.settings?.codEnabled;
      const putRes = await apiPut(
        "/api/settings/cod",
        { codEnabled: enabled !== false },
        { token: ctx.adminToken }
      );
      expectStatus(putRes.status, 200, "PUT settings/cod", putRes.text);
    });

    await test("Cleanup: DELETE product + coupon + collection", async () => {
      if (!ctx.adminToken) skip("no admin token");
      if (ctx.createdProductId) {
        const res = await apiDelete(
          `/api/products/${ctx.createdProductId}?hard=1`,
          { token: ctx.adminToken }
        );
        expectStatus(res.status, [200, 204], "DELETE product", res.text);
      }
      if (ctx.createdCouponId) {
        const res = await apiDelete(`/api/coupons/${ctx.createdCouponId}`, {
          token: ctx.adminToken,
        });
        expectStatus(res.status, [200, 204], "DELETE coupon", res.text);
      }
      if (ctx.createdCollectionId) {
        const res = await apiDelete(
          `/api/collections/${ctx.createdCollectionId}?hard=1`,
          { token: ctx.adminToken }
        );
        expectStatus(res.status, [200, 204], "DELETE collection", res.text);
      }
    });
  });
}
