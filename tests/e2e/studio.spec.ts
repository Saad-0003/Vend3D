import { expect, test } from "@playwright/test";

/**
 * Studio completion: the load overlay, the reset confirmation, the
 * unsaved-changes guard and the fullscreen toggle, in both engines.
 *
 * Runs against `next dev` for Chromium; WebKit must run against `next start`
 * (D-084: dev's Fast Refresh reload interrupts a navigation).
 */

test.describe("studio", () => {
  test("shows determinate load progress, then hands over to the model", async ({ page }) => {
    test.slow();

    // Hold each GLB response so the loading state is observable even when the
    // asset is warm. The bar still streams real bytes once the body arrives.
    await page.route("**/*.glb", async (route) => {
      const response = await route.fetch();
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await route.fulfill({ response });
    });

    await page.goto("/products/heavyweight-boxy-tee");

    const stage = page.locator("section[aria-label*='stage']");
    const bar = stage.getByRole("progressbar", { name: "Loading 3D model" });
    await expect(bar).toBeVisible({ timeout: 30_000 });
    await expect(stage.getByText("Preparing 3D model")).toBeVisible();

    // The overlay fades out and unmounts once the model has mounted; the stage
    // keeps the real mesh, not the placeholder.
    await expect(bar).toHaveCount(0, { timeout: 20_000 });
    await expect(stage.locator("canvas")).toBeVisible();
    await expect(stage.getByText("Placeholder model")).toHaveCount(0);
  });

  test("reset asks before discarding changes, and resets straight away when clean", async ({
    page,
  }) => {
    test.slow();
    await page.goto("/products/insulated-steel-bottle");

    const stage = page.locator("section[aria-label*='stage']");
    await expect(stage.locator("canvas")).toBeVisible({ timeout: 30_000 });

    const ivory = page.getByRole("button", { name: /^Ivory #f2f0eb$/ });
    const signal = page.getByRole("button", { name: /^Signal #c6f135$/ });
    await signal.click();
    await expect(signal).toHaveAttribute("aria-pressed", "true");

    // Changed design: the reset is held behind a confirmation.
    await stage.getByRole("button", { name: "Reset" }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog.getByText("Reset all changes?")).toBeVisible();

    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(signal).toHaveAttribute("aria-pressed", "true");

    // Confirm: back to the product defaults.
    await stage.getByRole("button", { name: "Reset" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Reset" }).click();
    await expect(ivory).toHaveAttribute("aria-pressed", "true");
    await expect(signal).toHaveAttribute("aria-pressed", "false");

    // Already at the defaults: no dialog to dismiss.
    await stage.getByRole("button", { name: "Reset" }).click();
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
  });

  test("the leave guard can stay or leave", async ({ page }) => {
    test.slow();
    await page.goto("/products/heavyweight-boxy-tee");

    const stage = page.locator("section[aria-label*='stage']");
    await expect(stage.locator("canvas")).toBeVisible({ timeout: 30_000 });

    const shop = page.getByRole("link", { name: "Shop", exact: true }).first();
    const signal = page.getByRole("button", { name: /^Signal #c6f135$/ });
    await signal.click();
    await expect(signal).toHaveAttribute("aria-pressed", "true");

    // Stay keeps the shopper on the design.
    await shop.click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog.getByText("Leave without saving?")).toBeVisible();
    await dialog.getByRole("button", { name: "Stay" }).click();
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(page).toHaveURL(/\/products\/heavyweight-boxy-tee/);

    // Leave abandons it.
    await shop.click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Leave" }).click();
    await expect(page).toHaveURL(/\/shop$/, { timeout: 15_000 });
  });

  test("save design from the guard saves, then finishes the navigation", async ({ page }) => {
    test.slow();
    await page.goto("/products/heavyweight-boxy-tee");

    const stage = page.locator("section[aria-label*='stage']");
    await expect(stage.locator("canvas")).toBeVisible({ timeout: 30_000 });

    const shop = page.getByRole("link", { name: "Shop", exact: true }).first();
    await page.getByRole("button", { name: /^Signal #c6f135$/ }).click();

    await shop.click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Save design" }).click();
    await page.locator("#design-name").fill("Guard test");
    await page.getByRole("button", { name: "Save", exact: true }).click();

    await expect(page).toHaveURL(/\/shop$/, { timeout: 15_000 });
    const stored = await page.evaluate(() => localStorage.getItem("vend3d-designs") ?? "");
    expect(stored).toContain("Guard test");
  });

  test("adding to cart clears the guard", async ({ page }) => {
    test.slow();
    await page.goto("/products/heavyweight-boxy-tee");

    const stage = page.locator("section[aria-label*='stage']");
    await expect(stage.locator("canvas")).toBeVisible({ timeout: 30_000 });

    await page.getByRole("button", { name: /^Ivory #f2f0eb$/ }).click();
    await page.getByRole("button", { name: "Add to cart" }).click();

    await page.getByRole("link", { name: "Shop", exact: true }).first().click();
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(page).toHaveURL(/\/shop$/, { timeout: 15_000 });
  });

  test("fullscreen grows the stage and the icon follows the browser state", async ({ page }) => {
    test.slow();
    await page.goto("/products/insulated-steel-bottle");

    const stage = page.locator("section[aria-label*='stage']");
    const canvas = stage.locator("canvas");
    await expect(canvas).toBeVisible({ timeout: 30_000 });

    const width = () => canvas.evaluate((node) => node.getBoundingClientRect().width);
    // A brand-new <canvas> lays out at its intrinsic 300px until R3F's resize
    // observer sizes it; under software WebGL that can take a few seconds.
    await expect.poll(width, { timeout: 15_000 }).toBeGreaterThan(400);
    const before = await width();

    const enter = stage.getByRole("button", { name: "Enter fullscreen" });
    await expect(enter).toBeVisible();
    await enter.click();

    await expect(stage.getByRole("button", { name: "Exit fullscreen" })).toBeVisible();
    await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
    // The canvas follows the stage in both directions (R3F's resize observer).
    await expect.poll(width).toBeGreaterThan(before + 100);

    // Esc is handled by the browser, not by a page listener. Headless Chromium
    // does not deliver it, so the toggle is the portable way out there.
    if (test.info().project.name === "webkit") {
      await page.keyboard.press("Escape");
    } else {
      await stage.getByRole("button", { name: "Exit fullscreen" }).click();
    }

    await expect(stage.getByRole("button", { name: "Enter fullscreen" })).toBeVisible();
    await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(false);
    await expect.poll(width).toBeLessThan(before + 100);
  });
});
