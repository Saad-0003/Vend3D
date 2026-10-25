"use client";

import { useState } from "react";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DecalDropzone } from "@/components/studio/controls/decal-dropzone";
import type { DecalZone } from "@/lib/products/config";
import {
  DECAL_LIMITS,
  clampDecalOffset,
  clampDecalRotation,
  clampDecalScale,
  type DecalSettings,
} from "@/lib/products/configuration";
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

      <NumberSlider
        label="Scale"
        value={settings.scale}
        min={DECAL_LIMITS.scale.min}
        max={DECAL_LIMITS.scale.max}
        step={DECAL_LIMITS.scale.step}
        decimals={DECAL_LIMITS.scale.decimals}
        suffix="×"
        clampValue={clampDecalScale}
        onChange={(scale) => onChange({ ...settings, scale })}
      />
      <NumberSlider
        label="Rotation"
        value={settings.rotation}
        min={DECAL_LIMITS.rotation.min}
        max={DECAL_LIMITS.rotation.max}
        step={DECAL_LIMITS.rotation.step}
        decimals={DECAL_LIMITS.rotation.decimals}
        suffix="°"
        clampValue={clampDecalRotation}
        onChange={(rotation) => onChange({ ...settings, rotation })}
      />
      <NumberSlider
        label="Horizontal"
        value={settings.offsetX}
        min={DECAL_LIMITS.offset.min}
        max={DECAL_LIMITS.offset.max}
        step={DECAL_LIMITS.offset.step}
        decimals={DECAL_LIMITS.offset.decimals}
        clampValue={clampDecalOffset}
        onChange={(offsetX) => onChange({ ...settings, offsetX })}
      />
      <NumberSlider
        label="Vertical"
        value={settings.offsetY}
        min={DECAL_LIMITS.offset.min}
        max={DECAL_LIMITS.offset.max}
        step={DECAL_LIMITS.offset.step}
        decimals={DECAL_LIMITS.offset.decimals}
        clampValue={clampDecalOffset}
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

function NumberSlider({
  label,
  value,
  min,
  max,
  step,
  decimals,
  suffix,
  clampValue,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  decimals: number;
  suffix?: string;
  clampValue: (value: number) => number;
  onChange: (value: number) => void;
}) {
  const id = `decal-${label.toLowerCase()}`;
  const [draft, setDraft] = useState(() => formatNumber(value, decimals));
  const [lastValue, setLastValue] = useState(value);

  // Re-sync when the value changes elsewhere: the paired slider, undo/redo, or
  // a restored saved design.
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(formatNumber(value, decimals));
  }

  /**
   * A text input with `inputMode="decimal"`, not `type="number"`: controlled
   * number inputs drop the value of an in-progress entry like "0." to "", which
   * makes the decimals impossible to type. Non-numeric text never commits.
   */
  function commit(raw: string) {
    setDraft(raw);
    if (raw.trim() === "") return;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return;
    const clamped = clampValue(parsed);
    setLastValue(clamped);
    onChange(clamped);
  }

  function settle() {
    // Empty or non-numeric text is not an edit: revert to the committed value
    // instead of clamping a NaN down to the floor.
    const parsed = Number(draft);
    const clamped =
      draft.trim() === "" || !Number.isFinite(parsed) ? value : clampValue(parsed);
    setDraft(formatNumber(clamped, decimals));
    setLastValue(clamped);
    if (clamped !== value) onChange(clamped);
  }

  const display = `${formatNumber(value, decimals)}${suffix ?? ""}`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <Label
          htmlFor={`${id}-value`}
          className="lux-mono text-[11px] tracking-[0.16em] text-[var(--muted)] uppercase"
        >
          {label}
        </Label>
        <span className="flex items-center gap-1.5">
          <Input
            id={`${id}-value`}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            spellCheck={false}
            value={draft}
            aria-label={`${label} value`}
            onChange={(event) => commit(event.target.value)}
            onBlur={settle}
            onKeyDown={(event) => {
              if (event.key === "Enter") settle();
            }}
            className="lux-mono lux-tabular h-9 w-20 rounded-full bg-[var(--surface-2)] px-3 text-right text-[12px] text-[var(--ivory)] ring-1 ring-[var(--hairline)]"
          />
          {suffix ? (
            <span aria-hidden className="lux-mono w-3 text-[11px] text-[var(--muted)]">
              {suffix}
            </span>
          ) : null}
        </span>
      </div>
      <input
        id={`${id}-range`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={`${label} slider`}
        aria-valuetext={display}
        onChange={(event) => {
          const next = clampValue(Number(event.target.value));
          setLastValue(next);
          setDraft(formatNumber(next, decimals));
          onChange(next);
        }}
        className="h-2.5 w-full cursor-pointer touch-none appearance-none rounded-full accent-[var(--lime)]"
      />
    </div>
  );
}

function formatNumber(value: number, decimals: number): string {
  return value.toFixed(decimals);
}
