/**
 * `?next=` sanitisation. A login redirect target is attacker-controllable, and
 * an open redirect turns a phishing link (`/login?next=https://evil.example`)
 * into a trusted-looking hop, so the rule is strict: same-origin, single-slash
 * relative paths only.
 *
 * Pure and dependency-free on purpose — Phase 3's middleware needs the exact
 * same rule server-side, and two independent implementations of a redirect
 * guard is exactly how one of them ends up wrong.
 */

/** Where a shopper lands when `?next=` is missing, malformed or off-origin. */
export const DEFAULT_AUTH_NEXT = "/account";

/**
 * Returns a safe redirect target, or the default when `next` is not a
 * same-origin absolute path.
 *
 * Rejected: absolute URLs (`//evil.example`, `https://evil.example`), scheme
 * tricks (`javascript:`, `/\evil.example` which some browsers read as `//`),
 * and anything that is not a path at all.
 */
export function sanitizeNext(next: string | null | undefined): string {
  if (typeof next !== "string") return DEFAULT_AUTH_NEXT;

  const value = next.trim();
  if (value === "") return DEFAULT_AUTH_NEXT;

  // Must start with exactly one leading slash: `//host` is protocol-relative.
  if (!value.startsWith("/") || value.startsWith("//")) return DEFAULT_AUTH_NEXT;

  // Backslash is normalised to `/` by several browsers, so `/\evil.example`
  // would become `//evil.example` after parsing. Block it before that happens.
  if (value.includes("\\")) return DEFAULT_AUTH_NEXT;

  // Any control character means someone is probing; refuse the whole value.
  if (/[\u0000-\u001f\u007f]/.test(value)) return DEFAULT_AUTH_NEXT;

  return value;
}

/** Builds `/login?next=…` with the target encoded once, for guards and links. */
export function loginUrlWithNext(next: string | null | undefined): string {
  return `/login?next=${encodeURIComponent(sanitizeNext(next))}`;
}
