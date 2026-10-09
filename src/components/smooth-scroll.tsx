"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { setLenisInstance } from "@/lib/lenis";

/**
 * Inertial page scrolling via lenis, mounted once in the root layout. Skipped
 * entirely when the user prefers reduced motion — hijacking the scroll would
 * directly violate that preference.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ autoRaf: true });
    setLenisInstance(lenis);
    return () => {
      setLenisInstance(null);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
