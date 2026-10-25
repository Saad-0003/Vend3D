import type { Metadata } from "next";

import { AuthStage } from "@/components/auth/auth-stage";
import { CheckEmailScreen } from "@/components/auth/check-email-screen";
import { PageShell } from "@/components/ui/page-shell";

export const metadata: Metadata = {
  title: "Check your inbox",
  description: "Finish signing in to Vend3D from the link we sent.",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ email?: string; next?: string }>;

/** Only ever echoes an address back as text, capped, never rendered as HTML. */
function displayEmail(raw: string | undefined): string {
  if (typeof raw !== "string") return "";
  const value = raw.trim().slice(0, 254);
  return value;
}

/**
 * `/auth/check-email` (plan.md Phase 1B U3) — after a mock sign-up and after
 * `/forgot-password`. Same split layout as the other auth pages, with the echo
 * of the entered address, a 30-second resend cooldown and the way back.
 */
export default async function CheckEmailPage({ searchParams }: { searchParams: SearchParams }) {
  const { email, next } = await searchParams;

  return (
    <PageShell aria-label="Check your inbox" className="lux">
      <div className="mx-auto grid w-full max-w-[1120px] items-stretch gap-10 lg:grid-cols-2">
        <AuthStage />

        <div className="flex flex-col justify-center">
          <div className="mx-auto flex w-full max-w-[400px] flex-col gap-7 rounded-[var(--card-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] p-6 [box-shadow:var(--inner-highlight)] sm:p-8">
            <header className="flex flex-col gap-2">
              <span className="lux-eyebrow text-[var(--lime)]">Account</span>
              <h1 className="lux-h2 lux-display text-[28px] text-[var(--ivory)]">Check your inbox</h1>
              <p className="text-[14px] leading-[1.6] text-[var(--muted)]">
                One click left — follow the link we sent.
              </p>
            </header>

            <CheckEmailScreen email={displayEmail(email)} next={next ?? null} />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
