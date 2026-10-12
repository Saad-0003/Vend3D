"use client";

import { useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

/**
 * Floating label: the label sits inside the field and lifts on focus or once
 * the input has content, using `:placeholder-shown` (so it needs a
 * whitespace placeholder). `htmlFor`/`id` keep it a real label, which is what
 * makes this keyboard- and screen-reader-accessible rather than decorative.
 */
function FloatingField({
  name,
  label,
  type = "text",
  inputMode,
  autoComplete,
  register,
  error,
  hint,
  trailing,
}: {
  name: "name" | "email" | "password" | "confirmPassword";
  label: string;
  type?: string;
  inputMode?: "email" | "tel" | "numeric";
  autoComplete?: string;
  register: ReturnType<typeof useForm<SignInValues | SignUpValues>>["register"];
  error?: string;
  hint?: string;
  trailing?: React.ReactNode;
}) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative">
        <Input
          {...register(name)}
          id={id}
          name={name}
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          placeholder=" "
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`h-13 peer rounded-[var(--inner-radius)] pt-4 pb-1.5 text-[15px] ${trailing ? "pr-12" : ""}`}
        />
        <label
          htmlFor={id}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 px-1 text-[13px] text-[var(--muted)] transition-all duration-200 peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-[10px] peer-focus:tracking-[0.14em] peer-focus:uppercase peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:tracking-[0.14em] peer-[:not(:placeholder-shown)]:uppercase"
        >
          {label}
        </label>
        {trailing ? (
          <span className="absolute top-1/2 right-2 -translate-y-1/2">{trailing}</span>
        ) : null}
      </div>

      {error ? (
        <p id={`${id}-error`} className="px-1 text-[12px] leading-[1.4] text-[var(--destructive)]">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="px-1 text-[12px] leading-[1.4] text-[var(--muted)]">
          {hint}
        </p>
      ) : null}
    </div>
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
