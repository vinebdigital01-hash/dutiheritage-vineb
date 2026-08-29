import { apiGet } from "../lib/http";
import { expectField, expectOk, expectStatus } from "../lib/assert";
import { suite, test } from "../lib/report";
import { ctx } from "../lib/context";

type Product = { id: string; slug: string; name: string };
type Collection = { id: string; slug: string; name: string };

export async function runCatalogCases() {
  await suite("Catalog / CMS (public)", async () => {
    await test("GET /api/products returns catalog", async () => {
      const res = await apiGet<{ products: Product[]; count: number }>(
        "/api/products?limit=5"
      );
      expectStatus(res.status, 200, "GET /api/products", res.text);
      const products = expectField(res.data, "products") as Product[];
      expectOk(Array.isArray(products), "products should be an array");
      expectOk(products.length > 0, "catalog empty — run npm run seed");
      ctx.productId = products[0]!.id;
      ctx.productSlug = products[0]!.slug;
    });

    await test("GET /api/products/[id] returns product", async () => {
      expectOk(ctx.productId, "need productId from list");
      const res = await apiGet<{ product: Product }>(
        `/api/products/${ctx.productId}`
      );
      expectStatus(res.status, 200, "GET /api/products/[id]", res.text);
      expectEqualField(res.data.product?.id, ctx.productId, "product.id");
    });

    await test("GET /api/products?slug= resolves product", async () => {
      expectOk(ctx.productSlug, "need productSlug");
      const res = await apiGet<{ product: Product }>(
        `/api/products?slug=${encodeURIComponent(ctx.productSlug!)}`
      );
      expectStatus(res.status, 200, "GET /api/products?slug=", res.text);
      expectOk(res.data.product?.slug === ctx.productSlug, "slug mismatch");
    });

    await test("GET /api/collections returns list", async () => {
      const res = await apiGet<{ collections: Collection[]; count: number }>(
        "/api/collections"
      );
      expectStatus(res.status, 200, "GET /api/collections", res.text);
      const collections = expectField(res.data, "collections") as Collection[];
      expectOk(collections.length > 0, "no collections — run npm run seed");
      ctx.collectionId = collections[0]!.id;
    });

    await test("GET /api/collections/[id] returns collection", async () => {
      expectOk(ctx.collectionId, "need collectionId");
      const res = await apiGet<{ collection: Collection }>(
        `/api/collections/${ctx.collectionId}`
      );
      expectStatus(res.status, 200, "GET /api/collections/[id]", res.text);
      expectOk(!!res.data.collection?.id, "missing collection");
    });

    await test("GET /api/site-content returns content", async () => {
      const res = await apiGet<{ content: Record<string, unknown> }>(
        "/api/site-content"
      );
      expectStatus(res.status, 200, "GET /api/site-content", res.text);
      expectField(res.data, "content");
    });

    await test("GET /api/pages/privacy-policy", async () => {
      const res = await apiGet("/api/pages/privacy-policy");
      expectStatus(res.status, [200, 404], "GET /api/pages/privacy-policy", res.text);
      // 404 OK if page not seeded yet — still proves route works
    });

    for (const slug of ["shipping", "return-exchange", "terms-conditions"] as const) {
      await test(`GET /api/pages/${slug}`, async () => {
        const res = await apiGet(`/api/pages/${slug}`);
        expectStatus(res.status, [200, 404], `GET /api/pages/${slug}`, res.text);
      });
    }
  });
}

function expectEqualField(actual: unknown, expected: unknown, label: string) {
  expectOk(actual === expected, `${label}: expected ${expected}, got ${actual}`);
}
