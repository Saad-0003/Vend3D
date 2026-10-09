"use client";

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
};

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
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-15% 0px -15% 0px" }}
      transition={{ duration: 0.7, ease: EASE, delay: index * 0.08 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.25 } }}
      className={cn(
        "group/card relative overflow-hidden rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] [box-shadow:var(--inner-highlight)] transition-colors duration-500 hover:border-[var(--hairline-strong)]",
        className,
      )}
    >
      <Link href={href ?? `/products/${product.id}`} className="block" aria-label={product.name}>
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-[var(--surface-2)]">
          <div
            aria-hidden
            className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
            style={{
              background: `radial-gradient(120% 80% at 50% 120%, ${product.colorways[0]?.hex ?? "#c6f135"}33, transparent 70%)`,
            }}
          />
          <Image
            src={product.image}
            alt={product.name}
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

      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="lux-display text-[18px] text-[var(--ivory)]">{product.name}</span>
          <span className="lux-mono lux-tabular text-[14px] text-[var(--muted)]">
            {product.price}
          </span>
        </div>
        <TooltipProvider delayDuration={120}>
          <ul aria-label={`${product.name} colorways`} className="flex items-center gap-2">
            {product.colorways.map((c, i) => (
              <li key={c.name}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={`${product.name} — ${c.name}`}
                      className={`size-4 cursor-pointer rounded-full ring-1 transition-shadow ${
                        i === 0
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
