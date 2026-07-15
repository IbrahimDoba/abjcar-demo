"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CarFront,
  Clock,
  LayoutGrid,
  List,
  Plus,
  Search,
  SearchX,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { Vehicle, VehicleStatus } from "@/lib/types";
import { can, seesFinancials } from "@/lib/permissions";
import { formatNaira, formatNairaCompact } from "@/lib/format";
import {
  availableVehicles,
  avgDaysInStock,
  inventoryValue,
  margin,
  marginPct,
  soldThisMonth,
} from "@/lib/stats";
import { useAppStore, useCurrentUser } from "@/store/app-store";
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  Input,
  Select,
  StatTile,
  Table,
  Td,
  Th,
  VehicleImage,
} from "@/components/ui/primitives";
import { ModuleRecommendations } from "@/components/assistant/recommendation-card";
import { VehicleCard } from "@/components/inventory/vehicle-card";
import { StatusBadge, DaysInStockChip } from "@/components/inventory/vehicle-badges";
import { AddVehicleModal } from "@/components/inventory/add-vehicle-modal";

const STATUSES: VehicleStatus[] = [
  "Available",
  "Reserved",
  "In Transit",
  "In Repair",
  "Sold",
];

export default function InventoryPage() {
  const router = useRouter();
  const user = useCurrentUser();
  const vehicles = useAppStore((s) => s.vehicles);
  const users = useAppStore((s) => s.users);

  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [make, setMake] = React.useState("all");
  const [condition, setCondition] = React.useState("all");
  const [view, setView] = React.useState<"grid" | "table">("grid");
  const [addOpen, setAddOpen] = React.useState(false);

  const makes = React.useMemo(
    () => [...new Set(vehicles.map((v) => v.make))].sort(),
    [vehicles]
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return vehicles.filter((v) => {
      if (status !== "all" && v.status !== status) return false;
      if (make !== "all" && v.make !== make) return false;
      if (condition !== "all" && v.condition !== condition) return false;
      if (q) {
        const hay = `${v.year} ${v.make} ${v.model} ${v.trim} ${v.vin}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [vehicles, query, status, make, condition]);

  if (!user) return null;
  const financial = seesFinancials(user.role);
  const canCreate = can(user.role, "inventory", "create");

  const active = vehicles.filter((v) => v.status !== "Sold");
  const sold = soldThisMonth(vehicles);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Inventory</h1>
          <p className="mt-0.5 text-sm text-muted">
            Every unit across showrooms, the lot, the workshop and the port.
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add vehicle
          </Button>
        )}
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Active units"
          value={String(active.length)}
          sub={`${availableVehicles(vehicles).length} available now`}
          icon={<CarFront className="h-4 w-4" />}
        />
        <StatTile
          label="Inventory value"
          value={formatNairaCompact(inventoryValue(vehicles))}
          sub="active stock at listing price"
          icon={<Wallet className="h-4 w-4" />}
        />
        <StatTile
          label="Avg days in stock"
          value={`${avgDaysInStock(vehicles)}d`}
          sub="across active units"
          icon={<Clock className="h-4 w-4" />}
        />
        <StatTile
          label="Sold this month"
          value={String(sold.length)}
          sub={
            financial
              ? `${formatNairaCompact(sold.reduce((s, v) => s + (v.soldPrice ?? 0), 0))} revenue`
              : "units closed"
          }
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      <ModuleRecommendations module="inventory" limit={2} />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search make, model or VIN…"
            className="pl-9"
            aria-label="Search inventory"
          />
        </div>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-auto min-w-36"
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
        <Select
          value={make}
          onChange={(e) => setMake(e.target.value)}
          className="w-auto min-w-32"
          aria-label="Filter by make"
        >
          <option value="all">All makes</option>
          {makes.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </Select>
        <Select
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          className="w-auto min-w-36"
          aria-label="Filter by condition"
        >
          <option value="all">All conditions</option>
          <option>Brand New</option>
          <option>Foreign Used</option>
          <option>Nigerian Used</option>
        </Select>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-xs text-muted sm:block">
            {filtered.length} of {vehicles.length} vehicles
          </span>
          <div className="flex items-center rounded-lg border bg-raised p-0.5">
            <ViewToggleButton
              active={view === "grid"}
              onClick={() => setView("grid")}
              label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </ViewToggleButton>
            <ViewToggleButton
              active={view === "table"}
              onClick={() => setView("table")}
              label="Table view"
            >
              <List className="h-4 w-4" />
            </ViewToggleButton>
          </div>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<SearchX className="h-8 w-8" />}
            title="No vehicles match your filters"
            hint="Try a different search term, or clear the status, make and condition filters."
          />
        </Card>
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((v) => (
            <VehicleCard key={v.id} vehicle={v} />
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <thead>
              <tr>
                <Th>Vehicle</Th>
                <Th>Condition</Th>
                <Th>Status</Th>
                <Th>Days in stock</Th>
                <Th className="text-right">Listing price</Th>
                {financial && <Th className="text-right">Margin</Th>}
                <Th>Salesperson</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <InventoryRow
                  key={v.id}
                  vehicle={v}
                  financial={financial}
                  salesperson={users.find((u) => u.id === v.assignedTo)}
                  onOpen={() => router.push(`/inventory/${v.id}`)}
                />
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {canCreate && <AddVehicleModal open={addOpen} onClose={() => setAddOpen(false)} />}
    </div>
  );
}

function ViewToggleButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "cursor-pointer rounded-md p-1.5 transition-colors",
        active
          ? "bg-accent-subtle text-accent"
          : "text-muted hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function InventoryRow({
  vehicle: v,
  financial,
  salesperson,
  onOpen,
}: {
  vehicle: Vehicle;
  financial: boolean;
  salesperson?: { name: string; avatar: string };
  onOpen: () => void;
}) {
  const pct = marginPct(v);
  return (
    <tr
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      tabIndex={0}
      className="cursor-pointer transition-colors hover:bg-surface focus-visible:bg-surface focus-visible:outline-none"
    >
      <Td>
        <div className="flex items-center gap-3">
          <VehicleImage
            src={v.photo}
            alt={`${v.make} ${v.model}`}
            className="h-10 w-16 shrink-0 rounded-md"
            sizes="64px"
          />
          <div className="min-w-0">
            <p className="truncate font-medium">
              {v.year} {v.make} {v.model}
            </p>
            <p className="truncate text-xs text-muted">
              {v.trim} · {v.location}
            </p>
          </div>
        </div>
      </Td>
      <Td className="text-muted">{v.condition}</Td>
      <Td>
        <StatusBadge status={v.status} />
      </Td>
      <Td>
        <DaysInStockChip days={v.daysInStock} />
      </Td>
      <Td className="text-right font-semibold">{formatNaira(v.listingPrice)}</Td>
      {financial && (
        <Td
          className={cn(
            "text-right font-medium",
            margin(v) >= 0 ? "text-success" : "text-danger"
          )}
        >
          {pct > 0 ? "+" : ""}
          {pct}%
        </Td>
      )}
      <Td>
        {salesperson ? (
          <div className="flex items-center gap-2">
            <Avatar src={salesperson.avatar} name={salesperson.name} size={24} />
            <span className="text-xs">{salesperson.name}</span>
          </div>
        ) : (
          <span className="text-xs text-muted">Unassigned</span>
        )}
      </Td>
    </tr>
  );
}
