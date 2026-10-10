"use client";

import { useState, type ReactNode } from "react";
import { Info, Stamp, SlidersHorizontal } from "lucide-react";

import { DecalControls } from "@/components/studio/decal-controls";
import { DecalDropzone } from "@/components/studio/controls/decal-dropzone";
import { SectionCard } from "@/components/studio/studio-section-card";
import { sectionsFor } from "@/components/studio/section-types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ExtraConfig, ProductConfig } from "@/lib/products/config";
import type { Configuration } from "@/lib/products/configuration";
import { clearDecalAsset, setDecalAsset } from "@/lib/products/decal-assets";

/**
 * The customization block under the two columns: custom decal upload, the
 * product's extra options, and the details accordion. Every control here is
 * built from the product config.
 */
export function StudioCustomization({
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
  const chips = sectionsFor(product);

  return (
    <section aria-labelledby="customization-heading" className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="lux-eyebrow text-[var(--lime)]">Customize further</span>
        <h2 id="customization-heading" className="lux-h2 lux-display text-[var(--ivory)]">
          Decal, options and details
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {chips.includes("decal") ? (
          <DecalPanel
            product={product}
            configuration={configuration}
            onChange={onChange}
            decalUrl={decalUrl}
            onDecalChange={onDecalChange}
            reduced={reduced}
          />
        ) : null}

        {product.extras.length > 0 ? (
          <OptionsPanel product={product} configuration={configuration} onChange={onChange} reduced={reduced} />
        ) : null}

        <DetailsPanel product={product} reduced={reduced} />
      </div>
    </section>
  );
}

function DecalPanel({
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
        zone: zones[0]?.id ?? "",
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
      description={`Upload artwork for the ${zones.map((z) => z.label.toLowerCase()).join(" or ")}.`}
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
        <p role="alert" className="lux-mono text-[11px] tracking-[0.12em] text-[var(--destructive)] uppercase">
          {error}
        </p>
      ) : null}
    </SectionCard>
  );
}

function OptionsPanel({
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
  return (
    <SectionCard
      id="options"
      icon={<SlidersHorizontal className="size-5" strokeWidth={1.5} aria-hidden />}
      title="Options"
      description="Size, capacity and fit choices for this product."
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
        <Switch aria-label={extra.label} checked={value === true} onCheckedChange={(v) => onChange(v)} />
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

function DetailsPanel({ product, reduced }: { product: ProductConfig; reduced: boolean }) {
  const items: { id: string; label: string; body: ReactNode }[] = [
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
      className="lg:col-span-2"
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
