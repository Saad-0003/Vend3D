"use client";

import { Slider } from "@/components/ui/slider";
import {
  MATERIALS,
  allColorways,
  priceBounds,
  type Colorway,
  type Material,
} from "@/lib/catalog";
import type { CatalogQuery } from "@/lib/catalog-query";
import { formatCents } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Toggle helpers — the filter state is a list of names, so each row just adds/removes. */
function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/**
 * The one filter body, rendered in the desktop Popover and the mobile bottom
 * sheet. Extracted so the two can never drift (DESIGN.md rule 3) and so the
 * swatches/slider/select below are the only styles those controls ever get.
 */
export function FilterPanel({
  query,
  onChange,
  idPrefix,
}: {
  query: CatalogQuery;
  onChange: (patch: Partial<CatalogQuery>) => void;
  /** Keeps the two mount points' ids distinct when both are in the DOM. */
  idPrefix: string;
}) {
  const colors = query.colors ?? [];
  const materials = query.materials ?? [];
  const min = query.minPrice ?? priceBounds.min;
  const max = query.maxPrice ?? priceBounds.max;
  const priceTouched = min !== priceBounds.min || max !== priceBounds.max;

  return (
    <div className="flex flex-col gap-7">
      {/* Colourways — multi-select swatch dots with the 2px lime active ring. */}
      <fieldset className="border-0 p-0">
        <legend className="lux-eyebrow mb-3 text-[var(--muted)]">Colour</legend>
        <div className="flex flex-wrap items-center gap-3">
          {allColorways.map((c: Colorway) => {
            const on = colors.includes(c.name);
            return (
              <button
                key={c.name}
                type="button"
                aria-pressed={on}
                aria-label={`Filter by ${c.name}`}
                onClick={() => onChange({ colors: toggle(colors, c.name) })}
                className={cn(
                  "size-8 rounded-full ring-1 transition-shadow duration-300",
                  on
                    ? "ring-2 ring-[var(--lime)] ring-offset-2 ring-offset-[var(--surface-1)]"
                    : "ring-[var(--hairline-strong)] hover:ring-[var(--muted)]",
                )}
                style={{ backgroundColor: c.hex }}
              />
            );
          })}
        </div>
      </fieldset>

      {/* Price — the landing page's slider, reskinned via `.lux-slider`. */}
      <fieldset className="border-0 p-0">
        <legend className="lux-eyebrow mb-3 text-[var(--muted)]">Price</legend>
        <Slider
          className="lux-slider mt-1"
          min={priceBounds.min}
          max={priceBounds.max}
          step={100}
          value={[min, max]}
          minStepsBetweenThumbs={1}
          aria-label="Price range"
          onValueChange={([nextMin, nextMax]) =>
            onChange({
              minPrice: nextMin === priceBounds.min ? undefined : nextMin,
              maxPrice: nextMax === priceBounds.max ? undefined : nextMax,
            })
          }
        />
        <div className="lux-mono lux-tabular mt-3 flex items-center justify-between text-[13px] text-[var(--muted)]">
          <span>{formatCents(min)}</span>
          <span>{priceTouched ? "" : "Any"}</span>
          <span>{formatCents(max)}</span>
        </div>
      </fieldset>

      {/* Material — a radio group styled as pills; a Select inside a small
          popover re-mounts a portal and traps scroll, so rows read better. */}
      <fieldset className="border-0 p-0">
        <legend className="lux-eyebrow mb-3 text-[var(--muted)]">Material</legend>
        <div className="flex flex-wrap gap-2">
          {MATERIALS.map((m: Material) => {
            const on = materials.includes(m);
            return (
              <button
                key={m}
                type="button"
                id={`${idPrefix}-material-${m.replace(/\s+/g, "-").toLowerCase()}`}
                aria-pressed={on}
                onClick={() => onChange({ materials: toggle(materials, m) })}
                className={cn(
                  "h-9 rounded-full px-4 text-[13px] transition-colors duration-300",
                  on
                    ? "bg-[var(--surface-2)] text-[var(--ivory)] ring-1 ring-[var(--lime)]"
                    : "text-[var(--muted)] ring-1 ring-[var(--hairline)] hover:text-[var(--ivory)] hover:ring-[var(--hairline-strong)]",
                )}
              >
                {m}
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
