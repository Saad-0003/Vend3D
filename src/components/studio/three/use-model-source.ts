"use client";

import { useEffect, useState } from "react";

export type ModelSource = "checking" | "glb" | "placeholder";

/** A GLB that is slow to arrive counts as missing after this long (plan.md §Phase 5). */
export const MODEL_TIMEOUT_MS = 20_000;

/**
 * Decides once per product whether its GLB is on disk. The owner drops files
 * into `public/models/` later; until then the scene renders the placeholder and
 * the stage shows the "Placeholder model" badge. A missing file, a network
 * error or a timeout all resolve to the placeholder, never to a crash.
 */
export function useModelSource(glbPath: string): ModelSource {
  const [source, setSource] = useState<ModelSource>("checking");

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);

    setSource("checking");
    fetch(glbPath, { method: "HEAD", signal: controller.signal })
      .then((res) => {
        if (!cancelled) setSource(res.ok ? "glb" : "placeholder");
      })
      .catch(() => {
        if (!cancelled) setSource("placeholder");
      })
      .finally(() => window.clearTimeout(timer));

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [glbPath]);

  return source;
}
