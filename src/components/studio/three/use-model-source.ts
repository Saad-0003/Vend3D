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
 * The resolved state is remembered per path: StrictMode re-runs this effect,
 * and a fresh "checking" flip for an already-resolved path would unmount the
 * canvas mid-load, which aborts the in-flight GLB request (r3f aborts loaders
 * when their boundary unmounts) and leaves that suspense entry blank forever.
 */
export function useModelSource(glbPath: string): ModelSource {
  const [resolved, setResolved] = useState<Resolved | null>(null);
  const stable = resolved && resolved.path === glbPath;

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timer = window.setTimeout(
      () => setResolved({ path: glbPath, source: "placeholder" }),
      MODEL_TIMEOUT_MS,
    );

    // `no-store` matters: a plain HEAD can leave a truncated cache entry for
    // this URL behind, and the GLB GET then revalidates against it and arrives
    // empty (or hangs) — a blank stage. Bypassing the cache keeps the GET clean.
    fetch(glbPath, { method: "HEAD", signal: controller.signal, cache: "no-store" })
      .then((res) => {
        if (!cancelled) setResolved({ path: glbPath, source: res.ok ? "glb" : "placeholder" });
      })
      .catch(() => {
        if (!cancelled) setResolved({ path: glbPath, source: "placeholder" });
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
