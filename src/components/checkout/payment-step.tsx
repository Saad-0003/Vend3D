"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck } from "lucide-react";

import { DemoCardPreview } from "@/components/checkout/demo-card-preview";
import { StepFrame } from "@/components/checkout/step-frame";
import { StepErrorBanner, type StepError } from "@/components/checkout/step-error";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DEFAULT_PAYMENT, paymentSchema, type PaymentValues } from "@/lib/checkout/schemas";
import {
  cardBrandLabel,
  digitsOnly,
  detectBrand,
  formatCardNumber,
  formatExpiry,
  last4,
  type CardBrand,
} from "@/lib/payment/card";

/**
 * Step 2 — Payment.
 *
 * This component owns the card fields' state, which is the whole point: it is
 * unmounted the moment the shopper leaves the step, and it also resets its own
 * form on a valid submit, so no card number, expiry or CVC outlives the step
 * (plan.md Phase 9: "Card data stays in the browser"). Only brand + last4 go
 * upward, and those are the only two facts that ever reach the order record.
 *
 * There is no gateway to call. Luhn, expiry and CVC checks are client-side only.
 */
export function PaymentStep({
  onNext,
  onBack,
  error,
}: {
  onNext: (card: { brand: CardBrand; last4: string }) => void;
  onBack: () => void;
  error: StepError;
}) {
  const form = useForm<PaymentValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: DEFAULT_PAYMENT,
    mode: "onBlur",
  });
  const [flip, setFlip] = useState(false);

  const values = form.watch();
  const brand = detectBrand(values.cardNumber);

  function submit(values: PaymentValues) {
    const detected = detectBrand(values.cardNumber);
    if (!detected) return;
    onNext({ brand: detected, last4: last4(values.cardNumber) });
    // Drop the card data at the same instant the step is left, before the exit
    // animation even finishes.
    form.reset(DEFAULT_PAYMENT);
  }

  return (
    <Form {...form}>
      <form
        noValidate
        aria-live="polite"
        onSubmit={form.handleSubmit(submit)}
        className="flex flex-col gap-7"
      >
        <StepFrame
          title="Demo payment"
          description="Type a test card — the checks run in this browser only. Nothing is charged and nothing is stored."
          error={<StepErrorBanner error={error} />}
          actions={
            <>
              <Button
                type="button"
                onClick={onBack}
                variant="ghost"
                className="h-11 rounded-full px-5 text-[var(--ivory)] ring-1 ring-[var(--hairline-strong)] hover:bg-[var(--surface-2)]"
              >
                Back
              </Button>
              <Button
                type="submit"
                className="h-11 rounded-full bg-[var(--lime)] px-6 text-[15px] font-medium text-[var(--ink)] hover:bg-[var(--lime)]/90"
              >
                Continue to review
              </Button>
            </>
          }
        >
          <DemoCardPreview
            number={values.cardNumber}
            name={values.cardName}
            expiry={values.expiry}
            cvc={values.cvc}
            flipped={flip}
            brand={brand}
          />

          {/* Persistent banner — always visible while the payment step is open. */}
          <div className="flex items-start gap-3 rounded-[var(--inner-radius)] border border-[color-mix(in_srgb,var(--lime)_28%,transparent)] bg-[var(--lime-glow)] px-4 py-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--lime)]" strokeWidth={1.5} aria-hidden />
            <p className="text-[13px] leading-[1.5] text-[var(--ivory)]">
              <span className="font-medium">Demo payment, no real charge.</span> Card details are checked in
              this browser and are never stored, sent or logged.
            </p>
          </div>

          <p className="sr-only" aria-live="polite">
            {brand ? `${cardBrandLabel(brand)} detected` : ""}
          </p>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="cardNumber"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel className="text-[13px] text-[var(--muted)]">Card number</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      inputMode="numeric"
                      autoComplete="cc-number"
                      placeholder="4242 4242 4242 4242"
                      maxLength={19}
                      className="h-11"
                      onChange={(event) => field.onChange(formatCardNumber(event.target.value))}
                      onBlur={field.onBlur}
                    />
                  </FormControl>
                  <FormDescription className="text-[12px]">
                    Visa or Mastercard. Try 4242 4242 4242 4242 for a working demo card.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cardName"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel className="text-[13px] text-[var(--muted)]">Cardholder name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete="cc-name"
                      placeholder="AYESHA KHAN"
                      maxLength={80}
                      className="h-11"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expiry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] text-[var(--muted)]">Expiry</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      placeholder="MM/YY"
                      maxLength={5}
                      className="h-11"
                      onChange={(event) => field.onChange(formatExpiry(event.target.value))}
                      onBlur={field.onBlur}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cvc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] text-[var(--muted)]">CVC</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      placeholder="123"
                      maxLength={3}
                      className="h-11"
                      onChange={(event) => field.onChange(digitsOnly(event.target.value).slice(0, 3))}
                      onFocus={() => setFlip(true)}
                      onBlur={() => {
                        setFlip(false);
                        field.onBlur();
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

        </StepFrame>
      </form>
    </Form>
  );
}
