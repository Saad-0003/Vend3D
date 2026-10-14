import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { OfflineNotice } from "@/components/system/offline-notice";

/**
 * The offline notice (DESIGN.md rule 12: loading, empty and error states are
 * first-class). It reuses the shared `ErrorState` rather than a second error
 * panel, and says what to do instead of just announcing the problem.
 */
describe("offline notice", () => {
  function setOnline(online: boolean) {
    Object.defineProperty(navigator, "onLine", { value: online, configurable: true });
  }

  it("renders nothing while online", () => {
    setOnline(true);
    const { container } = render(<OfflineNotice />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the shared ErrorState with a retry when offline", async () => {
    setOnline(false);
    render(<OfflineNotice />);

    expect(await screen.findByText("You are offline")).toBeInTheDocument();
    // Reusing the primitive means its own alert semantics come along.
    expect(screen.getByRole("alert")).toBeInTheDocument();

    const retry = screen.getByRole("button", { name: /Try again/ });
    expect(retry).toBeInTheDocument();

    // Retry reloads: a lost connection is not something a re-render can fix.
    const reload = vi.fn();
    Object.defineProperty(window, "location", {
      value: { ...window.location, reload },
      configurable: true,
    });
    await userEvent.setup().click(retry);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("clears when the browser comes back online", async () => {
    setOnline(false);
    const { container } = render(<OfflineNotice />);
    expect(await screen.findByText("You are offline")).toBeInTheDocument();

    setOnline(true);
    // The handler's state update has to be flushed inside `act`, or the
    // assertion races the re-render.
    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    expect(container).toBeEmptyDOMElement();
  });
});
