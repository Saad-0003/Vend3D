import type { Metadata } from "next";

import Image from "next/image";
import Link from "next/link";

import { ReviewsWall } from "@/components/reviews/reviews-wall";
import { ReviewsScrollReset } from "@/components/reviews/reviews-scroll-reset";
import { StarRow } from "@/components/shared/star-row";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page-shell";

import styles from "@/components/reviews/reviews-wall.module.css";

export const metadata: Metadata = {
  title: "Creator reviews",
  description: "Sample review copy for the Vend3D 3D product customization demo.",
};

function ReviewActions() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        asChild
        variant="ghost"
        className="border-foreground/10 hover:bg-foreground/[0.06] h-11 rounded-full border px-6"
      >
        <Link href="/shop">Back to shop</Link>
      </Button>
      <Button
        asChild
        className="bg-signal text-on-signal hover:bg-signal/90 h-11 rounded-full px-6"
      >
        <Link href="/studio">Launch Your Canvas</Link>
      </Button>
    </div>
  );
}

export default function ReviewsPage() {
  return (
    <div className={styles.page}>
      <ReviewsScrollReset />
      <div className={styles.backdrop} aria-hidden="true">
        <Image
          src="/images/studio-scene.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className={styles.backdropImage}
        />
        <div className={styles.backdropShade} />
      </div>

      <PageShell
        aria-label="Reviews"
        className={`lux relative z-10 !max-w-[1400px] px-4 py-8 sm:px-6 sm:py-10 lg:py-12`}
      >
        <section
          aria-labelledby="reviews-title"
          className={`${styles.panel} ring-foreground/10 flex flex-col gap-8 overflow-hidden rounded-[28px] p-6 ring-1 sm:gap-10 sm:p-10 lg:p-12`}
        >
          <header className="flex flex-col items-start gap-5">
            <span className="text-signal inline-flex items-center gap-2 text-[11px] tracking-[0.14em] uppercase">
              <StarRow />
              <span className="font-mono">5.0 (28)</span>
            </span>
            <h1 id="reviews-title" className="lux-display lux-h2 max-w-4xl text-[var(--ivory)]">
              Creators launch drops without waiting.
            </h1>
            <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed sm:text-base">
              Sample review copy for the demo; the rating and count are illustrative, not verified.
            </p>
            <ReviewActions />
          </header>

          <ReviewsWall />
        </section>

        <div className="border-foreground/10 flex flex-col gap-5 border-t pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground max-w-xl text-sm">
            Explore a blank product, then shape it in the 3D studio.
          </p>
          <ReviewActions />
        </div>
      </PageShell>
    </div>
  );
}
