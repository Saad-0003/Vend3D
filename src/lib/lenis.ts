import Lenis from "lenis";

/**
 * The root layout owns the single Lenis instance (`components/smooth-scroll.tsx`)
 * and registers it here, so anchor buttons can use inertial scrolling instead of
 * jumping. Kept as a module singleton because Lenis must never be instantiated
 * twice — two instances fight over the scroll position.
 */
let instance: Lenis | null = null;

/** Height of the sticky navbar (h-14) + the 24px breathing room under it. */
export const NAVBAR_OFFSET = 80;

export function setLenisInstance(next: Lenis | null) {
  instance = next;
}

/**
 * Smooth-scrolls an in-page target into view, clearing the sticky navbar.
 * Falls back to a native scroll when Lenis is inactive (reduced motion, or
 * before the provider mounts).
 */
export function scrollToSection(id: string, offset = NAVBAR_OFFSET) {
  const el = document.getElementById(id);
  if (!el) return;

  if (instance) {
    instance.scrollTo(el, { offset: -offset });
    return;
  }

  window.scrollTo({
    top: el.getBoundingClientRect().top + window.scrollY - offset,
    behavior: "matchMedia" in window && window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
  });
}
