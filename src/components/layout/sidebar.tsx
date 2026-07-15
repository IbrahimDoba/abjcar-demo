"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { can, ROLE_LABELS } from "@/lib/permissions";
import { useCurrentUser } from "@/store/app-store";
import { NAV_ITEMS } from "./nav";
import { Avatar } from "@/components/ui/primitives";

export function Sidebar({
  mobileOpen,
  onMobileClose,
}: {
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  const pathname = usePathname();
  const user = useCurrentUser();
  if (!user) return null;

  const items = NAV_ITEMS.filter((item) => can(user.role, item.key));

  const nav = (
    <nav className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center justify-between px-5 py-5">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
            <Car className="h-4.5 w-4.5 text-white" />
          </span>
          <span>
            <span className="block text-[13px] font-bold tracking-wide">ABUJACAR</span>
            <span className="block text-[10px] text-sidebar-muted">Operations Hub</span>
          </span>
        </Link>
        <button
          onClick={onMobileClose}
          className="cursor-pointer rounded-md p-1 text-sidebar-muted hover:text-sidebar-foreground lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                active
                  ? "bg-white/8 text-white"
                  : "text-sidebar-muted hover:bg-white/5 hover:text-sidebar-foreground"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent" />
              )}
              <Icon
                className={cn(
                  "h-4.5 w-4.5",
                  active ? "text-accent-strong" : "text-sidebar-muted group-hover:text-sidebar-foreground"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="border-t border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <Avatar src={user.avatar} name={user.name} size={34} />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium">{user.name}</p>
            <p className="truncate text-[11px] text-sidebar-muted">
              {ROLE_LABELS[user.role]} · {user.department}
            </p>
          </div>
        </div>
      </div>
    </nav>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 lg:block">{nav}</aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onMobileClose} />
          <aside className="animate-fade-up absolute inset-y-0 left-0 w-72 shadow-2xl">
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}
