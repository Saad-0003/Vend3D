import { describe, expect, it, vi } from "vitest";

import {
  GLB_ATTEMPTS,
  glbPercent,
  glbRetryDelayMs,
  invalidateGlb,
  loadWithRetry,
  markGlbFailed,
  markGlbReady,
  readGlbState,
  setGlbAttempt,
  setGlbProgress,
  startGlbLoad,
  subscribeGlbState,
} from "@/lib/studio/glb";

/**
 * The stage's load contract: one state per asset, a determinate percentage, and
 * a retry policy that is bounded in both attempts and total time. These are the
 * pieces the overlay and the Suspense boundary act on, so they are pinned here
 * rather than through a WebGL canvas.
 */

describe("GLB load state", () => {
  it("walks idle → loading → ready and reports byte progress", () => {
    const url = "/models/state.glb";
    expect(readGlbState(url).status).toBe("idle");

    startGlbLoad(url);
    expect(readGlbState(url).status).toBe("loading");
    expect(readGlbState(url).attempt).toBe(1);

    setGlbProgress(url, 120, 240);
    expect(glbPercent(readGlbState(url))).toBe(50);

    setGlbAttempt(url, 2);
    expect(readGlbState(url).attempt).toBe(2);

    setGlbProgress(url, 240, 240);
    markGlbReady(url);
    expect(readGlbState(url).status).toBe("ready");
    expect(glbPercent(readGlbState(url))).toBe(100);
  });

  it("drops back to idle after a manual retry invalidation", () => {
    const url = "/models/retry.glb";
    startGlbLoad(url);
    markGlbFailed(url);
    expect(readGlbState(url).status).toBe("failed");

    invalidateGlb(url);
    expect(readGlbState(url).status).toBe("idle");
    expect(readGlbState(url).loaded).toBe(0);
  });

  it("has no percentage without a total, and none on failure", () => {
    const url = "/models/unknown-total.glb";
    startGlbLoad(url);
    expect(glbPercent(readGlbState(url))).toBeNull();

    setGlbProgress(url, 50, 100);
    markGlbFailed(url);
    expect(glbPercent(readGlbState(url))).toBeNull();
  });

  it("clamps a misreported total so the bar cannot pass its track", () => {
    const url = "/models/overrun.glb";
    startGlbLoad(url);
    setGlbProgress(url, 500, 100);
    expect(glbPercent(readGlbState(url))).toBe(100);
  });

  it("notifies subscribers once per update turn", async () => {
    const url = "/models/subscribe.glb";
    const listener = vi.fn();
    const unsubscribe = subscribeGlbState(listener);

    startGlbLoad(url);
    setGlbProgress(url, 1, 2);
    await Promise.resolve();

    // Two writes, one coalesced notification.
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    startGlbLoad(url);
    await Promise.resolve();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe("loadWithRetry", () => {
  it("succeeds on a later attempt", async () => {
    let calls = 0;
    const result = await loadWithRetry(
      async () => {
        calls += 1;
        if (calls < 2) throw new Error("transient");
        return "mesh";
      },
      { delay: () => 0 },
    );

    expect(result).toBe("mesh");
    expect(calls).toBe(2);
  });

  it("gives up after three attempts and rethrows the last error", async () => {
    const error = new Error("offline");
    const attempt = vi.fn(async () => {
      throw error;
    });

    await expect(loadWithRetry(attempt, { delay: () => 0 })).rejects.toBe(error);
    expect(attempt).toHaveBeenCalledTimes(GLB_ATTEMPTS);
  });

  it("does not retry once the deadline has aborted the load", async () => {
    const attempt = vi.fn(() => new Promise<never>(() => {}));

    await expect(loadWithRetry(attempt, { timeoutMs: 20, delay: () => 0 })).rejects.toMatchObject({
      name: "TimeoutError",
    });
    expect(attempt).toHaveBeenCalledTimes(1);
  });

  it("backs off 250ms then 750ms", () => {
    expect(glbRetryDelayMs(1)).toBe(250);
    expect(glbRetryDelayMs(2)).toBe(750);
    expect(glbRetryDelayMs(3)).toBe(750);
  });
});
