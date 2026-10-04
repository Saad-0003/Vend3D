/**
 * Runs once when the server boots (dev and production runtime, not during
 * `next build`). Throwing here surfaces a clear message instead of letting
 * the app fail later with a confusing 500 (plan.md §2.2).
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getEnv } = await import("./env");
    getEnv();
  }
}
