import { apiGet, apiPost } from "../lib/http";
import { expectField, expectOk, expectStatus } from "../lib/assert";
import { suite, test } from "../lib/report";
import { ctx } from "../lib/context";

export async function runCheckoutCases() {
  await suite("Checkout commerce", async () => {
    await test("GET /api/checkout/config", async () => {
      const res = await apiGet<Record<string, unknown>>("/api/checkout/config");
      expectStatus(res.status, 200, "GET /api/checkout/config", res.text);
      expectOk(
        "codEnabled" in res.data || "razorpayEnabled" in res.data,
        "checkout config missing expected fields"
      );
    });

    await test("POST /api/checkout/check-pincode valid COD pin", async () => {
      // Seed defaults include prefix 1100 (Delhi)
      const res = await apiPost<{ available?: boolean; message?: string }>(
        "/api/checkout/check-pincode",
        { pinCode: "110001", city: "New Delhi" }
      );
      expectStatus(res.status, 200, "check-pincode 110001", res.text);
      expectOk(typeof res.data.available === "boolean", "available should be boolean");
    });

    await test("POST /api/checkout/check-pincode invalid length", async () => {
      const res = await apiPost<{ available?: boolean }>("/api/checkout/check-pincode", {
        pinCode: "12",
      });
      expectStatus(res.status, 200, "check-pincode short", res.text);
      expectOk(res.data.available === false, "short pin should be unavailable");
    });

    await test("POST /api/coupons/validate invalid code", async () => {
      const res = await apiPost("/api/coupons/validate", {
        code: "NOT_A_REAL_COUPON_XYZ",
        subtotal: 2000,
      });
      expectStatus(res.status, [400, 404], "invalid coupon", res.text);
    });

    await test("POST /api/coupons/validate WELCOME10", async () => {
      const res = await apiPost<{ valid?: boolean; discountAmount?: number }>(
        "/api/coupons/validate",
        { code: "WELCOME10", subtotal: 2000 }
      );
      if (res.status === 400 || res.status === 404) {
        // Coupon may not be seeded — soft fail with clear message
        throw new Error(
          `WELCOME10 not valid (${res.status}). Run npm run seed. Body: ${res.text.slice(0, 200)}`
        );
      }
      expectStatus(res.status, 200, "validate WELCOME10", res.text);
      expectOk(res.data.valid === true, "WELCOME10 should be valid");
    });

    await test("POST /api/checkout/place-order rejects missing address", async () => {
      expectOk(ctx.productId, "need productId from catalog");
      const res = await apiPost("/api/checkout/place-order", {
        paymentMethod: "cod",
        customer: {
          name: "Test User",
          phone: "9999999999",
          // missing address/city/state/pinCode
        },
        items: [{ productId: ctx.productId, quantity: 1 }],
      });
      expectStatus(res.status, 400, "place-order missing fields", res.text);
    });

    await test("POST /api/checkout/place-order guest COD success", async () => {
      expectOk(ctx.productId, "need productId from catalog");
      const res = await apiPost<{ order?: { orderId?: string; id?: string; status?: string } }>(
        "/api/checkout/place-order",
        {
          paymentMethod: "cod",
          customer: {
            name: "API Test Buyer",
            firstName: "API",
            lastName: "Test",
            email: `api-test-${Date.now()}@example.com`,
            phone: "9876543210",
            address: "12 Test Lane",
            apartment: "Apt 1",
            city: "New Delhi",
            state: "DL",
            pinCode: "110001",
            country: "IN",
          },
          items: [{ productId: ctx.productId, quantity: 1, size: "M" }],
          couponCode: "WELCOME10",
        }
      );
      expectStatus(res.status, [200, 201], "place-order COD", res.text);
      const order = expectField(res.data, "order") as {
        orderId?: string;
        id?: string;
        status?: string;
      };
      expectOk(!!order.orderId || !!order.id, "order id missing");
      ctx.orderId = order.orderId;
      ctx.orderMongoId = order.id;
    });
  });
}
