"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useAppStore, useCurrentUser } from "@/store/app-store";
import { can } from "@/lib/permissions";
import { moduleForPath } from "@/components/layout/nav";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/primitives";
import { AssistantWidget } from "@/components/assistant/assistant-widget";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useCurrentUser();
  const currentUserId = useAppStore((s) => s.currentUserId);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [navPathname, setNavPathname] = React.useState(pathname);

  // Close the mobile drawer on navigation (adjust-state-during-render pattern).
  if (navPathname !== pathname) {
    setNavPathname(pathname);
    if (mobileNavOpen) setMobileNavOpen(false);
  }

  React.useEffect(() => {
    if (!currentUserId) router.replace("/login");
  }, [currentUserId, router]);

  if (!user) return null;

  const moduleKey = moduleForPath(pathname);
  const allowed = moduleKey === null || can(user.role, moduleKey);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        <Topbar onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 bg-surface p-4 sm:p-6">
          {allowed ? (
            children
          ) : (
            <AccessDenied onBack={() => router.push("/dashboard")} />
          )}
        </main>
      </div>
      <AssistantWidget />
    </div>
  );
}

function AccessDenied({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-subtle">
        <ShieldAlert className="h-7 w-7 text-danger" />
      </span>
      <h2 className="text-lg font-semibold">You don&apos;t have access to this page</h2>
      <p className="max-w-sm text-sm text-muted">
        Your role isn&apos;t permitted to view this module. Access is controlled by your
        administrator — switch roles from the top bar to see how permissions change.
      </p>
      <Button className="mt-2" onClick={onBack}>
        Back to dashboard
      </Button>
    </div>
  );
}
