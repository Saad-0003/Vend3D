import { expect, test } from "@playwright/test";

/**
 * Auth-adjacent screens (plan.md Phase 1B U3, DECISIONS.md D-093): the
 * forgot-password round trip, the resend cooldown, the /forbidden gate and the
 * forced session expiry.
 *
 * Everything runs against the mock AuthService — no Supabase yet — so what
 * these tests pin is the shopper-visible contract the real wiring must keep:
 * never send mail, never distinguish a registered email, never lock a demo
 * visitor out of the way back.
 */

const SLOW = { timeout: 20_000 };

const USER = { name: "Ayesha Khan", email: "ayesha@example.com", password: "supersecret1" };

/**
 * Signs a fresh browser in from the full login page. Sign-up is deliberately
 * avoided here so the expiry tests start from a session that already exists.
 */
async function signInAsUser(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    // The demo admin is seeded by any sign-in attempt, so the account used here
    // can be any email; the mock checks existence, not the secret.
    localStorage.setItem(
      "vend3d-auth-accounts",
      JSON.stringify([
        { id: "user-e2e", email: "ayesha@example.com", name: "Ayesha", role: "user" },
      ]),
    );
  });
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Sign in" }).first()).toBeEnabled(SLOW);
  // `pressSequentially` survives React replacing DOM nodes while hydration
  // settles (same helper contract as auth.spec.ts).
  await page.getByRole("main").getByLabel("Email", { exact: true }).pressSequentially(USER.email, { delay: 0 });
  await page.getByRole("main").getByLabel("Password", { exact: true }).pressSequentially(USER.password, { delay: 0 });
  // The navbar's island also exposes a "Sign in" — stay inside the form card.
  await page.getByRole("main").getByRole("button", { name: "Sign in" }).click();
  // Wait for *settled* content, not just a URL-bar flip: on WebKit a following
  // `page.goto` can be interrupted by the router's still-in-flight soft push.
  await expect(page.getByRole("heading", { level: 1, name: "Hi, Ayesha." })).toBeVisible(SLOW);
}

test.describe("forgot password", () => {
  test.slow();

  test("walks email validation, lands on check-email, and never claims a real email", async ({ page }) => {
    await page.goto("/forgot-password");

    await expect(page.getByTestId("forgot-demo-notice")).toBeVisible(SLOW);

    // Submitting an invalid address stays on the page and says why (twice:
    // inline and in the live region).
    await page.getByRole("main").getByLabel("Email", { exact: true }).pressSequentially("not-an-email", { delay: 0 });
    await page.getByRole("main").getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByText("Enter a valid email address").first()).toBeVisible(SLOW);
    await expect(page).toHaveURL(/\/forgot-password/, SLOW);

    // A valid address moves on to the check-email stop, echoing the address.
    await page.getByRole("main").getByLabel("Email", { exact: true }).pressSequentially("@example.com", { delay: 0 });
    await page.getByRole("main").getByRole("button", { name: "Send reset link" }).click();
    await expect(page).toHaveURL(/\/auth\/check-email\?email=/, SLOW);

    await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible(SLOW);
    await expect(page.getByTestId("check-email-copy")).toContainText("not-an-email@example.com");
    await expect(page.getByTestId("check-email-copy")).toContainText("No mail is actually sent");

    // The one way back.
    await expect(page.getByRole("link", { name: "Back to sign in" })).toHaveAttribute("href", "/login");
  });

  test("the resend cooldown disables the button for a full window", async ({ page }) => {
    await page.goto("/auth/check-email?email=ayesha@example.com");
    await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible(SLOW);

    const resend = page.getByRole("button", { name: /Resend/ });
    await expect(resend).toBeEnabled(SLOW);
    // The bare label, before the countdown takes over the accessible name.
    await resend.click();

    // Disabled with a legible countdown rather than a silent noop.
    await expect(resend).toBeDisabled();
    await expect(resend).toHaveText(/Resend in \d+s/, SLOW);

    // The window elapses and the button re-arms itself. This is the one
    // wall-clock wait in the suite; it is the actual behaviour under test.
    await expect(resend).toBeEnabled({ timeout: 45_000 });
    await expect(resend).toHaveText("Resend");
  });

  test("check-email keeps a ?next= hand-off from a signup hop", async ({ page }) => {
    await page.goto("/auth/check-email?email=ayesha@example.com&next=%2Faccount");
    await expect(page.getByRole("link", { name: "Back to sign in" })).toHaveAttribute(
      "href",
      "/login?next=%2Faccount",
      SLOW,
    );
  });
});

test.describe("forbidden gate", () => {
  test.slow();

  test("a non-admin opening /admin bounces to /forbidden", async ({ page }) => {
    // Seed the session directly and enter on /admin as the very first
    // navigation: arriving through sign-in leaves the router's soft push in
    // flight, and a following `goto` is reported as interrupted on WebKit. The
    // payload shape (and shelving) is exactly what `writeSession` persists.
    await page.addInitScript(() => {
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

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/forbidden/, SLOW);
    await expect(page.getByRole("heading", { name: "You don't have access to this page" })).toBeVisible(SLOW);

    await expect(page.getByRole("link", { name: "Back to shop" })).toHaveAttribute("href", "/shop");
    await expect(page.getByRole("link", { name: "Go to account" })).toHaveAttribute("href", "/account");
  });

  test("a non-admin's account menu has no Admin item; the demo admin's does", async ({ page }) => {
    await signInAsUser(page);

    await page.getByRole("button", { name: "Account menu" }).click();
    const menu = page.locator("[data-slot=popover-content]");
    await expect(menu).toBeVisible(SLOW);
    await expect(menu.getByRole("link", { name: "Admin" })).toHaveCount(0);

    // The admin role changes both the gate (below) and the menu item.
    await page.keyboard.press("Escape");
    await page.addInitScript(() => {
      // Rewrite the stored session's role the way the mock's own demo admin
      // would be stored (the `.demo` admin, seeded on sign-in — D-093). The
      // storage key is the mock service's own session key (D-093/D-051).
      const raw = localStorage.getItem("vend3d-auth-user");
      if (!raw) return;
      const user = JSON.parse(raw);
      localStorage.setItem("vend3d-auth-user", JSON.stringify({ ...user, role: "admin" }));
    });
    await page.reload();
    await expect(page.getByRole("button", { name: "Account menu" })).toBeVisible(SLOW);

    await page.getByRole("button", { name: "Account menu" }).click();
    await expect(menu.getByRole("link", { name: "Admin" })).toBeVisible(SLOW);
    await expect(menu.getByRole("link", { name: "Admin" })).toHaveAttribute("href", "/admin");
  });

  test("the demo admin reaches /admin", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("main").getByRole("button", { name: "Sign in" })).toBeEnabled(SLOW);
    // The labelled demo admin is seeded by the mock on any sign-in attempt
    // (.demo address, existence-only credential check — not security, D-093).
    await page
      .getByRole("main")
      .getByLabel("Email", { exact: true })
      .pressSequentially("admin@vend3d.demo", { delay: 0 });
    await page.getByRole("main").getByLabel("Password", { exact: true }).pressSequentially("not-a-real-secret", { delay: 0 });
    await page.getByRole("main").getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/(\/account|\/auth\/check-email)/, SLOW);

    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Back office" })).toBeVisible(SLOW);
    await expect(page).toHaveURL(/\/admin/, SLOW);
  });
});

test.describe("session expiry", () => {
  test.slow();

  test("an expired session shows the dialog and returns to the original page", async ({ page }) => {
    await signInAsUser(page);

    // Force expiry exactly the way the mock's own dev helper does
    // (`forceSessionExpiry`, D-093): move the persisted expiry into the past.
    // The storage key is `vend3d-auth-user`; it is not intercepted by Next.
    await page.evaluate(() => {
      const raw = localStorage.getItem("vend3d-auth-user");
      if (!raw) return;
      const session = JSON.parse(raw);
      localStorage.setItem(
        "vend3d-auth-user",
        JSON.stringify({ ...session, expiresAt: Date.now() - 1 }),
      );
    });

    // A fresh load on the guarded route: the store hydrates, sees the expired
    // session, and raises the dialog instead of a flat redirect.
    await page.goto("/account");
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Your session expired").first()).toBeVisible(SLOW);

    // "Sign in again" keeps ?next= pointing at the interrupted screen…
    await dialog.getByRole("link", { name: "Sign in again" }).click();
    await expect(page).toHaveURL("/login?next=%2Faccount", SLOW);

    // …and the ordinary sign-in completes the return.
    await expect(page.getByRole("main").getByRole("button", { name: "Sign in" })).toBeEnabled(SLOW);
    await page.getByRole("main").getByLabel("Email", { exact: true }).pressSequentially(USER.email, { delay: 0 });
    await page.getByRole("main").getByLabel("Password", { exact: true }).pressSequentially(USER.password, { delay: 0 });
    await page.getByRole("main").getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/account/, SLOW);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(`Hi, ${USER.name.split(" ")[0]}.`);
  });

  test("the expired dialog also covers admin routes", async ({ page }) => {
    await signInAsUser(page);
    await page.evaluate(() => {
      const raw = localStorage.getItem("vend3d-auth-user");
      if (!raw) return;
      const session = JSON.parse(raw);
      localStorage.setItem(
        "vend3d-auth-user",
        JSON.stringify({ ...session, expiresAt: Date.now() - 1, role: "admin" }),
      );
    });

    await page.goto("/admin");
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Your session expired").first()).toBeVisible(SLOW);
  });
});
