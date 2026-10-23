"use client";

import { useEffect, useState } from "react";

export type ModelSource = "checking" | "glb" | "placeholder";

/** A GLB that is slow to arrive counts as missing after this long (plan.md §Phase 5). */
export const MODEL_TIMEOUT_MS = 20_000;

type Resolved = { path: string; source: "glb" | "placeholder" };

/**
 * Decides once per product whether its GLB is on disk. The owner drops files
 * into `public/models/` later; until then the scene renders the placeholder and
 * the stage shows the "Placeholder model" badge. A missing file, a network
 * error or a timeout all resolve to the placeholder, never to a crash.
 *
 * Resolved paths survive remounts. StrictMode tears the screen down once and
 * re-runs this hook on a fresh mount: with only component state the mount
 * starts at `checking` again, which unmounts the canvas mid-session — exactly
 * the "model shows for a split second, then vanishes" report. A cached answer
 * makes the remount resume at `glb` with no repaint.
 */
const resolvedPaths = new Map<string, "glb" | "placeholder">();

export function useModelSource(glbPath: string): ModelSource {
  const [resolved, setResolved] = useState<Resolved | null>(() => {
    const known = resolvedPaths.get(glbPath);
    return known ? { path: glbPath, source: known } : null;
  });
  const stable = resolved && resolved.path === glbPath;
  // Cache hit on a later path change lands on the memoised answer without
  // waiting for another HEAD (setState during render is the sanctioned
  // adjust-state-on-prop-change pattern).
  if (!stable) {
    const known = resolvedPaths.get(glbPath);
    const next: Resolved | null = known ? { path: glbPath, source: known } : null;
    if (next && (!resolved || resolved.path !== glbPath || resolved.source !== next.source)) {
      setResolved(next);
    }
  }

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      resolvedPaths.set(glbPath, "placeholder");
      setResolved({ path: glbPath, source: "placeholder" });
    }, MODEL_TIMEOUT_MS);

    // `no-store` matters: a plain HEAD can leave a truncated cache entry for
    // this URL behind, and the GLB GET then revalidates against it and arrives
    // empty (or hangs) — a blank stage. Bypassing the cache keeps the GET clean.
    fetch(glbPath, { method: "HEAD", signal: controller.signal, cache: "no-store" })
      .then((res) => {
        const source = res.ok ? "glb" : "placeholder";
        if (!cancelled) {
          resolvedPaths.set(glbPath, source);
          setResolved({ path: glbPath, source });
        }
      })
      .catch(() => {
        if (!cancelled) {
          resolvedPaths.set(glbPath, "placeholder");
          setResolved({ path: glbPath, source: "placeholder" });
        }
      })
      .finally(() => window.clearTimeout(timer));

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [glbPath]);

  return stable ? resolved.source : "checking";
}
