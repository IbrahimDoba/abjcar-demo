"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/cn";
import type { Expense } from "@/lib/types";
import { expensesThisMonth, monthlyExpenseSeries } from "@/lib/stats";
import { formatNaira, formatNairaCompact } from "@/lib/format";
import { BUDGET } from "@/data/seed/expenses";
import { Card, CardHeader } from "@/components/ui/primitives";

/** Approved spend per month, last 6 months. */
export function SpendTrendCard({ expenses }: { expenses: Expense[] }) {
  const series = React.useMemo(() => monthlyExpenseSeries(expenses, 6), [expenses]);

  return (
    <Card>
      <CardHeader
        title="Monthly spend trend"
        subtitle="Approved expenses, last 6 months"
      />
      <div className="p-5 pt-4">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={series} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeOpacity={0.15} vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickFormatter={(v) => formatNairaCompact(Number(v))}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <Tooltip
              cursor={{ fill: "var(--border)", opacity: 0.25 }}
              contentStyle={{
                background: "var(--surface-raised)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
                color: "var(--foreground)",
              }}
              formatter={(value) => [formatNaira(Number(value)), "Spend"]}
            />
            <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

/**
 * Budget vs actual per category, this month. Uses a custom thin bar rather
 * than <Progress> because here 100% is bad news: blue while under budget,
 * red once a category has blown through it.
 */
export function BudgetVsActualCard({ expenses }: { expenses: Expense[] }) {
  const rows = React.useMemo(() => {
    const approved = expensesThisMonth(expenses);
    return BUDGET.map((b) => {
      const actual = approved
        .filter((e) => e.category === b.category)
        .reduce((s, e) => s + e.amount, 0);
      const pct = b.monthlyBudget === 0 ? 0 : Math.round((actual / b.monthlyBudget) * 100);
      return { ...b, actual, pct };
    }).sort((a, b) => b.pct - a.pct);
  }, [expenses]);

  return (
    <Card>
      <CardHeader
        title="Budget vs actual"
        subtitle="Approved spend against plan, this month"
      />
      <div className="space-y-3.5 p-5 pt-4">
        {rows.map((r) => {
          const over = r.pct > 100;
          return (
            <div key={r.category}>
              <div className="flex items-baseline justify-between gap-3 text-xs">
                <span className="truncate font-medium">{r.category}</span>
                <span className="shrink-0 tabular-nums text-muted">
                  {formatNairaCompact(r.actual)} / {formatNairaCompact(r.monthlyBudget)}
                  <span
                    className={cn(
                      "ml-2 font-semibold",
                      over ? "text-danger" : "text-foreground"
                    )}
                  >
                    {r.pct}%
                  </span>
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    over ? "bg-danger" : "bg-accent"
                  )}
                  style={{ width: `${Math.min(100, r.pct)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
