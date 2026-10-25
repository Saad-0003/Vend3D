import { expect, test } from "@playwright/test";

/**
 * Order history (Phase 1B U1) end to end: place a demo order, reach `/orders`
 * from the account menu, open it, reorder it, and verify both legacy routes
 * forward to their canonical screens.
 *
 * The cart is written once through `page.evaluate` rather than `addInitScript`
 * (as `checkout.spec.ts` does): an init script would re-seed the cart on every
 * navigation and make the post-checkout reorder assertion meaningless.
 */

const SLOW = { timeout: 20_000 };

const USER = { name: "Ayesha Khan", email: "ayesha@example.com", password: "supersecret1" };

test.use({ reducedMotion: "reduce" });

async function signUp(page: import("@playwright/test").Page) {
  await page.goto("/shop");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("tab", { name: "Create account" }).click();

  const panel = page.getByRole("tabpanel");
  await panel.getByLabel("Full name").fill(USER.name);
  await panel.getByLabel("Email", { exact: true }).fill(USER.email);
  await panel.getByLabel("Password", { exact: true }).fill(USER.password);
  await panel.getByLabel("Confirm password").fill(USER.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("button", { name: "Account menu" })).toBeVisible(SLOW);
  // Let the shop's own client hydration settle before the next full navigation.
  // Under `next dev`, WebKit treats the dev server's Fast Refresh full reload as
  // an interrupt to the following `page.goto`; a production build (`next start`)
  // has no such reload and runs this spec clean (DECISIONS.md D-084).
  await expect(page.getByRole("list", { name: "Archive" })).toBeVisible(SLOW);
}

/** Writes the cart's persisted payload once; the next full load hydrates it. */
async function seedCartOnce(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    const line = {
      id: "line-e2e-orders",
      slug: "heavyweight-boxy-tee",
      name: "Heavyweight Boxy Tee",
      configuration: {
        parts: { body: { color: "#1b1b1d", finish: 0 } },
        decal: null,
        engrave: { enabled: false, text: "", font: "mono" },
        extras: { size: "M" },
      },
      thumbnail: "",
      qty: 2,
      unitCents: 4800,
    };
    localStorage.setItem("vend3d-cart", JSON.stringify({ state: { lines: [line] }, version: 0 }));
  });
}

/** Walks the three checkout steps and returns the placed order id. */
async function placeDemoOrder(page: import("@playwright/test").Page) {
  await page.goto("/cart");
  await expect(page.getByRole("list", { name: "Cart items" })).toBeVisible(SLOW);
  await page.getByRole("link", { name: "Checkout" }).last().click();

  const checkout = page.getByRole("main", { name: "Checkout" });
  await expect(page).toHaveURL(/\/checkout/, SLOW);

  await checkout.getByLabel("Email").fill("ayesha@example.com");
  await checkout.getByLabel("Full name").fill(USER.name);
  await checkout.getByLabel("Phone").fill("+92 300 1234567");
  await checkout.getByLabel("Street address").fill("House 12, Street 4, Gulberg");
  await checkout.getByLabel("City").fill("Lahore");
  await checkout.getByLabel("Province").click();
  await page.getByRole("option", { name: "Punjab" }).click();
  await checkout.getByRole("radio", { name: /Standard/ }).check();
  await checkout.getByRole("button", { name: "Continue to payment" }).click();

  await checkout.getByLabel("Card number").fill("4242424242424242");
  await checkout.getByLabel("Cardholder name").fill(USER.name);
  await checkout.getByLabel("Expiry").fill("1230");
  await checkout.getByLabel("CVC").fill("123");
  await checkout.getByRole("button", { name: "Continue to review" }).click();

  await checkout.getByRole("checkbox").check();
  await checkout.getByRole("button", { name: "Place order" }).click();

  await expect(page).toHaveURL(/\/order\/ord-/, SLOW);
  const id = new URL(page.url()).pathname.split("/").filter(Boolean).pop();
  expect(id).toBeTruthy();
  return id!;
}

test.describe("order history", () => {
  test.slow();

  test("a placed order is listed, opens, reorders and is reachable from every entry point", async ({
    page,
  }) => {
    await signUp(page);
    await seedCartOnce(page);
    const orderId = await placeDemoOrder(page);

    // ── Navbar account menu → Orders ──────────────────────────────────────
    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("link", { name: "Orders", exact: true }).click();

    await expect(page).toHaveURL(/\/orders$/, SLOW);
    await expect(page.getByRole("heading", { level: 1, name: /Your orders/ })).toBeVisible(SLOW);
    await expect(page.getByText("1 order", { exact: true })).toBeVisible(SLOW);

    const card = page.getByRole("article", { name: `Order ${orderId}` });
    await expect(card).toBeVisible(SLOW);
    await expect(card).toContainText("Placed", SLOW);
    await expect(card).toContainText("2 items");

    // ── View order → /order/[id] → All orders ─────────────────────────────
    await card.getByRole("link", { name: "View order" }).click();
    await expect(page).toHaveURL(new RegExp(`/order/${orderId}$`), SLOW);
    await expect(page.getByRole("heading", { name: "Your order is in production." })).toBeVisible(
      SLOW,
    );

    await page.getByRole("link", { name: "All orders" }).click();
    await expect(page).toHaveURL(/\/orders$/, SLOW);

    // ── Reorder → the existing cart seam, drawer open ─────────────────────
    await page.getByRole("button", { name: "Reorder" }).click();
    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible(SLOW);
    await expect(drawer.getByRole("heading", { name: "Your cart" })).toBeVisible();
    await expect(drawer.getByText("Heavyweight Boxy Tee").first()).toBeVisible();
    await expect(drawer.getByText("2 items", { exact: true })).toBeVisible();

    // ── Account panel → "View all orders" ─────────────────────────────────
    await page.getByRole("button", { name: "Close cart" }).click();
    await expect(drawer).toBeHidden();

    await page.goto("/account");
    await page.getByRole("tab", { name: /^Orders/ }).click();
    await page.getByRole("link", { name: "View all orders" }).click();
    await expect(page).toHaveURL(/\/orders$/, SLOW);
    await expect(page.getByRole("article", { name: `Order ${orderId}` })).toBeVisible(SLOW);
  });

  test("the legacy catalog and checkout-success routes forward", async ({ page }) => {
    await page.goto("/products");
    await expect(page).toHaveURL(/\/shop$/, SLOW);
    // `/shop` hydrates after the redirect; wait for the grid, not just `<main>`.
    await expect(page.getByRole("list", { name: "Archive" })).toBeVisible(SLOW);

    await page.goto("/checkout/success?order=ord-legacy");
    await expect(page).toHaveURL(/\/order\/ord-legacy$/, SLOW);

    // A path-shaped id must not survive into the redirect: `..%2Fadmin` would
    // otherwise be normalised by the browser into `/admin`.
    await page.goto("/checkout/success?order=..%2Fadmin");
    await expect(page).toHaveURL(/\/(login|orders)/, SLOW);
  });
});
