"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionStyle,
} from "framer-motion";
import { ArrowRight, Star } from "lucide-react";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { NumberTicker } from "@/components/ui/number-ticker";
import { BorderBeam } from "@/components/ui/border-beam";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EASE, SPRING, useIsTouch } from "@/components/home/motion";

const lines = ["See it.", "Shape it.", "Own it."];

const swatches = [
  { name: "Signal Lime", color: "#c6f135", glow: "rgba(198,241,53,0.55)" },
  { name: "Ivory", color: "#f3f0e8", glow: "rgba(243,240,232,0.45)" },
  { name: "Graphite", color: "#2a2a2c", glow: "rgba(120,120,128,0.45)" },
  { name: "Clay", color: "#6b6a63", glow: "rgba(150,140,120,0.45)" },
  { name: "Midnight", color: "#121214", glow: "rgba(70,80,120,0.5)" },
];

const chips = [
  { label: "360° interactive view", pos: "left-[2%] top-[16%]" },
  { label: "Matte 1.8/6 food-grade steel", pos: "left-[3%] bottom-[14%]" },
  { label: "Precision laser engraving", pos: "right-[3%] bottom-[8%]" },
];

const avatars = [
  { initials: "KV", from: "#c6f135", to: "#7bb0e8" },
  { initials: "MR", from: "#b9a877", to: "#8c8c93" },
  { initials: "CS", from: "#e8a1c6", to: "#c6f135" },
  { initials: "JD", from: "#7bb0e8", to: "#f3f0e8" },
];

/** Magnetic wrapper: a gentle 6px pull toward the cursor (desktop only). */
function Magnetic({ children }: { children: React.ReactNode }) {
  const isTouch = useIsTouch();
  const reduced = useReducedMotion();
  const x = useSpring(useMotionValue(0), SPRING);
  const y = useSpring(useMotionValue(0), SPRING);

  if (isTouch || reduced) return <>{children}</>;

  return (
    <motion.div
      style={{ x, y }}
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const mx = e.clientX - (rect.left + rect.width / 2);
        const my = e.clientY - (rect.top + rect.height / 2);
        x.set((mx / rect.width) * 6);
        y.set((my / rect.height) * 6);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}


export function Hero() {
  const reduced = useReducedMotion();
  const isTouch = useIsTouch();
  const stageRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), SPRING);
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-6, 6]), SPRING);

  const inView = useInView(stageRef, { once: true, margin: "-15% 0px" });

  const onPointerMove = (e: React.PointerEvent) => {
    if (isTouch || reduced) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const tiltStyle: MotionStyle = { rotateX, rotateY, transformPerspective: 1000 };

  return (
    <section className="px-4 pt-4 sm:px-6">
      <div className="relative mx-auto w-full max-w-[1280px] overflow-hidden rounded-[var(--stage-radius)] ring-1 ring-[var(--hairline)]">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="lux-grid-bg absolute inset-0" />
          <motion.div
            className="absolute top-1/3 left-1/2 size-[42vw] max-w-[560px] -translate-x-1/2 rounded-full blur-[90px]"
            style={{ background: "radial-gradient(circle, var(--lime-glow), transparent 70%)" }}
            animate={reduced ? {} : { x: ["-6%", "6%", "-6%"], y: ["-4%", "5%", "-4%"] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="relative grid grid-cols-1 gap-10 px-6 pt-10 pb-10 lg:grid-cols-12 lg:items-center lg:gap-6 lg:px-14 lg:pt-16 lg:pb-16">
          <div className="flex flex-col items-start gap-7 lg:col-span-6">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE }}
              className="lux-eyebrow text-[var(--muted)] inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-3.5 py-1.5 ring-1 ring-[var(--hairline)]"
            >
              <span className="bg-[var(--lime)] size-1.5 rounded-full" />
              Next-gen realtime 3D studio
            </motion.span>

            <h1 className="hero-h1 lux-display text-[var(--ivory)]">
              {lines.map((line, i) => (
                <span key={line} className="block overflow-hidden">
                  <motion.span
                    className={
                      line === "Own it." ? "relative inline-block text-[var(--lime)]" : "inline-block"
                    }
                    initial={{ y: "110%" }}
                    animate={{ y: "0%" }}
                    transition={{ duration: 0.9, ease: EASE, delay: 0.1 + i * 0.09 }}
                  >
                    {line}
                    {line === "Own it." && (
                      <motion.span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent bg-[length:200%_100%] bg-clip-text text-transparent"
                        initial={{ backgroundPosition: "200% 0" }}
                        animate={{ backgroundPosition: ["200% 0", "-100% 0"] }}
                        transition={{ duration: 1.6, ease: "easeInOut", delay: 1.2 }}
                      >
                        {line}
                      </motion.span>
                    )}
                  </motion.span>
                </span>
              ))}
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.5 }}
              className="max-w-md text-[17px] leading-[1.6] text-[var(--muted)]"
            >
              Physical objects shaped and customized in real-time. Photorealistic studio preview with
              zero latency.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.6 }}
              className="flex flex-wrap items-center gap-3"
            >
              <Magnetic>
                <ShimmerButton
                  shimmerColor="#0a0a0b"
                  shimmerDuration="4s"
                  background="#f3f0e8"
                  borderRadius="999px"
                  className="h-12 px-7 text-[15px] font-medium text-[var(--ink)]"
                >
                  <Link href="/products" className="inline-flex items-center gap-2">
                    Start designing
                    <motion.span whileHover={{ x: 4 }} transition={{ duration: 0.25 }}>
                      <ArrowRight className="size-4" strokeWidth={1.5} />
                    </motion.span>
                  </Link>
                </ShimmerButton>
              </Magnetic>

              <Magnetic>
                <Link
                  href="/products"
                  className="inline-flex h-12 items-center rounded-full px-7 text-[15px] font-medium text-[var(--ivory)] ring-1 ring-[var(--hairline-strong)] transition-colors duration-300 hover:bg-[var(--surface-2)]"
                >
                  Shop
                </Link>
              </Magnetic>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.75 }}
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
                    transition={{ duration: 0.4, delay: 0.8 + i * 0.08, ease: EASE }}
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
                    transition={{ duration: 0.3, delay: 0.9 + i * 0.09, ease: EASE }}
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


          <div className="relative lg:col-span-6 lg:-ml-10 lg:pl-4">
            <div className="relative" ref={stageRef} onPointerMove={onPointerMove}>
              <TooltipProvider delayDuration={120}>
                <ul
                  aria-label="Available colorways"
                  className="absolute top-1/2 left-0 z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col gap-3 rounded-full border border-[var(--hairline)] bg-white/[0.04] px-2 py-3 backdrop-blur-xl"
                >
                  {swatches.map((s, i) => (
                    <li key={s.name}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-label={s.name}
                            aria-pressed={active === i}
                            onClick={() => setActive(i)}
                            className="relative block size-7 cursor-pointer rounded-full ring-1 ring-[var(--hairline-strong)] focus-visible:outline-none"
                            style={{ backgroundColor: s.color }}
                          >
                            {active === i && (
                              <motion.span
                                layoutId="swatch-ring"
                                className="absolute -inset-1.5 rounded-full ring-2 ring-[var(--lime)]"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                              />
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right">{s.name}</TooltipContent>
                      </Tooltip>
                    </li>
                  ))}
                </ul>
              </TooltipProvider>

              <motion.div
                style={reduced || isTouch ? undefined : tiltStyle}
                className="lux-grain relative mx-auto aspect-square w-full max-w-[440px] overflow-hidden rounded-[var(--stage-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] [box-shadow:var(--soft-shadow),var(--inner-highlight)]"
              >
                <AnimatePresence initial={false}>
                  <motion.div
                    key={active}
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: EASE }}
                    style={{
                      background: `radial-gradient(120% 90% at 50% 50%, ${swatches[active]?.glow ?? "rgba(198,241,53,0.55)"}, transparent 60%)`,
                    }}
                  />
                </AnimatePresence>

                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={reduced ? {} : { y: [-6, 6, -6] }}
                  transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="relative h-[62%] w-[62%]">
                    <Image
                      src="/products/insulated-steel-bottle.png"
                      alt="Insulated steel bottle rendered in the 3D studio"
                      fill
                      priority
                      sizes="(max-width: 1024px) 90vw, 42vw"
                      className="object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.55)]"
                    />
                  </div>
                </motion.div>

                <motion.div
                  aria-hidden
                  className="absolute bottom-[14%] left-1/2 h-4 w-[42%] -translate-x-1/2 rounded-full bg-black/60 blur-lg"
                  animate={reduced ? {} : { scaleX: [1, 0.86, 1], opacity: [0.6, 0.4, 0.6] }}
                  transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
                />

                <span className="absolute top-4 right-4 inline-flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-[11px] text-white/90 backdrop-blur">
                  <span className="lux-pulse-dot bg-[var(--lime)] size-1.5 rounded-full" />
                  Drag to rotate
                </span>

                <BorderBeam
                  size={220}
                  duration={9}
                  colorFrom="var(--lime)"
                  colorTo="rgba(198,241,53,0)"
                  borderWidth={1}
                  className="opacity-60"
                />
              </motion.div>


              <AnimatePresence>
                {inView &&
                  chips.map((chip, i) => (
                    <motion.span
                      key={chip.label}
                      className={`lux-eyebrow absolute ${chip.pos} z-10 hidden items-center gap-2 rounded-full border border-[var(--hairline)] bg-white/[0.05] px-3 py-1.5 text-[var(--muted)] backdrop-blur-md sm:inline-flex`}
                      initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                      animate={{ opacity: 1, y: reduced ? 0 : [0, -5, 0], filter: "blur(0px)" }}
                      exit={{ opacity: 0 }}
                      transition={{
                        opacity: { duration: 0.7, delay: 0.6 + i * 0.12, ease: EASE },
                        filter: { duration: 0.7, delay: 0.6 + i * 0.12 },
                        y: reduced
                          ? { duration: 0 }
                          : {
                              duration: 8 + i * 2,
                              repeat: Infinity,
                              ease: "easeInOut",
                              delay: i * 1.3,
                            },
                      }}
                    >
                      <span className="bg-[var(--lime)] size-1.5 rounded-full" />
                      {chip.label}
                    </motion.span>
                  ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

