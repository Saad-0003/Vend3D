"use client";

import { DecalDropzone } from "@/components/studio/controls/decal-dropzone";
import { FinishControl } from "@/components/studio/controls/finish-control";
import { HueColorControl } from "@/components/studio/controls/hue-color-control";

/**
 * The three bento demos now delegate to the shared studio controls in
 * `components/studio/controls/` (moved there, not copied) so the landing page and
 * the Studio render one identical hue / finish / dropzone implementation.
 */

/** Precision color: hover-driven hue bar → live swatch + hex/Pantone readout. */
export function ColorDemo() {
  return <HueColorControl />;
}

/** Material physics: hover-driven matte↔glossy bar driving a specular highlight. */
export function MaterialDemo() {
  return <FinishControl />;
}

/** Custom decals: dashed dropzone with a floating file icon. */
export function DecalsDemo() {
  return <DecalDropzone />;
}

