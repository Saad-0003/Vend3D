import { expect, test } from "@playwright/test";

/**
 * The informational pages (`/how-it-works`, `/materials`, `/cad-specs`,
 * `/production-times`, `/warranty`, `/contact`) and the footer wiring that
 * reaches them.
 *
 * These pages share one template (`components/info/info-page.tsx`), so what is
 * asserted here is the contract every one of them must satisfy: the header, the
 * scroll-spy table of contents, the plain-grid table style, the closing band,
 * and the fact that every footer word actually navigates.
 *
 * Locators are scoped and `exact` where a label repeats, for the same reason as
 * the auth spec: the footer newsletter field shares an "Email address" label
 * with other forms.
 */

const SLOW = { timeout: 20_000 };

const PAGES = [
  { path: "/how-it-works", heading: /From a browser tab to a parcel in 48 hours\./ },
  { path: "/materials", heading: /Four blanks, chosen because they take decoration well\./ },
  { path: "/cad-specs", heading: /Everything a printer needs to know\./ },
  { path: "/production-times", heading: /48 hours from order to dispatch\./ },
  { path: "/warranty", heading: /Checked before it ships\. Backed by a person if it isn't\./ },
  { path: "/contact", heading: /Talk to the people who print it\./ },
];

test.describe("informational pages", () => {
  // Each route is compiled on its first visit by the dev server (D-052).
  test.slow();

  for (const page_ of PAGES) {
    test(`${page_.path} renders the shared template`, async ({ page }) => {
      await page.goto(page_.path);

      await expect(page.getByRole("heading", { level: 1 })).toHaveText(page_.heading, SLOW);
      await expect(page.getByRole("navigation", { name: "On this page" })).toBeVisible(SLOW);

      // Mono eyebrow above the serif H1, and the closing band's primary pill.
      const eyebrow = page.locator(".lux-eyebrow").first();
      await expect(eyebrow).toBeVisible();
      await expect(eyebrow).toHaveCSS("font-family", /mono/i);

      const closing = page.getByRole("link", { name: /Start designing|Contact us/ });
      await expect(closing.first()).toBeVisible();
    });
  }

  test("the table of contents scroll-spies and deep-links", async ({ page }) => {
    await page.goto("/how-it-works");
    const toc = page.getByRole("navigation", { name: "On this page" });

    // First entry is marked current on arrival.
    await expect(toc.getByRole("link").first()).toHaveAttribute("aria-current", "true", SLOW);

    // Clicking an entry moves the section into view and updates the marker.
    const faq = toc.getByRole("link", { name: "Common questions" });
    await faq.click();
    await expect(faq).toHaveAttribute("aria-current", "true");
    expect(page.url()).toContain("#faq");

    const section = page.locator("#faq");
    // Lenis smooth-scrolls, so poll for the settle rather than snapshotting
    // mid-animation.
    await expect
      .poll(async () => (await section.boundingBox())?.y ?? Number.NaN, { timeout: 10_000 })
      .toBeLessThan(200);
    // Cleared of the sticky navbar and sitting in the top band of the viewport.
    const box = await section.boundingBox();
    expect(box!.y).toBeGreaterThan(-40);
  });

  test("every spec table is a full 1px grid with no fills", async ({ page }) => {
    await page.goto("/cad-specs");

    const table = page.locator("table").first();
    await expect(table).toBeVisible(SLOW);

    const cell = table.locator("th").first();
    await expect(cell).toHaveCSS("border-top-width", "1px");
    await expect(cell).toHaveCSS("border-right-width", "1px");
    await expect(cell).toHaveCSS("border-bottom-width", "1px");
    await expect(cell).toHaveCSS("border-left-width", "1px");
    await expect(cell).toHaveCSS("border-top-style", "solid");
    // No fill, and no zebra on the alternating rows.
    await expect(cell).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(table.locator("tbody tr").nth(1).locator("td").first()).toHaveCSS(
      "background-color",
      "rgba(0, 0, 0, 0)",
    );

    // Header row is told apart by weight, not by colour.
    await expect(cell).toHaveCSS("font-weight", "600");
  });

  test("a material card previews gloss and matte", async ({ page }) => {
    await page.goto("/materials");

    const sphere = page.getByRole("button", { name: /Heavyweight cotton/ });
    await expect(sphere).toBeVisible(SLOW);
    await expect(sphere).toHaveAttribute("aria-pressed", "false");
    await expect(sphere).toContainText("Matte");

    await sphere.click();
    await expect(sphere).toHaveAttribute("aria-pressed", "true");
    await expect(sphere).toContainText("Gloss");
  });

  test("the contact form confirms with a toast and clears itself", async ({ page }) => {
    await page.goto("/contact");

    const submit = page.getByRole("button", { name: "Send message" });
    await expect(submit).toBeDisabled(SLOW);

    // `pressSequentially`, not `fill`: these are controlled React inputs, and
    // `fill` writes the DOM value directly without going through React's value
    // tracker — which is what makes React skip the later reset (the same reason
    // the auth spec's helper types this way).
    await page.getByLabel("Name").pressSequentially("Ayesha Khan", { delay: 0 });
    await page.getByLabel("Email", { exact: true }).pressSequentially("ayesha@example.com", { delay: 0 });
    await page.getByLabel("Message").pressSequentially("Do you print on the cap crown?", { delay: 0 });
    await expect(submit).toBeEnabled(SLOW);

    await submit.click();
    await expect(page.getByText("Message ready to send")).toBeVisible(SLOW);
    // Nothing is sent, and the form resets.
    await expect(page.getByLabel("Name")).toHaveValue("");
    await expect(submit).toBeDisabled();
  });

  test("an unconfirmed fact ships as a note, never as copy", async ({ page }) => {
    await page.goto("/production-times");
    await expect(page.getByText(/TODO: confirm with owner/).first()).toBeVisible(SLOW);
  });
});

test.describe("the informational pages hold up at five widths", () => {
  test.slow();

  for (const width of [390, 768, 1024, 1280, 1440]) {
    test(`${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/materials");

      await expect(page.getByRole("heading", { level: 1 })).toBeVisible(SLOW);
      await expect(page.getByRole("navigation", { name: "On this page" })).toBeVisible();

      // No horizontal overflow: the chip row and the spec tables scroll inside
      // their own containers instead of widening the document.
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }
});

test.describe("footer wiring", () => {
  test.slow();

  const FOOTER_WORDS: { label: string; href: string }[] = [
    { label: "Catalog", href: "/shop" },
    { label: "3D Studio", href: "/studio" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "Materials Library", href: "/materials" },
    { label: "CAD Specs", href: "/cad-specs" },
    { label: "Production Times", href: "/production-times" },
    { label: "Warranty", href: "/warranty" },
    { label: "Direct Line", href: "/contact" },
  ];

  for (const word of FOOTER_WORDS) {
    test(`"${word.label}" navigates to ${word.href}`, async ({ page }) => {
      await page.goto("/");
      // The home page is the heaviest first compile in the suite, so this keeps
      // the budget `test.slow()` gives it rather than capping at 20s.
      await page
        .getByRole("contentinfo")
        .getByRole("link", { name: word.label, exact: true })
        .click();
      await expect(page).toHaveURL(new RegExp(`${word.href}$`), { timeout: 60_000 });
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 30_000 });
    });
  }

  test('the testimonials band\'s "See all reviews" reaches /reviews', async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /See all reviews/ }).click();
    await expect(page).toHaveURL(/\/reviews$/, SLOW);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Creators launch drops without waiting.",
    );
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBe(0);
  });

  test('the newsletter "Join" confirms and clears the field', async ({ page }) => {
    await page.goto("/");
    const field = page.getByRole("contentinfo").getByLabel("Email address");
    await field.pressSequentially("engineer@example.com", { delay: 0 });
    await page.getByRole("contentinfo").getByRole("button", { name: "Join" }).click();

    await expect(page.getByText("You're on the list")).toBeVisible(SLOW);
    await expect(field).toHaveValue("", { timeout: 10_000 });
  });
});
