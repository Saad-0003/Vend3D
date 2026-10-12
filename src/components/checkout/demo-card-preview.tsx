"use client";

import { motion, useReducedMotion } from "framer-motion";

import { digitsOnly, cardBrandLabel, type CardBrand } from "@/lib/payment/card";
import { cn } from "@/lib/utils";

/** EASE — the single curve the whole system animates on. */
const EASE = [0.22, 1, 0.36, 1] as const;

/** "4242 •••• •••• ••••" while typing, four groups of four. */
function displayNumber(raw: string): string {
  const digits = digitsOnly(raw);
  const groups = Array.from({ length: 4 }, (_, i) => digits.slice(i * 4, i * 4 + 4).padEnd(4, "•"));
  return groups.join(" ");
}

/**
 * The glass demo card. It is a pure mirror of the payment step's form state —
 * no card data is held here, stored anywhere, or sent anywhere. The card flips
 * to its back while the CVC field has focus.
 *
 * `aria-hidden` because every value shown also exists in a labelled input;
 * announcing it twice would just be noise. The brand is announced separately.
 */
export function DemoCardPreview({
  number,
  name,
  expiry,
  cvc,
  flipped,
  brand,
}: {
  number: string;
  name: string;
  expiry: string;
  cvc: string;
  flipped: boolean;
  brand: CardBrand | null;
}) {
  const reduced = useReducedMotion();

  return (
    <div className="[perspective:1200px]">
      <motion.div
        className="relative [transform-style:preserve-3d]"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: reduced ? 0 : 0.55, ease: EASE }}
      >
        {/* Front */}
        <div
          aria-hidden
          className={cn(
            // 1.586:1 is the ISO/IEC 7810 ID-1 card ratio, capped so the card
            // reads as a card instead of a banner on the 560px column.
            "glass-panel flex aspect-[1.586/1] w-full max-w-[520px] flex-col justify-between gap-6 rounded-[var(--card-radius)] p-6 sm:p-7",
            "[backface-visibility:hidden]",
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <span className="flex flex-col gap-1">
              <span className="lux-mono text-[10px] tracking-[0.16em] text-[var(--muted)] uppercase">Demo card</span>
              <span className="lux-mono text-[11px] tracking-[0.12em] text-[var(--faint)] uppercase">Vend3D</span>
            </span>
            <BrandMark brand={brand} />
          </div>

          <p className="lux-mono lux-tabular text-[19px] tracking-[0.08em] text-[var(--ivory)] sm:text-[23px]">
            {displayNumber(number)}
          </p>

          <div className="flex items-end justify-between gap-6">
            <span className="flex min-w-0 flex-col gap-1">
              <span className="lux-mono text-[9px] tracking-[0.16em] text-[var(--muted)] uppercase">Cardholder</span>
              <span className="truncate text-[14px] text-[var(--ivory)]">{name.trim() || "Your name"}</span>
            </span>
            <span className="flex flex-col gap-1">
              <span className="lux-mono text-[9px] tracking-[0.16em] text-[var(--muted)] uppercase">Expires</span>
              <span className="lux-mono lux-tabular text-[14px] text-[var(--ivory)]">{expiry || "MM/YY"}</span>
            </span>
          </div>
        </div>

        {/* Back */}
        <div
          aria-hidden
          className={cn(
            "glass-panel absolute inset-0 flex flex-col gap-4 rounded-[var(--card-radius)] p-6",
            "[backface-visibility:hidden] [transform:rotateY(180deg)]",
          )}
        >
          <span className="-mx-6 h-11 bg-[var(--surface-3)]" />
          <div className="flex flex-1 flex-col justify-center gap-3">
            <span className="lux-mono text-[9px] tracking-[0.16em] text-[var(--muted)] uppercase">Security code</span>
            <div className="flex items-center gap-3">
              <span className="h-9 flex-1 rounded-[6px] bg-[var(--surface-3)]" />
              <span className="lux-mono lux-tabular grid h-9 w-16 place-items-center rounded-[6px] bg-[var(--surface-1)] text-[14px] text-[var(--ivory)] ring-1 ring-[var(--hairline)]">
                {cvc || "•••"}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function BrandMark({ brand }: { brand: CardBrand | null }) {
  return (
    <span
      className={cn(
        "lux-mono rounded-full px-2.5 py-1 text-[9px] tracking-[0.18em] uppercase ring-1",
        brand
          ? "bg-[var(--lime-glow)] text-[var(--lime)] ring-[color-mix(in_srgb,var(--lime)_35%,transparent)]"
          : "bg-[var(--surface-2)] text-[var(--muted)] ring-[var(--hairline)]",
      )}
    >
      {brand ? cardBrandLabel(brand) : "Card"}
    </span>
  );
}
