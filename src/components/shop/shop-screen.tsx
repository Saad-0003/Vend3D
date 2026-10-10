"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Search, SlidersHorizontal, X } from "lucide-react";

import { NumberTicker } from "@/components/ui/number-ticker";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { ProductCard } from "@/components/ui/product-card";
import { SectionSkeletons } from "@/components/ui/section-skeletons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FilterPanel } from "@/components/shop/filter-panel";
import { SearchDialog } from "@/components/shop/search-dialog";
import {
  CATEGORIES,
  SORTS,
  type Category,
  type Product,
  type Sort,
  priceBounds,
  listProducts,
} from "@/lib/catalog";
import {
  applyCatalogQuery,
  parseCatalogQuery,
  serializeCatalogQuery,
  type CatalogQuery,
} from "@/lib/catalog-query";
import { cn } from "@/lib/utils";
import { formatCents } from "@/lib/format";

/** EASE from `components/home/motion.ts` — the system's single curve. */
const EASE = [0.22, 1, 0.36, 1] as const;

const SORT_LABELS: Record<Sort, string> = {
  featured: "Featured",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  newest: "Newest",
};

/** SSR-safe media query — `false` on the first paint, then hydrated. */
function useMediaQuery(q: string) {
  const [matches, setMatches] = React.useState(false);
  React.useEffect(() => {
    const m = window.matchMedia(q);
    setMatches(m.matches);
    const on = () => setMatches(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, [q]);
  return matches;
}

/** One removable chip per active constraint, with the patch that clears it. */
type Chip = { key: string; label: string; clear: Partial<CatalogQuery> };


/**
 * `/shop` — the full archive. Same header, toolbar, card and closing band language
 * as the landing page; the only new controls are the URL-backed filter chips.
 * All filter/sort state lives in the query string so every view is shareable.
 */
export function ShopScreen() {
  const reduced = useReducedMotion();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [all, setAll] = React.useState<Product[] | null>(null);
  const [failed, setFailed] = React.useState(false);
  const filtersButtonRef = React.useRef<HTMLButtonElement>(null);

  // ⌘K / Ctrl-K opens search from anywhere on the screen.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const load = React.useCallback(() => {
    setFailed(false);
    // A real screen awaits Prisma here; the tick exists only so the Skeleton
    // state is observable (DESIGN.md rule 12) rather than never rendering.
    listProducts()
      .then((list) => setAll(list))
      .catch(() => setFailed(true));
  }, []);

  React.useEffect(load, [load]);

  const query = React.useMemo<CatalogQuery>(
    () => parseCatalogQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const update = React.useCallback(
    (patch: Partial<CatalogQuery>) => {
      const next = { ...query, ...patch };
      const qs = serializeCatalogQuery(next);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, query, router],
  );

  const visible = React.useMemo(() => (all ? applyCatalogQuery(all, query) : []), [all, query]);

  const chips = React.useMemo<Chip[]>(() => {
    const out: Chip[] = [];
    if (query.colors?.length) {
      out.push({ key: "colors", label: query.colors.join(" · "), clear: { colors: [] } });
    }
    if (query.materials?.length) {
      out.push({ key: "materials", label: query.materials.join(" · "), clear: { materials: [] } });
    }
    if (typeof query.minPrice === "number" || typeof query.maxPrice === "number") {
      out.push({
        key: "price",
        label: `${formatCents(query.minPrice ?? priceBounds.min)} – ${formatCents(
          query.maxPrice ?? priceBounds.max,
        )}`,
        clear: { minPrice: undefined, maxPrice: undefined },
      });
    }
    if (query.query?.trim()) {
      out.push({ key: "q", label: `“${query.query.trim()}”`, clear: { query: "" } });
    }
    return out;
  }, [query]);

  return (
    <div className="lux flex min-h-dvh flex-col bg-[var(--ink)] text-[var(--ivory)]">
      <PageShell aria-label="Shop" className="flex-1">
        <PageHeader
          eyebrow="Archive"
          title="All blanks."
          intro="Everything we can print, mill and embroider — filter down, then open any blank in the studio with its colourway already applied."
          action={
            <Button
              variant="ghost"
              onClick={() => setSearchOpen(true)}
              aria-label="Search the archive"
              aria-keyshortcuts="Meta+K Control+K"
              className="h-11 rounded-full px-5 text-[13px] text-[var(--ivory)] ring-1 ring-[var(--hairline)] duration-300 hover:bg-[var(--surface-2)] hover:ring-[var(--hairline-strong)]"
            >
              <Search className="size-4" strokeWidth={1.5} aria-hidden />
              Search
              <kbd className="lux-mono ml-1 hidden text-[10px] tracking-[0.14em] text-[var(--faint)] lg:block">
                ⌘K
              </kbd>
            </Button>
          }
        />

        {/* Result count, announced politely as the grid changes. */}
        <p className="lux-mono mt-6 flex items-center gap-2 text-[12px] tracking-[0.14em] uppercase text-[var(--muted)]">
          {all ? (
            <>
              <span aria-live="polite" className="lux-tabular text-[var(--ivory)]">
                <NumberTicker value={visible.length} />
              </span>
              <span>{visible.length === 1 ? "blank" : "blanks"}</span>
            </>
          ) : (
            <span>Loading archive…</span>
          )}
        </p>


        {/* Toolbar — one line: category Tabs left, sort + filters right. */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Tabs
            value={query.category}
            onValueChange={(v) => update({ category: v as Category })}
            className="shrink-0"
          >
            <TabsList className="h-11 rounded-full border border-[var(--hairline)] bg-transparent p-1">
              {CATEGORIES.map((c) => (
                <TabsTrigger
                  key={c}
                  value={c}
                  className="rounded-full px-4 text-[13px] text-[var(--muted)] data-[state=active]:text-[var(--ivory)]"
                >
                  {c}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Select
              value={query.sort ?? "featured"}
              onValueChange={(v) => update({ sort: v as Sort })}
            >
              <SelectTrigger aria-label="Sort products" className="h-11 rounded-full border-[var(--hairline)] bg-transparent px-4 text-[13px] text-[var(--ivory)]">
                <SelectValue>{SORT_LABELS[query.sort ?? "featured"]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {SORTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {SORT_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              ref={filtersButtonRef}
              onClick={() => setFiltersOpen(true)}
              aria-expanded={filtersOpen}
              aria-controls="shop-filters"
              className={cn(
                "h-11 rounded-full px-5 text-[13px] ring-1 duration-300",
                chips.length
                  ? "text-[var(--ink)] ring-transparent [background:var(--lime)] hover:brightness-95"
                  : "text-[var(--ivory)] ring-[var(--hairline)] hover:bg-[var(--surface-2)] hover:ring-[var(--hairline-strong)]",
              )}
            >
              <SlidersHorizontal className="size-4" strokeWidth={1.5} aria-hidden />
              Filters
              {chips.length ? (
                <span className="lux-tabular text-[11px]">{chips.length}</span>
              ) : null}
            </Button>
          </div>
        </div>


        {/* Active filters — removable, animated in and out. */}
        <AnimatePresence initial={false}>
          {chips.length ? (
            <motion.div
              layout
              initial={false}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-4 flex flex-wrap items-center gap-2"
              aria-label="Active filters"
            >
              <AnimatePresence initial={false} mode="popLayout">
                {chips.map((chip) => (
                  <motion.span
                    key={chip.key}
                    layout
                    initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.3, ease: EASE }}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--hairline)] bg-[var(--surface-2)] py-1.5 pr-1.5 pl-3 text-[12px] text-[var(--ivory)]"
                  >
                    <span className="lux-mono tracking-[0.08em] uppercase">{chip.label}</span>
                    <button
                      type="button"
                      onClick={() => update(chip.clear)}
                      aria-label={`Remove filter ${chip.label}`}
                      className="flex size-5 items-center justify-center rounded-full text-[var(--muted)] transition-colors duration-300 hover:bg-[var(--glass)] hover:text-[var(--ivory)]"
                    >
                      <X className="size-3.5" strokeWidth={1.5} aria-hidden />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
              <Button
                variant="ghost"
                onClick={() =>
                  update({ colors: [], materials: [], minPrice: undefined, maxPrice: undefined, query: "" })
                }
                className="h-8 rounded-full px-3 text-[12px] text-[var(--muted)] hover:text-[var(--ivory)]"
              >
                Clear all
              </Button>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* States. */}
        {failed ? (
          <div className="mt-8">
            <ErrorState onRetry={load} />
          </div>
        ) : all === null ? (
          <div className="mt-8">
            <SectionSkeletons variant="product-grid" count={8} />
          </div>
        ) : visible.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              eyebrow="No matches"
              title="Nothing matches."
              body="Loosen a filter or two — the archive is bigger than this view."
              action={
                <Button
                  variant="secondary"
                  onClick={() =>
                    update({
                      category: "All",
                      colors: [],
                      materials: [],
                      minPrice: undefined,
                      maxPrice: undefined,
                      query: "",
                    })
                  }
                  className="h-11 rounded-full px-6 text-[13px]"
                >
                  Clear filters
                </Button>
              }
            />
          </div>
        ) : (
          <motion.ul
            layout
            className="mt-8 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4"
            aria-label="Archive"
          >
            <AnimatePresence mode="popLayout">
              {visible.map((product, i) => (
                <ProductCard
                  key={product.id}
                  index={i}
                  product={{
                    id: product.id,
                    name: product.name,
                    price: formatCents(product.priceCents),
                    image: product.image,
                    rating: product.rating,
                    colorways: product.colorways,
                  }}
                  href={`/products/${product.id}`}
                />
              ))}
            </AnimatePresence>
          </motion.ul>
        )}

        {/* Closing band. */}
        <div className="mt-20 flex flex-col items-start justify-between gap-6 rounded-2xl border border-[var(--hairline)] bg-[var(--surface-1)] p-8 sm:flex-row sm:items-center sm:p-12">
          <div className="flex max-w-xl flex-col gap-2">
            <span className="lux-eyebrow text-[var(--lime)]">Custom</span>
            <h2 className="lux-display text-[26px] text-[var(--ivory)] sm:text-[30px]">
              Can&rsquo;t find a blank?
            </h2>
            <p className="text-[15px] leading-[1.6] text-[var(--muted)]">
              Start from the studio — pick a substrate, shape the colour, drop your own artwork on it.
            </p>
          </div>
          <Button
            asChild
            className="h-12 shrink-0 rounded-full bg-signal px-7 text-[15px] text-on-signal hover:bg-signal/90"
          >
            <Link href="/studio">
              Start from the studio
              <ArrowRight className="size-4" strokeWidth={1.5} aria-hidden />
            </Link>
          </Button>
        </div>
      </PageShell>

      {/* Filters: Popover on desktop, bottom sheet on mobile. */}
      {isDesktop ? (
        <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
          <PopoverTrigger className="sr-only">Filters</PopoverTrigger>
          <PopoverContent
            id="shop-filters"
            align="end"
            onCloseAutoFocus={(event) => {
              // Radix would restore focus to the invisible sr-only trigger at
              // the end of the DOM — return it to the visible Filters button.
              event.preventDefault();
              filtersButtonRef.current?.focus();
            }}
            className="w-[22rem] rounded-2xl p-5"
            aria-label="Filters"
          >
            <FilterPanel query={query} onChange={update} idPrefix="pop" />
          </PopoverContent>
        </Popover>
      ) : (
        <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
          <DialogContent
            id="shop-filters"
            onCloseAutoFocus={(event) => {
              // No DialogTrigger exists to restore focus to — return it to the
              // visible Filters button, matching the desktop popover.
              event.preventDefault();
              filtersButtonRef.current?.focus();
            }}
            className="lux bottom-0 top-auto max-w-none translate-y-0 gap-0 rounded-b-none rounded-t-[var(--card-radius)] border-b-0 p-6"
          >
            <DialogTitle className="sr-only">Filters</DialogTitle>
            <FilterPanel query={query} onChange={update} idPrefix="sheet" />
            <Button
              onClick={() => setFiltersOpen(false)}
              className="mt-6 h-12 w-full rounded-full bg-signal text-[15px] text-on-signal hover:bg-signal/90"
            >
              Show {visible.length} {visible.length === 1 ? "blank" : "blanks"}
            </Button>
          </DialogContent>
        </Dialog>
      )}

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} products={all ?? []} />
    </div>
  );
}

