"use client";

import type { VehicleStatus } from "@/lib/types";
import { Badge } from "@/components/ui/primitives";

/** One source of truth for status → badge tone, used on every inventory surface. */
const STATUS_TONES: Record<VehicleStatus, "green" | "blue" | "neutral" | "amber"> = {
  Available: "green",
  Reserved: "blue",
  Sold: "neutral",
  "In Repair": "amber",
  "In Transit": "blue",
};

export function StatusBadge({
  status,
  className,
}: {
  status: VehicleStatus;
  className?: string;
}) {
  return (
    <Badge tone={STATUS_TONES[status]} className={className}>
      {status}
    </Badge>
  );
}

/** Days-in-stock chip — flips to amber once a unit starts aging (60+ days). */
export function DaysInStockChip({
  days,
  className,
}: {
  days: number;
  className?: string;
}) {
  return (
    <Badge tone={days >= 60 ? "amber" : "neutral"} className={className}>
      {days}d in stock
    </Badge>
  );
}
