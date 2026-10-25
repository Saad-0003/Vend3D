"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MotionConfig } from "framer-motion";
import { Package, RotateCcw, Search } from "lucide-react";

import { BlurFade } from "@/components/ui/blur-fade";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { OrdersBodySkeleton } from "@/components/ui/route-skeletons";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatOrderDate, type OrderRecord } from "@/lib/checkout/order";
import { formatCents } from "@/lib/format";
import {
  ALL_ORDERS,
  ORDER_PAGE_SIZE,
  countOrdersByStatus,
  hasMoreOrders,
  nextOrderLimit,
  orderStatuses,
  orderThumbnailSummary,
  selectOrders,
  shortOrderId,
  visibleOrders,
} from "@/lib/orders/history";
import { reorderOrder } from "@/lib/orders/reorder";
import { useOrdersStore } from "@/stores/orders-store";

/** Panel/card reveal: the same recipe the account panels and shop grid use. */
const REVEAL = { inView: false, direction: "up", offset: 8, duration: 0.6, blur: "8px" } as const;

/**
 * `/orders` — the order history behind `RequireAuth`.
 *
 * The store is the only data source (Phase 2+ swaps its body for a paginated
 * query). Filters are local state rather than URL state: unlike `/designs`,
 * this list is short, private and not meant to be shared as a filtered link.
 *
 * The browser-local store has no `userId` yet. The ownership boundary is
 * therefore the same as `/account`: `RequireAuth` gates the mount and the
 * records live in this browser only. Phase 9's `userId`-scoped query replaces
 * `selectOrders`' input, not its callers (D-083).
 */
export function OrdersScreen() {
  const orders = useOrdersStore((s) => s.orders);
  const hydrated = useOrdersStore((s) => s.hydrated);

  const [status, setStatus] = useState<string>(ALL_ORDERS);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(ORDER_PAGE_SIZE);
  const [failed, setFailed] = useState(false);

  // Rehydrate explicitly instead of through `hydrate()` so a blocked or corrupt
  // storage read can surface as the screen's error state with a retry.
  const load = useCallback(() => {
    setFailed(false);
    try {
      void Promise.resolve(useOrdersStore.persist.rehydrate()).then(
        () => useOrdersStore.setState({ hydrated: true }),
        () => setFailed(true),
      );
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    if (hydrated) return;
    load();
  }, [hydrated, load]);

  const statuses = useMemo(() => orderStatuses(orders), [orders]);
  const counts = useMemo(() => countOrdersByStatus(orders), [orders]);
  const filtered = useMemo(() => selectOrders(orders, { status, query }), [orders, status, query]);
  const visible = useMemo(() => visibleOrders(filtered, limit), [filtered, limit]);

  function changeStatus(next: string) {
    setStatus(next);
    setLimit(ORDER_PAGE_SIZE);
  }

  function changeQuery(next: string) {
    setQuery(next);
    setLimit(ORDER_PAGE_SIZE);
  }

  function clearFilters() {
    setStatus(ALL_ORDERS);
    setQuery("");
    setLimit(ORDER_PAGE_SIZE);
  }

  const countLabel = failed
    ? "Orders unavailable"
    : hydrated
      ? `${orders.length} ${orders.length === 1 ? "order" : "orders"}`
      : "Loading orders…";

  return (
    <MotionConfig reducedMotion="user">
      <PageShell aria-label="Orders" className="lux flex flex-col gap-10">
        <PageHeader
          eyebrow="Account"
          title="Your orders."
          intro="Every demo order placed in this browser, newest first. Open one to revisit the receipt, or send its lines straight back to your cart."
        />

        <p className="lux-mono -mt-4 flex items-center gap-2 text-[12px] tracking-[0.14em] text-[var(--muted)] uppercase">
          <span aria-live="polite" className="lux-tabular text-[var(--ivory)]">
            {countLabel}
          </span>
        </p>

        {!hydrated && !failed ? (
          <div role="status" aria-label="Loading orders">
            <OrdersBodySkeleton />
          </div>
        ) : failed ? (
          <ErrorState
            title="We couldn't load your orders"
            body="This browser blocked or lost the local order store. Try again — if it keeps happening, clear this site's data and reload."
            onRetry={load}
          />
        ) : (
          <>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <Tabs value={status} onValueChange={changeStatus}>
                <TabsList
                  aria-label="Filter orders by status"
                  className="h-11 w-fit max-w-full justify-start overflow-x-auto rounded-full border border-[var(--hairline)] bg-transparent p-1"
                >
                  <TabsTrigger
                    value={ALL_ORDERS}
                    className="rounded-full px-4 text-[13px] text-[var(--muted)] data-[state=active]:bg-[var(--surface-2)] data-[state=active]:text-[var(--ivory)] data-[state=active]:ring-1 data-[state=active]:ring-[var(--hairline-strong)]"
                  >
                    All
                    <span className="lux-mono lux-tabular ml-2 text-[11px] text-[var(--faint)]">
                      {orders.length}
                    </span>
                  </TabsTrigger>
                  {statuses.map((value) => (
                    <TabsTrigger
                      key={value}
                      value={value}
                      className="rounded-full px-4 text-[13px] text-[var(--muted)] data-[state=active]:bg-[var(--surface-2)] data-[state=active]:text-[var(--ivory)] data-[state=active]:ring-1 data-[state=active]:ring-[var(--hairline-strong)]"
                    >
                      {value}
                      <span className="lux-mono lux-tabular ml-2 text-[11px] text-[var(--faint)]">
                        {counts[value] ?? 0}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <div className="relative w-full lg:max-w-[19rem]">
                <Search
                  className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[var(--muted)]"
                  strokeWidth={1.5}
                  aria-hidden
                />
                <Input
                  id="orders-search"
                  type="search"
                  value={query}
                  onChange={(event) => changeQuery(event.target.value)}
                  aria-label="Search orders by ID"
                  placeholder="Search by order ID"
                  className="h-11 rounded-full border-[var(--hairline)] bg-[var(--surface-1)] pr-4 pl-11 text-[13px] text-[var(--ivory)] placeholder:text-[var(--muted)]"
                />
              </div>
            </div>

            {orders.length === 0 ? (
              <EmptyState
                eyebrow="No orders yet"
                title="No orders yet."
                body="Place a demo order and it lands here, ready to open or reorder."
                icon={<Package className="size-7" strokeWidth={1.5} aria-hidden />}
                action={
                  <Button
                    asChild
                    className="h-12 rounded-full bg-[var(--ivory)] px-7 text-[15px] text-[var(--ink)] hover:bg-[var(--ivory)]/90"
                  >
                    <Link href="/shop">Browse the collection</Link>
                  </Button>
                }
              />
            ) : filtered.length === 0 ? (
              <EmptyState
                eyebrow="No matches"
                title="No orders match."
                body="Try another status or a different order ID."
                action={
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="h-11 rounded-full px-5 text-[var(--ivory)] ring-1 ring-[var(--hairline-strong)] hover:bg-[var(--surface-2)]"
                  >
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <>
                <ul aria-label="Order history" className="flex flex-col gap-4">
                  {visible.map((order, index) => (
                    <li key={order.id}>
                      <BlurFade {...REVEAL} delay={Math.min(index, ORDER_PAGE_SIZE) * 0.05}>
                        <OrderCard order={order} />
                      </BlurFade>
                    </li>
                  ))}
                </ul>

                {hasMoreOrders(filtered, limit) ? (
                  <div className="flex justify-center">
                    <Button
                      variant="ghost"
                      onClick={() => setLimit((current) => nextOrderLimit(current))}
                      className="h-11 rounded-full px-5 text-[var(--ivory)] ring-1 ring-[var(--hairline-strong)] hover:bg-[var(--surface-2)]"
                    >
                      Load more
                      <span className="lux-mono lux-tabular text-[11px] text-[var(--muted)]">
                        {filtered.length - visible.length} more
                      </span>
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </>
        )}
      </PageShell>
    </MotionConfig>
  );
}

function OrderCard({ order }: { order: OrderRecord }) {
  return (
    <article
      aria-label={`Order ${order.id}`}
      className="flex flex-col gap-5 rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] p-5 [box-shadow:var(--inner-highlight)] transition-colors duration-500 hover:border-[var(--hairline-strong)] sm:p-6"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h2
            title={order.id}
            className="lux-mono lux-tabular text-[13px] tracking-[0.08em] text-[var(--ivory)]"
          >
            #{shortOrderId(order.id)}
          </h2>
          <p className="text-[12px] text-[var(--muted)]">Placed {formatOrderDate(order.createdAt)}</p>
        </div>

        <Badge
          variant="outline"
          className="lux-mono rounded-full border-[color-mix(in_srgb,var(--lime)_35%,transparent)] bg-[var(--lime-glow)] px-2.5 py-1 text-[10px] tracking-[0.14em] text-[var(--lime)] uppercase"
        >
          {order.status}
        </Badge>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <OrderThumbnails order={order} />

        <div className="flex flex-col items-end gap-1">
          <span className="text-[13px] text-[var(--muted)]">
            {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
          </span>
          <span className="lux-mono lux-tabular text-[18px] text-[var(--ivory)]">
            {formatCents(order.totalCents)}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-[var(--hairline)] pt-4">
        <Button
          asChild
          variant="ghost"
          className="h-11 rounded-full px-5 text-[var(--ivory)] ring-1 ring-[var(--hairline-strong)] hover:bg-[var(--surface-2)]"
        >
          <Link href={`/order/${order.id}`}>View order</Link>
        </Button>

        <Button
          type="button"
          onClick={() => reorderOrder(order)}
          className="h-11 rounded-full bg-[var(--lime)] px-5 text-[var(--ink)] hover:bg-[var(--lime)]/90"
        >
          <RotateCcw className="size-4" strokeWidth={1.5} aria-hidden />
          Reorder
        </Button>
      </div>
    </article>
  );
}

function OrderThumbnails({ order }: { order: OrderRecord }) {
  const { items, extra } = orderThumbnailSummary(order);

  return (
    <ul aria-label={`Items in order ${shortOrderId(order.id)}`} className="flex items-center gap-2">
      {items.map((item) => (
        <li
          key={item.id}
          className="relative size-14 shrink-0 overflow-hidden rounded-[12px] bg-[var(--surface-3)] ring-1 ring-[var(--hairline)]"
        >
          {item.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.thumbnail} alt="" className="size-full object-cover" />
          ) : (
            <Image
              src={`/products/${item.slug}.png`}
              alt=""
              fill
              sizes="56px"
              className="object-cover"
            />
          )}
          <span className="sr-only">{item.name}</span>
        </li>
      ))}

      {extra > 0 ? (
        <li
          aria-label={`${extra} more ${extra === 1 ? "design" : "designs"}`}
          className="grid size-14 shrink-0 place-items-center rounded-[12px] border border-[var(--hairline)] bg-[var(--surface-2)]"
        >
          <span className="lux-mono lux-tabular text-[12px] text-[var(--muted)]" aria-hidden>
            +{extra}
          </span>
        </li>
      ) : null}
    </ul>
  );
}
