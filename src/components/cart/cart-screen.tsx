"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { ArrowRight, ShoppingBag } from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CartLineList } from "@/components/shared/cart-line-item";
import { formatCents } from "@/lib/format";
import { products } from "@/lib/catalog";
import { selectCartCount, selectSubtotalCents, useCartStore } from "@/stores/cart-store";

/**
 * `/cart`: line items on the left, a sticky summary on the right. Shipping is
 * calculated at checkout, as plan.md defines no shipping rule and no promo codes,
 * so neither a promo field nor a shipping figure is shown here.
 */
export function CartScreen() {
  const lines = useCartStore((s) => s.lines);
  const hydrated = useCartStore((s) => s.hydrated);
  const hydrate = useCartStore((s) => s.hydrate);
  const count = selectCartCount(lines);
  const subtotal = selectSubtotalCents(lines);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <PageShell aria-label="Cart" className="lux flex flex-col gap-10">
      <PageHeader
        eyebrow="Cart"
        title="Your cart."
        intro={hydrated && lines.length > 0 ? `${count} ${count === 1 ? "item" : "items"} ready. Shipping is calculated at checkout.` : undefined}
      />

      {!hydrated ? (
        <div role="status" aria-label="Loading cart" className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-36 w-full rounded-[var(--inner-radius)]" />
            <Skeleton className="h-36 w-full rounded-[var(--inner-radius)]" />
          </div>
          <Skeleton className="h-64 w-full rounded-[var(--card-radius)]" />
        </div>
      ) : lines.length === 0 ? (
        <CartEmpty />
      ) : (
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_360px]">
          <CartLineList lines={lines} />

          <aside
            aria-label="Order summary"
            className="flex flex-col gap-5 rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] p-6 [box-shadow:var(--inner-highlight)] lg:sticky lg:top-[96px]"
          >
            <h2 className="lux-display text-[22px] text-[var(--ivory)]">Summary</h2>

            <dl className="flex flex-col gap-3 text-[15px]">
              <div className="flex items-baseline justify-between">
                <dt className="text-[var(--muted)]">Subtotal</dt>
                <dd className="lux-mono lux-tabular text-[var(--ivory)]">{formatCents(subtotal)}</dd>
              </div>
              <div className="flex items-baseline justify-between">
                <dt className="text-[var(--muted)]">Shipping</dt>
                <dd className="text-[13px] text-[var(--muted)]">Calculated at checkout</dd>
              </div>
            </dl>

            <div className="flex items-baseline justify-between border-t border-[var(--hairline)] pt-5">
              <span className="lux-mono text-[11px] tracking-[0.16em] text-[var(--muted)] uppercase">Total</span>
              <span className="lux-mono lux-tabular text-[24px] text-[var(--ivory)]" aria-live="polite">
                {formatCents(subtotal)}
              </span>
            </div>

            <Button asChild className="h-12 rounded-full bg-[var(--ivory)] text-[15px] font-medium text-[var(--ink)] hover:bg-[var(--ivory)]/90">
              <Link href="/checkout">
                Checkout
                <ArrowRight className="size-4" strokeWidth={1.5} aria-hidden />
              </Link>
            </Button>

            <p className="lux-mono text-center text-[10px] tracking-[0.14em] text-[var(--muted)] uppercase">
              Dispatched in 48 hours · Demo checkout, no real charge
            </p>
          </aside>
        </div>
      )}
    </PageShell>
  );
}

function CartEmpty() {
  const suggestions = products.slice(0, 4);
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col items-start gap-5 rounded-[var(--card-radius)] border border-dashed border-[color-mix(in_srgb,var(--lime)_35%,transparent)] bg-[var(--surface-1)] p-10">
        <span className="flex size-12 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--lime)] ring-1 ring-[var(--hairline)]">
          <ShoppingBag className="size-5" strokeWidth={1.5} aria-hidden />
        </span>
        <h2 className="lux-display text-[32px] text-[var(--ivory)]">Your cart is empty.</h2>
        <p className="max-w-md text-[15px] leading-[1.6] text-[var(--muted)]">
          Shape a blank in the studio and it will appear here, ready to check out.
        </p>
        <Button asChild className="h-12 rounded-full bg-[var(--ivory)] px-7 text-[var(--ink)] hover:bg-[var(--ivory)]/90">
          <Link href="/shop">Browse the shop</Link>
        </Button>
      </div>

      <section aria-labelledby="cart-suggest" className="flex flex-col gap-5">
        <h2 id="cart-suggest" className="lux-eyebrow text-[var(--lime)]">Start with a blank</h2>
        <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {suggestions.map((p) => (
            <li key={p.id}>
              <Link
                href={`/products/${p.id}`}
                className="flex flex-col gap-3 rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] p-3 transition-colors duration-300 hover:border-[var(--hairline-strong)]"
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[var(--inner-radius)] bg-[var(--surface-2)]">
                  <Image src={p.image} alt="" fill sizes="(max-width: 1024px) 50vw, 240px" className="object-cover" />
                </div>
                <span className="lux-display px-1 text-[16px] text-[var(--ivory)]">{p.name}</span>
                <span className="lux-mono px-1 pb-1 text-[12px] text-[var(--muted)]">{formatCents(p.priceCents)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
