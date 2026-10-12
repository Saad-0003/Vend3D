import { expect, test } from "@playwright/test";

/**
 * Authentication UI (plan.md Phase 3, DECISIONS.md D-051).
 *
 * Phase 3 wires Supabase Auth; until then this is the mock service behind the
 * same interface, so what these tests pin is the contract the real service must
 * satisfy: the dialog, the split pages, the session round trip, the navbar menu
 * and the `?next=` guard.
 *
 * Locators are scoped and `exact` on purpose: the footer's newsletter field also
 * exposes an "Email address" label, and the form-wide live region repeats the
 * first field's message for screen readers.
 */

const SLOW = { timeout: 20_000 };

const USER = { name: "Ayesha Khan", email: "ayesha@example.com", password: "supersecret1" };

/** Clicks through the signup tab with a valid account, from the navbar dialog. */
async function signUpFromDialog(page: import("@playwright/test").Page) {
  await page.goto("/shop");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("tab", { name: "Create account" }).click();

  const panel = page.getByRole("tabpanel");
  await panel.getByLabel("Full name").fill(USER.name);
  await panel.getByLabel("Email", { exact: true }).fill(USER.email);
  await panel.getByLabel("Password", { exact: true }).fill(USER.password);
  await panel.getByLabel("Confirm password").fill(USER.password);
  await panel.getByRole("button", { name: "Create account" }).click();
}

/**
 * Waits for a full-page auth form to be interactive, then fills it.
 *
 * On a dev server the first visit to a route has to compile it, and React only
 * attaches handlers after hydration. The submit button's disabled state is the
 * component's own gate for that window (`AuthForm`), and `pressSequentially`
 * re-resolves the element on every keystroke, which survives React replacing a
 * DOM node while hydration settles.
 *
 * `mode` picks the submit label, which is also how the helper knows it is on the
 * right page: `/login` submits with "Sign in", `/signup` with "Create account".
 */
async function fillAuthForm(
  page: import("@playwright/test").Page,
  mode: "signin" | "signup",
  values: { name?: string; email: string; password: string; confirmPassword?: string },
) {
  const main = page.getByRole("main");
  const submitLabel = mode === "signup" ? "Create account" : "Sign in";

  await expect(main.getByRole("button", { name: submitLabel })).toBeEnabled(SLOW);

  const type = (label: string, value: string, exact = false) =>
    main.getByLabel(label, { exact }).pressSequentially(value, { delay: 0 });

  if (mode === "signup") await type("Full name", values.name ?? "Ayesha Khan");
  await type("Email", values.email, true);
  await type("Password", values.password, true);
  if (mode === "signup") await type("Confirm password", values.confirmPassword ?? values.password);
}

test.describe("authentication", () => {
  // These tests walk /account → /login → /signup, and a dev server compiles each
  // route on first visit. `test.slow()` triples the budget for exactly that (the
  // same reason the checkout spec uses it for /order/[id]).
  test.slow();

  test("the sign-in dialog opens from the navbar and validates inline", async ({ page }) => {
    await page.goto("/shop");
    await page.getByRole("button", { name: "Sign in" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible(SLOW);
    await expect(dialog.getByRole("tab", { name: "Sign in" })).toHaveAttribute("aria-selected", "true");

    // Submitting empty surfaces the field errors, announced in a live region.
    await dialog.getByRole("button", { name: "Sign in" }).click();
    await expect(dialog.getByText("Email is required")).toHaveCount(2, SLOW);
    await expect(dialog.getByTestId("auth-live")).toContainText("Email is required");
  });

  test("the password visibility toggle reveals and re-hides the value", async ({ page }) => {
    await page.goto("/shop");
    await page.getByRole("button", { name: "Sign in" }).click();
    const panel = page.getByRole("tabpanel");

    await panel.getByLabel("Password", { exact: true }).fill(USER.password);
    await expect(panel.getByLabel("Password", { exact: true })).toHaveAttribute("type", "password");

    await panel.getByRole("button", { name: "Show password" }).click();
    await expect(panel.getByLabel("Password", { exact: true })).toHaveAttribute("type", "text");
    await expect(panel.getByLabel("Password", { exact: true })).toHaveValue(USER.password);

    await panel.getByRole("button", { name: "Hide password" }).click();
    await expect(panel.getByLabel("Password", { exact: true })).toHaveAttribute("type", "password");
  });

  test("signs up from the dialog, toasts, and shows the account menu", async ({ page }) => {
    await signUpFromDialog(page);

    // Toast + navbar switch to the signed-in menu.
    await expect(page.getByText("Welcome back.")).toBeVisible(SLOW);
    await page.getByRole("button", { name: "Account menu" }).click();

    const menu = page.locator("[data-slot=popover-content]");
    await expect(menu).toBeVisible(SLOW);
    await expect(menu).toContainText(USER.email);
    for (const item of ["Account", "Designs", "Orders"]) {
      await expect(menu.getByRole("link", { name: item })).toBeVisible();
    }
    await expect(menu.getByRole("button", { name: "Sign out" })).toBeVisible();
  });

  test("signs out and returns to the shop", async ({ page }) => {
    await signUpFromDialog(page);
    await expect(page.getByRole("button", { name: "Account menu" })).toBeVisible(SLOW);

    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("button", { name: "Sign out" }).click();

    await expect(page).toHaveURL(/\/shop/, SLOW);
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible(SLOW);
  });

  test("a signed-out shopper is redirected to /login?next= and returns after", async ({ page }) => {
    await page.goto("/account");
    await expect(page).toHaveURL("/login?next=%2Faccount", SLOW);

    // The full login page links to sign-up and carries `?next=` through the
    // hop, so creating an account still returns to the guarded route.
    await page.getByRole("link", { name: "Create one" }).click();
    await expect(page).toHaveURL("/signup?next=%2Faccount", SLOW);

    await fillAuthForm(page, "signup", USER);
    await page.getByRole("main").getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(/\/account/, SLOW);
    // `/account` greets the shopper by first name (see `account.spec.ts`).
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(`Hi, ${USER.name.split(" ")[0]}.`);
  });

  test("rejects an unknown email with a non-enumerating message", async ({ page }) => {
    await page.goto("/login");
    await fillAuthForm(page, "signin", USER);
    await page.getByRole("main").getByRole("button", { name: "Sign in" }).click();

    // Identical to the wrong-password message: the form must not reveal whether
    // an email is registered. Assert the visible banner, not the live region.
    await expect(page.getByText("Incorrect email or password.").last()).toBeVisible(SLOW);
  });

  test("refuses an unsafe ?next= target", async ({ page }) => {
    await page.goto("/signup");
    await fillAuthForm(page, "signup", USER);
    await page.getByRole("main").getByRole("button", { name: "Create account" }).click();

    // An absolute URL would be sanitised away, never followed.
    await expect(page).toHaveURL(/\/account/, SLOW);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(`Hi, ${USER.name.split(" ")[0]}.`);
  });

  test("the full pages render the split layout with the stage and the form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible(SLOW);
    // The serif landing line lives on the stage, hidden below `lg`.
    await expect(page.getByRole("heading", { name: "See it. Shape it. Own it." })).toBeVisible();

    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible(SLOW);
    await expect(page.getByLabel("Confirm password")).toBeVisible();
  });

  test("a click before React hydrates never puts the password in the URL", async ({ page }) => {
    // On a client-side navigation, React attaches the form's handlers only once
    // hydration finishes. A click before that must not perform a native form
    // submission, which would GET the password straight into the URL.
    await page.goto("/login");
    await page.getByRole("link", { name: "Create one" }).click();
    await expect(page).toHaveURL("/signup?next=%2Faccount", SLOW);

    await fillAuthForm(page, "signup", USER);
    await page.getByRole("main").getByRole("button", { name: "Create account" }).click();

    // Nowhere in the address bar, and the account was created.
    await expect(page).toHaveURL(/\/account/, SLOW);
    expect(page.url()).not.toContain("password");
    expect(page.url()).not.toContain(encodeURIComponent(USER.password));
  });

  test("Enter submits the form from a field", async ({ page }) => {
    // Sign-up, so a successful submit has somewhere to go.
    await page.goto("/signup");
    await fillAuthForm(page, "signup", USER);

    // Keyboard users must be able to submit without reaching for the button.
    await page.getByRole("main").getByLabel("Password", { exact: true }).press("Enter");
    await expect(page).toHaveURL("/account", SLOW);
    expect(page.url()).not.toContain("password");
  });

  test("the dialog and the account menu carry the lux palette into their portal", async ({ page }) => {
    // Radix portals mount at `document.body`, which is outside the `.lux`
    // ancestor that defines `--surface-1`/`--hairline`/`--ivory`. A portalled
    // surface that forgets `lux` renders fully transparent with unset text —
    // invisible to typecheck, lint and every DOM-based assertion, because the
    // markup and the classes are all still there. Assert the *computed* values.
    await page.goto("/shop");
    await page.getByRole("button", { name: "Sign in" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible(SLOW);
    await expect(dialog).toHaveCSS("background-color", "rgb(16, 16, 18)");

    // The same bug in the signed-in half of the feature.
    await page.getByRole("tab", { name: "Create account" }).click();
    const panel = page.getByRole("tabpanel");
    await panel.getByLabel("Full name").fill(USER.name);
    await panel.getByLabel("Email", { exact: true }).fill(USER.email);
    await panel.getByLabel("Password", { exact: true }).fill(USER.password);
    await panel.getByLabel("Confirm password").fill(USER.password);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByRole("button", { name: "Account menu" })).toBeVisible(SLOW);

    await page.getByRole("button", { name: "Account menu" }).click();
    const menu = page.locator("[data-slot=popover-content]");
    await expect(menu).toBeVisible(SLOW);
    await expect(menu).toHaveCSS("background-color", "rgb(16, 16, 18)");
  });
});
