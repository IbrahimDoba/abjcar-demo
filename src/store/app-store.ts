"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Activity,
  Expense,
  Equipment,
  Meeting,
  Task,
  TaskStatus,
  User,
  Vehicle,
  VehicleStatus,
} from "@/lib/types";
import { USERS } from "@/data/seed/users";
import { VEHICLES } from "@/data/seed/vehicles";
import { EXPENSES } from "@/data/seed/expenses";
import { EQUIPMENT, MAINTENANCE_LOGS } from "@/data/seed/equipment";
import { MEETINGS } from "@/data/seed/meetings";
import { TASKS, ACTIVITIES } from "@/data/seed/operations";
import { formatNairaCompact } from "@/lib/format";

interface AppState {
  currentUserId: string | null;
  theme: "light" | "dark";

  users: User[];
  vehicles: Vehicle[];
  expenses: Expense[];
  equipment: Equipment[];
  maintenanceLogs: typeof MAINTENANCE_LOGS;
  meetings: Meeting[];
  tasks: Task[];
  activities: Activity[];

  login: (userId: string) => void;
  logout: () => void;
  setTheme: (theme: "light" | "dark") => void;

  addExpense: (e: Omit<Expense, "id" | "status">) => void;
  setExpenseStatus: (id: string, status: "Approved" | "Rejected") => void;

  setVehicleStatus: (id: string, status: VehicleStatus) => void;
  markVehicleSold: (id: string, soldPrice: number) => void;

  setTaskStatus: (id: string, status: TaskStatus) => void;
  addMeeting: (m: Omit<Meeting, "id">) => void;
  addUser: (u: Omit<User, "id" | "lastActive" | "status">) => void;
  updateUserRole: (id: string, role: User["role"]) => void;
  logEquipmentService: (id: string) => void;

  resetDemo: () => void;
}

let seq = 100;
const nid = (p: string) => `${p}-${String(++seq).padStart(3, "0")}-${Math.floor(Math.random() * 1e4)}`;

function activity(
  actor: string,
  action: string,
  module: Activity["module"]
): Activity {
  return { id: nid("a"), date: new Date().toISOString(), actor, action, module };
}

const seedState = {
  users: USERS,
  vehicles: VEHICLES,
  expenses: EXPENSES,
  equipment: EQUIPMENT,
  maintenanceLogs: MAINTENANCE_LOGS,
  meetings: MEETINGS,
  tasks: TASKS,
  activities: ACTIVITIES,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUserId: null,
      theme: "light",
      ...seedState,

      login: (userId) => set({ currentUserId: userId }),
      logout: () => set({ currentUserId: null }),
      setTheme: (theme) => set({ theme }),

      addExpense: (e) =>
        set((s) => ({
          expenses: [{ ...e, id: nid("e"), status: "Pending" as const }, ...s.expenses],
          activities: [
            activity(
              e.submittedBy,
              `submitted a ${formatNairaCompact(e.amount)} ${e.category} expense`,
              "expenses"
            ),
            ...s.activities,
          ],
        })),

      setExpenseStatus: (id, status) =>
        set((s) => {
          const me = s.currentUserId ?? "u-ngozi";
          const target = s.expenses.find((x) => x.id === id);
          return {
            expenses: s.expenses.map((x) =>
              x.id === id ? { ...x, status, approvedBy: me } : x
            ),
            activities: target
              ? [
                  activity(
                    me,
                    `${status === "Approved" ? "approved" : "rejected"} a ${formatNairaCompact(target.amount)} ${target.category} expense`,
                    "expenses"
                  ),
                  ...s.activities,
                ]
              : s.activities,
          };
        }),

      setVehicleStatus: (id, status) =>
        set((s) => {
          const me = s.currentUserId ?? "u-aisha";
          const v = s.vehicles.find((x) => x.id === id);
          return {
            vehicles: s.vehicles.map((x) => (x.id === id ? { ...x, status } : x)),
            activities: v
              ? [
                  activity(me, `updated ${v.make} ${v.model} ${v.year} status to ${status}`, "inventory"),
                  ...s.activities,
                ]
              : s.activities,
          };
        }),

      markVehicleSold: (id, soldPrice) =>
        set((s) => {
          const me = s.currentUserId ?? "u-tunde";
          const v = s.vehicles.find((x) => x.id === id);
          return {
            vehicles: s.vehicles.map((x) =>
              x.id === id
                ? {
                    ...x,
                    status: "Sold" as const,
                    soldAt: new Date().toISOString(),
                    soldPrice,
                  }
                : x
            ),
            activities: v
              ? [
                  activity(
                    me,
                    `marked ${v.make} ${v.model} ${v.year} as Sold at ${formatNairaCompact(soldPrice)}`,
                    "inventory"
                  ),
                  ...s.activities,
                ]
              : s.activities,
          };
        }),

      setTaskStatus: (id, status) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
        })),

      addMeeting: (m) =>
        set((s) => ({
          meetings: [...s.meetings, { ...m, id: nid("mt") }],
          activities: [
            activity(m.organizer, `scheduled "${m.title}"`, "meetings"),
            ...s.activities,
          ],
        })),

      addUser: (u) =>
        set((s) => ({
          users: [
            ...s.users,
            { ...u, id: nid("u"), status: "active" as const, lastActive: new Date().toISOString() },
          ],
          activities: [
            activity(s.currentUserId ?? "u-ngozi", `added ${u.name} to ${u.department}`, "users"),
            ...s.activities,
          ],
        })),

      updateUserRole: (id, role) =>
        set((s) => ({
          users: s.users.map((u) => (u.id === id ? { ...u, role } : u)),
        })),

      logEquipmentService: (id) =>
        set((s) => {
          const now = new Date();
          const next = new Date(now);
          next.setDate(next.getDate() + 90);
          return {
            equipment: s.equipment.map((q) =>
              q.id === id
                ? {
                    ...q,
                    condition: "Good" as const,
                    lastServicedAt: now.toISOString(),
                    nextServiceDue: next.toISOString(),
                  }
                : q
            ),
            activities: [
              activity(
                s.currentUserId ?? "u-hauwa",
                `logged a completed service on ${s.equipment.find((q) => q.id === id)?.name ?? "equipment"}`,
                "equipment"
              ),
              ...s.activities,
            ],
          };
        }),

      resetDemo: () =>
        set({ ...seedState, currentUserId: get().currentUserId }),
    }),
    {
      name: "abujacar-demo",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        currentUserId: s.currentUserId,
        theme: s.theme,
        vehicles: s.vehicles,
        expenses: s.expenses,
        equipment: s.equipment,
        meetings: s.meetings,
        tasks: s.tasks,
        users: s.users,
        activities: s.activities,
      }),
    }
  )
);

/** Convenience hook: the logged-in user object (null when logged out). */
export function useCurrentUser() {
  const id = useAppStore((s) => s.currentUserId);
  const users = useAppStore((s) => s.users);
  return users.find((u) => u.id === id) ?? null;
}
