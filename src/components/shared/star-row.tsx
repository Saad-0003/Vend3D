import { Star } from "lucide-react";

/**
 * Acid Lime star row. `count` filled stars out of 5 — the mockups never show a
 * partial star, so no half-star state is modelled.
 */
export function StarRow({ count = 5, className }: { count?: number; className?: string }) {
  return (
    <span className={`text-signal inline-flex items-center gap-0.5 ${className ?? ""}`}>
      {Array.from({ length: count }).map((_, index) => (
        <Star key={index} aria-hidden className="size-3.5 fill-current" strokeWidth={0} />
      ))}
    </span>
  );
}
