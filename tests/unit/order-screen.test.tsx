import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";

import { OrderScreen } from "@/components/order/order-screen";
import { buildOrderRecord } from "@/lib/checkout/order";
import { defaultConfiguration } from "@/lib/products/configuration";
import { getProductConfig } from "@/lib/products/config";
import { useCartStore } from "@/stores/cart-store";
import { useOrdersStore } from "@/stores/orders-store";

/**
 * `/order/[id]` states (docs/DESIGN.md rule 12: loading, empty and error ship
 * with every screen). The found case also pins the page's contract: the serif
 * line, the mono order number, the timeline stages and both CTAs.
 */

const configuration = defaultConfiguration(getProductConfig("heavyweight-boxy-tee")!);

const ORDER_ID = "ord-test-confirmation";

const order = buildOrderRecord({
  id: ORDER_ID,
  checkoutKey: "checkout-key-1",
  createdAt: "2026-03-01T10:00:00.000Z",
  lines: [
    {
      id: "line-1",
      slug: "heavyweight-boxy-tee",
      name: "Heavyweight Boxy Tee",
      configuration,
      thumbnail: "data:image/png;base64,AAAA",
      qty: 2,
      unitCents: 4800,
    },
  ],
  address: {
    fullName: "Ayesha Khan",
    email: "ayesha@example.com",
    phone: "+92 300 1234567",
    address: "House 12, Street 4, Gulberg",
    city: "Lahore",
    province: "Punjab",
    postalCode: "54000",
  },
  shippingMethodId: "express",
  cardBrand: "VISA",
  cardLast4: "4242",
});

beforeEach(() => {
  useCartStore.setState({ lines: [], hydrated: false });
  useOrdersStore.setState({ orders: [order], hydrated: true });
});

describe("OrderScreen", () => {
  it("shows a loading skeleton before hydration", () => {
    // Freeze `hydrated` so the screen stays in its loading branch.
    useOrdersStore.setState({ hydrated: false, hydrate: vi.fn() });

    render(<OrderScreen id={ORDER_ID} />);

    expect(screen.getByRole("status", { name: "Loading order" })).toBeInTheDocument();
  });

  it("shows the not-found state for an unknown id", () => {
    render(<OrderScreen id="ord-does-not-exist" />);

    expect(screen.getByRole("heading", { name: "Order not found." })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Your order is in production." })).not.toBeInTheDocument();
  });

  it("renders the confirmation copy, order number and dispatch promise", () => {
    render(<OrderScreen id={ORDER_ID} />);

    expect(screen.getByRole("heading", { name: "Your order is in production." })).toBeInTheDocument();
    expect(screen.getByText("A demo confirmation, no real charge was made.")).toBeInTheDocument();
    // Order number in mono.
    expect(screen.getByText(ORDER_ID)).toBeInTheDocument();
    expect(screen.getByText("Dispatch within 48 hours")).toBeInTheDocument();
  });

  it("shows all four fulfilment stages with only the first active", () => {
    render(<OrderScreen id={ORDER_ID} />);

    const progress = screen.getByRole("list", { name: "Order progress" });
    const stages = within(progress).getAllByRole("listitem");
    expect(stages.map((li) => li.textContent)).toEqual(["Placed", "Proofing", "Production", "Dispatched"]);

    // The first stage is the active one; the rest stay dim because the record
    // only attests to "Placed".
    const dots = within(progress).getAllByRole("listitem").map((li) => li.querySelector("[data-active]"));
    expect(dots[0]).toHaveAttribute("data-active", "true");
    expect(dots[0]!.className).toContain("bg-[var(--lime)]");
    expect(dots[1]).toHaveAttribute("data-active", "false");
    expect(dots[1]!.className).toContain("bg-[var(--surface-3)]");
  });

  it("summarises the order with items, chips, address and integer-cent totals", () => {
    render(<OrderScreen id={ORDER_ID} />);

    const summary = screen.getByRole("region", { name: "Order summary" });
    expect(within(summary).getByText("Heavyweight Boxy Tee")).toBeInTheDocument();
    expect(within(summary).getByText("Qty 2 · $48.00 each")).toBeInTheDocument();
    expect(within(summary).getByText("Ayesha Khan")).toBeInTheDocument();
    expect(within(summary).getByText("Visa ending 4242")).toBeInTheDocument();
    // Express adds $9.00 to the $96.00 subtotal.
    expect(within(summary).getByText("$105.00")).toBeInTheDocument();
  });

  it("offers both CTAs pointing at real routes", () => {
    render(<OrderScreen id={ORDER_ID} />);

    expect(screen.getByRole("link", { name: "Back to shop" })).toHaveAttribute("href", "/shop");
    expect(screen.getByRole("link", { name: "View designs" })).toHaveAttribute("href", "/designs");
  });
});
