/**
 * Demo-card helpers (plan.md Phase 9). Everything here is pure and client-only:
 * the card number, expiry and CVC never cross the wire, so there is nothing to
 * validate server-side. Only `detectBrand` and `last4` results persist, and
 * they are the only two facts `placeOrder` is ever allowed to see.
 */

export type CardBrand = "VISA" | "MASTERCARD";

/** Digits only, from whatever the user typed or pasted. */
export function digitsOnly(value: string): string {
  return value.replace(/\D+/g, "");
}

/** "4242424242424242" -> "4242 4242 4242 4242", capped at 19 digits (16 + 3 spaces). */
export function formatCardNumber(value: string): string {
  return digitsOnly(value)
    .slice(0, 19)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

/**
 * Keeps a slash the user typed, so typing "1/26" never shifts the month to 12.
 * Without a slash it inserts one after the second digit, which is the standard
 * MM/YY typing flow.
 */
export function formatExpiry(value: string): string {
  const raw = value.slice(0, 5);
  const slash = raw.indexOf("/");
  if (slash >= 0) {
    const month = digitsOnly(raw.slice(0, slash)).slice(0, 2);
    const year = digitsOnly(raw.slice(slash + 1)).slice(0, 2);
    return year ? `${month}/${year}` : `${month}/`;
  }
  const digits = digitsOnly(raw).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

/**
 * Visa: 4.<br>
 * Mastercard: 51-55 or 2221-2720.
 * Unknown or non-demo-brand prefixes return null, which the form reports as an
 * unsupported card rather than a malformed one.
 */
export function detectBrand(value: string): CardBrand | null {
  const digits = digitsOnly(value);
  if (digits.length === 0) return null;
  if (digits[0] === "4") return "VISA";
  if (/^5[1-5]/.test(digits)) return "MASTERCARD";
  // Mastercard's second range is the first four digits, 2221-2720.
  if (digits.length >= 4) {
    const prefix = Number(digits.slice(0, 4));
    if (prefix >= 2221 && prefix <= 2720) return "MASTERCARD";
  }
  return null;
}

/** Standard Luhn mod-10 check. Non-digits are ignored, so formatting is safe to run first. */
export function luhn(value: string): boolean {
  const digits = digitsOnly(value);
  if (digits.length === 0) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

/** Both demo brands use 16-digit numbers, so the length check is a single constant. */
export const CARD_NUMBER_LENGTH = 16;

/** Brand known, 16 digits and Luhn-clean. Everything the number field needs. */
export function cardNumberValid(value: string): boolean {
  const digits = digitsOnly(value);
  return digits.length === CARD_NUMBER_LENGTH && luhn(digits) && detectBrand(digits) !== null;
}

export function last4(value: string): string {
  return digitsOnly(value).slice(-4);
}

/** Display name for a detected brand — the only two demo brands, so no map. */
export function cardBrandLabel(brand: CardBrand): string {
  return brand === "VISA" ? "Visa" : "Mastercard";
}

/**
 * MM/YY is in the future (or the current month). `now` is injectable so the
 * unit tests never depend on the wall clock.
 */
export function expiryInFuture(value: string, now: Date = new Date()): boolean {
  const match = /^(\d{2})\/(\d{2})$/.exec(value);
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;
  // `now` is the wall clock, so the expiry's own start is the comparison point:
  // a card is valid through the last day of its month.
  const expiryStart = new Date(year, month - 1, 1).getTime();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  return expiryStart >= thisMonth;
}

/** Demo brands are all 3-digit CVC. */
export function cvcValid(value: string): boolean {
  return /^\d{3}$/.test(digitsOnly(value));
}
