"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { CheckoutProgress } from "@/components/checkout/checkout-progress";
import { DetailsStep } from "@/components/checkout/details-step";
import { OrderSummaryCard } from "@/components/checkout/order-summary-card";
import { PaymentStep } from "@/components/checkout/payment-step";
import { ReviewStep } from "@/components/checkout/review-step";
import type { StepError } from "@/components/checkout/step-error";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_DETAILS, type DetailsValues } from "@/lib/checkout/schemas";
import type { CardBrand } from "@/lib/payment/card";
import { useCartStore } from "@/stores/cart-store";
import { useOrdersStore } from "@/stores/orders-store";

/** EASE — the single curve the whole system animates on. */
const EASE = [0.22, 1, 0.36, 1] as const;

/** Demo feel only: no gateway is ever called, so the wait is theatre. */
const PLACE_ORDER_DELAY_MS = 1500;

/**
 * `/checkout` — three steps in one screen (plan.md Phase 9).
 *
 * The screen owns the validated values only: details, plus the two card facts
 * that survive a payment step (brand, last4). Each step owns its own form, so
 * leaving a step unmounts that form — the card fields physically cannot outlive
 * the payment step, which is the requirement plan.md puts on the money path.
 */
export function CheckoutScreen() {
  const router = useRouter();
  const reduced = useReducedMotion();

  const lines = useCartStore((s) => s.lines);
  const hydrated = useCartStore((s) => s.hydrated);
  const hydrate = useCartStore((s) => s.hydrate);
  const clearCart = useCartStore((s) => s.clear);
  const placeOrder = useOrdersStore((s) => s.placeOrder);

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [details, setDetails] = useState<DetailsValues>(DEFAULT_DETAILS);
  const [card, setCard] = useState<{ brand: CardBrand; last4: string } | null>(null);
  const [error, setError] = useState<StepError>(null);
  const [placing, setPlacing] = useState(false);

  const errorNonce = useRef(0);
  /** Set once an order is placed, so the empty-cart guard never fights the redirect. */
  const placedRef = useRef(false);
  /** One key per checkout attempt: a retry of the same submit must not double-order. */
  const checkoutKeyRef = useRef<string | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Guard: no cart, no checkout.
  useEffect(() => {
    if (!hydrated || placedRef.current) return;
    if (lines.length === 0) router.replace("/cart");
  }, [hydrated, lines.length, router]);

  function fail(message: string) {
    errorNonce.current += 1;
    setError({ message, nonce: errorNonce.current });
  }

  function goTo(next: number) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
    setError(null);
  }

  function handleDetailsNext(values: DetailsValues) {
    setDetails(values);
    goTo(1);
  }

  /** Keeps the order summary's shipping line live while the shopper picks one. */
  function handleShippingChange(shippingMethodId: DetailsValues["shippingMethodId"]) {
    setDetails((previous) => ({ ...previous, shippingMethodId }));
  }

  function handlePaymentNext(next: { brand: CardBrand; last4: string }) {
    setCard(next);
    goTo(2);
  }

  async function handlePlaceOrder() {
    if (placing) return;

    // Pre-flight so the button never spins for nothing.
    if (useCartStore.getState().lines.length === 0) {
      fail("Your cart is empty. Add something before placing the order.");
      return;
    }

    setPlacing(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, PLACE_ORDER_DELAY_MS));

      // Re-read: another tab may have emptied the cart during the wait.
      const { lines: placeLines } = useCartStore.getState();
      if (placeLines.length === 0) {
        fail("Your cart was emptied while this order was placing. Check your cart and try again.");
        return;
      }

      // The review step is only reachable through payment, so this is belt and
      // braces rather than a reachable branch.
      checkoutKeyRef.current ??= newCheckoutKey();

      const record = placeOrder({
        id: newOrderId(),
        checkoutKey: checkoutKeyRef.current,
        lines: placeLines,
        address: {
          fullName: details.fullName,
          email: details.email,
          phone: details.phone,
          address: details.address,
          city: details.city,
          province: details.province,
          postalCode: details.postalCode ?? "",
        },
        shippingMethodId: details.shippingMethodId,
        cardBrand: card?.brand ?? "VISA",
        cardLast4: card?.last4 ?? "0000",
      });

      // The order exists from here on. A storage failure clearing the cart must
      // not turn a placed order into an error message, so it is guarded and the
      // navigation still happens.
      placedRef.current = true;
      try {
        clearCart();
      } catch {
        // The in-memory cart is already empty; only cross-reload persistence was lost.
      }
      router.push(`/order/${record.id}`);
    } catch {
      fail("The order could not be placed. Nothing was charged — try again.");
    } finally {
      setPlacing(false);
    }
  }

  const ready = hydrated && lines.length > 0;

  return (
    <PageShell aria-label="Checkout" className="lux flex flex-col gap-10">
      <PageHeader
        eyebrow="Checkout"
        title="Checkout."
        intro="Three steps, one demo payment. Card details are checked in this browser and never leave it."
      />

      <CheckoutProgress current={step} />

      {!hydrated ? (
        <CheckoutSkeleton />
      ) : !ready ? (
        <Skeleton role="status" aria-label="Loading checkout" className="h-64 w-full rounded-[var(--card-radius)]" />
      ) : (
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,560px)_1fr]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={reduced ? { opacity: 0 } : { opacity: 0, x: direction * 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, x: direction * -24 }}
              transition={{ duration: reduced ? 0.25 : 0.35, ease: EASE }}
            >
              {step === 0 ? (
                <DetailsStep
                  defaultValues={details}
                  onNext={handleDetailsNext}
                  onShippingChange={handleShippingChange}
                  error={error}
                />
              ) : null}
              {step === 1 ? (
                <PaymentStep onNext={handlePaymentNext} onBack={() => goTo(0)} error={error} />
              ) : null}
              {step === 2 ? (
                <ReviewStep
                  details={details}
                  card={card ?? { brand: "VISA", last4: "0000" }}
                  placing={placing}
                  onBack={() => goTo(1)}
                  onPlaceOrder={handlePlaceOrder}
                  error={error}
                />
              ) : null}
            </motion.div>
          </AnimatePresence>

          <OrderSummaryCard lines={lines} shippingMethodId={details.shippingMethodId} />
        </div>
      )}
    </PageShell>
  );
}

function CheckoutSkeleton() {
  return (
    <div role="status" aria-label="Loading checkout" className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,560px)_1fr]">
      <div className="flex flex-col gap-5">
        <Skeleton className="h-8 w-48 rounded-[var(--inner-radius)]" />
        <Skeleton className="h-11 w-full rounded-[var(--inner-radius)]" />
        <Skeleton className="h-11 w-full rounded-[var(--inner-radius)]" />
        <Skeleton className="h-11 w-2/3 rounded-[var(--inner-radius)]" />
        <Skeleton className="h-12 w-40 rounded-full" />
      </div>
      <Skeleton className="h-72 w-full rounded-[var(--card-radius)]" />
    </div>
  );
}

function newOrderId(): string {
  return `ord-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function newCheckoutKey(): string {
  const webCrypto = globalThis.crypto;
  if (webCrypto && typeof webCrypto.randomUUID === "function") return webCrypto.randomUUID();
  return `ck-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
