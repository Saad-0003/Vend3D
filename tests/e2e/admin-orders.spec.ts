import { expect, test } from "@playwright/test";

/**
 * Admin orders (plan.md Phase 1B U6) end to end: a user places a real demo
 * order through checkout, the admin advances its status from `/admin/orders`,
 * and the customer's `/order/[id]` timeline reflects the change — plus the
 * list mechanics (search / filter / sort / load more) and the detail screens
 * against a seeded `vend3d-orders` envelope.
 *
 * Seeding follows the admin specs' conventions with one twist: the flow test
 * deliberately does NOT use `addInitScript`, because the same browser switches
 * identity (user → admin → user) mid-test and an init script would reseed the
 * original session on every navigation. Sessions are written with
 * `page.evaluate` on a settled page instead — the same pattern `orders.spec`
 * uses for its cart.
 */

const SLOW = { timeout: 20_000 };

const USER = { name: "Ayesha Khan", email: "ayesha@example.com" };

test.use({ reducedMotion: "reduce" });

/* ------------------------------------------------------------------ seeding */

function userSession() {
  return {
    id: "user-e2e",
    email: USER.email,
    name: USER.name,
    role: "user",
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  };
}

function adminSession() {
  return {
    id: "admin-seed",
    email: "admin@vend3d.demo",
    name: "Demo Admin",
    role: "admin",
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  };
}

function setSession(page: import("@playwright/test").Page, session: object) {
  return page.evaluate((value) => {
    localStorage.setItem("vend3d-auth-accounts", JSON.stringify([value]));
    localStorage.setItem("vend3d-auth-user", JSON.stringify(value));
  }, session);
}

/** Twelve complete demo orders; statuses cycle Placed / Processing / Cancelled. */
function seedOrdersEnvelope(page: import("@playwright/test").Page) {
  return page.addInitScript(() => {
    function makeOrder(index: number) {
      const statuses = ["Placed", "Processing", "Cancelled"];
      const createdAt = new Date(Date.UTC(2026, 10, 1 + index, 9, 0)).toISOString();
      const id = `ord-seed-${String(index + 1).padStart(2, "0")}`;
      return {
        id,
        checkoutKey: `ck-${id}`,
        status: statuses[index % statuses.length],
        createdAt,
        items: [
          {
            id: `${id}-item`,
            slug: "heavyweight-boxy-tee",
            name: "Heavyweight Boxy Tee",
            configuration: {
              parts: { body: { color: "#1b1b1d", finish: 40 } },
              decal: null,
              engrave: { enabled: false, text: "", font: "mono" },
              extras: { size: "M" },
            },
            qty: 2,
            unitCents: 4800,
          },
        ],
        itemCount: 2,
        subtotalCents: 9600,
        shippingCents: 0,
        shippingMethodId: "standard",
        totalCents: 9600,
        address: {
          email: `customer${index + 1}@example.com`,
          fullName: `Customer ${index + 1}`,
          phone: "+92 300 1234567",
          address: "House 12, Street 4",
          city: "Lahore",
          province: "Punjab",
          postalCode: "54000",
        },
        cardBrand: "VISA",
        cardLast4: "4242",
        statusHistory: [{ status: "Placed", at: createdAt }],
      };
    }

    localStorage.setItem(
      "vend3d-auth-accounts",
      JSON.stringify([adminSession()]),
    );
    localStorage.setItem("vend3d-auth-user", JSON.stringify(adminSession()));
    localStorage.setItem(
      "vend3d-orders",
      JSON.stringify({
        state: { orders: Array.from({ length: 12 }, (_, index) => makeOrder(index)) },
        version: 0,
      }),
    );

    function adminSession() {
      return {
        id: "admin-seed",
        email: "admin@vend3d.demo",
        name: "Demo Admin",
        role: "admin",
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      };
    }
  });
}

/** Writes the cart's persisted payload once; the next full load hydrates it. */
async function seedCartOnce(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    const line = {
      id: "line-e2e-admin-orders",
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

/** Walks the three checkout steps, like `orders.spec`, ending on /order/[id]. */
async function placeDemoOrder(page: import("@playwright/test").Page) {
  await page.goto("/cart");
  await expect(page.getByRole("list", { name: "Cart items" })).toBeVisible(SLOW);
  await page.getByRole("link", { name: "Checkout" }).last().click();

  const checkout = page.getByRole("main", { name: "Checkout" });
  await expect(page).toHaveURL(/\/checkout/, SLOW);

  await checkout.getByLabel("Email").fill(USER.email);
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

/* ----------------------------------------------------- placed-order journey */

test.describe("admin orders journey", () => {
  test.slow();

  test("a placed order is updatable by the admin and the customer sees it", async ({ page }) => {
    // ── 1. The user places a demo order (no init scripts: identity swaps later).
    await page.goto("/shop");
    await expect(page.getByRole("list", { name: "Archive" })).toBeVisible(SLOW);
    await setSession(page, userSession());
    await seedCartOnce(page);
    const orderId = await placeDemoOrder(page);

    // ── 2. The admin opens the list; the row is there as Placed.
    await setSession(page, adminSession());
    await page.goto("/admin/orders");

    const row = page.getByTestId("admin-order-row").filter({ hasText: orderId });
    await expect(row).toBeVisible(SLOW);
    await expect(row.getByTestId("admin-order-status")).toHaveAttribute("data-order-status", "Placed");

    // ── 3. Inline status change, confirmed before it lands.
    await row.getByTestId("admin-order-status-select").click();
    await page.getByTestId("admin-order-move-processing").click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    await dialog.getByTestId("admin-order-confirm").click();

    await expect(row.getByTestId("admin-order-status")).toHaveAttribute(
      "data-order-status",
      "Processing",
      SLOW,
    );

    // ── 4. The detail screen: real sections replace the U4 placeholder.
    await row.getByRole("link", { name: orderId }).click();
    await expect(page).toHaveURL(new RegExp(`/admin/orders/${orderId}$`), SLOW);
    await expect(page.getByTestId("admin-order-id")).toHaveText(orderId, SLOW);

    // Items with money snapshots and the readable configuration summary.
    const items = page.getByRole("list", { name: "Order items" });
    const firstItem = items.getByRole("listitem").first();
    await expect(firstItem).toContainText("Heavyweight Boxy Tee");
    await expect(firstItem).toContainText("Qty 2 · $48.00 each");
    await expect(firstItem).toContainText("Onyx");

    // Payment is brand + last4 only — never more (AGENTS §Security).
    await expect(page.getByText("VISA ending 4242")).toBeVisible();
    const main = page.getByRole("main");
    await expect(main).not.toContainText("4242424242424242");

    // Notes are admin-only and timestamped.
    await page.getByTestId("admin-note-input").fill("Proof approved by the customer.");
    await page.getByTestId("admin-note-add").click();
    await expect(page.getByTestId("admin-order-note").first()).toContainText(
      "Proof approved by the customer.",
      SLOW,
    );

    // ── 5. The design export is the item's Configuration as JSON.
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      firstItem.getByRole("button", { name: "Download design JSON" }).click(),
    ]);
    const chunks: Buffer[] = [];
    for await (const chunk of await download.createReadStream()) chunks.push(chunk as Buffer);
    const exported = JSON.parse(Buffer.concat(chunks).toString("utf8")) as {
      orderId: string;
      configuration: unknown;
    };
    expect(exported.orderId).toBe(orderId);
    expect(exported.configuration).toMatchObject({ parts: { body: { color: "#1b1b1d" } } });

    // ── 6. Admin advances to Shipped from the detail updater.
    await page.getByTestId("admin-order-detail-update").click();
    await page.getByTestId("admin-detail-move-shipped").click();
    await expect(page.getByRole("alertdialog").getByTestId("admin-order-detail-confirm")).toBeVisible();
    await page.getByTestId("admin-order-detail-confirm").click();

    await expect(
      page
        .getByRole("main")
        .locator("ol[aria-label='Status history'] li")
        .last(),
    ).toContainText("Shipped", SLOW);

    // ── 7. Back as the customer: their /order/[id] reflects it, notes do not leak.
    await setSession(page, userSession());
    await page.goto(`/order/${orderId}`);

    const active = page.locator("ol[aria-label='Order progress'] li[aria-current='step']");
    await expect(active).toHaveText("Shipped", SLOW);
    await expect(page.getByText("Proof approved by the customer.")).toHaveCount(0);
  });
});

/* ------------------------------------------------------------- list mechanics */

test.describe("admin orders list mechanics", () => {
  test("pagination, search, status filter and date sort over seeded rows", async ({ page }) => {
    await seedOrdersEnvelope(page);
    await page.goto("/admin/orders");

    await expect(page.getByRole("heading", { name: "Orders." })).toBeVisible(SLOW);
    await expect(page.getByTestId("admin-orders-banner")).toContainText("Demo data from this browser");

    // Page one holds the store's load-more page size; a second page exists.
    const rows = page.getByTestId("admin-order-row");
    await expect(rows).toHaveCount(10);
    await page.getByTestId("admin-orders-load-more").click();
    await expect(rows).toHaveCount(12);

    // Search by customer email fragment…
    await page.getByTestId("admin-orders-search").fill("customer7@");
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText("customer7@example.com");
    // …and by order id, tolerating a leading `#`.
    await page.getByTestId("admin-orders-search").fill("#seed-07");
    await expect(rows).toHaveCount(1);
    await page.getByTestId("admin-orders-search").fill("zzz-not-here");
    await expect(page.getByText("Nothing fits those filters.")).toBeVisible();
    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(rows).toHaveCount(12);

    // Status filter matches the demo vocabulary exactly.
    await page.getByRole("combobox", { name: "Filter by status" }).click();
    await page.getByRole("option", { name: "Cancelled" }).click();
    await expect(rows).toHaveCount(4); // seeds 3, 6, 9, 12
    await expect(page.getByTestId("admin-order-status").first()).toHaveAttribute(
      "data-order-status",
      "Cancelled",
    );

    // Date sort flips the same result set's ordering.
    await page.getByRole("combobox", { name: "Filter by status" }).click();
    await page.getByRole("option", { name: "All statuses" }).click();
    await page.getByRole("combobox", { name: "Sort by date" }).click();
    await page.getByRole("option", { name: "Oldest first" }).click();
    await expect(rows.first()).toContainText("ord-seed-01");
    await page.getByRole("combobox", { name: "Sort by date" }).click();
    await page.getByRole("option", { name: "Newest first" }).click();
    await expect(rows.first()).toContainText("ord-seed-12");
  });

  test("an empty browser shows the empty state, not an error", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "vend3d-auth-accounts",
        JSON.stringify([{ id: "admin-seed", email: "admin@vend3d.demo", name: "Demo Admin", role: "admin" }]),
      );
      localStorage.setItem(
        "vend3d-auth-user",
        JSON.stringify({
          id: "admin-seed",
          email: "admin@vend3d.demo",
          name: "Demo Admin",
          role: "admin",
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        }),
      );
    });
    await page.goto("/admin/orders");

    await expect(page.getByRole("heading", { name: "Orders." })).toBeVisible(SLOW);
    await expect(page.getByText("The list is empty.")).toBeVisible(SLOW);
    await expect(page.getByRole("button", { name: "Reload" })).toBeVisible();
  });

  test("inline status change requires confirmation and lands in the envelope", async ({ page }) => {
    await seedOrdersEnvelope(page);
    await page.goto("/admin/orders");

    const row = page.getByTestId("admin-order-row").filter({ hasText: "ord-seed-01" });
    // Newest-first pagination: seed-01 sits on page two, so load it first.
    await page.getByTestId("admin-orders-load-more").click();
    await expect(row).toBeVisible(SLOW);
    await row.getByTestId("admin-order-status-select").click();
    await expect(page.getByTestId("admin-order-move-processing")).toBeVisible();
    await expect(page.getByTestId("admin-order-move-shipped")).toHaveCount(0);
    await expect(page.getByTestId("admin-order-move-delivered")).toHaveCount(0);

    // …and every change is confirmed before it lands.
    await page.getByTestId("admin-order-move-processing").click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(/processing/i);
    await dialog.getByTestId("admin-order-confirm").click();

    await expect(row.getByTestId("admin-order-status")).toHaveAttribute(
      "data-order-status",
      "Processing",
      SLOW,
    );

    // The store really changed — read the envelope straight back.
    const stored = await page.evaluate(() => {
      const raw = localStorage.getItem("vend3d-orders");
      if (!raw) return "missing";
      const parsed = JSON.parse(raw) as { state?: { orders?: { id: string; status: string }[] } };
      return parsed.state?.orders?.find((o) => o.id === "ord-seed-01")?.status ?? "not-found";
    });
    expect(stored).toBe("Processing");
  });

  test("a cancelled seed row is terminal — no transitions offered", async ({ page }) => {
    await seedOrdersEnvelope(page);
    await page.goto("/admin/orders");

    const row = page.getByTestId("admin-order-row").filter({ hasText: "ord-seed-03" });
    await expect(row.getByTestId("admin-order-status")).toHaveAttribute(
      "data-order-status",
      "Cancelled",
      SLOW,
    );

    // Cancelled is final in the demo: the dropdown is disabled, the tooltip explains.
    const trigger = row.getByTestId("admin-order-status-select");
    await expect(trigger).toBeDisabled();
    await expect(trigger).toHaveAttribute("title", /final in the demo/);
  });
});

/* -------------------------------------------------------------- detail extras */

test.describe("admin order detail extras", () => {
  test("a delivered order is final and unknown ids get the not-found panel", async ({ page }) => {
    await seedOrdersEnvelope(page);
    await page.goto("/admin/orders/ord-seed-01");

    // Seed 01 is Placed: first advance it to Delivered via two confirmed moves.
    await expect(page.getByTestId("admin-order-id")).toBeVisible(SLOW);
    await page.getByTestId("admin-order-detail-update").click();
    await page.getByTestId("admin-detail-move-processing").click();
    await page.getByTestId("admin-order-detail-confirm").click();
    await page.getByTestId("admin-order-detail-update").click();
    await page.getByTestId("admin-detail-move-shipped").click();
    await page.getByTestId("admin-order-detail-confirm").click();
    await page.getByTestId("admin-order-detail-update").click();
    await page.getByTestId("admin-detail-move-delivered").click();
    await page.getByTestId("admin-order-detail-confirm").click();

    const update = page.getByTestId("admin-order-detail-update");
    await expect(update).toBeDisabled(SLOW);
    await expect(update).toHaveAttribute("title", /Final/i);

    // Unknown id → honest browser-local not-found panel.
    await page.goto("/admin/orders/ord-missing");
    await expect(page.getByText("Order not found.")).toBeVisible(SLOW);
    await expect(page.getByRole("link", { name: "Back to all orders" })).toBeVisible();
  });
});
