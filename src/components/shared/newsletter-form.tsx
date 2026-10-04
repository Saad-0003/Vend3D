"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * The dispatch bulletin has no backend in the MVP (`plan.md` §3 puts email
 * sending out of scope), so the form validates locally and says so plainly
 * instead of pretending an address was stored.
 */
export function NewsletterForm() {
  const [email, setEmail] = useState("");

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        toast("The dispatch bulletin is not wired up yet — nothing was stored.", {
          description: "Email sending is out of scope for the MVP.",
        });
      }}
    >
      <Input
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="engineer@domi"
        aria-label="Email address"
        className="border-foreground/10 bg-foreground/[0.04] h-10 flex-1 rounded-full"
      />
      <Button
        type="submit"
        className="bg-signal text-on-signal hover:bg-signal/90 h-10 rounded-full px-5"
      >
        Join
      </Button>
    </form>
  );
}
