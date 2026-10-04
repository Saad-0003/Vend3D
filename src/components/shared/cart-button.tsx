"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";

/**
 * Cart entry point with the live count badge. Phase 1 renders a static zero;
 * Phase 8 replaces the prop with the zustand cart mirror so the badge can never
 * drift from server state.
 */
export function CartButton({ count = 0 }: { count?: number }) {
  return (
    <Link
      href="/cart"
      aria-label={count > 0 ? `Cart, ${count} items` : "Cart"}
      className="text-muted-foreground hover:text-foreground hover:bg-glass relative flex size-9 items-center justify-center rounded-full transition-colors"
    >
      <ShoppingBag className="size-[18px]" strokeWidth={1.5} />
      {count > 0 ? (
        <span className="bg-signal text-on-signal tabular absolute top-1 right-0.5 flex size-4 items-center justify-center rounded-full text-[10px] font-medium">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
