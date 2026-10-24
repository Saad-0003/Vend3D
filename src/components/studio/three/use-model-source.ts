export type ModelSource = "checking" | "glb" | "placeholder";

/**
 * Historically this probed /public for a dropped-in GLB; the models are now
 * bundled, hashed static assets (next.config.ts `asset/resource`), so the
 * source is known at build time and the studio always renders the real mesh.
 * A malformed or unloadable file still falls back to the placeholder through
 * the model component's error boundary — never a blank stage.
 */
export function useModelSource(): ModelSource {
  return "glb";
}
