"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

/** EASE — the single curve the whole system animates on. */
const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The dark stage on the left half of `/login` and `/signup`.
 *
 * plan.md Phase 2 intends a real GLB here; until one exists (`docs/assets` is
 * absent — D-026), the poster image stands in and rotates slowly instead. The
 * rotation is transform-only and pauses under reduced motion, per
 * ARCHITECTURE.md §9's animation rules.
 */

/** The poster stands in for the missing GLB (DECISIONS.md D-026). */
const POSTER_SRC = "/images/studio-scene.png";

const HEADLINE = ["See it.", "Shape it.", "Own it."];

export function AuthStage() {
  const reduced = useReducedMotion();

  return (
    <div className="relative hidden overflow-hidden rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] [box-shadow:var(--inner-highlight)] lg:block">
      {/* Radial spotlight, the same treatment as the hero orb. */}
      <span
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,var(--lime-glow)_0%,transparent_60%)]"
      />

      <div className="relative flex h-full min-h-[560px] flex-col justify-between p-10">
        <div className="flex items-center gap-2">
          <span aria-hidden className="size-1.5 rounded-full bg-[var(--lime)]" />
          <span className="lux-mono text-[10px] tracking-[0.18em] text-[var(--muted)] uppercase">
            Realtime 3D studio
          </span>
        </div>

        {/* Slowly rotating product stage. */}
        <div className="flex flex-1 items-center justify-center py-10">
          <motion.div
            className="relative size-64"
            animate={reduced ? { rotate: 0 } : { rotate: 360 }}
            transition={
              reduced
                ? { duration: 0 }
                : { duration: 36, ease: "linear", repeat: Number.POSITIVE_INFINITY }
            }
          >
            <div className="absolute inset-0 rounded-full bg-[var(--lime-glow)] blur-3xl" aria-hidden />
            <Image
              src={POSTER_SRC}
              alt="A Vend3D product previewed in the realtime 3D studio."
              fill
              sizes="(min-width: 1024px) 256px, 0px"
              className="object-contain"
              priority
            />
          </motion.div>
        </div>

        {/* The landing line, in the same serif as the hero. */}
        <h2 className="lux-h1 lux-display text-[var(--ivory)]">
          {HEADLINE.map((line, index) => (
            <span key={line} className="block overflow-hidden">
              <motion.span
                className={index === HEADLINE.length - 1 ? "block text-[var(--lime)]" : "block"}
                initial={{ y: "110%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                // `initial` must not branch on the reduced-motion preference: the
                // server cannot resolve it, so a branch would hydrate with a
                // different style and React would drop this subtree. See D-050.
                transition={{
                  duration: reduced ? 0 : 0.85,
                  ease: EASE,
                  delay: reduced ? 0 : 0.15 + index * 0.09,
                }}
              >
                {line}
              </motion.span>
            </span>
          ))}
        </h2>
      </div>
    </div>
  );
}
