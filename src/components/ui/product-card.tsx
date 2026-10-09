"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { cn } from "@/lib/utils";

/** EASE from `components/home/motion.ts`. */
const EASE = [0.22, 1, 0.36, 1] as const;

export type ProductCardProduct = {
  id: string;
  name: string;
  /** Pre-formatted display price — never compute money in the client (AGENTS §6.1). */
  price: string;
  image: string;
  rating: number;
  colorways: { name: string; hex: string }[];
  /**
   * Optional per-colourway image overrides, keyed by the lowercased colourway
   * name. Absent (or a missing key) falls back to `image` — every card in the
   * Phase 1 catalog has none yet, so hovering a swatch only re-tints the card.
   */
  variants?: Record<string, string>;
};

/** `?color=` value for a colourway: lowercased, hyphenated. */
function colorSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

/**
 * The landing page's product card, lifted verbatim out of
 * `components/home/collection.tsx` so every screen renders one identical card
 * (rule 3: never build a second card). Blur reveal, hover wash, colourway dots
 * and the sliding "Customize" bar are unchanged.
 */
export function ProductCard({
  product,
  index = 0,
  href,
  className,
}: {
  product: ProductCardProduct;
  index?: number;
  /** Defaults to `/products/{id}`. */
  href?: string;
  className?: string;
}) {
  // Hovering a swatch re-tints the card wash and swaps the media when the
  // catalog ships a per-colourway variant. Pointer-out falls back to the first
  // (default) colourway, matching the landing page's original behaviour.
  const [active, setActive] = useState(0);
  const base = href ?? `/products/${product.id}`;
  const swatch = product.colorways[active];
  const media = (swatch && product.variants?.[colorSlug(swatch.name)]) ?? product.image;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-15% 0px -15% 0px" }}
      transition={{ duration: 0.7, ease: EASE, delay: index * 0.08 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.25 } }}
      className={cn(
        // `flex flex-col` + `flex-1` on the meta block keeps every card the same
        // height regardless of how far the product name wraps, so no card can
        // sit higher than its row neighbours on hover.
        "group/card relative flex flex-col overflow-hidden rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] [box-shadow:var(--inner-highlight)] transition-colors duration-500 hover:border-[var(--hairline-strong)]",
        className,
      )}
    >
      <Link href={href ?? `/products/${product.id}`} className="block" aria-label={product.name}>
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-[var(--surface-2)]">
          <div
            aria-hidden
            className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
            style={{
              background: `radial-gradient(120% 80% at 50% 120%, ${swatch?.hex ?? "#c6f135"}33, transparent 70%)`,
            }}
          />
          <Image
            src={media}
            alt={`${product.name} — ${swatch?.name ?? "default colorway"}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 ease-out group-hover/card:scale-[1.04]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
          />
          <span className="lux-tabular absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur">
            <Star className="size-3 fill-current text-[var(--lime)]" strokeWidth={0} aria-hidden />
            {product.rating.toFixed(1)}
          </span>
          <div className="absolute inset-x-0 bottom-0 translate-y-full bg-[var(--ink)]/80 py-3 text-center text-[13px] font-medium text-[var(--ivory)] backdrop-blur transition-transform duration-500 ease-out group-hover/card:translate-y-0">
            Customize
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="lux-display text-[18px] text-[var(--ivory)]">{product.name}</span>
          <span className="lux-mono lux-tabular text-[14px] text-[var(--muted)]">
            {product.price}
          </span>
        </div>
        <TooltipProvider delayDuration={120}>
          <ul
            aria-label={`${product.name} colorways`}
            className="mt-auto flex items-center gap-2"
          >
            {product.colorways.map((c, i) => (
              <li key={c.name}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      // Clicking a swatch opens Studio with the colour pre-applied,
                      // so it navigates rather than toggling local state.
                      href={`${base}?color=${colorSlug(c.name)}`}
                      aria-label={`${product.name} — ${c.name}`}
                      onPointerEnter={() => setActive(i)}
                      onFocus={() => setActive(i)}
                      className={`block size-4 rounded-full ring-1 transition-shadow ${
                        active === i
                          ? "ring-2 ring-[var(--lime)] ring-offset-2 ring-offset-[var(--surface-1)]"
                          : "ring-[var(--hairline-strong)]"
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>{c.name}</TooltipContent>
                </Tooltip>
              </li>
            ))}
          </ul>
        </TooltipProvider>
      </div>
    </motion.li>
  );
}
