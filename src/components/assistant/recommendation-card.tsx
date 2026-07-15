"use client";

import * as React from "react";
import { Sparkles, TrendingUp, AlertTriangle, Info, Check, X } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  getRecommendations,
  recsForModule,
  type Recommendation,
  type RecommendationModule,
} from "@/lib/recommendations";
import { useAppStore } from "@/store/app-store";
import { useToast } from "@/components/ui/primitives";

const severityIcon = {
  opportunity: TrendingUp,
  warning: AlertTriangle,
  info: Info,
};

const severityTone = {
  opportunity: "text-success",
  warning: "text-warning",
  info: "text-accent",
};

export function RecommendationCard({ rec }: { rec: Recommendation }) {
  const { toast } = useToast();
  const [dismissed, setDismissed] = React.useState(false);
  const Icon = severityIcon[rec.severity];

  if (dismissed) return null;

  return (
    <div className="animate-fade-up relative overflow-hidden rounded-xl border border-accent/25 bg-accent-subtle/60 p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
              AI Insight
            </span>
            <Icon className={cn("h-3 w-3", severityTone[rec.severity])} />
          </div>
          <p className="mt-1 text-sm font-semibold leading-snug">{rec.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">{rec.body}</p>
          {rec.stat && (
            <p className="mt-2 text-[11px] font-medium text-accent">{rec.stat}</p>
          )}
          <div className="mt-3 flex items-center gap-2">
            {rec.action && (
              <button
                onClick={() => {
                  setDismissed(true);
                  toast(`Noted — "${rec.action}" added to your follow-ups`, "success");
                }}
                className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-accent px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-accent-strong"
              >
                <Check className="h-3 w-3" /> {rec.action}
              </button>
            )}
            <button
              onClick={() => setDismissed(true)}
              className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-medium text-muted hover:text-foreground"
            >
              <X className="h-3 w-3" /> Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Drop-in block: the top AI recommendations for a module, from live data. */
export function ModuleRecommendations({
  module,
  limit = 2,
  className,
}: {
  module: RecommendationModule;
  limit?: number;
  className?: string;
}) {
  const vehicles = useAppStore((s) => s.vehicles);
  const expenses = useAppStore((s) => s.expenses);
  const equipment = useAppStore((s) => s.equipment);

  const recs = React.useMemo(
    () => recsForModule(getRecommendations(vehicles, expenses, equipment), module, limit),
    [vehicles, expenses, equipment, module, limit]
  );

  if (recs.length === 0) return null;

  return (
    <div className={cn("grid gap-3 md:grid-cols-2", className)}>
      {recs.map((r) => (
        <RecommendationCard key={r.id} rec={r} />
      ))}
    </div>
  );
}
