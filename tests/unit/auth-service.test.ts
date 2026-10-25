import { beforeEach, describe, expect, it, vi } from "vitest";

import { ACCOUNTS_KEY, DEMO_ADMIN_ACCOUNT } from "@/lib/auth/accounts";
import { MOCK_SESSION_TTL_MS, createMockAuthService, forceSessionExpiry } from "@/lib/auth/service";

/**
 * The mock `AuthService` (plan.md Phase 3, DECISIONS.md D-051). The contract
 * matters more than the mock's cleverness: these tests pin the behaviour Phase
 * 3's Supabase implementation must reproduce, including the two cases that are
 * easy to get wrong for security reasons.
 */

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (name: string) => map.get(name) ?? null,
    setItem: (name: string, value: string) => void map.set(name, value),
    removeItem: (name: string) => void map.delete(name),
    /** Test-only: raw persisted accounts. */
    raw: (name: string) => map.get(name) ?? null,
  };
}

const VALID = { email: "ayesha@example.com", password: "supersecret1", name: "Ayesha" };

describe("createMockAuthService", () => {
  let storage: ReturnType<typeof memoryStorage>;
  let service: ReturnType<typeof createMockAuthService>;

  beforeEach(() => {
    storage = memoryStorage();
    service = createMockAuthService(storage);
  });

  it("signs up, then signs the same user back in", async () => {
    const created = await service.signUp(VALID);
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.user).toMatchObject({
      email: "ayesha@example.com",
      name: "Ayesha",
    });
    expect(created.user.id).toBeTruthy();

    expect(service.getCurrentUser()).toEqual(created.user);

    await service.signOut();
    expect(service.getCurrentUser()).toBeNull();

    const again = await service.signIn({ email: VALID.email, password: VALID.password });
    expect(again.ok).toBe(true);
    if (!again.ok) return;
    expect(again.user.id).toBe(created.user.id);
  });

  it("rejects a sign-in for an account that does not exist", async () => {
    const result = await service.signIn({ email: "nobody@example.com", password: "whatever12" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    // Same message as a wrong password: a distinguishable one would let the
    // form be used to enumerate registered emails.
    expect(result.error).toBe("Incorrect email or password.");
  });

  it("refuses a duplicate sign-up and keeps the original account", async () => {
    const first = await service.signUp(VALID);
    expect(first.ok).toBe(true);

    const second = await service.signUp({ ...VALID, name: "Impostor" });
    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.error).toMatch(/already exists/i);

    const accounts = JSON.parse(storage.raw(ACCOUNTS_KEY) ?? "[]");
    // Two rows now: the registered user and the seeded demo admin (D-093).
    expect(accounts).toHaveLength(2);
    expect(accounts.find((a: { email: string }) => a.email === VALID.email)?.name).toBe("Ayesha");
  });

  it("never persists a password", async () => {
    await service.signUp(VALID);
    const persisted = [storage.raw(ACCOUNTS_KEY), storage.raw("vend3d-auth-user")].join(" ");
    expect(persisted).not.toContain(VALID.password);
    expect(persisted).not.toContain("password");
  });

  it("signs out without touching the account registry", async () => {
    await service.signUp(VALID);
    await service.signOut();

    expect(service.getCurrentUser()).toBeNull();
    const accounts = JSON.parse(storage.raw(ACCOUNTS_KEY) ?? "[]");
    expect(accounts).toHaveLength(2);
  });

  it("treats a corrupt accounts payload as empty rather than throwing", async () => {
    storage.setItem(ACCOUNTS_KEY, "{not json");
    const result = await service.signIn(VALID);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected a failure");
    expect(result.error).toBe("Incorrect email or password.");
  });

  it("treats a well-formed but non-array accounts payload as empty", async () => {
    storage.setItem(ACCOUNTS_KEY, JSON.stringify({ nope: true }));
    const result = await service.signIn(VALID);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected a failure");
    expect(result.error).toBe("Incorrect email or password.");
  });

  it("treats a corrupt session payload as signed out", async () => {
    storage.setItem("vend3d-auth-user", "{not json");
    expect(service.getCurrentUser()).toBeNull();
  });

  it("treats a session payload of the wrong shape as signed out", async () => {
    storage.setItem("vend3d-auth-user", JSON.stringify({ id: 42 }));
    expect(service.getCurrentUser()).toBeNull();
  });

  it("falls back to the email when a stored session has no name", async () => {
    storage.setItem("vend3d-auth-user", JSON.stringify({ id: "u1", email: "a@b.co" }));
    expect(service.getCurrentUser()).toEqual({
      id: "u1",
      email: "a@b.co",
      name: "a@b.co",
      role: "user",
    });
  });

  it("treats a session payload of the wrong role as a plain user", async () => {
    storage.setItem(
      "vend3d-auth-user",
      JSON.stringify({ id: "u1", email: "a@b.co", role: "root" }),
    );
    expect(service.getCurrentUser()?.role).toBe("user");
  });
});

describe("createMockAuthService · role and the demo admin (D-093)", () => {
  let storage: ReturnType<typeof memoryStorage>;
  let service: ReturnType<typeof createMockAuthService>;

  beforeEach(() => {
    storage = memoryStorage();
    service = createMockAuthService(storage);
  });

  it("seeds the clearly labelled demo admin and signs it in with any password", async () => {
    // The mock compares no secret (D-051); existence-only sign-in is the point.
    const result = await service.signIn({ email: DEMO_ADMIN_ACCOUNT.email, password: "whatever99" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.user.role).toBe("admin");
    expect(result.user.email).toBe("admin@vend3d.demo");
  });

  it("keeps the demo admin after a sign-up writes the registry again", async () => {
    await service.signUp(VALID);
    const accounts = JSON.parse(storage.raw(ACCOUNTS_KEY) ?? "[]");
    expect(accounts.some((a: { email: string }) => a.email === DEMO_ADMIN_ACCOUNT.email)).toBe(true);
  });

  it("skips seeding when the admin already exists", async () => {
    await service.signIn({ email: DEMO_ADMIN_ACCOUNT.email, password: "x" });
    const before = storage.raw(ACCOUNTS_KEY);
    await service.signIn({ email: DEMO_ADMIN_ACCOUNT.email, password: "x" });
    expect(storage.raw(ACCOUNTS_KEY)).toBe(before);
  });
});

describe("createMockAuthService · session expiry (plan.md Phase 1B U3)", () => {
  let storage: ReturnType<typeof memoryStorage>;
  let service: ReturnType<typeof createMockAuthService>;

  beforeEach(() => {
    storage = memoryStorage();
    service = createMockAuthService(storage);
  });

  it("issues an active session with the mock TTL", async () => {
    const now = Date.now();
    await service.signUp(VALID);
    const state = service.getSessionState();
    expect(state.status).toBe("active");
    if (state.status !== "active") return;
    expect(state.user.role).toBe("user");

    const session = JSON.parse(storage.raw("vend3d-auth-user") ?? "{}");
    expect(session.expiresAt).toBeGreaterThanOrEqual(now + MOCK_SESSION_TTL_MS - 1_000);
  });

  it("reports an expired session separately from signed-out", async () => {
    await service.signUp(VALID);
    const session = JSON.parse(storage.raw("vend3d-auth-user") ?? "{}");
    storage.setItem("vend3d-auth-user", JSON.stringify({ ...session, expiresAt: Date.now() - 1 }));

    const state = service.getSessionState();
    expect(state.status).toBe("expired");
    if (state.status !== "expired") return;
    expect(state.user.email).toBe(VALID.email);

    // The user-shaped reads stop trusting an expired session…
    expect(service.getCurrentUser()).toBeNull();
    // …but the registry is untouched — only the lifetime ran out.
    expect(JSON.parse(storage.raw(ACCOUNTS_KEY) ?? "[]")).toHaveLength(2);
  });

  it("clears to active when the expired session is overwritten by sign-in", async () => {
    await service.signUp(VALID);
    const session = JSON.parse(storage.raw("vend3d-auth-user") ?? "{}");
    storage.setItem("vend3d-auth-user", JSON.stringify({ ...session, expiresAt: Date.now() - 1 }));
    expect(service.getSessionState().status).toBe("expired");

    await service.signIn({ email: VALID.email, password: VALID.password });
    expect(service.getSessionState().status).toBe("active");
  });

  it("treats a stored expiry timestamp older than now as expired", async () => {
    storage.setItem(
      "vend3d-auth-user",
      JSON.stringify({ id: "u1", email: "a@b.co", expiresAt: Date.now() - 1 }),
    );
    expect(service.getSessionState().status).toBe("expired");
  });

  it("keeps honouring a session without an expiry (pre-U3 payload)", async () => {
    storage.setItem("vend3d-auth-user", JSON.stringify({ id: "u1", email: "a@b.co" }));
    expect(service.getSessionState().status).toBe("active");
  });
});

describe("forceSessionExpiry · dev/test helper against the app singleton", () => {
  beforeEach(() => {
    localStorage.removeItem("vend3d-auth-user");
    localStorage.removeItem(ACCOUNTS_KEY);
  });

  it("expires the live session for the singleton service", async () => {
    const { authService } = await import("@/lib/auth/service");
    await authService.signUp(VALID);
    expect(forceSessionExpiry()).toBe(true);
    expect(authService.getSessionState().status).toBe("expired");
    expect(authService.getCurrentUser()).toBeNull();
  });

  it("is a no-op when there is no session to expire", async () => {
    expect(forceSessionExpiry()).toBe(false);
  });

  it("declines to run in a production build", async () => {
    const { authService } = await import("@/lib/auth/service");
    await authService.signUp(VALID);
    vi.stubEnv("NODE_ENV", "production");
    try {
      expect(forceSessionExpiry()).toBe(false);
      expect(authService.getSessionState().status).toBe("active");
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
