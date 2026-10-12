/**
 * Shipping methods and their prices.
 *
 * TODO(Phase 9): plan.md defines no shipping rule and no courier, so these are
 * **placeholder values** — the UI labels them as such rather than inventing a
 * carrier. Replace `priceCents` with the real table (and keep it in integer
 * cents) when the shipping decision lands; every consumer reads it from here.
 */

export const SHIPPING_METHODS = [
  {
    id: "standard",
    label: "Standard",
    eta: "4–6 business days",
    priceCents: 0,
  },
  {
    id: "express",
    label: "Express",
    eta: "2–3 business days",
    priceCents: 900,
  },
] as const;

export type ShippingMethodId = (typeof SHIPPING_METHODS)[number]["id"];
export type ShippingMethod = (typeof SHIPPING_METHODS)[number];

export const SHIPPING_METHOD_IDS = SHIPPING_METHODS.map((m) => m.id);

/** Placeholder marker surfaced next to the radio group in the details step. */
export const SHIPPING_TODO_NOTE = "Placeholder rates — plan.md sets no shipping rule yet.";

export function getShippingMethod(id: string | undefined): ShippingMethod | undefined {
  return SHIPPING_METHODS.find((m) => m.id === id);
}

/** Shipping is part of the money path, so it is read in cents, never formatted here. */
export function shippingPriceCents(id: string | undefined): number {
  return getShippingMethod(id)?.priceCents ?? 0;
}
