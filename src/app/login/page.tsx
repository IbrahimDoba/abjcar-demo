"use client";

import { useRouter } from "next/navigation";
import { Car, ShieldCheck, Sparkles, Globe } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { DEMO_ACCOUNTS } from "@/data/seed/users";
import { ROLE_LABELS, ROLE_TIER } from "@/lib/permissions";
import { Avatar } from "@/components/ui/primitives";

const TIER_ORDER = ["Admin", "Executive", "Operations"] as const;

export default function LoginPage() {
  const router = useRouter();
  const users = useAppStore((s) => s.users);
  const login = useAppStore((s) => s.login);

  const accounts = DEMO_ACCOUNTS.map((id) => users.find((u) => u.id === id)!).filter(
    Boolean
  );

  function enter(userId: string) {
    login(userId);
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground lg:flex lg:w-[44%]">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
            <Car className="h-5 w-5 text-white" />
          </span>
          <div>
            <p className="text-sm font-bold tracking-wide">ABUJACAR</p>
            <p className="text-[11px] text-sidebar-muted">Operations Hub</p>
          </div>
        </div>

        <div>
          <h1 className="max-w-md text-3xl font-semibold leading-tight tracking-tight">
            Run the entire dealership from one screen,{" "}
            <span className="text-accent-strong">from anywhere.</span>
          </h1>
          <ul className="mt-8 space-y-4 text-sm text-sidebar-muted">
            <li className="flex items-center gap-3">
              <ShieldCheck className="h-4.5 w-4.5 text-accent-strong" />
              Role-based access — every person sees exactly what they need
            </li>
            <li className="flex items-center gap-3">
              <Sparkles className="h-4.5 w-4.5 text-accent-strong" />
              AI recommendations that watch your numbers for you
            </li>
            <li className="flex items-center gap-3">
              <Globe className="h-4.5 w-4.5 text-accent-strong" />
              Inventory, expenses, equipment, meetings & planning in one place
            </li>
          </ul>
        </div>

        <p className="text-xs text-sidebar-muted">
          Demo environment · Wuse Zone 5, Abuja · {new Date().getFullYear()}
        </p>
      </div>

      {/* Account picker */}
      <div className="flex flex-1 items-center justify-center bg-surface p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
                <Car className="h-5 w-5 text-white" />
              </span>
              <p className="text-sm font-bold tracking-wide">
                ABUJACAR <span className="font-normal text-muted">Operations Hub</span>
              </p>
            </div>
          </div>

          <h2 className="text-xl font-semibold tracking-tight">Sign in</h2>
          <p className="mt-1 text-sm text-muted">
            This is a demo — choose an account to explore what each role sees.
          </p>

          <div className="mt-6 space-y-5">
            {TIER_ORDER.map((tier) => {
              const tierAccounts = accounts.filter((u) => ROLE_TIER[u.role] === tier);
              if (tierAccounts.length === 0) return null;
              return (
                <div key={tier}>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                    {tier}
                  </p>
                  <div className="space-y-2">
                    {tierAccounts.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => enter(u.id)}
                        className="flex w-full cursor-pointer items-center gap-3 rounded-xl border bg-raised p-3 text-left shadow-xs transition-all hover:border-accent/50 hover:shadow-sm"
                      >
                        <Avatar src={u.avatar} name={u.name} size={38} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {u.name}
                          </span>
                          <span className="block truncate text-xs text-muted">
                            {u.title}
                          </span>
                        </span>
                        <span className="rounded-full bg-accent-subtle px-2.5 py-1 text-[11px] font-semibold text-accent">
                          {ROLE_LABELS[u.role]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
