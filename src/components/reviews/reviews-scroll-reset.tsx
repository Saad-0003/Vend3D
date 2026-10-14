"use client";

import { useLayoutEffect } from "react";

import { scrollToTop } from "@/lib/lenis";

export function ReviewsScrollReset() {
  useLayoutEffect(() => {
    scrollToTop();
  }, []);

  return null;
}
