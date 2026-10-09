"use client";

import { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FileDown } from "lucide-react";

import { cn } from "@/lib/utils";

/** plan.md §Phase 5: PNG/JPG/SVG only, ≤2 MB, validated client-side. */
export const DECAL_ACCEPT = ".svg,.png,.jpg,.jpeg";
export const DECAL_MAX_BYTES = 2 * 1024 * 1024;

export function isDecalAccepted(file: File): string | null {
  const okType = /\.(svg|png|jpe?g)$/i.test(file.name);
  if (!okType) return "Upload failed: PNG/JPG/SVG under 2 MB only";
  if (file.size > DECAL_MAX_BYTES) return "Upload failed: PNG/JPG/SVG under 2 MB only";
  return null;
}

/**
 * Decal dropzone — the landing page's "Custom decals" bento demo, moved to
 * `components/studio/controls/` and made functional. Identical dashed-lime zone,
 * inner radius, floating icon and `SVG / PNG` mono label; `onFile` receives the
 * accepted file or a friendly error string.
 */
export function DecalDropzone({
  onFile,
  disabled = false,
  className,
}: {
  onFile?: (file: File | null, error?: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function handle(file: File | undefined) {
    if (!file) return;
    const problem = isDecalAccepted(file);
    setError(problem);
    onFile?.(problem ? null : file, problem ?? undefined);
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <button
        type="button"
        disabled={disabled}
        aria-label="Upload decal artwork, SVG or PNG under 2 MB"
        className="group/dz relative flex h-24 items-center justify-center overflow-hidden rounded-[var(--inner-radius)] border border-dashed border-[color-mix(in_srgb,var(--lime)_45%,transparent)] transition-colors duration-500 hover:border-[var(--lime)] hover:bg-[var(--lime-glow)] disabled:pointer-events-none disabled:opacity-50"
        style={{ borderColor: "color-mix(in srgb, var(--lime) 45%, transparent)" }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.classList.add("border-[var(--lime)]");
        }}
        onDrop={(e) => {
          e.preventDefault();
          handle(e.dataTransfer.files[0]);
        }}
      >
        <motion.span
          className="flex flex-col items-center gap-2 text-[var(--muted)]"
          animate={reduced ? undefined : { y: [0, 6, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        >
          <FileDown className="size-7 text-[var(--lime)]" strokeWidth={1.5} />
          <span className="lux-mono text-[11px] tracking-[0.16em] uppercase">SVG / PNG</span>
        </motion.span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={DECAL_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => handle(e.target.files?.[0])}
      />

      {/* Actionable, never silent. */}
      <p
        role={error ? "alert" : undefined}
        aria-live="polite"
        className={cn(
          "lux-mono text-[10px] tracking-[0.14em] uppercase",
          error ? "text-[var(--destructive,#ffb4ab)]" : "text-[var(--faint)]",
        )}
      >
        {error ?? "Max 2 MB"}
      </p>
    </div>
  );
}
