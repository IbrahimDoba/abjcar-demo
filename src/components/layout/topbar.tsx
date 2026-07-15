"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Repeat,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { can, ROLE_LABELS } from "@/lib/permissions";
import { pendingExpenses } from "@/lib/stats";
import { useAppStore, useCurrentUser } from "@/store/app-store";
import { DEMO_ACCOUNTS } from "@/data/seed/users";
import { NAV_ITEMS } from "./nav";
import { Avatar } from "@/components/ui/primitives";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useCurrentUser();
  const users = useAppStore((s) => s.users);
  const expenses = useAppStore((s) => s.expenses);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const login = useAppStore((s) => s.login);
  const logout = useAppStore((s) => s.logout);
  const [switcherOpen, setSwitcherOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setSwitcherOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  if (!user) return null;

  const title =
    NAV_ITEMS.find(
      (n) => pathname === n.href || pathname.startsWith(n.href + "/")
    )?.label ?? "Dashboard";

  const approvalsCount = can(user.role, "expenses", "approve")
    ? pendingExpenses(expenses).length
    : 0;

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur sm:px-6">
      <button
        onClick={onMenuClick}
        className="cursor-pointer rounded-md p-1.5 text-muted hover:bg-surface hover:text-foreground lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="min-w-0 flex-1 truncate text-sm font-semibold sm:text-[15px]">
        {title}
      </h1>

      {/* Notifications — pending approvals */}
      {approvalsCount > 0 && (
        <button
          onClick={() => router.push("/expenses")}
          className="relative cursor-pointer rounded-lg p-2 text-muted hover:bg-surface hover:text-foreground"
          title={`${approvalsCount} expense${approvalsCount > 1 ? "s" : ""} awaiting approval`}
        >
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
            {approvalsCount}
          </span>
        </button>
      )}

      {/* Theme toggle */}
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="cursor-pointer rounded-lg p-2 text-muted hover:bg-surface hover:text-foreground"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
      </button>

      {/* Role switcher */}
      <div className="relative" ref={ref}>
        <button
          onClick={() => setSwitcherOpen((v) => !v)}
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded-lg border px-2 py-1.5 transition-colors hover:border-accent/50",
            switcherOpen && "border-accent/50"
          )}
        >
          <Avatar src={user.avatar} name={user.name} size={26} />
          <span className="hidden text-left sm:block">
            <span className="block max-w-32 truncate text-xs font-medium leading-tight">
              {user.name.split(" ").slice(-2).join(" ")}
            </span>
            <span className="block text-[10px] leading-tight text-accent">
              {ROLE_LABELS[user.role]}
            </span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted" />
        </button>

        {switcherOpen && (
          <div className="animate-fade-up absolute right-0 top-full z-30 mt-2 w-64 rounded-xl border bg-raised p-1.5 shadow-xl">
            <p className="flex items-center gap-1.5 px-2.5 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
              <Repeat className="h-3 w-3" /> Demo mode — switch role
            </p>
            {DEMO_ACCOUNTS.map((id) => {
              const account = users.find((x) => x.id === id);
              if (!account) return null;
              const isCurrent = account.id === user.id;
              return (
                <button
                  key={account.id}
                  onClick={() => {
                    login(account.id);
                    setSwitcherOpen(false);
                    router.push("/dashboard");
                  }}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-surface",
                    isCurrent && "bg-accent-subtle"
                  )}
                >
                  <Avatar src={account.avatar} name={account.name} size={28} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium">
                      {account.name}
                    </span>
                    <span className="block text-[10px] text-muted">
                      {ROLE_LABELS[account.role]}
                    </span>
                  </span>
                  {isCurrent && (
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  )}
                </button>
              );
            })}
            <div className="mt-1 border-t pt-1">
              <button
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-danger hover:bg-danger-subtle"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
