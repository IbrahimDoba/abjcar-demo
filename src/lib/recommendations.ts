import type { Equipment, Expense, Vehicle } from "./types";
import { formatNaira, formatNairaCompact } from "./format";
import {
  agingStock,
  availableVehicles,
  categoryTrend,
  expensesThisMonth,
  expenseTotal,
  modelVelocity,
} from "./stats";
import { BUDGET } from "@/data/seed/expenses";

export type RecommendationModule =
  | "inventory"
  | "expenses"
  | "equipment"
  | "planning"
  | "dashboard";

export interface Recommendation {
  id: string;
  module: RecommendationModule;
  severity: "opportunity" | "warning" | "info";
  title: string;
  body: string;
  stat?: string;
  action?: string; // label on the accept button
}

/**
 * All "AI" recommendations are computed live from store data, so they always
 * agree with what's on screen. Swapping this for a real model call later is a
 * one-file change.
 */
export function getRecommendations(
  vehicles: Vehicle[],
  expenses: Expense[],
  equipment: Equipment[]
): Recommendation[] {
  const recs: Recommendation[] = [];

  // --- Inventory: aging stock markdown ---
  const aging = agingStock(vehicles, 60);
  if (aging.length > 0) {
    const v = aging[0];
    const markdown = Math.round(v.listingPrice * 0.93);
    recs.push({
      id: `aging-${v.id}`,
      module: "inventory",
      severity: "warning",
      title: `${v.make} ${v.model} ${v.year} has sat ${v.daysInStock} days`,
      body: `It's your oldest available unit and holding ${formatNairaCompact(v.listingPrice)} of capital. Units over 60 days typically need a price move — consider a 7% markdown to ${formatNaira(markdown)} to trigger offers.`,
      stat: `${aging.length} unit${aging.length > 1 ? "s" : ""} over 60 days in stock`,
      action: "Apply markdown suggestion",
    });
  }

  // --- Inventory: restock fast sellers ---
  const velocity = modelVelocity(vehicles);
  const fast = velocity.find((m) => {
    const availableCount = availableVehicles(vehicles).filter(
      (v) => `${v.make} ${v.model}` === m.model
    ).length;
    return m.avgDays <= 30 && availableCount <= 2;
  });
  if (fast) {
    const availableCount = availableVehicles(vehicles).filter(
      (v) => `${v.make} ${v.model}` === fast.model
    ).length;
    recs.push({
      id: `restock-${fast.model.replace(/\s+/g, "-")}`,
      module: "inventory",
      severity: "opportunity",
      title: `${fast.model}s are selling in ~${fast.avgDays} days`,
      body: `Your fastest-turning model, but only ${availableCount} unit${availableCount === 1 ? "" : "s"} left on the floor. Prioritise ${fast.model}s in the next shipment to keep the pipeline full.`,
      stat: `${fast.sold} sold recently · avg ${fast.avgDays} days to sell`,
      action: "Add to purchase list",
    });
  }

  // --- Expenses: anomaly on generator spend ---
  const fuel = categoryTrend(expenses, "Fuel & Generator");
  if (fuel.pctChange >= 25) {
    recs.push({
      id: "fuel-anomaly",
      module: "expenses",
      severity: "warning",
      title: `Generator & fuel spend is up ${fuel.pctChange}% vs your 3-month average`,
      body: `${formatNaira(fuel.current)} so far this month against a typical ${formatNaira(fuel.priorAvg)}. Check diesel procurement pricing and generator run-hours — a service issue often shows up here first.`,
      stat: `${formatNairaCompact(fuel.current - fuel.priorAvg)} above trend`,
      action: "Flag for review",
    });
  }

  // --- Expenses: budget overrun ---
  const monthTotals = new Map(
    BUDGET.map((b) => [b.category, { budget: b.monthlyBudget, actual: 0 }])
  );
  for (const e of expensesThisMonth(expenses)) {
    const row = monthTotals.get(e.category);
    if (row) row.actual += e.amount;
  }
  const over = [...monthTotals.entries()]
    .filter(([cat, r]) => r.actual > r.budget && cat !== "Fuel & Generator")
    .sort((a, b) => b[1].actual / b[1].budget - a[1].actual / a[1].budget)[0];
  if (over) {
    recs.push({
      id: `budget-${over[0].replace(/\s+/g, "-")}`,
      module: "expenses",
      severity: "info",
      title: `${over[0]} is over its monthly budget`,
      body: `${formatNaira(over[1].actual)} spent against a ${formatNaira(over[1].budget)} budget. If this is shipment-driven it may be fine — but flag it in the Q3 budget review.`,
      stat: `${Math.round((over[1].actual / over[1].budget) * 100)}% of budget used`,
      action: "Add to budget review agenda",
    });
  }

  // --- Equipment: overdue service ---
  const overdue = equipment.filter(
    (q) =>
      q.condition === "Broken" ||
      q.condition === "Needs Service" ||
      new Date(q.nextServiceDue).getTime() < Date.now()
  );
  if (overdue.length > 0) {
    const critical = overdue.find((q) => q.condition === "Broken") ?? overdue[0];
    recs.push({
      id: `equip-${critical.id}`,
      module: "equipment",
      severity: "warning",
      title: `${critical.name} needs attention`,
      body:
        critical.notes ??
        `Service is overdue. Downtime on workshop equipment slows inventory prep and delays listings.`,
      stat: `${overdue.length} asset${overdue.length > 1 ? "s" : ""} due or overdue for service`,
      action: "Schedule service",
    });
  }

  // --- Planning: body-type velocity strategy ---
  const sold = vehicles.filter((v) => v.status === "Sold");
  const suvDays = sold.filter((v) => v.bodyType === "SUV");
  const sedanDays = sold.filter((v) => v.bodyType === "Sedan");
  if (suvDays.length >= 2 && sedanDays.length >= 2) {
    const avg = (arr: Vehicle[]) =>
      arr.reduce((s, v) => s + v.daysInStock, 0) / arr.length;
    const suvAvg = avg(suvDays);
    const sedanAvg = avg(sedanDays);
    if (Math.abs(suvAvg - sedanAvg) >= 5) {
      const fasterType = suvAvg < sedanAvg ? "SUVs" : "Sedans";
      const ratio = (Math.max(suvAvg, sedanAvg) / Math.min(suvAvg, sedanAvg)).toFixed(1);
      recs.push({
        id: "strategy-bodytype",
        module: "planning",
        severity: "opportunity",
        title: `${fasterType} turn over ${ratio}× faster than ${fasterType === "SUVs" ? "sedans" : "SUVs"}`,
        body: `Recent sales show ${fasterType.toLowerCase()} averaging ${Math.round(Math.min(suvAvg, sedanAvg))} days in stock vs ${Math.round(Math.max(suvAvg, sedanAvg))}. Consider shifting a portion of the next purchasing budget toward ${fasterType.toLowerCase()}.`,
        stat: `Based on ${sold.length} recent sales`,
        action: "Draft purchasing proposal",
      });
    }
  }

  // --- Expenses total context (info, dashboard-friendly) ---
  const monthSpend = expenseTotal(expensesThisMonth(expenses));
  recs.push({
    id: "month-spend",
    module: "dashboard",
    severity: "info",
    title: `Operating spend this month: ${formatNairaCompact(monthSpend)}`,
    body: `Salaries, clearing and fuel are the biggest lines. The assistant tracks every category against budget and flags anomalies automatically.`,
    stat: "Updated live from the expense ledger",
  });

  return recs;
}

export function recsForModule(
  all: Recommendation[],
  module: RecommendationModule,
  limit = 2
): Recommendation[] {
  return all.filter((r) => r.module === module).slice(0, limit);
}
