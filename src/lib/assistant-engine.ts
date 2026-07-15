import type {
  Equipment,
  Expense,
  ExpenseCategory,
  Meeting,
  Task,
  User,
  Vehicle,
} from "./types";
import { formatNaira, formatNairaCompact, formatDateTime } from "./format";
import {
  agingStock,
  availableVehicles,
  avgDaysInStock,
  byCategory,
  categoryTrend,
  expensesThisMonth,
  expenseTotal,
  inventoryValue,
  modelVelocity,
  oldestInStock,
  pendingExpenses,
  profitThisMonth,
  revenueThisMonth,
  soldThisMonth,
} from "./stats";

export interface AssistantContext {
  me: User;
  users: User[];
  vehicles: Vehicle[];
  expenses: Expense[];
  equipment: Equipment[];
  meetings: Meeting[];
  tasks: Task[];
}

export interface AssistantReply {
  text: string;
  /** When set, the UI offers/performs navigation to this route. */
  href?: string;
  hrefLabel?: string;
}

/**
 * Scripted assistant: keyword-matched intents whose answers are computed
 * from the live store, so the assistant can never contradict the dashboards.
 * The production build swaps this file for a real model call.
 */

const NAV_TARGETS: Array<{ pattern: RegExp; href: string; label: string }> = [
  { pattern: /invento|cars? page|vehicle|stock list/, href: "/inventory", label: "Inventory" },
  { pattern: /expense|spend(ing)? page|ledger/, href: "/expenses", label: "Expenses" },
  { pattern: /equipment|asset/, href: "/equipment", label: "Equipment" },
  { pattern: /operat|task|kanban/, href: "/operations", label: "Operations" },
  { pattern: /meeting|calendar|schedule/, href: "/meetings", label: "Meetings" },
  { pattern: /plan|goal|okr|budget/, href: "/planning", label: "Planning" },
  { pattern: /report|analytic/, href: "/reports", label: "Reports" },
  { pattern: /user|team page|staff page/, href: "/users", label: "User Management" },
  { pattern: /setting/, href: "/settings", label: "Settings" },
  { pattern: /dash|home|overview/, href: "/dashboard", label: "Dashboard" },
];

const CATEGORY_ALIASES: Array<{ pattern: RegExp; category: ExpenseCategory }> = [
  { pattern: /fuel|diesel|generator|gen\b/, category: "Fuel & Generator" },
  { pattern: /repair|workshop|fix/, category: "Vehicle Repairs" },
  { pattern: /customs|clearing|duty|port/, category: "Customs & Clearing" },
  { pattern: /salar|payroll|wages/, category: "Salaries" },
  { pattern: /rent/, category: "Rent" },
  { pattern: /marketing|ads?|advert|promo/, category: "Marketing" },
  { pattern: /utilit|electric|internet|water/, category: "Utilities" },
  { pattern: /logistic|towing|transport/, category: "Logistics" },
];

export function answerQuery(raw: string, ctx: AssistantContext): AssistantReply {
  const q = raw.toLowerCase().trim();
  const { vehicles, expenses, equipment, meetings, users, me } = ctx;

  // --- Navigation intents ---
  if (/^(take me|go|open|navigate|show me the)\b/.test(q) || /\bpage\b/.test(q)) {
    for (const t of NAV_TARGETS) {
      if (t.pattern.test(q)) {
        return {
          text: `Taking you to ${t.label}.`,
          href: t.href,
          hrefLabel: `Open ${t.label}`,
        };
      }
    }
  }

  // --- How many cars available / in stock ---
  if (/how many|number of/.test(q) && /car|vehicle|unit|stock/.test(q)) {
    const avail = availableVehicles(vehicles);
    const reserved = vehicles.filter((v) => v.status === "Reserved").length;
    const transit = vehicles.filter((v) => v.status === "In Transit").length;
    return {
      text: `You currently have ${avail.length} vehicles available for sale, worth ${formatNairaCompact(
        avail.reduce((s, v) => s + v.listingPrice, 0)
      )} at listing prices. There are also ${reserved} reserved and ${transit} in transit from the port.`,
      href: "/inventory",
      hrefLabel: "Open Inventory",
    };
  }

  // --- Inventory value ---
  if (/inventory (value|worth)|worth of (stock|inventory)|capital (tied|in stock)/.test(q)) {
    return {
      text: `Total active inventory is valued at ${formatNaira(inventoryValue(vehicles))} across ${
        vehicles.filter((v) => v.status !== "Sold").length
      } units, with an average of ${avgDaysInStock(vehicles)} days in stock.`,
      href: "/inventory",
      hrefLabel: "Open Inventory",
    };
  }

  // --- Category spend (e.g. fuel this month) ---
  if (/spen[dt]|cost|how much/.test(q)) {
    for (const alias of CATEGORY_ALIASES) {
      if (alias.pattern.test(q)) {
        const trend = categoryTrend(expenses, alias.category);
        const dir =
          trend.pctChange === 0
            ? "flat versus"
            : trend.pctChange > 0
              ? `up ${trend.pctChange}% versus`
              : `down ${Math.abs(trend.pctChange)}% versus`;
        return {
          text: `${alias.category} spend this month is ${formatNaira(trend.current)} — ${dir} your 3-month average of ${formatNaira(trend.priorAvg)}.`,
          href: "/expenses",
          hrefLabel: "Open Expenses",
        };
      }
    }
  }

  // --- Total spend this month ---
  if (/total (spend|expense)|spend this month|expenses this month|operating cost/.test(q)) {
    const month = expensesThisMonth(expenses);
    const top = byCategory(month)[0];
    return {
      text: `Approved spend this month is ${formatNaira(expenseTotal(month))} across ${month.length} entries. The biggest line is ${top?.category ?? "—"} at ${formatNaira(top?.total ?? 0)}.`,
      href: "/expenses",
      hrefLabel: "Open Expenses",
    };
  }

  // --- Oldest in stock ---
  if (/longest|oldest|sitting|aging|slow/.test(q) && /stock|car|vehicle|invento/.test(q)) {
    const v = oldestInStock(vehicles);
    if (!v) return { text: "No available vehicles right now." };
    const aged = agingStock(vehicles, 60).length;
    return {
      text: `The ${v.year} ${v.make} ${v.model} ${v.trim} has been in stock the longest — ${v.daysInStock} days, listed at ${formatNaira(v.listingPrice)}. In total, ${aged} available unit${aged === 1 ? " is" : "s are"} over 60 days old; I'd recommend reviewing pricing on those first.`,
      href: `/inventory/${v.id}`,
      hrefLabel: "View this vehicle",
    };
  }

  // --- Fastest selling ---
  if (/fastest|best sell|sells (the )?quick|turn(s|ing)? over|velocity/.test(q)) {
    const v = modelVelocity(vehicles)[0];
    if (!v) return { text: "Not enough sales data yet." };
    return {
      text: `${v.model}s are your fastest movers — the last ${v.sold} sold in an average of ${v.avgDays} days. Worth prioritising in your next shipment.`,
      href: "/inventory",
      hrefLabel: "Open Inventory",
    };
  }

  // --- Pending approvals ---
  if (/pending|await|approv/.test(q)) {
    const pending = pendingExpenses(expenses);
    if (pending.length === 0)
      return { text: "There are no expenses awaiting approval. All clear. ✅" };
    return {
      text: `${pending.length} expense${pending.length > 1 ? "s are" : " is"} awaiting approval, totalling ${formatNaira(expenseTotal(pending))}. The oldest is "${pending[pending.length - 1].description}".`,
      href: "/expenses",
      hrefLabel: "Review approvals",
    };
  }

  // --- Meetings today / this week ---
  if (/meeting|calendar|agenda/.test(q)) {
    const now = Date.now();
    const week = now + 7 * 86_400_000;
    const upcoming = meetings
      .filter((m) => {
        const t = new Date(m.date).getTime();
        return t >= now && t <= week;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (upcoming.length === 0)
      return {
        text: "No meetings scheduled in the next 7 days.",
        href: "/meetings",
        hrefLabel: "Open Meetings",
      };
    const list = upcoming
      .slice(0, 3)
      .map((m) => `• ${m.title} — ${formatDateTime(m.date)} (${m.location})`)
      .join("\n");
    return {
      text: `You have ${upcoming.length} meeting${upcoming.length > 1 ? "s" : ""} in the next 7 days:\n${list}`,
      href: "/meetings",
      hrefLabel: "Open Meetings",
    };
  }

  // --- Equipment needing service ---
  if (/equipment|generator|maintenance|service due|broken/.test(q)) {
    const due = equipment.filter(
      (e) =>
        e.condition === "Broken" ||
        e.condition === "Needs Service" ||
        new Date(e.nextServiceDue).getTime() < Date.now()
    );
    if (due.length === 0)
      return { text: "All equipment is in good shape — nothing due for service. ✅" };
    return {
      text: `${due.length} asset${due.length > 1 ? "s need" : " needs"} attention: ${due
        .map((e) => e.name)
        .join(", ")}. The workshop should prioritise ${due[0].name.toLowerCase()}.`,
      href: "/equipment",
      hrefLabel: "Open Equipment",
    };
  }

  // --- Top salesperson ---
  if (/top sales|best (sales|perform)|who sold/.test(q)) {
    const sold = vehicles.filter((v) => v.status === "Sold" && v.assignedTo);
    const map = new Map<string, { count: number; revenue: number }>();
    for (const v of sold) {
      const cur = map.get(v.assignedTo!) ?? { count: 0, revenue: 0 };
      map.set(v.assignedTo!, {
        count: cur.count + 1,
        revenue: cur.revenue + (v.soldPrice ?? 0),
      });
    }
    const top = [...map.entries()].sort((a, b) => b[1].count - a[1].count)[0];
    if (!top) return { text: "No attributed sales yet." };
    const person = users.find((u) => u.id === top[0]);
    return {
      text: `${person?.name ?? "Unknown"} leads with ${top[1].count} vehicles sold for ${formatNairaCompact(top[1].revenue)} in revenue.`,
      href: "/reports",
      hrefLabel: "Open Reports",
    };
  }

  // --- Monthly performance summary ---
  if (/summar|performance|how (are we|is the business)|month|overview|report/.test(q)) {
    const sold = soldThisMonth(vehicles);
    const rev = revenueThisMonth(vehicles);
    const profit = profitThisMonth(vehicles);
    const spend = expenseTotal(expensesThisMonth(expenses));
    const avail = availableVehicles(vehicles).length;
    const pending = pendingExpenses(expenses).length;
    return {
      text:
        `Here's this month so far, ${me.name.split(" ")[0]}:\n` +
        `• Sales: ${sold.length} units for ${formatNairaCompact(rev)} revenue (${formatNairaCompact(profit)} gross margin)\n` +
        `• Spend: ${formatNairaCompact(spend)} approved${pending > 0 ? `, ${pending} expense${pending > 1 ? "s" : ""} pending approval` : ""}\n` +
        `• Floor: ${avail} vehicles available, averaging ${avgDaysInStock(vehicles)} days in stock\n` +
        `Overall: healthy margins, but watch the generator spend — it's trending above average.`,
      href: "/dashboard",
      hrefLabel: "Open Dashboard",
    };
  }

  // --- Greetings ---
  if (/^(hi|hello|hey|good (morning|afternoon|evening))/.test(q)) {
    return {
      text: `Hello ${me.name.split(" ")[0]}! I can answer questions about your inventory, expenses, meetings and performance — or take you anywhere in the app. Try one of the suggestions below.`,
    };
  }

  // --- Fallback ---
  return {
    text: "In the full version I can answer anything about your business data. In this demo, try one of the suggested questions below — or ask about inventory, expenses, meetings, equipment or this month's performance.",
  };
}

export const SUGGESTED_QUESTIONS = [
  "How many cars are available right now?",
  "Summarize this month's performance",
  "What did we spend on fuel this month?",
  "Which car has been in stock the longest?",
  "Any expenses pending approval?",
  "What's selling fastest?",
  "Take me to the reports page",
];
