import { beforeEach, describe, expect, it } from "vitest";

import { ACCOUNTS_KEY } from "@/lib/auth/accounts";
import { createMockAuthService } from "@/lib/auth/service";

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
    expect(accounts).toHaveLength(1);
    expect(accounts[0].name).toBe("Ayesha");
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
    expect(accounts).toHaveLength(1);
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
    expect(service.getCurrentUser()).toEqual({ id: "u1", email: "a@b.co", name: "a@b.co" });
  });
});
