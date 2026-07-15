"use client";

import * as React from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  ListTodo,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { can } from "@/lib/permissions";
import { formatNairaCompact, relativeDays } from "@/lib/format";
import type { Department, Task, TaskStatus } from "@/lib/types";
import { useAppStore, useCurrentUser } from "@/store/app-store";
import {
  Avatar,
  Badge,
  Card,
  CardHeader,
  EmptyState,
  StatTile,
  useToast,
} from "@/components/ui/primitives";

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "todo", label: "To Do" },
  { status: "in_progress", label: "In Progress" },
  { status: "done", label: "Done" },
];

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

const PRIORITY_TONE: Record<Task["priority"], "red" | "amber" | "neutral"> = {
  High: "red",
  Medium: "amber",
  Low: "neutral",
};

const DEPARTMENTS: Department[] = [
  "Sales",
  "Logistics",
  "Workshop",
  "Admin",
  "Marketing",
];

const DAY_MS = 86_400_000;

function isOverdue(task: Task): boolean {
  return task.status !== "done" && new Date(task.dueDate).getTime() < Date.now();
}

function daysFromNow(iso: string): number {
  return (new Date(iso).getTime() - Date.now()) / DAY_MS;
}

export default function OperationsPage() {
  const user = useCurrentUser();
  const tasks = useAppStore((s) => s.tasks);
  const users = useAppStore((s) => s.users);
  const expenses = useAppStore((s) => s.expenses);
  const activities = useAppStore((s) => s.activities);
  const setTaskStatus = useAppStore((s) => s.setTaskStatus);
  const { toast } = useToast();

  if (!user) return null;
  const canEdit = can(user.role, "operations", "edit");

  const active = tasks.filter((t) => t.status !== "done");
  const dueThisWeek = active.filter((t) => {
    const d = daysFromNow(t.dueDate);
    return d >= 0 && d <= 7;
  });
  const done = tasks.filter((t) => t.status === "done");

  const now = new Date();
  const feed = [...activities]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 12);

  function move(task: Task, dir: -1 | 1) {
    const idx = COLUMNS.findIndex((c) => c.status === task.status);
    const next = COLUMNS[idx + dir];
    if (!next) return;
    setTaskStatus(task.id, next.status);
    toast(`"${task.title}" moved to ${STATUS_LABEL[next.status]}`, "info");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Operations</h1>
        <p className="mt-0.5 text-sm text-muted">
          Daily tasks across the yard, workshop and back office.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatTile
          label="Active tasks"
          value={String(active.length)}
          sub="to do or in progress"
          icon={<ListTodo className="h-4 w-4" />}
        />
        <StatTile
          label="Due this week"
          value={String(dueThisWeek.length)}
          sub="within the next 7 days"
          icon={<CalendarClock className="h-4 w-4" />}
        />
        <StatTile
          label="Done"
          value={String(done.length)}
          sub="completed tasks"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatTile
          label="Departments"
          value={String(DEPARTMENTS.length)}
          sub="running day-to-day"
          icon={<Building2 className="h-4 w-4" />}
        />
      </div>

      {/* Kanban board */}
      <div className="grid gap-4 lg:grid-cols-3">
        {COLUMNS.map((col, colIdx) => {
          const colTasks = tasks
            .filter((t) => t.status === col.status)
            .sort(
              (a, b) =>
                new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
            );
          return (
            <div key={col.status} className="flex flex-col gap-3">
              <div className="flex items-center gap-2 px-1">
                <h2 className="text-sm font-semibold">{col.label}</h2>
                <Badge tone={col.status === "done" ? "green" : "neutral"}>
                  {colTasks.length}
                </Badge>
              </div>
              {colTasks.length === 0 ? (
                <Card className="border-dashed p-4 text-center text-xs text-muted">
                  Nothing here right now
                </Card>
              ) : (
                colTasks.map((t) => {
                  const assignee = users.find((u) => u.id === t.assignee);
                  const overdue = isOverdue(t);
                  return (
                    <Card
                      key={t.id}
                      className={cn(
                        "p-4",
                        overdue && "border-l-4 border-l-danger/60"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "text-sm font-medium leading-snug",
                            t.status === "done" && "text-muted line-through"
                          )}
                        >
                          {t.title}
                        </p>
                        <Badge tone={PRIORITY_TONE[t.priority]}>{t.priority}</Badge>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-muted">
                        {t.description}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
                        {assignee && (
                          <span className="flex items-center gap-1.5">
                            <Avatar
                              src={assignee.avatar}
                              name={assignee.name}
                              size={20}
                            />
                            <span className="text-muted">{assignee.name}</span>
                          </span>
                        )}
                        <span
                          className={cn(
                            "font-medium",
                            overdue ? "text-danger" : "text-muted"
                          )}
                        >
                          due {relativeDays(t.dueDate)}
                        </span>
                        <span className="rounded-full border bg-surface px-2 py-0.5 text-[11px] text-muted">
                          {t.department}
                        </span>
                      </div>
                      {canEdit && (
                        <div className="mt-3 flex items-center justify-between border-t pt-2.5">
                          {colIdx > 0 ? (
                            <button
                              onClick={() => move(t, -1)}
                              className="inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-muted transition-colors hover:bg-surface hover:text-foreground"
                            >
                              <ArrowLeft className="h-3 w-3" />
                              {COLUMNS[colIdx - 1].label}
                            </button>
                          ) : (
                            <span />
                          )}
                          {colIdx < COLUMNS.length - 1 && (
                            <button
                              onClick={() => move(t, 1)}
                              className="inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-muted transition-colors hover:bg-surface hover:text-foreground"
                            >
                              {COLUMNS[colIdx + 1].label}
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })
              )}
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        {/* Departments overview */}
        <div className="xl:col-span-3">
          <div className="mb-3 flex items-center gap-2 px-1">
            <h2 className="text-sm font-semibold">Departments</h2>
            <span className="text-xs text-muted">this month</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {DEPARTMENTS.map((dept) => {
              const headcount = users.filter((u) => u.department === dept).length;
              const activeTasks = tasks.filter(
                (t) => t.department === dept && t.status !== "done"
              ).length;
              const spend = expenses
                .filter((e) => {
                  const d = new Date(e.date);
                  return (
                    e.department === dept &&
                    e.status === "Approved" &&
                    d.getMonth() === now.getMonth() &&
                    d.getFullYear() === now.getFullYear()
                  );
                })
                .reduce((sum, e) => sum + e.amount, 0);
              return (
                <Card key={dept} className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{dept}</p>
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-subtle">
                      <Building2 className="h-3.5 w-3.5 text-accent" />
                    </span>
                  </div>
                  <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-surface px-1 py-2">
                      <dd className="text-sm font-semibold">{headcount}</dd>
                      <dt className="mt-0.5 text-[10px] uppercase tracking-wide text-muted">
                        People
                      </dt>
                    </div>
                    <div className="rounded-lg bg-surface px-1 py-2">
                      <dd className="text-sm font-semibold">{activeTasks}</dd>
                      <dt className="mt-0.5 text-[10px] uppercase tracking-wide text-muted">
                        Tasks
                      </dt>
                    </div>
                    <div className="rounded-lg bg-surface px-1 py-2">
                      <dd className="text-sm font-semibold">
                        {formatNairaCompact(spend)}
                      </dd>
                      <dt className="mt-0.5 text-[10px] uppercase tracking-wide text-muted">
                        Spend
                      </dt>
                    </div>
                  </dl>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Activity feed */}
        <Card className="self-start xl:col-span-2">
          <CardHeader title="Recent activity" subtitle="Across every module" />
          {feed.length === 0 ? (
            <EmptyState
              icon={<ListTodo className="h-8 w-8" />}
              title="No activity yet"
            />
          ) : (
            <ul className="divide-y p-5 pt-2">
              {feed.map((a) => {
                const actor = users.find((u) => u.id === a.actor);
                return (
                  <li key={a.id} className="flex items-start gap-3 py-3 last:pb-0">
                    <Avatar
                      src={actor?.avatar}
                      name={actor?.name ?? "Unknown"}
                      size={28}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs leading-relaxed">
                        <span className="font-semibold">
                          {actor?.name ?? "Someone"}
                        </span>{" "}
                        <span className="text-muted">{a.action}</span>
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge tone="blue" className="capitalize">
                          {a.module}
                        </Badge>
                        <span className="text-[11px] text-muted/80">
                          {relativeDays(a.date)}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
