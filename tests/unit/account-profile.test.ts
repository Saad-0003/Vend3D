import { describe, expect, it } from "vitest";

import { firstNameOf, initialsOf } from "@/lib/account/profile";
import { formatOrderDate } from "@/lib/checkout/order";

/**
 * The account shell's display rules (`/account` panels, plan.md Phase 3).
 * Kept pure in `lib/` so the heading and the avatar fallback are testable
 * without rendering the screen.
 */

describe("firstNameOf", () => {
  it("takes the first word of a multi-word name", () => {
    expect(firstNameOf("Ada Lovelace", "ada@example.com")).toBe("Ada");
  });

  it("returns a single-word name unchanged", () => {
    expect(firstNameOf("Prince", "prince@example.com")).toBe("Prince");
  });

  it("collapses padding and repeated whitespace", () => {
    expect(firstNameOf("   Ada    Lovelace  ", "ada@example.com")).toBe("Ada");
  });

  it("falls back to the email local part when the name is empty", () => {
    expect(firstNameOf("", "ada.lovelace@example.com")).toBe("ada.lovelace");
    expect(firstNameOf("   ", "ada@example.com")).toBe("ada");
    expect(firstNameOf(undefined, "ada@example.com")).toBe("ada");
  });

  it("never renders an empty heading", () => {
    expect(firstNameOf("", "")).toBe("there");
    expect(firstNameOf(undefined, "")).toBe("there");
  });
});

describe("initialsOf", () => {
  it("uses the first letter of the first two words", () => {
    expect(initialsOf("Ada Lovelace", "ada@example.com")).toBe("AL");
  });

  it("uses one letter for a single-word name", () => {
    expect(initialsOf("Prince", "prince@example.com")).toBe("P");
  });

  it("falls back to the email prefix when there is no name", () => {
    expect(initialsOf("", "ada.lovelace@example.com")).toBe("AD");
    expect(initialsOf(undefined, "ada@example.com")).toBe("AD");
  });

  it("falls back to the brand mark when there is nothing to read", () => {
    expect(initialsOf("", "")).toBe("V3");
  });
});

describe("formatOrderDate", () => {
  // An order date is rendered in the viewer's timezone, so the assertions pin
  // the shape (zero-padded day, three-letter month, four-digit year) rather
  // than a day that a timezone could shift.
  it("formats as a zero-padded short date", () => {
    expect(formatOrderDate("2026-10-12T12:00:00.000Z")).toMatch(/^\d{2} Oct \d{4}$/);
  });

  it("renders the month as a three-letter name", () => {
    expect(formatOrderDate("2026-01-05T12:00:00.000Z")).toMatch(/^\d{2} Jan \d{4}$/);
  });
});
