"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PackageOpen, Plus, ShoppingBag, Shapes, ReceiptText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { type AdminOverview, type AdminOrderRow } from "@/lib/admin/overview";
import { adminService } from "@/lib/admin/service";
import { formatOrderDate } from "@/lib/checkout/order";
import { formatCents } from "@/lib/format";
import { shortOrderId } from "@/lib/orders/history";

/**
 * The admin dashboard (plan.md Phase 1B U4). All numbers come through the
 * `AdminService` seam; Phase 10 swaps the implementation, not this screen.
 *
 * Four first-class states, as every screen ships them (DESIGN.md rule 12):
 * loading skeleton, populated, empty (zero demo orders) and error (storage
 * blocked), each with a retry where one is possible.
 */
export function AdminDashboard() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");

  const load = useCallback(() => {
    setPhase("loading");
    let cancelled = false;
    adminService
      .getOverview()
      .then((result) => {
        if (cancelled) return;
        setOverview(result);
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

  if (phase === "loading") return <DashboardSkeleton />;
  if (phase === "error") {
    return (
      <ErrorState
        title="We couldn't read the demo data"
        body="This browser blocked or lost its local stores. Try again — if it keeps happening, reload the page once and check that this browser allows site data."
        onRetry={load}
      />
    );
  }
  return <DashboardContent overview={overview!} />;
}

function DashboardContent({ overview }: { overview: AdminOverview }) {
  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow="Back office"
        title="Dashboard."
        intro="A quick read of this browser's demo orders, products and saved designs. The live store takes over in Phase 10."
      />

      <section aria-label="Overview stats" className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Total orders" value={String(overview.totalOrders)} icon={<ReceiptText className="size-4" strokeWidth={1.5} aria-hidden />} />
        <StatCard
          label="Demo revenue"
          value={formatCents(overview.revenueCents)}
          icon={<ReceiptText className="size-4 text-[var(--lime)]" strokeWidth={1.5} aria-hidden />}
          accent
        />
        <StatCard label="Products" value={String(overview.productCount)} icon={<PackageOpen className="size-4" strokeWidth={1.5} aria-hidden />} />
        <StatCard label="Saved designs" value={String(overview.designCount)} icon={<Shapes className="size-4" strokeWidth={1.5} aria-hidden />} />
      </section>

      {/* U5 shipped the products screen, so "New product" is a real link now;
          "View all orders" stays Soon until U6 (same honesty as the sidebar). */}
      <TooltipProvider>
        <div className="flex flex-wrap items-center gap-3" role="group" aria-label="Quick actions">
          <Button
            asChild
            className="h-11 rounded-full bg-[var(--ivory)] px-6 text-[15px] text-[var(--ink)] hover:bg-[var(--ivory)]/90"
          >
            <Link href="/admin/products/new" data-testid="admin-quick-new-product">
              <Plus className="mr-1.5 size-4" strokeWidth={1.5} aria-hidden />
              New product
            </Link>
          </Button>
          <SoonButton label="View all orders" />
        </div>
      </TooltipProvider>

      <section aria-label="Recent orders" className="flex flex-col gap-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="lux-display text-[22px] text-[var(--ivory)]">Recent orders</h2>
          <span className="lux-mono lux-tabular text-[12px] text-[var(--muted)]">
            latest {overview.recentOrders.length} of {overview.totalOrders}
          </span>
        </div>

        {overview.recentOrders.length === 0 ? (
          <EmptyState
            eyebrow="No demo orders yet"
            title="No orders to show."
            body="Place a demo order from the storefront and the latest five land here, newest first."
            icon={<ShoppingBag className="size-7" strokeWidth={1.5} aria-hidden />}
            action={
              <Button
                asChild
                className="h-11 rounded-full bg-[var(--ivory)] px-6 text-[15px] text-[var(--ink)] hover:bg-[var(--ivory)]/90"
              >
                <Link href="/shop">Open the shop</Link>
              </Button>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] [box-shadow:var(--inner-highlight)]">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="lux-mono pl-5 text-[10px] tracking-[0.14em] text-[var(--muted)] uppercase">Order</TableHead>
                  <TableHead className="lux-mono text-[10px] tracking-[0.14em] text-[var(--muted)] uppercase">Customer</TableHead>
                  <TableHead className="lux-mono text-[10px] tracking-[0.14em] text-[var(--muted)] uppercase">Date</TableHead>
                  <TableHead className="lux-mono text-[10px] tracking-[0.14em] text-[var(--muted)] uppercase">Total</TableHead>
                  <TableHead className="lux-mono pr-5 text-[10px] tracking-[0.14em] text-[var(--muted)] uppercase">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.recentOrders.map((order) => (
                  <AdminOrderTableRow key={order.id} order={order} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] p-5 [box-shadow:var(--inner-highlight)]">
      <span className="lux-mono flex items-center gap-2 text-[10px] tracking-[0.14em] text-[var(--muted)] uppercase">
        {icon}
        {label}
      </span>
      <span
        className={
          "lux-display lux-tabular text-[26px] " +
          (accent ? "text-[var(--lime)]" : "text-[var(--ivory)]")
        }
      >
        {value}
      </span>
    </div>
  );
}

/**
 * Disabled-with-tooltip, not a hidden action: the orders list arrives in U6 —
 * the tooltip says exactly that, so the planning intent stays visible instead
 * of the row silently doing nothing.
 */
function SoonButton({ label }: { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* span wrapper: a `disabled` button suppresses pointer events, so
            radix's tooltip would never fire otherwise. */}
        <span tabIndex={-1} className="inline-flex">
          <Button disabled variant="outline" className="h-11 rounded-full px-5 text-[var(--muted)]">
            {label}
            <span className="lux-mono ml-2 rounded-full border border-[var(--hairline)] px-1.5 py-0.5 text-[9px] tracking-[0.14em] text-[var(--muted)] uppercase">
              Soon
            </span>
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="lux text-[12px]">
        Ships with Orders (U6)
      </TooltipContent>
    </Tooltip>
  );
}

const statusChipClass =
  "lux-mono rounded-full border-[color-mix(in_srgb,var(--lime)_35%,transparent)] bg-[var(--lime-glow)] px-2.5 py-1 text-[10px] tracking-[0.14em] text-[var(--lime)] uppercase";

function AdminOrderTableRow({ order }: { order: AdminOrderRow }) {
  return (
    <TableRow className="group">
      <TableCell className="pl-5">
        {/* Detail view arrives with the orders list (U6); the link is real
            once that screen exists, so the id itself stays the link target. */}
        <Link
          href={`/admin/orders/${order.id}`}
          title={order.id}
          className="lux-mono lux-tabular text-[13px] tracking-[0.08em] text-[var(--ivory)] underline-offset-4 hover:underline group-hover:text-[var(--lime)]"
        >
          #{shortOrderId(order.id)}
        </Link>
      </TableCell>
      <TableCell className="max-w-[12rem] truncate text-[13px] text-[var(--ivory)]">
        {order.customer}
      </TableCell>
      <TableCell className="text-[13px] text-[var(--muted)]">
        {formatOrderDate(order.createdAt)}
      </TableCell>
      <TableCell className="lux-mono lux-tabular text-[13px] text-[var(--ivory)]">
        {formatCents(order.totalCents)}
      </TableCell>
      <TableCell className="pr-5">
        <Badge variant="outline" className={statusChipClass}>
          {order.status}
        </Badge>
      </TableCell>
    </TableRow>
  );
}

/**
 * Loading skeleton mirroring the populated layout: four stat tiles, the quick
 * action row, then three table rows in the same card shape — no layout jump.
 */
function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading dashboard" className="flex flex-col gap-10">
      <Skeleton className="h-6 w-40 rounded-full" />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[92px] rounded-[var(--card-radius)]" />
        ))}
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-11 w-40 rounded-full" />
        <Skeleton className="h-11 w-48 rounded-full" />
      </div>
      <div className="overflow-hidden rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)]">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-none border-b border-[var(--hairline)]" />
        ))}
      </div>
    </div>
  );
}
