import { test, expect } from "@playwright/test";

test.describe("Admin UI", () => {
  test("logged-out /admin redirects toward account", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForURL(/\/account/, { timeout: 20_000 });
    expect(page.url()).toMatch(/\/account/);
  });

  test("admin can sign in and open dashboard + products/orders", async ({
    page,
  }) => {
    const email = process.env.TEST_ADMIN_EMAIL?.trim();
    const password = process.env.TEST_ADMIN_PASSWORD;
    test.skip(!email || !password, "TEST_ADMIN_EMAIL/PASSWORD not set");

    await page.goto("/account");
    const emailInput = page
      .getByPlaceholder(/^email$/i)
      .or(page.getByPlaceholder(/email address/i))
      .first();
    await expect(emailInput).toBeVisible({ timeout: 20_000 });
    await emailInput.fill(email!);
    await page.getByPlaceholder(/^password$/i).fill(password!);
    await page.getByRole("button", { name: /sign in|log in|login/i }).click();

    // Wait until logged-in account view or redirect settles
    await expect
      .poll(async () => {
        const body = await page.locator("body").innerText();
        return /sign out|logout|my orders|account/i.test(body);
      }, { timeout: 30_000 })
      .toBeTruthy();

    await page.goto("/admin");
    await expect(page.getByText(/admin access required/i)).toHaveCount(0, {
      timeout: 25_000,
    });
    await expect(page.getByText(/dashboard|products|orders/i).first()).toBeVisible({
      timeout: 25_000,
    });

    await page.goto("/admin/products");
    await expect(page).toHaveURL(/\/admin\/products/);
    await expect(page.getByText(/admin access required/i)).toHaveCount(0);

    await page.goto("/admin/orders");
    await expect(page).toHaveURL(/\/admin\/orders/);
    await expect(page.getByText(/admin access required/i)).toHaveCount(0);
  });
});
