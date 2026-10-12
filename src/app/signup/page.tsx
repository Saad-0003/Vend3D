import type { Metadata } from "next";

import { AuthStage } from "@/components/auth/auth-stage";
import { AuthForm } from "@/components/auth/auth-form";
import { PageShell } from "@/components/ui/page-shell";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a Vend3D account to keep your designs and orders.",
};

type SearchParams = Promise<{ next?: string }>;

/**
 * `/signup` — the same split layout as `/login`, with the sign-up field set
 * (name + confirm password). Shares the form, the stage and the `?next=`
 * contract so the two pages cannot drift.
 */
export default async function SignUpPage({ searchParams }: { searchParams: SearchParams }) {
  const { next } = await searchParams;
  // Sanitised here as well as in the form's success handler: the page can be
  // linked directly with an attacker-supplied `next`.
  const target = next && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : "/account";

  return (
    <PageShell aria-label="Create account" className="lux">
      <div className="mx-auto grid w-full max-w-[1120px] items-stretch gap-10 lg:grid-cols-2">
        <AuthStage />

        <div className="flex flex-col justify-center">
          <div className="mx-auto flex w-full max-w-[400px] flex-col gap-7 rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] p-6 [box-shadow:var(--inner-highlight)] sm:p-8">
            <header className="flex flex-col gap-2">
              <span className="lux-eyebrow text-[var(--lime)]">Account</span>
              <h1 className="lux-h2 lux-display text-[28px] text-[var(--ivory)]">Create account</h1>
              <p className="text-[14px] leading-[1.6] text-[var(--muted)]">
                This demo keeps your session in this browser — no server account yet.
              </p>
            </header>

            <AuthForm mode="signup" next={target} />

            <p className="text-center text-[13px] text-[var(--muted)]">
              Already have an account?{" "}
              {/* A plain anchor for the same reason as `/login`'s: a soft
                  navigation can land the shopper on a page whose form is not yet
                  interactive, and a click in that window does nothing. */}
              <a
                href={`/login?next=${encodeURIComponent(target)}`}
                className="text-[var(--ivory)] underline underline-offset-2 hover:text-[var(--lime)]"
              >
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
