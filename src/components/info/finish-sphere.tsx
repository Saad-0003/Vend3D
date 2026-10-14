"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Gloss/matte preview for the materials library.
 *
 * Hover previews the gloss state for pointer users; the button also toggles on
 * click so the same information is reachable by keyboard and touch — a
 * hover-only affordance would strand everyone else.
 *
 * The sphere is pure CSS: two gradient layers cross-fade, so there is no asset
 * to download and no 3D cost on an informational page.
 */
export function FinishSphere({
  material,
  gloss,
  className,
}: {
  material: string;
  /** True when the material takes a gloss finish (from `glossRange`). */
  gloss: boolean;
  className?: string;
}) {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const showingGloss = pinned || hovered;

  return (
    <button
      type="button"
      aria-pressed={showingGloss}
      onClick={() => setPinned((value) => !value)}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      className={cn("group/sphere flex items-center gap-3 rounded-full", className)}
    >
      <span className="relative flex size-14 shrink-0 items-center justify-center">
        <span
          aria-hidden
          className="absolute inset-0 rounded-full ring-1 ring-[var(--hairline-strong)] transition-opacity duration-500"
          style={{
            background:
              "radial-gradient(circle at 34% 28%, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0.05) 42%, rgba(0,0,0,0.42) 100%), var(--glass)",
            opacity: showingGloss ? 0 : 1,
          }}
        />
        <span
          aria-hidden
          className="absolute inset-0 rounded-full ring-1 ring-[var(--hairline-strong)] transition-opacity duration-500"
          style={{
            background:
              "radial-gradient(circle at 30% 24%, #ffffff 0%, rgba(255,255,255,0.72) 9%, rgba(255,255,255,0.10) 27%, rgba(0,0,0,0.55) 78%), var(--glass)",
            opacity: showingGloss ? 1 : 0,
          }}
        />
        {/* Specular pip — the read that separates gloss from matte at a glance. */}
        <span
          aria-hidden
          className="absolute size-1.5 rounded-full bg-white blur-[1px] transition-opacity duration-500"
          style={{ top: "22%", left: "26%", opacity: showingGloss ? 0.9 : 0 }}
        />
      </span>

      <span className="flex flex-col items-start gap-0.5 text-left">
        <span className="lux-mono text-[10px] tracking-[0.16em] text-[var(--faint)] uppercase">
          {showingGloss ? "Gloss" : "Matte"}
        </span>
        <span className="text-[12px] text-[var(--muted)]">
          {showingGloss ? "Specular highlight" : "Diffuse surface"}
        </span>
      </span>

      <span className="sr-only">
        {gloss
          ? `${material}: preview the gloss finish`
          : `${material}: this material is finished matte`}
      </span>
    </button>
  );
}
