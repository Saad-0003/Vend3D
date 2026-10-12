import { z } from "zod";

/**
 * Provinces for the details step. Pakistan, matching the `+92` phone placeholder
 * hint — the storefront ships from and to Pakistani addresses in the MVP.
 */
export const PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad Capital Territory",
  "Gilgit-Baltistan",
  "Azad Jammu & Kashmir",
] as const;

export const provinceSchema = z.enum(PROVINCES);
export type Province = z.infer<typeof provinceSchema>;

/** `+92 3xx xxx xxxx`-shaped. Kept permissive on digits: the demo sends nothing. */
export const phoneSchema = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .regex(/^(\+92|0)?[\d\s-]{9,16}$/, "Use the format +92 300 1234567");
