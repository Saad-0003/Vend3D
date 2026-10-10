"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { motion } from "framer-motion";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CartLineList } from "@/components/shared/cart-line-item";
import { formatCents } from "@/lib/format";
import { products } from "@/lib/catalog";
import { selectCartCount, selectSubtotalCents, useCartStore } from "@/stores/cart-store";

/**
 * Right-side cart Sheet, mounted once in the root layout. Opened through
 * `drawerOpen`. Uses the same line item as `/cart`, so chips, stepper and remove
 * behave identically in both places.
 */
export function CartDrawer() {
  const open = useCartStore((s) => s.drawerOpen);
  const setOpen = useCartStore((s) => s.setDrawerOpen);
  const lines = useCartStore((s) => s.lines);
  const hydrate = useCartStore((s) => s.hydrate);
  const count = selectCartCount(lines);
  const subtotal = selectSubtotalCents(lines);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          className="lux fixed inset-y-3 right-3 z-50 flex w-[calc(100%-1.5rem)] max-w-[440px] flex-col gap-5 rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] p-6 outline-none [box-shadow:var(--soft-shadow)] transition-transform duration-500 data-[state=closed]:translate-x-[110%] data-[state=open]:translate-x-0"
        >
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-baseline gap-3">
              <DialogPrimitive.Title className="lux-display text-[26px] text-[var(--ivory)]">
                Your cart
              </DialogPrimitive.Title>
              <span className="lux-mono lux-tabular text-[12px] text-[var(--muted)]" aria-live="polite">
                {count} {count === 1 ? "item" : "items"}
              </span>
            </div>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Close cart" className="size-11 rounded-full text-[var(--muted)] hover:text-[var(--ivory)]">
                <X className="size-4" strokeWidth={1.5} aria-hidden />
              </Button>
            </DialogPrimitive.Close>
          </header>

          <DialogPrimitive.Description className="sr-only">
            Review your cart, change quantities, or continue to checkout.
          </DialogPrimitive.Description>

          {lines.length === 0 ? (
            <DrawerEmpty onBrowse={() => setOpen(false)} />
          ) : (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-color:var(--hairline-strong)_transparent] [scrollbar-width:thin]">
                <CartLineList lines={lines} compact />
              </div>

              <footer className="flex flex-col gap-4 border-t border-[var(--hairline)] pt-5">
                <div className="flex items-baseline justify-between">
                  <span className="lux-mono text-[11px] tracking-[0.16em] text-[var(--muted)] uppercase">Subtotal</span>
                  <span className="lux-mono lux-tabular text-[20px] text-[var(--ivory)]" aria-live="polite">
                    {formatCents(subtotal)}
                  </span>
                </div>
                <p className="lux-mono text-[10px] tracking-[0.14em] text-[var(--muted)] uppercase">
                  Shipping calculated at checkout · Dispatched in 48 hours
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button asChild variant="ghost" className="h-12 rounded-full text-[var(--ivory)] ring-1 ring-[var(--hairline-strong)] hover:bg-[var(--surface-2)]">
                    <Link href="/cart" onClick={() => setOpen(false)}>View cart</Link>
                  </Button>
                  <Button asChild className="h-12 rounded-full bg-[var(--ivory)] text-[var(--ink)] hover:bg-[var(--ivory)]/90">
                    <Link href="/checkout" onClick={() => setOpen(false)}>Checkout</Link>
                  </Button>
                </div>
              </footer>
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** Empty state with two suggestions, so the drawer is never a dead end. */
function DrawerEmpty({ onBrowse }: { onBrowse: () => void }) {
  const suggestions = products.slice(0, 2);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-1 flex-col gap-6"
    >
        <div className="flex flex-col gap-3">
          <p className="lux-display text-[24px] text-[var(--ivory)]">Your cart is empty.</p>
          <p className="max-w-xs text-[14px] leading-[1.6] text-[var(--muted)]">
            Shape a blank in the studio and it will wait for you here.
          </p>
          <Button asChild className="h-11 w-fit rounded-full bg-[var(--ivory)] px-6 text-[var(--ink)] hover:bg-[var(--ivory)]/90">
            <Link href="/shop" onClick={onBrowse}>Browse the shop</Link>
          </Button>
        </div>
        <ul className="grid grid-cols-2 gap-3">
          {suggestions.map((p) => (
            <li key={p.id}>
              <Link
                href={`/products/${p.id}`}
                onClick={onBrowse}
                className="flex flex-col gap-2 rounded-[var(--inner-radius)] border border-[var(--hairline)] bg-[var(--surface-2)] p-2 transition-colors duration-300 hover:border-[var(--hairline-strong)]"
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[12px] bg-[var(--surface-3)]">
                  <Image src={p.image} alt="" fill sizes="200px" className="object-cover" />
                </div>
                <span className="lux-display truncate px-1 text-[15px] text-[var(--ivory)]">{p.name}</span>
                <span className="lux-mono px-1 pb-1 text-[12px] text-[var(--muted)]">{formatCents(p.priceCents)}</span>
              </Link>
            </li>
          ))}
        </ul>
    </motion.div>
  );
}
