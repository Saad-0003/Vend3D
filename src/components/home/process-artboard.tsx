"use client";

import { motion, useMotionValueEvent, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";

import styles from "./process.module.css";

const gridPanes = [0, 1, 2, 3];
const springSettings = { stiffness: 120, damping: 20 };
const handlePoints: [number, number][] = [
  [168, 168],
  [260, 168],
  [352, 168],
  [168, 260],
  [352, 260],
  [168, 352],
  [260, 352],
  [352, 352],
];

function GridPane({ index, progress }: { index: number; progress: ReturnType<typeof useSpring> }) {
  const start = 0.008 + index * 0.025;
  const opacity = useTransform(progress, [start, start + 0.045], [0, 1]);
  const x = (index % 2) * 260;
  const y = Math.floor(index / 2) * 260;
  return (
    <motion.rect
      x={x}
      y={y}
      width="260"
      height="260"
      fill="url(#artboard-dot-grid)"
      clipPath={`url(#artboard-grid-pane-${index})`}
      style={{ opacity }}
    />
  );
}

function CropMark({
  path,
  directionX,
  directionY,
  progress,
}: {
  path: string;
  directionX: -1 | 1;
  directionY: -1 | 1;
  progress: ReturnType<typeof useSpring>;
}) {
  const pathLength = useTransform(progress, [0, 0.1], [0, 1]);
  const offset = useTransform(progress, [0, 0.1, 0.68, 0.95], [24, 0, 0, -12]);
  const x = useTransform(offset, (value) => value * directionX);
  const y = useTransform(offset, (value) => value * directionY);
  return (
    <motion.path
      className={styles.cropMark}
      d={path}
      fill="none"
      stroke="var(--lime)"
      strokeWidth="1.5"
      strokeLinecap="round"
      style={{ pathLength, x, y }}
    />
  );
}

function BrushSpeck({
  cx,
  cy,
  delay,
  progress,
}: {
  cx: number;
  cy: number;
  delay: number;
  progress: ReturnType<typeof useSpring>;
}) {
  const opacity = useTransform(progress, [delay, delay + 0.035, 0.61], [0, 0.9, 0.15]);
  const scale = useTransform(progress, [delay, delay + 0.035], [0.4, 1]);
  return (
    <motion.circle
      cx={cx}
      cy={cy}
      r="2"
      fill="var(--lime)"
      style={{ opacity, scale, originX: `${cx}px`, originY: `${cy}px` }}
    />
  );
}

export function Artboard({ progress }: { progress: ReturnType<typeof useSpring> }) {
  const frame = useTransform(progress, [0, 0.1], [0, 1]);
  const rulers = useTransform(progress, [0.02, 0.1], [0, 1]);
  const circleOpacity = useTransform(progress, [0.1, 0.16, 0.34, 0.4], [0, 1, 1, 0]);
  const boxOpacity = useTransform(progress, [0.34, 0.4], [0, 1]);
  const boxRadius = useTransform(progress, [0.37, 0.55], [92, 58]);
  const boxScale = useTransform(progress, [0.37, 0.53, 0.68], [1, 1.08, 1.08]);
  const selectionOpacity = useTransform(progress, [0.18, 0.24, 0.66, 0.72], [0, 1, 1, 0]);
  const paint = useTransform(progress, [0.37, 0.47, 0.68], [0, 1, 1]);
  const brushOpacity = useTransform(progress, [0.37, 0.43, 0.66], [0, 1, 1]);
  const stampProgress = useTransform(progress, [0.68, 0.84, 0.94], [0, 0.95, 1]);
  const stampScale = useTransform(progress, [0.68, 0.79, 0.84], [0.62, 1.08, 1]);
  const exportOpacity = useTransform(progress, [0.8, 0.86, 0.95], [0, 1, 1]);
  const exportY = useTransform(progress, [0.8, 0.86], [8, 0]);
  const cursorXTarget = useTransform(
    progress,
    [0, 0.12, 0.2, 0.34, 0.42, 0.46, 0.68, 0.8, 1],
    [142, 142, 198, 198, 352, 350, 350, 350, 350],
  );
  const cursorYTarget = useTransform(
    progress,
    [0, 0.12, 0.2, 0.34, 0.42, 0.54, 0.68, 0.8, 1],
    [274, 274, 194, 194, 168, 352, 352, 350, 350],
  );
  const cursorX = useSpring(cursorXTarget, springSettings);
  const cursorY = useSpring(cursorYTarget, springSettings);
  const cursorOpacity = useTransform(progress, [0.1, 0.16, 0.63, 0.68], [0, 1, 1, 0]);
  const clickOne = useTransform(progress, [0.19, 0.23, 0.3], [0, 1, 0]);
  const clickTwo = useTransform(progress, [0.43, 0.48, 0.54], [0, 1, 0]);
  const clickThree = useTransform(progress, [0.65, 0.7, 0.77], [0, 1, 0]);
  const paintHighlight = useTransform(progress, [0.43, 0.5, 0.68], [0, 0.18, 0.12]);
  const coordinateRef = useRef<SVGTextElement>(null);
  const coordinateValue = useRef({ x: 142, y: 274 });

  useMotionValueEvent(cursorX, "change", (x) => {
    coordinateValue.current.x = x;
    if (coordinateRef.current) {
      coordinateRef.current.textContent = `X ${Math.round(x)} Y ${Math.round(coordinateValue.current.y)}`;
    }
  });
  useMotionValueEvent(cursorY, "change", (y) => {
    coordinateValue.current.y = y;
    if (coordinateRef.current) {
      coordinateRef.current.textContent = `X ${Math.round(coordinateValue.current.x)} Y ${Math.round(y)}`;
    }
  });

  return (
    <div className={styles.artboard} aria-hidden="true">
      <svg className={styles.artboardSvg} viewBox="0 0 520 520">
        <defs>
          <pattern id="artboard-dot-grid" width="8" height="8" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r=".55" fill="var(--ivory)" fillOpacity=".06" />
          </pattern>
          {gridPanes.map((index) => (
            <clipPath id={`artboard-grid-pane-${index}`} key={index}>
              <rect
                x={(index % 2) * 260}
                y={Math.floor(index / 2) * 260}
                width="260"
                height="260"
              />
            </clipPath>
          ))}
        </defs>
        {gridPanes.map((index) => (
          <GridPane key={index} index={index} progress={progress} />
        ))}

        <motion.g className={styles.rulers} style={{ opacity: rulers }}>
          <path
            d="M82 52 H438 M52 82 V438"
            fill="none"
            stroke="var(--hairline-strong)"
            strokeWidth="1"
          />
          {[0, 1, 2, 3, 4].map((tick) => (
            <g key={tick}>
              <path
                d={`M${82 + tick * 89} 48 V57 M48 ${82 + tick * 89} H57`}
                stroke="var(--faint)"
                strokeWidth="1"
              />
              <text x={82 + tick * 89} y="42" textAnchor="middle">
                {tick * 128}
              </text>
              <text x="40" y={85 + tick * 89} textAnchor="end">
                {tick * 128}
              </text>
            </g>
          ))}
        </motion.g>

        <motion.path
          d="M28 1 H492 Q519 1 519 28 V492 Q519 519 492 519 H28 Q1 519 1 492 V28 Q1 1 28 1Z"
          fill="none"
          stroke="var(--hairline-strong)"
          strokeWidth="1"
          style={{ pathLength: frame }}
        />
        <CropMark path="M32 56 V32 H56" directionX={-1} directionY={-1} progress={progress} />
        <CropMark path="M488 56 V32 H464" directionX={1} directionY={-1} progress={progress} />
        <CropMark path="M32 464 V488 H56" directionX={-1} directionY={1} progress={progress} />
        <CropMark path="M488 464 V488 H464" directionX={1} directionY={1} progress={progress} />

        <motion.circle
          cx="260"
          cy="260"
          r="90"
          fill="none"
          stroke="var(--ivory)"
          strokeOpacity=".4"
          strokeWidth="1.5"
          style={{ opacity: circleOpacity }}
        />
        <motion.rect
          x="168"
          y="168"
          width="184"
          height="184"
          rx={boxRadius}
          fill="none"
          stroke="var(--ivory)"
          strokeOpacity=".4"
          strokeWidth="1.5"
          style={{ opacity: boxOpacity, scale: boxScale, originX: "260px", originY: "260px" }}
        />
        <motion.path
          d="M182 239 C202 222 211 231 228 221 C246 210 257 224 275 217 C293 209 309 224 338 218 L338 294 C316 300 302 288 282 300 C259 312 245 293 226 305 C207 316 195 298 182 304Z"
          fill="var(--lime)"
          fillOpacity=".85"
          style={{
            scaleX: paint,
            opacity: brushOpacity,
            transformBox: "fill-box",
            transformOrigin: "left center",
          }}
        />
        <motion.path
          d="M188 241 C212 225 220 234 238 224 C256 215 272 230 292 220 C310 212 320 223 337 220 M190 247 C207 237 216 241 231 235 M194 300 C213 291 220 297 234 290"
          fill="none"
          stroke="var(--ivory)"
          strokeOpacity=".35"
          strokeWidth="1"
          strokeLinecap="round"
          style={{
            scaleX: paint,
            opacity: paintHighlight,
            transformBox: "fill-box",
            transformOrigin: "left center",
          }}
        />
        <BrushSpeck cx={194} cy={220} delay={0.39} progress={progress} />
        <BrushSpeck cx={208} cy={310} delay={0.42} progress={progress} />
        <BrushSpeck cx={328} cy={232} delay={0.45} progress={progress} />
        <BrushSpeck cx={318} cy={304} delay={0.48} progress={progress} />
        <BrushSpeck cx={236} cy={214} delay={0.51} progress={progress} />
        <motion.rect
          x="168"
          y="168"
          width="184"
          height="184"
          fill="none"
          stroke="var(--lime)"
          strokeOpacity=".72"
          strokeWidth="1"
          strokeDasharray="4 5"
          style={{ opacity: selectionOpacity }}
        />
        {handlePoints.map(([x, y]) => (
          <motion.rect
            key={`${x}-${y}`}
            x={x - 4}
            y={y - 4}
            width="8"
            height="8"
            rx="1"
            fill="var(--lime)"
            stroke="var(--ink)"
            strokeWidth="1"
            style={{ opacity: selectionOpacity }}
          />
        ))}

        <motion.circle
          cx="198"
          cy="194"
          r="13"
          fill="none"
          stroke="var(--lime)"
          strokeWidth="1.5"
          style={{ scale: clickOne, originX: "198px", originY: "194px" }}
        />
        <motion.circle
          cx="352"
          cy="168"
          r="13"
          fill="none"
          stroke="var(--lime)"
          strokeWidth="1.5"
          style={{ scale: clickTwo, originX: "352px", originY: "168px" }}
        />
        <motion.circle
          cx="352"
          cy="352"
          r="13"
          fill="none"
          stroke="var(--lime)"
          strokeWidth="1.5"
          style={{ scale: clickThree, originX: "352px", originY: "352px" }}
        />

        <motion.g style={{ x: cursorX, y: cursorY, opacity: cursorOpacity }}>
          <path
            d="M0 0 V22 L6 16 L12 25 L16 22 L10 13 L20 12Z"
            fill="var(--lime)"
            stroke="var(--ink)"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </motion.g>
        <motion.g
          style={{ scale: stampScale, originX: "372px", originY: "368px", opacity: stampProgress }}
        >
          <motion.path
            d="M372 337 C389 337 400 349 399 366 C398 383 386 396 370 396 C353 396 342 384 343 367 C344 350 356 338 372 337Z"
            fill="none"
            stroke="var(--lime)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="3 2"
            style={{ pathLength: stampProgress }}
          />
          <motion.path
            d="m358 366 9 9 18-21"
            fill="none"
            stroke="var(--lime)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ pathLength: stampProgress }}
          />
        </motion.g>
        <motion.text
          x="372"
          y="417"
          textAnchor="middle"
          className={styles.exportLabel}
          style={{ opacity: exportOpacity, y: exportY }}
        >
          EXPORT
        </motion.text>
        <text ref={coordinateRef} x="452" y="493" textAnchor="end" className={styles.coordinate}>
          X 142 Y 274
        </text>
      </svg>
    </div>
  );
}
