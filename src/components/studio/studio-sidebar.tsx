"use client";

import { useState } from "react";
import { Gauge, Palette, Type } from "lucide-react";

import { DecalPanel, DetailsPanel, OptionsPanel } from "@/components/studio/studio-customization";
import { EngraveControl } from "@/components/studio/controls/engrave-control";
import { FinishControl } from "@/components/studio/controls/finish-control";
import { HueColorControl, hueColor } from "@/components/studio/controls/hue-color-control";
import { SectionCard } from "@/components/studio/studio-section-card";
import { sectionsFor } from "@/components/studio/section-types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ProductConfig } from "@/lib/products/config";
import { ENGRAVE_COLORS } from "@/lib/products/config";
import { clampFinish, hexToHue, isHex, type Configuration } from "@/lib/products/configuration";
import { cn } from "@/lib/utils";

/**
 * The customization panel beside the stage: every option section the product
 * supports, stacked in one scrolling column whose height matches the stage.
 * Purchase controls live in the footer bar below the two columns.
 */
export function StudioSidebar({
  product,
  configuration,
  onChange,
  decalUrl,
  onDecalChange,
  reduced,
}: {
  product: ProductConfig;
  configuration: Configuration;
  onChange: (next: Configuration) => void;
  decalUrl: string | null;
  onDecalChange: () => void;
  reduced: boolean;
}) {
  const sections = sectionsFor(product);

  return (
    <aside className="flex w-full min-w-0 flex-col lg:sticky lg:top-[84px] lg:h-[calc(100svh-108px)] lg:w-[440px] lg:shrink-0 xl:w-[460px]">
      <div
        data-lenis-prevent
        className="studio-scroll flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-2 pb-2 [scrollbar-color:var(--hairline-strong)_transparent] [scrollbar-width:thin]"
      >
        {sections.map((id) => {
          switch (id) {
            case "colour":
              return (
                <ColourSection
                  key={id}
                  product={product}
                  configuration={configuration}
                  onChange={onChange}
                  reduced={reduced}
                />
              );
            case "finish":
              return (
                <FinishSection
                  key={id}
                  product={product}
                  configuration={configuration}
                  onChange={onChange}
                  reduced={reduced}
                />
              );
            case "engrave":
              return (
                <EngraveSection
                  key={id}
                  product={product}
                  configuration={configuration}
                  onChange={onChange}
                  reduced={reduced}
                />
              );
            case "decal":
              return (
                <DecalPanel
                  key={id}
                  product={product}
                  configuration={configuration}
                  onChange={onChange}
                  decalUrl={decalUrl}
                  onDecalChange={onDecalChange}
                  reduced={reduced}
                />
              );
            case "options":
              return (
                <OptionsPanel
                  key={id}
                  product={product}
                  configuration={configuration}
                  onChange={onChange}
                  reduced={reduced}
                />
              );
            case "details":
              return <DetailsPanel key={id} product={product} reduced={reduced} />;
          }
        })}
      </div>
    </aside>
  );
}

function ColourSection({
  product,
  configuration,
  onChange,
  reduced,
}: {
  product: ProductConfig;
  configuration: Configuration;
  onChange: (next: Configuration) => void;
  reduced: boolean;
}) {
  const part = product.parts.find((p) => p.allowCustomColor);
  if (!part) return null;
  const partId = part.id;
  const current = configuration.parts[partId]?.color ?? part.swatches[0]?.hex ?? "#c6f135";
  const finish = configuration.parts[partId]?.finish ?? 0;

  function setColor(hex: string) {
    onChange({ ...configuration, parts: { ...configuration.parts, [partId]: { color: hex, finish } } });
  }

  return (
    <SectionCard
      id="colour"
      icon={<Palette className="size-5" strokeWidth={1.5} aria-hidden />}
      title="Precision colour"
      description="Drag the hue or pick a preset. The product updates live."
      reduced={reduced}
    >
      <HueColorControl
        interactive
        label={`${part.label} hue`}
        hue={hexToHue(current)}
        onHueChange={(h) => setColor(hueColor(h))}
      />

      <ul aria-label={`${part.label} presets`} className="flex flex-wrap items-center gap-3">
        {part.swatches.map((s) => {
          const selected = current.toLowerCase() === s.hex.toLowerCase();
          return (
            <li key={s.name}>
              <button
                type="button"
                aria-label={`${s.name} ${s.hex}`}
                aria-pressed={selected}
                onClick={() => setColor(s.hex)}
                className={cn(
                  "flex size-11 items-center justify-center rounded-full transition-shadow duration-300",
                  selected ? "ring-2 ring-[var(--lime)] ring-offset-2 ring-offset-[var(--surface-1)]" : "ring-1 ring-[var(--hairline-strong)]",
                )}
              >
                <span className="block size-7 rounded-full" style={{ backgroundColor: s.hex }} />
              </button>
            </li>
          );
        })}
      </ul>

      <HexInput value={current} onValid={setColor} label={`${part.label} hex colour`} />
    </SectionCard>
  );
}

/** Hex input that commits only valid six-digit colours. Invalid text is shown, never applied. */
function HexInput({ value, onValid, label }: { value: string; onValid: (hex: string) => void; label: string }) {
  const [draft, setDraft] = useState(value);
  const [invalid, setInvalid] = useState(false);
  const [lastValue, setLastValue] = useState(value);

  // Re-sync when the colour changes from a control other than this input.
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value);
    setInvalid(false);
  }

  const errorId = `hex-err-${label.replace(/\s+/g, "-")}`;
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={errorId.replace("err", "input")} className="lux-mono text-[11px] tracking-[0.16em] text-[var(--muted)] uppercase">
        Hex
      </Label>
      <Input
        id={errorId.replace("err", "input")}
        value={draft}
        onChange={(e) => {
          const next = e.target.value;
          setDraft(next);
          const ok = isHex(next);
          setInvalid(!ok);
          if (ok) {
            onValid(next.toUpperCase());
            setLastValue(next.toUpperCase());
          }
        }}
        aria-invalid={invalid}
        aria-describedby={invalid ? errorId : undefined}
        className="lux-mono h-11 rounded-full bg-[var(--surface-2)] px-4 text-[var(--ivory)] ring-1 ring-[var(--hairline)]"
        maxLength={7}
        spellCheck={false}
      />
      {invalid ? (
        <p id={errorId} role="alert" className="lux-mono text-[11px] tracking-[0.12em] text-[var(--destructive)]">
          Use a six-digit hex, like #C6F135
        </p>
      ) : null}
    </div>
  );
}

function FinishSection({
  product,
  configuration,
  onChange,
  reduced,
}: {
  product: ProductConfig;
  configuration: Configuration;
  onChange: (next: Configuration) => void;
  reduced: boolean;
}) {
  const part = product.parts.find((p) => p.finishable);
  if (!part) return null;
  const current = configuration.parts[part.id];
  const gloss = current?.finish ?? part.glossRange[0];

  return (
    <SectionCard
      id="finish"
      icon={<Gauge className="size-5" strokeWidth={1.5} aria-hidden />}
      title="Material physics"
      description={`Matte to glossy on the ${part.label.toLowerCase()}. Drives the real surface roughness.`}
      reduced={reduced}
    >
      <FinishControl
        interactive
        label={`${part.label} finish`}
        gloss={gloss}
        min={part.glossRange[0]}
        max={part.glossRange[1]}
        onGlossChange={(next) =>
          onChange({
            ...configuration,
            parts: {
              ...configuration.parts,
              [part.id]: {
                color: current?.color ?? part.swatches[0]?.hex ?? "#c6f135",
                finish: clampFinish(part, next),
              },
            },
          })
        }
      />
    </SectionCard>
  );
}

function EngraveSection({
  product,
  configuration,
  onChange,
  reduced,
}: {
  product: ProductConfig;
  configuration: Configuration;
  onChange: (next: Configuration) => void;
  reduced: boolean;
}) {
  const { engrave } = configuration;
  const maxChars = product.engrave.maxChars;

  return (
    <SectionCard
      id="engrave"
      icon={<Type className="size-5" strokeWidth={1.5} aria-hidden />}
      title="Laser engraving"
      description={`Up to ${maxChars} characters on the ${product.engrave.zones.map((z) => z.label.toLowerCase()).join(" or ")}.`}
      reduced={reduced}
    >
      <label className="flex items-center justify-between gap-4">
        <span className="text-[15px] text-[var(--ivory)]">Engrave text</span>
        <Switch
          aria-label="Enable engraving"
          checked={engrave.enabled}
          onCheckedChange={(enabled) => onChange({ ...configuration, engrave: { ...engrave, enabled } })}
        />
      </label>

      {engrave.enabled ? (
        <>
          <div className="flex flex-col gap-2">
            <Label htmlFor="engrave-text" className="lux-mono text-[11px] tracking-[0.16em] text-[var(--muted)] uppercase">
              Text
            </Label>
            <Input
              id="engrave-text"
              value={engrave.text}
              maxLength={maxChars}
              onChange={(e) => onChange({ ...configuration, engrave: { ...engrave, text: e.target.value } })}
              placeholder="Your text"
              className="h-11 rounded-full bg-[var(--surface-2)] px-4 text-[var(--ivory)] ring-1 ring-[var(--hairline)]"
            />
            <p className="lux-mono text-[11px] tracking-[0.12em] text-[var(--muted)] uppercase">
              {engrave.text.length} / {maxChars}
            </p>
            <p
              aria-hidden
              data-testid="engrave-preview"
              className="truncate rounded-[var(--inner-radius)] bg-[var(--surface-2)] px-4 py-3 text-[20px] ring-1 ring-[var(--hairline)]"
              style={{
                fontFamily: product.engrave.fonts.find((f) => f.id === engrave.font)?.css,
                color: engrave.color,
              }}
            >
              {engrave.text.trim() || "Your text"}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <span className="lux-mono text-[11px] tracking-[0.16em] text-[var(--muted)] uppercase">Font</span>
            <ToggleGroup
              type="single"
              value={engrave.font}
              onValueChange={(v) => {
                if (v) onChange({ ...configuration, engrave: { ...engrave, font: v } });
              }}
              aria-label="Engraving font"
              className="flex-wrap"
            >
              {product.engrave.fonts.map((f) => (
                <ToggleGroupItem key={f.id} value={f.id} style={{ fontFamily: f.css }}>
                  {f.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="flex flex-col gap-2">
            <span className="lux-mono text-[11px] tracking-[0.16em] text-[var(--muted)] uppercase">
              Engraving colour
            </span>
            <ul aria-label="Engraving colour" className="flex flex-wrap items-center gap-2.5">
              {ENGRAVE_COLORS.map((swatch) => {
                const selected = engrave.color.toLowerCase() === swatch.hex.toLowerCase();
                return (
                  <li key={swatch.name}>
                    <button
                      type="button"
                      aria-label={`${swatch.name} ${swatch.hex}`}
                      aria-pressed={selected}
                      onClick={() => onChange({ ...configuration, engrave: { ...engrave, color: swatch.hex.toUpperCase() } })}
                      className={cn(
                        "flex size-9 items-center justify-center rounded-full transition-shadow duration-300",
                        selected
                          ? "ring-2 ring-[var(--lime)] ring-offset-2 ring-offset-[var(--surface-1)]"
                          : "ring-1 ring-[var(--hairline-strong)]",
                      )}
                    >
                      <span className="block size-6 rounded-full" style={{ backgroundColor: swatch.hex }} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <EngraveControl
            depthMm={engrave.depthMm}
            material="FIBER"
            onDepthChange={(depthMm) => onChange({ ...configuration, engrave: { ...engrave, depthMm } })}
          />

          <div className="flex flex-col gap-2">
            <span className="lux-mono text-[11px] tracking-[0.16em] text-[var(--muted)] uppercase">
              Size · {engrave.sizePct}%
            </span>
            <input
              type="range"
              min={40}
              max={100}
              step={1}
              value={engrave.sizePct}
              aria-label="Engraving size"
              aria-valuetext={`${engrave.sizePct} percent`}
              onChange={(e) =>
                onChange({ ...configuration, engrave: { ...engrave, sizePct: Number(e.target.value) } })
              }
              className="h-2.5 w-full cursor-pointer touch-none appearance-none rounded-full accent-[var(--lime)]"
            />
          </div>
        </>
      ) : null}
    </SectionCard>
  );
}
