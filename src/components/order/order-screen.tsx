"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Printer } from "lucide-react";

import { ConfirmationCheck } from "@/components/order/confirmation-check";
import { OrderTimeline } from "@/components/order/order-timeline";
import { PageShell } from "@/components/ui/page-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { lineSummary } from "@/lib/cart/line-summary";
import { formatCents } from "@/lib/format";
import { getShippingMethod } from "@/lib/checkout/shipping";
import { cardBrandLabel } from "@/lib/payment/card";
import { useOrdersStore, type OrderRecord } from "@/stores/orders-store";

/**
 * `/order/[id]` — the demo confirmation screen (plan.md Phase 9).
 *
 * Read-only by design: it only ever reads a record `placeOrder` already wrote
 * and never updates state. An unknown id renders the not-found panel instead of
 * crashing, which is the whole of the "no email sending required" note — nothing
 * here sends anything.
 *
 * Order records live in a client store until Phase 9's server action lands
 * (DECISIONS.md D-048), so this screen is deliberately browser-local: the
 * not-found copy says so rather than implying a lost server-side order.
 */
export function OrderScreen({ id }: { id: string }) {
  const hydrated = useOrdersStore((s) => s.hydrated);
  const hydrate = useOrdersStore((s) => s.hydrate);
  const order = useOrdersStore((s) => s.orders.find((o) => o.id === id) ?? null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <PageShell aria-label="Order confirmation" className="lux flex flex-col gap-10">
      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-10">
        {!hydrated ? (
          <OrderSkeleton />
        ) : !order ? (
          <NotFound />
        ) : (
          <>
            <OrderConfirmation order={order} />
            <OrderProgress />
            <OrderSummary order={order} />
            <OrderActions />
          </>
        )}
      </div>
    </PageShell>
  );
}

/** Centred confirmation: the drawn check, the serif line, the mono order number. */
function OrderConfirmation({ order }: { order: OrderRecord }) {
  return (
    <section aria-labelledby="order-confirmed" className="flex flex-col items-center gap-6 pt-4 text-center sm:pt-10">
      <ConfirmationCheck />

      <div className="flex flex-col gap-3">
        <h1 id="order-confirmed" className="lux-h2 lux-display text-[var(--ivory)]">
          Your order is in production.
        </h1>
        <p className="text-[15px] leading-[1.6] text-[var(--muted)] sm:text-[17px]">
          A demo confirmation, no real charge was made.
        </p>
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <span className="lux-eyebrow text-[var(--muted)]">Order number</span>
        <span className="lux-mono lux-tabular text-[13px] tracking-[0.08em] text-[var(--ivory)] break-all">
          {order.id}
        </span>
      </div>
    </section>
  );
}

/** Fulfilment stages plus the dispatch promise. */
function OrderProgress() {
  return (
    <section
      aria-labelledby="order-progress"
      className="flex flex-col gap-5 rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] p-6 [box-shadow:var(--inner-highlight)] sm:p-7"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h2 id="order-progress" className="lux-eyebrow text-[var(--lime)]">
          Progress
        </h2>
        <span className="text-[13px] text-[var(--muted)]">Dispatch within 48 hours</span>
      </div>

      <OrderTimeline />
    </section>
  );
}

/** Items with thumbnails and chips, the address, and the money rows. */
function OrderSummary({ order }: { order: OrderRecord }) {
  const shipping = getShippingMethod(order.shippingMethodId);

  return (
    <section
      aria-labelledby="order-summary"
      className="flex flex-col gap-6 rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] p-6 [box-shadow:var(--inner-highlight)] sm:p-7"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h2 id="order-summary" className="lux-eyebrow text-[var(--lime)]">
          Order summary
        </h2>
        <span className="lux-mono text-[11px] tracking-[0.14em] text-[var(--muted)] uppercase">
          {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
        </span>
      </div>

      <ul aria-label="Order items" className="flex flex-col gap-3">
        {order.items.map((item, index) => {
          const chips = lineSummary({
            id: item.id,
            slug: item.slug,
            name: item.name,
            configuration: item.configuration,
            // `lineSummary` reads slug + configuration only; the thumbnail is
            // rendered separately from the (optional) snapshot.
            thumbnail: item.thumbnail ?? "",
            qty: item.qty,
            unitCents: item.unitCents,
          });

          return (
            <li key={item.id} className="flex gap-4">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-[12px] bg-[var(--surface-3)]">
                {item.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.thumbnail} alt="" className="size-full object-cover" />
                ) : (
                  <Image
                    src={`/products/${item.slug}.png`}
                    alt=""
                    fill
                    sizes="64px"
                    // The first row is the LCP image on this route.
                    priority={index === 0}
                    className="object-cover"
                  />
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="lux-display truncate text-[15px] text-[var(--ivory)]">{item.name}</span>
                  <span className="lux-mono lux-tabular shrink-0 text-[13px] text-[var(--ivory)]">
                    {formatCents(item.unitCents * item.qty)}
                  </span>
                </div>
                <span className="lux-mono text-[11px] tracking-[0.12em] text-[var(--muted)] uppercase">
                  Qty {item.qty} · {formatCents(item.unitCents)} each
                </span>
                {chips.length > 0 ? (
                  <ul aria-label={`Configuration for ${item.name}`} className="flex flex-wrap gap-1.5">
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
            </li>
          );
        })}
      </ul>

      <div className="hairline-t flex flex-col gap-3 pt-5 text-[14px]">
        <div className="flex flex-col gap-1">
          <span className="lux-mono text-[10px] tracking-[0.16em] text-[var(--muted)] uppercase">Ship to</span>
          <span className="text-[13px] text-[var(--ivory)]">
            {order.address.fullName}
            <br />
            <span className="text-[var(--muted)]">
              {order.address.address}, {order.address.city}, {order.address.province}
              {order.address.postalCode ? ` ${order.address.postalCode}` : ""}
            </span>
            <br />
            <span className="text-[var(--muted)]">{order.address.phone}</span>
          </span>
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <span className="lux-mono text-[10px] tracking-[0.16em] text-[var(--muted)] uppercase">Shipping</span>
          <span className="text-[13px] text-[var(--ivory)]">
            {shipping?.label ?? order.shippingMethodId} · {shipping?.eta ?? "—"}
          </span>
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <span className="lux-mono text-[10px] tracking-[0.16em] text-[var(--muted)] uppercase">Payment</span>
          <span className="text-[13px] text-[var(--ivory)]">
            {cardBrandLabel(order.cardBrand)} ending {order.cardLast4}
          </span>
        </div>
      </div>

      <dl className="hairline-t flex flex-col gap-3 pt-5 text-[14px]">
        <div className="flex items-baseline justify-between">
          <dt className="text-[var(--muted)]">Subtotal</dt>
          <dd className="lux-mono lux-tabular text-[var(--ivory)]">{formatCents(order.subtotalCents)}</dd>
        </div>
        <div className="flex items-baseline justify-between">
          <dt className="text-[var(--muted)]">Shipping</dt>
          <dd className="lux-mono lux-tabular text-[var(--ivory)]">
            {order.shippingCents === 0 ? "Free" : formatCents(order.shippingCents)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-[var(--hairline)] pt-3">
          <dt className="lux-mono text-[11px] tracking-[0.16em] text-[var(--muted)] uppercase">Total</dt>
          <dd className="lux-mono lux-tabular text-[22px] text-[var(--ivory)]">{formatCents(order.totalCents)}</dd>
        </div>
      </dl>
    </section>
  );
}

/** Primary back to the shop; secondary to designs; receipt printing is optional. */
function OrderActions() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild className="h-11 rounded-full bg-[var(--lime)] px-6 text-[15px] font-medium text-[var(--ink)] hover:bg-[var(--lime)]/90">
          <Link href="/shop">Back to shop</Link>
        </Button>
        <Button
          asChild
          variant="ghost"
          className="h-11 rounded-full px-5 text-[15px] text-[var(--ivory)] ring-1 ring-[var(--hairline-strong)] hover:bg-[var(--surface-2)]"
        >
          <Link href="/designs">View designs</Link>
        </Button>
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={() => window.print()}
        className="h-11 self-start rounded-full px-5 text-[15px] text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ivory)]"
      >
        <Printer className="size-4" strokeWidth={1.5} aria-hidden />
        Print receipt
      </Button>
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex flex-col items-center gap-5 rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--lime)_35%,transparent)] bg-[var(--surface-1)] px-6 py-16 text-center">
      <span className="lux-eyebrow text-[var(--muted)]">Not found</span>
      <h2 className="lux-display text-[22px] text-[var(--ivory)]">Order not found.</h2>
      <p className="max-w-md text-[15px] leading-[1.6] text-[var(--muted)]">
        Orders live in this browser for the demo. If you cleared site data or opened this link on another
        device, the order is no longer readable here.
      </p>
      <Button asChild className="mt-2 h-11 rounded-full bg-[var(--lime)] px-6 text-[15px] font-medium text-[var(--ink)] hover:bg-[var(--lime)]/90">
        <Link href="/shop">Browse the shop</Link>
      </Button>
    </div>
  );
}

function OrderSkeleton() {
  return (
    <div role="status" aria-label="Loading order" className="flex flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-5">
        <Skeleton className="size-20 rounded-full" />
        <Skeleton className="h-8 w-72 rounded-[var(--inner-radius)]" />
        <Skeleton className="h-4 w-64 rounded-[var(--inner-radius)]" />
      </div>
      <Skeleton className="h-44 w-full rounded-[var(--card-radius)]" />
      <Skeleton className="h-72 w-full rounded-[var(--card-radius)]" />
    </div>
  );
}
