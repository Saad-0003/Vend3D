/**
 * Account display helpers for `/account` (plan.md Phase 3).
 *
 * Pure functions rather than component logic so the heading and the avatar
 * fallback follow one rule, and so the rules are unit-testable without
 * rendering anything — the same reason the auth schemas live in `lib/auth`.
 */

/**
 * First name for the account heading: "Ada Lovelace" → "Ada".
 *
 * Falls back to the email local part when the display name is empty, which is
 * the same derivation the mock service uses when a name is missing
 * (`displayNameFromEmail`), so the heading never reads "Hi, .".
 */
export function firstNameOf(name: string | undefined, email: string): string {
  const trimmed = (name ?? "").trim();
  if (trimmed) return trimmed.split(/\s+/)[0] ?? trimmed;
  return (email.split("@")[0] ?? "") || "there";
}

/** Up to two initials for the avatar fallback: "Ada Lovelace" → "AL". */
export function initialsOf(name: string | undefined, email: string): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  const [first, second] = words;
  const letters = second ? `${first?.[0] ?? ""}${second[0]}` : (first?.[0] ?? "");
  if (letters) return letters.toUpperCase();
  return (email.split("@")[0] ?? "").slice(0, 2).toUpperCase() || "V3";
}
