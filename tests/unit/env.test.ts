import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getClientEnv, getEnv } from "@/env";

const validEnv = {
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key-that-is-long-enough",
  DATABASE_URL: "postgresql://user:pass@db.example.com:6543/postgres",
  DIRECT_URL: "postgresql://user:pass@db.example.com:5432/postgres",
  NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key-that-is-long-enough-value",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
};

const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...validEnv } as unknown as NodeJS.ProcessEnv;
});

afterEach(() => {
  process.env = originalEnv;
});

describe("env", () => {
  it("accepts a fully populated environment", () => {
    expect(getEnv()).toMatchObject({ NEXT_PUBLIC_APP_URL: "http://localhost:3000" });
  });

  it("fails fast with an actionable message when a var is missing", () => {
    delete process.env.DATABASE_URL;
    expect(() => getEnv()).toThrowError(/Invalid environment variables/);
    expect(() => getEnv()).toThrowError(/DATABASE_URL/);
  });

  it("rejects a malformed public url", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "not-a-url";
    expect(() => getEnv()).toThrowError(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("exposes public vars without requiring server secrets", () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(getClientEnv().NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe(
      validEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  });
});
