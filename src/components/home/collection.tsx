"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Section } from "@/components/home/section";
import { EASE, viewportOnce } from "@/components/home/motion";

type Product = {
  id: string;
  name: string;
  price: string;
  image: string;
  category: "Apparel" | "Drinkware" | "Headwear";
  rating: number;
  colorways: { name: string; hex: string }[];
};

/**
 * Phase 1 placeholder catalog (see D-019). Static images/prices; no money is
 * computed and nothing is read from the DB until Phase 4.
 * NOTE: the cap asset is a neutral embroidered-patch placeholder — no
 * third-party trademark ships.
 */
const products: Product[] = [
  {
    id: "heavyweight-boxy-tee",
    name: "Heavyweight Boxy Tee",
    price: "$48.00",
    image: "/products/heavyweight-boxy-tee.png",
    category: "Apparel",
    rating: 5.0,
    colorways: [
      { name: "Onyx", hex: "#1b1b1d" },
      { name: "Signal", hex: "#c6f135" },
      { name: "Ivory", hex: "#f2f0eb" },
    ],
  },
  {
    id: "luna-glazed-mug",
    name: "Luna Glazed Mug",
    price: "$28.00",
    image: "/products/luna-glazed-mug.png",
    category: "Drinkware",
    rating: 4.9,
    colorways: [
      { name: "Signal", hex: "#c6f135" },
      { name: "Onyx", hex: "#1b1b1d" },
      { name: "Clay", hex: "#6b6a63" },
    ],
  },
  {
    id: "structured-6-panel-cap",
    name: "Structured 6-Panel Cap",
    price: "$36.00",
    image: "/products/structured-6-panel-cap.png",
    category: "Headwear",
    rating: 4.8,
    colorways: [
      { name: "Onyx", hex: "#1b1b1d" },
      { name: "Graphite", hex: "#353437" },
      { name: "Signal", hex: "#c6f135" },
    ],
  },
  {
    id: "insulated-steel-bottle",
    name: "Insulated Steel Bottle",
    price: "$42.00",
    image: "/products/insulated-steel-bottle.png",
    category: "Drinkware",
    rating: 5.0,
    colorways: [
      { name: "Ivory", hex: "#f2f0eb" },
      { name: "Signal", hex: "#c6f135" },
      { name: "Graphite", hex: "#2a2a2c" },
    ],
  },
];

const tabs = ["All", "Apparel", "Drinkware", "Headwear"] as const;
type Tab = (typeof tabs)[number];

function ProductCard({ product, index }: { product: Product; index: number }) {
  const [activeSw, setActiveSw] = useState(0);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={viewportOnce}
      transition={{ duration: 0.7, ease: EASE, delay: index * 0.08 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.25 } }}
      className="group/card relative overflow-hidden rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] [box-shadow:var(--inner-highlight)] transition-colors duration-500 hover:border-[var(--hairline-strong)]"
    >
      <Link href={`/products/${product.id}`} className="block" aria-label={product.name}>
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-[var(--surface-2)]">
          <div
            aria-hidden
            className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
            style={{
              background: `radial-gradient(120% 80% at 50% 120%, ${(product.colorways[activeSw]?.hex ?? "#c6f135")}33, transparent 70%)`,
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
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur">
            <Star className="size-3 fill-current text-[var(--lime)]" strokeWidth={0} aria-hidden />
            <span className="lux-tabular">{product.rating.toFixed(1)}</span>
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
                      onClick={() => setActiveSw(i)}
                      className={`size-4 cursor-pointer rounded-full ring-1 transition-shadow ${
                        i === activeSw
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


/** Hardware Collection — shadcn Tabs filter + re-flowing product grid. */
export function CollectionGrid() {
  const [tab, setTab] = useState<Tab>("All");
  const filtered = tab === "All" ? products : products.filter((p) => p.category === tab);

  return (
    <Section>
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-3">
          <span className="lux-eyebrow text-[var(--lime)]">Hardware collection</span>
          <h2 className="lux-h2 lux-display text-[var(--ivory)]">Blanks engineered to endure.</h2>
        </div>
        <Link
          href="/products"
          className="group inline-flex items-center gap-1.5 self-start text-[15px] font-medium text-[var(--lime)] md:self-auto"
        >
          <span className="relative">
            Browse full archive
            <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-[var(--lime)] transition-all duration-500 group-hover:w-full" />
          </span>
          <ArrowRight
            className="size-4 transition-transform duration-300 group-hover:translate-x-1"
            strokeWidth={1.5}
          />
        </Link>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="mt-10 w-full gap-6">
        <TabsList className="h-11 gap-1 rounded-full border border-[var(--hairline)] bg-transparent p-1">
          {tabs.map((t) => (
            <TabsTrigger
              key={t}
              value={t}
              className="relative rounded-full px-4 text-[13px] text-[var(--muted)] data-active:bg-transparent data-active:shadow-none"
            >
              {tab === t && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-0 rounded-full bg-[var(--surface-2)] ring-1 ring-[var(--hairline-strong)]"
                  transition={{ type: "spring", stiffness: 260, damping: 30 }}
                />
              )}
              <span className={`relative z-10 ${tab === t ? "text-[var(--ivory)]" : ""}`}>{t}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <motion.ul layout className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </AnimatePresence>
      </motion.ul>
    </Section>
  );
}

