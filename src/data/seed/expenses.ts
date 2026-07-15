import type { Expense, ExpenseCategory } from "@/lib/types";
import { daysAgoISO, monthDayISO, mulberry32 } from "./clock";

const K = 1_000;
const M = 1_000_000;
const rand = mulberry32(20260715);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}
function between(lo: number, hi: number): number {
  return Math.round((lo + rand() * (hi - lo)) / 10_000) * 10_000;
}

interface Template {
  category: ExpenseCategory;
  descriptions: string[];
  range: [number, number];
  perMonth: number; // typical entries per month
  submitters: string[];
  department: Expense["department"];
}

const TEMPLATES: Template[] = [
  {
    category: "Fuel & Generator",
    descriptions: [
      "Diesel for showroom generator (Mikano 60kVA)",
      "Diesel top-up — workshop generator",
      "Petrol for test-drive vehicles",
      "Generator servicing consumables",
    ],
    range: [180 * K, 750 * K],
    perMonth: 4,
    submitters: ["u-aisha", "u-tunde", "u-hauwa"],
    department: "Logistics",
  },
  {
    category: "Vehicle Repairs",
    descriptions: [
      "Replacement brake pads & rotors — inventory prep",
      "Full detailing & buffing before listing",
      "AC compressor replacement",
      "Gearbox service — trade-in unit",
      "New tyres (set of 4) for listed SUV",
    ],
    range: [150 * K, 1.4 * M],
    perMonth: 3,
    submitters: ["u-hauwa", "u-aisha"],
    department: "Workshop",
  },
  {
    category: "Customs & Clearing",
    descriptions: [
      "Customs duty — incoming units, Tin Can Island",
      "Clearing agent fees, Apapa",
      "Terminal & shipping-line charges",
      "VREG & import documentation",
    ],
    range: [1.2 * M, 4.5 * M],
    perMonth: 2,
    submitters: ["u-aisha", "u-ngozi"],
    department: "Logistics",
  },
  {
    category: "Salaries",
    descriptions: ["Monthly payroll — all staff"],
    range: [8.5 * M, 8.5 * M],
    perMonth: 1,
    submitters: ["u-ngozi"],
    department: "Admin",
  },
  {
    category: "Rent",
    descriptions: ["Showroom & lot rent accrual — Wuse Zone 5"],
    range: [2.2 * M, 2.2 * M],
    perMonth: 1,
    submitters: ["u-ngozi"],
    department: "Admin",
  },
  {
    category: "Marketing",
    descriptions: [
      "Instagram & Facebook promoted listings",
      "Jiji.ng premium boost package",
      "Radio spots — WAZOBIA FM Abuja",
      "Billboard maintenance — Airport Road",
      "Print flyers & showroom banners",
    ],
    range: [180 * K, 1.3 * M],
    perMonth: 3,
    submitters: ["u-seyi", "u-funke"],
    department: "Marketing",
  },
  {
    category: "Utilities",
    descriptions: [
      "AEDC electricity bill",
      "Internet — Starlink subscription",
      "Water & waste management",
      "Office phone & airtime",
    ],
    range: [70 * K, 380 * K],
    perMonth: 3,
    submitters: ["u-ngozi", "u-tunde"],
    department: "Admin",
  },
  {
    category: "Logistics",
    descriptions: [
      "Towing — Lagos to Abuja vehicle transfer",
      "Flatbed hire for incoming units",
      "Plate number & VIO processing",
      "Fuel & driver allowance — delivery run",
    ],
    range: [120 * K, 850 * K],
    perMonth: 3,
    submitters: ["u-aisha", "u-emeka"],
    department: "Logistics",
  },
];

const APPROVERS = ["u-chinedu", "u-ngozi", "u-musa"];

const expenses: Expense[] = [];
let seq = 0;

// Six months of approved history (months 5..1 ago) plus the current month.
for (let monthsAgo = 5; monthsAgo >= 0; monthsAgo--) {
  for (const t of TEMPLATES) {
    // Current-month anomaly: generator spend up sharply (AI card feeds on this).
    const count =
      t.category === "Fuel & Generator" && monthsAgo === 0
        ? t.perMonth + 2
        : t.perMonth;
    for (let i = 0; i < count; i++) {
      const day = 2 + Math.floor(rand() * 26);
      const date = monthDayISO(monthsAgo, day);
      if (new Date(date).getTime() > Date.now()) continue; // future days of current month
      expenses.push({
        id: `e-${String(++seq).padStart(3, "0")}`,
        date,
        category: t.category,
        description: pick(t.descriptions),
        amount: between(t.range[0], t.range[1]),
        submittedBy: pick(t.submitters),
        status: "Approved",
        approvedBy: pick(APPROVERS),
        department: t.department,
      });
    }
  }
}

// A rejected one for realism.
expenses.push({
  id: `e-${String(++seq).padStart(3, "0")}`,
  date: daysAgoISO(12, 15, 20),
  category: "Logistics",
  description: "Weekend driver overtime — no prior approval",
  amount: 240 * K,
  submittedBy: "u-emeka",
  status: "Rejected",
  approvedBy: "u-chinedu",
  department: "Logistics",
});

// Pending queue — the live approval-flow demo moment.
const PENDING: Array<[number, ExpenseCategory, string, number, string, Expense["department"]]> = [
  [0, "Fuel & Generator", "Diesel for showroom generator — urgent top-up", 420 * K, "u-tunde", "Sales"],
  [1, "Vehicle Repairs", "Windscreen replacement — Lexus RX 350 (v-011)", 380 * K, "u-hauwa", "Workshop"],
  [2, "Marketing", "Boosted Instagram reel — Land Cruiser listing", 250 * K, "u-seyi", "Marketing"],
  [3, "Logistics", "Flatbed hire — 2 units from Apapa port", 680 * K, "u-aisha", "Logistics"],
];

for (const [dAgo, category, description, amount, submittedBy, department] of PENDING) {
  expenses.push({
    id: `e-${String(++seq).padStart(3, "0")}`,
    date: daysAgoISO(dAgo, 9, 30),
    category,
    description,
    amount,
    submittedBy,
    status: "Pending",
    department,
  });
}

export const EXPENSES: Expense[] = expenses.sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
);

/** Monthly budget plan, used by Planning and budget-vs-actual charts. */
export const BUDGET: { category: ExpenseCategory; monthlyBudget: number }[] = [
  { category: "Salaries", monthlyBudget: 8.5 * M },
  { category: "Customs & Clearing", monthlyBudget: 6 * M },
  { category: "Rent", monthlyBudget: 2.2 * M },
  { category: "Vehicle Repairs", monthlyBudget: 2.5 * M },
  { category: "Fuel & Generator", monthlyBudget: 1.8 * M },
  { category: "Marketing", monthlyBudget: 2 * M },
  { category: "Logistics", monthlyBudget: 1.5 * M },
  { category: "Utilities", monthlyBudget: 0.7 * M },
];
