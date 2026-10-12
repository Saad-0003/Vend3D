import { ACCOUNTS_KEY, findAccountByEmail, normalizeEmail, registerAccount, toAuthUser, type StoredAccount } from "@/lib/auth/accounts";
import type { AuthService, AuthUser, SignInInput, SignUpInput } from "@/lib/auth/schemas";

/**
 * Mock `AuthService` (plan.md Phase 3, DECISIONS.md D-051).
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

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function readAccounts(storage: StorageLike): StoredAccount[] {
  const raw = storage.getItem(ACCOUNTS_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredAccount[]) : [];
  } catch {
    // Corrupt payload: treat as no accounts rather than failing auth outright.
    return [];
  }
}

function readUser(storage: StorageLike): AuthUser | null {
  const raw = storage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AuthUser> | null;
    if (parsed && typeof parsed.id === "string" && typeof parsed.email === "string") {
      return { id: parsed.id, email: parsed.email, name: parsed.name ?? parsed.email };
    }
    return null;
  } catch {
    return null;
  }
}

function writeUser(storage: StorageLike, user: AuthUser | null): void {
  if (user) storage.setItem(USER_KEY, JSON.stringify(user));
  else storage.removeItem(USER_KEY);
}

/**
 * Builds the mock service against an injectable storage, so the tests never
 * depend on jsdom's global and the real Phase 3 service can take a Supabase
 * client in the same position.
 */
export function createMockAuthService(storage: StorageLike): AuthService {
  return {
    async signIn(input: SignInInput) {
      const email = normalizeEmail(input.email);
      const account = findAccountByEmail(readAccounts(storage), email);

      // Deliberately identical for "no such account" and "wrong password": a
      // distinguishable message would turn the form into an account-enumeration
      // oracle. This is also why the mock cannot compare a secret it never saw.
      if (!account) {
        return { ok: false, error: "Incorrect email or password." } as const;
      }

      const user = toAuthUser(account);
      writeUser(storage, user);
      return { ok: true, user } as const;
    },

    async signUp(input: SignUpInput) {
      const accounts = readAccounts(storage);
      const registered = registerAccount(accounts, { email: input.email, name: input.name });

      if (!registered.ok) {
        return { ok: false, error: registered.error } as const;
      }

      storage.setItem(ACCOUNTS_KEY, JSON.stringify(registered.accounts));
      const user = toAuthUser(registered.account);
      writeUser(storage, user);
      return { ok: true, user } as const;
    },

    async signOut() {
      writeUser(storage, null);
    },

    getCurrentUser() {
      return readUser(storage);
    },
  };
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

export const authService: AuthService = createMockAuthService(lazyStorage);
