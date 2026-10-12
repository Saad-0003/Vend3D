"use client";

import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

/** EASE — the single curve the whole system animates on. */
const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The confirmation mark: a lime-glow ring with an SVG tick that draws itself
 * once, via `pathLength` (a stroke-dash trick framer-motion drives for us).
 * No confetti, no loop — it is a single 900ms stroke.
 *
 * `initial` never branches on the reduced-motion preference. This component is
 * part of the server-rendered page, and `useReducedMotion` resolves the
 * preference synchronously on the client but not on the server — a branch here
 * hydrates with a different style, and React drops the subtree. The preference
 * goes in the transition instead, where a zero duration is a valid way to skip
 * the animation. See `PageShell` for the same rule.
 *
 * `aria-hidden` because the heading below already says the order is confirmed;
 * announcing it twice is noise. Under reduced motion it appears fully drawn.
 */
export function ConfirmationCheck({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  const drawn = { pathLength: 1, opacity: 1 };

  return (
    <div className={cn("relative grid size-20 shrink-0 place-items-center", className)}>
      {/* Soft outer halo. */}
      <motion.span
        aria-hidden
        className="absolute inset-2 rounded-full bg-[var(--lime-glow)] blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduced ? 0.25 : 0.6, ease: EASE, delay: reduced ? 0 : 0.1 }}
      />
      {/* The ring itself. */}
      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-full bg-[var(--lime-glow)] ring-1 ring-[color-mix(in_srgb,var(--lime)_30%,transparent)]"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reduced ? 0.25 : 0.5, ease: EASE }}
      />

      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--lime)"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="relative size-9"
      >
        <motion.path
          d="M20 6 9 17l-5-5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={drawn}
          transition={{
            pathLength: { duration: reduced ? 0 : 0.9, ease: EASE, delay: reduced ? 0 : 0.2 },
            opacity: { duration: reduced ? 0 : 0.15, delay: reduced ? 0 : 0.2 },
          }}
        />
      </svg>
    </div>
  );
}
