import { OrdersPageSkeleton } from "@/components/ui/route-skeletons";

/** `/orders` — toolbar plus history cards while the client store hydrates. */
export default function Loading() {
  return <OrdersPageSkeleton />;
}
