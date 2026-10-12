import type { Metadata } from "next";

import { OrderScreen } from "@/components/order/order-screen";

export const metadata: Metadata = {
  title: "Order",
  description: "Your demo order confirmation — no money was charged.",
};

type Params = Promise<{ id: string }>;

export default async function OrderPage({ params }: { params: Params }) {
  const { id } = await params;
  return <OrderScreen id={id} />;
}
