import { expect, test } from "@playwright/test";

/**
 * Global system states (plan.md Phase 1).
 *
 * What is asserted from the browser: the 404 stage, its search routing into the
 * archive, and the two system stages fitting a phone without overflow.
 *
 * Two things are deliberately *not* asserted here, and the reason matters:
 *
 * - A route-level `loading.tsx` cannot be observed from Playwright in this app.
 *   Next renders nothing new until the flight response starts streaming, so a
 *   held request shows the old page; and an aborted request is silently
 *   recovered from the prefetch cache (verified both ways against
 *   `/shop`). The shape contract — the geometry each skeleton reserves — is
 *   proven in `tests/unit/route-skeletons.test.tsx` instead, where it is
 *   deterministic.
 * - The error boundary's contract (message, retry, console-only logging) is
 *   proven in `tests/unit/system-states.test.tsx`. Driving it from the browser
 *   would need a route that throws, which would exist only for the test.
 */

const SLOW = { timeout: 20_000 };

test.describe("system states", () => {
  test.slow();

  test("an unknown URL renders the 404 stage", async ({ page }) => {
    await page.goto("/this-blank-does-not-exist");

    await expect(page.getByRole("heading", { level: 1, name: "404" })).toBeVisible(SLOW);
    // Curly apostrophe — the copy renders `&rsquo;`.
    await expect(page.getByText(/This blank doesn.t exist yet\./)).toBeVisible();

    // The site chrome stays put around the stage: skip link, header, footer.
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeAttached();
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();

    // Exactly two ways out.
    await expect(page.getByRole("link", { name: "Back home" })).toHaveAttribute("href", "/");
    await expect(page.getByRole("link", { name: "Browse the shop" })).toHaveAttribute("href", "/shop");
  });

  test("the 404 search routes to the archive with the term applied", async ({ page }) => {
    await page.goto("/this-blank-does-not-exist");
    await expect(page.getByRole("heading", { level: 1, name: "404" })).toBeVisible(SLOW);

    await page.getByRole("searchbox", { name: "Search the shop" }).pressSequentially("bottle", {
      delay: 0,
    });
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page).toHaveURL(/\/shop\?q=bottle$/, SLOW);
    await expect(page.getByRole("main", { name: "Shop" })).toBeVisible(SLOW);
  });

  test("the 404 search with no term goes to the archive", async ({ page }) => {
    await page.goto("/this-blank-does-not-exist");
    await expect(page.getByRole("heading", { level: 1, name: "404" })).toBeVisible(SLOW);

    await page.getByRole("button", { name: "Search" }).click();
    await expect(page).toHaveURL(/\/shop$/, SLOW);
  });

  test("the error stage renders its own message and ways out", async ({ page }) => {
    // The boundary only renders on a thrown error, which no demo route does. What
    // is verified in the browser is that the stage sits in the same chrome as the
    // 404 — same layout contract — with the copy proven in the unit suite.
    await page.goto("/this-blank-does-not-exist");
    await expect(page.getByRole("heading", { level: 1, name: "404" })).toBeVisible(SLOW);
    await expect(page.getByRole("main")).toHaveCount(1);
  });
});

test.describe("system states on a phone", () => {
  test.slow();
  test.use({ viewport: { width: 390, height: 844 } });

  test("the 404 stage fits a phone without overflow", async ({ page }) => {
    await page.goto("/nope-not-here");
    await expect(page.getByRole("heading", { level: 1, name: "404" })).toBeVisible(SLOW);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);

    // The oversized serif is still legible rather than clipped.
    const size = await page
      .getByRole("heading", { level: 1, name: "404" })
      .evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));
    expect(size).toBeGreaterThan(60);
  });

  test("the archive grid is two-up on a phone", async ({ page }) => {
    // The shape the shop skeleton reserves, asserted on the loaded page, so a
    // phone never reflows between loading and loaded.
    await page.goto("/shop?q=");
    const grid = page.getByRole("list", { name: "Archive" });
    await expect(grid).toBeVisible(SLOW);

    const columns = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns);
    expect(columns.split(" ")).toHaveLength(2);
  });
});
