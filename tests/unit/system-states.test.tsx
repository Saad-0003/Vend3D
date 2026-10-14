import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import GlobalError from "@/app/error";

/**
 * The global error boundary's contract (plan.md Phase 1): it says something
 * useful, offers a way out, and logs the error to the console only — no stack
 * trace or message reaches the screen.
 */
describe("global error boundary", () => {
  it("renders the message, the retry button and the back-home link", () => {
    render(<GlobalError error={new Error("boom")} reset={() => {}} />);

    expect(screen.getByRole("heading", { level: 1, name: "Something slipped." })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back home" })).toHaveAttribute("href", "/");
  });

  it("logs the digest to the console and shows nothing else", () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<GlobalError error={Object.assign(new Error("boom"), { digest: "d-123" })} reset={() => {}} />);

    expect(logged).toHaveBeenCalledWith("[app] unhandled error", "d-123");
    // The error's own text must never reach the screen.
    expect(screen.queryByText(/boom/)).not.toBeInTheDocument();
    logged.mockRestore();
  });

  it("falls back to a placeholder digest when there is none", () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<GlobalError error={new Error("boom")} reset={() => {}} />);
    expect(logged).toHaveBeenCalledWith("[app] unhandled error", "no-digest");
    logged.mockRestore();
  });

  it("calls reset when the shopper retries", async () => {
    const reset = vi.fn();
    render(<GlobalError error={new Error("boom")} reset={reset} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
