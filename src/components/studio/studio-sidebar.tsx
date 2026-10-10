"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Star, Palette, Gauge, Stamp, Type, Info } from "lucide-react";

import { DecalDropzone } from "@/components/studio/controls/decal-dropzone";
import { EngraveControl } from "@/components/studio/controls/engrave-control";
import { FinishControl } from "@/components/studio/controls/finish-control";
import { HueColorControl, hueColor } from "@/components/studio/controls/hue-color-control";
import { DecalControls } from "@/components/studio/decal-controls";
import type { SectionId } from "@/components/studio/section-types";
import type { ProductConfig, ExtraConfig } from "@/lib/products/config";
import { hexToHue, isHex, clampFinish, type Configuration } from "@/lib/products/configuration";
import { setDecalAsset, clearDecalAsset } from "@/lib/products/decal-assets";
import { cn } from "@/lib/utils";

export function sectionsFor(product: ProductConfig): SectionId[] {
  const sections: SectionId[] = [];
  if (product.parts.some((p) => p.allowCustomColor)) sections.push("colour");
  if (product.parts.some((p) => p.finishable)) sections.push("finish");
  if (product.decal.enabled) sections.push("decal");
  if (product.engrave.enabled) sections.push("engrave");
  sections.push("details");
  return sections;
}

const SECTION_LABEL: Record<SectionId, string> = {
  colour: "Colour",
  finish: "Finish",
  decal: "Decal",
  engrave: "Engrave",
  details: "Details",
};

/**
 * Right column: its own scroll container, height matched to the stage. The
 * header stays pinned, the chips scroll the list to a section, and every
 * section is built from the product config. No per-product branching here.
 */
export function StudioSidebar({
  product,
  configuration,
  onChange,
  decalUrl,
  onDecalChange,
  placeholder,
  reduced,
  rating,
  price,
}: {
  product: ProductConfig;
  configuration: Configuration;
  onChange: (next: Configuration) => void;
  decalUrl: string | null;
  onDecalChange: () => void;
  placeholder: boolean;
  reduced: boolean;
  rating: number;
  price: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sections = sectionsFor(product);
  const [active, setActive] = useState<SectionId>(sections[0] ?? "details");

  // Scroll-spy: the section whose top is nearest the sidebar top is the active chip.
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const onScroll = () => {
      let current = sections[0] ?? "details";
      for (const id of sections) {
        const el = root.querySelector<HTMLElement>(`[data-section="${id}"]`);
        if (el && el.offsetTop - root.scrollTop <= 24) current = id;
      }
      setActive(current);
    };
    root.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => root.removeEventListener("scroll", onScroll);
  }, [sections]);

  function jumpTo(id: SectionId) {
    const root = scrollRef.current;
    const el = root?.querySelector<HTMLElement>(`[data-section="${id}"]`);
    if (!root || !el) return;
    root.scrollTo({
      top: el.offsetTop - 12,
      behavior: reduced ? "auto" : "smooth",
    });
    setActive(id);
  }

  return (
    <div className="flex w-full flex-col gap-4 lg:sticky lg:top-[80px] lg:h-[calc(100svh-128px)] lg:w-[440px] lg:shrink-0 xl:w-[460px]">
      <div className="flex flex-col gap-4 rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] p-5 [box-shadow:var(--inner-highlight)]">
        <div className="flex items-start justify-between gap-4">
          <span className="lux-display text-[26px] leading-[1.05] text-[var(--ivory)]">
            {product.name}
          </span>
          <span className="lux-tabular inline-flex shrink-0 items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur">
            <Star className="size-3 fill-current text-[var(--lime)]" strokeWidth={0} aria-hidden />
            {rating.toFixed(1)}
          </span>
        </div>
        <span className="lux-mono lux-tabular text-[14px] text-[var(--muted)]">{price}</span>

        {sections.length > 1 ? (
          <nav aria-label="Jump to section">
            <ul className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
              {sections.map((id) => (
                <li key={id}>
                  <button
                    type="button"
                    aria-current={active === id ? "true" : undefined}
                    onClick={() => jumpTo(id)}
                    className={cn(
                      "lux-mono min-h-11 rounded-full px-4 text-[11px] tracking-[0.14em] uppercase ring-1 transition-colors duration-300",
                      active === id
                        ? "bg-[var(--surface-2)] text-[var(--ivory)] ring-[var(--hairline-strong)]"
                        : "text-[var(--muted)] ring-[var(--hairline)] hover:text-[var(--ivory)]",
                    )}
                  >
                    {SECTION_LABEL[id]}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-6 bg-gradient-to-b from-[var(--ink)] to-transparent"
        />
        <div
          ref={scrollRef}
          data-lenis-prevent
          className="studio-scroll flex h-full flex-col gap-4 overflow-y-auto pr-2 pb-6 [scrollbar-color:var(--hairline-strong)_transparent] [scrollbar-width:thin]"
        >
          {sections.includes("colour") ? (
            <ColourSection product={product} configuration={configuration} onChange={onChange} reduced={reduced} />
          ) : null}
          {sections.includes("finish") ? (
            <FinishSection product={product} configuration={configuration} onChange={onChange} reduced={reduced} placeholder={placeholder} />
          ) : null}
          {sections.includes("decal") ? (
            <DecalSection product={product} configuration={configuration} onChange={onChange} decalUrl={decalUrl} onDecalChange={onDecalChange} reduced={reduced} />
          ) : null}
          {sections.includes("engrave") ? (
            <EngraveSection product={product} configuration={configuration} onChange={onChange} reduced={reduced} />
          ) : null}
          <ExtrasSection product={product} configuration={configuration} onChange={onChange} reduced={reduced} />
          <DetailsSection product={product} reduced={reduced} />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-[var(--ink)] to-transparent"
        />
      </div>
    </div>
  );
}

/** One landing-page card: radius, hairline, icon + serif title + muted description. */
function SectionCard({
  id,
  icon,
  title,
  description,
  reduced,
  children,
}: {
  id: SectionId;
  icon: ReactNode;
  title: string;
  description: string;
  reduced: boolean;
  children: ReactNode;
}) {
  return (
    <motion.section
      data-section={id}
      aria-labelledby={`studio-${id}`}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14, filter: "blur(8px)" }}
      whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, root: undefined, margin: "-5% 0px -5% 0px" }}
      transition={{ duration: reduced ? 0.3 : 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-5 rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] p-6 [box-shadow:var(--inner-highlight)]"
    >
      <header className="flex items-start gap-3">
        <span className="mt-0.5 text-[var(--lime)]">{icon}</span>
        <div className="flex flex-col gap-1">
          <h3 id={`studio-${id}`} className="lux-display text-[20px] text-[var(--ivory)]">
            {title}
          </h3>
          <p className="text-[14px] leading-[1.6] text-[var(--muted)]">{description}</p>
        </div>
      </header>
      {children}
    </motion.section>
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
  const current = configuration.parts[part.id]?.color ?? part.swatches[0]?.hex ?? "#c6f135";
  const hue = hexToHue(current);

  function setColor(hex: string) {
    onChange({
      ...configuration,
      parts: { ...configuration.parts, [part!.id]: { color: hex, finish: configuration.parts[part!.id]?.finish ?? 0 } },
    });
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
        hue={hue}
        onHueChange={(h) => setColor(hueColor(h))}
      />

      <ul aria-label={`${part.label} presets`} className="flex flex-wrap items-center gap-3">
        {part.swatches.map((s) => (
          <li key={s.name}>
            <button
              type="button"
              aria-label={`${s.name} ${s.hex}`}
              aria-pressed={current.toLowerCase() === s.hex.toLowerCase()}
              onClick={() => setColor(s.hex)}
              className={cn(
                "block size-11 rounded-full p-[6px] transition-shadow duration-300",
                current.toLowerCase() === s.hex.toLowerCase()
                  ? "ring-2 ring-[var(--lime)] ring-offset-2 ring-offset-[var(--surface-1)]"
                  : "ring-1 ring-[var(--hairline-strong)]",
              )}
            >
              <span className="block size-full rounded-full" style={{ backgroundColor: s.hex }} />
            </button>
          </li>
        ))}
      </ul>

      <HexInput
        value={current}
        onValid={setColor}
        label={`${part.label} hex colour`}
      />
    </SectionCard>
  );
}

/** Hex input that commits only valid six-digit colours; invalid text is shown, never applied. */
function HexInput({ value, onValid, label }: { value: string; onValid: (hex: string) => void; label: string }) {
  const [draft, setDraft] = useState(value);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => setDraft(value), [value]);

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={`hex-${label}`} className="lux-mono text-[11px] tracking-[0.16em] text-[var(--muted)] uppercase">
        Hex
      </Label>
      <Input
        id={`hex-${label}`}
        value={draft}
        onChange={(e) => {
          const next = e.target.value;
          setDraft(next);
          const ok = isHex(next);
          setInvalid(!ok);
          if (ok) onValid(next.toUpperCase());
        }}
        aria-invalid={invalid}
        aria-describedby={invalid ? `hex-err-${label}` : undefined}
        className="lux-mono h-11 rounded-full bg-[var(--surface-2)] px-4 text-[var(--ivory)]"
        maxLength={7}
        spellCheck={false}
      />
      {invalid ? (
        <p id={`hex-err-${label}`} role="alert" className="lux-mono text-[11px] text-[#ffb4ab] tracking-[0.12em]">
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
  placeholder,
}: {
  product: ProductConfig;
  configuration: Configuration;
  onChange: (next: Configuration) => void;
  reduced: boolean;
  placeholder: boolean;
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
        onGlossChange={(next) => {
          onChange({
            ...configuration,
            parts: {
              ...configuration.parts,
              [part.id]: {
                color: current?.color ?? part.swatches[0]?.hex ?? "#c6f135",
                finish: clampFinish(part, next),
              },
            },
          });
        }}
      />
      {placeholder ? (
        <p className="lux-mono text-[11px] tracking-[0.14em] text-[var(--faint)] uppercase">
          Finish applies to the placeholder model. A real GLB uses the same control.
        </p>
      ) : null}
    </SectionCard>
  );
}

function DecalSection({
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
  const [error, setError] = useState<string | null>(null);
  const zones = product.decal.zones;
  const settings = configuration.decal;
  const zone = zones.find((z) => z.id === settings?.zone) ?? zones[0];

  function handleFile(file: File | null, problem?: string) {
    if (!file) {
      setError(problem ?? null);
      return;
    }
    setError(null);
    setDecalAsset(product.slug, { url: URL.createObjectURL(file), name: file.name, mime: file.type });
    onChange({
      ...configuration,
      decal: {
        name: file.name.slice(0, 80),
        zone: zone?.id ?? "",
        scale: 1,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
        avoidSeams: true,
      },
    });
    onDecalChange();
  }

  function removeDecal() {
    clearDecalAsset(product.slug);
    onChange({ ...configuration, decal: null });
    onDecalChange();
  }

  return (
    <SectionCard
      id="decal"
      icon={<Stamp className="size-5" strokeWidth={1.5} aria-hidden />}
      title="Custom decals"
      description={`Upload artwork for ${zones.map((z) => z.label.toLowerCase()).join(" or ")}. Placed on the surface you choose.`}
      reduced={reduced}
    >
      {decalUrl && settings ? (
        <DecalControls
          zones={zones}
          thumbnailUrl={decalUrl}
          settings={settings}
          onChange={(next) => onChange({ ...configuration, decal: next })}
          onReplace={() => setError(null)}
          onRemove={removeDecal}
          onFile={handleFile}
        />
      ) : (
        <DecalDropzone onFile={handleFile} />
      )}
      {error ? (
        <p role="alert" className="lux-mono text-[11px] tracking-[0.12em] text-[#ffb4ab] uppercase">
          {error}
        </p>
      ) : null}
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
              className="h-11 rounded-full bg-[var(--surface-2)] px-4 text-[var(--ivory)]"
            />
            <p className="lux-mono text-[11px] tracking-[0.12em] text-[var(--faint)] uppercase">
              {engrave.text.length} / {maxChars}
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
              onChange={(e) => onChange({ ...configuration, engrave: { ...engrave, sizePct: Number(e.target.value) } })}
              className="h-2.5 w-full cursor-pointer touch-none appearance-none rounded-full accent-[var(--lime)]"
            />
          </div>
        </>
      ) : null}
    </SectionCard>
  );
}

function ExtrasSection({
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
  if (product.extras.length === 0) return null;
  return (
    <SectionCard
      id="details"
      icon={<Info className="size-5" strokeWidth={1.5} aria-hidden />}
      title="Options"
      description="Size, finish and fit choices for this product."
      reduced={reduced}
    >
      {product.extras.map((extra) => (
        <ExtraRow
          key={extra.id}
          extra={extra}
          value={configuration.extras[extra.id]}
          onChange={(value) =>
            onChange({ ...configuration, extras: { ...configuration.extras, [extra.id]: value } })
          }
        />
      ))}
    </SectionCard>
  );
}

function ExtraRow({
  extra,
  value,
  onChange,
}: {
  extra: ExtraConfig;
  value: string | boolean | undefined;
  onChange: (value: string | boolean) => void;
}) {
  if (extra.type === "toggle") {
    return (
      <label className="flex items-center justify-between gap-4">
        <span className="text-[15px] text-[var(--ivory)]">{extra.label}</span>
        <Switch
          aria-label={extra.label}
          checked={value === true}
          onCheckedChange={(v) => onChange(v)}
        />
      </label>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="lux-mono text-[11px] tracking-[0.16em] text-[var(--muted)] uppercase">{extra.label}</span>
      <ToggleGroup
        type="single"
        value={typeof value === "string" ? value : ""}
        onValueChange={(v) => {
          if (v) onChange(v);
        }}
        aria-label={extra.label}
        className="flex-wrap"
      >
        {extra.options.map((o) => (
          <ToggleGroupItem key={o.value} value={o.value}>
            {o.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

function DetailsSection({ product, reduced }: { product: ProductConfig; reduced: boolean }) {
  const items = [
    { id: "materials", label: "Materials", body: product.details.materials },
    { id: "dimensions", label: "Dimensions", body: product.details.dimensions },
    { id: "care", label: "Care", body: product.details.care },
    { id: "production", label: "Production time", body: product.details.productionTime },
    { id: "shipping", label: "Shipping", body: product.details.shipping },
  ];
  return (
    <SectionCard
      id="details"
      icon={<Info className="size-5" strokeWidth={1.5} aria-hidden />}
      title="Details"
      description="Materials, care and how it reaches you."
      reduced={reduced}
    >
      <Accordion type="single" collapsible defaultValue="materials">
        {items.map((item) => (
          <AccordionItem key={item.id} value={item.id}>
            <AccordionTrigger>{item.label}</AccordionTrigger>
            <AccordionContent>{item.body}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </SectionCard>
  );
}
