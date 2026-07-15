import type { Role } from "./types";

export type ModuleKey =
  | "dashboard"
  | "inventory"
  | "expenses"
  | "equipment"
  | "operations"
  | "meetings"
  | "planning"
  | "reports"
  | "users"
  | "settings";

export type Action = "view" | "create" | "edit" | "approve" | "delete";

type ModulePermissions = Partial<Record<Action, boolean>>;

/**
 * Single source of truth for RBAC across the app.
 * Navigation, route guards, page sections, table columns and action
 * buttons all read from this matrix — nothing else decides access.
 */
export const PERMISSIONS: Record<Role, Partial<Record<ModuleKey, ModulePermissions>>> = {
  super_admin: {
    dashboard: { view: true },
    inventory: { view: true, create: true, edit: true, approve: true, delete: true },
    expenses: { view: true, create: true, edit: true, approve: true, delete: true },
    equipment: { view: true, create: true, edit: true, delete: true },
    operations: { view: true, create: true, edit: true, delete: true },
    meetings: { view: true, create: true, edit: true, delete: true },
    planning: { view: true, create: true, edit: true, approve: true },
    reports: { view: true },
    users: { view: true, create: true, edit: true, delete: true },
    settings: { view: true, edit: true },
  },
  admin: {
    dashboard: { view: true },
    inventory: { view: true, create: true, edit: true, approve: true, delete: true },
    expenses: { view: true, create: true, edit: true, approve: true, delete: true },
    equipment: { view: true, create: true, edit: true, delete: true },
    operations: { view: true, create: true, edit: true, delete: true },
    meetings: { view: true, create: true, edit: true, delete: true },
    planning: { view: true, create: true, edit: true, approve: true },
    reports: { view: true },
    users: { view: true, create: true, edit: true },
  },
  ceo: {
    dashboard: { view: true },
    inventory: { view: true },
    expenses: { view: true, approve: true },
    equipment: { view: true },
    operations: { view: true },
    meetings: { view: true, create: true, edit: true },
    planning: { view: true, create: true, edit: true, approve: true },
    reports: { view: true },
  },
  cmo: {
    dashboard: { view: true },
    inventory: { view: true },
    expenses: { view: true, create: true },
    meetings: { view: true, create: true },
    planning: { view: true, create: true, edit: true },
    reports: { view: true },
  },
  manager: {
    dashboard: { view: true },
    inventory: { view: true, create: true, edit: true },
    expenses: { view: true, create: true, approve: true },
    equipment: { view: true },
    operations: { view: true, create: true, edit: true },
    meetings: { view: true, create: true, edit: true },
    reports: { view: true },
  },
  operator: {
    dashboard: { view: true },
    inventory: { view: true, edit: true },
    equipment: { view: true, create: true, edit: true },
    operations: { view: true, edit: true },
    meetings: { view: true },
  },
  staff: {
    dashboard: { view: true },
    inventory: { view: true },
    expenses: { view: true, create: true },
    operations: { view: true, edit: true },
    meetings: { view: true },
  },
};

export function can(role: Role, module: ModuleKey, action: Action = "view"): boolean {
  return PERMISSIONS[role]?.[module]?.[action] === true;
}

/** Roles that see business-wide financials (margins, profit, cost prices). */
export function seesFinancials(role: Role): boolean {
  return ["super_admin", "admin", "ceo", "cmo"].includes(role);
}

/** Roles whose expense view is limited to their own submissions. */
export function ownExpensesOnly(role: Role): boolean {
  return role === "staff";
}

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  ceo: "CEO",
  cmo: "CMO",
  manager: "Manager",
  operator: "Operator",
  staff: "Staff",
};

export const ROLE_TIER: Record<Role, "Admin" | "Executive" | "Operations"> = {
  super_admin: "Admin",
  admin: "Admin",
  ceo: "Executive",
  cmo: "Executive",
  manager: "Operations",
  operator: "Operations",
  staff: "Operations",
};
