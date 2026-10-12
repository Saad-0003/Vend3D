import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AuthDialog } from "@/components/auth/auth-dialog";
import { AuthForm } from "@/components/auth/auth-form";
import { authService } from "@/lib/auth/service";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Auth UI behaviour (plan.md Phase 3). Covers the states the brief calls out —
 * error, loading, the password toggle, and the dialog closing on success —
 * using the real store, so the mock service is exercised end to end.
 *
 * `next/navigation` is mocked because the components call `useRouter`; the mock
 * records pushes so the `?next=` contract can be asserted.
 */

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/login",
}));

const VALID = { email: "ayesha@example.com", password: "supersecret1" };

beforeEach(() => {
  push.mockClear();
  useAuthStore.setState({ user: null, hydrated: true, pending: false });
  localStorage.removeItem("vend3d-auth-user");
  localStorage.removeItem("vend3d-auth-accounts");
});

/** Signs a user up through the store so later tests have an account to hit. */
async function seedAccount() {
  await act(async () => {
    await useAuthStore.getState().signUp({ ...VALID, name: "Ayesha" });
  });
  await act(async () => {
    await useAuthStore.getState().signOut();
  });
  useAuthStore.setState({ user: null, pending: false });
}

describe("AuthForm", () => {
  it("blocks an empty submit with inline, aria-live errors", async () => {
    const user = userEvent.setup({ delay: 0 });
    render(<AuthForm mode="signin" />);

    await user.click(screen.getByRole("button", { name: "Sign in" }));

    // Each field gets its own message, and the first of them is also announced
    // once in the form-wide live region instead of per-field chatter.
    expect(await screen.findAllByText("Email is required")).toHaveLength(2);
    expect(screen.getAllByText("Password is required")).toHaveLength(1);
    expect(screen.getByTestId("auth-live")).toHaveTextContent("Email is required");
  });

  it("reports a mismatched confirmation on the confirm field only", async () => {
    const user = userEvent.setup({ delay: 0 });
    render(<AuthForm mode="signup" />);

    await user.type(screen.getByLabelText("Full name"), "Ayesha");
    await user.type(screen.getByLabelText("Email"), "ayesha@example.com");
    await user.type(screen.getByLabelText("Password"), "supersecret1");
    await user.type(screen.getByLabelText("Confirm password"), "supersecret2");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    // Field message plus the form-wide live region.
    expect(await screen.findAllByText("Passwords do not match")).toHaveLength(2);
  });

  it("rejects a weak password with the composition rules", async () => {
    const user = userEvent.setup({ delay: 0 });
    render(<AuthForm mode="signup" />);

    await user.type(screen.getByLabelText("Password"), "alllettersnodigit");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Include at least one number")).toBeInTheDocument();
  });

  it("toggles password visibility without losing the typed value", async () => {
    const user = userEvent.setup({ delay: 0 });
    render(<AuthForm mode="signin" />);

    const field = screen.getByLabelText("Password");
    expect(field).toHaveAttribute("type", "password");

    await user.type(field, "supersecret1");
    await user.click(screen.getByRole("button", { name: "Show password" }));

    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "text");
    expect(screen.getByLabelText("Password")).toHaveValue("supersecret1");

    await user.click(screen.getByRole("button", { name: "Hide password" }));
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
  });

  it("signs in an existing account and closes the dialog", async () => {
    await seedAccount();
    const user = userEvent.setup({ delay: 0 });

    let closed = false;
    render(<AuthDialog open onOpenChange={() => (closed = true)} />);

    await user.type(screen.getByLabelText("Email"), VALID.email);
    await user.type(screen.getByLabelText("Password"), VALID.password);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(useAuthStore.getState().user?.email).toBe(VALID.email));
    expect(closed).toBe(true);
  });

  it("shows a server error for unknown credentials and stays signed out", async () => {
    const user = userEvent.setup({ delay: 0 });
    render(<AuthForm mode="signin" />);

    await user.type(screen.getByLabelText("Email"), "stranger@example.com");
    await user.type(screen.getByLabelText("Password"), "supersecret1");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    // The banner and the live region both carry the message; assert the visible one.
    const banner = await screen.findByText("Incorrect email or password.", { selector: "p.text-\\[var\\(--destructive\\)\\]" });
    expect(banner).toBeInTheDocument();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("shows a loading state while the request is in flight", async () => {
    await seedAccount();
    const user = userEvent.setup({ delay: 0 });

    // Hold the request open so the pending state is stable enough to assert.
    const spy = vi.spyOn(authService, "signIn").mockImplementation(() => new Promise(() => {}));
    try {
      render(<AuthForm mode="signin" />);

      await user.type(screen.getByLabelText("Email"), VALID.email);
      await user.type(screen.getByLabelText("Password"), VALID.password);
      await user.click(screen.getByRole("button", { name: "Sign in" }));

      const loading = await screen.findByRole("button", { name: /Signing in/ });
      expect(loading).toBeDisabled();
    } finally {
      spy.mockRestore();
    }
  });

  it("honours ?next= on success", async () => {
    await seedAccount();
    const user = userEvent.setup({ delay: 0 });

    render(<AuthForm mode="signin" next="/designs?tab=saved" />);

    await user.type(screen.getByLabelText("Email"), VALID.email);
    await user.type(screen.getByLabelText("Password"), VALID.password);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/designs?tab=saved"));
  });

  it("refuses an unsafe ?next= target", async () => {
    await seedAccount();
    const user = userEvent.setup({ delay: 0 });

    render(<AuthForm mode="signin" next="https://evil.example" />);

    await user.type(screen.getByLabelText("Email"), VALID.email);
    await user.type(screen.getByLabelText("Password"), VALID.password);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/account"));
  });
});
