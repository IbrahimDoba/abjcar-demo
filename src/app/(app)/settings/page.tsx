"use client";

import * as React from "react";
import { Mail, Phone, Building2, Moon, Sun, RotateCcw, Car } from "lucide-react";
import { useAppStore, useCurrentUser } from "@/store/app-store";
import { ROLE_LABELS } from "@/lib/permissions";
import { cn } from "@/lib/cn";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  Modal,
  useToast,
} from "@/components/ui/primitives";

export default function SettingsPage() {
  const user = useCurrentUser();
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const resetDemo = useAppStore((s) => s.resetDemo);
  const { toast } = useToast();

  const [confirmOpen, setConfirmOpen] = React.useState(false);

  if (!user) return null;

  function handleReset() {
    resetDemo();
    setConfirmOpen(false);
    toast("Demo data reset");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted">
          Your profile, appearance and demo environment.
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader title="Profile" subtitle="Who you're signed in as" />
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
          <Avatar src={user.avatar} name={user.name} size={64} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-semibold">{user.name}</p>
              <Badge tone="blue">{ROLE_LABELS[user.role]}</Badge>
            </div>
            <p className="mt-0.5 text-sm text-muted">{user.title}</p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted">
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {user.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                {user.phone}
              </span>
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                {user.department}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader
          title="Appearance"
          subtitle="Choose how the Operations Hub looks on this device"
        />
        <div className="grid grid-cols-2 gap-4 p-5">
          <ThemeTile
            label="Light"
            icon={<Sun className="h-3.5 w-3.5" />}
            selected={theme === "light"}
            onSelect={() => setTheme("light")}
            preview={
              <div className="h-full w-full bg-white p-2.5">
                <div className="mb-2 h-1.5 w-1/2 rounded-full bg-black/15" />
                <div className="mb-1.5 h-1.5 w-3/4 rounded-full bg-black/10" />
                <div className="h-1.5 w-1/3 rounded-full bg-accent" />
              </div>
            }
          />
          <ThemeTile
            label="Dark"
            icon={<Moon className="h-3.5 w-3.5" />}
            selected={theme === "dark"}
            onSelect={() => setTheme("dark")}
            preview={
              <div className="h-full w-full bg-sidebar p-2.5">
                <div className="mb-2 h-1.5 w-1/2 rounded-full bg-white/25" />
                <div className="mb-1.5 h-1.5 w-3/4 rounded-full bg-white/15" />
                <div className="h-1.5 w-1/3 rounded-full bg-accent" />
              </div>
            }
          />
        </div>
      </Card>

      {/* Demo data */}
      <Card>
        <CardHeader
          title="Demo data"
          subtitle="All changes you make — sales, expenses, role edits — are stored locally in this browser. Nothing leaves your device."
        />
        <div className="flex items-center justify-between gap-4 p-5">
          <p className="text-sm text-muted">
            Want a clean slate for the next walkthrough? Restore everything to its
            original state.
          </p>
          <Button variant="danger" size="sm" onClick={() => setConfirmOpen(true)}>
            <RotateCcw className="h-3.5 w-3.5" />
            Reset demo data
          </Button>
        </div>
      </Card>

      {/* About */}
      <Card>
        <div className="flex items-start gap-4 p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
            <Car className="h-5 w-5 text-white" />
          </span>
          <div>
            <p className="text-sm font-semibold">
              AbujaCar Operations Hub{" "}
              <span className="font-normal text-muted">· demo build</span>
            </p>
            <p className="mt-1 max-w-md text-sm text-muted">
              Built as a product demonstration — the production system adds real
              authentication, a database, and live AI integration.
            </p>
          </div>
        </div>
      </Card>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Reset demo data?"
      >
        <p className="text-sm text-muted">
          This restores all inventory, expenses, meetings and tasks to their original
          demo state.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleReset}>
            Reset demo data
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function ThemeTile({
  label,
  icon,
  selected,
  onSelect,
  preview,
}: {
  label: string;
  icon: React.ReactNode;
  selected: boolean;
  onSelect: () => void;
  preview: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "cursor-pointer rounded-xl border p-2 text-left transition-all",
        selected
          ? "ring-2 ring-accent ring-offset-2 ring-offset-raised"
          : "hover:border-accent/50"
      )}
    >
      <div className="h-20 overflow-hidden rounded-lg border">{preview}</div>
      <span
        className={cn(
          "mt-2 flex items-center gap-1.5 px-1 pb-0.5 text-xs font-medium",
          selected ? "text-accent" : "text-muted"
        )}
      >
        {icon}
        {label}
        {selected && <span className="ml-auto text-[10px] uppercase tracking-wider">Active</span>}
      </span>
    </button>
  );
}
