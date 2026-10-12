"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberTicker } from "@/components/ui/number-ticker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { formatCents } from "@/lib/format";

export const QTY_MIN = 1;
export const QTY_MAX = 10;

/**
 * Sticky purchase bar, desktop footer of the studio column and mobile bottom
 * bar. Price and quantity come in as values; this component never computes
 * money. The add-to-cart pill is the landing page's lime ShimmerButton.
 */
export function StudioFooter({
  quantity,
  totalCents,
  onQuantity,
  onAddToCart,
  onSaveDesign,
}: {
  quantity: number;
  totalCents: number;
  onQuantity: (qty: number) => void;
  onAddToCart: () => void;
  onSaveDesign: (name: string) => void;
}) {
  return (
    <div className="sticky bottom-0 z-30 -mx-4 border-t border-[var(--hairline)] bg-[var(--ink)]/90 px-4 py-4 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-t-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-4 lg:flex-nowrap lg:justify-between">
        <div className="flex flex-col gap-1">
          <span
            className="lux-mono lux-tabular flex items-baseline text-[20px] text-[var(--ivory)]"
            aria-live="polite"
            aria-label={`Total ${formatCents(totalCents)}`}
          >
            <span aria-hidden>$</span>
            <NumberTicker value={totalCents / 100} decimalPlaces={2} startValue={totalCents / 100} />
          </span>
          <span className="lux-mono text-[10px] tracking-[0.16em] text-[var(--faint)] uppercase">
            Dispatched in 48 hours
          </span>
        </div>

        <div className="flex items-center gap-2" role="group" aria-label="Quantity">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Decrease quantity"
            disabled={quantity <= QTY_MIN}
            onClick={() => onQuantity(quantity - 1)}
            className="size-11 rounded-full"
          >
            <Minus className="size-4" strokeWidth={1.5} />
          </Button>
          <span className="lux-mono lux-tabular w-8 text-center text-[15px] text-[var(--ivory)]" aria-live="polite">
            {quantity}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Increase quantity"
            disabled={quantity >= QTY_MAX}
            onClick={() => onQuantity(quantity + 1)}
            className="size-11 rounded-full"
          >
            <Plus className="size-4" strokeWidth={1.5} />
          </Button>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3">
          <SaveDesignButton onSave={onSaveDesign} />
          <ShimmerButton
            onClick={onAddToCart}
            shimmerColor="#0a0a0b"
            shimmerDuration="4s"
            background="#c6f135"
            borderRadius="999px"
            className="h-12 px-7 text-[15px] font-medium text-[var(--ink)]"
          >
            Add to cart
          </ShimmerButton>
        </div>
      </div>
    </div>
  );
}

function SaveDesignButton({ onSave }: { onSave: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  function submit() {
    const trimmed = name.trim().slice(0, 50) || "Untitled design";
    onSave(trimmed);
    setName("");
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="h-12 rounded-full px-6 text-[15px] text-[var(--ivory)] ring-1 ring-[var(--hairline-strong)] hover:bg-[var(--surface-2)]"
        >
          Save design
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="lux flex w-72 flex-col gap-3 rounded-[var(--inner-radius)] bg-[var(--surface-2)] p-4">
        <label htmlFor="design-name" className="lux-mono text-[11px] tracking-[0.16em] text-[var(--muted)] uppercase">
          Design name
        </label>
        <Input
          id="design-name"
          value={name}
          maxLength={50}
          placeholder="My design"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          className="h-11 rounded-full bg-[var(--surface-3)] px-4 text-[var(--ivory)]"
        />
        <Button type="button" onClick={submit} className="h-11 rounded-full bg-[var(--ivory)] text-[var(--ink)] hover:bg-[var(--ivory)]/90">
          Save
        </Button>
      </PopoverContent>
    </Popover>
  );
}
