"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle } from "lucide-react";

/**
 * A step-level error: the message plus a nonce. The nonce re-keys the banner so
 * the same message twice replays the shake instead of sitting silent.
 */
export type StepError = { message: string; nonce: number } | null;

/**
 * Error banner. The shake is a single 4px nudge (never a loop).
 */
export function StepErrorBanner({ error }: { error: StepError }) {
  const reduced = useReducedMotion();

  return (
    <AnimatePresence mode="wait">
      {error ? (
        <motion.div
          key={error.nonce}
          role="alert"
          initial={reduced ? { opacity: 0 } : { opacity: 0, x: 0 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, x: [0, -4, 4, -4, 4, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.25 : 0.4, ease: "easeOut" }}
          className="flex items-start gap-3 rounded-[var(--inner-radius)] border border-[color-mix(in_srgb,var(--destructive)_40%,transparent)] bg-[color-mix(in_srgb,var(--destructive)_10%,transparent)] px-4 py-3"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-[var(--destructive)]" strokeWidth={1.5} aria-hidden />
          <p className="type-body-md text-[var(--destructive)]">{error.message}</p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
