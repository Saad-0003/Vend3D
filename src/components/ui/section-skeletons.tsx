import { Skeleton } from "@/components/ui/skeleton";

import { cn } from "@/lib/utils";

type Variant = "card-grid" | "product-grid" | "list";

/**
 * One skeleton vocabulary for every async area (docs/DESIGN.md rule 9/12):
 * `card-grid` for studio/design screens, `product-grid` mirrors the shared
 * ProductCard (4:5 image + two lines), `list` for orders/admin tables.
 */
export function SectionSkeletons({
  variant = "card-grid",
  count = 4,
  className,
}: {
  variant?: Variant;
  count?: number;
  className?: string;
}) {
  if (variant === "list") {
    return (
      <div
        className={cn("flex flex-col gap-3", className)}
        role="status"
        aria-label="Loading content"
      >
        {Array.from({ length: count }, (_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-label="Loading content"
      className={cn(
        "grid grid-cols-1 gap-5 sm:grid-cols-2",
        variant === "product-grid" ? "lg:grid-cols-4" : "lg:grid-cols-3",
        className,
      )}
    >
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)]"
        >
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
      ))}
    </div>
  );
}
