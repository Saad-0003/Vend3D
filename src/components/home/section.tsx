import { cn } from "@/lib/utils";

/**
 * Shared vertical rhythm wrapper for redesigned home sections.
 * `band` toggles the surface-1 treatment so the page alternates
 * ink → surface-1 → ink. Section end transitions are handled by the dedicated
 * `ToTestimonialsFade` component, not baked in here.
 */
export function Section({
  id,
  band = false,
  className,
  children,
}: {
  id?: string;
  band?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative w-full",
        band && "bg-[var(--surface-1)]",
        // Vertical padding: 160px desktop / 80px mobile, per SECTION RHYTHM.
        "py-20 sm:py-28 lg:py-36",
        className,
      )}
    >
      <div className="relative mx-auto w-full max-w-[1280px] px-4 sm:px-6">{children}</div>
    </section>
  );
}

