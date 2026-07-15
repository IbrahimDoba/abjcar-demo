"use client";

import * as React from "react";
import { Gauge, Hourglass, Plus, ReceiptText, Tag, Wallet } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ExpenseCategory, ExpenseStatus } from "@/lib/types";
import { can, ownExpensesOnly } from "@/lib/permissions";
import {
  byCategory,
  expensesThisMonth,
  expenseTotal,
  pendingExpenses,
} from "@/lib/stats";
import { formatDate, formatNaira, formatNairaCompact } from "@/lib/format";
import { useAppStore, useCurrentUser } from "@/store/app-store";
import { BUDGET } from "@/data/seed/expenses";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Input,
  Select,
  StatTile,
  Table,
  Td,
  Th,
} from "@/components/ui/primitives";
import { ModuleRecommendations } from "@/components/assistant/recommendation-card";
import { ApprovalQueue } from "@/components/expenses/approval-queue";
import {
  BudgetVsActualCard,
  SpendTrendCard,
} from "@/components/expenses/expense-charts";
import { SubmitExpenseModal } from "@/components/expenses/submit-expense-modal";

const CATEGORIES: ExpenseCategory[] = BUDGET.map((b) => b.category);
const STATUSES: ExpenseStatus[] = ["Pending", "Approved", "Rejected"];
const STATUS_TONE: Record<ExpenseStatus, "amber" | "green" | "red"> = {
  Pending: "amber",
  Approved: "green",
  Rejected: "red",
};
const MAX_ROWS = 30;
const TOTAL_BUDGET = BUDGET.reduce((s, b) => s + b.monthlyBudget, 0);

export default function ExpensesPage() {
  const user = useCurrentUser();
  const expenses = useAppStore((s) => s.expenses);
  const users = useAppStore((s) => s.users);

  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState<"All" | ExpenseCategory>("All");
  const [status, setStatus] = React.useState<"All" | ExpenseStatus>("All");
  const [submitOpen, setSubmitOpen] = React.useState(false);

  const mineOnly = user ? ownExpensesOnly(user.role) : false;

  // Staff see only their own submissions — everywhere on this page.
  const visible = React.useMemo(
    () =>
      mineOnly && user
        ? expenses.filter((e) => e.submittedBy === user.id)
        : expenses,
    [expenses, mineOnly, user]
  );

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return visible
      .filter(
        (e) =>
          (category === "All" || e.category === category) &&
          (status === "All" || e.status === status) &&
          (q === "" || e.description.toLowerCase().includes(q))
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [visible, search, category, status]);

  if (!user) return null;

  const canCreate = can(user.role, "expenses", "create");
  const canApprove = can(user.role, "expenses", "approve");

  const approvedThisMonth = expensesThisMonth(visible);
  const spendThisMonth = expenseTotal(approvedThisMonth);
  const pending = pendingExpenses(visible);
  const pendingTotal = expenseTotal(pending);
  const topCategory = byCategory(approvedThisMonth)[0];
  const budgetPct = Math.round((spendThisMonth / TOTAL_BUDGET) * 100);

  const rows = filtered.slice(0, MAX_ROWS);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Stat tiles */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Spend this month"
          value={formatNairaCompact(spendThisMonth)}
          sub={`${approvedThisMonth.length} approved expense${approvedThisMonth.length === 1 ? "" : "s"}`}
          icon={<Wallet className="h-4 w-4" />}
        />
        <StatTile
          label="Pending approvals"
          value={String(pending.length)}
          sub={pending.length > 0 ? `${formatNairaCompact(pendingTotal)} awaiting decision` : "queue is clear"}
          icon={<Hourglass className="h-4 w-4" />}
        />
        <StatTile
          label="Biggest category"
          value={topCategory ? topCategory.category : "—"}
          sub={
            topCategory
              ? `${formatNairaCompact(topCategory.total)} this month`
              : "no approved spend yet"
          }
          icon={<Tag className="h-4 w-4" />}
        />
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <p className="text-xs font-medium text-muted">Budget used</p>
            <span className="text-muted/70">
              <Gauge className="h-4 w-4" />
            </span>
          </div>
          <p
            className={cn(
              "mt-2 text-2xl font-semibold tracking-tight",
              budgetPct > 100 && "text-danger"
            )}
          >
            {budgetPct}%
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                budgetPct > 100 ? "bg-danger" : "bg-accent"
              )}
              style={{ width: `${Math.min(100, Math.max(0, budgetPct))}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-muted">
            {formatNairaCompact(spendThisMonth)} of {formatNairaCompact(TOTAL_BUDGET)}{" "}
            monthly budget
          </p>
        </Card>
      </div>

      <ModuleRecommendations module="expenses" limit={2} />

      {canApprove && <ApprovalQueue />}

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SpendTrendCard expenses={visible} />
        <BudgetVsActualCard expenses={visible} />
      </div>

      {/* Ledger */}
      <Card>
        <CardHeader
          title={mineOnly ? "My expenses" : "Expense ledger"}
          subtitle={
            mineOnly
              ? "Everything you've submitted, newest first"
              : "Every submission across the business, newest first"
          }
          action={
            canCreate ? (
              <Button size="sm" onClick={() => setSubmitOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Submit expense
              </Button>
            ) : undefined
          }
        />

        <div className="flex flex-col gap-2 p-5 pb-4 sm:flex-row">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search descriptions…"
            className="sm:max-w-xs"
          />
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value as "All" | ExpenseCategory)}
            className="sm:w-48"
          >
            <option value="All">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as "All" | ExpenseStatus)}
            className="sm:w-40"
          >
            <option value="All">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={<ReceiptText className="h-8 w-8" />}
            title="No expenses match"
            hint="Try clearing the search or filters — or submit a new expense."
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Description</Th>
                  <Th>Category</Th>
                  <Th>Department</Th>
                  <Th className="text-right">Amount</Th>
                  <Th>Status</Th>
                  <Th>Approved by</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => {
                  const submitter = users.find((u) => u.id === e.submittedBy);
                  const approver = users.find((u) => u.id === e.approvedBy);
                  return (
                    <tr key={e.id} className="hover:bg-surface/60">
                      <Td className="text-muted">{formatDate(e.date)}</Td>
                      <Td>
                        <p className="max-w-72 truncate text-sm font-medium">
                          {e.description}
                        </p>
                        <span className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                          <Avatar
                            src={submitter?.avatar}
                            name={submitter?.name ?? "Unknown"}
                            size={16}
                          />
                          {submitter?.name ?? "Unknown"}
                        </span>
                      </Td>
                      <Td>
                        <Badge>{e.category}</Badge>
                      </Td>
                      <Td className="text-muted">{e.department}</Td>
                      <Td className="text-right font-semibold tabular-nums">
                        {formatNaira(e.amount)}
                      </Td>
                      <Td>
                        <Badge tone={STATUS_TONE[e.status]}>{e.status}</Badge>
                      </Td>
                      <Td className="text-muted">
                        {approver ? approver.name : "—"}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
            <p className="px-5 py-3 text-xs text-muted">
              Showing {rows.length} of {filtered.length} expense
              {filtered.length === 1 ? "" : "s"}
              {filtered.length > rows.length && " — refine the filters to see more"}
            </p>
          </>
        )}
      </Card>

      <SubmitExpenseModal open={submitOpen} onClose={() => setSubmitOpen(false)} />
    </div>
  );
}
