import { loginUrlWithNext } from "@/lib/auth/next";
import type { AuthUser } from "@/lib/auth/schemas";

/**
 * Guard decisions shared by `RequireAuth` and `RequireAdmin` (plan.md
 * Phase 1B U3).
 *
 * Pure and dependency-free on purpose: the redirect rules live in one function
 * so the two guards cannot drift, and the whole decision table is unit-testable
 * without rendering anything. The guards stay thin — they map a decision to
 * either children, a skeleton or a `window.location.replace`, exactly as
 * `RequireAuth` did before this module extracted the policy.
 */

export type GuardInput = {
  /** False until the persisted session has been read (never bounce early). */
  hydrated: boolean;
  user: AuthUser | null;
  /** True when a session existed but its expiry has passed. */
  expired: boolean;
};

export type GuardScope = "session" | "admin";

/**
 * What a guard should do for the current state.
 *
 * - `wait`   — the session read has not happened yet; render a skeleton, never redirect.
 * - `pass`   — let the children through.
 * - `expired`— a session existed and ran out; show the recovery dialog instead of
 *              a redirect, so the shopper can sign back in and *return*.
 * - `login`  — signed out entirely; bounce to `/login?next=` and return after.
 * - `forbidden`— signed in but the role is wrong; bounce to `/forbidden`. The
 *              client-side check is a prompt, not a control: plan.md Phase 3's
 *              server-side admin gate is the boundary that matters.
 */
export type GuardDecision = "wait" | "pass" | "expired" | "login" | "forbidden";

export function decideGuard(input: GuardInput, scope: GuardScope): GuardDecision {
  if (!input.hydrated) return "wait";
  if (input.user) {
    if (scope === "admin" && input.user.role !== "admin") return "forbidden";
    return "pass";
  }
  if (input.expired) return "expired";
  return "login";
}

/** The URL a `login` decision sends the shopper to, with the return target encoded. */
export function loginRedirectUrl(target: string | null | undefined): string {
  return loginUrlWithNext(target);
}
