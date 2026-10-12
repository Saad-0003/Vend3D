import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CheckoutScreen } from "@/components/checkout/checkout-screen";
import { defaultConfiguration } from "@/lib/products/configuration";
import { getProductConfig } from "@/lib/products/config";
import type { CartLine } from "@/stores/cart-store";
import { useCartStore } from "@/stores/cart-store";
import { useOrdersStore } from "@/stores/orders-store";

/**
 * The checkout screen end to end: guard, step validation, the demo card checks,
 * and place-order (order record + cleared cart + redirect). No server exists
 * yet, so the assertions target the client mirrors the Phase 9 server action
 * inherits.
 *
 * Fields are set with `fireEvent.change` — one event per field, which keeps the
 * suite fast and load-tolerant — while the typing behaviour (grouping, MM/YY
 * slash handling) is unit-tested in `payment-card.test.ts`, where it belongs.
 */

const configuration = defaultConfiguration(getProductConfig("heavyweight-boxy-tee")!);

const cartLine: CartLine = {
  id: "line-1",
  slug: "heavyweight-boxy-tee",
  name: "Heavyweight Boxy Tee",
  configuration,
  thumbnail: "",
  qty: 2,
  unitCents: 4800,
};

const push = vi.fn();
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace, refresh: vi.fn(), prefetch: vi.fn(), back: vi.fn(), forward: vi.fn() }),
}));

function seedCart() {
  useCartStore.setState({ lines: [cartLine], hydrated: true, drawerOpen: false, pulse: 0 });
}

function setupUser() {
  return userEvent.setup({ delay: 0 });
}

/** Sets a field's value in one shot, through the form's own onChange. */
function setField(label: string, value: string) {
  const main = screen.getByRole("main", { name: "Checkout" });
  fireEvent.change(within(main).getByLabelText(label), { target: { value } });
}

/** Fills step 1 and advances to payment. */
async function fillDetails(user: ReturnType<typeof setupUser>) {
  setField("Email", "ayesha@example.com");
  setField("Full name", "Ayesha Khan");
  setField("Phone", "+92 300 1234567");
  setField("Street address", "House 12, Street 4, Gulberg");
  setField("City", "Lahore");
  await user.click(screen.getByRole("button", { name: "Continue to payment" }));
  // `AnimatePresence mode="wait"` mounts the next step after the exit animation.
  await screen.findByRole("heading", { name: "Demo payment" });
}

async function fillPayment(user: ReturnType<typeof setupUser>, cardNumber = "4242424242424242") {
  setField("Card number", cardNumber);
  setField("Cardholder name", "Ayesha Khan");
  setField("Expiry", "1230");
  setField("CVC", "123");
  await user.click(screen.getByRole("button", { name: "Continue to review" }));
  await screen.findByRole("heading", { name: "Review and place" });
}

beforeEach(() => {
  push.mockClear();
  replace.mockClear();
  useCartStore.setState({ lines: [], hydrated: false });
  useOrdersStore.setState({ orders: [], hydrated: true });
});

describe("CheckoutScreen", () => {
  it("redirects an empty cart to /cart", async () => {
    render(<CheckoutScreen />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/cart"));
  });

  it("renders the three-step progress row with Details active", async () => {
    seedCart();
    render(<CheckoutScreen />);

    const progress = screen.getByRole("navigation", { name: "Checkout progress" });
    expect(within(progress).getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      "Details",
      "Payment",
      "Review",
    ]);
    expect(within(progress).getByText("Details").closest("li")).toHaveAttribute("aria-current", "step");
  });

  it("keeps an empty form from advancing and shows inline messages", async () => {
    seedCart();
    const user = setupUser();
    render(<CheckoutScreen />);

    await user.click(screen.getByRole("button", { name: "Continue to payment" }));

    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Full name is required")).toBeInTheDocument();
    expect(screen.getByText("Phone number is required")).toBeInTheDocument();
    expect(screen.getByText("Street address is required")).toBeInTheDocument();
    expect(screen.getByText("City is required")).toBeInTheDocument();
    // Still on step 1.
    expect(screen.getByRole("heading", { name: "Where should it go?" })).toBeInTheDocument();
  });

  it("rejects a bad email and a malformed phone", async () => {
    seedCart();
    const user = setupUser();
    render(<CheckoutScreen />);

    setField("Email", "not-an-email");
    setField("Phone", "123");
    await user.click(screen.getByRole("button", { name: "Continue to payment" }));

    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
    expect(screen.getByText("Use the format +92 300 1234567")).toBeInTheDocument();
  });

  it("shows the persistent demo banner and rejects an unsupported card", async () => {
    seedCart();
    const user = setupUser();
    render(<CheckoutScreen />);
    await fillDetails(user);

    expect(screen.getByRole("heading", { name: "Demo payment" })).toBeInTheDocument();
    expect(screen.getByText("Demo payment, no real charge.")).toBeInTheDocument();

    // Amex is neither Visa nor Mastercard.
    setField("Card number", "378282246310005");
    await user.click(screen.getByRole("button", { name: "Continue to review" }));
    expect(await screen.findByText("Visa or Mastercard only.")).toBeInTheDocument();
  });

  it("requires every card field before the review step", async () => {
    seedCart();
    const user = setupUser();
    render(<CheckoutScreen />);
    await fillDetails(user);

    await user.click(screen.getByRole("button", { name: "Continue to review" }));

    expect(await screen.findByText("Card number is required")).toBeInTheDocument();
    expect(screen.getByText("Cardholder name is required")).toBeInTheDocument();
    expect(screen.getByText("Expiry is required")).toBeInTheDocument();
    expect(screen.getByText("CVC is required")).toBeInTheDocument();
  });

  it("rejects a bad Luhn number, a past expiry and a short CVC", async () => {
    seedCart();
    const user = setupUser();
    render(<CheckoutScreen />);
    await fillDetails(user);

    setField("Card number", "4242424242424241");
    setField("Cardholder name", "Ayesha Khan");
    setField("Expiry", "0120");
    setField("CVC", "12");
    await user.click(screen.getByRole("button", { name: "Continue to review" }));

    expect(await screen.findByText("This card number is not valid.")).toBeInTheDocument();
    expect(screen.getByText("Expiry must be a month in the future.")).toBeInTheDocument();
    expect(screen.getByText("CVC is 3 digits.")).toBeInTheDocument();
  });

  it("groups the card number and mirrors it on the preview", async () => {
    seedCart();
    const user = setupUser();
    render(<CheckoutScreen />);
    await fillDetails(user);

    setField("Card number", "4242424242424242");
    expect(screen.getByLabelText("Card number")).toHaveValue("4242 4242 4242 4242");

    // The front face mirrors the number.
    expect(screen.getByText("4242 4242 4242 4242", { selector: "p" })).toBeInTheDocument();
  });

  it("discards card fields once the payment step is left", async () => {
    seedCart();
    const user = setupUser();
    render(<CheckoutScreen />);
    await fillDetails(user);
    await fillPayment(user);

    // The review step shows brand + last4 only; the number is gone from the DOM.
    expect(screen.getByText("Visa ending 4242")).toBeInTheDocument();
    expect(screen.queryByText("4242 4242 4242 4242", { selector: "p" })).not.toBeInTheDocument();

    // Going back re-opens the payment form, and it is empty.
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(await screen.findByLabelText("Card number")).toHaveValue("");
    expect(screen.getByLabelText("CVC")).toHaveValue("");
  });

  it("places the order, clears the cart and redirects to /order/[id]", async () => {
    seedCart();
    const user = setupUser();
    render(<CheckoutScreen />);
    await fillDetails(user);
    await fillPayment(user);

    expect(screen.getByText("ayesha@example.com")).toBeInTheDocument();
    expect(screen.getByText("Standard · 4–6 business days")).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Place order" }));

    // The submit is disabled with a loading label while the demo delay runs.
    expect(screen.getByRole("button", { name: /Placing order/ })).toBeDisabled();

    await waitFor(() => expect(push).toHaveBeenCalled(), { timeout: 4000 });

    const orders = useOrdersStore.getState().orders;
    expect(orders).toHaveLength(1);
    expect(orders[0]!.status).toBe("Placed");
    expect(orders[0]!.items).toHaveLength(1);
    expect(orders[0]!.totalCents).toBe(9600);
    expect(orders[0]!.shippingCents).toBe(0);
    // No card data survived anywhere: only brand + last4.
    expect(JSON.stringify(orders[0])).not.toContain("4242 4242");
    expect(orders[0]!.cardLast4).toBe("4242");
    expect(orders[0]!.cardBrand).toBe("VISA");

    expect(useCartStore.getState().lines).toEqual([]);
    expect(push).toHaveBeenCalledWith(`/order/${orders[0]!.id}`);
  }, 15000);

  it("blocks an unchecked terms box with an inline message", async () => {
    seedCart();
    const user = setupUser();
    render(<CheckoutScreen />);
    await fillDetails(user);
    await fillPayment(user);

    await user.click(screen.getByRole("button", { name: "Place order" }));
    expect(await screen.findByText("Please accept the terms to place the order.")).toBeInTheDocument();
    expect(useOrdersStore.getState().orders).toHaveLength(0);
  });

  it("accepts the terms checkbox", async () => {
    seedCart();
    const user = setupUser();
    render(<CheckoutScreen />);
    await fillDetails(user);
    await fillPayment(user);

    await user.click(screen.getByRole("checkbox"));
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("shows a live total that follows the chosen shipping method", async () => {
    seedCart();
    const user = setupUser();
    render(<CheckoutScreen />);

    const summary = screen.getByRole("complementary", { name: "Order summary" });
    expect(within(summary).getByTestId("summary-total")).toHaveTextContent("$96.00");

    // Standard (the default) is free; express adds $9.00.
    await user.click(screen.getByRole("radio", { name: /Express/ }));
    expect(within(summary).getByTestId("summary-total")).toHaveTextContent("$105.00");
    expect(within(summary).getByTestId("summary-shipping")).toHaveTextContent("Express · $9.00");

    await user.click(screen.getByRole("radio", { name: /Standard/ }));
    expect(within(summary).getByTestId("summary-total")).toHaveTextContent("$96.00");
    expect(within(summary).getByTestId("summary-shipping")).toHaveTextContent("Standard · Free");
  });

  it("quotes the shipping placeholder as a TODO", async () => {
    seedCart();
    render(<CheckoutScreen />);
    expect(screen.getByText(/Placeholder rates/)).toBeInTheDocument();
  });
});
