import { expect, test } from "@playwright/test";

import { seedCart } from "./seed-cart";

/**
 * The legal pages (`/privacy`, `/terms`, `/shipping-returns`) — Prompt 11a.
 *
 * They reuse the informational template, so what matters here is the part that
 * is unique to them: the draft notice and placeholder dates at the top, the
 * marked "TODO: owner to confirm" placeholders instead of invented legal
 * wording, the closing cross-links, and the two places these pages are allowed
 * to be linked from (the checkout terms checkbox and the sign-up line).
 *
 * They are deliberately NOT in the footer or the navbar, so the spec asserts
 * that too.
 */

const SLOW = { timeout: 20_000 };

const LEGAL = [
  { path: "/privacy", heading: /What we handle, and where it stays\./ },
  { path: "/terms", heading: /The terms you design and order under\./ },
  { path: "/shipping-returns", heading: /How orders ship, and how returns work\./ },
];

test.describe("legal pages", () => {
  // Each route is compiled on its first visit by the dev server (D-052).
  test.slow();

  for (const legal of LEGAL) {
    test(`${legal.path} renders with the draft notice and a placeholder date`, async ({ page }) => {
      await page.goto(legal.path);

      await expect(page.getByRole("heading", { level: 1 })).toHaveText(legal.heading, SLOW);
      // The mandated banner, and a mono "Last updated" that is still a placeholder.
      await expect(page.getByText("Draft template. Have a lawyer review before launch.")).toBeVisible(
        SLOW,
      );
      await expect(page.getByText("Last updated: [date]")).toBeVisible();
      await expect(page.getByRole("navigation", { name: "On this page" })).toBeVisible();
    });

    test(`${legal.path} keeps every unconfirmed fact as a TODO placeholder`, async ({ page }) => {
      await page.goto(legal.path);
      // No invented legal wording: the gaps are marked, not filled.
      await expect(page.getByText(/TODO: owner to confirm/).first()).toBeVisible(SLOW);
    });

    test(`${legal.path} closes by linking the other two legal pages and /contact`, async ({ page }) => {
      await page.goto(legal.path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible(SLOW);

      for (const other of LEGAL.filter((entry) => entry.path !== legal.path)) {
        const label =
          other.path === "/privacy"
            ? "Privacy Policy"
            : other.path === "/terms"
              ? "Terms of Service"
              : "Shipping & Returns";
        // `.last()`: the closing line is the final block, and the same label may
        // also appear in a section higher up the page.
        await expect(
          page.getByRole("main").getByRole("link", { name: label }).last(),
        ).toBeVisible();
      }
      await expect(
        page.getByRole("main").getByRole("link", { name: "direct line" }).last(),
      ).toBeVisible();
    });
  }

  test("a legal page is absent from the footer and the navbar", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible(SLOW);

    for (const label of ["Privacy Policy", "Terms of Service", "Shipping & Returns"]) {
      await expect(page.getByRole("banner").getByRole("link", { name: label })).toHaveCount(0);
      await expect(page.getByRole("contentinfo").getByRole("link", { name: label })).toHaveCount(0);
    }
  });

  test("the checkout terms checkbox links the legal pages in a new tab", async ({ page }) => {
    // A cart line is the only way to reach the review step.
    await seedCart(page);
    await page.goto("/checkout");

    await expect(page.getByRole("main", { name: "Checkout" })).toBeVisible(SLOW);
    // Step 1 is the first thing rendered, so walk to review the way a shopper
    // does: the label under test lives in step 3.
    const checkout = page.getByRole("main", { name: "Checkout" });
    await checkout.getByLabel("Email").pressSequentially("ayesha@example.com", { delay: 0 });
    await checkout.getByLabel("Full name").pressSequentially("Ayesha Khan", { delay: 0 });
    await checkout.getByLabel("Phone").pressSequentially("+92 300 1234567", { delay: 0 });
    await checkout.getByLabel("Street address").pressSequentially("House 12, Street 4", { delay: 0 });
    await checkout.getByLabel("City").pressSequentially("Lahore", { delay: 0 });
    await checkout.getByRole("button", { name: "Continue to payment" }).click();
    await checkout.getByLabel("Card number").pressSequentially("4242424242424242", { delay: 0 });
    await checkout.getByLabel("Cardholder name").pressSequentially("Ayesha Khan", { delay: 0 });
    await checkout.getByLabel("Expiry").pressSequentially("1230", { delay: 0 });
    await checkout.getByLabel("CVC").pressSequentially("123", { delay: 0 });
    await checkout.getByRole("button", { name: "Continue to review" }).click();

    await expect(page.getByLabel(/I agree to the/)).toBeVisible(SLOW);

    const link = page.getByRole("link", { name: "Terms of Service" });
    await expect(link).toHaveAttribute("href", "/terms");
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(page.getByRole("link", { name: "Shipping & Returns" })).toHaveAttribute(
      "href",
      "/shipping-returns",
    );
  });

  test("the sign-up form links the terms and the privacy policy", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByLabel("Full name")).toBeVisible(SLOW);

    const line = page.getByText("By creating an account you agree to the");
    await expect(line).toBeVisible();
    await expect(page.getByRole("main").getByRole("link", { name: "Terms of Service" })).toHaveAttribute(
      "href",
      "/terms",
    );
    await expect(
      page.getByRole("main").getByRole("link", { name: "Privacy Policy" }),
    ).toHaveAttribute("href", "/privacy");
  });
});
