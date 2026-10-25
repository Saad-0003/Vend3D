"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FloatingField } from "@/components/auth/floating-field";
import { InfoLink } from "@/components/info/info-blocks";
import { signInSchema, signUpSchema, type SignInValues, type SignUpValues } from "@/lib/auth/schemas";
import { sanitizeNext } from "@/lib/auth/next";
import { useAuthStore } from "@/stores/auth-store";

/**
 * The one auth form, shared by the dialog and both full pages so validation,
 * labels, live-region behaviour and loading state cannot drift between them.
 *
 * Mode picks the schema and the extra signup fields; everything else is
 * identical. Errors surface twice by design: inline under each field, and once
 * in an `aria-live` summary for screen-reader users (plan.md Phase 9's
 * convention for form errors).
 */

type Mode = "signin" | "signup";

export function AuthForm({
  mode,
  onSuccess,
  next,
  submitLabel,
}: {
  mode: Mode;
  onSuccess?: () => void;
  /** Redirect target after success. Full pages pass their sanitised `?next=`. */
  next?: string;
  /** Overrides the button copy, e.g. a shorter label inside the dialog. */
  submitLabel?: string;
}) {
  const isSignUp = mode === "signup";
  const pending = useAuthStore((s) => s.pending);
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);

  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();
  /**
   * False until this component has mounted.
   *
   * React renders the page's markup before its handlers are attached, so a
   * submit that lands in that window does nothing at all — no navigation, no
   * error, no feedback. Rendering the button disabled in the server HTML makes
   * that window honest ("not ready") instead of silently swallowing the click,
   * and the effect below flips it the moment the form is live.
   */
  const [interactive, setInteractive] = useState(false);

  useEffect(() => {
    setInteractive(true);
  }, []);

  const form = useForm<SignInValues | SignUpValues>({
    resolver: zodResolver(isSignUp ? signUpSchema : signInSchema),
    defaultValues: isSignUp
      ? { name: "", email: "", password: "", confirmPassword: "" }
      : { email: "", password: "" },
  });

  async function onSubmit(values: SignInValues | SignUpValues) {
    setServerError(null);

    if (isSignUp) {
      const { name, email, password } = values as SignUpValues;
      const ok = await signUp({ email, password, name });
      if (!ok) {
        setServerError("An account with this email already exists. Try signing in.");
        return;
      }

      // The mock has no mailbox, so sign-up still signs the shopper in right
      // away — check-email is the honest "here is where a real one would wait"
      // stop (plan.md Phase 1B U3, D-093). `next` rides along so the
      // return-to-guarded-route contract survives the extra hop.
      const params = new URLSearchParams({ email });
      if (next) params.set("next", sanitizeNext(next));
      router.push(`/auth/check-email?${params.toString()}`);
      onSuccess?.();
      return;
    } else {
      const { email, password } = values as SignInValues;
      const ok = await signIn({ email, password });
      if (!ok) {
        setServerError("Incorrect email or password.");
        return;
      }
    }

    if (next) router.push(sanitizeNext(next));
    onSuccess?.();
  }

  const { errors } = form.formState;
  const errorList = Object.values(errors).flatMap((error) =>
    error?.message ? [String(error.message)] : [],
  );
  const announcement = serverError ?? (errorList.length > 0 ? errorList[0] : null);

  /**
   * One submit path, driven by React only.
   *
   * The button is `type="button"` and Enter is handled explicitly, so the form
   * has no native submission route at all. That matters: on a client-side
   * navigation React attaches the form's `onSubmit` handler only once hydration
   * finishes, and a click that lands before that performs a native GET submit —
   * which puts the password straight into the URL (history, logs, referrer).
   * Verified reachable via the `/login` → "Create one" hop.
   */
  function submitForm(event: { preventDefault: () => void }) {
    event.preventDefault();
    void form.handleSubmit(onSubmit)();
  }

  function handleEnterKey(event: React.KeyboardEvent<HTMLFormElement>) {
    if (event.key !== "Enter" || event.shiftKey) return;
    // Implicit submission would hit the native path we just removed.
    event.preventDefault();
    void form.handleSubmit(onSubmit)();
  }

  return (
    <form
      noValidate
      aria-live="polite"
      onKeyDown={handleEnterKey}
      className="flex flex-col gap-5"
    >
      {/* One live region for the whole form: announcing each field's message
          separately would make a single failed submit a wall of chatter. */}
      <p className="sr-only" role="status" data-testid="auth-live">
        {announcement ?? ""}
      </p>

      {serverError ? (
        <p className="flex items-start gap-2 rounded-[var(--inner-radius)] border border-[color-mix(in_srgb,var(--destructive)_40%,transparent)] bg-[color-mix(in_srgb,var(--destructive)_10%,transparent)] px-4 py-3 text-[13px] leading-[1.5] text-[var(--destructive)]">
          {serverError}
        </p>
      ) : null}

      {isSignUp ? (
        <FloatingField
          name="name"
          label="Full name"
          autoComplete="name"
          register={form.register}
          error={(errors as Partial<Record<keyof SignUpValues, { message?: string }>>).name?.message}
        />
      ) : null}

      <FloatingField
        name="email"
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="email"
        register={form.register}
        error={(errors as Partial<Record<keyof SignUpValues, { message?: string }>>).email?.message}
      />

      <FloatingField
        name="password"
        label="Password"
        type={showPassword ? "text" : "password"}
        autoComplete={isSignUp ? "new-password" : "current-password"}
        register={form.register}
        error={(errors as Partial<Record<keyof SignUpValues, { message?: string }>>).password?.message}
        hint={isSignUp ? "At least 8 characters, with a letter and a number." : undefined}
        trailing={
          <VisibilityToggle
            shown={showPassword}
            onToggle={() => setShowPassword((v) => !v)}
            control="password"
          />
        }
      />

      {!isSignUp ? (
        <>
          {/* A plain anchor, not `next/link`, matching the auth pages' cross
              links: the destination must be fully loaded for its own form. */}
          <div className="-mt-2 flex justify-end">
            <a
              href="/forgot-password"
              className="text-[12px] text-[var(--muted)] underline underline-offset-2 transition-colors hover:text-[var(--lime)]"
            >
              Forgot password?
            </a>
          </div>
        </>
      ) : null}

      {isSignUp ? (
        <FloatingField
          name="confirmPassword"
          label="Confirm password"
          type={showConfirm ? "text" : "password"}
          autoComplete="new-password"
          register={form.register}
          error={(errors as Partial<Record<keyof SignUpValues, { message?: string }>>).confirmPassword?.message}
          trailing={
            <VisibilityToggle
              shown={showConfirm}
              onToggle={() => setShowConfirm((v) => !v)}
              control="confirmPassword"
            />
          }
        />
      ) : null}

      {isSignUp ? (
        <p className="text-[12px] leading-[1.6] text-[var(--muted)]">
          By creating an account you agree to the{" "}
          <InfoLink href="/terms">Terms of Service</InfoLink> and{" "}
          <InfoLink href="/privacy">Privacy Policy</InfoLink>.
        </p>
      ) : null}

      <Button
        type="button"
        onClick={submitForm}
        // `interactive` covers the pre-hydration window; `pending` the request
        // itself. Disabling for an invalid form would hide *why* nothing
        // happens, so validation runs on submit and says so instead.
        disabled={pending || !interactive}
        className="h-11 w-full rounded-full bg-[var(--lime)] px-6 text-[15px] font-medium text-[var(--ink)] hover:bg-[var(--lime)]/90"
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" strokeWidth={1.5} aria-hidden />
            {isSignUp ? "Creating account…" : "Signing in…"}
          </>
        ) : (
          (submitLabel ?? (isSignUp ? "Create account" : "Sign in"))
        )}
      </Button>
    </form>
  );
}

function VisibilityToggle({
  shown,
  onToggle,
  control,
}: {
  shown: boolean;
  onToggle: () => void;
  control: "password" | "confirmPassword";
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? `Hide ${control}` : `Show ${control}`}
      aria-pressed={shown}
      className="grid size-9 place-items-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--ivory)]"
    >
      {shown ? <EyeOff className="size-4" strokeWidth={1.5} aria-hidden /> : <Eye className="size-4" strokeWidth={1.5} aria-hidden />}
    </button>
  );
}
