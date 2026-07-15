"use client";

import * as React from "react";
import { UserPlus, ShieldCheck } from "lucide-react";
import { useAppStore, useCurrentUser } from "@/store/app-store";
import {
  PERMISSIONS,
  ROLE_LABELS,
  can,
  type Action,
  type ModuleKey,
} from "@/lib/permissions";
import type { Department, Role } from "@/lib/types";
import { formatDateTime, relativeDays } from "@/lib/format";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  Field,
  Input,
  Modal,
  Select,
  StatTile,
  Table,
  Td,
  Th,
  useToast,
} from "@/components/ui/primitives";

const ROLES: Role[] = [
  "super_admin",
  "admin",
  "ceo",
  "cmo",
  "manager",
  "operator",
  "staff",
];

const DEPARTMENTS: Department[] = [
  "Sales",
  "Logistics",
  "Workshop",
  "Admin",
  "Marketing",
];

const MODULES: ModuleKey[] = [
  "dashboard",
  "inventory",
  "expenses",
  "equipment",
  "operations",
  "meetings",
  "planning",
  "reports",
  "users",
  "settings",
];

const ACTION_LETTERS: { action: Action; letter: string; label: string }[] = [
  { action: "view", letter: "V", label: "View" },
  { action: "create", letter: "C", label: "Create" },
  { action: "edit", letter: "E", label: "Edit" },
  { action: "approve", letter: "A", label: "Approve" },
  { action: "delete", letter: "D", label: "Delete" },
];

const MODULE_LABELS: Record<ModuleKey, string> = {
  dashboard: "Dashboard",
  inventory: "Inventory",
  expenses: "Expenses",
  equipment: "Equipment",
  operations: "Operations",
  meetings: "Meetings",
  planning: "Planning",
  reports: "Reports",
  users: "Users",
  settings: "Settings",
};

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  title: "",
  department: "Sales" as Department,
  role: "staff" as Role,
};

export default function UsersPage() {
  const currentUser = useCurrentUser();
  const users = useAppStore((s) => s.users);
  const activities = useAppStore((s) => s.activities);
  const addUser = useAppStore((s) => s.addUser);
  const updateUserRole = useAppStore((s) => s.updateUserRole);
  const { toast } = useToast();

  const [addOpen, setAddOpen] = React.useState(false);
  const [form, setForm] = React.useState(EMPTY_FORM);

  if (!currentUser) return null;
  const canEdit = can(currentUser.role, "users", "edit");
  const canCreate = can(currentUser.role, "users", "create");
  const isSuperAdmin = currentUser.role === "super_admin";

  const activeCount = users.filter((u) => u.status === "active").length;
  const departmentCount = new Set(users.map((u) => u.department)).size;
  const roleCount = new Set(users.map((u) => u.role)).size;

  const nameOf = (id: string) => users.find((u) => u.id === id);

  function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    addUser({ ...form, avatar: "" });
    toast("User added");
    setAddOpen(false);
    setForm(EMPTY_FORM);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Users & roles</h1>
          <p className="text-sm text-muted">
            Everyone on the team, and exactly what their role lets them do.
          </p>
        </div>
        {canCreate && (
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <UserPlus className="h-3.5 w-3.5" />
            Add user
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatTile label="Total users" value={String(users.length)} />
        <StatTile label="Active" value={String(activeCount)} sub="signed in recently" />
        <StatTile label="Departments" value={String(departmentCount)} />
        <StatTile label="Roles in use" value={String(roleCount)} sub="of 7 defined" />
      </div>

      <Card>
        <CardHeader
          title="Team"
          subtitle={canEdit ? "Change a role from the dropdown — access updates instantly" : undefined}
        />
        <div className="p-2 pt-3">
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Title</Th>
                <Th>Department</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>Last active</Th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <Td>
                    <span className="flex items-center gap-3">
                      <Avatar src={u.avatar} name={u.name} size={34} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">
                          {u.name}
                        </span>
                        <span className="block truncate text-xs text-muted">
                          {u.email}
                        </span>
                      </span>
                    </span>
                  </Td>
                  <Td className="text-muted">{u.title}</Td>
                  <Td className="text-muted">{u.department}</Td>
                  <Td>
                    {canEdit ? (
                      <Select
                        aria-label={`Role for ${u.name}`}
                        value={u.role}
                        onChange={(e) => {
                          updateUserRole(u.id, e.target.value as Role);
                          toast("Role updated");
                        }}
                        className="h-8 w-36 text-xs"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <Badge tone="blue">{ROLE_LABELS[u.role]}</Badge>
                    )}
                  </Td>
                  <Td>
                    <Badge tone={u.status === "active" ? "green" : "neutral"}>
                      {u.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </Td>
                  <Td className="text-muted">{relativeDays(u.lastActive)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card>

      {isSuperAdmin && (
        <Card>
          <CardHeader
            title="Permission matrix"
            subtitle="The single source of truth for role-based access — every page, button and column reads from this table"
            action={
              <span className="hidden items-center gap-1.5 text-xs text-muted sm:flex">
                <ShieldCheck className="h-4 w-4 text-accent" />
                Super Admin view
              </span>
            }
          />
          <div className="p-5 pt-4">
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface">
                    <Th>Module</Th>
                    {ROLES.map((r) => (
                      <Th key={r} className="text-center">
                        {ROLE_LABELS[r]}
                      </Th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MODULES.map((m) => (
                    <tr key={m}>
                      <Td className="font-medium">{MODULE_LABELS[m]}</Td>
                      {ROLES.map((r) => {
                        const granted = ACTION_LETTERS.filter(
                          ({ action }) => PERMISSIONS[r]?.[m]?.[action] === true
                        );
                        return (
                          <Td key={r} className="text-center">
                            {granted.length === 0 ? (
                              <span className="text-muted/40">—</span>
                            ) : (
                              <span className="font-mono text-xs font-semibold tracking-[0.2em] text-accent">
                                {granted.map((g) => g.letter).join("")}
                              </span>
                            )}
                          </Td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
              {ACTION_LETTERS.map((a) => (
                <span key={a.action}>
                  <span className="font-mono font-semibold text-accent">{a.letter}</span>{" "}
                  {a.label}
                </span>
              ))}
              <span>
                <span className="text-muted/40">—</span> No access
              </span>
            </div>
          </div>
        </Card>
      )}

      {isSuperAdmin && (
        <Card>
          <CardHeader
            title="Audit trail"
            subtitle="The most recent actions taken across the workspace"
          />
          <div className="divide-y divide-border/60 p-5 pt-3">
            {activities.slice(0, 10).map((a) => {
              const actor = nameOf(a.actor);
              return (
                <div key={a.id} className="flex items-center gap-3 py-2.5">
                  <Avatar src={actor?.avatar} name={actor?.name ?? "Unknown"} size={30} />
                  <p className="min-w-0 flex-1 text-sm">
                    <span className="font-medium">{actor?.name ?? "Unknown user"}</span>{" "}
                    <span className="text-muted">{a.action}</span>
                  </p>
                  <Badge tone="neutral" className="capitalize">
                    {a.module}
                  </Badge>
                  <span className="whitespace-nowrap text-xs text-muted">
                    {formatDateTime(a.date)}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add user">
        <form onSubmit={submitAdd} className="space-y-4">
          <Field label="Full name">
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Amina Yusuf"
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Email">
              <Input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="amina@abujacar.ng"
              />
            </Field>
            <Field label="Phone">
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+234 800 000 0000"
              />
            </Field>
          </div>
          <Field label="Job title">
            <Input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Sales Executive"
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Department">
              <Select
                value={form.department}
                onChange={(e) =>
                  setForm({ ...form, department: e.target.value as Department })
                }
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Role">
              <Select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add user</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
