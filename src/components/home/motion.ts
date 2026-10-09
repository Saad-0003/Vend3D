import { useEffect, useState } from "react";
import type { Transition, Variants } from "framer-motion";

/** Shared reveal easing + spring (see task MOTION SYSTEM). */
export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const SPRING: Transition = { stiffness: 120, damping: 20 };

export const revealBlur: Variants = {
  hidden: { opacity: 0, y: 18, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: EASE },
  },
};

/** Reduced-motion reveal: opacity only, no blur/translate. */
export const revealCalm: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: EASE } },
};

export const staggerParent = (reduced: boolean): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: reduced ? 0 : 0.08 } },
});

export const staggerItem = (reduced: boolean): Variants => (reduced ? revealCalm : revealBlur);

export const viewportOnce = { once: true, margin: "-15% 0px -15% 0px" } as const;

/** True on coarse pointers (touch) — cursor-driven tilt/spotlight are disabled. */
export function useIsTouch(): boolean {
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    setTouch(mq.matches);
    const onChange = () => setTouch(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return touch;
}

/** hsl → hex for the precision-color readout. */
export function hslToHex(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}
