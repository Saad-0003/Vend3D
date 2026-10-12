import { expect, test } from "@playwright/test";

/**
 * `/account` — the signed-in shell (plan.md Phase 3).
 *
 * The redirect for a signed-out shopper is already pinned by
 * `auth.spec.ts` ("a signed-out shopper is redirected to /login?next= and
 * returns after"), so this spec covers what lives behind that guard: the panel
 * navigation, the address dialog, the settings confirmation and the two
 * layouts the tab list switches between.
 *
 * Locators are scoped and `exact` where a label is shared, for the same reason
 * as the auth spec: the footer newsletter field duplicates common labels.
 */

const SLOW = { timeout: 20_000 };

const USER = { name: "Ayesha Khan", email: "ayesha@example.com", password: "supersecret1" };

/** Creates the account through the navbar dialog, then opens `/account`. */
async function signUpAndOpenAccount(page: import("@playwright/test").Page) {
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

  await page.goto("/account");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(USER.name.split(" ")[0], SLOW);
}

test.describe("account", () => {
  // Each test signs up first, and the first visit to /account has to compile it.
  test.slow();

  test("opens on the profile panel, addressed by first name", async ({ page }) => {
    await signUpAndOpenAccount(page);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(`Hi, ${USER.name.split(" ")[0]}.`);
    await expect(page.getByRole("heading", { level: 2, name: "Profile" })).toBeVisible();
    await expect(page.getByLabel("Full name")).toHaveValue(USER.name);
    await expect(page.getByLabel("Email", { exact: true })).toHaveValue(USER.email);
  });

  test("saving the profile confirms with a toast", async ({ page }) => {
    await signUpAndOpenAccount(page);

    await page.getByLabel("Full name").fill("Ayesha K");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Profile updated")).toBeVisible(SLOW);
  });

  test("every tab opens its panel", async ({ page }) => {
    await signUpAndOpenAccount(page);

    for (const [tab, panel] of [
      ["Orders", "No orders yet."],
      ["Saved designs", "Nothing shaped yet."],
      ["Addresses", "No addresses yet."],
      ["Settings", "Delete account"],
    ] as const) {
      await page.getByRole("tab", { name: new RegExp(`^${tab}`) }).click();
      await expect(page.getByText(panel).first()).toBeVisible(SLOW);
    }
  });

  test("an address can be added through the dialog", async ({ page }) => {
    await signUpAndOpenAccount(page);
    await page.getByRole("tab", { name: /^Addresses/ }).click();

    await page.getByRole("button", { name: "Add address" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible(SLOW);

    // Save stays disabled until the address is actually fillable.
    const save = dialog.getByRole("button", { name: "Save address" });
    await expect(save).toBeDisabled();

    await dialog.getByLabel("Full name").fill(USER.name);
    await dialog.getByLabel("Street address").fill("House 12, Street 4, Gulberg");
    await dialog.getByLabel("City").fill("Lahore");
    await dialog.getByLabel("Postal code").fill("54000");
    await expect(save).toBeEnabled();
    await save.click();

    await expect(dialog).toBeHidden();
    await expect(page.getByText("House 12, Street 4, Gulberg")).toBeVisible(SLOW);
    await expect(page.getByText("Address added")).toBeVisible(SLOW);
  });

  test("deleting the account asks for confirmation first", async ({ page }) => {
    await signUpAndOpenAccount(page);
    await page.getByRole("tab", { name: /^Settings/ }).click();

    const marketing = page.getByRole("switch").first();
    await expect(marketing).not.toBeChecked();
    await marketing.click();
    await expect(marketing).toBeChecked();

    await page.getByRole("button", { name: "Delete account" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible(SLOW);
    await expect(dialog.getByText("Delete your account?")).toBeVisible();

    // Backing out leaves the session alone.
    await dialog.getByRole("button", { name: "Keep account" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("button", { name: "Account menu" })).toBeVisible();
  });

  test("the tab list is operable from the keyboard", async ({ page }) => {
    await signUpAndOpenAccount(page);

    // The orientation follows the breakpoint and settles one effect after the
    // first paint, so wait for it before trusting arrow keys.
    const tabs = page.getByRole("tablist");
    await expect(tabs).toHaveAttribute("aria-orientation", "vertical", SLOW);

    await page.getByRole("tab", { name: /^Profile/ }).focus();
    await page.keyboard.press("ArrowDown");
    // Radix activates on navigation, so the arrow both moves and opens.
    await expect(page.getByRole("tab", { name: /^Orders/ })).toHaveAttribute("data-state", "active");
    await expect(page.getByRole("heading", { level: 2, name: "Orders" })).toBeVisible(SLOW);
  });
});

test.describe("account on a phone", () => {
  test.slow();
  test.use({ viewport: { width: 390, height: 844 } });

  test("the tab list is a horizontal chip row and the panel sits below it", async ({ page }) => {
    await signUpAndOpenAccount(page);

    const tabs = page.getByRole("tablist");
    await expect(tabs).toHaveAttribute("aria-orientation", "horizontal", SLOW);
    const first = await page.getByRole("tab", { name: /^Profile/ }).boundingBox();
    const second = await page.getByRole("tab", { name: /^Orders/ }).boundingBox();
    const panel = await page.getByRole("heading", { level: 2, name: "Profile" }).boundingBox();

    expect(first && second && panel).toBeTruthy();
    // Chips share a row (same y, side by side) …
    expect(Math.abs(first!.y - second!.y)).toBeLessThan(4);
    expect(second!.x).toBeGreaterThan(first!.x + first!.width - 1);
    // … and the panel is underneath, not beside, them.
    expect(panel!.y).toBeGreaterThan(first!.y + first!.height);
    // The row scrolls rather than wrapping, so nothing is pushed off-screen silently.
    await expect(tabs).toHaveCSS("overflow-x", "auto");
  });
});
