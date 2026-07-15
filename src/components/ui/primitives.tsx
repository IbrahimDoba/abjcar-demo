"use client";

import * as React from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

/* ---------------------------------- Button --------------------------------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
type ButtonSize = "sm" | "md";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-strong shadow-sm disabled:opacity-50",
  secondary:
    "border bg-raised text-foreground hover:bg-surface disabled:opacity-50",
  ghost: "text-muted hover:text-foreground hover:bg-surface",
  danger:
    "bg-danger-subtle text-danger border border-danger/20 hover:brightness-95 dark:hover:brightness-125",
  success:
    "bg-success-subtle text-success border border-success/20 hover:brightness-95 dark:hover:brightness-125",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed",
        size === "sm" ? "h-8 px-3 text-xs" : "h-9.5 px-4 text-sm",
        buttonVariants[variant],
        className
      )}
      {...props}
    />
  );
}

/* ----------------------------------- Card ---------------------------------- */

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl border bg-raised shadow-xs", className)}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3 p-5 pb-0", className)}>
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------------------------------- Badge ---------------------------------- */

type BadgeTone = "neutral" | "blue" | "green" | "amber" | "red";

const badgeTones: Record<BadgeTone, string> = {
  neutral: "bg-surface text-muted border",
  blue: "bg-accent-subtle text-accent border border-accent/20",
  green: "bg-success-subtle text-success border border-success/20",
  amber: "bg-warning-subtle text-warning border border-warning/20",
  red: "bg-danger-subtle text-danger border border-danger/20",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium",
        badgeTones[tone],
        className
      )}
      {...props}
    />
  );
}

/* ---------------------------------- Inputs --------------------------------- */

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-9.5 w-full rounded-lg border bg-raised px-3 text-sm placeholder:text-muted/70 focus:outline-2 focus:outline-offset-1 focus:outline-accent",
        className
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-9.5 w-full cursor-pointer appearance-none rounded-lg border bg-raised px-3 pr-8 text-sm focus:outline-2 focus:outline-offset-1 focus:outline-accent",
        "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22/%3E%3C/svg%3E')] bg-[position:right_0.65rem_center] bg-no-repeat",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-lg border bg-raised px-3 py-2 text-sm placeholder:text-muted/70 focus:outline-2 focus:outline-offset-1 focus:outline-accent",
        className
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

/* ---------------------------------- Avatar --------------------------------- */

export function Avatar({
  src,
  name,
  size = 32,
  className,
}: {
  src?: string;
  name: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = React.useState(false);
  if (!src || failed) {
    return (
      <span
        style={{ width: size, height: size, fontSize: size * 0.36 }}
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full bg-accent-subtle font-semibold text-accent",
          className
        )}
      >
        {initials(name)}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className={cn("shrink-0 rounded-full object-cover", className)}
      style={{ width: size, height: size }}
    />
  );
}

/* ------------------------------- VehicleImage ------------------------------ */

/**
 * Remote photo with a branded fallback — a dead URL or slow network must
 * never show a broken image during a pitch.
 */
export function VehicleImage({
  src,
  alt,
  className,
  sizes = "400px",
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
}) {
  const [failed, setFailed] = React.useState(false);
  if (failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-sidebar to-accent/40 px-3 text-center",
          className
        )}
      >
        <span className="text-xs font-semibold tracking-wide text-white/85">
          {alt}
        </span>
      </div>
    );
  }
  return (
    <div className={cn("relative overflow-hidden bg-surface", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        onError={() => setFailed(true)}
        className="object-cover"
      />
    </div>
  );
}

/* ---------------------------------- Table ---------------------------------- */

export function Table({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full text-sm", className)} {...props} />
    </div>
  );
}

export function Th({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "whitespace-nowrap border-b px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted",
        className
      )}
      {...props}
    />
  );
}

export function Td({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("whitespace-nowrap border-b border-border/60 px-4 py-3", className)}
      {...props}
    />
  );
}

/* ---------------------------------- Modal ---------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className={cn(
          "animate-fade-up max-h-[85vh] w-full overflow-y-auto rounded-xl border bg-raised shadow-xl",
          wide ? "max-w-2xl" : "max-w-md"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-5 py-3.5">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-md p-1 text-muted hover:bg-surface hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ---------------------------------- Toast ---------------------------------- */

interface ToastItem {
  id: number;
  message: string;
  tone: "success" | "info" | "error";
}

const ToastContext = React.createContext<{
  toast: (message: string, tone?: ToastItem["tone"]) => void;
}>({ toast: () => {} });

export function useToast() {
  return React.useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const toast = React.useCallback(
    (message: string, tone: ToastItem["tone"] = "success") => {
      const id = Date.now() + Math.random();
      setItems((prev) => [...prev, { id, message, tone }]);
      setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3500);
    },
    []
  );
  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 left-1/2 z-[60] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4">
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              "animate-fade-up pointer-events-auto rounded-lg border px-4 py-2.5 text-sm font-medium shadow-lg",
              t.tone === "success" && "border-success/25 bg-success-subtle text-success",
              t.tone === "info" && "border-accent/25 bg-accent-subtle text-accent",
              t.tone === "error" && "border-danger/25 bg-danger-subtle text-danger"
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* -------------------------------- Stat tile -------------------------------- */

export function StatTile({
  label,
  value,
  sub,
  icon,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
  trend?: { pct: number; goodWhenDown?: boolean };
}) {
  const trendGood =
    trend && (trend.goodWhenDown ? trend.pct <= 0 : trend.pct >= 0);
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-muted">{label}</p>
        {icon && <span className="text-muted/70">{icon}</span>}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      <div className="mt-1 flex items-center gap-2 text-xs">
        {trend && (
          <span className={cn("font-medium", trendGood ? "text-success" : "text-danger")}>
            {trend.pct > 0 ? "+" : ""}
            {trend.pct}%
          </span>
        )}
        {sub && <span className="text-muted">{sub}</span>}
      </div>
    </Card>
  );
}

/* -------------------------------- Progress bar ------------------------------ */

export function Progress({
  value,
  className,
}: {
  value: number; // 0..100
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-surface", className)}>
      <div
        className={cn(
          "h-full rounded-full transition-all",
          clamped >= 100 ? "bg-success" : "bg-accent"
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

/* -------------------------------- Empty state ------------------------------- */

export function EmptyState({
  icon,
  title,
  hint,
}: {
  icon?: React.ReactNode;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
      {icon && <div className="text-muted/50">{icon}</div>}
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="max-w-xs text-xs text-muted">{hint}</p>}
    </div>
  );
}
