"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, ExternalLink, MoreHorizontal, Pencil, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { formatCents } from "@/lib/format";
import { getProductConfig } from "@/lib/products/config";
import { relativeTime } from "@/lib/designs/library";
import { useCartStore } from "@/stores/cart-store";
import { useDesignsStore, type SavedDesign } from "@/stores/designs-store";

/**
 * One saved design, as a card. Shared by `/designs` and the account library so
 * the two never drift (DESIGN.md rule 3: never a second card style).
 *
 * `now` is injected rather than read from the clock so the caller owns the
 * refresh interval and the component stays render-pure.
 */
export function DesignCard({ design, now }: { design: SavedDesign; now: number }) {
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
            <DropdownMenuContent align="end" className="lux w-44 rounded-[var(--inner-radius)] border-[var(--hairline)] bg-[var(--surface-2)] p-1.5 text-[var(--ivory)]">
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
        <DialogContent className="lux rounded-[var(--card-radius)] border-[var(--hairline)] bg-[var(--surface-1)] text-[var(--ivory)]">
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
