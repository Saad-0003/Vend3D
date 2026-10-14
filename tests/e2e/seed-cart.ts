import type { Page } from "@playwright/test";

/**
 * Seeds a cart through an init script instead of walking the studio.
 *
 * The studio's customizer chunk is the heaviest route in the app, and compiling
 * it in every worker starves the dev server for the rest of the suite (D-052).
 * It also keeps the cart drawer out of the flow: the `/cart` page's own Checkout
 * button walks the same shopper-visible path without a dialog in the way.
 *
 * Shared by the checkout spec and the legal spec, which needs to reach the
 * review step to assert its terms checkbox.
 */
export async function seedCart(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const line = {
      id: "line-e2e",
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
