"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { InfoNote } from "@/components/info/info-blocks";

/**
 * `/contact` form. Validation is local and nothing is sent: `plan.md` keeps
 * email out of scope for the MVP, so the form says so instead of pretending a
 * message was delivered.
 */
export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const complete = name.trim() !== "" && email.trim() !== "" && message.trim() !== "";

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!complete) return;
        toast.success("Message ready to send", {
          description: "Nothing was sent — the contact form has no backend yet.",
        });
        setName("");
        setEmail("");
        setMessage("");
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="contact-name" className="lux-mono text-[11px] tracking-[0.16em] text-[var(--muted)] uppercase">
            Name
          </Label>
          <Input
            id="contact-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            className="h-11 rounded-full border-[var(--hairline)] bg-[var(--surface-2)] px-4 text-[var(--ivory)]"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="contact-email" className="lux-mono text-[11px] tracking-[0.16em] text-[var(--muted)] uppercase">
            Email
          </Label>
          <Input
            id="contact-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            className="h-11 rounded-full border-[var(--hairline)] bg-[var(--surface-2)] px-4 text-[var(--ivory)]"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="contact-message" className="lux-mono text-[11px] tracking-[0.16em] text-[var(--muted)] uppercase">
          Message
        </Label>
        <Textarea
          id="contact-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={5}
          className="rounded-[var(--inner-radius)] border-[var(--hairline)] bg-[var(--surface-2)] px-4 py-3 text-[var(--ivory)]"
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button
          type="submit"
          disabled={!complete}
          className="h-11 rounded-full bg-[var(--lime)] px-6 text-[var(--ink)] hover:bg-[var(--lime)]/90"
        >
          Send message
        </Button>
        <p className="text-[13px] text-[var(--muted)]">No account needed to ask.</p>
      </div>

      <InfoNote body={<>TODO: confirm with owner — this form has no backend yet, so nothing is stored or sent.</>} />
    </form>
  );
}
