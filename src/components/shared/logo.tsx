import Link from "next/link";
import { LogoMark } from "@/components/shared/logo-mark";

/**
 * Brand lockup: the isometric cube mark, then the lowercase wordmark with the
 * "3d" in Acid Lime (supplied brand artwork).
 */
export function Logo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <Link
      href="/"
      aria-label="Vend3D home"
      className={`flex items-center gap-2.5 ${className ?? ""}`}
    >
      <LogoMark className={markClassName} />{" "}
      <span className="text-[19px] leading-none font-semibold tracking-[-0.03em] lowercase select-none">
        <span className="text-foreground">vend</span>
        <span className="text-signal">3d</span>
      </span>
    </Link>
  );
}
