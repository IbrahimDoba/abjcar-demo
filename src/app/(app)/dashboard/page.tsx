"use client";

import { useCurrentUser } from "@/store/app-store";
import {
  CmoDashboard,
  ExecDashboard,
  ManagerDashboard,
  OperatorDashboard,
  StaffDashboard,
} from "@/components/dashboard/role-dashboards";

/**
 * The dashboard is role-aware: each role gets a composition built around
 * what that person actually does — executives see the money, the CMO sees
 * campaigns, managers see approvals, operators see movements, staff see
 * their own work. Every number comes from the live store via stats helpers.
 */
export default function DashboardPage() {
  const user = useCurrentUser();
  if (!user) return null;

  switch (user.role) {
    case "super_admin":
    case "admin":
    case "ceo":
      return <ExecDashboard user={user} />;
    case "cmo":
      return <CmoDashboard user={user} />;
    case "manager":
      return <ManagerDashboard user={user} />;
    case "operator":
      return <OperatorDashboard user={user} />;
    case "staff":
      return <StaffDashboard user={user} />;
  }
}
