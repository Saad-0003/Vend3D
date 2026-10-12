"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { NumberTicker } from "@/components/ui/number-ticker";
import { CategoryStrip } from "@/components/home/category-strip";
import { EASE } from "@/components/home/motion";
import { scrollToSection } from "@/lib/lenis";

const headlineLines = ["See it. Shape it.", "Own it."];

// Colourways kept for the future 3D-model drop-in. Disabled on the home page
// for now (no live card to drive), but the data + markup stay in place.
const swatches = [
  { name: "Signal Lime", color: "#c6f135" },
  { name: "Ivory", color: "#f3f0e8" },
  { name: "Graphite", color: "#2a2a2c" },
  { name: "Clay", color: "#6b6a63" },
  { name: "Midnight", color: "#121214" },
];

const avatars = [
  { initials: "KV", from: "#c6f135", to: "#7bb0e8" },
  { initials: "MR", from: "#b9a877", to: "#8c8c93" },
  { initials: "CS", from: "#e8a1c6", to: "#c6f135" },
  { initials: "JD", from: "#7bb0e8", to: "#f3f0e8" },
];

export function Hero() {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);

  return (
    // Height is tuned so the first row of products peeks above the fold at
    // 1440×900: viewport − sticky navbar (56px) − 120px of breathing room.
    // The category marquee is the hero's bottom edge (no gap, no padding).
    <section className="relative flex min-h-[calc(100svh-56px-120px)] flex-col justify-center pt-6 sm:pt-8">
      <div className="mx-auto grid w-full max-w-[1280px] items-center gap-12 px-4 pb-12 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:pb-16">
        {/* Text column — kept close to the visual so there's no dead middle gap.
            Left padding keeps the block off the page edge for a balanced feel. */}
        <div className="flex flex-col items-start gap-6 pl-4 sm:pl-8 lg:gap-7 lg:pl-14">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="lux-eyebrow text-[var(--muted)] inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-3.5 py-1.5 ring-1 ring-[var(--hairline)]"
          >
            <span className="bg-[var(--lime)] size-1.5 rounded-full" />
            Next-gen realtime 3D studio
          </motion.span>

          <h1 className="lux-h1 lux-display text-[var(--ivory)]">
            {headlineLines.map((line, i) => (
              <span key={line} className="block overflow-hidden">
                <motion.span
                  className={line === "Own it." ? "inline-block text-[var(--lime)]" : "inline-block"}
                  // `initial` must not branch on the reduced-motion preference: the
                  // server cannot resolve it, so a reduced-motion client hydrates with
                  // a different style, React drops the subtree, and the hero's CTA
                  // links stop responding to clicks. Reduced motion zeroes the
                  // transition instead, which keeps the documented rise.
                  initial={{ y: "110%", opacity: 0 }}
                  animate={{ y: "0%", opacity: 1 }}
                  transition={{
                    duration: reduced ? 0 : 0.85,
                    ease: EASE,
                    delay: reduced ? 0 : 0.1 + i * 0.09,
                  }}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.45 }}
            className="max-w-md text-[17px] leading-[1.6] text-[var(--muted)]"
          >
            Physical objects shaped and customized in real-time. Photorealistic studio preview with
            zero latency.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.55 }}
            className="flex flex-wrap items-center gap-3"
          >
            <ShimmerButton
              shimmerColor="#0a0a0b"
              shimmerDuration="4s"
              background="#f3f0e8"
              borderRadius="999px"
              className="h-12 px-7 text-[15px] font-medium text-[var(--ink)]"
            >
              <Link href="/studio" className="inline-flex items-center gap-2">
                Start designing
                <motion.span whileHover={{ x: 4 }} transition={{ duration: 0.25 }}>
                  <ArrowRight className="size-4" strokeWidth={1.5} />
                </motion.span>
              </Link>
            </ShimmerButton>

            <button
              type="button"
              onClick={() => scrollToSection("shop")}
              className="inline-flex h-12 cursor-pointer items-center rounded-full px-7 text-[15px] font-medium text-[var(--ivory)] ring-1 ring-[var(--hairline-strong)] transition-colors duration-300 hover:bg-[var(--surface-2)]"
            >
              Shop
            </button>
          </motion.div>

          {/* Trust row. */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="flex w-full max-w-md flex-wrap items-center gap-x-4 gap-y-2"
          >
            <div className="flex -space-x-2.5">
              {avatars.map((a, i) => (
                <motion.span
                  key={a.initials}
                  aria-hidden
                  className="flex size-8 items-center justify-center rounded-full text-[10px] font-semibold text-[var(--ink)] ring-2 ring-[var(--ink)]"
                  style={{ background: `linear-gradient(135deg, ${a.from}, ${a.to})` }}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.75 + i * 0.08, ease: EASE }}
                >
                  {a.initials}
                </motion.span>
              ))}
            </div>
            <div className="flex items-center gap-0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.span
                  key={i}
                  className="text-[var(--lime)]"
                  initial={{ opacity: 0.25, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.85 + i * 0.09, ease: EASE }}
                >
                  <Star className="size-3.5 fill-current" strokeWidth={0} aria-hidden />
                </motion.span>
              ))}
            </div>
            <span className="lux-tabular text-[var(--ivory)] text-[15px]">
              <NumberTicker value={4.9} decimalPlaces={1} />
            </span>
            <span className="text-[14px] text-[var(--muted)]">from 2,000+ makers</span>
          </motion.div>
        </div>


        {/* Visual column — a simple, borderless product shot. This is the drop-in
            slot for the future real-time 3D bottle model (no card, ring, or stage). */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}
          className="relative flex flex-col items-center gap-6"
        >
          {/* Soft lime orb behind the product for depth (no hard card edge). */}
          <div
            aria-hidden
            className="absolute top-1/2 left-1/2 size-[min(34rem,80%)] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[80px]"
            style={{ background: "radial-gradient(circle, var(--lime-glow), transparent 70%)" }}
          />

          <motion.div
            className="relative aspect-square w-full max-w-[440px]"
            animate={reduced ? {} : { y: [-6, 6, -6] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src="/products/insulated-steel-bottle.png"
              alt="Insulated steel bottle rendered in the 3D studio"
              fill
              priority
              sizes="(max-width: 1024px) 90vw, 440px"
              className="object-contain drop-shadow-[0_40px_50px_rgba(0,0,0,0.5)]"
            />
          </motion.div>

          {/* Colourways — preserved for the future model, disabled for now. */}
          <ul aria-label="Available colorways" className="flex items-center gap-3">
            {swatches.map((s, i) => (
              <li key={s.name}>
                <button
                  type="button"
                  aria-label={s.name}
                  aria-pressed={active === i}
                  disabled
                  onClick={() => setActive(i)}
                  className="relative block size-6 cursor-not-allowed rounded-full opacity-40 ring-1 ring-[var(--hairline-strong)]"
                  style={{ backgroundColor: s.color }}
                />
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Category marquee closes the hero — its bottom hairline is the seam
          between the hero and the shop grid directly below it. */}
      <CategoryStrip />
    </section>
  );
}

