"use client";

import {
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type CSSProperties } from "react";

import styles from "./process.module.css";

export const SECTION_SCROLL_VH = 280;

const LazyArtboard = dynamic(() => import("./process-artboard").then((module) => module.Artboard), {
  ssr: false,
  loading: () => <div className={styles.artboard} aria-hidden="true" />,
});

const steps = [
  {
    number: "01",
    title: "Pick",
    body: "Select from ethically milled heavy blanks, custom dyed caps, and precision ceramics.",
  },
  {
    number: "02",
    title: "Shape",
    body: "Adjust materials, calibrate pigments, and apply custom vector artwork in live photoreal 3D.",
  },
  {
    number: "03",
    title: "Own",
    body: "Precision laser-etched or screenprinted, quality-checked, and dispatched in 48 hours.",
  },
] as const;

const springSettings = { stiffness: 120, damping: 20 };

function useSceneProgress() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const rawProgress = useMotionValue(0);
  const springProgress = useSpring(rawProgress, springSettings);
  const reducedProgress = useTransform(rawProgress, () => 1);
  const reducedMotion = useReducedMotion();
  const progress = reducedMotion ? reducedProgress : springProgress;
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      rawProgress.set(1);
    } else if (desktop) {
      rawProgress.set(scrollYProgress.get());
    } else {
      rawProgress.set(0);
    }
  }, [desktop, rawProgress, reducedMotion, scrollYProgress]);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (
      desktop &&
      !reducedMotion &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      rawProgress.set(latest);
    }
  });

  return {
    sectionRef,
    progress,
    reducedMotion: Boolean(reducedMotion),
    desktop,
  };
}

function PickIllustration({ progress }: { progress: ReturnType<typeof useSpring> }) {
  const cursorX = useSpring(
    useTransform(progress, [0.12, 0.2, 0.3], [-58, -58, -58]),
    springSettings,
  );
  const cursorY = useSpring(useTransform(progress, [0.12, 0.2, 0.3], [0, -2, -2]), springSettings);

  return (
    <svg className={styles.pickIllustration} viewBox="0 0 140 44" aria-hidden="true">
      <circle cx="19" cy="22" r="12" fill="none" stroke="var(--hairline-strong)" />
      <circle cx="54" cy="22" r="12" fill="var(--lime)" fillOpacity=".14" stroke="var(--lime)" />
      <circle cx="89" cy="22" r="12" fill="none" stroke="var(--hairline-strong)" />
      <motion.path
        d="M111 9 111 30 117 25 122 32 126 29 121 22 129 21Z"
        fill="var(--lime)"
        style={{ x: cursorX, y: cursorY }}
      />
    </svg>
  );
}

function ShapeIllustration({ progress }: { progress: ReturnType<typeof useSpring> }) {
  const firstThumb = useTransform(progress, [0.37, 0.52, 0.68], [18, 94, 94]);
  const secondThumb = useTransform(progress, [0.37, 0.58, 0.68], [82, 45, 45]);

  return (
    <svg className={styles.shapeIllustration} viewBox="0 0 140 44" aria-hidden="true">
      {[12, 30].map((y, index) => (
        <g key={y}>
          <path
            d={`M12 ${y} H128`}
            stroke="var(--hairline-strong)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <motion.circle
            cx={index === 0 ? firstThumb : secondThumb}
            cy={y}
            r="5"
            fill="var(--ink)"
            stroke="var(--lime)"
            strokeWidth="2"
          />
        </g>
      ))}
    </svg>
  );
}

function OwnIllustration({
  progress,
  staticState,
}: {
  progress: ReturnType<typeof useSpring>;
  staticState: boolean;
}) {
  const ring = useTransform(progress, [0.68, 0.88, 0.94], [0, 0.9, 1]);
  const check = useTransform(progress, [0.78, 0.9, 0.96], [0, 0.9, 1]);

  return (
    <svg className={styles.ownIllustration} viewBox="0 0 44 44" aria-hidden="true">
      <motion.path
        d="M22 4 C31.8 4 39.5 11.6 39.5 21.5 C39.5 31.3 31.7 39.5 21.8 39.5 C12 39.5 4.5 31.7 4.5 21.8 C4.5 12 12.1 4.2 22 4Z"
        fill="none"
        stroke="var(--lime)"
        strokeWidth="2"
        strokeLinecap="round"
        style={{ pathLength: staticState ? 1 : ring }}
      />
      <motion.path
        d="m14 22 5 5 11-12"
        fill="none"
        stroke="var(--ivory)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ pathLength: staticState ? 1 : check }}
      />
    </svg>
  );
}

function LeaderLines({ progress }: { progress: ReturnType<typeof useSpring> }) {
  const pick = useTransform(progress, [0.12, 0.2, 0.35, 0.37], [0, 1, 1, 0.5]);
  const shape = useTransform(progress, [0.37, 0.46, 0.66, 0.7], [0, 1, 1, 0.5]);
  const own = useTransform(progress, [0.68, 0.78, 0.95, 1], [0, 1, 1, 1]);

  return (
    <svg
      className={styles.leaders}
      viewBox="0 0 1000 1000"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <motion.path
        d="M225 222 C300 222 356 286 444 395"
        fill="none"
        stroke="var(--lime)"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ pathLength: pick }}
      />
      <motion.circle cx="444" cy="395" r="4" fill="var(--lime)" style={{ opacity: pick }} />
      <motion.path
        d="M775 470 C706 470 650 500 558 520"
        fill="none"
        stroke="var(--lime)"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ pathLength: shape }}
      />
      <motion.circle cx="558" cy="520" r="4" fill="var(--lime)" style={{ opacity: shape }} />
      <motion.path
        d="M225 776 C330 776 424 720 564 676"
        fill="none"
        stroke="var(--lime)"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ pathLength: own }}
      />
      <motion.circle cx="564" cy="676" r="4" fill="var(--lime)" style={{ opacity: own }} />
    </svg>
  );
}

function StepCard({
  index,
  progress,
  desktop,
  reducedMotion,
}: {
  index: number;
  progress: ReturnType<typeof useSpring>;
  desktop: boolean;
  reducedMotion: boolean;
}) {
  const start = [0.1, 0.37, 0.68][index] ?? 0.1;
  const end = [0.37, 0.68, 0.95][index] ?? 0.37;
  const opacity = useTransform(
    progress,
    [0, start, start + 0.06, end - 0.04, end, 1],
    index === 0
      ? [0, 0, 1, 1, 0.5, 0.5]
      : index === 1
        ? [0, 0, 1, 1, 0.5, 0.5]
        : [0, 0, 1, 1, 1, 1],
  );
  const y = useTransform(progress, [start, start + 0.06], [32, 0]);
  const scale = useTransform(progress, [start, start + 0.06], [0.96, 1]);
  const blur = useTransform(progress, [start, start + 0.06], [8, 0]);
  const filter = useTransform(blur, (value) => `blur(${value}px)`);
  const borderColor = useTransform(
    progress,
    [start, start + 0.06, end, end + 0.04],
    ["rgba(198,241,53,0)", "rgba(198,241,53,.2)", "rgba(198,241,53,.2)", "rgba(255,255,255,.08)"],
  );
  const mini =
    index === 0 ? (
      <PickIllustration progress={progress} />
    ) : index === 1 ? (
      <ShapeIllustration progress={progress} />
    ) : (
      <OwnIllustration progress={progress} staticState={!desktop || reducedMotion} />
    );

  return (
    <motion.li
      className={`${styles.callout} ${styles[`callout${index + 1}`]}`}
      style={{
        opacity: reducedMotion || !desktop ? 1 : opacity,
        y: reducedMotion || !desktop ? 0 : y,
        scale: reducedMotion || !desktop ? 1 : scale,
        filter: reducedMotion || !desktop ? "blur(0px)" : filter,
        borderColor: reducedMotion || !desktop ? undefined : borderColor,
      }}
    >
      <div className={styles.calloutHeader}>
        <span className={styles.number}>{steps[index]?.number}</span>
        <h3 className="lux-display">{steps[index]?.title}</h3>
      </div>
      <div className={styles.illustrationWell}>{mini}</div>
      <p>{steps[index]?.body}</p>
    </motion.li>
  );
}

export function Process() {
  const { sectionRef, progress, reducedMotion, desktop } = useSceneProgress();
  const [nearbyMargin, setNearbyMargin] = useState<`${number}${"px" | "%"} 0px`>("150% 0px");
  useEffect(() => {
    const updateMargin = () => setNearbyMargin(`${Math.round(window.innerHeight * 1.5)}px 0px`);
    updateMargin();
    window.addEventListener("resize", updateMargin);
    return () => window.removeEventListener("resize", updateMargin);
  }, []);
  const nearby = useInView(sectionRef, { margin: nearbyMargin });
  const sectionStyle = { "--SECTION_SCROLL_VH": SECTION_SCROLL_VH } as CSSProperties;

  return (
    <section ref={sectionRef} className={styles.section} style={sectionStyle}>
      <div className={styles.stage}>
        <div className={styles.inner}>
          <header className={styles.heading}>
            <span className="lux-eyebrow">Three simple steps</span>
            <h2 className="lux-h2 lux-display">From 3D viewport to your studio.</h2>
          </header>

          <div className={styles.canvasStage}>
            <div className={styles.canvasRegion}>
              {desktop && (nearby || reducedMotion) ? (
                <LazyArtboard progress={progress} />
              ) : (
                <div className={styles.artboard} aria-hidden="true" />
              )}
            </div>
            {desktop && !reducedMotion && nearby && <LeaderLines progress={progress} />}
            <ol className={styles.steps}>
              {steps.map((step, index) => (
                <StepCard
                  key={step.number}
                  index={index}
                  progress={progress}
                  desktop={desktop}
                  reducedMotion={reducedMotion}
                />
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
