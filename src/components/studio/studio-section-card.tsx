"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

import { sectionAnchor, type SectionId } from "@/components/studio/section-types";
import { cn } from "@/lib/utils";

/** The landing-page card: large radius, hairline border, inner highlight, blur-fade reveal. */
export function SectionCard({
  id,
  icon,
  title,
  description,
  reduced,
  className,
  children,
}: {
  id: SectionId;
  icon: ReactNode;
  title: string;
  description: string;
  reduced: boolean;
  className?: string;
  children: ReactNode;
}) {
  const anchor = sectionAnchor(id);
  return (
    <motion.section
      id={anchor}
      data-section={id}
      aria-labelledby={`${anchor}-title`}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14, filter: "blur(8px)" }}
      whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-5% 0px -5% 0px" }}
      transition={{ duration: reduced ? 0.3 : 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "flex flex-col gap-5 rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] p-6 [box-shadow:var(--inner-highlight)]",
        className,
      )}
    >
      <header className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0 text-[var(--lime)]">{icon}</span>
        <div className="flex min-w-0 flex-col gap-1">
          <h3 id={`${anchor}-title`} className="lux-display text-[20px] text-[var(--ivory)]">
            {title}
          </h3>
          <p className="text-[14px] leading-[1.6] text-[var(--muted)]">{description}</p>
        </div>
      </header>
      {children}
    </motion.section>
  );
}
