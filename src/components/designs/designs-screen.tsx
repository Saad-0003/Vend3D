"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Copy, MoreHorizontal, Pencil, ShoppingBag, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCents } from "@/lib/format";
import { getProductConfig } from "@/lib/products/config";
import {
  isDesignSort,
  isDesignTab,
  productsIn,
  relativeTime,
  selectDesigns,
  type DesignSort,
  type DesignTab,
} from "@/lib/designs/library";
import { useCartStore } from "@/stores/cart-store";
import { useDesignsStore, type SavedDesign } from "@/stores/designs-store";
import { cn } from "@/lib/utils";

const ALL = "all";

/**
 * `/designs`: the user's saved configurations. Filter and sort state lives in
 * the URL so a filtered view can be shared and survives a reload. Storage is
 * the local designs store until accounts exist (plan.md Phase 7).
 */
export function DesignsScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const designs = useDesignsStore((s) => s.designs);
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const tabParam = params.get("tab");
  const sortParam = params.get("sort");
  const tab: DesignTab = isDesignTab(tabParam) ? tabParam : "all";
  const sort: DesignSort = isDesignSort(sortParam) ? sortParam : "recent";
  const product = params.get("product") ?? ALL;

  useEffect(() => {
    useDesignsStore.persist.rehydrate();
    setHydrated(true);
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value === ALL || value === "recent" || value === "all") next.delete(key);
    else next.set(key, value);
    const qs = next.toString();
    router.replace(qs ? `/designs?${qs}` : "/designs", { scroll: false });
  }

  const visible = useMemo(
    () => selectDesigns(designs, { tab, sort, product }),
    [designs, tab, sort, product],
  );
  const productOptions = useMemo(() => productsIn(designs), [designs]);
  const counts = useMemo(
    () => ({
      all: designs.length,
      drafts: designs.filter((d) => !d.orderedAt).length,
      ordered: designs.filter((d) => !!d.orderedAt).length,
    }),
    [designs],
  );

  return (
    <PageShell aria-label="Designs" className="lux flex flex-col gap-10">
      <PageHeader
        eyebrow="Designs"
        title="Your designs."
        intro="Every configuration you save in the studio. Open one to keep shaping it, or add it to your cart."
        action={
          <Button asChild className="h-12 rounded-full bg-[var(--ivory)] px-7 text-[15px] font-medium text-[var(--ink)] hover:bg-[var(--ivory)]/90">
            <Link href="/studio">
              New design
              <ArrowRight className="size-4" strokeWidth={1.5} aria-hidden />
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Tabs value={tab} onValueChange={(v) => setParam("tab", v)}>
          <TabsList className="h-11 rounded-full border border-[var(--hairline)] bg-transparent p-1">
            {(["all", "drafts", "ordered"] as const).map((t) => (
              <TabsTrigger
                key={t}
                value={t}
                className="rounded-full px-4 text-[13px] text-[var(--muted)] data-[state=active]:bg-[var(--surface-2)] data-[state=active]:text-[var(--ivory)] data-[state=active]:ring-1 data-[state=active]:ring-[var(--hairline-strong)]"
              >
                {t === "all" ? "All" : t === "drafts" ? "Drafts" : "Ordered"}
                <span className="lux-mono lux-tabular ml-2 text-[11px] text-[var(--faint)]">{counts[t]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-3">
          <Select value={product} onValueChange={(v) => setParam("product", v)}>
            <SelectTrigger aria-label="Filter by product" className="h-11 min-w-[180px] rounded-full border-[var(--hairline)] bg-[var(--surface-1)] px-4 text-[var(--ivory)]">
              <SelectValue placeholder="All products" />
            </SelectTrigger>
            <SelectContent className="rounded-[var(--inner-radius)] border-[var(--hairline)] bg-[var(--surface-2)] text-[var(--ivory)]">
              <SelectItem value={ALL}>All products</SelectItem>
              {productOptions.map((p) => (
                <SelectItem key={p.slug} value={p.slug}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={(v) => setParam("sort", v)}>
            <SelectTrigger aria-label="Sort designs" className="h-11 min-w-[150px] rounded-full border-[var(--hairline)] bg-[var(--surface-1)] px-4 text-[var(--ivory)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-[var(--inner-radius)] border-[var(--hairline)] bg-[var(--surface-2)] text-[var(--ivory)]">
              <SelectItem value="recent">Recent</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!hydrated ? (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading designs">
          {Array.from({ length: 3 }, (_, i) => (
            <li key={i} className="overflow-hidden rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)]">
              <Skeleton className="aspect-[4/3] w-full rounded-none" />
              <div className="flex flex-col gap-3 p-5">
                <Skeleton className="h-5 w-2/3 rounded-full" />
                <Skeleton className="h-4 w-1/3 rounded-full" />
              </div>
            </li>
          ))}
        </ul>
      ) : designs.length === 0 ? (
        <EmptyState
          eyebrow="Nothing saved yet"
          title="Nothing shaped yet."
          body="Save a design from the studio and it will appear here, ready to reopen or order."
          icon={<SketchHint />}
          action={
            <Button asChild className="h-12 rounded-full bg-[var(--ivory)] px-7 text-[var(--ink)] hover:bg-[var(--ivory)]/90">
              <Link href="/studio">Start designing</Link>
            </Button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          eyebrow="No matches"
          title="No designs match these filters."
          body="Try another tab or product, or clear the filters."
          action={
            <Button variant="ghost" className="h-11 rounded-full px-5 text-[var(--ivory)] ring-1 ring-[var(--hairline-strong)]" onClick={() => router.replace("/designs", { scroll: false })}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((design) => (
            <DesignCard key={design.id} design={design} now={now} />
          ))}
        </ul>
      )}
    </PageShell>
  );
}

function DesignCard({ design, now }: { design: SavedDesign; now: number }) {
  const router = useRouter();
  const [renaming, setRenaming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draft, setDraft] = useState(design.name);
  const renameDesign = useDesignsStore((s) => s.renameDesign);
  const duplicateDesign = useDesignsStore((s) => s.duplicateDesign);
  const removeDesign = useDesignsStore((s) => s.removeDesign);
  const restoreDesign = useDesignsStore((s) => s.restoreDesign);
  const config = getProductConfig(design.slug);
  const palette = paletteOf(design);
  const openHref = `/products/${design.slug}?design=${design.id}`;

  function commitRename() {
    const next = draft.trim();
    if (next && next !== design.name) renameDesign(design.id, next);
    else setDraft(design.name);
    setRenaming(false);
  }

  function addToCart() {
    if (!config) return;
    useCartStore.getState().addLine({
      slug: design.slug,
      name: design.name,
      configuration: design.configuration,
      thumbnail: design.thumbnail,
      qty: 1,
      unitCents: config.priceCents,
    });
    useCartStore.getState().setDrawerOpen(true);
  }

  function confirmRemove() {
    const removed = removeDesign(design.id);
    setConfirmDelete(false);
    if (!removed) return;
    toast("Design deleted", {
      description: removed.name,
      action: { label: "Undo", onClick: () => restoreDesign(removed) },
    });
  }

  return (
    <li className="group/design relative flex flex-col overflow-hidden rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] [box-shadow:var(--inner-highlight)] transition-[transform,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-[var(--hairline-strong)]">
      <Link href={openHref} aria-label={`Open ${design.name} in studio`} className="relative block aspect-[4/3] w-full overflow-hidden bg-[var(--surface-2)]">
        {design.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={design.thumbnail} alt="" className="size-full object-cover transition-transform duration-500 group-hover/design:scale-[1.03]" />
        ) : config ? (
          <Image
            src={`/products/${design.slug}.png`}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover/design:scale-[1.03]"
          />
        ) : null}
        <span className="lux-mono absolute top-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] tracking-[0.14em] text-white/90 uppercase backdrop-blur">
          {design.orderedAt ? "Ordered" : "Draft"}
        </span>

        <div className="absolute inset-x-3 bottom-3 flex items-center justify-center gap-2 opacity-0 transition-opacity duration-300 group-hover/design:opacity-100 group-focus-within/design:opacity-100">
          <span className="lux-mono rounded-full bg-[var(--surface-2)]/90 px-3 py-2 text-[11px] tracking-[0.14em] text-[var(--ivory)] uppercase ring-1 ring-[var(--hairline-strong)] backdrop-blur">
            Open in studio
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          {renaming ? (
            <Input
              autoFocus
              value={draft}
              maxLength={50}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") {
                  setDraft(design.name);
                  setRenaming(false);
                }
              }}
              aria-label="Design name"
              className="h-9 rounded-full bg-[var(--surface-2)] px-4 text-[var(--ivory)]"
            />
          ) : (
            <span className="lux-display min-w-0 truncate text-[18px] text-[var(--ivory)]">{design.name}</span>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`More actions for ${design.name}`} className="size-11 shrink-0 rounded-full text-[var(--muted)] hover:text-[var(--ivory)]">
                <MoreHorizontal className="size-4" strokeWidth={1.5} aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-[var(--inner-radius)] border-[var(--hairline)] bg-[var(--surface-2)] p-1.5 text-[var(--ivory)]">
              <DropdownMenuItem onSelect={() => router.push(openHref)}>
                <ExternalLink className="size-4" strokeWidth={1.5} aria-hidden /> Open
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => duplicateDesign(design.id)}>
                <Copy className="size-4" strokeWidth={1.5} aria-hidden /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => { setDraft(design.name); setRenaming(true); }}>
                <Pencil className="size-4" strokeWidth={1.5} aria-hidden /> Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setConfirmDelete(true)} className="text-[var(--destructive)]">
                <Trash2 className="size-4" strokeWidth={1.5} aria-hidden /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="lux-mono rounded-full bg-[var(--surface-2)] px-3 py-1 text-[10px] tracking-[0.14em] text-[var(--muted)] uppercase ring-1 ring-[var(--hairline)]">
            {design.productName}
          </span>
          {config ? (
            <span className="lux-mono lux-tabular text-[12px] text-[var(--ivory)]">{formatCents(config.priceCents)}</span>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3">
          <ul aria-label="Colour palette" className="flex items-center gap-1.5">
            {palette.map((hex, i) => (
              <li key={`${hex}-${i}`} className="size-4 rounded-full ring-1 ring-[var(--hairline-strong)]" style={{ backgroundColor: hex }} />
            ))}
          </ul>
          <span className="lux-mono text-[10px] tracking-[0.12em] text-[var(--muted)] uppercase">
            {relativeTime(design.updatedAt, now)}
          </span>
        </div>

        <div className="mt-auto flex items-center gap-2 pt-2">
          <Button asChild variant="ghost" className="h-11 flex-1 rounded-full text-[var(--ivory)] ring-1 ring-[var(--hairline-strong)] hover:bg-[var(--surface-2)]">
            <Link href={openHref}>Open in studio</Link>
          </Button>
          <Button
            onClick={addToCart}
            disabled={!config}
            aria-label={`Add ${design.name} to cart`}
            className="h-11 rounded-full bg-[var(--lime)] px-4 text-[var(--ink)] hover:bg-[var(--lime)]/90"
          >
            <ShoppingBag className="size-4" strokeWidth={1.5} aria-hidden />
            Add to cart
          </Button>
        </div>
      </div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="rounded-[var(--card-radius)] border-[var(--hairline)] bg-[var(--surface-1)] text-[var(--ivory)]">
          <DialogHeader>
            <DialogTitle className="lux-display text-[22px]">Delete this design?</DialogTitle>
            <DialogDescription className="text-[var(--muted)]">
              &ldquo;{design.name}&rdquo; will be removed from this browser. You can undo for a few seconds after.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="ghost" className="h-11 rounded-full px-5 text-[var(--ivory)] ring-1 ring-[var(--hairline-strong)]">
                Keep it
              </Button>
            </DialogClose>
            <Button onClick={confirmRemove} className="h-11 rounded-full bg-[var(--destructive)] px-5 text-[var(--ink)] hover:bg-[var(--destructive)]/90">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  );
}

/** Up to five distinct swatch colours taken from the configuration's parts. */
function paletteOf(design: SavedDesign): string[] {
  const hexes = Object.values(design.configuration.parts).map((p) => p.color);
  return [...new Set(hexes)].slice(0, 5);
}

/** Quiet looping SVG hint for the empty state. Decorative, so it is aria-hidden. */
function SketchHint() {
  return (
    <svg viewBox="0 0 120 60" className={cn("h-14 w-28 text-[var(--lime)]")} fill="none" aria-hidden>
      <path d="M8 46 C 30 4, 60 56, 112 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="160" strokeDashoffset="160">
        <animate attributeName="stroke-dashoffset" from="160" to="0" dur="3.2s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}
