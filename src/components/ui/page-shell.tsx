"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

/** EASE from `components/home/motion.ts` — the whole system's single curve. */
const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Content-page shell: fade + 8px rise page transition, 1280px max width,
 * 24/48px gutters, 80/128px vertical rhythm (see `docs/DESIGN.md` §4/§6).
 * Lenis is mounted once in the root layout, so no scroll provider is needed here.
 */
export function PageShell({
  children,
  className,
  id,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.main
      id={id}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={cn("mx-auto w-full max-w-[1280px] px-6 md:px-12 py-20 md:py-32", className)}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0.4 : 0.7, ease: EASE }}
    >
      {children}
    </motion.main>
  );
}
