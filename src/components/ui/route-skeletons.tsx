import { Skeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/ui/page-shell";
import { PageHeaderSkeleton } from "@/components/ui/page-header-skeleton";
import { cn } from "@/lib/utils";

/**
 * Route-level skeletons — one per page, mirroring that page's real layout so a
 * navigation never jumps when the route resolves (DESIGN.md rule 12: every
 * screen ships with loading states).
 *
 * Two layers per page: a `*BodySkeleton` that the screen itself can render
 * around its own header (`/studio`, `/account` show their header while their
 * client store hydrates), and a `*PageSkeleton` that the route's `loading.tsx`
 * renders, which owns the header too.
 *
 * Deliberately built from raw `Skeleton` blocks rather than `SectionSkeletons`,
 * so each skeleton can carry exactly one `role="status"` region and match the
 * real card geometry instead of a near-miss.
 */

/** One placeholder in the shape of the shared `ProductCard`. */
function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] [box-shadow:var(--inner-highlight)]">
      <Skeleton className="aspect-[4/5] w-full rounded-none" />
      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <Skeleton className="h-5 w-2/3 rounded-full" />
          <Skeleton className="h-4 w-12 rounded-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="size-4 rounded-full" />
          <Skeleton className="size-4 rounded-full" />
          <Skeleton className="size-4 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- shop */

/** Shop body: count line, toolbar, then the archive grid (2 → 4 columns). */
export function ShopBodySkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <Skeleton className="h-3 w-28 rounded-full" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-11 w-64 rounded-full" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-11 w-32 rounded-full" />
          <Skeleton className="h-11 w-24 rounded-full" />
        </div>
      </div>
      <ul className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4" aria-label="Loading archive">
        {Array.from({ length: 8 }, (_, i) => (
          <li key={i}>
            <ProductCardSkeleton />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ShopPageSkeleton() {
  return (
    <PageShell aria-label="Loading shop" className="lux">
      <PageHeaderSkeleton />
      <div className="mt-12" role="status" aria-label="Loading shop">
        <ShopBodySkeleton />
      </div>
    </PageShell>
  );
}

/* ------------------------------------------------------------------ studio */

/**
 * Stage + sidebar, then the suggestions rail — the shape of `/products/[id]`.
 * Shared with `studio-screen.tsx`, which renders it while its configurator
 * store hydrates.
 */
export function StageWithSidebarSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-12 lg:gap-16", className)}>
      <Skeleton className="h-4 w-64 rounded-full" />
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-8">
        <Skeleton className="aspect-[4/5] w-full rounded-[var(--card-radius)] lg:h-[calc(100svh-150px)] lg:flex-1" />
        <div className="flex w-full flex-col gap-4 lg:w-[440px] lg:shrink-0 xl:w-[460px]">
          <Skeleton className="h-10 w-2/3 rounded-full" />
          <Skeleton className="h-64 w-full rounded-[var(--card-radius)]" />
          <Skeleton className="h-64 w-full rounded-[var(--card-radius)]" />
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <Skeleton className="h-3 w-32 rounded-full" />
        <ul className="flex gap-4 overflow-hidden" aria-label="Loading suggestions">
          {Array.from({ length: 4 }, (_, i) => (
            <li key={i} className="w-[200px] shrink-0 sm:w-[220px] lg:w-[232px]">
              <ProductCardSkeleton />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * `/studio` — the hub: header, the blanks grid, then the upload strip.
 * Distinct from the stage skeleton because `/studio` is a chooser, not the
 * customizer.
 */
export function StudioHubPageSkeleton() {
  return (
    <PageShell aria-label="Loading studio" className="lux flex flex-col gap-14">
      <PageHeaderSkeleton />
      <div role="status" aria-label="Loading studio" className="flex flex-col gap-14">
        <section className="flex flex-col gap-6">
          <div className="flex items-end justify-between gap-4">
            <Skeleton className="h-9 w-32 rounded-[var(--inner-radius)] md:h-11 md:w-40" />
            <Skeleton className="h-3 w-20 rounded-full" />
          </div>
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4" aria-label="Loading blanks">
            {Array.from({ length: 4 }, (_, i) => (
              <li key={i}>
                <div className="flex flex-col gap-3">
                  <Skeleton className="aspect-[4/5] w-full rounded-[var(--card-radius)]" />
                  <Skeleton className="h-5 w-2/3 rounded-full" />
                </div>
              </li>
            ))}
          </ul>
        </section>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.2fr]">
          <Skeleton className="h-56 w-full rounded-[var(--card-radius)]" />
          <Skeleton className="h-56 w-full rounded-[var(--card-radius)]" />
        </div>
      </div>
    </PageShell>
  );
}

/**
 * `/products/[id]` — the stage route, in the narrow container that route uses
 * (no `PageShell`: this page renders inside the root layout's `<main>`).
 */
export function StudioProductPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 lg:px-12">
      <div role="status" aria-label="Loading studio">
        <StageWithSidebarSkeleton />
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- designs */

/** Designs body: toolbar row, then the saved-design grid (1 → 2 → 3 columns). */
export function DesignsBodySkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-11 w-64 rounded-full" />
        <Skeleton className="h-11 w-32 rounded-full" />
      </div>
      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading designs">
        {Array.from({ length: 6 }, (_, i) => (
          <li
            key={i}
            className="flex flex-col gap-4 rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] p-6 [box-shadow:var(--inner-highlight)]"
          >
            <Skeleton className="aspect-[4/3] w-full rounded-[var(--inner-radius)]" />
            <Skeleton className="h-5 w-1/2 rounded-full" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-12 rounded-full" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <Skeleton className="size-4 rounded-full" />
                <Skeleton className="size-4 rounded-full" />
                <Skeleton className="size-4 rounded-full" />
              </div>
              <Skeleton className="h-3 w-14 rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-11 flex-1 rounded-full" />
              <Skeleton className="h-11 flex-1 rounded-full" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DesignsPageSkeleton() {
  return (
    <PageShell aria-label="Loading designs" className="lux">
      <PageHeaderSkeleton />
      <div className="mt-12" role="status" aria-label="Loading designs">
        <DesignsBodySkeleton />
      </div>
    </PageShell>
  );
}

/* ----------------------------------------------------------------- account */

/** Chip row + the panel card. Also used by `/account` while its store hydrates. */
export function AccountBodySkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10", className)}>
      <div className="flex gap-1 overflow-hidden lg:w-56 lg:shrink-0 lg:flex-col">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-28 shrink-0 rounded-full lg:w-full" />
        ))}
      </div>
      <Skeleton className="min-h-[26rem] flex-1 rounded-[var(--card-radius)]" />
    </div>
  );
}

export function AccountPageSkeleton() {
  return (
    <PageShell aria-label="Loading account" className="lux flex flex-col gap-10">
      <PageHeaderSkeleton />
      <div role="status" aria-label="Loading account">
        <AccountBodySkeleton />
      </div>
    </PageShell>
  );
}
