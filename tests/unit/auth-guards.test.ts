import { describe, expect, it } from "vitest";

import { decideGuard, loginRedirectUrl } from "@/lib/auth/guards";
import { DEFAULT_AUTH_NEXT } from "@/lib/auth/next";

/**
 * Guard decisions (plan.md Phase 1B U3). The policy is one pure function so
 * `RequireAuth` and `RequireAdmin` cannot drift: these tests pin the whole
 * decision table, including the admin edge cases the plan calls out ("never
 * trust a client flag" — the client check is a prompt, the server gate is the
 * control).
 */

const ADMIN = { id: "u1", email: "admin@vend3d.demo", name: "Admin", role: "admin" } as const;
const SHOPPER = { id: "u2", email: "ayesha@example.com", name: "Ayesha", role: "user" } as const;

describe("decideGuard", () => {
  it("waits while the session has not been read yet (either scope)", () => {
    const notLoaded = { hydrated: false, user: null, expired: false };
    expect(decideGuard(notLoaded, "session")).toBe("wait");
    expect(decideGuard(notLoaded, "admin")).toBe("wait");
  });

  it("passes signed-in shoppers on session routes", () => {
    expect(decideGuard({ hydrated: true, user: SHOPPER, expired: false }, "session")).toBe("pass");
  });

  it("passes signed-in admins on session and admin routes", () => {
    expect(decideGuard({ hydrated: true, user: ADMIN, expired: false }, "session")).toBe("pass");
    expect(decideGuard({ hydrated: true, user: ADMIN, expired: false }, "admin")).toBe("pass");
  });

  it("forbids a non-admin on admin routes", () => {
    expect(decideGuard({ hydrated: true, user: SHOPPER, expired: false }, "admin")).toBe("forbidden");
  });

  it("shows the recovery dialog for an expired session instead of a redirect", () => {
    // The user field is null once the store has dropped the dead session.
    expect(decideGuard({ hydrated: true, user: null, expired: true }, "session")).toBe("expired");
    expect(decideGuard({ hydrated: true, user: null, expired: true }, "admin")).toBe("expired");
  });

  it("sends a plain signed-out visitor to the login redirect", () => {
    expect(decideGuard({ hydrated: true, user: null, expired: false }, "session")).toBe("login");
    expect(decideGuard({ hydrated: true, user: null, expired: false }, "admin")).toBe("login");
  });
});

describe("loginRedirectUrl", () => {
  it("encodes the current path as ?next= for the return trip", () => {
    expect(loginRedirectUrl("/admin?tab=orders")).toBe("/login?next=%2Fadmin%3Ftab%3Dorders");
  });

  it("falls back to the default target when nothing is given", () => {
    expect(loginRedirectUrl(null)).toBe(`/login?next=${encodeURIComponent(DEFAULT_AUTH_NEXT)}`);
    expect(loginRedirectUrl(undefined)).toBe(`/login?next=${encodeURIComponent(DEFAULT_AUTH_NEXT)}`);
  });

  it("sanitises attacker-controlled targets before encoding", () => {
    expect(loginRedirectUrl("//evil.example")).toBe(`/login?next=${encodeURIComponent(DEFAULT_AUTH_NEXT)}`);
  });
});
