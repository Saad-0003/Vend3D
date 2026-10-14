import { expect, test } from "@playwright/test";

import { seedCart } from "./seed-cart";

/**
 * Demo checkout end to end (plan.md Phase 9): cart → three steps with a valid
 * demo card → place the order → confirmation screen. No real card data is
 * involved — 4242 4242 4242 4242 is the documented demo number, and it never
 * leaves the browser.
 *
 * Queries are scoped to the checkout `<main>` so the footer's newsletter field
 * can never collide with a form label. Navigation assertions get a longer
 * budget because a dev server compiles each route while other workers run.
 *
 * `reducedMotion: "reduce"` keeps the run deterministic: Lenis is skipped when
 * the shopper prefers reduced motion, so the page never smooth-scrolls under a
 * click's stability check, and the step transitions become opacity-only. The
 * animated path is covered by the jsdom suite (see `tests/unit`), where motion
 * is not reduced. `test.slow()` triples the budget for the dev-server compile.
 *
 * The cart is seeded by `seed-cart.ts` rather than by walking the studio, whose
 * customizer chunk is the heaviest route in the app.
 */

const SLOW = { timeout: 15_000 };

test.use({ reducedMotion: "reduce" });

test.describe("demo checkout", () => {
  test.slow();

  test("places a demo order from the cart screen", async ({ page }) => {
    await seedCart(page);
    await page.goto("/cart");

    await expect(page.getByRole("list", { name: "Cart items" })).toBeVisible(SLOW);
    await expect(page.getByText("Heavyweight Boxy Tee").first()).toBeVisible(SLOW);
    await page.getByRole("link", { name: "Checkout" }).last().click();

    const checkout = page.getByRole("main", { name: "Checkout" });
    await expect(page).toHaveURL(/\/checkout/, SLOW);

    // Step 1 — Details.
    await expect(checkout.getByRole("navigation", { name: "Checkout progress" })).toContainText("Details");
    await checkout.getByLabel("Email").fill("ayesha@example.com");
    await checkout.getByLabel("Full name").fill("Ayesha Khan");
    await checkout.getByLabel("Phone").fill("+92 300 1234567");
    await checkout.getByLabel("Street address").fill("House 12, Street 4, Gulberg");
    await checkout.getByLabel("City").fill("Lahore");
    await checkout.getByLabel("Province").click();
    await page.getByRole("option", { name: "Punjab" }).click();
    await checkout.getByRole("radio", { name: /Standard/ }).check();
    await checkout.getByRole("button", { name: "Continue to payment" }).click();

    // Step 2 — Payment. The banner is always visible and the card mirrors input.
    await expect(checkout.getByText("Demo payment, no real charge.")).toBeVisible(SLOW);
    await checkout.getByLabel("Card number").fill("4242424242424242");
    await expect(checkout.getByLabel("Card number")).toHaveValue("4242 4242 4242 4242");
    await checkout.getByLabel("Cardholder name").fill("Ayesha Khan");
    await checkout.getByLabel("Expiry").fill("1230");
    await checkout.getByLabel("CVC").fill("123");
    await checkout.getByRole("button", { name: "Continue to review" }).click();

    // Step 3 — Review.
    await expect(checkout.getByText("Visa ending 4242")).toBeVisible(SLOW);
    await checkout.getByRole("checkbox").check();
    await checkout.getByRole("button", { name: "Place order" }).click();

    // Confirmation.
    const confirmation = page.getByRole("main", { name: "Order confirmation" });
    await expect(page).toHaveURL(/\/order\/ord-/, SLOW);
    await expect(confirmation.getByRole("heading", { name: "Your order is in production." })).toBeVisible(SLOW);
    await expect(confirmation.getByText("A demo confirmation, no real charge was made.")).toBeVisible();
    await expect(confirmation.getByText("Ayesha Khan").first()).toBeVisible();

    // The fulfilment timeline and the dispatch promise.
    await expect(confirmation.getByRole("list", { name: "Order progress" })).toContainText("Placed");
    await expect(confirmation.getByText("Dispatch within 48 hours")).toBeVisible();

    // Both CTAs are present and wired to real routes.
    await expect(confirmation.getByRole("link", { name: "Back to shop" })).toHaveAttribute("href", "/shop");
    await expect(confirmation.getByRole("link", { name: "View designs" })).toHaveAttribute("href", "/designs");

    // The cart is emptied by the order: the navbar badge drops to zero. Read the
    // persisted store rather than navigating, because `addInitScript` re-seeds
    // localStorage on every page load.
    await expect(page.getByRole("link", { name: "Cart", exact: true })).toBeVisible(SLOW);
    const stored = await page.evaluate(() => localStorage.getItem("vend3d-cart"));
    expect(stored).toContain('"lines":[]');
  });

  test("an empty cart cannot start checkout", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page).toHaveURL(/\/cart/, SLOW);
  });

  test("an invalid card never reaches the review step", async ({ page }) => {
    await seedCart(page);
    await page.goto("/checkout");
    const checkout = page.getByRole("main", { name: "Checkout" });

    await checkout.getByLabel("Email").fill("ayesha@example.com");
    await checkout.getByLabel("Full name").fill("Ayesha Khan");
    await checkout.getByLabel("Phone").fill("+92 300 1234567");
    await checkout.getByLabel("Street address").fill("House 12, Street 4");
    await checkout.getByLabel("City").fill("Lahore");
    await checkout.getByLabel("Province").click();
    await page.getByRole("option", { name: "Punjab" }).click();
    await checkout.getByRole("button", { name: "Continue to payment" }).click();

    await checkout.getByLabel("Card number").fill("4242424242424241");
    await checkout.getByLabel("Cardholder name").fill("Ayesha Khan");
    await checkout.getByLabel("Expiry").fill("1230");
    await checkout.getByLabel("CVC").fill("123");
    await checkout.getByRole("button", { name: "Continue to review" }).click();

    await expect(checkout.getByText("This card number is not valid.")).toBeVisible(SLOW);
    await expect(checkout.getByRole("heading", { name: "Demo payment" })).toBeVisible();
    await expect(checkout.getByText("Visa ending 4242")).toHaveCount(0);
  });

  test("an unknown order id shows the not-found panel", async ({ page }) => {
    await page.goto("/order/ord-does-not-exist");
    await expect(page.getByText("Order not found.")).toBeVisible(SLOW);
  });
});
