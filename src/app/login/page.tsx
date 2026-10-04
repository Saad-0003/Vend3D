import type { Metadata } from "next";
import Link from "next/link";
import { PagePlaceholder } from "@/components/shared/page-placeholder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <PagePlaceholder
      eyebrow="Account"
      title="Sign in"
      description="Email and password plus Google OAuth, both handled by Supabase Auth. Phase 3 wires this form."
    >
      <form className="flex w-full max-w-sm flex-col gap-4" action="#">
        <label className="flex flex-col gap-2" htmlFor="login-email">
          <span className="type-label-md text-muted-foreground">Email</span>
          <Input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
          />
        </label>
        <label className="flex flex-col gap-2" htmlFor="login-password">
          <span className="type-label-md text-muted-foreground">Password</span>
          <Input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </label>
        <Button type="submit" disabled className="h-11 rounded-full px-8">
          Sign in
        </Button>
        <p className="type-body-md text-muted-foreground">
          No account yet?{" "}
          <Link href="/signup" className="text-foreground hover:underline">
            Create one
          </Link>
        </p>
      </form>
    </PagePlaceholder>
  );
}
