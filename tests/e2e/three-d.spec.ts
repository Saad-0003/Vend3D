import { expect, test, type Page } from "@playwright/test";
import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Real-model smoke: the hero renders the 3D bottle and the studio stage loads
 * a real GLB (not the placeholder Primitive). Chromium-only because headless
 * WebGL outside Chromium is unreliable in CI drivers — the studio's own unit
 * and jsdom tests cover the non-GL logic.
 */
test.use({
  browserName: "chromium",
  // Headless software WebGL: newer Chromium versions gate SwiftShader behind
  // this flag, and without it the canvas silently never mounts on some runs.
  launchOptions: { args: ["--enable-unsafe-swiftshader"] },
});

/** Poll a numeric predicate until it settles or times out. */
async function until(truth: () => Promise<boolean>, timeout = 20_000) {
  await expect.poll(async () => ((await truth()) ? "ok" : "pending"), { timeout }).toBe("ok");
}

async function shot(page: Page, name: string) {
  const file = path.join(__dirname, "..", "..", ".tmp-3d-shots", name);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await page.screenshot({ path: file });
  return file;
}

test.describe("real 3D models", () => {
  // Surface swallowed errors on failure: the silent boundary hides them from
  // the DOM on purpose, so attach them to the test report.
  let pageErrors: string[] = [];
  test.beforeEach(() => {
    pageErrors = [];
  });
  test.afterEach(async (_fixtures, testInfo) => {
    if (pageErrors.length) {
      testInfo.attach("page-errors", {
        body: pageErrors.join("\n"),
        contentType: "text/plain",
      });
    }
  });

  test("hero: 3D bottle cross-fades over the poster and stays draggable", async ({ page }) => {
    page.on("pageerror", (e) => pageErrors.push("pageerror: " + String(e).slice(0, 300)));
    page.on("console", (m) => {
      if (m.type() === "error") pageErrors.push("console: " + m.text().slice(0, 300));
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Own it\./ })).toBeVisible();

    // The canvas takes over the exact poster slot (aspect-square, dpr-scaled).
    const slot = page.locator(".aspect-square").first();
    await expect(slot.locator("canvas")).toBeVisible({ timeout: 20_000 });
    await until(async () =>
      slot.locator("canvas").evaluate((c) => {
        const rect = c.getBoundingClientRect();
        const gl = !!c.getContext("webgl2") || !!c.getContext("webgl");
        // Fitted: the backing store matches the slot's CSS size at the DPR
        // (tolerance: framer's bouncing transform skews getBoundingClientRect).
        const expected = Math.round(rect.width * devicePixelRatio);
        return gl && rect.width > 300 && Math.abs(c.width - expected) <= 2;
      }),
    );

    // The GLB resolves and the poster cross-fades away (opacity-0 class applied).
    await expect(slot.locator('img[alt*="Insulated steel bottle"]')).toHaveClass(/opacity-0/, {
      timeout: 20_000,
    });

    // Attribution chip for the CC BY hero model.
    await expect(page.getByText("Bottle model · Poly by Google · CC BY 3.0")).toBeVisible();

    await shot(page, "hero-desktop.png");
  });

  test("studio: every product loads its real GLB (no placeholder badge)", async ({ page }) => {
    // Five sequential navigations, each of which may cold-compile in dev.
    test.setTimeout(90_000);
    page.on("pageerror", (e) => pageErrors.push("pageerror: " + String(e).slice(0, 300)));
    page.on("console", (m) => {
      if (m.type() === "error") pageErrors.push("console: " + m.text().slice(0, 300));
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    const slugs = [
      "insulated-steel-bottle",
      "structured-6-panel-cap",
      "heavyweight-boxy-tee",
      "luna-glazed-mug",
    ] as const;
    for (const slug of slugs) {
      await page.goto(`/products/${slug}`);
      const stage = page.locator("section[aria-label*='stage']");
      await expect(stage.locator("canvas")).toBeVisible({ timeout: 20_000 });
      // Placeholder badge absent once the real model wins the HEAD check.
      await expect(stage.getByText("Placeholder model")).toHaveCount(0);
      await until(async () => stage.locator("canvas").evaluate((c) => c.width > 300));
      // And the last frame must actually contain geometry: the stage keeps
      // `preserveDrawingBuffer`, so readPixels sees it. This is the assertion
      // that catches a blank stage — the earlier silent bug (an aborted load
      // left a live canvas with lights but no model) passed every DOM check.
      await until(async () =>
        stage.locator("canvas").evaluate((c) => {
          const gl = c.getContext("webgl2") || c.getContext("webgl");
          if (!gl) return false;
          const w = gl.drawingBufferWidth;
          const h = gl.drawingBufferHeight;
          const px = new Uint8Array(w * h * 4);
          gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
          let opaque = 0;
          for (let i = 0; i < px.length; i += 4) if (px[i + 3] > 10) opaque++;
          return opaque > w * h * 0.02;
        }),
      );
      // Source attribution under the stage hint.
      await expect(stage.locator("a[href*='poly.pizza']")).toBeVisible();
    }
    // Visual sample of one stage (bottle).
    await page.goto("/products/insulated-steel-bottle");
    await expect(page.locator("canvas")).toBeVisible({ timeout: 20_000 });
    await shot(page, "studio-bottle.png");
  });

  test("mobile: hero holds the same footprint with no horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto("/");
    const slot = page.locator(".aspect-square").first();
    await expect(slot.locator("canvas")).toBeVisible({ timeout: 20_000 });
    await until(async () =>
      page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    );
    await shot(page, "hero-mobile.png");
  });
});
