"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Clipboard,
  Download,
  PackageOpen,
} from "lucide-react";
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
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { OrderStatusChip } from "@/components/admin/orders/order-status-chip";
import {
  nextOrderStatuses,
  formatOrderDate,
  type OrderRecord,
  type OrderStatus,
} from "@/lib/checkout/order";
import { formatCents } from "@/lib/format";
import { lineSummary } from "@/lib/cart/line-summary";
import { getShippingMethod } from "@/lib/checkout/shipping";
import { cardBrandLabel } from "@/lib/payment/card";
import { downloadDesignJson } from "@/lib/orders/design-export";
import { adminOrdersService } from "@/lib/admin/orders-service";
import { cn } from "@/lib/utils";

/**
 * `/admin/orders/[id]` (plan.md Phase 1B U6): the back-office mirror of the
 * customer's `/order/[id]` — same record, same seam, but with the updater,
 * the timeline history, internal notes and per-item design exports the
 * customer screen must never see.
 */
export function OrderDetailScreen({ id }: { id: string }) {
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");

  const load = useCallback(() => {
    setPhase("loading");
    let cancelled = false;
    adminOrdersService
      .getOrder(id)
      .then((found) => {
        if (cancelled) return;
        setOrder(found);
        setPhase("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setPhase("error");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => load(), [load]);

  if (phase === "loading") return <DetailSkeleton />;
  if (phase === "error") {
    return (
      <ErrorState
        title="We couldn't read this order"
        body="This browser blocked or lost its local stores. Try again — orders live in the demo browser only."
        onRetry={load}
      />
    );
  }
  if (!order) return <DetailNotFound />;

  return <OrderDetail order={order} />;
}

function OrderDetail({
  order: initial,
}: {
  order: OrderRecord;
}) {
  const [order, setOrder] = useState(initial);
  const [pending, setPending] = useState<OrderStatus | null>(null);
  const [busy, setBusy] = useState(false);

  const allowed = nextOrderStatuses(order.status);

  function setStatus(status: OrderStatus) {
    setBusy(true);
    adminOrdersService
      .setOrderStatus(order.id, status)
      .then((result) => {
        if (!result.ok) {
          toast(result.error);
          return;
        }
        toast(`Order marked ${status.toLowerCase()}.`);
        setOrder(result.order);
      })
      .finally(() => setBusy(false));
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Link
            href="/admin/orders"
            className="lux-mono text-[11px] tracking-[0.14em] text-[var(--muted)] uppercase underline-offset-4 hover:text-[var(--ivory)] hover:underline"
          >
            ← All orders
          </Link>
          <h1
            data-testid="admin-order-id"
            className="lux-h2 lux-display break-all text-[var(--ivory)]"
          >
            {order.id}
          </h1>
          <p className="text-[14px] text-[var(--muted)]">
            Placed {formatOrderDate(order.createdAt)} · {order.itemCount}{" "}
            {order.itemCount === 1 ? "item" : "items"} ·{" "}
            <span className="lux-tabular">{formatCents(order.totalCents)}</span>
          </p>
        </div>
        <OrderStatusChip status={order.status} className="mt-2" />
      </header>

      <section
        aria-labelledby="admin-order-items"
        className="flex flex-col gap-5 rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] p-6 [box-shadow:var(--inner-highlight)] sm:p-7"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <h2 id="admin-order-items" className="lux-eyebrow text-[var(--lime)]">
            Items
          </h2>
          <span className="lux-mono text-[11px] tracking-[0.14em] text-[var(--muted)] uppercase">
            {order.items.length} {order.items.length === 1 ? "line" : "lines"}
          </span>
        </div>

        <ul aria-label="Order items" className="flex flex-col gap-5">
          {order.items.map((item) => (
            <AdminOrderItemRow key={item.id} order={order} item={item} />
          ))}
        </ul>

        <div className="hairline-t flex flex-col gap-3 pt-5 text-[14px]">
          <div className="flex flex-col gap-1">
            <span className="lux-mono text-[10px] tracking-[0.16em] text-[var(--muted)] uppercase">
              Ship to
            </span>
            <span className="text-[13px] text-[var(--ivory)]">
              {order.address.fullName}{" "}
              <span className="text-[var(--muted)]">· {order.address.email}</span>
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
            <span className="lux-mono text-[10px] tracking-[0.16em] text-[var(--muted)] uppercase">
              Shipping
            </span>
            <span className="text-[13px] text-[var(--ivory)]">
              {getShippingMethod(order.shippingMethodId)?.label ?? order.shippingMethodId}
            </span>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <span className="lux-mono text-[10px] tracking-[0.16em] text-[var(--muted)] uppercase">
              Payment
            </span>
            <span className="text-[13px] text-[var(--ivory)]">
              {cardBrandLabel(order.cardBrand)} ending {order.cardLast4}
            </span>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="admin-order-progress"
        className="flex flex-col gap-5 rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] p-6 [box-shadow:var(--inner-highlight)] sm:p-7"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <h2 id="admin-order-progress" className="lux-eyebrow text-[var(--lime)]">
            Status
          </h2>
          <StatusDropdown
            order={order}
            allowed={allowed}
            busy={busy}
            onPick={setPending}
          />
        </div>

        <ol aria-label="Status history" className="flex flex-col gap-4">
          {order.statusHistory.map((event, index) => {
            const last = index === order.statusHistory.length - 1;
            return (
              <li key={`${event.status}-${event.at}`} className="flex items-baseline gap-3">
                <span
                  className={cn(
                    "lux-mono shrink-0 text-[11px] tracking-[0.12em] uppercase",
                    last ? "text-[var(--lime)]" : "text-[var(--muted)]",
                  )}
                >
                  {event.status}
                </span>
                <span
                  aria-hidden
                  className="min-w-6 flex-1 self-center border-b border-[var(--hairline)]"
                />
                <span className="lux-tabular shrink-0 text-[12px] text-[var(--muted)]">
                  {formatHistoryTimestamp(event.at)}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <NotesCard order={order} onNote={setOrder} />

      <AlertDialog
        open={pending !== null}
        onOpenChange={(open) => (open ? null : setPending(null))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[20px] text-[var(--ivory)]">
              {pending === "Cancelled"
                ? `Cancel ${order.id}?`
                : `Move ${order.id} to ${pending?.toLowerCase()}?`}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[14px] text-[var(--muted)]">
              {pending === "Cancelled"
                ? "The customer's order page will show it as cancelled. No money was ever charged, and the demo cannot undo the cancellation."
                : "The customer's /order/[id] page reflects this on their timeline."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Keep as is</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              data-testid="admin-order-detail-confirm"
              className="rounded-xl"
              onClick={() => {
                const next = pending;
                setPending(null);
                if (next) setStatus(next);
              }}
            >
              {pending === "Cancelled" ? "Yes, cancel order" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <p className="sr-only" aria-live="polite" role="status">
        {`Status ${order.status.toLowerCase()}`}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------- items */

function AdminOrderItemRow({
  order,
  item,
}: {
  order: OrderRecord;
  item: OrderRecord["items"][number];
}) {
  const chips = lineSummary({
    id: item.id,
    slug: item.slug,
    name: item.name,
    configuration: item.configuration,
    thumbnail: item.thumbnail ?? "",
    qty: item.qty,
    unitCents: item.unitCents,
  });

  return (
    <li className="flex flex-col gap-3 border-b border-[var(--hairline)] pb-5 last:border-b-0 last:pb-0 sm:flex-row sm:gap-4">
      <div className="relative size-16 shrink-0 overflow-hidden rounded-[12px] bg-[var(--surface-3)]">
        {item.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element -- data-URL snapshot from checkout
          <img src={item.thumbnail} alt="" className="size-full object-cover" />
        ) : (
          <PackageOpen className="absolute inset-0 m-auto size-5 text-[var(--faint)]" strokeWidth={1.5} aria-hidden />
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
        <div className="flex">
          <Button
            variant="ghost"
            size="sm"
            data-testid={`admin-export-${item.slug.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`}
            onClick={() => downloadDesignJson(order, item)}
            className="mt-1 self-start rounded-full px-4 text-[13px] text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ivory)]"
          >
            <Download className="size-4" strokeWidth={1.5} aria-hidden />
            Download design JSON
          </Button>
        </div>
      </div>
    </li>
  );
}

/* ---------------------------------------------------------------- updater */

function StatusDropdown({
  order,
  allowed,
  busy,
  onPick,
}: {
  order: OrderRecord;
  allowed: OrderStatus[];
  busy: boolean;
  onPick: (status: OrderStatus) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={allowed.length === 0 || busy}>
        <Button
          variant="outline"
          data-testid="admin-order-detail-update"
          aria-label="Update status"
          disabled={allowed.length === 0 || busy}
          title={
            allowed.length === 0
              ? `A ${order.status.toLowerCase()} order is final in the demo — no further moves.`
              : undefined
          }
          className="h-9 gap-2 rounded-full px-4 text-[13px] text-[var(--ivory)] ring-[var(--hairline-strong)] hover:bg-[var(--surface-2)]"
        >
          {allowed.length === 0
            ? `Final (${order.status.toLowerCase()})`
            : "Update status"}
          {allowed.length > 0 ? (
            <ChevronDown className="size-4" strokeWidth={1.5} aria-hidden />
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[11rem]">
        {allowed.map((status) => (
          <DropdownMenuItem
            key={status}
            data-testid={`admin-detail-move-${status.toLowerCase()}`}
            onSelect={() => onPick(status)}
          >
            {status === "Cancelled" ? "Cancel order…" : `Mark ${status.toLowerCase()}`}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ------------------------------------------------------------------- notes */

function NotesCard({
  order,
  onNote,
}: {
  order: OrderRecord;
  onNote: (order: OrderRecord) => void;
}) {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const notes = [...(order.notes ?? [])].reverse();

  const add = () => {
    setBusy(true);
    adminOrdersService
      .addOrderNote(order.id, draft)
      .then((result) => {
        if (!result.ok) {
          toast(result.error);
          return;
        }
        setDraft("");
        onNote(result.order);
        toast("Note added.");
      })
      .finally(() => setBusy(false));
  };

  return (
    <section
      aria-labelledby="admin-order-notes"
      className="flex flex-col gap-4 rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] p-6 [box-shadow:var(--inner-highlight)] sm:p-7"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h2 id="admin-order-notes" className="lux-eyebrow text-[var(--lime)]">
          Internal notes
        </h2>
        <span className="flex items-center gap-1.5 text-[12px] text-[var(--muted)]">
          <Clipboard className="size-3.5" strokeWidth={1.5} aria-hidden />
          Admin only — never shown to the customer
        </span>
      </div>

      {notes.length === 0 ? (
        <p className="text-[13px] text-[var(--muted)]">No notes yet.</p>
      ) : (
        <ul aria-label="Order notes" className="flex flex-col gap-3">
          {notes.map((note) => (
            <li
              key={note.id}
              data-testid="admin-order-note"
              className="flex flex-col gap-1 rounded-[var(--inner-radius)] bg-[var(--surface-2)] px-4 py-3"
            >
              <span className="lux-tabular text-[11px] text-[var(--faint)]">
                {formatHistoryTimestamp(note.at)}
              </span>
              <span className="whitespace-pre-wrap text-[14px] leading-[1.55] text-[var(--ivory)]">
                {note.body}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2">
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add a note about fulfilment, proofs or customer contact…"
          aria-label="Internal note"
          data-testid="admin-note-input"
          maxLength={500}
          rows={3}
          className="resize-y rounded-[var(--inner-radius)] bg-[var(--surface-2)] text-[14px]"
        />
        <Button
          size="sm"
          variant="outline"
          disabled={busy || draft.trim().length === 0}
          onClick={add}
          data-testid="admin-note-add"
          className="self-start rounded-full px-5 text-[13px] text-[var(--ivory)] ring-[var(--hairline-strong)] hover:bg-[var(--surface-2)]"
        >
          Add note
        </Button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- extra bits */

/** "12 Oct 2026, 14:05" — history rows and notes need more than the date. */
function formatHistoryTimestamp(iso: string): string {
  const text = new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return text.replace(",", ",");
}

function DetailNotFound() {
  return (
    <div className="flex flex-col items-center gap-5 rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--lime)_35%,transparent)] bg-[var(--surface-1)] px-6 py-16 text-center">
      <span className="lux-eyebrow text-[var(--muted)]">Not found</span>
      <h2 className="lux-display text-[22px] text-[var(--ivory)]">Order not found.</h2>
      <p className="max-w-md text-[15px] leading-[1.6] text-[var(--muted)]">
        Demo orders live in the browser they were placed in. If you cleared site data or opened
        this link elsewhere, the order is no longer readable here.
      </p>
      <Button
        asChild
        className="mt-2 h-11 rounded-full bg-[var(--lime)] px-6 text-[15px] font-medium text-[var(--ink)] hover:bg-[var(--lime)]/90"
      >
        <Link href="/admin/orders">Back to all orders</Link>
      </Button>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-3 w-24 rounded-full" />
          <Skeleton className="h-8 w-56 rounded-[var(--inner-radius)]" />
          <Skeleton className="h-4 w-72 rounded-[var(--inner-radius)]" />
        </div>
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>
      <Skeleton className="h-64 w-full rounded-[var(--card-radius)]" />
      <Skeleton className="h-52 w-full rounded-[var(--card-radius)]" />
      <Skeleton className="h-64 w-full rounded-[var(--card-radius)]" />
    </div>
  );
}
