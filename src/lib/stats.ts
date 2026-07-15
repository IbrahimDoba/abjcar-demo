import type { Expense, ExpenseCategory, Vehicle } from "./types";

/**
 * Every number shown on a dashboard, report or AI answer is computed here,
 * from the live store data — so the assistant can never contradict the UI.
 */

export function availableVehicles(vehicles: Vehicle[]): Vehicle[] {
  return vehicles.filter((v) => v.status === "Available");
}

export function inventoryValue(vehicles: Vehicle[]): number {
  return vehicles
    .filter((v) => v.status !== "Sold")
    .reduce((sum, v) => sum + v.listingPrice, 0);
}

export function totalCost(v: Vehicle): number {
  return v.purchasePrice + v.clearingCost + v.repairCost;
}

export function margin(v: Vehicle): number {
  return (v.soldPrice ?? v.listingPrice) - totalCost(v);
}

export function marginPct(v: Vehicle): number {
  const cost = totalCost(v);
  return cost === 0 ? 0 : Math.round((margin(v) / cost) * 100);
}

export function soldThisMonth(vehicles: Vehicle[]): Vehicle[] {
  const now = new Date();
  return vehicles.filter((v) => {
    if (v.status !== "Sold" || !v.soldAt) return false;
    const d = new Date(v.soldAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
}

export function revenueThisMonth(vehicles: Vehicle[]): number {
  return soldThisMonth(vehicles).reduce((s, v) => s + (v.soldPrice ?? 0), 0);
}

export function profitThisMonth(vehicles: Vehicle[]): number {
  return soldThisMonth(vehicles).reduce((s, v) => s + margin(v), 0);
}

export function avgDaysInStock(vehicles: Vehicle[]): number {
  const active = vehicles.filter((v) => v.status !== "Sold");
  if (active.length === 0) return 0;
  return Math.round(active.reduce((s, v) => s + v.daysInStock, 0) / active.length);
}

export function agingStock(vehicles: Vehicle[], days = 60): Vehicle[] {
  return vehicles
    .filter((v) => v.status === "Available" && v.daysInStock >= days)
    .sort((a, b) => b.daysInStock - a.daysInStock);
}

export function oldestInStock(vehicles: Vehicle[]): Vehicle | undefined {
  return agingStock(vehicles, 0)[0];
}

// ---------------- Expenses ----------------

export function isSameMonth(iso: string, monthsAgo = 0): boolean {
  const d = new Date(iso);
  const ref = new Date();
  ref.setDate(1);
  ref.setMonth(ref.getMonth() - monthsAgo);
  return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
}

export function expensesThisMonth(expenses: Expense[]): Expense[] {
  return expenses.filter((e) => e.status === "Approved" && isSameMonth(e.date));
}

export function expenseTotal(expenses: Expense[]): number {
  return expenses.reduce((s, e) => s + e.amount, 0);
}

export function pendingExpenses(expenses: Expense[]): Expense[] {
  return expenses.filter((e) => e.status === "Pending");
}

export function byCategory(
  expenses: Expense[]
): { category: ExpenseCategory; total: number }[] {
  const map = new Map<ExpenseCategory, number>();
  for (const e of expenses) map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
  return [...map.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

/** Spend for a category this month vs the average of the prior 3 months. */
export function categoryTrend(
  expenses: Expense[],
  category: ExpenseCategory
): { current: number; priorAvg: number; pctChange: number } {
  const approved = expenses.filter(
    (e) => e.status === "Approved" && e.category === category
  );
  const current = expenseTotal(approved.filter((e) => isSameMonth(e.date, 0)));
  const prior =
    [1, 2, 3]
      .map((m) => expenseTotal(approved.filter((e) => isSameMonth(e.date, m))))
      .reduce((a, b) => a + b, 0) / 3;
  const pctChange = prior === 0 ? 0 : Math.round(((current - prior) / prior) * 100);
  return { current, priorAvg: Math.round(prior), pctChange };
}

/** Monthly totals for the last `n` months (oldest first) for charts. */
export function monthlyExpenseSeries(
  expenses: Expense[],
  n = 6
): { month: string; total: number }[] {
  const out: { month: string; total: number }[] = [];
  for (let m = n - 1; m >= 0; m--) {
    const ref = new Date();
    ref.setDate(1);
    ref.setMonth(ref.getMonth() - m);
    const label = ref.toLocaleDateString("en-NG", { month: "short" });
    const total = expenseTotal(
      expenses.filter((e) => e.status === "Approved" && isSameMonth(e.date, m))
    );
    out.push({ month: label, total });
  }
  return out;
}

/** How fast each model sells, from sold units: avg days-in-stock per model. */
export function modelVelocity(
  vehicles: Vehicle[]
): { model: string; avgDays: number; sold: number }[] {
  const sold = vehicles.filter((v) => v.status === "Sold");
  const map = new Map<string, { days: number; count: number }>();
  for (const v of sold) {
    const key = `${v.make} ${v.model}`;
    const cur = map.get(key) ?? { days: 0, count: 0 };
    map.set(key, { days: cur.days + v.daysInStock, count: cur.count + 1 });
  }
  return [...map.entries()]
    .map(([model, { days, count }]) => ({
      model,
      avgDays: Math.round(days / count),
      sold: count,
    }))
    .sort((a, b) => a.avgDays - b.avgDays);
}
