import {
  ACCOUNTS_KEY,
  DEMO_ADMIN_ACCOUNT,
  findAccountByEmail,
  normalizeAccount,
  normalizeEmail,
  registerAccount,
  toAuthUser,
  withDemoAdmin,
  type StoredAccount,
} from "@/lib/auth/accounts";
import type { AuthService, AuthUser, SignInInput, SignUpInput } from "@/lib/auth/schemas";

/**
 * Mock `AuthService` (plan.md Phase 3, DECISIONS.md D-051; role + session
 * expiry added for Phase 1B U3, see D-093).
 *
 * The plan defines the auth approach — Supabase Auth, email + password (+ Google
 * OAuth) — but Phase 2's schema and Phase 3's wiring do not exist yet, so this
 * module stands in. It implements the same contract `src/lib/auth/schemas.ts`
 * declares, which means Phase 3 replaces *this file only*: the store and every
 * component already speak `AuthService`.
 *
 * Session and account data are browser-local (localStorage), the same client
 * mirror pattern the cart and orders stores use (D-041). Passwords are not
 * stored anywhere — see `accounts.ts`.
 */

const USER_KEY = "vend3d-auth-user";

/**
 * How long a mock session stays valid (a day — long enough to demo with, short
 * enough that expiry is a normal state, not an urban legend). The real service
 * owns its token lifetime; this only exists so the expired-session UI is
 * reachable.
 */
export const MOCK_SESSION_TTL_MS = 24 * 60 * 60 * 1000;

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** A stored session plus its expiry, in one localStorage payload. */
type StoredSession = { user: AuthUser; expiresAt: number | null };

function readAccounts(storage: StorageLike): StoredAccount[] {
  const raw = storage.getItem(ACCOUNTS_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    // `normalizeAccount` also backfills `role` for pre-U3 payloads.
    return Array.isArray(parsed)
      ? parsed.map(normalizeAccount).filter((account): account is StoredAccount => account !== null)
      : [];
  } catch {
    // Corrupt payload: treat as no accounts rather than failing auth outright.
    return [];
  }
}

/**
 * Reads the accounts list with the demo admin in it, persisting the addition so
 * later writes (e.g. sign-up) cannot drop it again.
 */
function readAccountsWithDemoAdmin(storage: StorageLike): StoredAccount[] {
  const accounts = readAccounts(storage);
  if (findAccountByEmail(accounts, DEMO_ADMIN_ACCOUNT.email)) return accounts;
  const seeded = withDemoAdmin(accounts);
  storage.setItem(ACCOUNTS_KEY, JSON.stringify(seeded));
  return seeded;
}

function readSession(storage: StorageLike): StoredSession | null {
  const raw = storage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AuthUser> & { expiresAt?: unknown } | null;
    if (!parsed || typeof parsed.id !== "string" || typeof parsed.email !== "string") return null;
    return {
      user: {
        id: parsed.id,
        email: parsed.email,
        name: parsed.name ?? parsed.email,
        role: parsed.role === "admin" ? "admin" : "user",
      },
      // Pre-U3 sessions never expire; absent timestamp is honoured as null.
      expiresAt: typeof parsed.expiresAt === "number" ? parsed.expiresAt : null,
    };
  } catch {
    return null;
  }
}

function hasExpired(session: StoredSession, now: number): boolean {
  return session.expiresAt !== null && session.expiresAt <= now;
}

/**
 * Extends the session on every fresh sign-in/sign-up rather than reading it at
 * each request: the mock has no server round-trip to refresh with, and a
 * sliding window would make expiry unreachable in normal use.
 */
function writeSession(storage: StorageLike, user: AuthUser): void {
  const session: StoredSession = { user, expiresAt: Date.now() + MOCK_SESSION_TTL_MS };
  storage.setItem(USER_KEY, JSON.stringify({ ...session.user, expiresAt: session.expiresAt }));
}

function clearSession(storage: StorageLike): void {
  storage.removeItem(USER_KEY);
}

/** The three states a protected screen must be able to tell apart. */
export type MockSessionState =
  | { status: "active"; user: AuthUser }
  | { status: "expired"; user: AuthUser }
  | { status: "signed-out" };

/**
 * The mock's extras on top of the shared `AuthService` contract: an explicit
 * session-state read (so a guard can show "expired" instead of guessing from a
 * null user) and a test helper below. Phase 3's real service models these with
 * Supabase's session refresh.
 */
export type MockAuthService = AuthService & {
  getSessionState: () => MockSessionState;
};

/**
 * Builds the mock service against an injectable storage, so the tests never
 * depend on jsdom's global and the real Phase 3 service can take a Supabase
 * client in the same position.
 */
export function createMockAuthService(storage: StorageLike): MockAuthService {
  return {
    async signIn(input: SignInInput) {
      const email = normalizeEmail(input.email);
      const account = findAccountByEmail(readAccountsWithDemoAdmin(storage), email);

      // Deliberately identical for "no such account" and "wrong password": a
      // distinguishable message would turn the form into an account-enumeration
      // oracle. This is also why the mock cannot compare a secret it never saw.
      if (!account) {
        return { ok: false, error: "Incorrect email or password." } as const;
      }

      const user = toAuthUser(account);
      writeSession(storage, user);
      return { ok: true, user } as const;
    },

    async signUp(input: SignUpInput) {
      // Seeding before validating overlaps with registration in one commit, so
      // a sign-up write can never evict the labelled demo admin (D-093).
      const accounts = readAccountsWithDemoAdmin(storage);
      const registered = registerAccount(accounts, { email: input.email, name: input.name });

      if (!registered.ok) {
        return { ok: false, error: registered.error } as const;
      }

      storage.setItem(ACCOUNTS_KEY, JSON.stringify(registered.accounts));
      const user = toAuthUser(registered.account);
      writeSession(storage, user);
      return { ok: true, user } as const;
    },

    async signOut() {
      clearSession(storage);
    },

    getCurrentUser() {
      const session = readSession(storage);
      if (!session || hasExpired(session, Date.now())) return null;
      return session.user;
    },

    getSessionState() {
      const session = readSession(storage);
      if (!session) return { status: "signed-out" } as const;
      return hasExpired(session, Date.now())
        ? ({ status: "expired", user: session.user } as const)
        : ({ status: "active", user: session.user } as const);
    },
  };
}

/**
 * Dev-only test hook: expires the persisted mock session immediately.
 *
 * Enabled outside production builds (`npm run dev` is how e2e runs), so the
 * expired-session UI can be reached from Playwright without re-implementing the
 * session payload shape in a spec. It is inert in production builds and never
 * exists in the real service — Supabase expiry is the server's call.
 */
export function forceSessionExpiry(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  const storage = lazyStorage;
  const session = readSession(storage);
  if (!session) return false;
  storage.setItem(USER_KEY, JSON.stringify({ ...session.user, expiresAt: Date.now() - 1 }));
  return true;
}

/**
 * The service the app uses.
 *
 * Accessing `localStorage` unguarded matches the cart store: the object below
 * is built at import time (safe on the server, where nothing is read), and its
 * methods only run from client effects and handlers, so SSR never reaches them.
 */
const lazyStorage: StorageLike = {
  getItem: (name) => localStorage.getItem(name),
  setItem: (name, value) => localStorage.setItem(name, value),
  removeItem: (name) => localStorage.removeItem(name),
};

export const authService: MockAuthService = createMockAuthService(lazyStorage);
