"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DecalDropzone } from "@/components/studio/controls/decal-dropzone";
import type { DecalZone } from "@/lib/products/config";
import type { DecalSettings } from "@/lib/products/configuration";
import { cn } from "@/lib/utils";

/**
 * After an upload: thumbnail, zone selector, position / scale / rotation sliders,
 * the "Avoid seams" switch, and replace / remove. Every value is written back
 * through `onChange`, so the scene reflects it on the next render.
 */
export function DecalControls({
  zones,
  thumbnailUrl,
  settings,
  onChange,
  onReplace,
  onRemove,
  onFile,
}: {
  zones: DecalZone[];
  thumbnailUrl: string;
  settings: DecalSettings;
  onChange: (next: DecalSettings) => void;
  onReplace: () => void;
  onRemove: () => void;
  onFile: (file: File | null, error?: string) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnailUrl}
          alt={`Decal: ${settings.name}`}
          className="size-16 rounded-[var(--inner-radius)] bg-[var(--surface-2)] object-contain p-2 ring-1 ring-[var(--hairline)]"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate text-[15px] text-[var(--ivory)]">{settings.name}</span>
          <span className="lux-mono text-[11px] tracking-[0.14em] text-[var(--faint)] uppercase">
            Uploaded artwork
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="lux-mono text-[11px] tracking-[0.16em] text-[var(--muted)] uppercase">Zone</span>
        <div role="radiogroup" aria-label="Decal zone" className="flex flex-wrap gap-2">
          {zones.map((z) => (
            <button
              key={z.id}
              type="button"
              role="radio"
              aria-checked={settings.zone === z.id}
              onClick={() => onChange({ ...settings, zone: z.id })}
              className={cn(
                "lux-mono min-h-11 rounded-full px-4 text-[11px] tracking-[0.14em] uppercase ring-1 transition-colors duration-300",
                settings.zone === z.id
                  ? "bg-[var(--surface-2)] text-[var(--ivory)] ring-[var(--lime)]"
                  : "text-[var(--muted)] ring-[var(--hairline)] hover:text-[var(--ivory)]",
              )}
            >
              {z.label}
            </button>
          ))}
        </div>
      </div>

      <Slider
        label="Scale"
        value={settings.scale}
        min={0.3}
        max={1.5}
        step={0.01}
        format={(v) => `${Math.round(v * 100)}%`}
        onChange={(scale) => onChange({ ...settings, scale })}
      />
      <Slider
        label="Rotation"
        value={settings.rotation}
        min={-180}
        max={180}
        step={1}
        format={(v) => `${Math.round(v)}°`}
        onChange={(rotation) => onChange({ ...settings, rotation })}
      />
      <Slider
        label="Horizontal"
        value={settings.offsetX}
        min={-1}
        max={1}
        step={0.01}
        format={(v) => v.toFixed(2)}
        onChange={(offsetX) => onChange({ ...settings, offsetX })}
      />
      <Slider
        label="Vertical"
        value={settings.offsetY}
        min={-1}
        max={1}
        step={0.01}
        format={(v) => v.toFixed(2)}
        onChange={(offsetY) => onChange({ ...settings, offsetY })}
      />

      <label className="flex items-center justify-between gap-4">
        <span className="text-[15px] text-[var(--ivory)]">Avoid seams</span>
        <Switch
          aria-label="Avoid seams"
          checked={settings.avoidSeams}
          onCheckedChange={(avoidSeams) => onChange({ ...settings, avoidSeams })}
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <DecalDropzone
          onFile={(file, error) => {
            onReplace();
            onFile(file, error);
          }}
          className="flex-1"
        />
        <Button
          type="button"
          variant="ghost"
          onClick={onRemove}
          className="h-11 rounded-full px-5 text-[var(--muted)] ring-1 ring-[var(--hairline)] hover:text-[var(--ivory)]"
        >
          Remove
        </Button>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const id = `decal-${label.toLowerCase()}`;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <Label htmlFor={id} className="lux-mono text-[11px] tracking-[0.16em] text-[var(--muted)] uppercase">
          {label}
        </Label>
        <span className="lux-mono lux-tabular text-[11px] text-[var(--ivory)]">{format(value)}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={format(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2.5 w-full cursor-pointer touch-none appearance-none rounded-full accent-[var(--lime)]"
      />
    </div>
  );
}
