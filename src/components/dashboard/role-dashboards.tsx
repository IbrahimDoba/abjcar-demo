"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Car,
  CheckSquare,
  ClipboardList,
  FileText,
  Hourglass,
  Inbox,
  Megaphone,
  Receipt,
  Timer,
  TrendingUp,
  Truck,
  Users,
  Wallet,
  Wrench,
  Zap,
} from "lucide-react";
import type {
  Expense,
  ExpenseStatus,
  TaskStatus,
  User,
  Vehicle,
  VehicleStatus,
} from "@/lib/types";
import { can, seesFinancials } from "@/lib/permissions";
import {
  availableVehicles,
  avgDaysInStock,
  expensesThisMonth,
  expenseTotal,
  inventoryValue,
  modelVelocity,
  pendingExpenses,
  profitThisMonth,
  revenueThisMonth,
  soldThisMonth,
} from "@/lib/stats";
import {
  formatDate,
  formatNaira,
  formatNairaCompact,
  formatNumber,
  relativeDays,
} from "@/lib/format";
import { useAppStore } from "@/store/app-store";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Progress,
  StatTile,
  Table,
  Td,
  Th,
  useToast,
  VehicleImage,
} from "@/components/ui/primitives";
import { ModuleRecommendations } from "@/components/assistant/recommendation-card";
import { BUDGET } from "@/data/seed/expenses";
import { CAMPAIGNS } from "@/data/seed/planning";
import {
  ActivityFeed,
  ExpenseCategoryBars,
  GreetingHeader,
  RevenueProfitChart,
  UpcomingMeetings,
  useNow,
  ViewAllLink,
} from "./widgets";

/* ------------------------------ Shared helpers ------------------------------ */

const expenseTone: Record<ExpenseStatus, "amber" | "green" | "red"> = {
  Pending: "amber",
  Approved: "green",
  Rejected: "red",
};

const taskTone: Record<TaskStatus, "neutral" | "blue" | "green"> = {
  todo: "neutral",
  in_progress: "blue",
  done: "green",
};

const taskLabel: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

const vehicleTone: Record<VehicleStatus, "neutral" | "blue" | "green" | "amber" | "red"> = {
  Available: "green",
  Reserved: "blue",
  Sold: "neutral",
  "In Repair": "amber",
  "In Transit": "blue",
};

const TILE_GRID = "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4";

/* ---------------------------- Executive dashboard --------------------------- */

export function ExecDashboard({ user }: { user: User }) {
  const vehicles = useAppStore((s) => s.vehicles);
  const expenses = useAppStore((s) => s.expenses);

  const revenue = revenueThisMonth(vehicles);
  const profit = profitThisMonth(vehicles);
  const soldCount = soldThisMonth(vehicles).length;
  const available = availableVehicles(vehicles).length;
  const monthSpend = expenseTotal(expensesThisMonth(expenses));
  const marginPct = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

  return (
    <div className="space-y-6">
      <GreetingHeader user={user} />

      <div className={TILE_GRID}>
        <StatTile
          label="Revenue this month"
          value={formatNairaCompact(revenue)}
          sub={`${soldCount} unit${soldCount === 1 ? "" : "s"} sold`}
          icon={<Wallet className="h-4 w-4" />}
        />
        {seesFinancials(user.role) && (
          <StatTile
            label="Profit this month"
            value={formatNairaCompact(profit)}
            sub={`${marginPct}% margin on sales`}
            icon={<TrendingUp className="h-4 w-4" />}
          />
        )}
        <StatTile
          label="Inventory value"
          value={formatNairaCompact(inventoryValue(vehicles))}
          sub={`${available} units available`}
          icon={<Car className="h-4 w-4" />}
        />
        <StatTile
          label="Expenses this month"
          value={formatNairaCompact(monthSpend)}
          sub="approved spend"
          icon={<Receipt className="h-4 w-4" />}
        />
      </div>

      <ModuleRecommendations module="dashboard" limit={2} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueProfitChart />
        </div>
        <ExpenseCategoryBars />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <UpcomingMeetings user={user} />
        <ActivityFeed />
      </div>
    </div>
  );
}

/* ------------------------------- CMO dashboard ------------------------------ */

export function CmoDashboard({ user }: { user: User }) {
  const vehicles = useAppStore((s) => s.vehicles);
  const expenses = useAppStore((s) => s.expenses);

  const marketingSpend = expenseTotal(
    expensesThisMonth(expenses).filter((e) => e.category === "Marketing")
  );
  const marketingBudget =
    BUDGET.find((b) => b.category === "Marketing")?.monthlyBudget ?? 0;
  const totalLeads = CAMPAIGNS.reduce((s, c) => s + c.leads, 0);
  const totalAttributed = CAMPAIGNS.reduce((s, c) => s + c.salesAttributed, 0);
  const soldCount = soldThisMonth(vehicles).length;

  const velocity = modelVelocity(vehicles);
  const fastest = velocity.slice(0, 3);
  const slowest = velocity.slice(-3).reverse();

  return (
    <div className="space-y-6">
      <GreetingHeader user={user} subtitle="Here's how the brand is performing today." />

      <div className={TILE_GRID}>
        <StatTile
          label="Marketing spend this month"
          value={formatNairaCompact(marketingSpend)}
          sub={`of ${formatNairaCompact(marketingBudget)} budget`}
          icon={<Megaphone className="h-4 w-4" />}
        />
        <StatTile
          label="Total leads"
          value={formatNumber(totalLeads)}
          sub={`${totalAttributed} sales attributed`}
          icon={<Users className="h-4 w-4" />}
        />
        <StatTile
          label="Revenue this month"
          value={formatNairaCompact(revenueThisMonth(vehicles))}
          sub={`${soldCount} unit${soldCount === 1 ? "" : "s"} sold`}
          icon={<Wallet className="h-4 w-4" />}
        />
        <StatTile
          label="Avg days in stock"
          value={`${avgDaysInStock(vehicles)}d`}
          sub="across active inventory"
          icon={<Timer className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Campaign performance"
            subtitle="Monthly spend and attribution by channel"
            action={<ViewAllLink href="/planning" />}
          />
          <div className="mt-3">
            <Table>
              <thead>
                <tr>
                  <Th>Campaign</Th>
                  <Th className="text-right">Spend</Th>
                  <Th className="text-right">Leads</Th>
                  <Th className="text-right">Cost / lead</Th>
                  <Th className="text-right">Sales</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {CAMPAIGNS.map((c) => (
                  <tr key={c.id}>
                    <Td>
                      <span className="block text-sm font-medium">{c.name}</span>
                      <span className="block text-xs text-muted">{c.channel}</span>
                    </Td>
                    <Td className="text-right">{formatNaira(c.monthlySpend)}</Td>
                    <Td className="text-right">{formatNumber(c.leads)}</Td>
                    <Td className="text-right">
                      {c.leads > 0 ? formatNaira(Math.round(c.monthlySpend / c.leads)) : "—"}
                    </Td>
                    <Td className="text-right font-medium">{c.salesAttributed}</Td>
                    <Td>
                      <Badge tone={c.status === "Active" ? "green" : "neutral"}>
                        {c.status}
                      </Badge>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Model velocity"
            subtitle="Avg days to sell, from sold units"
            action={<ViewAllLink href="/inventory" />}
          />
          <div className="space-y-5 p-5 pt-4">
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-success">
                <Zap className="h-3.5 w-3.5" /> Fastest sellers
              </p>
              <ul className="space-y-2">
                {fastest.map((m) => (
                  <li key={m.model} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate font-medium">{m.model}</span>
                    <span className="shrink-0 text-xs text-muted">
                      {m.avgDays}d avg · {m.sold} sold
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-t pt-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-warning">
                <Hourglass className="h-3.5 w-3.5" /> Slowest sellers
              </p>
              <ul className="space-y-2">
                {slowest.map((m) => (
                  <li key={m.model} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate font-medium">{m.model}</span>
                    <span className="shrink-0 text-xs text-muted">
                      {m.avgDays}d avg · {m.sold} sold
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </div>

      <UpcomingMeetings user={user} />
    </div>
  );
}

/* ----------------------------- Manager dashboard ---------------------------- */

function PendingApprovalsCard({ pending }: { pending: Expense[] }) {
  const users = useAppStore((s) => s.users);
  const setExpenseStatus = useAppStore((s) => s.setExpenseStatus);
  const { toast } = useToast();

  const preview = pending.slice(0, 3);

  function decide(e: Expense, status: "Approved" | "Rejected") {
    setExpenseStatus(e.id, status);
    toast(
      status === "Approved"
        ? `Approved ${formatNairaCompact(e.amount)} — ${e.category}`
        : `Rejected ${formatNairaCompact(e.amount)} — ${e.category}`,
      status === "Approved" ? "success" : "info"
    );
  }

  return (
    <Card>
      <CardHeader
        title="Pending approvals"
        subtitle={`${pending.length} expense${pending.length === 1 ? "" : "s"} awaiting review`}
        action={<ViewAllLink href="/expenses" />}
      />
      {preview.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="h-7 w-7" />}
          title="All caught up"
          hint="New expense claims that need your approval will land here."
        />
      ) : (
        <ul className="divide-y divide-border/60 p-2 pt-3">
          {preview.map((e) => {
            const submitter = users.find((u) => u.id === e.submittedBy);
            return (
              <li key={e.id} className="flex flex-wrap items-center gap-3 px-3 py-3">
                <Avatar src={submitter?.avatar} name={submitter?.name ?? "Unknown"} size={30} />
                <span className="min-w-0 flex-1 basis-40">
                  <span className="block truncate text-sm font-medium">{e.description}</span>
                  <span className="block truncate text-xs text-muted">
                    {submitter?.name ?? "Unknown"} · {e.category} · {relativeDays(e.date)}
                  </span>
                </span>
                <span className="text-sm font-semibold">{formatNaira(e.amount)}</span>
                <span className="flex shrink-0 gap-1.5">
                  <Button size="sm" variant="success" onClick={() => decide(e, "Approved")}>
                    Approve
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => decide(e, "Rejected")}>
                    Reject
                  </Button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function InventorySummaryCard({ vehicles }: { vehicles: Vehicle[] }) {
  const statuses: VehicleStatus[] = [
    "Available",
    "Reserved",
    "In Transit",
    "In Repair",
    "Sold",
  ];
  const total = vehicles.length || 1;

  return (
    <Card>
      <CardHeader
        title="Inventory summary"
        subtitle="All vehicles by status"
        action={<ViewAllLink href="/inventory" />}
      />
      <div className="space-y-4 p-5 pt-4">
        {statuses.map((status) => {
          const count = vehicles.filter((v) => v.status === status).length;
          return (
            <div key={status}>
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-medium">{status}</span>
                <span className="text-muted">{count} units</span>
              </div>
              <Progress value={(count / total) * 100} className="mt-1.5" />
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function ManagerDashboard({ user }: { user: User }) {
  const vehicles = useAppStore((s) => s.vehicles);
  const expenses = useAppStore((s) => s.expenses);
  const tasks = useAppStore((s) => s.tasks);

  const pending = pendingExpenses(expenses);
  const teamInProgress = tasks.filter(
    (t) => t.status === "in_progress" && t.department === user.department
  ).length;
  const soldCount = soldThisMonth(vehicles).length;
  const canApprove = can(user.role, "expenses", "approve");

  return (
    <div className="space-y-6">
      <GreetingHeader user={user} subtitle="Here's what needs your attention today." />

      <div className={TILE_GRID}>
        <Link href="/expenses" className="block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
          <StatTile
            label="Pending approvals"
            value={String(pending.length)}
            sub="tap to review in Expenses"
            icon={<Receipt className="h-4 w-4" />}
          />
        </Link>
        <StatTile
          label="Team tasks in progress"
          value={String(teamInProgress)}
          sub={`${user.department} department`}
          icon={<ClipboardList className="h-4 w-4" />}
        />
        <StatTile
          label="Available units"
          value={String(availableVehicles(vehicles).length)}
          sub="ready to sell"
          icon={<Car className="h-4 w-4" />}
        />
        <StatTile
          label="Sold this month"
          value={String(soldCount)}
          sub="units closed"
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      {canApprove && <PendingApprovalsCard pending={pending} />}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <UpcomingMeetings user={user} />
        <InventorySummaryCard vehicles={vehicles} />
      </div>
    </div>
  );
}

/* ----------------------------- Operator dashboard --------------------------- */

export function OperatorDashboard({ user }: { user: User }) {
  const vehicles = useAppStore((s) => s.vehicles);
  const equipment = useAppStore((s) => s.equipment);
  const tasks = useAppStore((s) => s.tasks);
  const now = useNow();

  const inTransit = vehicles.filter((v) => v.status === "In Transit");
  const inRepair = vehicles.filter((v) => v.status === "In Repair");
  const moving = [...inTransit, ...inRepair];

  const alerts = equipment
    .filter(
      (q) =>
        q.condition === "Needs Service" ||
        q.condition === "Broken" ||
        new Date(q.nextServiceDue).getTime() < now
    )
    .sort(
      (a, b) => new Date(a.nextServiceDue).getTime() - new Date(b.nextServiceDue).getTime()
    );

  const tasksDue = tasks.filter(
    (t) =>
      t.status !== "done" &&
      new Date(t.dueDate).getTime() <= now + 7 * 86_400_000
  ).length;

  return (
    <div className="space-y-6">
      <GreetingHeader user={user} subtitle="Movements, equipment and open work at a glance." />

      <div className={TILE_GRID}>
        <StatTile
          label="Units in transit"
          value={String(inTransit.length)}
          sub="incoming from port"
          icon={<Truck className="h-4 w-4" />}
        />
        <StatTile
          label="In repair"
          value={String(inRepair.length)}
          sub="at the workshop"
          icon={<Wrench className="h-4 w-4" />}
        />
        <StatTile
          label="Equipment needing service"
          value={String(alerts.length)}
          sub="incl. overdue service"
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <StatTile
          label="Tasks due"
          value={String(tasksDue)}
          sub="open, next 7 days"
          icon={<ClipboardList className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Equipment alerts"
            subtitle="Broken, needing service or overdue"
            action={<ViewAllLink href="/equipment" />}
          />
          {alerts.length === 0 ? (
            <EmptyState
              icon={<Wrench className="h-7 w-7" />}
              title="All equipment healthy"
              hint="Anything broken or due for service will be flagged here."
            />
          ) : (
            <ul className="divide-y divide-border/60 p-2 pt-3">
              {alerts.slice(0, 5).map((q) => (
                <li key={q.id} className="flex items-center gap-3 px-3 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{q.name}</span>
                    <span className="block truncate text-xs text-muted">
                      {q.location} · service due {relativeDays(q.nextServiceDue)}
                    </span>
                  </span>
                  <Badge
                    tone={q.condition === "Broken" ? "red" : "amber"}
                  >
                    {q.condition === "Good" || q.condition === "Fair"
                      ? "Service overdue"
                      : q.condition}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Vehicles on the move"
            subtitle="In transit and in repair"
            action={<ViewAllLink href="/inventory" />}
          />
          {moving.length === 0 ? (
            <EmptyState
              icon={<Truck className="h-7 w-7" />}
              title="Nothing in motion"
              hint="Units in transit or repair will be listed here."
            />
          ) : (
            <ul className="divide-y divide-border/60 p-2 pt-3">
              {moving.slice(0, 5).map((v) => (
                <li key={v.id} className="flex items-center gap-3 px-3 py-3">
                  <VehicleImage
                    src={v.photo}
                    alt={`${v.make} ${v.model}`}
                    className="h-12 w-16 shrink-0 rounded-lg"
                    sizes="64px"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {v.year} {v.make} {v.model}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {v.location} · {v.daysInStock}d in stock
                    </span>
                  </span>
                  <Badge tone={vehicleTone[v.status]}>{v.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------ Staff dashboard ----------------------------- */

export function StaffDashboard({ user }: { user: User }) {
  const vehicles = useAppStore((s) => s.vehicles);
  const expenses = useAppStore((s) => s.expenses);
  const tasks = useAppStore((s) => s.tasks);

  const myTasks = tasks
    .filter((t) => t.assignee === user.id)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const myClaims = expenses
    .filter((e) => e.submittedBy === user.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
  const myVehicles = vehicles.filter(
    (v) => v.assignedTo === user.id && v.status !== "Sold"
  );

  return (
    <div className="space-y-6">
      <GreetingHeader user={user} subtitle="Your tasks, claims and vehicles for today." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="My tasks"
            subtitle={`${myTasks.filter((t) => t.status !== "done").length} open`}
            action={<ViewAllLink href="/operations" />}
          />
          {myTasks.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="h-7 w-7" />}
              title="No tasks assigned"
              hint="Tasks assigned to you will show up here."
            />
          ) : (
            <ul className="divide-y divide-border/60 p-2 pt-3">
              {myTasks.slice(0, 5).map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-3 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{t.title}</span>
                    <span className="block truncate text-xs text-muted">
                      Due {relativeDays(t.dueDate)} · {t.priority} priority
                    </span>
                  </span>
                  <Badge tone={taskTone[t.status]}>{taskLabel[t.status]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="My expense claims"
            subtitle="Your latest submissions"
            action={<ViewAllLink href="/expenses" />}
          />
          {myClaims.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-7 w-7" />}
              title="No claims yet"
              hint="Expenses you submit will be tracked here."
            />
          ) : (
            <ul className="divide-y divide-border/60 p-2 pt-3">
              {myClaims.map((e) => (
                <li key={e.id} className="flex items-center gap-3 px-3 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{e.description}</span>
                    <span className="block truncate text-xs text-muted">
                      {e.category} · {formatDate(e.date)}
                    </span>
                  </span>
                  <span className="text-sm font-semibold">{formatNaira(e.amount)}</span>
                  <Badge tone={expenseTone[e.status]}>{e.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <UpcomingMeetings user={user} />

        <Card>
          <CardHeader
            title="My assigned vehicles"
            subtitle={`${myVehicles.length} unit${myVehicles.length === 1 ? "" : "s"} in your care`}
            action={<ViewAllLink href="/inventory" />}
          />
          {myVehicles.length === 0 ? (
            <EmptyState
              icon={<Inbox className="h-7 w-7" />}
              title="No vehicles assigned"
              hint="Vehicles assigned to you will appear here."
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 p-5 pt-4 sm:grid-cols-2">
              {myVehicles.slice(0, 4).map((v) => (
                <Link
                  key={v.id}
                  href="/inventory"
                  className="overflow-hidden rounded-xl border bg-raised transition-colors hover:border-accent/50"
                >
                  <VehicleImage
                    src={v.photo}
                    alt={`${v.make} ${v.model}`}
                    className="h-24 w-full"
                    sizes="300px"
                  />
                  <div className="p-3">
                    <p className="truncate text-sm font-medium">
                      {v.year} {v.make} {v.model}
                    </p>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="text-xs text-muted">
                        {formatNairaCompact(v.listingPrice)}
                      </span>
                      <Badge tone={vehicleTone[v.status]}>{v.status}</Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
