"use client";

import * as React from "react";
import {
  AlertTriangle,
  Boxes,
  CalendarClock,
  Search,
  Wallet,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { can } from "@/lib/permissions";
import {
  formatDate,
  formatNaira,
  formatNairaCompact,
  relativeDays,
} from "@/lib/format";
import type { Equipment, EquipmentCondition } from "@/lib/types";
import { useAppStore, useCurrentUser } from "@/store/app-store";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Avatar,
  EmptyState,
  Input,
  Select,
  StatTile,
  Table,
  Td,
  Th,
  useToast,
} from "@/components/ui/primitives";
import { ModuleRecommendations } from "@/components/assistant/recommendation-card";

const CONDITION_TONE: Record<
  EquipmentCondition,
  "green" | "neutral" | "amber" | "red"
> = {
  Good: "green",
  Fair: "neutral",
  "Needs Service": "amber",
  Broken: "red",
};

const CATEGORIES: Equipment["category"][] = [
  "Power",
  "Workshop",
  "Diagnostics",
  "Vehicles",
  "Office",
  "Security",
];

const DAY_MS = 86_400_000;

function daysUntil(iso: string): number {
  return (new Date(iso).getTime() - Date.now()) / DAY_MS;
}

function needsAttention(q: Equipment): boolean {
  return (
    q.condition === "Needs Service" ||
    q.condition === "Broken" ||
    daysUntil(q.nextServiceDue) < 0
  );
}

function NextDue({ iso }: { iso: string }) {
  const d = daysUntil(iso);
  return (
    <span
      className={cn(
        "font-medium",
        d < 0 ? "text-danger" : d < 14 ? "text-warning" : "text-muted"
      )}
    >
      {relativeDays(iso)}
    </span>
  );
}

export default function EquipmentPage() {
  const user = useCurrentUser();
  const equipment = useAppStore((s) => s.equipment);
  const maintenanceLogs = useAppStore((s) => s.maintenanceLogs);
  const users = useAppStore((s) => s.users);
  const logEquipmentService = useAppStore((s) => s.logEquipmentService);
  const { toast } = useToast();

  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState("All");

  if (!user) return null;
  const canEdit = can(user.role, "equipment", "edit");

  const totalValue = equipment.reduce((sum, q) => sum + q.cost, 0);
  const attention = equipment.filter(needsAttention);
  const dueSoon = equipment.filter((q) => {
    const d = daysUntil(q.nextServiceDue);
    return d >= 0 && d <= 14;
  });

  const filtered = equipment.filter((q) => {
    const matchesCategory = category === "All" || q.category === category;
    const needle = query.trim().toLowerCase();
    const matchesQuery =
      needle === "" ||
      q.name.toLowerCase().includes(needle) ||
      q.location.toLowerCase().includes(needle);
    return matchesCategory && matchesQuery;
  });

  const history = [...maintenanceLogs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const userName = (id?: string) =>
    users.find((u) => u.id === id)?.name ?? "Unknown";

  function handleLogService(id: string) {
    logEquipmentService(id);
    toast("Service logged — next due in 90 days");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Equipment</h1>
        <p className="mt-0.5 text-sm text-muted">
          Asset registry, service schedule and maintenance history.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatTile
          label="Total assets"
          value={String(equipment.length)}
          sub="registered on the books"
          icon={<Boxes className="h-4 w-4" />}
        />
        <StatTile
          label="Total asset value"
          value={formatNairaCompact(totalValue)}
          sub="purchase cost"
          icon={<Wallet className="h-4 w-4" />}
        />
        <StatTile
          label="Needing attention"
          value={String(attention.length)}
          sub="broken, faulty or overdue"
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <StatTile
          label="Service due soon"
          value={String(dueSoon.length)}
          sub="within the next 14 days"
          icon={<CalendarClock className="h-4 w-4" />}
        />
      </div>

      <ModuleRecommendations module="equipment" limit={1} />

      {attention.length > 0 && (
        <Card className="border-warning/30">
          <CardHeader
            title="Needs attention"
            subtitle={`${attention.length} asset${attention.length === 1 ? "" : "s"} broken, needing service or overdue`}
            action={
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning-subtle">
                <AlertTriangle className="h-4 w-4 text-warning" />
              </span>
            }
          />
          <div className="divide-y p-5 pt-3">
            {attention.map((q) => {
              const overdue = daysUntil(q.nextServiceDue) < 0;
              return (
                <div
                  key={q.id}
                  className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{q.name}</p>
                      <Badge tone={CONDITION_TONE[q.condition]}>
                        {q.condition}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {q.location} · service due{" "}
                      <span
                        className={cn(
                          "font-medium",
                          overdue ? "text-danger" : "text-warning"
                        )}
                      >
                        {relativeDays(q.nextServiceDue)}
                      </span>
                    </p>
                    {q.notes && (
                      <p className="mt-1 text-xs italic text-muted">{q.notes}</p>
                    )}
                  </div>
                  {canEdit && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleLogService(q.id)}
                    >
                      <Wrench className="h-3.5 w-3.5" /> Log service
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Asset registry"
          subtitle={`${filtered.length} of ${equipment.length} assets`}
        />
        <div className="flex flex-col gap-3 p-5 pb-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/70" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or location…"
              className="pl-9"
            />
          </div>
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="sm:w-44"
            aria-label="Filter by category"
          >
            <option value="All">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Boxes className="h-8 w-8" />}
            title="No assets match"
            hint="Try a different search term or clear the category filter."
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Asset</Th>
                <Th>Category</Th>
                <Th>Location</Th>
                <Th>Purchased</Th>
                <Th className="text-right">Cost</Th>
                <Th>Condition</Th>
                <Th>Last serviced</Th>
                <Th>Next due</Th>
                <Th>Assigned to</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q) => {
                const assignee = users.find((u) => u.id === q.assignedTo);
                return (
                  <tr key={q.id} className="transition-colors hover:bg-surface/60">
                    <Td className="font-medium">{q.name}</Td>
                    <Td>
                      <Badge tone="blue">{q.category}</Badge>
                    </Td>
                    <Td className="text-muted">{q.location}</Td>
                    <Td className="text-muted">{formatDate(q.purchaseDate)}</Td>
                    <Td className="text-right font-medium">
                      {formatNairaCompact(q.cost)}
                    </Td>
                    <Td>
                      <Badge tone={CONDITION_TONE[q.condition]}>
                        {q.condition}
                      </Badge>
                    </Td>
                    <Td className="text-muted">{formatDate(q.lastServicedAt)}</Td>
                    <Td>
                      <NextDue iso={q.nextServiceDue} />
                    </Td>
                    <Td>
                      {assignee ? (
                        <span className="flex items-center gap-2">
                          <Avatar src={assignee.avatar} name={assignee.name} size={24} />
                          <span className="text-xs">{assignee.name}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-muted/70">—</span>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Maintenance history"
          subtitle="Most recent service work first"
        />
        {history.length === 0 ? (
          <EmptyState
            icon={<Wrench className="h-8 w-8" />}
            title="No maintenance logged yet"
          />
        ) : (
          <div className="p-5 pt-3">
            <Table>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Asset</Th>
                  <Th>Work done</Th>
                  <Th className="text-right">Cost</Th>
                  <Th>By</Th>
                </tr>
              </thead>
              <tbody>
                {history.map((m) => {
                  const asset = equipment.find((q) => q.id === m.equipmentId);
                  return (
                    <tr key={m.id}>
                      <Td className="text-muted">{formatDate(m.date)}</Td>
                      <Td className="font-medium">{asset?.name ?? "Unknown asset"}</Td>
                      <Td className="whitespace-normal text-muted">{m.description}</Td>
                      <Td className="text-right font-medium">{formatNaira(m.cost)}</Td>
                      <Td className="text-muted">{userName(m.by)}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
