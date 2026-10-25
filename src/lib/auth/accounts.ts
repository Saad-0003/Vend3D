import type { AuthRole, AuthUser } from "@/lib/auth/schemas";

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
  role: AuthRole;
};

export const ACCOUNTS_KEY = "vend3d-auth-accounts";

/**
 * Clearly labelled demo admin account, seeded by the mock service (plan.md
 * Phase 1B U3). It exists only in this browser's localStorage; there is no
 * server, no cooldown and no credential check behind it, so it is **not
 * security** — plan.md Phase 3's server-side `requireAdmin()` is. See D-093.
 * The `.demo` domain is deliberately unroutable.
 */
export const DEMO_ADMIN_ACCOUNT: StoredAccount = {
  id: "user-demo-admin",
  email: "admin@vend3d.demo",
  name: "Vend3D Demo Admin",
  role: "admin",
};

/** Email is the identity key, so comparison is always case-insensitive. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function findAccountByEmail(accounts: StoredAccount[], email: string): StoredAccount | undefined {
  const normalized = normalizeEmail(email);
  return accounts.find((account) => normalizeEmail(account.email) === normalized);
}

/**
 * Backfills `role` for account payloads persisted before the field existed, so
 * an upgrade never turns a stored account into an unrepresentable one.
 */
export function normalizeAccount(raw: unknown): StoredAccount | null {
  if (!raw || typeof raw !== "object") return null;
  const parsed = raw as Partial<StoredAccount> & Record<string, unknown>;
  if (typeof parsed.id !== "string" || typeof parsed.email !== "string") return null;
  return {
    id: parsed.id,
    email: parsed.email,
    name: typeof parsed.name === "string" ? parsed.name : parsed.email,
    role: parsed.role === "admin" ? "admin" : "user",
  };
}

export function toAuthUser(account: StoredAccount): AuthUser {
  return { id: account.id, email: account.email, name: account.name, role: account.role };
}

/**
 * Returns the accounts list with the demo admin in it, appending (never
 * overwriting) it so a wiped registry always regains the labelled admin.
 */
export function withDemoAdmin(accounts: StoredAccount[]): StoredAccount[] {
  return findAccountByEmail(accounts, DEMO_ADMIN_ACCOUNT.email) ? accounts : [...accounts, DEMO_ADMIN_ACCOUNT];
}

export type RegisterResult =
  | { ok: true; accounts: StoredAccount[]; account: StoredAccount }
  | { ok: false; error: string };

/**
 * Adds an account, or explains that the email is taken. Returns a new array
 * rather than mutating, so callers cannot accidentally share store state.
 * Self-service accounts are always `admin: false`; an admin is seeded, not
 * registered (D-093).
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
    role: "user",
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
