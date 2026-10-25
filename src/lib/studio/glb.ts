/**
 * GLB load state and retry policy, shared by the loader (`product-model`) and
 * the stage overlay. Deliberately free of three.js so it can be unit-tested
 * without a WebGL context and so the studio screen can read it without pulling
 * the renderer into the main bundle.
 *
 * One state per asset URL. The loader writes; the overlay subscribes. Emits are
 * coalesced into a microtask because the first load starts during a React
 * render (Suspense), and notifying a sibling component synchronously there is
 * the "setState while rendering" warning.
 */

export type GlbStatus = "idle" | "loading" | "ready" | "failed";

export type GlbState = {
  status: GlbStatus;
  /** Bytes received so far. */
  loaded: number;
  /** Content-Length when the server sends one; null otherwise. */
  total: number | null;
  /** 1-based attempt number of the current or last try. */
  attempt: number;
  attempts: number;
};

/** Three attempts in total: the first try plus two retries. */
export const GLB_ATTEMPTS = 3;
/** plan.md's model budget: everything (all retries) must resolve within 20s. */
export const GLB_TIMEOUT_MS = 20_000;

const IDLE: GlbState = { status: "idle", loaded: 0, total: null, attempt: 0, attempts: GLB_ATTEMPTS };

const states = new Map<string, GlbState>();
const listeners = new Set<() => void>();
let flushScheduled = false;

function emit() {
  if (flushScheduled) return;
  flushScheduled = true;
  queueMicrotask(() => {
    flushScheduled = false;
    for (const listener of listeners) listener();
  });
}

function write(url: string, patch: Partial<GlbState>) {
  states.set(url, { ...(states.get(url) ?? IDLE), ...patch });
  emit();
}

/** Current state for a URL. The object is stable until the state changes. */
export function readGlbState(url: string | null | undefined): GlbState {
  return (url ? states.get(url) : undefined) ?? IDLE;
}

/** Subscribe to any URL's state changes; returns an unsubscribe function. */
export function subscribeGlbState(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function startGlbLoad(url: string) {
  write(url, { status: "loading", loaded: 0, total: null, attempt: 1, attempts: GLB_ATTEMPTS });
}

export function setGlbAttempt(url: string, attempt: number) {
  write(url, { attempt });
}

export function setGlbProgress(url: string, loaded: number, total: number | null) {
  write(url, { loaded, total });
}

export function markGlbReady(url: string) {
  write(url, { status: "ready", loaded: readGlbState(url).loaded });
}

export function markGlbFailed(url: string) {
  write(url, { status: "failed" });
}

/** Drop the cached entry's state before a manual retry. */
export function invalidateGlb(url: string) {
  states.delete(url);
  emit();
}

/**
 * Percentage for the progress bar, or null when it cannot be known (no
 * Content-Length yet, or a failed load). Clamped, so a misreported total can
 * never draw the bar past its track.
 */
export function glbPercent(state: GlbState): number | null {
  if (state.status === "failed" || !state.total || state.total <= 0) return null;
  return Math.min(100, Math.max(0, Math.round((state.loaded / state.total) * 100)));
}

/** Short backoff between attempts: 250ms, then 750ms. */
export function glbRetryDelayMs(attempt: number): number {
  return Math.min(750, 250 * 3 ** Math.max(0, attempt - 1));
}

export type RetryOptions = {
  attempts?: number;
  timeoutMs?: number;
  /** Injected by tests so the suite never waits on the real backoff. */
  delay?: (attempt: number) => number;
};

/**
 * Runs `attempt` until it resolves, up to `attempts` tries, under one overall
 * deadline. A timeout aborts the in-flight request and is final — a model that
 * cannot arrive inside the budget must not multiply it by the retry count.
 */
export async function loadWithRetry<T>(
  attempt: (signal: AbortSignal) => Promise<T>,
  {
    attempts = GLB_ATTEMPTS,
    timeoutMs = GLB_TIMEOUT_MS,
    delay = glbRetryDelayMs,
  }: RetryOptions = {},
): Promise<T> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort(new DOMException("The 3D model took too long to load.", "TimeoutError"));
  }, timeoutMs);

  let lastError: unknown = new Error("The 3D model could not be loaded.");

  try {
    for (let n = 1; n <= Math.max(1, attempts); n += 1) {
      if (controller.signal.aborted) break;
      try {
        // Race the attempt against the deadline: a task that ignores its signal
        // must still fail within the 20s budget instead of hanging Suspense.
        return await untilAborted(attempt(controller.signal), controller.signal);
      } catch (error) {
        lastError = error;
        if (controller.signal.aborted) break;
        if (n < attempts) await pause(delay(n), controller.signal);
      }
    }
    if (timedOut) throw controller.signal.reason ?? lastError;
    throw lastError;
  } finally {
    clearTimeout(timer);
  }
}

function pause(ms: number, signal: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(signal.reason);
    }
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

/** Settle with `promise`, or reject as soon as `signal` aborts. */
function untilAborted<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) return Promise.reject(signal.reason);
  return new Promise<T>((resolve, reject) => {
    signal.addEventListener("abort", () => reject(signal.reason), { once: true });
    promise.then(resolve, reject);
  });
}
