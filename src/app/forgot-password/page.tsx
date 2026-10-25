import type { Metadata } from "next";

import { AuthStage } from "@/components/auth/auth-stage";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { PageShell } from "@/components/ui/page-shell";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a Vend3D password reset link.",
  robots: { index: false, follow: false },
};

/**
 * `/forgot-password` (plan.md Phase 1B U3) — the same split layout as
 * `/login`/`/signup` so the auth surfaces cannot drift (DESIGN.md rule 3).
 *
 * The demo notice is printed on the page on purpose: the mock never sends
 * mail (D-093), and a screen that claims "check your inbox" without saying the
 * email is a demo would leave a visitor waiting at a real inbox.
 */
export default function ForgotPasswordPage() {
  return (
    <PageShell aria-label="Forgot password" className="lux">
      <div className="mx-auto grid w-full max-w-[1120px] items-stretch gap-10 lg:grid-cols-2">
        <AuthStage />

        <div className="flex flex-col justify-center">
          <div className="mx-auto flex w-full max-w-[400px] flex-col gap-7 rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] p-6 [box-shadow:var(--inner-highlight)] sm:p-8">
            <header className="flex flex-col gap-2">
              <span className="lux-eyebrow text-[var(--lime)]">Account</span>
              <h1 className="lux-h2 lux-display text-[28px] text-[var(--ivory)]">Forgot password</h1>
              <p className="text-[14px] leading-[1.6] text-[var(--muted)]">
                Enter your email and we&apos;ll send a reset link.
              </p>
            </header>

            <p
              data-testid="forgot-demo-notice"
              className="rounded-[var(--inner-radius)] border border-[var(--hairline)] bg-[var(--surface-2)] px-4 py-3 text-[12px] leading-[1.5] text-[var(--muted)]"
            >
              Demo notice: this mock never sends email — nothing will actually be delivered.
            </p>

            <ForgotPasswordForm />

            <p className="text-center text-[13px] text-[var(--muted)]">
              Remembered it?{" "}
              <a
                href="/login"
                className="text-[var(--ivory)] underline underline-offset-2 hover:text-[var(--lime)]"
              >
                Back to sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
