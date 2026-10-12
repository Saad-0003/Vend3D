import { describe, expect, it } from "vitest";

import {
  findAccountByEmail,
  displayNameFromEmail,
  normalizeEmail,
  registerAccount,
  type StoredAccount,
} from "@/lib/auth/accounts";
import { DEFAULT_AUTH_NEXT, loginUrlWithNext, sanitizeNext } from "@/lib/auth/next";
import { passwordSchema, signInSchema, signUpSchema } from "@/lib/auth/schemas";

/**
 * Auth helpers (plan.md Phase 3). These are the pieces that must be right
 * before any UI works: the redirect target is attacker-controlled, and the
 * schema rules are what the form and the service both trust.
 */

describe("sanitizeNext", () => {
  it("keeps same-origin absolute paths", () => {
    expect(sanitizeNext("/account")).toBe("/account");
    expect(sanitizeNext("/order/ord-1?tab=items")).toBe("/order/ord-1?tab=items");
    expect(sanitizeNext("/designs#recent")).toBe("/designs#recent");
  });

  it("falls back to the default for missing or blank input", () => {
    expect(sanitizeNext(null)).toBe(DEFAULT_AUTH_NEXT);
    expect(sanitizeNext(undefined)).toBe(DEFAULT_AUTH_NEXT);
    expect(sanitizeNext("")).toBe(DEFAULT_AUTH_NEXT);
    expect(sanitizeNext("   ")).toBe(DEFAULT_AUTH_NEXT);
  });

  it("rejects absolute and protocol-relative URLs", () => {
    expect(sanitizeNext("https://evil.example")).toBe(DEFAULT_AUTH_NEXT);
    expect(sanitizeNext("http://evil.example")).toBe(DEFAULT_AUTH_NEXT);
    expect(sanitizeNext("//evil.example")).toBe(DEFAULT_AUTH_NEXT);
    expect(sanitizeNext("///evil.example")).toBe(DEFAULT_AUTH_NEXT);
  });

  it("rejects backslash and scheme tricks", () => {
    // Browsers normalise `\` to `/`, so `/\evil.example` parses as `//evil.example`.
    expect(sanitizeNext("/\\evil.example")).toBe(DEFAULT_AUTH_NEXT);
    expect(sanitizeNext("javascript:alert(1)")).toBe(DEFAULT_AUTH_NEXT);
    expect(sanitizeNext("data:text/html,<script>")).toBe(DEFAULT_AUTH_NEXT);
  });

  it("rejects control characters and non-strings", () => {
    expect(sanitizeNext("/ac\u0000count")).toBe(DEFAULT_AUTH_NEXT);
    // @ts-expect-error -- deliberately testing the runtime guard
    expect(sanitizeNext(42)).toBe(DEFAULT_AUTH_NEXT);
    // @ts-expect-error -- deliberately testing the runtime guard
    expect(sanitizeNext({ next: "/account" })).toBe(DEFAULT_AUTH_NEXT);
  });

  it("does not treat a relative path without a slash as safe", () => {
    expect(sanitizeNext("account")).toBe(DEFAULT_AUTH_NEXT);
  });
});

describe("loginUrlWithNext", () => {
  it("encodes the target exactly once", () => {
    const url = loginUrlWithNext("/order/ord-1?tab=items");
    expect(url).toBe(`/login?next=${encodeURIComponent("/order/ord-1?tab=items")}`);
    expect(decodeURIComponent(new URL(url, "http://x").searchParams.get("next")!)).toBe(
      "/order/ord-1?tab=items",
    );
  });

  it("sanitises before encoding", () => {
    expect(loginUrlWithNext("https://evil.example")).toBe(
      `/login?next=${encodeURIComponent(DEFAULT_AUTH_NEXT)}`,
    );
  });
});

describe("normalizeEmail", () => {
  it("trims and lowercases so casing never forks identity", () => {
    expect(normalizeEmail("  Ayesha@Example.COM ")).toBe("ayesha@example.com");
  });
});

describe("findAccountByEmail", () => {
  const accounts = [{ id: "u1", email: "ayesha@example.com", name: "Ayesha" }];

  it("matches case-insensitively", () => {
    expect(findAccountByEmail(accounts, "AYESHA@EXAMPLE.COM")?.id).toBe("u1");
    expect(findAccountByEmail(accounts, "ayesha@example.com")?.id).toBe("u1");
  });

  it("returns undefined for an unknown email", () => {
    expect(findAccountByEmail(accounts, "other@example.com")).toBeUndefined();
  });
});

describe("registerAccount", () => {
  it("adds a new account and returns a new array", () => {
    const before: StoredAccount[] = [];
    const result = registerAccount(before, { email: "Ayesha@Example.com", name: "Ayesha" }, () => "u1");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.account).toEqual({ id: "u1", email: "ayesha@example.com", name: "Ayesha" });
    expect(result.accounts).toHaveLength(1);
    // The input array is untouched.
    expect(before).toHaveLength(0);
  });

  it("rejects an existing email without touching the list", () => {
    const existing = [{ id: "u1", email: "ayesha@example.com", name: "Ayesha" }];
    const result = registerAccount(existing, { email: "AYESHA@example.com", name: "Impostor" }, () => "u2");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/already exists/i);
    expect(existing).toHaveLength(1);
  });

  it("derives a name from the email when none is given", () => {
    const result = registerAccount([], { email: "ayesha.khan@example.com", name: "" }, () => "u1");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.account.name).toBe("ayesha.khan");
  });
});

describe("displayNameFromEmail", () => {
  it("turns separators into spaces and never returns empty", () => {
    expect(displayNameFromEmail("ayesha.khan-1@example.com")).toBe("ayesha khan 1");
    expect(displayNameFromEmail("___@example.com")).toBe("there");
    expect(displayNameFromEmail("@example.com")).toBe("there");
  });
});

describe("schemas", () => {
  it("accepts a valid sign-in", () => {
    expect(signInSchema.safeParse({ email: "a@b.co", password: "anything" }).success).toBe(true);
  });

  it("requires an email and a password on sign-in", () => {
    const result = signInSchema.safeParse({ email: "", password: "" });
    expect(result.success).toBe(false);
    if (result.success) return;
    // An empty email fails both the "required" and the "valid address" rules.
    expect(result.error.issues.map((i) => i.message)).toEqual([
      "Email is required",
      "Enter a valid email address",
      "Password is required",
    ]);
  });

  it("rejects a malformed email", () => {
    const result = signInSchema.safeParse({ email: "not-an-email", password: "x" });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe("Enter a valid email address");
  });

  it("requires 8+ characters with a letter and a number", () => {
    expect(passwordSchema.safeParse("abcdefg1").success).toBe(true);
    expect(passwordSchema.safeParse("short1").success).toBe(false);
    expect(passwordSchema.safeParse("alllettersnodigit").success).toBe(false);
    expect(passwordSchema.safeParse("12345678").success).toBe(false);
    expect(passwordSchema.safeParse("a".repeat(73) + "1").success).toBe(false);
  });

  it("requires the name on sign-up", () => {
    const result = signUpSchema.safeParse({
      name: "A",
      email: "a@b.co",
      password: "abcdefg1",
      confirmPassword: "abcdefg1",
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.message).toBe("Name is required");
  });

  it("rejects a mismatched confirmation on the confirm field", () => {
    const result = signUpSchema.safeParse({
      name: "Ayesha",
      email: "a@b.co",
      password: "abcdefg1",
      confirmPassword: "abcdefg2",
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    const confirmIssue = result.error.issues.find((i) => i.path.includes("confirmPassword"));
    expect(confirmIssue?.message).toBe("Passwords do not match");
  });

  it("accepts a complete sign-up", () => {
    expect(
      signUpSchema.safeParse({
        name: "Ayesha",
        email: "a@b.co",
        password: "abcdefg1",
        confirmPassword: "abcdefg1",
      }).success,
    ).toBe(true);
  });
});
