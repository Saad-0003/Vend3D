import type { CameraPresetKey } from "@/lib/products/config";

/** Labels for the preset camera chips. Shared by the stage so the chip set can't drift. */
export const CAMERA_PRESET_LABELS: Record<CameraPresetKey, string> = {
  front: "Front",
  back: "Back",
  side: "Side",
  detail: "Detail",
};
