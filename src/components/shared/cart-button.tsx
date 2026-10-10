"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { selectCartCount, useCartStore } from "@/stores/cart-store";

/**
 * Navbar cart entry. The count comes from the cart store, so the badge can't
 * drift from the drawer or /cart. The badge pops whenever `pulse` changes, which
 * happens on every add. The href stays as the no-JS and new-tab fallback.
 */
export function CartButton() {
  const count = useCartStore((s) => selectCartCount(s.lines));
  const pulse = useCartStore((s) => s.pulse);
  const setDrawerOpen = useCartStore((s) => s.setDrawerOpen);
  const reduced = useReducedMotion();

  return (
    <Link
      href="/cart"
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        setDrawerOpen(true);
      }}
      aria-label={count > 0 ? `Cart, ${count} items` : "Cart"}
      className="text-muted-foreground hover:text-foreground hover:bg-glass relative flex size-9 items-center justify-center rounded-full transition-colors"
    >
      <ShoppingBag className="size-[18px]" strokeWidth={1.5} />
      <AnimatePresence>
        {count > 0 ? (
          <motion.span
            key={pulse}
            initial={reduced ? { opacity: 0 } : { scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.2 : 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="bg-signal text-on-signal tabular absolute top-1 right-0.5 flex size-4 items-center justify-center rounded-full text-[10px] font-medium"
          >
            {count > 9 ? "9+" : count}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </Link>
  );
}
