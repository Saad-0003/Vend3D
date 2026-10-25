import { describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { RESEND_COOLDOWN_MS, remainingCooldownSeconds } from "@/lib/auth/resend";
import { useResendCooldown } from "@/components/auth/use-resend-cooldown";

/**
 * The resend cooldown behind /auth/check-email (plan.md Phase 1B U3).
 *
 * The pure math is what the button's disabled state promises; the hook test
 * pins that the promise is wired to a ticking clock and cannot be re-fired
 * inside the window.
 */

describe("remainingCooldownSeconds", () => {
  const START = 1_000_000;

  it("returns the full 30 seconds immediately after a resend", () => {
    expect(remainingCooldownSeconds(START, START)).toBe(30);
  });

  it("rounds a partly elapsed window up, never showing 0 too early", () => {
    // 29.001s elapsed → just under a second left → 1.
    expect(remainingCooldownSeconds(START, START + RESEND_COOLDOWN_MS - 1)).toBe(1);
    expect(remainingCooldownSeconds(START, START + 1)).toBe(30);
    expect(remainingCooldownSeconds(START, START + 15_000)).toBe(15);
  });

  it("reaches 0 exactly at the end of the window", () => {
    expect(remainingCooldownSeconds(START, START + RESEND_COOLDOWN_MS)).toBe(0);
    expect(remainingCooldownSeconds(START, START + RESEND_COOLDOWN_MS + 5_000)).toBe(0);
  });

  it("treats a backwards clock jump as a full window", () => {
    // `now` before `startedAt` must never go negative or read as "ready".
    expect(remainingCooldownSeconds(START, START - 10_000)).toBe(30);
  });
});

describe("useResendCooldown", () => {
  it("starts idle, then counts down to 0 and clears the disabled state", () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => useResendCooldown());

      expect(result.current.cooling).toBe(false);
      expect(result.current.remaining).toBe(0);

      act(() => {
        result.current.start();
      });
      expect(result.current.cooling).toBe(true);
      expect(result.current.remaining).toBe(30);

      act(() => {
        vi.advanceTimersByTime(15_000);
      });
      expect(result.current.remaining).toBe(15);

      act(() => {
        vi.advanceTimersByTime(RESEND_COOLDOWN_MS);
      });
      expect(result.current.remaining).toBe(0);
      expect(result.current.cooling).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("restarts the full window when resend is clicked again after it elapses", () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => useResendCooldown());
      act(() => {
        result.current.start();
      });
      act(() => {
        vi.advanceTimersByTime(RESEND_COOLDOWN_MS);
      });
      expect(result.current.cooling).toBe(false);

      act(() => {
        result.current.start();
      });
      expect(result.current.cooling).toBe(true);
      expect(result.current.remaining).toBe(30);
    } finally {
      vi.useRealTimers();
    }
  });
});
