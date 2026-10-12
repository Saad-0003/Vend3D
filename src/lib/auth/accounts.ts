import type { AuthUser } from "@/lib/auth/schemas";

/**
 * Mock account registry (plan.md Phase 3, D-051).
 *
 * **No password is ever stored, compared or logged here.** The mock's job is to
 * stand in for Supabase Auth until Phase 3 wires the real service, and
 * rehearsing "keep the credential in the store" would be the worst possible
 * habit to build — the swap would then have to un-learn it. Sign-in therefore
 * establishes that an account exists, not that a secret matched; the real
 * service compares server-side and this module disappears.
 *
 * Accounts are keyed by lowercased email so casing never forks identity.
 */

/** The only account shape persisted. Note what is absent. */
export type StoredAccount = {
  id: string;
  email: string;
  name: string;
};

export const ACCOUNTS_KEY = "vend3d-auth-accounts";

/** Email is the identity key, so comparison is always case-insensitive. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function findAccountByEmail(accounts: StoredAccount[], email: string): StoredAccount | undefined {
  const normalized = normalizeEmail(email);
  return accounts.find((account) => normalizeEmail(account.email) === normalized);
}

export function toAuthUser(account: StoredAccount): AuthUser {
  return { id: account.id, email: account.email, name: account.name };
}

export type RegisterResult =
  | { ok: true; accounts: StoredAccount[]; account: StoredAccount }
  | { ok: false; error: string };

/**
 * Adds an account, or explains that the email is taken. Returns a new array
 * rather than mutating, so callers cannot accidentally share store state.
 */
export function registerAccount(
  accounts: StoredAccount[],
  input: { email: string; name: string },
  newId: () => string = defaultAccountId,
): RegisterResult {
  const normalized = normalizeEmail(input.email);
  if (findAccountByEmail(accounts, normalized)) {
    return { ok: false, error: "An account with this email already exists. Try signing in." };
  }

  const account: StoredAccount = {
    id: newId(),
    email: normalized,
    // `name` is trimmed by the schema; an OAuth user without one is derived
    // from the email prefix instead (plan.md Phase 3 edge case).
    name: input.name.trim() || normalized.split("@")[0]!,
  };

  return { ok: true, accounts: [...accounts, account], account };
}

/** Derives a display name from an email, for OAuth users without one. */
export function displayNameFromEmail(email: string): string {
  // `split` always yields at least one element, so the first entry is present.
  const prefix = normalizeEmail(email).split("@")[0]!;
  return prefix.replace(/[._-]+/g, " ").trim() || "there";
}

function defaultAccountId(): string {
  return `user-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
