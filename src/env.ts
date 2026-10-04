import { z } from "zod";

/**
 * Every env var the app needs is declared here exactly once (agent.md §6.10:
 * a new var must land in .env.example AND this file in the same commit).
 * `NEXT_PUBLIC_` is the only prefix allowed to reach a client bundle.
 */
const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, "SUPABASE_SERVICE_ROLE_KEY looks malformed"),
  DATABASE_URL: z.string().url("DATABASE_URL must be a postgres connection string"),
  DIRECT_URL: z.string().url("DIRECT_URL must be a postgres connection string"),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL is required"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(20, "NEXT_PUBLIC_SUPABASE_ANON_KEY looks malformed"),
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL is required"),
});

const schema = serverSchema.merge(clientSchema);

export type Env = z.infer<typeof schema>;

function formatIssues(error: z.ZodError): string {
  return error.issues.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`).join("\n");
}

function parseEnv(source: Record<string, string | undefined>): Env {
  const result = schema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: source.SUPABASE_SERVICE_ROLE_KEY,
    DATABASE_URL: source.DATABASE_URL,
    DIRECT_URL: source.DIRECT_URL,
    NEXT_PUBLIC_SUPABASE_URL: source.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: source.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: source.NEXT_PUBLIC_APP_URL,
  });

  if (!result.success) {
    throw new Error(
      `Invalid environment variables. Copy .env.example to .env.local and fill it in.\n${formatIssues(result.error)}`,
    );
  }

  return result.data;
}

/**
 * Server-side accessor. Throws on first use if a var is missing, so a bad
 * deploy fails fast instead of silently 500-ing later (plan.md §2.2).
 */
export function getEnv(): Env {
  return parseEnv(process.env);
}

/** Client-safe subset. No service-role key is ever reachable from here. */
export function getClientEnv(): z.infer<typeof clientSchema> {
  const result = clientSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });

  if (!result.success) {
    throw new Error(`Invalid public environment variables.\n${formatIssues(result.error)}`);
  }

  return result.data;
}
