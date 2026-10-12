"use client";

import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { CreditCard, MapPin, Truck } from "lucide-react";
import { z } from "zod";

import { StepFrame } from "@/components/checkout/step-frame";
import { StepErrorBanner, type StepError } from "@/components/checkout/step-error";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { formatCents } from "@/lib/format";
import { getShippingMethod } from "@/lib/checkout/shipping";
import { cardBrandLabel, type CardBrand } from "@/lib/payment/card";

/**
 * Step 3 — Review. Everything entered, one last terms checkbox, and the only
 * place an order is created from. The card fields are long gone; what is shown
 * is brand + last4, which is all that was ever persisted.
 */

/**
 * The checkbox starts unchecked, so the form's value type is `boolean`; the
 * refinement is what makes "must be true" a validation rule rather than a type
 * the form cannot reach in the first place.
 */
const reviewSchema = z
  .object({ terms: z.boolean() })
  .refine((values) => values.terms === true, {
    message: "Please accept the terms to place the order.",
    path: ["terms"],
  });

type ReviewFormValues = z.infer<typeof reviewSchema>;

export function ReviewStep({
  details,
  card,
  placing,
  onBack,
  onPlaceOrder,
  error,
}: {
  details: ReviewDetails;
  card: { brand: CardBrand; last4: string };
  placing: boolean;
  onBack: () => void;
  onPlaceOrder: () => void;
  error: StepError;
}) {
  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { terms: false },
  });
  const shipping = getShippingMethod(details.shippingMethodId);

  return (
    <Form {...form}>
      <form
        noValidate
        aria-live="polite"
        onSubmit={form.handleSubmit(onPlaceOrder)}
        className="flex flex-col gap-7"
      >
        <StepFrame
          title="Review and place"
          description="Check the details below, then place the order. Nothing is charged — this is a demo payment."
          error={<StepErrorBanner error={error} />}
          actions={
            <>
              <Button
                type="button"
                onClick={onBack}
                disabled={placing}
                variant="ghost"
                className="h-11 rounded-full px-5 text-[var(--ivory)] ring-1 ring-[var(--hairline-strong)] hover:bg-[var(--surface-2)]"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={placing}
                className="h-12 rounded-full bg-[var(--lime)] px-7 text-[15px] font-medium text-[var(--ink)] hover:bg-[var(--lime)]/90"
              >
                {placing ? (
                  <>
                    <Spinner />
                    Placing order…
                  </>
                ) : (
                  "Place order"
                )}
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-3">
            <ReviewRow icon={<MapPin className="size-4" strokeWidth={1.5} aria-hidden />} label="Contact">
              <span className="text-[var(--ivory)]">{details.email}</span>
              <span className="text-[var(--muted)]">{details.phone}</span>
            </ReviewRow>

            <ReviewRow icon={<MapPin className="size-4" strokeWidth={1.5} aria-hidden />} label="Ship to">
              <span className="text-[var(--ivory)]">{details.fullName}</span>
              <span className="text-[var(--muted)]">
                {details.address}, {details.city}, {details.province}
                {details.postalCode ? ` ${details.postalCode}` : ""}
              </span>
            </ReviewRow>

            <ReviewRow icon={<Truck className="size-4" strokeWidth={1.5} aria-hidden />} label="Shipping">
              <span className="text-[var(--ivory)]">
                {shipping?.label ?? details.shippingMethodId} · {shipping?.eta ?? "—"}
              </span>
              <span className="lux-mono lux-tabular text-[var(--muted)]">
                {shipping && shipping.priceCents === 0 ? "Free" : shipping ? formatCents(shipping.priceCents) : "—"}
              </span>
            </ReviewRow>

            <ReviewRow icon={<CreditCard className="size-4" strokeWidth={1.5} aria-hidden />} label="Payment">
              <span className="text-[var(--ivory)]">
                {cardBrandLabel(card.brand)} ending {card.last4}
              </span>
              <span className="text-[var(--muted)]">Demo payment, no real charge</span>
            </ReviewRow>
          </div>

          <FormField
            control={form.control}
            name="terms"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-start gap-3 rounded-[var(--inner-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] p-4">
                  <FormControl>
                    <Checkbox
                      id="review-terms"
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                      aria-describedby="review-terms-message"
                    />
                  </FormControl>
                  <div className="flex flex-col gap-1">
                    <FormLabel htmlFor="review-terms" className="text-[13px] leading-[1.5] text-[var(--ivory)]">
                      I understand this is a demo order and that no real payment is taken.
                    </FormLabel>
                    <p id="review-terms-message" className="text-[12px] text-[var(--muted)]">
                      Placing the order creates a demo order record and clears the cart.{" "}
                      <Link href="/shop" className="underline hover:text-[var(--ivory)]">
                        Keep shopping
                      </Link>{" "}
                      instead.
                    </p>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </StepFrame>
      </form>
    </Form>
  );
}

function ReviewRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-4 rounded-[var(--inner-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] p-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--lime)] ring-1 ring-[var(--hairline)]">
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="lux-mono text-[11px] tracking-[0.16em] text-[var(--muted)] uppercase">{label}</span>
        <div className="flex flex-col gap-0.5 text-[14px]">{children}</div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="size-4 animate-spin rounded-full border-2 border-[var(--ink)]/30 border-t-[var(--ink)]"
    />
  );
}

/** The subset of DetailsValues the review screen shows. */
export type ReviewDetails = {
  email: string;
  phone: string;
  fullName: string;
  address: string;
  city: string;
  province: string;
  postalCode?: string;
  shippingMethodId: string;
};
