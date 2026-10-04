import { expect, test } from "@playwright/test";

/**
 * Phase 1 skeleton contract: every placeholder route renders (200) and an
 * unknown path is a real 404, not a crash.
 */
const routes = [
  "/",
  "/products",
  "/products/demo-tee",
  "/customize/demo-tee",
  "/cart",
  "/checkout",
  "/orders",
  "/designs",
  "/admin",
  "/login",
  "/signup",
];

test.describe("route skeleton", () => {
  for (const route of routes) {
    test(`${route} returns 200`, async ({ request }) => {
      const response = await request.get(route);
      expect(response.status()).toBe(200);
    });
  }

  test("unknown path returns 404 with the not-found screen", async ({ request }) => {
    const response = await request.get("/this-route-does-not-exist");
    expect(response.status()).toBe(404);
    expect(await response.text()).toContain("This page does not exist.");
  });

  test("the storefront renders the hero and the shell", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toContainText("See it.");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Own it.");
    await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Cart", exact: true }).first()).toBeVisible();
  });
});
