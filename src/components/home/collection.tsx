"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard as SharedProductCard } from "@/components/ui/product-card";
import { Section } from "@/components/home/section";

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

/**
 * The landing card IS the shared components/ui/product-card.tsx — aliased here
 * so the landing page and every other screen can never drift apart
 * (docs/DESIGN.md rule 3: never build a second card).
 */
const ProductCard = SharedProductCard;

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

