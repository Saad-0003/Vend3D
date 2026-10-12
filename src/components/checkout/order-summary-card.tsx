"use client";

import Image from "next/image";

import { formatCents } from "@/lib/format";
import { orderTotals } from "@/lib/checkout/order";
import { getShippingMethod } from "@/lib/checkout/shipping";
import { lineSummary } from "@/lib/cart/line-summary";
import type { CartLine } from "@/stores/cart-store";

/**
 * Sticky order summary. Display only — the cart store is the source of truth
 * for the lines and the order builder recomputes every total at checkout, so
 * nothing computed here is ever trusted (AGENTS.md: client totals are display).
 */
export function OrderSummaryCard({
  lines,
  shippingMethodId,
}: {
  lines: CartLine[];
  shippingMethodId: string;
}) {
  const totals = orderTotals(lines, shippingMethodId);
  const shipping = getShippingMethod(shippingMethodId);

  return (
    <aside
      aria-label="Order summary"
      className="flex flex-col gap-5 rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] p-6 [box-shadow:var(--inner-highlight)] lg:sticky lg:top-[96px]"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="lux-display text-[22px] text-[var(--ivory)]">Order summary</h2>
        <span className="lux-mono text-[11px] tracking-[0.14em] text-[var(--muted)] uppercase">
          {totals.itemCount} {totals.itemCount === 1 ? "item" : "items"}
        </span>
      </div>

      <ul className="flex flex-col gap-4">
        {lines.map((line) => {
          const chips = lineSummary(line);
          return (
            <li key={line.id} className="flex gap-3">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-[12px] bg-[var(--surface-3)]">
                {line.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={line.thumbnail} alt="" className="size-full object-cover" />
                ) : (
                  <Image
                    src={`/products/${line.slug}.png`}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                )}
                <span className="lux-mono absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[var(--ivory)] text-[10px] font-medium text-[var(--ink)] ring-2 ring-[var(--surface-1)]">
                  {line.qty}
                </span>
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="lux-display truncate text-[15px] text-[var(--ivory)]">{line.name}</span>
                {chips.length > 0 ? (
                  <ul aria-label={`Configuration for ${line.name}`} className="flex flex-wrap gap-1.5">
                    {chips.map((chip) => (
                      <li
                        key={chip.key}
                        className="lux-mono rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[9px] tracking-[0.12em] text-[var(--muted)] uppercase ring-1 ring-[var(--hairline)]"
                      >
                        {chip.label}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <span className="lux-mono lux-tabular shrink-0 text-[13px] text-[var(--ivory)]">
                {formatCents(line.unitCents * line.qty)}
              </span>
            </li>
          );
        })}
      </ul>

      <dl className="flex flex-col gap-3 border-t border-[var(--hairline)] pt-5 text-[14px]">
        <div className="flex items-baseline justify-between">
          <dt className="text-[var(--muted)]">Subtotal</dt>
          <dd className="lux-mono lux-tabular text-[var(--ivory)]" data-testid="summary-subtotal">
            {formatCents(totals.subtotalCents)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-[var(--muted)]">Shipping</dt>
          <dd className="text-right text-[13px] text-[var(--muted)]" data-testid="summary-shipping">
            {shipping?.label ?? "—"}
            {shipping && shipping.priceCents === 0 ? " · Free" : shipping ? ` · ${formatCents(shipping.priceCents)}` : ""}
          </dd>
        </div>
      </dl>

      <div className="flex items-baseline justify-between border-t border-[var(--hairline)] pt-5">
        <span className="lux-mono text-[11px] tracking-[0.16em] text-[var(--muted)] uppercase">Total</span>
        <span
          className="lux-mono lux-tabular text-[24px] text-[var(--ivory)]"
          aria-live="polite"
          data-testid="summary-total"
        >
          {formatCents(totals.totalCents)}
        </span>
      </div>

      <p className="lux-mono text-center text-[10px] tracking-[0.14em] text-[var(--muted)] uppercase">
        Demo checkout · no real charge
      </p>
    </aside>
  );
}
