"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { DesignCard } from "@/components/designs/design-card";
import { useDesignsStore } from "@/stores/designs-store";
import {
  isDesignSort,
  isDesignTab,
  productsIn,
  selectDesigns,
  type DesignSort,
  type DesignTab,
} from "@/lib/designs/library";
import { cn } from "@/lib/utils";

const ALL = "all";

/**
 * `/designs`: the user's saved configurations. Filter and sort state lives in
 * the URL so a filtered view can be shared and survives a reload. Storage is
 * the local designs store until accounts exist (plan.md Phase 7).
 */
export function DesignsScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const designs = useDesignsStore((s) => s.designs);
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const tabParam = params.get("tab");
  const sortParam = params.get("sort");
  const tab: DesignTab = isDesignTab(tabParam) ? tabParam : "all";
  const sort: DesignSort = isDesignSort(sortParam) ? sortParam : "recent";
  const product = params.get("product") ?? ALL;

  useEffect(() => {
    useDesignsStore.persist.rehydrate();
    setHydrated(true);
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value === ALL || value === "recent" || value === "all") next.delete(key);
    else next.set(key, value);
    const qs = next.toString();
    router.replace(qs ? `/designs?${qs}` : "/designs", { scroll: false });
  }

  const visible = useMemo(
    () => selectDesigns(designs, { tab, sort, product }),
    [designs, tab, sort, product],
  );
  const productOptions = useMemo(() => productsIn(designs), [designs]);
  const counts = useMemo(
    () => ({
      all: designs.length,
      drafts: designs.filter((d) => !d.orderedAt).length,
      ordered: designs.filter((d) => !!d.orderedAt).length,
    }),
    [designs],
  );

  return (
    <PageShell aria-label="Designs" className="lux flex flex-col gap-10">
      <PageHeader
        eyebrow="Designs"
        title="Your designs."
        intro="Every configuration you save in the studio. Open one to keep shaping it, or add it to your cart."
        action={
          <Button asChild className="h-12 rounded-full bg-[var(--ivory)] px-7 text-[15px] font-medium text-[var(--ink)] hover:bg-[var(--ivory)]/90">
            <Link href="/studio">
              New design
              <ArrowRight className="size-4" strokeWidth={1.5} aria-hidden />
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Tabs value={tab} onValueChange={(v) => setParam("tab", v)}>
          <TabsList className="h-11 rounded-full border border-[var(--hairline)] bg-transparent p-1">
            {(["all", "drafts", "ordered"] as const).map((t) => (
              <TabsTrigger
                key={t}
                value={t}
                className="rounded-full px-4 text-[13px] text-[var(--muted)] data-[state=active]:bg-[var(--surface-2)] data-[state=active]:text-[var(--ivory)] data-[state=active]:ring-1 data-[state=active]:ring-[var(--hairline-strong)]"
              >
                {t === "all" ? "All" : t === "drafts" ? "Drafts" : "Ordered"}
                <span className="lux-mono lux-tabular ml-2 text-[11px] text-[var(--faint)]">{counts[t]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-3">
          <Select value={product} onValueChange={(v) => setParam("product", v)}>
            <SelectTrigger aria-label="Filter by product" className="h-11 min-w-[180px] rounded-full border-[var(--hairline)] bg-[var(--surface-1)] px-4 text-[var(--ivory)]">
              <SelectValue placeholder="All products" />
            </SelectTrigger>
            <SelectContent className="lux rounded-[var(--inner-radius)] border-[var(--hairline)] bg-[var(--surface-2)] text-[var(--ivory)]">
              <SelectItem value={ALL}>All products</SelectItem>
              {productOptions.map((p) => (
                <SelectItem key={p.slug} value={p.slug}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={(v) => setParam("sort", v)}>
            <SelectTrigger aria-label="Sort designs" className="h-11 min-w-[150px] rounded-full border-[var(--hairline)] bg-[var(--surface-1)] px-4 text-[var(--ivory)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="lux rounded-[var(--inner-radius)] border-[var(--hairline)] bg-[var(--surface-2)] text-[var(--ivory)]">
              <SelectItem value="recent">Recent</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!hydrated ? (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading designs">
          {Array.from({ length: 3 }, (_, i) => (
            <li key={i} className="overflow-hidden rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)]">
              <Skeleton className="aspect-[4/3] w-full rounded-none" />
              <div className="flex flex-col gap-3 p-5">
                <Skeleton className="h-5 w-2/3 rounded-full" />
                <Skeleton className="h-4 w-1/3 rounded-full" />
              </div>
            </li>
          ))}
        </ul>
      ) : designs.length === 0 ? (
        <EmptyState
          eyebrow="Nothing saved yet"
          title="Nothing shaped yet."
          body="Save a design from the studio and it will appear here, ready to reopen or order."
          icon={<SketchHint />}
          action={
            <Button asChild className="h-12 rounded-full bg-[var(--ivory)] px-7 text-[var(--ink)] hover:bg-[var(--ivory)]/90">
              <Link href="/studio">Start designing</Link>
            </Button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          eyebrow="No matches"
          title="No designs match these filters."
          body="Try another tab or product, or clear the filters."
          action={
            <Button variant="ghost" className="h-11 rounded-full px-5 text-[var(--ivory)] ring-1 ring-[var(--hairline-strong)]" onClick={() => router.replace("/designs", { scroll: false })}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((design) => (
            <DesignCard key={design.id} design={design} now={now} />
          ))}
        </ul>
      )}
    </PageShell>
  );
}

/** Quiet looping SVG hint for the empty state. Decorative, so it is aria-hidden. */
function SketchHint() {
  return (
    <svg viewBox="0 0 120 60" className={cn("h-14 w-28 text-[var(--lime)]")} fill="none" aria-hidden>
      <path d="M8 46 C 30 4, 60 56, 112 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="160" strokeDashoffset="160">
        <animate attributeName="stroke-dashoffset" from="160" to="0" dur="3.2s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}
