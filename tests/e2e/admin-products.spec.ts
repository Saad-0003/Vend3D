import { expect, test } from "@playwright/test";
import path from "node:path";

/**
 * The admin product screens (plan.md Phase 1B U5): create, edit, duplicate,
 * archive and the upload rules — all through the browser-local
 * `CatalogAdminService` seam, so every step is verifiable without a server
 * and Phase 4's DB swap must keep the same flows green.
 *
 * Seeding follows the admin spec's pattern: an `addInitScript` with literals
 * only (page-world constants don't exist there) and `/admin` as the first
 * hard navigation (WebKit-safe, D-084).
 */

const SLOW = { timeout: 20_000 };

test.use({ reducedMotion: "reduce" });

function seedAdminSession(page: import("@playwright/test").Page) {
  return page.addInitScript(() => {
    localStorage.setItem(
      "vend3d-auth-accounts",
      JSON.stringify([{ id: "user-demo-admin", email: "admin@vend3d.demo", name: "Demo Admin", role: "admin" }]),
    );
    localStorage.setItem(
      "vend3d-auth-user",
      JSON.stringify({
        id: "user-demo-admin",
        email: "admin@vend3d.demo",
        name: "Demo Admin",
        role: "admin",
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      }),
    );
  });
}

function gotoProducts(page: import("@playwright/test").Page) {
  return seedAdminSession(page).then(() => page.goto("/admin/products"));
}

test.describe("admin products list", () => {
  test("the four catalog seeds render with filters and the demo banner", async ({ page }) => {
    await gotoProducts(page);

    await expect(page.getByRole("heading", { name: "Products." })).toBeVisible(SLOW);
    await expect(page.getByTestId("admin-products-banner")).toContainText("saved in this browser only");

    const rows = page.getByTestId("admin-product-row");
    await expect(rows).toHaveCount(4);
    await expect(rows.first()).toContainText("Heavyweight Boxy Tee");

    // Status chips tell the truth: all seeds ship Active.
    const statuses = page.getByTestId("admin-product-status");
    await expect(statuses).toHaveText(["Active", "Active", "Active", "Active"]);

    // Search narrows; clearing restores.
    await page.getByTestId("admin-products-search").fill("mug");
    await expect(rows).toHaveCount(1);
    await page.getByTestId("admin-products-search").fill("");
    await expect(rows).toHaveCount(4);

    // Category + status filters through the Select and Tabs. Drinkware covers
    // two seeds (mug and bottle).
    await page.getByRole("combobox", { name: "Filter by category" }).click();
    await page.getByRole("option", { name: "Drinkware" }).click();
    await expect(rows.filter({ hasText: "Luna Glazed Mug" })).toHaveCount(1);
    await expect(rows.filter({ hasText: "Insulated Steel Bottle" })).toHaveCount(1);
    await page.getByRole("tab", { name: "Draft" }).click();
    await expect(page.getByText("Nothing fits those filters.")).toBeVisible();
    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(rows).toHaveCount(4);
  });

  test("duplicate adds a copy row and archive requires confirmation", async ({ page }) => {
    await gotoProducts(page);
    const rows = page.getByTestId("admin-product-row");

    // Duplicate the newest row: a copy lands right above it.
    const original = rows.first();
    const originalName = await original.locator("a").first().textContent();
    await original.getByRole("button", { name: "Duplicate" }).click();
    await expect(page.getByText(/Duplicated/)).toBeVisible(SLOW);
    await expect(rows).toHaveCount(5);

    // The copy keeps the source's name with the "copy" suffix.
    const copy = rows.first();
    await expect(copy.locator("a").first()).toContainText(`${originalName?.trim() ?? ""} copy`);

    // Archive with its confirm dialog; the chip flips, restore exists.
    await copy.getByTestId("admin-archive-button").click();
    await page.getByTestId("admin-archive-confirm").click();
    await expect(copy.getByTestId("admin-product-status")).toHaveText("Archived", SLOW);
    await expect(copy.getByRole("button", { name: /Restore/ })).toBeVisible();

    // Nothing is deleted: restoring is one click.
    await copy.getByRole("button", { name: /Restore/ }).click();
    await expect(copy.getByTestId("admin-product-status")).toHaveText("Active", SLOW);
  });
});

test.describe("admin product form", () => {
  test("create: basics validate, then the product lands in the list", async ({ page }) => {
    await seedAdminSession(page);
    await page.goto("/admin/products/new");

    await expect(page.getByRole("heading", { name: "New product." })).toBeVisible(SLOW);

    // Inline zod errors + focus-first-error behaviour via RHF.
    await page.getByTestId("admin-product-save").click();
    await expect(page.getByText("Name needs at least 2 characters")).toBeVisible(SLOW);
    await expect(page.locator("#f-name")).toBeFocused();

    await page.getByTestId("admin-product-name").fill("Studio Tote");
    // Slug auto-follows the name until it is deliberately edited.
    await expect(page.getByTestId("admin-product-slug")).toHaveValue("studio-tote");

    await page.getByTestId("admin-product-price").fill("39.90");
    await page.getByRole("combobox", { name: "Status" }).click();
    await page.getByRole("option", { name: "Active" }).click();

    // A product needs at least one customizable part — add the default row.
    await page.getByTestId("admin-add-part").click();
    await page.getByLabel("Part label").fill("Print area");

    await page.getByTestId("admin-product-save").click(SLOW);
    await expect(page).toHaveURL(/\/admin\/products$/, SLOW);

    const row = page.getByTestId("admin-product-row").filter({ hasText: "Studio Tote" });
    await expect(row).toHaveCount(1);
    await expect(row).toContainText("$39.90");
    await expect(row.getByTestId("admin-product-status")).toHaveText("Active");
  });

  test("edit: a catalog product loads seeded parts and saves a price change", async ({ page }) => {
    await gotoProducts(page);
    await page.getByRole("link", { name: "Edit Insulated Steel Bottle" }).click(SLOW);

    await expect(page.getByRole("heading", { name: "Edit product." })).toBeVisible(SLOW);
    await expect(page.getByTestId("admin-product-name")).toHaveValue("Insulated Steel Bottle");
    // Customization seeded from the live storefront config: at least one part row.
    await expect(page.getByText(/Customizable parts \(/)).toBeVisible();
    await expect(page.locator('input[aria-label^="Default colour for part"]').first()).toBeAttached();
    // The card image seed renders its published catalog asset.
    await expect(page.getByAltText("Published catalog image")).toBeVisible(SLOW);

    await page.getByTestId("admin-product-price").fill("24.00");
    await page.getByTestId("admin-product-save").click();
    await expect(page).toHaveURL(/\/admin\/products$/, SLOW);

    const row = page.getByTestId("admin-product-row").filter({ hasText: "Insulated Steel Bottle" });
    await expect(row).toContainText("$24.00", SLOW);
  });

  test("upload rules: wrong type and over-size are refused inline", async ({ page }) => {
    await seedAdminSession(page);
    await page.goto("/admin/products/new");

    await expect(page.getByRole("heading", { name: "New product." })).toBeVisible(SLOW);
    await expect(page.getByTestId("admin-model-upload-input")).toBeAttached(SLOW);

    // A .txt is the wrong model type.
    await page.getByTestId("admin-model-upload-input").setInputFiles({
      name: "notes.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("not a model"),
    });
    await expect(page.getByRole("alert").filter({ hasText: /Wrong file type/i })).toHaveCount(1, SLOW);

    // An over-cap .glb (2.5 MB > the 1.5 MB demo cap) is refused by size.
    await page.getByTestId("admin-model-upload-input").setInputFiles({
      name: "huge.glb",
      mimeType: "model/gltf-binary",
      buffer: Buffer.alloc(2.5 * 1024 * 1024, 7),
    });
    await expect(page.getByRole("alert").filter({ hasText: /Too large/i })).toHaveCount(1, SLOW);

    // The card image zone enforces its own type rules (.gif is refused).
    await page.getByTestId("admin-image-upload-input").setInputFiles({
      name: "art.gif",
      mimeType: "image/gif",
      buffer: Buffer.from("GIF89a"),
    });
    // The model zone keeps its "Too large" alert; the image zone adds its own.
    await expect(page.getByRole("alert").filter({ hasText: /Wrong file type/i })).toHaveCount(1, SLOW);

    // A real, tiny GLB from the repo fixtures is accepted and displayed.
    await page.getByTestId("admin-model-upload-input").setInputFiles(path.join(__dirname, "..", "..", "src", "assets", "models", "mug.glb"));
    await expect(page.getByText("mug.glb")).toBeVisible(SLOW);
    // The live preview switches from the placeholder to the real viewer.
    await expect(page.getByText("Live preview")).toBeVisible();
  });

  test("discard reverts edits and the sticky bar mirrors the dirty state", async ({ page }) => {
    await gotoProducts(page);
    await page.getByRole("link", { name: "Edit Insulated Steel Bottle" }).click(SLOW);

    await expect(page.getByTestId("admin-product-dirty-state")).toContainText("All changes saved", SLOW);
    await page.getByTestId("admin-product-name").fill("Renamed Bottle");
    await expect(page.getByTestId("admin-product-dirty-state")).toContainText("Unsaved changes");

    await page.getByTestId("admin-product-discard").click();
    await expect(page.getByTestId("admin-product-name")).toHaveValue("Insulated Steel Bottle", SLOW);
    await expect(page.getByTestId("admin-product-dirty-state")).toContainText("All changes saved");
  });
});
