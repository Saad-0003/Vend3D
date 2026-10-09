/**
 * Soft transition from the last redesigned section into the Testimonials block.
 * The Benefits strip is a surface-1 band; this fades it back down to ink so the
 * seam into the testimonial cards (which sit on ink) is invisible.
 */
export function ToTestimonialsFade() {
  return (
    <div
      aria-hidden
      className="pointer-events-none relative h-24 bg-gradient-to-b from-[var(--surface-1)] to-[var(--ink)]"
    />
  );
}
