"use client";

import { Suspense, type MutableRefObject } from "react";
import dynamic from "next/dynamic";
import { Maximize, Minus, Pause, Play, Plus, Redo2, RotateCcw, Undo2, Camera } from "lucide-react";

import type { CanvasHandle } from "@/components/studio/three/product-canvas";
import { CAMERA_PRESET_LABELS } from "@/components/studio/camera-presets";
import { Skeleton } from "@/components/ui/skeleton";
import type { CameraPresetKey, ProductConfig } from "@/lib/products/config";
import type { Configuration } from "@/lib/products/configuration";
import type { ModelSource } from "@/components/studio/three/use-model-source";
import { cn } from "@/lib/utils";

const ProductCanvas = dynamic(() => import("@/components/studio/three/product-canvas"), {
  ssr: false,
  loading: () => <Skeleton className="size-full rounded-none" />,
});

const PRESETS = Object.keys(CAMERA_PRESET_LABELS) as CameraPresetKey[];

/**
 * The left column: a pinned rounded stage card holding the 3D canvas, the
 * "Drag to rotate" pill, the preset chips and the floating glass toolbar.
 * On mobile it is the sticky top block under the navbar.
 */
export function StudioStage({
  product,
  configuration,
  source,
  decalUrl,
  autoRotate,
  reduced,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onReset,
  onToggleRotate,
  onInteract,
  handle,
}: {
  product: ProductConfig;
  configuration: Configuration;
  source: Exclude<ModelSource, "checking"> | null;
  decalUrl: string | null;
  autoRotate: boolean;
  reduced: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onToggleRotate: () => void;
  onInteract: () => void;
  handle: MutableRefObject<CanvasHandle | null>;
}) {
  // Colour of the first customisable part drives the lime glow behind the product.
  const primary = product.parts.find((p) => p.allowCustomColor);
  const glowColor = (primary && configuration.parts[primary.id]?.color) || "var(--lime)";

  const placeholder = source === "placeholder";

  return (
    <section
      aria-label={`${product.name} stage`}
      className="group/stage relative w-full overflow-hidden rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] [box-shadow:var(--inner-highlight)] lg:sticky lg:top-[80px] lg:h-[calc(100svh-128px)] lg:flex-1 max-lg:sticky max-lg:top-[60px] max-lg:h-[52svh]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-colors duration-700"
        style={{
          background: `radial-gradient(60% 50% at 50% 55%, color-mix(in srgb, ${glowColor} 22%, transparent), transparent 70%)`,
        }}
      />

      <div className="absolute inset-0">
        <Suspense fallback={<Skeleton className="size-full rounded-none" />}>
          {source !== null ? (
            <ProductCanvas
              product={product}
              configuration={configuration}
              source={source}
              decalUrl={decalUrl}
              autoRotate={autoRotate && !reduced}
              onInteract={onInteract}
              handle={handle}
            />
          ) : (
            <Skeleton className="size-full rounded-none" />
          )}
        </Suspense>
      </div>

      {placeholder ? (
        <span className="lux-mono absolute top-4 left-4 rounded-full bg-[var(--surface-2)] px-3 py-1 text-[11px] tracking-[0.16em] text-[var(--muted)] uppercase ring-1 ring-[var(--hairline)]">
          Placeholder model
        </span>
      ) : null}

      <span className="lux-mono pointer-events-none absolute top-4 right-4 hidden rounded-full bg-black/55 px-3 py-1 text-[11px] tracking-[0.14em] text-white/90 uppercase backdrop-blur md:inline-flex">
        Drag to rotate
      </span>

      <div
        role="group"
        aria-label="Camera presets"
        className="absolute top-1/2 left-3 hidden -translate-y-1/2 flex-col gap-2 md:flex"
      >
        {PRESETS.map((key) => (
          <PresetChip key={key} presetKey={key} onSelect={() => handle.current?.preset(key)} />
        ))}
      </div>

      <div className="absolute inset-x-0 bottom-4 flex flex-col items-center gap-2 px-3">
        <div
          role="toolbar"
          aria-label="Viewer controls"
          className="flex flex-wrap items-center justify-center gap-1 rounded-full bg-[var(--surface-2)]/80 p-1 ring-1 ring-[var(--hairline-strong)] backdrop-blur-xl"
        >
          <ToolButton label="Reset view" onClick={() => { handle.current?.reset(); onReset(); }}>
            <RotateCcw className="size-4" strokeWidth={1.5} />
          </ToolButton>
          <ToolButton
            label={autoRotate ? "Pause auto-rotate" : "Start auto-rotate"}
            pressed={autoRotate}
            onClick={onToggleRotate}
          >
            {autoRotate ? (
              <Pause className="size-4" strokeWidth={1.5} />
            ) : (
              <Play className="size-4" strokeWidth={1.5} />
            )}
          </ToolButton>
          <ToolButton label="Zoom in" onClick={() => handle.current?.zoom(1)}>
            <Plus className="size-4" strokeWidth={1.5} />
          </ToolButton>
          <ToolButton label="Zoom out" onClick={() => handle.current?.zoom(-1)}>
            <Minus className="size-4" strokeWidth={1.5} />
          </ToolButton>
          <ToolButton
            label="Take screenshot"
            onClick={() => {
              const url = handle.current?.capture();
              if (!url) return;
              const a = document.createElement("a");
              a.href = url;
              a.download = `${product.slug}.png`;
              a.click();
            }}
          >
            <Camera className="size-4" strokeWidth={1.5} />
          </ToolButton>
          <ToolButton
            label="Fullscreen"
            onClick={() => {
              void document.documentElement.requestFullscreen?.();
            }}
          >
            <Maximize className="size-4" strokeWidth={1.5} />
          </ToolButton>
          <ToolButton label="Undo" disabled={!canUndo} onClick={onUndo}>
            <Undo2 className="size-4" strokeWidth={1.5} />
          </ToolButton>
          <ToolButton label="Redo" disabled={!canRedo} onClick={onRedo}>
            <Redo2 className="size-4" strokeWidth={1.5} />
          </ToolButton>
        </div>
        <p className="lux-mono text-[10px] tracking-[0.16em] text-[var(--faint)] uppercase">
          Drag to rotate · Scroll to zoom
        </p>
      </div>
    </section>
  );
}

function PresetChip({ presetKey, onSelect }: { presetKey: CameraPresetKey; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="lux-mono min-h-11 rounded-full bg-[var(--surface-2)]/80 px-3 text-[11px] tracking-[0.14em] text-[var(--muted)] uppercase ring-1 ring-[var(--hairline)] transition-colors duration-300 hover:text-[var(--ivory)] hover:ring-[var(--hairline-strong)]"
    >
      {CAMERA_PRESET_LABELS[presetKey]}
    </button>
  );
}

function ToolButton({
  label,
  onClick,
  disabled,
  pressed,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex size-11 items-center justify-center rounded-full text-[var(--muted)] transition-colors duration-300 hover:text-[var(--ivory)] disabled:pointer-events-none disabled:opacity-40",
        pressed && "text-[var(--lime)]",
      )}
    >
      {children}
    </button>
  );
}
