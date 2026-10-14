import { Skeleton } from "@/components/ui/skeleton";

/**
 * Header placeholder in the shape of `PageHeader` (eyebrow, serif H1, intro),
 * so a route-level skeleton holds the same vertical rhythm the real page will
 * and the content does not jump when the route resolves.
 *
 * The eyebrow is a 3px-tall pill because `lux-eyebrow` is small mono caps; the
 * title reserves two lines because most page H1s wrap to two on mobile.
 */
export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between" aria-hidden>
      <div className="flex max-w-2xl flex-col gap-4">
        <Skeleton className="h-3 w-24 rounded-full" />
        <Skeleton className="h-11 w-72 rounded-[var(--inner-radius)] sm:h-12 sm:w-[26rem]" />
        <Skeleton className="h-4 w-full max-w-xl rounded-full" />
        <Skeleton className="h-4 w-2/3 max-w-md rounded-full" />
      </div>
      <Skeleton className="h-11 w-32 shrink-0 rounded-full" />
    </div>
  );
}
