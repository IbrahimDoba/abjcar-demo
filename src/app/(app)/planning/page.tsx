"use client";

import * as React from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Megaphone, Target } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Goal } from "@/lib/types";
import { formatNaira, formatNairaCompact, formatNumber } from "@/lib/format";
import { isSameMonth } from "@/lib/stats";
import { useAppStore } from "@/store/app-store";
import { GOALS, CAMPAIGNS, SALES_HISTORY } from "@/data/seed/planning";
import { BUDGET } from "@/data/seed/expenses";
import {
  Avatar,
  Badge,
  Card,
  CardHeader,
  Progress,
  Table,
  Td,
  Th,
} from "@/components/ui/primitives";
import { ModuleRecommendations } from "@/components/assistant/recommendation-card";

/* ---------------------------------- Goals ---------------------------------- */

function goalPct(g: Goal): number {
  if (g.current < 0) return 0;
  if (g.target === 0) return 0;
  return Math.max(0, Math.min(100, (g.current / g.target) * 100));
}

function goalStatus(pct: number): { label: string; tone: "green" | "amber" | "red" } {
  if (pct >= 70) return { label: "On track", tone: "green" };
  if (pct >= 40) return { label: "At risk", tone: "amber" };
  return { label: "Behind", tone: "red" };
}

function goalProgressLabel(g: Goal): React.ReactNode {
  if (g.unit === "naira") {
    return (
      <>
        <span className="font-semibold text-foreground">
          {formatNairaCompact(g.current)}
        </span>{" "}
        of {formatNairaCompact(g.target)}
      </>
    );
  }
  if (g.unit === "percent") {
    return (
      <>
        <span
          className={cn(
            "font-semibold",
            g.current < 0 ? "text-danger" : "text-foreground"
          )}
        >
          {g.current}%
        </span>{" "}
        vs {g.target}% target
      </>
    );
  }
  return (
    <>
      <span className="font-semibold text-foreground">{formatNumber(g.current)}</span>{" "}
      of {formatNumber(g.target)}
    </>
  );
}

/* ----------------------------------- Page ---------------------------------- */

export default function PlanningPage() {
  const users = useAppStore((s) => s.users);
  const expenses = useAppStore((s) => s.expenses);

  const actualByCategory = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) {
      if (e.status !== "Approved" || !isSameMonth(e.date)) continue;
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    }
    return map;
  }, [expenses]);

  const totalBudget = BUDGET.reduce((s, b) => s + b.monthlyBudget, 0);
  const totalActual = BUDGET.reduce(
    (s, b) => s + (actualByCategory.get(b.category) ?? 0),
    0
  );

  const campaignTotals = CAMPAIGNS.reduce(
    (acc, c) => ({
      spend: acc.spend + c.monthlySpend,
      leads: acc.leads + c.leads,
      sales: acc.sales + c.salesAttributed,
    }),
    { spend: 0, leads: 0, sales: 0 }
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Planning</h1>
        <p className="mt-0.5 text-sm text-muted">
          Quarterly goals, budget discipline and growth levers — the executive view.
        </p>
      </div>

      <ModuleRecommendations module="planning" limit={2} />

      {/* Goals / OKRs */}
      <section>
        <h2 className="mb-2.5 text-sm font-semibold">Company goals — {GOALS[0]?.quarter}</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {GOALS.map((g) => {
            const owner = users.find((u) => u.id === g.owner);
            const pct = goalPct(g);
            const status = g.current < 0 ? goalStatus(0) : goalStatus(pct);
            return (
              <Card key={g.id} className="flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold leading-snug">{g.title}</p>
                  <Badge tone="blue">{g.quarter}</Badge>
                </div>
                <p className="text-xs text-muted">{g.metric}</p>
                <div className="mt-auto space-y-2">
                  <div className="flex items-baseline justify-between text-xs text-muted">
                    <span>{goalProgressLabel(g)}</span>
                    <span className="font-medium">{Math.round(pct)}%</span>
                  </div>
                  <Progress value={pct} />
                  <div className="flex items-center justify-between pt-1">
                    {owner ? (
                      <span className="flex items-center gap-1.5 text-xs text-muted">
                        <Avatar src={owner.avatar} name={owner.name} size={20} />
                        {owner.name}
                      </span>
                    ) : (
                      <span />
                    )}
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Budget planner */}
      <Card>
        <CardHeader
          title="Budget planner"
          subtitle="Monthly plan vs approved spend this month"
        />
        <div className="p-2 pt-3">
          <Table>
            <thead>
              <tr>
                <Th>Category</Th>
                <Th className="text-right">Monthly budget</Th>
                <Th className="text-right">Actual (this month)</Th>
                <Th className="text-right">Variance</Th>
                <Th className="w-36">Utilisation</Th>
              </tr>
            </thead>
            <tbody>
              {BUDGET.map((b) => {
                const actual = actualByCategory.get(b.category) ?? 0;
                const variance = b.monthlyBudget - actual;
                const util = b.monthlyBudget === 0 ? 0 : (actual / b.monthlyBudget) * 100;
                const over = actual > b.monthlyBudget;
                return (
                  <tr key={b.category}>
                    <Td className="font-medium">{b.category}</Td>
                    <Td className="text-right text-muted">
                      {formatNaira(b.monthlyBudget)}
                    </Td>
                    <Td className="text-right">{formatNaira(actual)}</Td>
                    <Td
                      className={cn(
                        "text-right font-medium",
                        over ? "text-danger" : "text-success"
                      )}
                    >
                      {over ? "-" : "+"}
                      {formatNaira(Math.abs(variance))}
                    </Td>
                    <Td>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            over ? "bg-danger" : "bg-accent"
                          )}
                          style={{ width: `${Math.min(100, util)}%` }}
                        />
                      </div>
                    </Td>
                  </tr>
                );
              })}
              <tr>
                <Td className="border-b-0 font-semibold">Total</Td>
                <Td className="border-b-0 text-right font-semibold">
                  {formatNaira(totalBudget)}
                </Td>
                <Td className="border-b-0 text-right font-semibold">
                  {formatNaira(totalActual)}
                </Td>
                <Td
                  className={cn(
                    "border-b-0 text-right font-semibold",
                    totalActual > totalBudget ? "text-danger" : "text-success"
                  )}
                >
                  {totalActual > totalBudget ? "-" : "+"}
                  {formatNaira(Math.abs(totalBudget - totalActual))}
                </Td>
                <Td className="border-b-0" />
              </tr>
            </tbody>
          </Table>
        </div>
      </Card>

      {/* Sales trajectory */}
      <Card>
        <CardHeader
          title="Sales trajectory"
          subtitle="Revenue and profit, last 6 months"
          action={
            <div className="flex items-center gap-3 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-accent" /> Revenue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-3.5 rounded-full bg-muted/60" /> Profit
              </span>
            </div>
          }
        />
        <div className="h-64 p-5 pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={SALES_HISTORY} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="planRevenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeOpacity={0.15} vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatNairaCompact(Number(v))}
                width={58}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--surface-raised)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "var(--foreground)",
                }}
                formatter={(value, name) => [
                  formatNaira(Number(value)),
                  name === "revenue" ? "Revenue" : "Profit",
                ]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#planRevenueFill)"
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#94a3b8"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Marketing campaigns */}
      <Card>
        <CardHeader
          title="Marketing campaigns"
          subtitle="Spend, lead flow and attribution by channel"
          action={<Megaphone className="h-4 w-4 text-muted/70" />}
        />
        <div className="p-2 pt-3">
          <Table>
            <thead>
              <tr>
                <Th>Campaign</Th>
                <Th>Channel</Th>
                <Th className="text-right">Monthly spend</Th>
                <Th className="text-right">Leads</Th>
                <Th className="text-right">Cost / lead</Th>
                <Th className="text-right">Sales attributed</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {CAMPAIGNS.map((c) => (
                <tr key={c.id}>
                  <Td className="font-medium">{c.name}</Td>
                  <Td>
                    <Badge tone="blue">{c.channel}</Badge>
                  </Td>
                  <Td className="text-right">{formatNaira(c.monthlySpend)}</Td>
                  <Td className="text-right">{formatNumber(c.leads)}</Td>
                  <Td className="text-right text-muted">
                    {c.leads === 0 ? "—" : formatNaira(Math.round(c.monthlySpend / c.leads))}
                  </Td>
                  <Td className="text-right">{c.salesAttributed}</Td>
                  <Td>
                    <Badge tone={c.status === "Active" ? "green" : "neutral"}>
                      {c.status}
                    </Badge>
                  </Td>
                </tr>
              ))}
              <tr>
                <Td className="border-b-0 font-semibold">
                  Total ({CAMPAIGNS.length} campaigns)
                </Td>
                <Td className="border-b-0" />
                <Td className="border-b-0 text-right font-semibold">
                  {formatNaira(campaignTotals.spend)}
                </Td>
                <Td className="border-b-0 text-right font-semibold">
                  {formatNumber(campaignTotals.leads)}
                </Td>
                <Td className="border-b-0 text-right font-semibold text-muted">
                  {campaignTotals.leads === 0
                    ? "—"
                    : formatNaira(Math.round(campaignTotals.spend / campaignTotals.leads))}
                </Td>
                <Td className="border-b-0 text-right font-semibold">
                  {campaignTotals.sales}
                </Td>
                <Td className="border-b-0" />
              </tr>
            </tbody>
          </Table>
        </div>
      </Card>

      {/* Strategy note */}
      <Card className="flex items-start gap-3.5 p-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-subtle">
          <Target className="h-4.5 w-4.5 text-accent" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Strategy note
          </p>
          <blockquote className="mt-1.5 border-l-2 border-accent/40 pl-3 text-sm italic leading-relaxed text-muted">
            Board direction (from last strategy session): prioritise SUV acquisitions,
            evaluate second lot in Gwarinpa, pursue 2 financing partnerships.
          </blockquote>
        </div>
      </Card>
    </div>
  );
}
