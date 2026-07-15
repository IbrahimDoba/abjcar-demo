"use client";

import { Check, X } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { pendingExpenses } from "@/lib/stats";
import { formatNaira, formatNairaCompact, relativeDays } from "@/lib/format";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  useToast,
} from "@/components/ui/primitives";

/**
 * The manager half of the signature flow: every Pending expense, with
 * one-click Approve / Reject. Rows leave the queue the moment a decision
 * is made because the list is derived from live store state.
 */
export function ApprovalQueue() {
  const expenses = useAppStore((s) => s.expenses);
  const users = useAppStore((s) => s.users);
  const setExpenseStatus = useAppStore((s) => s.setExpenseStatus);
  const { toast } = useToast();

  const pending = pendingExpenses(expenses).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (pending.length === 0) return null;

  const total = pending.reduce((s, e) => s + e.amount, 0);

  function decide(id: string, status: "Approved" | "Rejected") {
    setExpenseStatus(id, status);
    toast(
      status === "Approved" ? "Expense approved ✓" : "Expense rejected",
      status === "Approved" ? "success" : "info"
    );
  }

  return (
    <Card className="border-accent/40">
      <CardHeader
        title="Approval queue"
        subtitle={`${pending.length} expense${pending.length > 1 ? "s" : ""} awaiting your decision · ${formatNairaCompact(total)} total`}
        action={<Badge tone="amber">{pending.length} pending</Badge>}
      />
      <div className="mt-4 border-t">
        {pending.map((e) => {
          const submitter = users.find((u) => u.id === e.submittedBy);
          return (
            <div
              key={e.id}
              className="animate-fade-up flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border/60 px-5 py-3.5 last:border-b-0 last:pb-4"
            >
              <Avatar
                src={submitter?.avatar}
                name={submitter?.name ?? "Unknown"}
                size={34}
              />
              <div className="min-w-0 flex-1 basis-52">
                <p className="truncate text-sm font-medium">{e.description}</p>
                <p className="mt-0.5 truncate text-xs text-muted">
                  {submitter?.name ?? "Unknown"} · {relativeDays(e.date)}
                </p>
              </div>
              <Badge>{e.category}</Badge>
              <span className="w-28 text-right text-sm font-semibold tabular-nums">
                {formatNaira(e.amount)}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => decide(e.id, "Approved")}
                >
                  <Check className="h-3.5 w-3.5" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => decide(e.id, "Rejected")}
                >
                  <X className="h-3.5 w-3.5" /> Reject
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
