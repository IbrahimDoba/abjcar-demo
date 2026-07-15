import {
  Banknote,
  CalendarDays,
  Car,
  ClipboardList,
  FileBarChart2,
  LayoutDashboard,
  Settings,
  Target,
  Users,
  Wrench,
} from "lucide-react";
import type { ModuleKey } from "@/lib/permissions";

export interface NavItem {
  key: ModuleKey;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "inventory", label: "Inventory", href: "/inventory", icon: Car },
  { key: "expenses", label: "Expenses", href: "/expenses", icon: Banknote },
  { key: "equipment", label: "Equipment", href: "/equipment", icon: Wrench },
  { key: "operations", label: "Operations", href: "/operations", icon: ClipboardList },
  { key: "meetings", label: "Meetings", href: "/meetings", icon: CalendarDays },
  { key: "planning", label: "Planning", href: "/planning", icon: Target },
  { key: "reports", label: "Reports", href: "/reports", icon: FileBarChart2 },
  { key: "users", label: "User Management", href: "/users", icon: Users },
  { key: "settings", label: "Settings", href: "/settings", icon: Settings },
];

/** Module for a pathname, e.g. /inventory/v-001 → inventory. */
export function moduleForPath(pathname: string): ModuleKey | null {
  const seg = pathname.split("/")[1];
  const item = NAV_ITEMS.find((n) => n.href === `/${seg}`);
  return item?.key ?? null;
}
