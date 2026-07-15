"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Download, FileBarChart, PackageOpen, Users } from "lucide-react";
import { useAppStore, useCurrentUser } from "@/store/app-store";
import { seesFinancials } from "@/lib/permissions";
import {
  formatNaira,
  formatNairaCompact,
  formatDate,
  formatNumber,
} from "@/lib/format";
import { margin, byCategory } from "@/lib/stats";
import { SALES_HISTORY } from "@/data/seed/planning";
import { cn } from "@/lib/cn";
import type { Vehicle } from "@/lib/types";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Select,
  StatTile,
  Table,
  Td,
  Th,
  useToast,
} from "@/components/ui/primitives";

type TabKey = "sales" | "aging" | "expenses" | "staff";

const TABS: { key: TabKey; label: string }[] = [
  { key: "sales", label: "Sales performance" },
  { key: "aging", label: "Inventory aging" },
  { key: "expenses", label: "Expense summary" },
  { key: "staff", label: "Staff performance" },
];

const STATUS_TONE: Record<Vehicle["status"], "neutral" | "blue" | "green" | "amber" | "red"> = {
  Available: "green",
  Reserved: "blue",
  Sold: "neutral",
  "In Repair": "amber",
  "In Transit": "neutral",
};

/* ------------------------------- CSV export -------------------------------- */

function toCsv(headers: string[], rows: (string | number)[][]): string {
  const esc = (c: string | number) => {
    const s = String(c);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers, ...rows].map((r) => r.map(esc).join(",")).join("\n");
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------------------------------- Page ----------------------------------- */

export default function ReportsPage() {
  const user = useCurrentUser();
  const vehicles = useAppStore((s) => s.vehicles);
  const expenses = useAppStore((s) => s.expenses);
  const users = useAppStore((s) => s.users);
  const { toast } = useToast();

  const [tab, setTab] = React.useState<TabKey>("sales");
  const [months, setMonths] = React.useState(6);

  if (!user) return null;
  const financials = seesFinancials(user.role);

  // Start of the selected window (first day of the earliest month).
  const rangeStart = new Date();
  rangeStart.setDate(1);
  rangeStart.setHours(0, 0, 0, 0);
  rangeStart.setMonth(rangeStart.getMonth() - (months - 1));
  const inRange = (iso: string) => new Date(iso) >= rangeStart;

  const nameOf = (id?: string) => users.find((u) => u.id === id)?.name ?? "—";

  /* ------------------------------ Sales data ------------------------------- */

  const chartData = SALES_HISTORY.slice(-months);
  const soldVehicles = vehicles
    .filter((v) => v.status === "Sold" && v.soldAt && inRange(v.soldAt))
    .sort((a, b) => new Date(b.soldAt!).getTime() - new Date(a.soldAt!).getTime());
  const soldRevenue = soldVehicles.reduce((s, v) => s + (v.soldPrice ?? 0), 0);
  const soldMargin = soldVehicles.reduce((s, v) => s + margin(v), 0);

  /* ------------------------------ Aging data ------------------------------- */

  const inStock = vehicles.filter((v) => v.status !== "Sold");
  const buckets = [
    { label: "0–30 days", vehicles: inStock.filter((v) => v.daysInStock <= 30) },
    { label: "31–60 days", vehicles: inStock.filter((v) => v.daysInStock > 30 && v.daysInStock <= 60) },
    { label: "61–90 days", vehicles: inStock.filter((v) => v.daysInStock > 60 && v.daysInStock <= 90) },
    { label: "90+ days", vehicles: inStock.filter((v) => v.daysInStock > 90) },
  ].map((b) => ({
    ...b,
    capital: b.vehicles.reduce((s, v) => s + v.listingPrice, 0),
  }));
  const agingSorted = [...inStock].sort((a, b) => b.daysInStock - a.daysInStock);

  /* ----------------------------- Expense data ------------------------------ */

  const approvedInRange = expenses.filter(
    (e) => e.status === "Approved" && inRange(e.date)
  );
  const categories = byCategory(approvedInRange);
  const expenseTotalAmount = categories.reduce((s, c) => s + c.total, 0);
  const maxCategory = categories[0]?.total ?? 0;
  const categoryRows = categories.map((c) => {
    const inCat = approvedInRange.filter((e) => e.category === c.category);
    const bySubmitter = new Map<string, number>();
    for (const e of inCat)
      bySubmitter.set(e.submittedBy, (bySubmitter.get(e.submittedBy) ?? 0) + e.amount);
    const top = [...bySubmitter.entries()].sort((a, b) => b[1] - a[1])[0];
    return {
      category: c.category,
      total: c.total,
      count: inCat.length,
      topSubmitter: nameOf(top?.[0]),
    };
  });

  /* ------------------------------ Staff data ------------------------------- */

  const salespeople = users.filter(
    (u) => u.department === "Sales" && (u.role === "staff" || u.role === "manager")
  );
  const staffRows = salespeople.map((u) => {
    const sold = vehicles.filter(
      (v) =>
        v.status === "Sold" && v.assignedTo === u.id && v.soldAt && inRange(v.soldAt)
    );
    const revenue = sold.reduce((s, v) => s + (v.soldPrice ?? 0), 0);
    const avgDays =
      sold.length === 0
        ? 0
        : Math.round(sold.reduce((s, v) => s + v.daysInStock, 0) / sold.length);
    const active = vehicles.filter(
      (v) => v.status !== "Sold" && v.assignedTo === u.id
    ).length;
    return { user: u, units: sold.length, revenue, avgDays, active };
  });

  /* -------------------------------- Export --------------------------------- */

  function exportCsv() {
    let filename = "";
    let csv = "";
    if (tab === "sales") {
      filename = "abujacar-sales-report.csv";
      csv = financials
        ? toCsv(
            ["Vehicle", "Sold date", "Sold price (NGN)", "Margin (NGN)", "Salesperson"],
            soldVehicles.map((v) => [
              `${v.make} ${v.model} ${v.year}`,
              formatDate(v.soldAt!),
              v.soldPrice ?? 0,
              margin(v),
              nameOf(v.assignedTo),
            ])
          )
        : toCsv(
            ["Vehicle", "Sold date", "Salesperson"],
            soldVehicles.map((v) => [
              `${v.make} ${v.model} ${v.year}`,
              formatDate(v.soldAt!),
              nameOf(v.assignedTo),
            ])
          );
    } else if (tab === "aging") {
      filename = "abujacar-inventory-aging-report.csv";
      csv = toCsv(
        ["Vehicle", "Status", "Days in stock", "Location", "Listing price (NGN)"],
        agingSorted.map((v) => [
          `${v.make} ${v.model} ${v.year}`,
          v.status,
          v.daysInStock,
          v.location,
          v.listingPrice,
        ])
      );
    } else if (tab === "expenses") {
      filename = "abujacar-expense-report.csv";
      csv = toCsv(
        ["Category", "Total (NGN)", "Entries", "Top submitter"],
        categoryRows.map((r) => [r.category, r.total, r.count, r.topSubmitter])
      );
    } else {
      filename = "abujacar-staff-report.csv";
      csv = toCsv(
        ["Salesperson", "Units sold", "Revenue (NGN)", "Avg days in stock", "Active listings"],
        staffRows.map((r) => [r.user.name, r.units, r.revenue, r.avgDays, r.active])
      );
    }
    downloadCsv(filename, csv);
    toast("Report exported");
  }

  /* --------------------------------- Render -------------------------------- */

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Reports</h1>
          <p className="text-sm text-muted">
            Performance, aging and spend — computed live from your data.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            aria-label="Date range"
            value={String(months)}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="h-8 w-40 text-xs"
          >
            <option value="1">This month</option>
            <option value="3">Last 3 months</option>
            <option value="6">Last 6 months</option>
          </Select>
          <Button size="sm" variant="secondary" onClick={exportCsv}>
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Tab pills */}
      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
              tab === t.key
                ? "bg-accent text-white shadow-sm"
                : "border bg-raised text-muted hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ----------------------------- Sales tab ----------------------------- */}
      {tab === "sales" && (
        <div className="space-y-5">
          <Card>
            <CardHeader
              title="Units sold & revenue"
              subtitle={`Monthly performance over the last ${months === 1 ? "month" : `${months} months`}`}
            />
            <div className="h-64 p-5 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeOpacity={0.15} vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                  />
                  <YAxis
                    yAxisId="revenue"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickFormatter={(v: number) => formatNairaCompact(v)}
                    width={58}
                  />
                  <YAxis yAxisId="units" orientation="right" hide />
                  <Tooltip
                    contentStyle={{
                      background: "var(--surface-raised)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                      color: "var(--foreground)",
                    }}
                    formatter={(value, name) => [
                      name === "Revenue"
                        ? formatNairaCompact(Number(value))
                        : formatNumber(Number(value)),
                      name,
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} iconSize={10} />
                  <Bar
                    yAxisId="units"
                    dataKey="unitsSold"
                    name="Units sold"
                    fill="#94a3b8"
                    radius={[4, 4, 0, 0]}
                    barSize={22}
                  />
                  <Area
                    yAxisId="revenue"
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="#3b82f6"
                    fillOpacity={0.12}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Vehicles sold"
              subtitle={`${soldVehicles.length} sold in the selected period`}
            />
            <div className="p-2 pt-3">
              {soldVehicles.length === 0 ? (
                <EmptyState
                  icon={<FileBarChart className="h-8 w-8" />}
                  title="No sales in this period"
                  hint="Widen the date range or mark a vehicle as sold from Inventory."
                />
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <Th>Vehicle</Th>
                      <Th>Sold date</Th>
                      {financials && <Th className="text-right">Sold price</Th>}
                      {financials && <Th className="text-right">Margin</Th>}
                      <Th>Salesperson</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {soldVehicles.map((v) => (
                      <tr key={v.id}>
                        <Td className="font-medium">
                          {v.make} {v.model} {v.year}
                        </Td>
                        <Td className="text-muted">{formatDate(v.soldAt!)}</Td>
                        {financials && (
                          <Td className="text-right">{formatNaira(v.soldPrice ?? 0)}</Td>
                        )}
                        {financials && (
                          <Td
                            className={cn(
                              "text-right font-medium",
                              margin(v) >= 0 ? "text-success" : "text-danger"
                            )}
                          >
                            {formatNaira(margin(v))}
                          </Td>
                        )}
                        <Td className="text-muted">{nameOf(v.assignedTo)}</Td>
                      </tr>
                    ))}
                    <tr>
                      <Td className="border-b-0 font-semibold">Total</Td>
                      <Td className="border-b-0 text-muted">
                        {soldVehicles.length} units
                      </Td>
                      {financials && (
                        <Td className="border-b-0 text-right font-semibold">
                          {formatNaira(soldRevenue)}
                        </Td>
                      )}
                      {financials && (
                        <Td className="border-b-0 text-right font-semibold text-success">
                          {formatNaira(soldMargin)}
                        </Td>
                      )}
                      <Td className="border-b-0" />
                    </tr>
                  </tbody>
                </Table>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ----------------------------- Aging tab ------------------------------ */}
      {tab === "aging" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {buckets.map((b) => (
              <StatTile
                key={b.label}
                label={b.label}
                value={String(b.vehicles.length)}
                sub={`${formatNairaCompact(b.capital)} tied up`}
              />
            ))}
          </div>

          <Card>
            <CardHeader
              title="Stock by age"
              subtitle="Every unsold vehicle, oldest first — aging stock ties up capital"
            />
            <div className="p-2 pt-3">
              {agingSorted.length === 0 ? (
                <EmptyState
                  icon={<PackageOpen className="h-8 w-8" />}
                  title="No vehicles in stock"
                />
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <Th>Vehicle</Th>
                      <Th>Status</Th>
                      <Th className="text-right">Days in stock</Th>
                      <Th>Location</Th>
                      <Th className="text-right">Listing price</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {agingSorted.map((v) => (
                      <tr key={v.id}>
                        <Td className="font-medium">
                          {v.make} {v.model} {v.year}
                        </Td>
                        <Td>
                          <Badge tone={STATUS_TONE[v.status]}>{v.status}</Badge>
                        </Td>
                        <Td
                          className={cn(
                            "text-right",
                            v.daysInStock >= 90
                              ? "font-semibold text-danger"
                              : v.daysInStock >= 60
                                ? "font-semibold text-warning"
                                : "text-muted"
                          )}
                        >
                          {v.daysInStock}
                        </Td>
                        <Td className="text-muted">{v.location}</Td>
                        <Td className="text-right">{formatNaira(v.listingPrice)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ---------------------------- Expenses tab ---------------------------- */}
      {tab === "expenses" && (
        <div className="space-y-5">
          <Card>
            <CardHeader
              title="Spend by category"
              subtitle={`${formatNairaCompact(expenseTotalAmount)} approved in the selected period`}
            />
            <div className="space-y-3 p-5">
              {categories.length === 0 ? (
                <EmptyState
                  icon={<FileBarChart className="h-8 w-8" />}
                  title="No approved expenses in this period"
                />
              ) : (
                categories.map((c) => {
                  const share =
                    expenseTotalAmount === 0
                      ? 0
                      : Math.round((c.total / expenseTotalAmount) * 100);
                  return (
                    <div key={c.category}>
                      <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                        <span className="font-medium">{c.category}</span>
                        <span className="text-muted">
                          {formatNairaCompact(c.total)}
                          <span className="ml-1.5 text-xs">· {share}%</span>
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{
                            width: `${maxCategory === 0 ? 0 : (c.total / maxCategory) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {categoryRows.length > 0 && (
            <Card>
              <CardHeader title="Category detail" />
              <div className="p-2 pt-3">
                <Table>
                  <thead>
                    <tr>
                      <Th>Category</Th>
                      <Th className="text-right">Total</Th>
                      <Th className="text-right">Entries</Th>
                      <Th>Top submitter</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryRows.map((r) => (
                      <tr key={r.category}>
                        <Td className="font-medium">{r.category}</Td>
                        <Td className="text-right">{formatNaira(r.total)}</Td>
                        <Td className="text-right text-muted">{r.count}</Td>
                        <Td className="text-muted">{r.topSubmitter}</Td>
                      </tr>
                    ))}
                    <tr>
                      <Td className="border-b-0 font-semibold">Total</Td>
                      <Td className="border-b-0 text-right font-semibold">
                        {formatNaira(expenseTotalAmount)}
                      </Td>
                      <Td className="border-b-0 text-right font-semibold">
                        {categoryRows.reduce((s, r) => s + r.count, 0)}
                      </Td>
                      <Td className="border-b-0" />
                    </tr>
                  </tbody>
                </Table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ----------------------------- Staff tab ------------------------------ */}
      {tab === "staff" && (
        <div className="space-y-5">
          {staffRows.length === 0 ? (
            <Card>
              <EmptyState
                icon={<Users className="h-8 w-8" />}
                title="No salespeople found"
                hint="Staff performance covers staff and managers in the Sales department."
              />
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {staffRows.map((r) => (
                <Card key={r.user.id} className="p-5">
                  <div className="flex items-center gap-3">
                    <Avatar src={r.user.avatar} name={r.user.name} size={42} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{r.user.name}</p>
                      <p className="truncate text-xs text-muted">{r.user.title}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                        Units sold
                      </p>
                      <p className="mt-0.5 text-lg font-semibold tracking-tight">
                        {r.units}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                        Revenue
                      </p>
                      <p className="mt-0.5 text-lg font-semibold tracking-tight">
                        {formatNairaCompact(r.revenue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                        Avg days to sell
                      </p>
                      <p className="mt-0.5 text-lg font-semibold tracking-tight">
                        {r.units === 0 ? "—" : r.avgDays}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                        Active listings
                      </p>
                      <p className="mt-0.5 text-lg font-semibold tracking-tight">
                        {r.active}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
