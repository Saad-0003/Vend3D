"use client";

import { useId } from "react";
import type { FieldValues, Path, UseFormRegister } from "react-hook-form";

import { Input } from "@/components/ui/input";

/**
 * Floating label: the label sits inside the field and lifts on focus or once
 * the input has content, using `:placeholder-shown` (so it needs a
 * whitespace placeholder). `htmlFor`/`id` keep it a real label, which is what
 * makes this keyboard- and screen-reader-accessible rather than decorative.
 *
 * Generic over the form's values so the auth form, the forgot-password form
 * and future auth-adjacent forms can't drift apart (DESIGN.md rule 3). The
 * markup moved out of `auth-form.tsx` unchanged when the forgot-password form
 * needed the same field (move, not copy — D-035's precedent).
 */
export function FloatingField<TFieldValues extends FieldValues>({
  name,
  label,
  type = "text",
  inputMode,
  autoComplete,
  register,
  error,
  hint,
  trailing,
}: {
  name: Path<TFieldValues>;
  label: string;
  type?: string;
  inputMode?: "email" | "tel" | "numeric";
  autoComplete?: string;
  register: UseFormRegister<TFieldValues>;
  error?: string;
  hint?: string;
  trailing?: React.ReactNode;
}) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative">
        <Input
          {...register(name)}
          id={id}
          name={name}
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          placeholder=" "
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`h-13 peer rounded-[var(--inner-radius)] pt-4 pb-1.5 text-[15px] ${trailing ? "pr-12" : ""}`}
        />
        <label
          htmlFor={id}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 px-1 text-[13px] text-[var(--muted)] transition-all duration-200 peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-[10px] peer-focus:tracking-[0.14em] peer-focus:uppercase peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:tracking-[0.14em] peer-[:not(:placeholder-shown)]:uppercase"
        >
          {label}
        </label>
        {trailing ? (
          <span className="absolute top-1/2 right-2 -translate-y-1/2">{trailing}</span>
        ) : null}
      </div>

      {error ? (
        <p id={`${id}-error`} className="px-1 text-[12px] leading-[1.4] text-[var(--destructive)]">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="px-1 text-[12px] leading-[1.4] text-[var(--muted)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
