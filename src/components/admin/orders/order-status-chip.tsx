import { Badge } from "@/components/ui/badge";

/**
 * One chip per demo status (U6), shared by the list, the detail header and
 * the timeline. Tokens only — no new colour language: lime marks "in
 * production" milestones, ivory the moving states, faint the terminal ones.
 */
const CHIP_CLASSES: Record<string, string> = {
  Placed:
    "border-[color-mix(in_srgb,var(--lime)_35%,transparent)] bg-[var(--lime-glow)] text-[var(--lime)]",
  Processing:
    "border-[var(--hairline-strong)] bg-[var(--surface-2)] text-[var(--ivory)]",
  Shipped:
    "border-[var(--hairline-strong)] bg-transparent text-[var(--ivory)]",
  Delivered:
    "border-[color-mix(in_srgb,var(--lime)_35%,transparent)] bg-transparent text-[var(--lime)]",
  Cancelled:
    "border-[var(--hairline)] bg-transparent text-[var(--faint)]",
};

export function OrderStatusChip({ status, className }: { status: string; className?: string }) {
  return (
    <Badge
      variant="outline"
      data-testid="admin-order-status"
      data-order-status={status}
      className={`lux-mono rounded-full px-2.5 py-1 text-[10px] tracking-[0.14em] uppercase ${
        CHIP_CLASSES[status] ?? CHIP_CLASSES.Placed
      } ${className ?? ""}`}
    >
      {status}
    </Badge>
  );
}
