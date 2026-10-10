"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Minus, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/format";
import { lineSummary } from "@/lib/cart/line-summary";
import { CART_QTY_MAX, useCartStore, type CartLine } from "@/stores/cart-store";

/**
 * One cart row, shared by the drawer and `/cart`. Same chips, stepper and
 * remove in both places. The remove exit animation is handled by the parent's
 * AnimatePresence, so the row only reports the request.
 */
export function CartLineItem({ line, compact = false }: { line: CartLine; compact?: boolean }) {
  const setQty = useCartStore((s) => s.setQty);
  const removeLine = useCartStore((s) => s.removeLine);
  const setDrawerOpen = useCartStore((s) => s.setDrawerOpen);
  const chips = lineSummary(line);
  const lineTotal = line.unitCents * line.qty;

  return (
    <motion.li
      layout
      exit={{ opacity: 0, x: 24, transition: { duration: 0.25 } }}
      className="flex gap-4 rounded-[var(--inner-radius)] border border-[var(--hairline)] bg-[var(--surface-2)] p-3"
    >
      <div className={compact ? "relative aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-[10px] bg-[var(--surface-3)]" : "relative aspect-[4/5] w-24 shrink-0 overflow-hidden rounded-[12px] bg-[var(--surface-3)]"}>
        {line.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={line.thumbnail} alt="" className="size-full object-cover" />
        ) : (
          <Image src={`/products/${line.slug}.png`} alt="" fill sizes="96px" className="object-cover" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <span className="lux-display min-w-0 truncate text-[17px] text-[var(--ivory)]">{line.name}</span>
          <span className="lux-mono lux-tabular shrink-0 text-[14px] text-[var(--ivory)]">{formatCents(lineTotal)}</span>
        </div>

        {chips.length > 0 ? (
          <ul aria-label="Configuration" className="flex flex-wrap gap-1.5">
            {chips.map((chip) => (
              <li
                key={chip.key}
                className="lux-mono rounded-full bg-[var(--surface-1)] px-2.5 py-1 text-[10px] tracking-[0.12em] text-[var(--muted)] uppercase ring-1 ring-[var(--hairline)]"
              >
                {chip.label}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1" role="group" aria-label={`Quantity for ${line.name}`}>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Decrease quantity"
              disabled={line.qty <= 1}
              onClick={() => setQty(line.id, line.qty - 1)}
              className="size-11 rounded-full text-[var(--muted)] hover:text-[var(--ivory)]"
            >
              <Minus className="size-4" strokeWidth={1.5} aria-hidden />
            </Button>
            <span className="lux-mono lux-tabular w-7 text-center text-[13px] text-[var(--ivory)]" aria-live="polite">
              {line.qty}
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Increase quantity"
              disabled={line.qty >= CART_QTY_MAX}
              onClick={() => setQty(line.id, line.qty + 1)}
              className="size-11 rounded-full text-[var(--muted)] hover:text-[var(--ivory)]"
            >
              <Plus className="size-4" strokeWidth={1.5} aria-hidden />
            </Button>
          </div>

          <div className="flex items-center">
            <Button asChild variant="ghost" className="h-11 rounded-full px-3 text-[13px] text-[var(--ivory)] hover:bg-[var(--surface-3)]">
              <Link href={`/products/${line.slug}?line=${line.id}`} onClick={() => setDrawerOpen(false)}>
                Edit in studio
                <ArrowUpRight className="size-3.5" strokeWidth={1.5} aria-hidden />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Remove ${line.name}`}
              onClick={() => removeLine(line.id)}
              className="size-11 rounded-full text-[var(--muted)] hover:text-[var(--destructive)]"
            >
              <Trash2 className="size-4" strokeWidth={1.5} aria-hidden />
            </Button>
          </div>
        </div>
      </div>
    </motion.li>
  );
}

/** Wraps a list of lines so removals animate out instead of snapping. */
export function CartLineList({ lines, compact }: { lines: CartLine[]; compact?: boolean }) {
  return (
    <ul aria-label="Cart items" className="flex flex-col gap-3">
      <AnimatePresence initial={false}>
        {lines.map((line) => (
          <CartLineItem key={line.id} line={line} compact={compact} />
        ))}
      </AnimatePresence>
    </ul>
  );
}
