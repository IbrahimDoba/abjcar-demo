import type { Campaign, Goal, MonthlySales } from "@/lib/types";
import { currentQuarter, monthLabel } from "./clock";

const M = 1_000_000;

export const GOALS: Goal[] = [
  {
    id: "g-001",
    title: "Sell 45 units this quarter",
    quarter: currentQuarter(),
    metric: "Units sold",
    target: 45,
    current: 19,
    unit: "units",
    owner: "u-chinedu",
  },
  {
    id: "g-002",
    title: "Hit ₦850M quarterly revenue",
    quarter: currentQuarter(),
    metric: "Revenue",
    target: 850 * M,
    current: 402 * M,
    unit: "naira",
    owner: "u-ibrahim",
  },
  {
    id: "g-003",
    title: "Keep average days-in-stock under 35",
    quarter: currentQuarter(),
    metric: "Avg days in stock",
    target: 35,
    current: 38,
    unit: "units",
    owner: "u-ngozi",
  },
  {
    id: "g-004",
    title: "Grow Instagram-attributed sales to 25%",
    quarter: currentQuarter(),
    metric: "IG-attributed share",
    target: 25,
    current: 18,
    unit: "percent",
    owner: "u-funke",
  },
  {
    id: "g-005",
    title: "Cut monthly generator spend by 15%",
    quarter: currentQuarter(),
    metric: "Fuel & generator spend",
    target: 15,
    current: -41,
    unit: "percent",
    owner: "u-ngozi",
  },
];

export const CAMPAIGNS: Campaign[] = [
  {
    id: "c-001",
    name: "Instagram Promoted Listings",
    channel: "Instagram",
    monthlySpend: 850_000,
    leads: 142,
    salesAttributed: 6,
    status: "Active",
  },
  {
    id: "c-002",
    name: "Jiji.ng Premium Boost",
    channel: "Jiji.ng",
    monthlySpend: 420_000,
    leads: 96,
    salesAttributed: 4,
    status: "Active",
  },
  {
    id: "c-003",
    name: "WAZOBIA FM Drive-Time Spots",
    channel: "Radio",
    monthlySpend: 1_100_000,
    leads: 54,
    salesAttributed: 3,
    status: "Active",
  },
  {
    id: "c-004",
    name: "Airport Road Billboard",
    channel: "Billboard",
    monthlySpend: 950_000,
    leads: 21,
    salesAttributed: 1,
    status: "Paused",
  },
  {
    id: "c-005",
    name: "Customer Referral Bonus",
    channel: "Referral",
    monthlySpend: 300_000,
    leads: 33,
    salesAttributed: 5,
    status: "Active",
  },
  {
    id: "c-006",
    name: "Facebook Marketplace Ads",
    channel: "Facebook",
    monthlySpend: 380_000,
    leads: 88,
    salesAttributed: 2,
    status: "Active",
  },
];

/**
 * Six months of top-line history for dashboard charts.
 * Index 0 is five months ago; the last entry is the current month to date.
 */
export const SALES_HISTORY: MonthlySales[] = [
  { month: monthLabel(5), unitsSold: 9, revenue: 168 * M, profit: 31 * M },
  { month: monthLabel(4), unitsSold: 12, revenue: 214 * M, profit: 42 * M },
  { month: monthLabel(3), unitsSold: 10, revenue: 189 * M, profit: 35 * M },
  { month: monthLabel(2), unitsSold: 14, revenue: 262 * M, profit: 51 * M },
  { month: monthLabel(1), unitsSold: 13, revenue: 246 * M, profit: 47 * M },
  { month: monthLabel(0), unitsSold: 8, revenue: 156 * M, profit: 29 * M },
];
