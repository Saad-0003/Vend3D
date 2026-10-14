"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { BlurFade } from "@/components/ui/blur-fade";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { InfoLink, InfoNote, InfoProse, InfoTable, type InfoBlock } from "@/components/info/info-blocks";
import { cn } from "@/lib/utils";
import { scrollToSection } from "@/lib/lenis";

/**
 * The one template every informational page uses.
 *
 * Shape: `PageHeader`, then a two-column body on desktop — a sticky table of
 * contents with scroll-spy on the left, the content sections with blur-fade
 * reveals on the right — collapsing to a single column with a compact TOC chip
 * row below `lg`. A closing band with one primary pill ends every page.
 *
 * Pages pass a `sections` array of blocks, so adding an information page is a
 * data file rather than a new layout (DESIGN.md rule 3).
 */

export type { InfoBlock };

export type InfoSection = {
  id: string;
  title: string;
  blocks: InfoBlock[];
};

export function InfoPage({
  eyebrow,
  title,
  intro,
  notice,
  sections,
  closing,
  closingNote,
}: {
  eyebrow: string;
  title: string;
  intro: ReactNode;
  /** Rendered under the header, above the body — used for the legal draft notice. */
  notice?: ReactNode;
  sections: InfoSection[];
  /** Closing band with a primary pill. Legal pages pass `closingNote` instead. */
  closing?: { title: string; body: string; label: string; href: string };
  /** Trailing line of text links, for pages that must not end in a CTA. */
  closingNote?: ReactNode;
}) {
  return (
    <PageShell aria-label={title} className="lux">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col">
        <PageHeader eyebrow={eyebrow} title={title} intro={intro} />

        {notice ? <div className="mt-8 flex flex-col gap-3">{notice}</div> : null}

        <div className="mt-12 flex flex-col gap-10 lg:mt-16 lg:flex-row lg:gap-16">
          <InfoToc sections={sections} />

          <div className="flex min-w-0 flex-1 flex-col gap-14">
            {sections.map((section, index) => (
              <BlurFade
                key={section.id}
                inView
                direction="up"
                offset={10}
                duration={0.6}
                blur="8px"
                delay={index * 0.04}
                className="flex flex-col gap-6"
              >
                <section id={section.id} className="flex scroll-mt-24 flex-col gap-6">
                  <h2 className="lux-display text-[26px] leading-[1.2] text-[var(--ivory)] md:text-[30px]">
                    {section.title}
                  </h2>
                  {section.blocks.map((block, blockIndex) => (
                    <Block key={blockIndex} block={block} />
                  ))}
                </section>
              </BlurFade>
            ))}

            {closing ? <ClosingBand {...closing} /> : null}
            {closingNote ? (
              <div className="border-t border-[var(--hairline)] pt-8 text-[14px] leading-[1.7] text-[var(--muted)]">
                {closingNote}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

/** Sticky on desktop, chip row on mobile. Both are the same single list. */
function InfoToc({ sections }: { sections: InfoSection[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const targets = sections
      .map((section) => document.getElementById(section.id))
      .filter((element): element is HTMLElement => element !== null);
    if (targets.length === 0) return;

    // The section crossing the top band of the viewport is the current one.
    // The bottom margin keeps a section from claiming the marker while it is
    // still mostly below the fold.
    const observer = new IntersectionObserver(
      (entries) => {
        const shown = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (shown[0]) setActive(shown[0].target.id);
      },
      { rootMargin: "-120px 0px -55% 0px", threshold: 0 },
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav aria-label="On this page" className="lg:sticky lg:top-28 lg:self-start">
      <ul className="flex max-w-full gap-1 overflow-x-auto pb-1 lg:w-56 lg:flex-col lg:overflow-visible lg:pb-0">
        {sections.map((section) => {
          const current = section.id === active;
          return (
            <li key={section.id} className="shrink-0 lg:shrink">
              <a
                href={`#${section.id}`}
                aria-current={current ? "true" : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  setActive(section.id);
                  scrollToSection(section.id);
                  window.history.replaceState(null, "", `#${section.id}`);
                }}
                className={cn(
                  "flex items-center gap-3 rounded-full px-3 py-2 text-[13px] whitespace-nowrap transition-colors lg:w-full",
                  current
                    ? "text-[var(--ivory)]"
                    : "text-[var(--muted)] hover:text-[var(--ivory)]",
                )}
              >
                {/* Dot on mobile, vertical bar on desktop — the active marker. */}
                <span
                  aria-hidden
                  className={cn(
                    "size-1.5 shrink-0 rounded-full transition-colors lg:h-3.5 lg:w-[2px]",
                    current ? "bg-[var(--lime)]" : "bg-transparent lg:bg-[var(--hairline-strong)]",
                  )}
                />
                {section.title}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function ClosingBand({
  title,
  body,
  label,
  href,
}: {
  title: string;
  body: string;
  label: string;
  href: string;
}) {
  return (
    <div className="flex flex-col items-start gap-6 rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] p-8 [box-shadow:var(--inner-highlight)] md:flex-row md:items-center md:justify-between md:p-10">
      <div className="flex flex-col gap-2">
        <h2 className="lux-display text-[24px] leading-[1.2] text-[var(--ivory)]">{title}</h2>
        <p className="max-w-[52ch] text-[15px] leading-[1.6] text-[var(--muted)]">{body}</p>
      </div>
      <Button
        asChild
        className="h-12 shrink-0 rounded-full bg-[var(--lime)] px-7 text-[15px] font-medium text-[var(--ink)] hover:bg-[var(--lime)]/90"
      >
        <Link href={href}>
          {label}
          <ArrowRight className="size-4" strokeWidth={1.5} aria-hidden />
        </Link>
      </Button>
    </div>
  );
}

function Block({ block }: { block: InfoBlock }) {
  switch (block.kind) {
    case "prose":
      return <InfoProse body={block.body} />;
    case "note":
      return <InfoNote body={block.body} />;
    case "list":
      return (
        <ul className="flex flex-col gap-5">
          {block.items.map((item) => (
            <li key={item.title} className="flex items-start gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--lime-glow)] text-[var(--lime)] ring-1 ring-[color-mix(in_srgb,var(--lime)_30%,transparent)]">
                {item.icon}
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <h3 className="text-[15px] font-medium text-[var(--ivory)]">{item.title}</h3>
                {item.body ? (
                  <p className="max-w-[62ch] text-[14px] leading-[1.6] text-[var(--muted)]">{item.body}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      );
    case "table":
      return (
        <InfoTable
          columns={block.columns}
          rows={block.rows}
          caption={block.caption}
          numeric={block.numeric}
        />
      );
    case "faq":
      return (
        <Accordion type="single" collapsible className="flex flex-col">
          {block.items.map((item) => (
            <AccordionItem key={item.q} value={item.q}>
              <AccordionTrigger className="py-4 text-[15px] hover:text-[var(--ivory)]">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-4 text-[14px] leading-[1.7]">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      );
    case "figure":
      return (
        <figure className="flex flex-col gap-3">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[var(--inner-radius)] border border-[var(--hairline)] bg-[var(--surface-2)]">
            <Image
              src={block.src}
              alt={block.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 720px"
              className="object-cover"
            />
          </div>
          <figcaption className="text-[13px] leading-[1.6] text-[var(--muted)]">{block.caption}</figcaption>
        </figure>
      );
    case "grid":
      return (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {block.items.map((item) => (
            <li
              key={item.title}
              className="flex flex-col gap-4 rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] p-6 [box-shadow:var(--inner-highlight)]"
            >
              {item.media ? (
                <div className="flex items-center justify-between gap-4">{item.media}</div>
              ) : null}
              <div className="flex flex-col gap-2">
                <h3 className="lux-display text-[19px] text-[var(--ivory)]">{item.title}</h3>
                <p className="text-[14px] leading-[1.6] text-[var(--muted)]">{item.body}</p>
              </div>
              {item.meta ? (
                <span className="lux-mono text-[11px] tracking-[0.14em] text-[var(--faint)] uppercase">
                  {item.meta}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      );
    case "custom":
      return <>{block.node}</>;
  }
}

export { InfoLink };
