import Image from "next/image";

/**
 * The Vend3D monogram, cropped from the human-supplied brand artwork
 * (`docs/ui-reference/logo.png` → `public/brand/logo-mark.png`). The cube is
 * bitmap artwork, not something to redraw: the facet shading and the black Y
 * are part of the brand, so the file is used as-is and only scaled.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/logo-mark.png"
      alt=""
      aria-hidden
      width={376}
      height={409}
      priority
      className={`h-[22px] w-auto shrink-0 ${className ?? ""}`}
    />
  );
}
