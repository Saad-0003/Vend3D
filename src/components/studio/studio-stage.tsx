"use client";

import { Suspense, useEffect, useRef, useState, type MutableRefObject } from "react";
import dynamic from "next/dynamic";
import {
  Maximize,
  Minimize,
  Minus,
  Pause,
  Play,
  Plus,
  Redo2,
  RotateCcw,
  Undo2,
  Camera,
} from "lucide-react";

import type { CanvasHandle } from "@/components/studio/three/product-canvas";
import { CAMERA_PRESET_LABELS } from "@/components/studio/camera-presets";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { CameraPresetKey, ProductConfig } from "@/lib/products/config";
import type { Configuration } from "@/lib/products/configuration";
import type { ModelSource } from "@/components/studio/three/use-model-source";
import { isConfigurationDefault } from "@/lib/studio/dirty";
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
  const stageRef = useRef<HTMLElement>(null);

  // Fullscreen state lives in the browser, not in React: Esc and the OS can
  // leave fullscreen without our button, so the icon follows `fullscreenchange`.
  const [fullscreen, setFullscreen] = useState(false);
  const [canFullscreen, setCanFullscreen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    const stage = stageRef.current;
    setCanFullscreen(
      typeof document !== "undefined" &&
        document.fullscreenEnabled === true &&
        typeof stage?.requestFullscreen === "function",
    );
    function onChange() {
      setFullscreen(document.fullscreenElement === stage);
    }
    document.addEventListener("fullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      // Navigating away while fullscreen must not trap the next page in it.
      if (stage && document.fullscreenElement === stage) {
        void document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  async function toggleFullscreen() {
    const stage = stageRef.current;
    if (!stage) return;
    try {
      if (document.fullscreenElement === stage) await document.exitFullscreen();
      else await stage.requestFullscreen();
    } catch {
      // Denied by the browser or an iframe policy: leave the stage untouched.
    }
  }

  function resetStage() {
    handle.current?.reset();
    onReset();
  }

  function handleReset() {
    // Nothing to lose: reset the camera straight away. Otherwise confirm first,
    // because this also discards colour, finish, decal and engraving changes.
    if (isConfigurationDefault(product, configuration)) resetStage();
    else setConfirmReset(true);
  }

  return (
    <section
      ref={stageRef}
      aria-label={`${product.name} stage`}
      style={fullscreen ? { height: "100dvh" } : undefined}
      className="group/stage relative w-full overflow-hidden rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] [box-shadow:var(--inner-highlight)] data-[fullscreen=true]:rounded-none max-lg:sticky max-lg:top-[68px] max-lg:z-10 max-lg:h-[52svh] lg:sticky lg:top-[84px] lg:h-[calc(100svh-108px)] lg:min-w-0 lg:flex-1"
      data-fullscreen={fullscreen ? "true" : undefined}
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

      <div className="pointer-events-none absolute inset-x-4 top-4 flex items-start justify-between gap-3">
        {placeholder ? (
          <span className="lux-mono rounded-full bg-[var(--surface-2)] px-3 py-1.5 text-[11px] tracking-[0.16em] text-[var(--ivory)] uppercase ring-1 ring-[var(--hairline-strong)]">
            Placeholder model
          </span>
        ) : (
          <span />
        )}
        <span className="lux-mono hidden rounded-full bg-[var(--surface-2)] px-3 py-1.5 text-[11px] tracking-[0.14em] text-[var(--ivory)] uppercase ring-1 ring-[var(--hairline-strong)] md:inline-flex">
          Drag to rotate
        </span>
      </div>

      <div
        role="group"
        aria-label="Camera presets"
        className="absolute top-1/2 left-4 hidden -translate-y-1/2 flex-col gap-2 xl:flex"
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
          <ToolButton label="Reset" onClick={handleReset}>
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
          {canFullscreen ? (
            <ToolButton
              label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              pressed={fullscreen}
              onClick={() => void toggleFullscreen()}
            >
              {fullscreen ? (
                <Minimize className="size-4" strokeWidth={1.5} />
              ) : (
                <Maximize className="size-4" strokeWidth={1.5} />
              )}
            </ToolButton>
          ) : null}
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
        {product.model.credit ? (
          <a
            href={product.model.credit.url}
            target="_blank"
            rel="noreferrer"
            className="lux-mono text-[10px] tracking-[0.16em] text-[var(--faint)] uppercase transition-colors duration-300 hover:text-[var(--muted)]"
          >
            {product.model.credit.label}
          </a>
        ) : null}
      </div>

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset all changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Colour, finish, decal and engraving go back to this product&rsquo;s defaults. Undo
              brings them back.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                onClick={resetStage}
                className="h-11 rounded-full bg-[var(--lime)] px-5 text-[var(--ink)] hover:bg-[var(--lime)]/90"
              >
                Reset
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
