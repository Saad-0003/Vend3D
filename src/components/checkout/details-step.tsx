"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PROVINCES } from "@/lib/checkout/address";
import { detailsSchema, type DetailsValues } from "@/lib/checkout/schemas";
import { SHIPPING_METHODS, SHIPPING_TODO_NOTE } from "@/lib/checkout/shipping";
import { formatCents } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Step 1 — Details. Owns its form so the values live only while the step is
 * mounted; validated values are handed up and the form is discarded. The
 * shipping choice is reported as it is picked so the order summary stays live.
 */
export function DetailsStep({
  defaultValues,
  onNext,
  onShippingChange,
  error,
}: {
  defaultValues: DetailsValues;
  onNext: (values: DetailsValues) => void;
  onShippingChange: (shippingMethodId: DetailsValues["shippingMethodId"]) => void;
  error: StepError;
}) {
  const form = useForm<DetailsValues>({
    resolver: zodResolver(detailsSchema),
    defaultValues,
  });
  const shippingMethodId = form.watch("shippingMethodId");

  return (
    <Form {...form}>
      <form
        noValidate
        aria-live="polite"
        onSubmit={form.handleSubmit(onNext)}
        className="flex flex-col gap-7"
      >
        <StepFrame
          title="Where should it go?"
          description="We only need enough to print, pack and dispatch. Nothing here is used for anything else."
          error={<StepErrorBanner error={error} />}
          actions={
            <>
              <Button asChild variant="ghost" className="h-11 rounded-full px-5 text-[var(--ivory)] ring-1 ring-[var(--hairline-strong)] hover:bg-[var(--surface-2)]">
                <Link href="/cart">Back to cart</Link>
              </Button>
              <Button type="submit" className="h-11 rounded-full bg-[var(--lime)] px-6 text-[15px] font-medium text-[var(--ink)] hover:bg-[var(--lime)]/90">
                Continue to payment
              </Button>
            </>
          }
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel className="text-[13px] text-[var(--muted)]">Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      className="h-11"
                    />
                  </FormControl>
                  <FormDescription className="text-[12px]">
                    Order updates go here — no newsletter, no marketing.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel className="text-[13px] text-[var(--muted)]">Full name</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="name" placeholder="Ayesha Khan" className="h-11" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel className="text-[13px] text-[var(--muted)]">Phone</FormLabel>
                  <FormControl>
                    <Input {...field} type="tel" inputMode="tel" autoComplete="tel" placeholder="+92 300 1234567" className="h-11" />
                  </FormControl>
                  <FormDescription className="text-[12px]">Use the country code, e.g. +92 for Pakistan.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel className="text-[13px] text-[var(--muted)]">Street address</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="street-address" placeholder="House 12, Street 4, Gulberg" className="h-11" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] text-[var(--muted)]">City</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="address-level2" placeholder="Lahore" className="h-11" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="province"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] text-[var(--muted)]">Province</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11 w-full rounded-lg" aria-label="Province">
                        <SelectValue placeholder="Select a province" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-lg">
                      {PROVINCES.map((province) => (
                        <SelectItem key={province} value={province}>
                          {province}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="postalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] text-[var(--muted)]">
                    Postal code <span className="text-[var(--faint)]">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="postal-code" placeholder="54000" className="h-11" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <fieldset className="flex flex-col gap-4">
            <legend className="lux-mono text-[11px] tracking-[0.16em] text-[var(--muted)] uppercase">
              Shipping method
            </legend>
            <RadioGroup
              value={shippingMethodId}
              onValueChange={(value) => {
                const next = value as DetailsValues["shippingMethodId"];
                form.setValue("shippingMethodId", next, { shouldValidate: true });
                onShippingChange(next);
              }}
              className="gap-3"
              aria-label="Shipping method"
            >
              {SHIPPING_METHODS.map((method) => {
                const selected = shippingMethodId === method.id;
                return (
                  <label
                    key={method.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-4 rounded-[var(--inner-radius)] border border-[var(--hairline)] bg-[var(--surface-1)] p-4 transition-colors duration-300",
                      selected
                        ? "border-[color-mix(in_srgb,var(--lime)_45%,transparent)] bg-[var(--surface-2)]"
                        : "hover:border-[var(--hairline-strong)]",
                    )}
                  >
                    <RadioGroupItem
                      value={method.id}
                      id={`shipping-${method.id}`}
                      aria-label={`${method.label} — ${method.eta} — ${formatCents(method.priceCents)}`}
                    />
                    <span className="flex flex-1 flex-col gap-0.5">
                      <span className="type-title-md text-[var(--ivory)]">{method.label}</span>
                      <span className="text-[13px] text-[var(--muted)]">{method.eta}</span>
                    </span>
                    <span className="lux-mono lux-tabular text-[14px] text-[var(--ivory)]">
                      {method.priceCents === 0 ? "Free" : formatCents(method.priceCents)}
                    </span>
                  </label>
                );
              })}
            </RadioGroup>
            <p className="text-[12px] text-[var(--faint)]">{SHIPPING_TODO_NOTE}</p>
          </fieldset>
        </StepFrame>
      </form>
    </Form>
  );
}
