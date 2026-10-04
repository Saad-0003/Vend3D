import type { Metadata } from "next";
import Link from "next/link";
import { PagePlaceholder } from "@/components/shared/page-placeholder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <PagePlaceholder
      eyebrow="Account"
      title="Create your account"
      description="One account for designs, cart and order history. Email confirmation behaviour is documented in the README from Phase 3."
    >
      <form className="flex w-full max-w-sm flex-col gap-4" action="#">
        <label className="flex flex-col gap-2" htmlFor="signup-name">
          <span className="type-label-md text-muted-foreground">Display name</span>
          <Input
            id="signup-name"
            name="displayName"
            type="text"
            autoComplete="name"
            placeholder="Alex"
          />
        </label>
        <label className="flex flex-col gap-2" htmlFor="signup-email">
          <span className="type-label-md text-muted-foreground">Email</span>
          <Input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
          />
        </label>
        <label className="flex flex-col gap-2" htmlFor="signup-password">
          <span className="type-label-md text-muted-foreground">Password</span>
          <Input
            id="signup-password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
          />
        </label>
        <Button type="submit" disabled className="h-11 rounded-full px-8">
          Create account
        </Button>
        <p className="type-body-md text-muted-foreground">
          Already registered?{" "}
          <Link href="/login" className="text-foreground hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </PagePlaceholder>
  );
}
