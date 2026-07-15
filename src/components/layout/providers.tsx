"use client";

import * as React from "react";
import { useAppStore } from "@/store/app-store";
import { ToastProvider } from "@/components/ui/primitives";

/** Applies the persisted theme class and gates rendering on store hydration. */
export function Providers({ children }: { children: React.ReactNode }) {
  const theme = useAppStore((s) => s.theme);

  // False during SSR/hydration, true once the persisted store has loaded —
  // avoids any server/client markup mismatch from localStorage state.
  const hydrated = React.useSyncExternalStore(
    (onChange) => useAppStore.persist.onFinishHydration(onChange),
    () => useAppStore.persist.hasHydrated(),
    () => false
  );

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-sm text-muted">
          <span className="animate-pulse-dot h-2 w-2 rounded-full bg-accent" />
          Loading AbujaCar…
        </div>
      </div>
    );
  }

  return <ToastProvider>{children}</ToastProvider>;
}
