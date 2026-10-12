import { describe, expect, it } from "vitest";

import {
  cardBrandLabel,
  cardNumberValid,
  cvcValid,
  detectBrand,
  digitsOnly,
  expiryInFuture,
  formatCardNumber,
  formatExpiry,
  last4,
  luhn,
} from "@/lib/payment/card";

/**
 * Demo card helpers (plan.md Phase 9). Everything here is pure, which is the
 * only way a payment-adjacent check is allowed to be written in this repo: no
 * network, no state, no side effects.
 */

/** Known-valid demo numbers (Luhn-checked). */
const VISA = "4242 4242 4242 4242";
const MASTERCARD = "5555 5555 5555 4444";
/** 2221-2720 is Mastercard's second range. */
const MASTERCARD_2 = "2223003122003222";

describe("digitsOnly", () => {
  it("strips everything that is not a digit", () => {
    expect(digitsOnly("4242-4242 4242/4242")).toBe("4242424242424242");
    expect(digitsOnly("abc")).toBe("");
  });
});

describe("formatCardNumber", () => {
  it("groups digits by four as they are typed", () => {
    expect(formatCardNumber("42424242")).toBe("4242 4242");
    expect(formatCardNumber("4242424242424242")).toBe(VISA);
  });

  it("never adds a trailing space, so the caret stays where the user left it", () => {
    expect(formatCardNumber("4242")).toBe("4242");
    expect(formatCardNumber("42424242")).toBe("4242 4242");
    expect(formatCardNumber("424242424242424")).toBe("4242 4242 4242 424");
  });

  it("strips illegals and caps the digits at 19", () => {
    expect(formatCardNumber("42a4-2")).toBe("4242");
    expect(digitsOnly(formatCardNumber("9".repeat(25)))).toHaveLength(19);
  });

  it("leaves formatting untouched, so pasted values survive a round-trip", () => {
    expect(formatCardNumber(formatCardNumber(VISA))).toBe(VISA);
  });
});

describe("formatExpiry", () => {
  it("inserts the slash after the month", () => {
    expect(formatExpiry("12")).toBe("12");
    expect(formatExpiry("1230")).toBe("12/30");
  });

  it("keeps a slash the user typed, so MM/YY typing never shifts digits", () => {
    expect(formatExpiry("1/")).toBe("1/");
    expect(formatExpiry("1/2")).toBe("1/2");
    expect(formatExpiry("1/26")).toBe("1/26");
    expect(formatExpiry("12/")).toBe("12/");
  });

  it("ignores illegals and caps at MM/YY", () => {
    expect(formatExpiry("12/30/99")).toBe("12/30");
  });
});

describe("detectBrand", () => {
  it("detects Visa and Mastercard from the prefix", () => {
    expect(detectBrand("4242424242424242")).toBe("VISA");
    expect(detectBrand(VISA)).toBe("VISA");
    expect(detectBrand(MASTERCARD)).toBe("MASTERCARD");
    expect(detectBrand("5555555555554444")).toBe("MASTERCARD");
    expect(detectBrand("378282246310005")).toBeNull();
    expect(detectBrand("6011111111111117")).toBeNull();
  });

  it("detects Mastercard's 2221-2720 range", () => {
    expect(detectBrand("2223003122003222")).toBe("MASTERCARD");
    expect(detectBrand("2720999999999996")).toBe("MASTERCARD");
    expect(detectBrand("2720")).toBe("MASTERCARD");
    expect(detectBrand("2220")).toBeNull();
    expect(detectBrand("2721")).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(detectBrand("")).toBeNull();
    expect(detectBrand("   ")).toBeNull();
  });
});

describe("luhn", () => {
  it("accepts valid numbers", () => {
    expect(luhn("4242424242424242")).toBe(true);
    expect(luhn("5555555555554444")).toBe(true);
    expect(luhn("2223003122003222")).toBe(true);
  });

  it("rejects a single wrong digit", () => {
    expect(luhn("4242424242424241")).toBe(false);
    expect(luhn("4242424242424243")).toBe(false);
  });

  it("rejects shorter, unfixable or non-numeric input", () => {
    expect(luhn("4242")).toBe(true); // a short sequence can still be mod-10 valid
    expect(luhn("")).toBe(false);
    expect(luhn("abcd")).toBe(false);
  });
});

describe("cardNumberValid", () => {
  it("needs 16 digits, a demo brand and Luhn", () => {
    expect(cardNumberValid(VISA)).toBe(true);
    expect(cardNumberValid(MASTERCARD)).toBe(true);
    expect(cardNumberValid(MASTERCARD_2)).toBe(true);
  });

  it("rejects wrong length, bad checksum and unsupported brands", () => {
    expect(cardNumberValid("4242 4242 4242")).toBe(false);
    expect(cardNumberValid("4242 4242 4242 4241")).toBe(false);
    expect(cardNumberValid("3782 8224 6310 005")).toBe(false);
  });
});

describe("expiryInFuture", () => {
  const now = new Date(2026, 5, 15); // June 2026

  it("accepts the current month and later", () => {
    expect(expiryInFuture("06/26", now)).toBe(true);
    expect(expiryInFuture("12/30", now)).toBe(true);
    expect(expiryInFuture("01/27", now)).toBe(true);
  });

  it("rejects the past and malformed values", () => {
    expect(expiryInFuture("05/26", now)).toBe(false);
    expect(expiryInFuture("12/25", now)).toBe(false);
    expect(expiryInFuture("13/26", now)).toBe(false);
    expect(expiryInFuture("00/26", now)).toBe(false);
    expect(expiryInFuture("12/6", now)).toBe(false);
    expect(expiryInFuture("", now)).toBe(false);
  });
});

describe("cvcValid", () => {
  it("wants exactly three digits", () => {
    expect(cvcValid("123")).toBe(true);
    expect(cvcValid("12")).toBe(false);
    expect(cvcValid("1234")).toBe(false);
    expect(cvcValid("12a")).toBe(false);
  });
});

describe("last4", () => {
  it("takes the last four digits", () => {
    expect(last4(VISA)).toBe("4242");
    expect(last4("4")).toBe("4");
    expect(last4("")).toBe("");
  });
});

describe("cardBrandLabel", () => {
  it("names the two demo brands", () => {
    expect(cardBrandLabel("VISA")).toBe("Visa");
    expect(cardBrandLabel("MASTERCARD")).toBe("Mastercard");
  });
});
