"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/**
 * 2px lime scroll-progress hairline pinned to the very top of the viewport.
 * Sits at z-40, just under the sticky header (z-50), so it never overlaps it.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-40 h-0.5 origin-left bg-[var(--lime)]"
    />
  );
}
