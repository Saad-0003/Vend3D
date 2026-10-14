"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogoMark } from "@/components/shared/logo-mark";

/**
 * The 404 stage: an oversized serif "404", the brand cube drifting beside it, a
 * search field that goes straight to the archive, and exactly two ways out.
 *
 * A cube rather than an illustration: it is the brand mark
 * (`public/brand/logo-mark.png`), so this state costs no second asset. The
 * drift is the only motion on the page and it stops under reduced motion.
 */
export function NotFoundScene() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [term, setTerm] = useState("");

  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-[1200px] flex-col justify-center gap-8 px-6 py-20 md:px-8">
      <div className="flex flex-wrap items-center gap-x-10 gap-y-6">
        <span className="relative flex shrink-0 items-center justify-center">
          <motion.span
            aria-hidden
            className="block"
            animate={reduced ? undefined : { y: [-10, 10, -10], rotate: [-2.5, 2.5, -2.5] }}
            transition={
              reduced
                ? undefined
                : { duration: 7, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY }
            }
          >
            <LogoMark className="h-16 w-auto opacity-80 md:h-24" />
          </motion.span>
        </span>

        <h1 className="font-[var(--font-instrument)] text-[clamp(5.5rem,18vw,12rem)] leading-[0.85] text-[var(--ivory)]">
          404
        </h1>
      </div>

      <p className="max-w-md text-[17px] leading-[1.6] text-[var(--muted)]">
        This blank doesn&rsquo;t exist yet.
      </p>

      <form
        className="flex w-full max-w-sm items-center gap-2"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          const q = term.trim();
          router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
        }}
      >
        <label htmlFor="not-found-search" className="sr-only">
          Search the shop
        </label>
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[var(--muted)]"
            strokeWidth={1.5}
            aria-hidden
          />
          <Input
            id="not-found-search"
            name="q"
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search blanks"
            className="h-11 rounded-full border-[var(--hairline)] bg-[var(--surface-2)] pr-4 pl-11 text-[var(--ivory)]"
          />
        </div>
        <Button
          type="submit"
          className="h-11 shrink-0 rounded-full bg-[var(--lime)] px-5 text-[var(--ink)] hover:bg-[var(--lime)]/90"
        >
          Search
          <ArrowRight className="size-4" strokeWidth={1.5} aria-hidden />
        </Button>
      </form>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          asChild
          className="h-12 rounded-full bg-[var(--lime)] px-7 text-[15px] font-medium text-[var(--ink)] hover:bg-[var(--lime)]/90"
        >
          <Link href="/">Back home</Link>
        </Button>
        <Button
          asChild
          variant="ghost"
          className="h-12 rounded-full px-7 text-[15px] text-[var(--ivory)] ring-1 ring-[var(--hairline-strong)] hover:bg-[var(--surface-2)]"
        >
          <Link href="/shop">Browse the shop</Link>
        </Button>
      </div>
    </section>
  );
}
