"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import type { Vehicle } from "@/lib/types";
import { formatNaira } from "@/lib/format";
import { Badge, VehicleImage } from "@/components/ui/primitives";
import { StatusBadge, DaysInStockChip } from "./vehicle-badges";

/** Grid-view card — the whole card links to the vehicle detail page. */
export function VehicleCard({ vehicle: v }: { vehicle: Vehicle }) {
  return (
    <Link
      href={`/inventory/${v.id}`}
      className="group block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <div className="overflow-hidden rounded-xl border bg-raised shadow-xs transition-all group-hover:border-accent/50 group-hover:shadow-md">
        <div className="relative">
          <VehicleImage
            src={v.photo}
            alt={`${v.year} ${v.make} ${v.model}`}
            className="aspect-video w-full"
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 360px"
          />
          <StatusBadge status={v.status} className="absolute left-3 top-3 shadow-sm" />
        </div>

        <div className="p-4">
          <p className="truncate text-sm font-semibold tracking-tight">
            {v.year} {v.make} {v.model}
          </p>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span className="truncate text-xs text-muted">{v.trim}</span>
            <Badge>{v.condition}</Badge>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="text-[15px] font-bold tracking-tight">
              {formatNaira(v.listingPrice)}
            </p>
            <DaysInStockChip days={v.daysInStock} />
          </div>

          <p className="mt-3 flex items-center gap-1.5 border-t pt-3 text-xs text-muted">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {v.location}
          </p>
        </div>
      </div>
    </Link>
  );
}
