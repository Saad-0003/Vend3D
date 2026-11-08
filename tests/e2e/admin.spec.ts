import { expect, test } from "@playwright/test";

/**
 * The admin shell and dashboard (plan.md Phase 1B U4): the demo admin sees the
 * dashboard's seeded numbers, a non-admin is still bounced to /forbidden, and
 * on a phone the sidebar becomes a slide-in sheet that opens and closes.
 *
 * Everything is seeded through `addInitScript` and entered on `/admin` as the
 * first hard navigation — the auth specs established that pattern because a
 * `goto` racing the router's soft push reads as "interrupted" on WebKit
 * (D-084). No admin UI sign-in walk here; the role contract is what U4 tests,
 * not the credentials.
 */

const SLOW = { timeout: 20_000 };

/** Seeds an admin session plus a browser-local demo history for the dashboard. */
function seedAdminSession(page: import("@playwright/test").Page, extra?: { withData?: boolean }) {
  return page.addInitScript(({ withData }) => {
    // Fully self-contained: the init script runs in the page world, where the
    // test module's constants do not exist — literals only (D-084's sibling
    // lesson: a failing seed silently reads as "not signed in").
    const id = "user-demo-admin";
    const email = "admin@vend3d.demo";
    const name = "Demo Admin";

    localStorage.setItem(
      "vend3d-auth-accounts",
      JSON.stringify([{ id, email, name, role: "admin" }]),
    );
    localStorage.setItem(
      "vend3d-auth-user",
      JSON.stringify({
        id,
        email,
        name,
        role: "admin",
        // Mirrors `writeSession`'s payload shape; 24h ≈ the mock's TTL.
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      }),
    );

    if (!withData) return;

    const order = (id: string, day: number, customer: string, totalCents: number) => ({
      id,
      checkoutKey: `key-${id}`,
      status: "Placed",
      createdAt: new Date(Date.UTC(2026, 10, day)).toISOString(),
      items: [],
      itemCount: 2,
      subtotalCents: totalCents - 500,
      shippingCents: 500,
      shippingMethodId: "standard",
      totalCents,
      address: {
        fullName: customer,
        email: `${customer.split(" ")[0].toLowerCase()}@example.com`,
        phone: "+92 300 1234567",
        address: "House 12",
        city: "Lahore",
        province: "Punjab",
        postalCode: "54000",
      },
      cardBrand: "VISA",
      cardLast4: "4242",
    });

    // The `{ state, version }` envelopes are the zustand partialize shapes the
    // AdminService reads (unit-tested in tests/unit/admin-service.test.ts).
    localStorage.setItem(
      "vend3d-orders",
      JSON.stringify({
        state: {
          orders: [
            order("ord-a1", 1, "Ayesha Khan", 5300),
            order("ord-b2", 2, "Bilal Ahmed", 4700),
            order("ord-c3", 3, "Sana Malik", 6100),
          ],
        },
        version: 0,
      }),
    );
    localStorage.setItem(
      "vend3d-designs",
      JSON.stringify({
        state: {
          designs: [{ id: "d-1", name: "Onyx tee", slug: "heavyweight-boxy-tee" }],
        },
        version: 0,
      }),
    );
  }, extra ?? { withData: true });
}

function seedShopperSession(page: import("@playwright/test").Page) {
  return page.addInitScript(() => {
    localStorage.setItem(
      "vend3d-auth-accounts",
      JSON.stringify([
        { id: "user-e2e", email: "ayesha@example.com", name: "Ayesha", role: "user" },
      ]),
    );
    localStorage.setItem(
      "vend3d-auth-user",
      JSON.stringify({
        id: "user-e2e",
        email: "ayesha@example.com",
        name: "Ayesha",
        role: "user",
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      }),
    );
  });
}

test.use({ reducedMotion: "reduce" });

test.describe("admin dashboard", () => {
  test("the demo admin sees the overview stats and the latest five orders", async ({ page }) => {
    await seedAdminSession(page);
    await page.goto("/admin");

    // Shell frame first: the storefront chrome stays off /admin (no duplicate
    // account menu), so the top bar's menu is the only one.
    await expect(page.getByRole("button", { name: "Account menu" })).toBeVisible(SLOW);
    await expect(page.getByRole("button", { name: "Open admin navigation" })).toBeHidden();
    await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Admin");

    await expect(page.getByRole("heading", { name: "Dashboard." })).toBeVisible(SLOW);
    await expect(page.getByTestId("admin-demo-banner")).toContainText("Demo data from this browser");

    // Stat cards read the seeded browser data: 3 orders, 5300+4700+6100 cents
    // of revenue, the static catalog's 4 products, 1 saved design.
    const stats = page.getByLabel("Overview stats");
    await expect(stats).toBeVisible(SLOW);
    await expect(stats).toContainText("$161.00");

    // Recent orders table: the three seeded rows, newest first.
    const table = page.getByRole("table");
    await expect(table).toBeVisible(SLOW);
    await expect(table.getByRole("row")).toHaveCount(4); // header + 3
    await expect(table.getByText("#C3")).toBeVisible(); // ord-c3, the newest
    await expect(table.getByText("Bilal Ahmed", { exact: true })).toBeVisible();
    await expect(table.getByText("$61.00", { exact: true })).toBeVisible();

    // The unbuilt screens are honest: quick actions are disabled with "Soon".
    await expect(page.getByRole("button", { name: /New product/ })).toBeDisabled();
    await expect(page.getByRole("button", { name: /View all orders/ })).toBeDisabled();
  });

  test("an empty browser shows the empty state, not a broken dashboard", async ({ page }) => {
    await seedAdminSession(page, { withData: false });
    await page.goto("/admin");

    await expect(page.getByRole("heading", { name: "No orders to show." })).toBeVisible(SLOW);
    // Stats still render with their zero values.
    await expect(page.getByLabel("Overview stats")).toContainText("Total orders");
  });

  test("an order row opens the detail placeholder in the admin frame", async ({ page }) => {
    await seedAdminSession(page);
    await page.goto("/admin");

    await page.getByRole("table").getByRole("link", { name: "#A1" }).click(SLOW);

    await expect(page).toHaveURL(/\/admin\/orders\/ord-a1$/, SLOW);
    await expect(page.getByRole("heading", { name: "Order detail" })).toBeVisible(SLOW);
    // The crumb narrates the section the interim screen belongs to.
    await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Orders");
  });
});

test.describe("admin gate", () => {
  test("a non-admin bouncing to /forbidden never sees admin content", async ({ page }) => {
    await seedShopperSession(page);
    await page.goto("/admin");

    await expect(page).toHaveURL(/\/forbidden/, SLOW);
    await expect(
      page.getByRole("heading", { name: "You don't have access to this page" }),
    ).toBeVisible(SLOW);
  });
});

test.describe("mobile admin shell", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  test("the sidebar becomes a slide-in sheet that opens and closes", async ({ page }) => {
    await seedAdminSession(page, { withData: false });
    await page.goto("/admin");

    await expect(page.getByRole("heading", { name: "Dashboard." })).toBeVisible(SLOW);
    const menu = page.getByRole("button", { name: "Open admin navigation" });
    await expect(menu).toBeVisible();

    await menu.click();
    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible(SLOW);
    // The sheet lists the same three destinations as the desktop sidebar,
    // including the visible-but-disabled "Soon" rows.
    await expect(sheet.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(sheet.getByText("Products")).toBeVisible();
    await expect(sheet.getByText("Soon").first()).toBeVisible();

    // Close via the sheet's own close button, then re-open and close by
    // Escape: both the pointer and the keyboard exit are real.
    await page.getByRole("button", { name: "Close admin navigation" }).click();
    await expect(sheet).toBeHidden(SLOW);

    await menu.click();
    await expect(sheet).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden(SLOW);
  });
});
