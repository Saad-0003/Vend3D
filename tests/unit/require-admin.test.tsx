import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { RequireAdmin } from "@/components/auth/require-admin";
import { useAuthStore } from "@/stores/auth-store";

/**
 * `RequireAdmin`'s render mapping (plan.md Phase 1B U3).
 *
 * The decision policy is pinned by `auth-guards.test.ts`; this file pins the
 * wiring: which state shows the skeleton, which shows the children, and that a
 * non-admin never sees admin content. The real redirect URL is covered by the
 * e2e suite — jsdom cannot navigate or be spied (`location.replace` is non-
 * configurable), so the unit render contract stops one step short of it.
 */

const ADMIN = { id: "u1", email: "admin@vend3d.demo", name: "Demo Admin", role: "admin" } as const;
const SHOPPER = { id: "u2", email: "ayesha@example.com", name: "Ayesha", role: "user" } as const;

function resetStore(partial: Partial<ReturnType<typeof useAuthStore.getState>>) {
  useAuthStore.setState({ user: null, hydrated: false, pending: false, expired: false, ...partial });
}

beforeEach(() => {
  localStorage.clear();
  resetStore({});
});

afterEach(() => {
  cleanup();
  resetStore({});
});

describe("<RequireAdmin>", () => {
  it("lets an admin through to the content", () => {
    resetStore({ user: ADMIN, hydrated: true });
    render(
      <RequireAdmin>
        <div>ADMIN ONLY</div>
      </RequireAdmin>,
    );
    expect(screen.getByText("ADMIN ONLY")).toBeInTheDocument();
  });

  it("never renders admin content for a non-admin", () => {
    resetStore({ user: SHOPPER, hydrated: true });
    render(
      <RequireAdmin>
        <div>ADMIN ONLY</div>
      </RequireAdmin>,
    );
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Redirecting to /forbidden");
    expect(screen.queryByText("ADMIN ONLY")).not.toBeInTheDocument();
  });

  it("shows the sign-in redirect skeleton for a signed-out visitor", () => {
    resetStore({ user: null, hydrated: true });
    render(
      <RequireAdmin>
        <div>ADMIN ONLY</div>
      </RequireAdmin>,
    );
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Redirecting to sign in");
    expect(screen.queryByText("ADMIN ONLY")).not.toBeInTheDocument();
  });

  it("shows the recovery dialog instead of a redirect when the session expired", () => {
    resetStore({ user: null, hydrated: true, expired: true });
    render(
      <RequireAdmin>
        <div>ADMIN ONLY</div>
      </RequireAdmin>,
    );
    expect(screen.getByText("Your session expired")).toBeInTheDocument();
    // Signing in again is the way back — the dialog links to /login with ?next=.
    expect(screen.getByRole("link", { name: "Sign in again" })).toHaveAttribute(
      "href",
      expect.stringContaining("/login?next="),
    );
    expect(screen.queryByText("ADMIN ONLY")).not.toBeInTheDocument();
  });
});
