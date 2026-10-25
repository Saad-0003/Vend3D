"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { glbPercent, readGlbState, subscribeGlbState } from "@/lib/studio/glb";

/**
 * The stage's load state, floating over the viewer: a slim determinate bar
 * with a percentage while the GLB streams, then a fade-out once the model has
 * mounted. A load that failed all retries shows the message plus a manual
 * "Try again" here, while the placeholder mesh keeps the stage populated.
 *
 * Rendered inside the lazy three chunk (only `product-canvas` imports it), so
 * none of this reaches a non-studio route.
 */
export function ModelLoadOverlay({ url, onRetry }: { url: string; onRetry: () => void }) {
  const state = useSyncExternalStore(
    subscribeGlbState,
    () => readGlbState(url),
    () => readGlbState(url),
  );

  const done = state.status === "ready";
  const [mounted, setMounted] = useState(!done);

  useEffect(() => {
    if (!done) {
      setMounted(true);
      return;
    }
    // Keep the node for the fade, then unmount so it stops being a live region.
    const timer = setTimeout(() => setMounted(false), 450);
    return () => clearTimeout(timer);
  }, [done]);

  if (!mounted) return null;

  const percent = glbPercent(state);
  const failed = state.status === "failed";

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-10 grid place-items-center px-4 transition-opacity duration-500 motion-reduce:transition-none ${
        done ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="pointer-events-auto flex w-full max-w-[19rem] flex-col gap-3 rounded-[var(--inner-radius)] bg-[var(--surface-2)]/90 px-5 py-4 ring-1 ring-[var(--hairline-strong)] backdrop-blur-xl">
        {failed ? (
          <>
            <p role="alert" className="text-[14px] leading-[1.5] text-[var(--ivory)]">
              We couldn&rsquo;t load the 3D model. Showing a simplified stand-in.
            </p>
            <Button
              type="button"
              variant="ghost"
              onClick={onRetry}
              className="h-11 w-fit rounded-full px-5 text-[var(--ivory)] ring-1 ring-[var(--hairline-strong)] hover:bg-[var(--surface-3)]"
            >
              Try again
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <span className="lux-mono text-[11px] tracking-[0.16em] text-[var(--muted)] uppercase">
                Preparing 3D model
              </span>
              {percent !== null ? (
                <span className="lux-mono lux-tabular text-[12px] text-[var(--ivory)]" aria-hidden>
                  {percent}%
                </span>
              ) : null}
            </div>
            <div
              role="progressbar"
              aria-label="Loading 3D model"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent ?? undefined}
              aria-valuetext={percent !== null ? `${percent}%` : "Loading"}
              className="h-1 w-full overflow-hidden rounded-full bg-[var(--surface-3)]"
            >
              <div
                className="h-full rounded-full bg-[var(--lime)] transition-[width] duration-200 ease-out motion-reduce:transition-none"
                style={{ width: `${percent ?? 8}%` }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
