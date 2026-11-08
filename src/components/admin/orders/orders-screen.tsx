"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, PackageOpen, ReceiptText, Search } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  nextOrderStatuses,
  formatOrderDate,
  type OrderRecord,
} from "@/lib/checkout/order";
import { formatCents } from "@/lib/format";
import {
  ORDER_PAGE_SIZE,
  hasMoreOrders,
  nextOrderLimit,
  visibleOrders,
} from "@/lib/orders/history";
import { selectAdminOrders, type AdminOrderSort } from "@/lib/admin/orders-ops";
import { adminOrdersService } from "@/lib/admin/orders-service";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/checkout/order";
import { OrderStatusChip } from "@/components/admin/orders/order-status-chip";

/**
 * The admin orders list (plan.md Phase 1B U6). Reads this browser's demo
 * orders through the `AdminOrdersService` seam — the same `vend3d-orders`
 * store the customer checkout writes — and advances statuses in place, so
 * `/order/[id]` reflects every change on its next hydrate. Phase 10 swaps the
 * service body; the screen only ever knows the interface.
 *
 * States shipped: loading skeleton, populated with "Load more", a
 * "no matches" empty variant and the storage-blocked error with retry.
 */
export function OrdersScreen() {
  const [all, setAll] = useState<OrderRecord[]>([]);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [filters, setFilters] = useState<{
    query: string;
    status: string;
    sort: AdminOrderSort;
  }>({ query: "", status: "all", sort: "newest" });

  const load = useCallback(() => {
    setPhase("loading");
    let cancelled = false;
    adminOrdersService
      .listOrders()
      .then((orders) => {
        if (cancelled) return;
        setAll(orders);
        setPhase("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setPhase("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => load(), [load]);

  /** In-place row update after a confirmed change: no skeleton flash, "Load more" stays. */
  const replaceOrder = useCallback((next: OrderRecord) => {
    setAll((orders) => orders.map((order) => (order.id === next.id ? next : order)));
  }, []);

  if (phase === "loading") return <OrdersSkeleton />;
  if (phase === "error") {
    return (
      <ErrorState
        title="We couldn't read the order list"
        body="This browser blocked or lost its local stores. Try again — if it keeps happening, reload the page once and check that this browser allows site data."
        onRetry={load}
      />
    );
  }

  return (
    <OrdersContent
      all={all}
      filters={filters}
      onFilters={setFilters}
      reload={load}
      replaceOrder={replaceOrder}
    />
  );
}

function OrdersContent({
  all,
  filters,
  onFilters,
  reload,
  replaceOrder,
}: {
  all: OrderRecord[];
  filters: { query: string; status: string; sort: AdminOrderSort };
  onFilters: React.Dispatch<
    React.SetStateAction<{ query: string; status: string; sort: AdminOrderSort }>
  >;
  reload: () => void;
  replaceOrder: (order: OrderRecord) => void;
}) {
  const [limit, setLimit] = useState(ORDER_PAGE_SIZE);
  const matched = all.length ? selectAdminOrders(all, filters) : [];
  const visible = visibleOrders(matched, limit);
  const hasFilters = filters.query.trim() !== "" || filters.status !== "all";

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Back office"
        title="Orders."
        intro="Every demo order this browser has placed, with the fulfilment states it can walk."
      />

      <p
        data-testid="admin-orders-banner"
        className="lux-mono rounded-full border border-[var(--hairline)] bg-[var(--surface-1)] px-4 py-2.5 text-[11px] tracking-[0.08em] text-[var(--muted)]"
      >
        Demo data from this browser only — orders move to the database in Phase&nbsp;10.
      </p>

      <div className="flex w-full flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 min-[560px]:w-64 min-[560px]:flex-none min-[560px]:grow-0">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[var(--faint)]"
            strokeWidth={1.5}
            aria-hidden
          />
          <Input
            value={filters.query}
            onChange={(event) => onFilters((f) => ({ ...f, query: event.target.value }))}
            placeholder="Search order id or email"
            aria-label="Search orders by id or email"
            data-testid="admin-orders-search"
            className="h-11 rounded-full bg-[var(--surface-1)] pl-10 text-[14px]"
          />
        </div>
        <Select
          value={filters.status}
          onValueChange={(value) => onFilters((f) => ({ ...f, status: value }))}
        >
          <SelectTrigger
            aria-label="Filter by status"
            className="h-11 w-[9.5rem] rounded-full bg-[var(--surface-1)] text-[13px]"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(["Placed", "Processing", "Shipped", "Delivered", "Cancelled"] as const).map(
              (status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
        <Select
          value={filters.sort}
          onValueChange={(value) =>
            onFilters((f) => ({ ...f, sort: value as AdminOrderSort }))
          }
        >
          <SelectTrigger
            aria-label="Sort by date"
            className="h-11 w-[10.5rem] rounded-full bg-[var(--surface-1)] text-[13px]"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {visible.length === 0 ? (
        hasFilters ? (
          <EmptyState
            eyebrow="No matches"
            title="Nothing fits those filters."
            body="Try a different search or status — or clear the filters to see every order."
            icon={<ReceiptText className="size-7" strokeWidth={1.5} aria-hidden />}
            action={
              <Button
                variant="outline"
                className="h-11 rounded-full px-6"
                onClick={() => onFilters({ query: "", status: "all", sort: "newest" })}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            eyebrow="No orders yet"
            title="The list is empty."
            body="No demo order has been placed in this browser yet. Place one from the storefront and it appears here."
            icon={<PackageOpen className="size-7" strokeWidth={1.5} aria-hidden />}
            action={
              <Button className="h-11 rounded-full px-6" onClick={reload}>
                Reload
              </Button>
            }
          />
        )
      ) : (
        <div className="overflow-hidden rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] [box-shadow:var(--inner-highlight)]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="lux-mono pl-5 text-[10px] tracking-[0.14em] text-[var(--muted)] uppercase">
                  Order
                </TableHead>
                <TableHead className="lux-mono text-[10px] tracking-[0.14em] text-[var(--muted)] uppercase">
                  Customer
                </TableHead>
                <TableHead className="lux-mono text-[10px] tracking-[0.14em] text-[var(--muted)] uppercase">
                  Placed
                </TableHead>
                <TableHead className="lux-mono text-[10px] tracking-[0.14em] text-[var(--muted)] uppercase">
                  Items
                </TableHead>
                <TableHead className="lux-mono text-[10px] tracking-[0.14em] text-[var(--muted)] uppercase">
                  Total
                </TableHead>
                <TableHead className="lux-mono pr-5 text-[10px] tracking-[0.14em] text-[var(--muted)] uppercase">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((order) => (
                <OrderRow key={order.id} order={order} replaceOrder={replaceOrder} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {hasMoreOrders(matched, limit) && visible.length > 0 ? (
        <div className="flex justify-center">
          <Button
            variant="outline"
            className="h-11 rounded-full px-6"
            onClick={() => setLimit(nextOrderLimit(limit))}
            data-testid="admin-orders-load-more"
          >
            Load more
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------- row */

function OrderRow({
  order,
  replaceOrder,
}: {
  order: OrderRecord;
  replaceOrder: (order: OrderRecord) => void;
}) {
  const [pending, setPending] = useState<OrderStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const allowed = nextOrderStatuses(order.status);

  function apply(status: OrderStatus) {
    setBusy(true);
    adminOrdersService
      .setOrderStatus(order.id, status)
      .then((result) => {
        if (!result.ok) {
          toast(result.error);
          return;
        }
        toast(`Order marked ${status.toLowerCase()}.`);
        replaceOrder(result.order);
      })
      .finally(() => setBusy(false));
  }

  return (
    <TableRow data-testid="admin-order-row" data-order-id={order.id} className="group">
      <TableCell className="pl-5 align-top">
        <Link
          href={`/admin/orders/${order.id}`}
          className="lux-mono text-[13px] text-[var(--ivory)] underline-offset-4 group-hover:text-[var(--lime)] group-hover:underline"
        >
          {order.id}
        </Link>
      </TableCell>
      <TableCell className="align-top">
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[14px] text-[var(--ivory)]">{order.address.fullName}</span>
          <span className="truncate text-[12px] text-[var(--muted)]">{order.address.email}</span>
        </span>
      </TableCell>
      <TableCell className="text-[13px] text-[var(--muted)] align-top tabular-nums">
        {formatOrderDate(order.createdAt)}
      </TableCell>
      <TableCell className="text-[13px] text-[var(--muted)] align-top tabular-nums">
        {order.itemCount}
      </TableCell>
      <TableCell className="text-[14px] text-[var(--ivory)] align-top tabular-nums">
        {formatCents(order.totalCents)}
      </TableCell>
      <TableCell className="pr-5 align-top">
        <div className="flex items-center gap-2">
          <OrderStatusChip status={order.status} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={allowed.length === 0 || busy}>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Change status for order ${order.id}`}
                data-testid="admin-order-status-select"
                title={
                  allowed.length === 0
                    ? `A ${order.status.toLowerCase()} order is final in the demo`
                    : "Change status"
                }
                className="size-7 rounded-full text-[var(--muted)] hover:text-[var(--ivory)]"
              >
                <ChevronDown className="size-4" strokeWidth={1.5} aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[10rem]">
              {allowed.map((status) => (
                <DropdownMenuItem
                  key={status}
                  data-testid={`admin-order-move-${status.toLowerCase()}`}
                  onSelect={() => setPending(status)}
                >
                  {status === "Cancelled" ? `Cancel order…` : `Mark ${status.toLowerCase()}`}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
      <StatusConfirm
        pending={pending}
        busy={busy}
        order={order}
        onConfirm={() => {
          if (!pending) return;
          apply(pending);
          setPending(null);
        }}
        onCancel={() => setPending(null)}
      />
    </TableRow>
  );
}

/* ----------------------------------------------------------------- confirm */

function StatusConfirm({
  pending,
  busy,
  order,
  onConfirm,
  onCancel,
}: {
  pending: OrderStatus | null;
  busy: boolean;
  order: OrderRecord;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AlertDialog open={pending !== null} onOpenChange={(open) => (open ? null : onCancel())}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[20px] text-[var(--ivory)]">
            {pending === "Cancelled"
              ? `Cancel ${order.id}?`
              : `Move ${order.id} to ${pending?.toLowerCase()}?`}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[14px] text-[var(--muted)]">
            {pending === "Cancelled"
              ? "The customer's order page will show it as cancelled. A cancelled order is final in the demo — cancelling is the only irreversible-looking step, and no money was ever charged."
              : `The customer's order page will reflect ${pending?.toLowerCase()} on their timeline.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl">Keep as is</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            data-testid="admin-order-confirm"
            className={cn(
              "rounded-xl",
              pending === "Cancelled" && "bg-[var(--ivory)] text-[var(--ink)] hover:bg-[var(--ivory)]/90",
            )}
            onClick={onConfirm}
          >
            {pending === "Cancelled" ? "Yes, cancel order" : "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ---------------------------------------------------------------- skeleton */

function OrdersSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-live="polite">
      <PageHeader eyebrow="Back office" title="Orders." intro="Loading this browser's demo orders." />
      <Skeleton className="h-11 w-full max-w-[36rem] rounded-full" />
      <div className="overflow-hidden rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)]">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center gap-4 px-5 py-4",
              index < 4 && "border-b border-[var(--hairline)]",
            )}
          >
            <Skeleton className="h-4 w-28 rounded-full" />
            <Skeleton className="h-4 flex-1 rounded-full" />
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="h-4 w-16 rounded-full" />
            <Skeleton className="h-4 w-20 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
