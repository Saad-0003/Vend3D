import type { Metadata } from "next";

import { AuthStage } from "@/components/auth/auth-stage";
import { AuthForm } from "@/components/auth/auth-form";
import { PageShell } from "@/components/ui/page-shell";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Vend3D to keep your designs and orders.",
};

type SearchParams = Promise<{ next?: string }>;

/**
 * `/login` — split layout (plan.md Phase 3). Left half: a dark stage with the
 * slowly rotating product and the landing line. Right half: the form card.
 *
 * The form is the client island; this page stays a server component and carries
 * the `?next=` value through to sign-up so the round trip survives the hop.
 */
export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const { next } = await searchParams;
  // Sanitised here as well as in the form's success handler: the page can be
  // linked directly with an attacker-supplied `next`.
  const target = next && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : "/account";

  return (
    <PageShell aria-label="Sign in" className="lux">
      <div className="mx-auto grid w-full max-w-[1120px] items-stretch gap-10 lg:grid-cols-2">
        <AuthStage />

        <div className="flex flex-col justify-center">
          <div className="mx-auto flex w-full max-w-[400px] flex-col gap-7 rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] p-6 [box-shadow:var(--inner-highlight)] sm:p-8">
            <header className="flex flex-col gap-2">
              <span className="lux-eyebrow text-[var(--lime)]">Account</span>
              <h1 className="lux-h2 lux-display text-[28px] text-[var(--ivory)]">Sign in</h1>
              <p className="text-[14px] leading-[1.6] text-[var(--muted)]">
                This demo keeps your session in this browser — no server account yet.
              </p>
            </header>

            <AuthForm mode="signin" next={target} />

            <p className="text-center text-[13px] text-[var(--muted)]">
              No account yet?{" "}
              {/* A plain anchor, deliberately not `next/link`: a soft navigation
                  renders the target page from the flight payload before its JS
                  hydrates, and a submit that lands in that window does nothing at
                  all. A document load always yields an interactive page. */}
              <a
                href={`/signup?next=${encodeURIComponent(target)}`}
                className="text-[var(--ivory)] underline underline-offset-2 hover:text-[var(--lime)]"
              >
                Create one
              </a>
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
