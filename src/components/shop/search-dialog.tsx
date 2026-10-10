"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { formatCents } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/catalog";

/** EASE from `components/home/motion.ts`. */
const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Live product search (⌘K / Ctrl-K). Built on the existing `Dialog` primitive —
 * no `cmdk` dependency, so the bundle stays where it is (AGENTS §Scope).
 * Roving focus with ArrowUp/ArrowDown, Enter opens, Escape closes via Radix.
 */
export function SearchDialog({
  open,
  onOpenChange,
  products,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
}) {
  const [term, setTerm] = React.useState("");
  const [cursor, setCursor] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const results = React.useMemo(() => {
    const needle = term.trim().toLowerCase();
    if (!needle) return products;
    return products.filter((p) =>
      `${p.name} ${p.category} ${p.material}`.toLowerCase().includes(needle),
    );
  }, [products, term]);

  React.useEffect(() => setCursor(0), [term]);

  // Radix focuses the content node, not our input — move focus ourselves.
  React.useEffect(() => {
    if (open) {
      setTerm("");
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="lux top-24 max-w-[calc(100%-2rem)] -translate-y-0 gap-0 overflow-hidden rounded-[var(--card-radius)] border-[var(--hairline)] bg-[var(--surface-1)] p-0 ring-0 [box-shadow:var(--soft-shadow)] sm:max-w-lg"
        aria-label="Search the archive"
      >
        <DialogTitle className="sr-only">Search the archive</DialogTitle>

        <div className="flex items-center gap-3 border-b border-[var(--hairline)] px-4 py-3.5">
          <Search className="size-4 shrink-0 text-[var(--muted)]" strokeWidth={1.5} aria-hidden />
          <input
            ref={inputRef}
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setCursor((c) => (results.length ? (c + 1) % results.length : 0));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setCursor((c) =>
                  results.length ? (c - 1 + results.length) % results.length : 0,
                );
              } else if (e.key === "Enter" && results[cursor]) {
                onOpenChange(false);
                window.location.assign(`/products/${results[cursor].id}`);
              }
            }}
            type="search"
            role="combobox"
            aria-expanded
            aria-controls="shop-search-results"
            aria-activedescendant={results[cursor] ? `shop-search-${results[cursor].id}` : undefined}
            aria-label="Search products"
            placeholder="Search blanks…"
            className="w-full bg-transparent text-[15px] text-[var(--ivory)] outline-none placeholder:text-[var(--faint)]"
          />
          <kbd className="lux-mono hidden text-[10px] tracking-[0.14em] text-[var(--faint)] sm:block">
            ESC
          </kbd>
        </div>

        <ul
          id="shop-search-results"
          role="listbox"
          aria-label="Search results"
          className="max-h-[min(60vh,22rem)] overflow-y-auto p-2"
        >
          {results.length === 0 ? (
            <li className="px-3 py-8 text-center text-[15px] text-[var(--muted)]">
              Nothing matches “{term}”.
            </li>
          ) : (
            results.map((p, i) => (
              <li key={p.id} id={`shop-search-${p.id}`} role="option" aria-selected={i === cursor}>
                <Link
                  href={`/products/${p.id}`}
                  onClick={() => onOpenChange(false)}
                  onMouseEnter={() => setCursor(i)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors",
                    i === cursor ? "bg-[var(--surface-2)]" : "bg-transparent",
                  )}
                >
                  <span className="lux-display text-[15px] text-[var(--ivory)]">{p.name}</span>
                  <span className="lux-mono text-[11px] tracking-[0.14em] uppercase text-[var(--faint)]">
                    {p.category}
                  </span>
                  <span className="lux-mono lux-tabular ml-auto text-[13px] text-[var(--muted)]">
                    {formatCents(p.priceCents)}
                  </span>
                </Link>
              </li>
            ))
          )}
        </ul>

        <AnimatePresence>
          {term ? null : (
            <motion.div
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: EASE }}
              className="lux-mono border-t border-[var(--hairline)] px-4 py-2.5 text-[10px] tracking-[0.16em] uppercase text-[var(--faint)]"
            >
              ↑ ↓ to browse · ↵ to open
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
