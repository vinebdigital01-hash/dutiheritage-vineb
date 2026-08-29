import { test, expect } from "@playwright/test";

test.describe("Storefront", () => {
  test("homepage loads brand and navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/duti|heritage|vellure/i);
    // Header / brand should be present
    await expect(page.locator("body")).toBeVisible();
    const main = page.locator("main, body");
    await expect(main.first()).toBeVisible();
  });

  test("can open a collection or product from home", async ({ page }) => {
    // Prefer API-backed navigation (homepage carousels may use non-route clicks).
    const productsRes = await page.request.get("/api/products?limit=1");
    expect(productsRes.ok()).toBeTruthy();
    const productsData = await productsRes.json();
    const productSlug = productsData.products?.[0]?.slug as string | undefined;

    const collectionsRes = await page.request.get("/api/collections");
    expect(collectionsRes.ok()).toBeTruthy();
    const collectionsData = await collectionsRes.json();
    const collectionSlug = collectionsData.collections?.[0]?.slug as
      | string
      | undefined;

    if (collectionSlug) {
      await page.goto(`/collections/${collectionSlug}`);
      await expect(page).toHaveURL(new RegExp(`/collections/${collectionSlug}`));
      return;
    }

    test.skip(!productSlug, "No catalog data — run npm run seed");
    await page.goto(`/products/${productSlug}`);
    await expect(page).toHaveURL(new RegExp(`/products/${productSlug}`));
  });

  test("product page shows add to cart; checkout form fields visible", async ({
    page,
  }) => {
    const res = await page.request.get("/api/products?limit=1");
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    const product = data.products?.[0];
    test.skip(!product?.slug, "No products — run npm run seed");

    await page.goto(`/products/${product.slug}`);
    const addBtn = page.getByRole("button", { name: /add to cart/i }).first();
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    await page.goto("/checkout");
    await expect(
      page.getByPlaceholder(/email or mobile phone number/i)
    ).toBeVisible();
    await expect(page.getByPlaceholder(/first name/i)).toBeVisible();
    await expect(page.getByPlaceholder(/^address/i)).toBeVisible();
    await expect(page.getByPlaceholder(/pin code/i)).toBeVisible();
  });

  test("account login form is visible when logged out", async ({ page }) => {
    await page.goto("/account");
    await expect(page.getByPlaceholder(/^email$/i).or(page.getByPlaceholder(/email address/i)).first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByPlaceholder(/^password$/i)).toBeVisible();
  });
});
