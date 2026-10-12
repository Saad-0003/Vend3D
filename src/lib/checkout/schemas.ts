import { z } from "zod";

import { phoneSchema, provinceSchema } from "@/lib/checkout/address";
import { SHIPPING_METHOD_IDS } from "@/lib/checkout/shipping";
import { cardNumberValid, cvcValid, detectBrand, expiryInFuture } from "@/lib/payment/card";

/**
 * Step schemas (plan.md Phase 9). Each step owns its own `useForm` so the
 * payment step's card fields are unmounted — and therefore destroyed — the
 * moment the shopper leaves it. See `checkout-screen.tsx`.
 */

const email = z.string().trim().min(1, "Email is required").email("Enter a valid email address");

const fullName = z
  .string()
  .trim()
  .min(2, "Full name is required")
  .max(80, "Keep the name under 80 characters");

const address = z
  .string()
  .trim()
  .min(6, "Street address is required")
  .max(200, "Keep the address under 200 characters");

const city = z.string().trim().min(2, "City is required").max(60, "Keep the city under 60 characters");

const postalCode = z
  .string()
  .trim()
  .max(12, "Keep the postal code under 12 characters")
  .optional()
  .or(z.literal(""));

export const detailsSchema = z.object({
  email,
  fullName,
  phone: phoneSchema,
  address,
  city,
  province: provinceSchema,
  postalCode,
  shippingMethodId: z.enum(SHIPPING_METHOD_IDS),
});

export type DetailsValues = z.infer<typeof detailsSchema>;

/**
 * Card number, expiry and CVC live only in the payment step's form state. The
 * shape carries them so the step can validate, but the values handed upward are
 * reduced to brand + last4 — the step resets its own form the moment it leaves.
 * All checks here are client-side only; nothing below ever crosses the wire.
 */
export const paymentSchema = z
  .object({
    cardNumber: z.string().trim().min(1, "Card number is required"),
    cardName: z
      .string()
      .trim()
      .min(2, "Cardholder name is required")
      .max(80, "Keep the name under 80 characters"),
    expiry: z.string().trim().min(1, "Expiry is required"),
    cvc: z.string().trim().min(1, "CVC is required"),
  })
  .superRefine((values, ctx) => {
    const brand = detectBrand(values.cardNumber);
    if (brand === null) {
      ctx.addIssue({ code: "custom", path: ["cardNumber"], message: "Visa or Mastercard only." });
    } else if (!cardNumberValid(values.cardNumber)) {
      ctx.addIssue({ code: "custom", path: ["cardNumber"], message: "This card number is not valid." });
    }

    if (!/^\d{2}\/\d{2}$/.test(values.expiry)) {
      ctx.addIssue({ code: "custom", path: ["expiry"], message: "Use MM/YY." });
    } else if (!expiryInFuture(values.expiry)) {
      ctx.addIssue({ code: "custom", path: ["expiry"], message: "Expiry must be a month in the future." });
    }

    if (!cvcValid(values.cvc)) {
      ctx.addIssue({ code: "custom", path: ["cvc"], message: "CVC is 3 digits." });
    }
  });

export type PaymentValues = z.infer<typeof paymentSchema>;

export const DEFAULT_DETAILS: DetailsValues = {
  email: "",
  fullName: "",
  phone: "",
  address: "",
  city: "",
  province: "Punjab",
  postalCode: "",
  shippingMethodId: "standard",
};

export const DEFAULT_PAYMENT: PaymentValues = {
  cardNumber: "",
  cardName: "",
  expiry: "",
  cvc: "",
};
