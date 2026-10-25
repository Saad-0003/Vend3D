import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { OrdersScreen } from "@/components/orders/orders-screen";
import { buildOrderRecord, type OrderRecord } from "@/lib/checkout/order";
import { defaultConfiguration } from "@/lib/products/configuration";
import { getProductConfig } from "@/lib/products/config";
import { useCartStore, type CartLine } from "@/stores/cart-store";
import { useOrdersStore } from "@/stores/orders-store";

/**
 * `/orders` screen states (DESIGN.md rule 12): loading, empty, error, filtered
 * empty and populated. Also pins the two interactions the brief calls out:
 * filtering by status/search and the 10-at-a-time load-more.
 */

const configuration = defaultConfiguration(getProductConfig("heavyweight-boxy-tee")!);

function makeOrder({
  id,
  createdAt,
  status = "Placed",
  items = 1,
}: {
  id: string;
  createdAt: string;
  status?: OrderRecord["status"];
  items?: number;
}): OrderRecord {
  const lines: CartLine[] = Array.from({ length: items }, (_, index) => ({
    id: `${id}-line-${index}`,
    slug: "heavyweight-boxy-tee",
    name: "Heavyweight Boxy Tee",
    configuration,
    thumbnail: "",
    qty: 1,
    unitCents: 4800,
  }));

  return {
    ...buildOrderRecord({
      id,
      checkoutKey: `key-${id}`,
      createdAt,
      lines,
      address: {
        fullName: "Ayesha Khan",
        email: "ayesha@example.com",
        phone: "+92 300 1234567",
        address: "House 12, Street 4, Gulberg",
        city: "Lahore",
        province: "Punjab",
        postalCode: "54000",
      },
      shippingMethodId: "standard",
      cardBrand: "VISA",
      cardLast4: "4242",
    }),
    status,
  };
}

const newest = makeOrder({ id: "ord-mabc123def", createdAt: "2026-03-02T10:00:00.000Z", items: 2 });
const older = makeOrder({ id: "ord-qrs456xyz", createdAt: "2026-02-01T10:00:00.000Z" });

beforeEach(() => {
  useOrdersStore.setState({ orders: [], hydrated: true });
  useCartStore.setState({ lines: [], drawerOpen: false, pulse: 0, hydrated: true });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("OrdersScreen", () => {
  it("shows skeleton cards while the store hydrates", () => {
    useOrdersStore.setState({ orders: [], hydrated: false });
    // Never settles, so the loading branch stays observable.
    vi.spyOn(useOrdersStore.persist, "rehydrate").mockReturnValue(new Promise<void>(() => {}));

    render(<OrdersScreen />);

    expect(screen.getByRole("status", { name: "Loading orders" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Loading orders" })).toBeInTheDocument();
  });

  it("shows the empty state with a link back to the shop", () => {
    render(<OrdersScreen />);

    expect(screen.getByRole("heading", { name: "Your orders." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "No orders yet." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse the collection" })).toHaveAttribute(
      "href",
      "/shop",
    );
  });

  it("renders the error state and retries hydration", async () => {
    const user = userEvent.setup();
    useOrdersStore.setState({ orders: [], hydrated: false });
    const rehydrate = vi
      .spyOn(useOrdersStore.persist, "rehydrate")
      .mockRejectedValueOnce(new Error("storage blocked"));

    render(<OrdersScreen />);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("We couldn't load your orders")).toBeInTheDocument();

    rehydrate.mockResolvedValueOnce(undefined);
    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByRole("heading", { name: "No orders yet." })).toBeInTheDocument();
  });

  it("lists the signed-in shopper's orders newest first", () => {
    useOrdersStore.setState({ orders: [older, newest], hydrated: true });

    render(<OrdersScreen />);

    expect(screen.getByText("2 orders")).toBeInTheDocument();
    const cards = screen.getAllByRole("article");
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveAccessibleName(`Order ${newest.id}`);
    expect(cards[1]).toHaveAccessibleName(`Order ${older.id}`);

    // Short id, status, item count and the integer-cent total.
    expect(cards[0]).toHaveTextContent("#123DEF");
    expect(cards[0]).toHaveTextContent("Placed");
    expect(cards[0]).toHaveTextContent("2 items");
    expect(cards[0]).toHaveTextContent("$96.00");
    expect(cards[0]).toHaveTextContent("Placed 02 Mar 2026");
    expect(within(cards[0]!).getByRole("link", { name: "View order" })).toHaveAttribute(
      "href",
      `/order/${newest.id}`,
    );
  });

  it("filters by status, including statuses the store gains later", async () => {
    const user = userEvent.setup();
    const shipped = makeOrder({
      id: "ord-shp111aaa",
      createdAt: "2026-03-03T10:00:00.000Z",
      status: "Shipped" as OrderRecord["status"],
    });
    useOrdersStore.setState({ orders: [newest, older, shipped], hydrated: true });

    render(<OrdersScreen />);

    expect(screen.getByRole("tab", { name: /^All/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /^Placed/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /^Shipped/ })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /^Shipped/ }));

    await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(1));
    expect(screen.getByRole("article")).toHaveAccessibleName(`Order ${shipped.id}`);
  });

  it("searches by order id and offers a way out of a no-match state", async () => {
    const user = userEvent.setup();
    useOrdersStore.setState({ orders: [newest, older], hydrated: true });

    render(<OrdersScreen />);

    const search = screen.getByRole("searchbox", { name: "Search orders by ID" });
    await user.type(search, "123def");

    await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(1));
    expect(screen.getByRole("article")).toHaveAccessibleName(`Order ${newest.id}`);

    await user.clear(search);
    await user.type(search, "ord-does-not-exist");

    expect(await screen.findByRole("heading", { name: "No orders match." })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear filters" }));

    await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(2));
    expect(search).toHaveValue("");
  });

  it("reveals ten orders at a time", async () => {
    const user = userEvent.setup();
    const many = Array.from({ length: 12 }, (_, index) =>
      makeOrder({
        id: `ord-page-${String(index).padStart(2, "0")}`,
        createdAt: `2026-01-${String(20 - index).padStart(2, "0")}T10:00:00.000Z`,
      }),
    );
    useOrdersStore.setState({ orders: many, hydrated: true });

    render(<OrdersScreen />);

    expect(screen.getAllByRole("article")).toHaveLength(10);
    expect(screen.getByRole("button", { name: /Load more/ })).toHaveTextContent("2 more");

    await user.click(screen.getByRole("button", { name: /Load more/ }));

    expect(screen.getAllByRole("article")).toHaveLength(12);
    expect(screen.queryByRole("button", { name: /Load more/ })).not.toBeInTheDocument();
  });

  it("reorders every line and opens the cart drawer", async () => {
    const user = userEvent.setup();
    useOrdersStore.setState({ orders: [newest, older], hydrated: true });

    render(<OrdersScreen />);

    await user.click(screen.getAllByRole("button", { name: "Reorder" })[0]!);

    const cart = useCartStore.getState();
    expect(cart.lines).toHaveLength(2);
    expect(cart.lines.map((line) => [line.slug, line.unitCents, line.qty])).toEqual([
      ["heavyweight-boxy-tee", 4800, 1],
      ["heavyweight-boxy-tee", 4800, 1],
    ]);
    expect(cart.drawerOpen).toBe(true);
  });
});
