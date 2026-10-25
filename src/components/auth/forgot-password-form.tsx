"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { FloatingField } from "@/components/auth/floating-field";
import { Button } from "@/components/ui/button";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/auth/schemas";

/**
 * `/forgot-password`'s form island (plan.md Phase 1B U3).
 *
 * Validation matches the other auth forms (one zod schema in `schemas.ts`,
 * errors inline plus a live-region summary), while the "send" itself is
 * deliberately fake: the mock never sends mail (D-093), so there is no service
 * call at all — a valid submit simply navigates to the check-email stop. The
 * screen carries the demo notice so no one waits at a real inbox.
 *
 * It also never consults the mock's account registry: "does this email exist?"
 * is exactly the question a forgot-password form must not answer.
 */
export function ForgotPasswordForm() {
  const [interactive, setInteractive] = useState(false);
  const router = useRouter();

  // Same pre-hydration gate as `AuthForm`: the button renders disabled in
  // server HTML, so a click before React attaches handlers is honest (noop
  // disabled, visible why) instead of invisibly swallowed.
  useEffect(() => {
    setInteractive(true);
  }, []);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  function onSubmit(values: ForgotPasswordValues) {
    router.push(`/auth/check-email?email=${encodeURIComponent(values.email)}`);
  }

  const { errors } = form.formState;
  const errorList = Object.values(errors).flatMap((error) =>
    error?.message ? [String(error.message)] : [],
  );
  const announcement = errorList[0] ?? null;

  return (
    <form noValidate aria-live="polite" className="flex flex-col gap-5">
      <p className="sr-only" role="status" data-testid="forgot-live">
        {announcement ?? ""}
      </p>

      <FloatingField
        name="email"
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="email"
        register={form.register}
        error={errors.email?.message}
      />

      <Button
        type="button"
        onClick={form.handleSubmit(onSubmit)}
        disabled={!interactive}
        className="h-11 w-full rounded-full bg-[var(--lime)] px-6 text-[15px] font-medium text-[var(--ink)] hover:bg-[var(--lime)]/90"
      >
        Send reset link
      </Button>
    </form>
  );
}
