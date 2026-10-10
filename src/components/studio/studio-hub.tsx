"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Droplets, Layers, Palette, Stamp, Type, Upload, RotateCcw } from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCents } from "@/lib/format";
import { products, type Product } from "@/lib/catalog";
import { cn } from "@/lib/utils";

/** Local draft found under `vend3d-configurator:<slug>`, read defensively. */
type Draft = { slug: string; name: string; image: string };

const STRIP = [
  { icon: Palette, label: "Colour", caption: "Pick a hue or preset. Live on the product." },
  { icon: Droplets, label: "Finish", caption: "Matte to glossy, driving the real surface." },
  { icon: Stamp, label: "Decal", caption: "Upload artwork and place it on a zone." },
  { icon: Type, label: "Engrave", caption: "Text and depth, where the product allows it." },
] as const;

/**
 * Entry point for `/studio`. Lists the blanks, offers a custom upload, and
 * resumes the last unfinished configuration found in this browser. Everything
 * here is UI only: the cards open the real studio at `/products/[slug]`.
 */
export function StudioHub() {
  const [drafts, setDrafts] = useState<Draft[] | null>(null);

  useEffect(() => {
    setDrafts(readDrafts());
  }, []);

  const latest = drafts?.[0] ?? null;

  return (
    <PageShell aria-label="Studio" className="lux flex flex-col gap-14">
      <PageHeader
        eyebrow="Studio"
        title="Choose a blank to shape."
        intro="Pick a product, set its colour and finish, then place artwork or engraving. Your progress is kept in this browser."
      />

      {drafts === null ? (
        <Skeleton className="h-24 w-full rounded-[var(--card-radius)]" />
      ) : latest ? (
        <ResumeRow draft={latest} />
      ) : null}

      <section aria-labelledby="blanks-heading" className="flex flex-col gap-6">
        <div className="flex items-end justify-between gap-4">
          <h2 id="blanks-heading" className="lux-h2 lux-display text-[28px] text-[var(--ivory)] md:text-[36px]">
            Blanks
          </h2>
          <span className="lux-mono text-[11px] tracking-[0.16em] text-[var(--muted)] uppercase">
            {products.length} products
          </span>
        </div>

        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {products.map((product, i) => (
            <BlankCard key={product.id} product={product} index={i} />
          ))}
        </ul>
      </section>

      <section aria-labelledby="upload-heading" className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.2fr]">
        <UploadCard />
        <FeatureStrip />
      </section>
    </PageShell>
  );
}

function readDrafts(): Draft[] {
  if (typeof window === "undefined") return [];
  const found: Draft[] = [];
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key?.startsWith("vend3d-configurator:")) continue;
      const slug = key.slice("vend3d-configurator:".length);
      const product = products.find((p) => p.id === slug);
      if (!product) continue;
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as { state?: { history?: { present?: unknown } } };
      if (!parsed.state?.history?.present) continue;
      found.push({ slug, name: product.name, image: product.image });
    }
  } catch {
    return [];
  }
  return found;
}

function ResumeRow({ draft }: { draft: Draft }) {
  return (
    <section
      aria-labelledby="resume-heading"
      className="flex flex-col gap-4 rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] p-4 [box-shadow:var(--inner-highlight)] sm:flex-row sm:items-center sm:gap-5 sm:p-5"
    >
      <div className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-[var(--inner-radius)] bg-[var(--surface-2)]">
        <Image src={draft.image} alt="" fill sizes="80px" className="object-cover" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="lux-eyebrow text-[var(--lime)]" id="resume-heading">
          Continue where you left off
        </span>
        <span className="lux-display truncate text-[20px] text-[var(--ivory)]">{draft.name}</span>
        <span className="lux-mono text-[11px] tracking-[0.14em] text-[var(--muted)] uppercase">
          Saved in this browser
        </span>
      </div>
      <Button asChild className="h-11 rounded-full bg-[var(--ivory)] px-6 text-[var(--ink)] hover:bg-[var(--ivory)]/90">
        <Link href={`/products/${draft.slug}`}>
          <RotateCcw className="size-4" strokeWidth={1.5} aria-hidden />
          Resume
        </Link>
      </Button>
    </section>
  );
}

function BlankCard({ product, index }: { product: Product; index: number }) {
  const [active, setActive] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const swatch = product.colorways[active] ?? product.colorways[0];
  const glow = swatch?.hex ?? "#c6f135";
  const slug = colorSlug(swatch?.name ?? "");

  function onMove(e: MouseEvent<HTMLLIElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -6, y: px * 6 });
  }

  return (
    <li
      onMouseMove={onMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      style={{
        transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        animationDelay: `${index * 60}ms`,
      }}
      className="group/blank relative flex flex-col overflow-hidden rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] p-4 transition-[transform,border-color] duration-300 ease-out [box-shadow:var(--inner-highlight)] hover:border-[var(--hairline-strong)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70 transition-opacity duration-300 group-hover/blank:opacity-100"
        style={{
          background: `radial-gradient(120% 70% at 50% 0%, color-mix(in srgb, ${glow} 26%, transparent), transparent 70%)`,
        }}
      />

      <Link
        href={`/products/${product.id}${slug ? `?color=${slug}` : ""}`}
        aria-label={`Start designing ${product.name}`}
        className="relative flex flex-1 flex-col gap-4 rounded-[var(--inner-radius)] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lime)]"
      >
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[var(--inner-radius)] bg-[var(--surface-2)]">
          <Image
            src={product.image}
            alt={`${product.name} in ${swatch?.name ?? "default colour"}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 ease-out group-hover/blank:scale-[1.04]"
          />
          <span className="lux-tabular absolute top-3 right-3 inline-flex items-center rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur">
            {product.rating.toFixed(1)}
          </span>
        </div>

        <div className="flex items-baseline justify-between gap-3 px-1">
          <span className="lux-display text-[20px] text-[var(--ivory)]">{product.name}</span>
          <span className="lux-mono lux-tabular text-[14px] text-[var(--muted)]">{formatCents(product.priceCents)}</span>
        </div>
      </Link>

      <div className="flex flex-col gap-4 px-1 pt-4">
        <ul aria-label={`${product.name} colours`} className="flex flex-wrap items-center gap-2">
          {product.colorways.map((c, i) => (
            <li key={c.name}>
              <button
                type="button"
                aria-label={`${c.name}`}
                aria-pressed={active === i}
                onClick={() => setActive(i)}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  "flex size-11 items-center justify-center rounded-full transition-shadow duration-300",
                  active === i ? "ring-2 ring-[var(--lime)] ring-offset-2 ring-offset-[var(--surface-1)]" : "ring-1 ring-[var(--hairline-strong)]",
                )}
              >
                <span className="block size-5 rounded-full" style={{ backgroundColor: c.hex }} />
              </button>
            </li>
          ))}
        </ul>
        <Button asChild variant="ghost" className="h-11 w-full rounded-full px-5 text-[var(--ivory)] ring-1 ring-[var(--hairline-strong)] hover:bg-[var(--surface-2)]">
          <Link href={`/products/${product.id}${slug ? `?color=${slug}` : ""}`}>
            Start designing
            <ArrowRight className="size-4" strokeWidth={1.5} aria-hidden />
          </Link>
        </Button>
      </div>
    </li>
  );
}

function UploadCard() {
  return (
    <section
      aria-labelledby="upload-heading"
      className="flex flex-col justify-between gap-6 rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] p-6 [box-shadow:var(--inner-highlight)]"
    >
      <header className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0 text-[var(--lime)]">
          <Upload className="size-5" strokeWidth={1.5} aria-hidden />
        </span>
        <div className="flex flex-col gap-1">
          <h2 id="upload-heading" className="lux-display text-[20px] text-[var(--ivory)]">
            Upload your own design
          </h2>
          <p className="text-[14px] leading-[1.6] text-[var(--muted)]">
            Start from your artwork. Pick a blank next to place it on.
          </p>
        </div>
      </header>
      <Button asChild variant="ghost" className="h-11 w-fit rounded-full px-5 text-[var(--ivory)] ring-1 ring-[var(--hairline-strong)] hover:bg-[var(--surface-2)]">
        <Link href="/shop">Choose a blank for it</Link>
      </Button>
    </section>
  );
}

function FeatureStrip() {
  return (
    <section
      aria-labelledby="features-heading"
      className="flex flex-col gap-6 rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] p-6 [box-shadow:var(--inner-highlight)]"
    >
      <h2 id="features-heading" className="sr-only">
        What you can adjust
      </h2>
      <ul className="grid grid-cols-2 gap-x-6 gap-y-6">
        {STRIP.map(({ icon: Icon, label, caption }) => (
          <li key={label} className="flex flex-col gap-2">
            <span className="flex size-10 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--lime)] ring-1 ring-[var(--hairline)]">
              <Icon className="size-4" strokeWidth={1.5} aria-hidden />
            </span>
            <span className="lux-mono text-[11px] tracking-[0.16em] text-[var(--ivory)] uppercase">{label}</span>
            <span className="text-[13px] leading-[1.5] text-[var(--muted)]">{caption}</span>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2 text-[var(--muted)]">
        <Layers className="size-4" strokeWidth={1.5} aria-hidden />
        <span className="lux-mono text-[11px] tracking-[0.14em] uppercase">Every blank opens in the same studio</span>
      </div>
    </section>
  );
}

function colorSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}
