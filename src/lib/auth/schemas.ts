import { z } from "zod";

/**
 * Auth form schemas (plan.md Phase 3). Rules live here rather than in the
 * components so the same contract serves the dialog and both full pages, and so
 * the rules are unit-testable without rendering anything.
 *
 * These mirror the *shape* of Supabase Auth's email + password flow; the
 * service that consumes them is swappable (see `service.ts`).
 */

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email address")
  .max(254, "Keep the email under 254 characters");

/**
 * 8+ characters with at least one letter and one number. Deliberately not
 * draconian: composition rules push people toward worse habits, and length is
 * the part that actually matters.
 */
export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(72, "Keep the password under 72 characters")
  .refine((value) => /[a-zA-Z]/.test(value), "Include at least one letter")
  .refine((value) => /\d/.test(value), "Include at least one number");

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Name is required")
  .max(80, "Keep the name under 80 characters");

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const signUpSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;

/** Requesting a reset only ever needs one address, validated the same way. */
export const forgotPasswordSchema = z.object({ email: emailSchema });

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

/**
 * The domain types the whole auth surface speaks.
 *
 * `role` exists so the mock (plan.md Phase 1B U3) can gate the client-side
 * `RequireAdmin` guard and the navbar's Admin item. It is a display/prompt
 * concern only: the *trusted* role check stays server-side (plan.md Phase 3's
 * admin gate), and the demo admin account is plainly labelled as a mock (D-093).
 */
export type AuthRole = "user" | "admin";

export type AuthUser = {
  id: string;
  email: string;
  /** Display name; derived from the email prefix when OAuth omits one (Phase 3). */
  name: string;
  role: AuthRole;
};

export type SignInInput = { email: string; password: string };
export type SignUpInput = { email: string; password: string; name: string };

export type AuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; error: string };

/**
 * The contract Phase 3's Supabase implementation must satisfy. Components and
 * the store only ever see this, so swapping the mock for real auth is a module
 * change and not a rewrite of every caller.
 */
export type AuthService = {
  signIn: (input: SignInInput) => Promise<AuthResult>;
  signUp: (input: SignUpInput) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  /** Synchronous read of the persisted session, for render-time guards. */
  getCurrentUser: () => AuthUser | null;
};
