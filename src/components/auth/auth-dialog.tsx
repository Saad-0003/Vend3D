"use client";

import Link from "next/link";
import { toast } from "sonner";

import { AuthForm } from "@/components/auth/auth-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * The navbar's sign-in dialog. Radix `Tabs` with `variant="line"` already ships
 * the sliding underline (an `after:` pseudo-element that fades in on the active
 * trigger), so the "sliding underline" in the brief is a variant choice rather
 * than bespoke motion.
 *
 * On success it toasts "Welcome back." — the one piece of feedback the dialog
 * owes a shopper it then dismisses — and lands on `/account`. The `?next=`
 * contract lives on the full pages, which read `next` server-side; the dialog
 * is opened from the navbar on any route, where `/account` is the default.
 */
export function AuthDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  function handleSuccess() {
    toast.success("Welcome back.");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="lux gap-5 rounded-[var(--card-radius)] border-[var(--hairline)] bg-[var(--surface-1)] p-6 [box-shadow:var(--inner-highlight)] sm:max-w-[400px]">
        <DialogHeader className="gap-1">
          <DialogTitle className="lux-display text-[20px] text-[var(--ivory)]">
            Welcome to Vend3D
          </DialogTitle>
          <DialogDescription className="text-[13px] text-[var(--muted)]">
            Sign in to keep your designs and orders. This demo stores your session in this browser
            only.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="signin" className="gap-5">
          <TabsList
            variant="line"
            className="w-full justify-start gap-5 border-b border-[var(--hairline)] p-0"
          >
            <TabsTrigger value="signin" className="px-0 text-[13px]">
              Sign in
            </TabsTrigger>
            <TabsTrigger value="signup" className="px-0 text-[13px]">
              Create account
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="flex flex-col gap-4">
            <AuthForm mode="signin" onSuccess={handleSuccess} submitLabel="Sign in" />
          </TabsContent>

          <TabsContent value="signup" className="flex flex-col gap-4">
            <AuthForm mode="signup" onSuccess={handleSuccess} submitLabel="Create account" />
          </TabsContent>
        </Tabs>

        <p className="text-center text-[12px] text-[var(--muted)]">
          Prefer more room?{" "}
          <Link
            href="/login"
            className="text-[var(--ivory)] underline underline-offset-2 hover:text-[var(--lime)]"
          >
            Open full page
          </Link>
        </p>
      </DialogContent>
    </Dialog>
  );
}
