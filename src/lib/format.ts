/**
 * The single place a number becomes money on screen (AGENTS.md §Money).
 * Prices are integer cents everywhere below the UI edge; this helper is the
 * only formatter and is called at render time only.
 */
export function formatCents(cents: number, currency = "USD"): string {
  const symbol = currency === "USD" ? "$" : "";
  return `${symbol}${(cents / 100).toFixed(2)}`;
}
