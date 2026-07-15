"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarCheck,
  CarFront,
  CircleDot,
  PartyPopper,
  SearchX,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { VehicleStatus } from "@/lib/types";
import { can, seesFinancials } from "@/lib/permissions";
import { formatDate, formatNaira, formatNumber, relativeDays } from "@/lib/format";
import { margin, marginPct, totalCost } from "@/lib/stats";
import { useAppStore, useCurrentUser } from "@/store/app-store";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Field,
  Input,
  Modal,
  Select,
  VehicleImage,
  useToast,
} from "@/components/ui/primitives";
import { ModuleRecommendations } from "@/components/assistant/recommendation-card";
import { StatusBadge, DaysInStockChip } from "@/components/inventory/vehicle-badges";

const STATUS_OPTIONS: VehicleStatus[] = [
  "Available",
  "Reserved",
  "In Transit",
  "In Repair",
];

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useCurrentUser();
  const vehicles = useAppStore((s) => s.vehicles);
  const users = useAppStore((s) => s.users);
  const setVehicleStatus = useAppStore((s) => s.setVehicleStatus);
  const markVehicleSold = useAppStore((s) => s.markVehicleSold);
  const { toast } = useToast();

  const [sellOpen, setSellOpen] = React.useState(false);
  const [soldPriceInput, setSoldPriceInput] = React.useState("");

  const vehicle = vehicles.find((v) => v.id === id);

  if (!user) return null;

  if (!vehicle) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <BackLink />
        <Card>
          <EmptyState
            icon={<SearchX className="h-8 w-8" />}
            title="Vehicle not found"
            hint="This unit may have been removed from the demo inventory. Head back to the inventory list to browse current stock."
          />
        </Card>
      </div>
    );
  }

  const v = vehicle;
  const financial = seesFinancials(user.role);
  const canEdit = can(user.role, "inventory", "edit");
  const isSold = v.status === "Sold";
  const salesperson = users.find((u) => u.id === v.assignedTo);
  const title = `${v.year} ${v.make} ${v.model} ${v.trim}`;
  const projMargin = margin(v);

  function openSellModal() {
    setSoldPriceInput(String(v.listingPrice));
    setSellOpen(true);
  }

  function confirmSale() {
    const price = Number(soldPriceInput);
    if (!Number.isFinite(price) || price <= 0) {
      toast("Enter a valid sold price", "error");
      return;
    }
    markVehicleSold(v.id, price);
    setSellOpen(false);
    toast(`🎉 ${v.make} ${v.model} sold for ${formatNaira(price)}!`);
  }

  function changeStatus(status: VehicleStatus) {
    setVehicleStatus(v.id, status);
    toast("Status updated");
  }

  const specs: [string, React.ReactNode][] = [
    ["VIN", <span key="vin" className="font-mono text-xs">{v.vin}</span>],
    ["Mileage", `${formatNumber(v.mileageKm)} km`],
    ["Color", v.color],
    ["Transmission", v.transmission],
    ["Fuel", v.fuel],
    ["Body type", v.bodyType],
    ["Location", v.location],
    ["Acquired", formatDate(v.acquiredAt)],
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <BackLink />

      {/* Hero */}
      <div className="grid gap-6 lg:grid-cols-5">
        <VehicleImage
          src={v.photo}
          alt={title}
          className="aspect-video w-full rounded-xl border shadow-xs lg:col-span-3"
          sizes="(max-width: 1024px) 100vw, 640px"
        />

        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{v.condition}</Badge>
            <StatusBadge status={v.status} />
            {!isSold && <DaysInStockChip days={v.daysInStock} />}
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-3 text-3xl font-bold tracking-tight">
            {formatNaira(v.listingPrice)}
          </p>
          <p className="mt-0.5 text-xs text-muted">Listing price</p>

          <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3.5 border-t pt-5 text-sm">
            {specs.map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-xs text-muted">{label}</dt>
                <dd className="mt-0.5 truncate font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Cost breakdown — financial roles only */}
          {financial && (
            <Card>
              <CardHeader
                title="Cost breakdown"
                subtitle="Landed cost vs pricing for this unit"
              />
              <div className="p-5">
                <dl className="space-y-2.5 text-sm">
                  <CostRow label="Purchase price" value={formatNaira(v.purchasePrice)} />
                  <CostRow label="Clearing cost" value={formatNaira(v.clearingCost)} />
                  <CostRow label="Repair cost" value={formatNaira(v.repairCost)} />
                  <div className="border-t pt-2.5">
                    <CostRow
                      label="Total cost"
                      value={formatNaira(totalCost(v))}
                      strong
                    />
                  </div>
                  <CostRow label="Listing price" value={formatNaira(v.listingPrice)} />
                  {isSold && v.soldPrice !== undefined && (
                    <CostRow label="Sold price" value={formatNaira(v.soldPrice)} strong />
                  )}
                  <div className="border-t pt-2.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="text-muted">
                        {isSold ? "Realized margin" : "Projected margin"}
                      </dt>
                      <dd
                        className={cn(
                          "font-semibold",
                          projMargin >= 0 ? "text-success" : "text-danger"
                        )}
                      >
                        {formatNaira(projMargin)}{" "}
                        <span className="text-xs font-medium">
                          ({marginPct(v) > 0 ? "+" : ""}
                          {marginPct(v)}%)
                        </span>
                      </dd>
                    </div>
                  </div>
                </dl>
              </div>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader title="Status timeline" subtitle="Journey of this unit" />
            <div className="p-5">
              <ol className="relative space-y-6 before:absolute before:left-[13px] before:top-2 before:bottom-2 before:w-px before:bg-border">
                <TimelineItem
                  icon={<CarFront className="h-3.5 w-3.5" />}
                  label="Acquired"
                  date={`${formatDate(v.acquiredAt)} · ${relativeDays(v.acquiredAt)}`}
                  detail={`Entered stock as ${v.condition}`}
                />
                {isSold ? (
                  <TimelineItem
                    icon={<Trophy className="h-3.5 w-3.5" />}
                    label="Sold"
                    date={v.soldAt ? formatDate(v.soldAt) : "—"}
                    detail={
                      v.soldPrice !== undefined
                        ? `Closed at ${formatNaira(v.soldPrice)}${salesperson ? ` by ${salesperson.name}` : ""}`
                        : "Sale recorded"
                    }
                    accent
                  />
                ) : (
                  <TimelineItem
                    icon={<CircleDot className="h-3.5 w-3.5" />}
                    label={`Currently ${v.status}`}
                    date="As of today"
                    detail={`${v.daysInStock} days in stock · ${v.location}`}
                    accent
                  />
                )}
              </ol>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Actions — edit permission only */}
          {canEdit && (
            <Card>
              <CardHeader title="Actions" subtitle="Update this unit" />
              <div className="space-y-4 p-5">
                <Field label="Status">
                  <Select
                    value={v.status}
                    onChange={(e) => changeStatus(e.target.value as VehicleStatus)}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                    {isSold && <option>Sold</option>}
                  </Select>
                </Field>
                {!isSold && (
                  <>
                    <Button className="w-full" onClick={openSellModal}>
                      <PartyPopper className="h-4 w-4" /> Mark as sold
                    </Button>
                    <p className="text-xs text-muted">
                      Recording a sale sets the sold price and closes out this unit.
                    </p>
                  </>
                )}
                {isSold && (
                  <p className="flex items-center gap-1.5 rounded-lg bg-success-subtle px-3 py-2 text-xs font-medium text-success">
                    <CalendarCheck className="h-3.5 w-3.5 shrink-0" />
                    Sold {v.soldAt ? relativeDays(v.soldAt) : ""}
                    {v.soldPrice !== undefined ? ` for ${formatNaira(v.soldPrice)}` : ""}
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* Assigned salesperson */}
          {salesperson && (
            <Card>
              <CardHeader title="Assigned salesperson" />
              <div className="flex items-center gap-3 p-5">
                <Avatar src={salesperson.avatar} name={salesperson.name} size={42} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{salesperson.name}</p>
                  <p className="truncate text-xs text-muted">{salesperson.title}</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      <ModuleRecommendations module="inventory" limit={1} />

      {/* Mark-as-sold modal */}
      <Modal open={sellOpen} onClose={() => setSellOpen(false)} title="Mark as sold">
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border bg-surface p-3">
            <VehicleImage
              src={v.photo}
              alt={title}
              className="h-12 w-20 shrink-0 rounded-md"
              sizes="80px"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{title}</p>
              <p className="text-xs text-muted">
                Listed at {formatNaira(v.listingPrice)} · {v.daysInStock} days in stock
              </p>
            </div>
          </div>

          <Field label="Sold price (₦)">
            <Input
              type="number"
              min={0}
              step={100000}
              value={soldPriceInput}
              onChange={(e) => setSoldPriceInput(e.target.value)}
              autoFocus
            />
          </Field>

          {financial && Number(soldPriceInput) > 0 && (
            <p className="text-xs text-muted">
              Realized margin at this price:{" "}
              <span
                className={cn(
                  "font-semibold",
                  Number(soldPriceInput) - totalCost(v) >= 0
                    ? "text-success"
                    : "text-danger"
                )}
              >
                {formatNaira(Number(soldPriceInput) - totalCost(v))}
              </span>
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setSellOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmSale}>
              <PartyPopper className="h-4 w-4" /> Confirm sale
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/inventory"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" /> Back to inventory
    </Link>
  );
}

function CostRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className={strong ? "font-semibold" : "font-medium"}>{value}</dd>
    </div>
  );
}

function TimelineItem({
  icon,
  label,
  date,
  detail,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  date: string;
  detail: string;
  accent?: boolean;
}) {
  return (
    <li className="relative flex gap-4">
      <span
        className={cn(
          "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
          accent
            ? "border-accent/30 bg-accent-subtle text-accent"
            : "bg-raised text-muted"
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 pt-0.5">
        <p className="text-sm font-semibold">{label}</p>
        <p className="mt-0.5 text-xs text-muted">{date}</p>
        <p className="mt-0.5 text-xs text-muted">{detail}</p>
      </div>
    </li>
  );
}
