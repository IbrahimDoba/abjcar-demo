"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, Inbox } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Meeting, Role, User } from "@/lib/types";
import { formatDateTime, formatNaira, formatNairaCompact, relativeDays } from "@/lib/format";
import { byCategory, expensesThisMonth } from "@/lib/stats";
import { useAppStore } from "@/store/app-store";
import { Avatar, Card, CardHeader, EmptyState } from "@/components/ui/primitives";
import { SALES_HISTORY } from "@/data/seed/planning";

/* ----------------------------------- Now ----------------------------------- */

/** Timestamp captured once per mount — keeps renders pure for the compiler. */
export function useNow(): number {
  const [now] = React.useState(() => Date.now());
  return now;
}

/* --------------------------------- Greeting -------------------------------- */

export function greeting(name: string): string {
  const h = new Date().getHours();
  const part = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return `${part}, ${name.split(" ")[0]}`;
}

export function GreetingHeader({ user, subtitle }: { user: User; subtitle?: string }) {
  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
        {greeting(user.name)}
      </h2>
      <p className="mt-1 text-sm text-muted">
        {subtitle ??
          new Date().toLocaleDateString("en-NG", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
      </p>
    </div>
  );
}

/* ------------------------------- View-all link ------------------------------ */

export function ViewAllLink({ href, label = "View all" }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium text-accent hover:underline"
    >
      {label} <ArrowUpRight className="h-3 w-3" />
    </Link>
  );
}

/* ---------------------------- Meeting visibility ---------------------------- */

const EXEC_TIER_ROLES: Role[] = ["ceo", "cmo", "admin", "super_admin"];

export function canSeeMeeting(m: Meeting, user: User): boolean {
  if (m.tier === "all" || m.organizer === user.id || m.attendees.includes(user.id)) {
    return true;
  }
  if (m.tier === "exec") return EXEC_TIER_ROLES.includes(user.role);
  // management tier
  return EXEC_TIER_ROLES.includes(user.role) || user.role === "manager";
}

/* ---------------------------- Upcoming meetings ----------------------------- */

export function UpcomingMeetings({ user, limit = 3 }: { user: User; limit?: number }) {
  const meetings = useAppStore((s) => s.meetings);
  const users = useAppStore((s) => s.users);
  const now = useNow();

  const upcoming = meetings
    .filter((m) => new Date(m.date).getTime() >= now && canSeeMeeting(m, user))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, limit);

  return (
    <Card>
      <CardHeader
        title="Upcoming meetings"
        subtitle="What's next on your calendar"
        action={<ViewAllLink href="/meetings" />}
      />
      {upcoming.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-7 w-7" />}
          title="No upcoming meetings"
          hint="Anything scheduled for you will show up here."
        />
      ) : (
        <ul className="divide-y divide-border/60 p-2 pt-3">
          {upcoming.map((m) => {
            const d = new Date(m.date);
            const organizer = users.find((u) => u.id === m.organizer);
            return (
              <li key={m.id} className="flex items-center gap-3 px-3 py-3">
                <span className="flex w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-accent-subtle py-1.5 text-accent">
                  <span className="text-sm font-bold leading-tight">{d.getDate()}</span>
                  <span className="text-[10px] font-semibold uppercase leading-tight">
                    {d.toLocaleDateString("en-NG", { month: "short" })}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{m.title}</span>
                  <span className="block truncate text-xs text-muted">
                    {formatDateTime(m.date)} · {m.location}
                    {organizer ? ` · ${organizer.name.split(" ")[0]}` : ""}
                  </span>
                </span>
                <span className="hidden shrink-0 text-xs text-muted sm:block">
                  {relativeDays(m.date)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

/* ------------------------------ Activity feed ------------------------------- */

export function ActivityFeed({ limit = 6 }: { limit?: number }) {
  const activities = useAppStore((s) => s.activities);
  const users = useAppStore((s) => s.users);

  const items = [...activities]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);

  return (
    <Card>
      <CardHeader title="Recent activity" subtitle="Latest changes across the hub" />
      {items.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-7 w-7" />}
          title="No activity yet"
          hint="Actions across inventory, expenses and meetings will appear here."
        />
      ) : (
        <ul className="space-y-4 p-5 pt-4">
          {items.map((a) => {
            const actor = users.find((u) => u.id === a.actor);
            return (
              <li key={a.id} className="flex items-start gap-3">
                <Avatar src={actor?.avatar} name={actor?.name ?? "Unknown"} size={28} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug">
                    <span className="font-medium">{actor?.name ?? "Someone"}</span>{" "}
                    <span className="text-muted">{a.action}</span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted/80">{relativeDays(a.date)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

/* --------------------------- Revenue & profit chart -------------------------- */

export function RevenueProfitChart() {
  return (
    <Card>
      <CardHeader
        title="Revenue & profit"
        subtitle="Last 6 months, month to date"
        action={<ViewAllLink href="/reports" label="Reports" />}
      />
      <div className="p-5 pt-4">
        <ResponsiveContainer width="100%" height={264}>
          <BarChart data={SALES_HISTORY} barGap={4}>
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
              width={52}
              tickFormatter={(v) => formatNairaCompact(Number(v))}
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
              formatter={(value) => formatNaira(Number(value))}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={26} />
            <Bar dataKey="profit" name="Profit" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={26} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

/* -------------------------- Expenses by category ---------------------------- */

export function ExpenseCategoryBars() {
  const expenses = useAppStore((s) => s.expenses);
  const cats = byCategory(expensesThisMonth(expenses)).slice(0, 6);
  const max = cats[0]?.total ?? 1;

  return (
    <Card>
      <CardHeader
        title="Expenses by category"
        subtitle="Approved spend this month"
        action={<ViewAllLink href="/expenses" />}
      />
      {cats.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-7 w-7" />}
          title="No approved expenses yet"
          hint="Approved expenses for this month will break down here."
        />
      ) : (
        <div className="space-y-4 p-5 pt-4">
          {cats.map((c) => (
            <div key={c.category}>
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="truncate font-medium">{c.category}</span>
                <span className="shrink-0 text-muted">{formatNairaCompact(c.total)}</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${Math.max(4, (c.total / max) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
