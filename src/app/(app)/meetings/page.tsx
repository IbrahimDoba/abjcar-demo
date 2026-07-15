"use client";

import * as React from "react";
import {
  CalendarDays,
  CalendarClock,
  ChevronDown,
  Clock,
  History,
  MapPin,
  Plus,
  Sparkles,
  Video,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { Meeting, Role, User } from "@/lib/types";
import { can } from "@/lib/permissions";
import { formatDate, formatNairaCompact } from "@/lib/format";
import {
  availableVehicles,
  byCategory,
  expensesThisMonth,
  expenseTotal,
  inventoryValue,
  pendingExpenses,
} from "@/lib/stats";
import { useAppStore, useCurrentUser } from "@/store/app-store";
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Modal,
  StatTile,
} from "@/components/ui/primitives";
import { ScheduleMeetingModal } from "@/components/meetings/schedule-meeting-modal";

/* ------------------------------- Visibility -------------------------------- */

const MANAGEMENT_ROLES: Role[] = ["manager", "ceo", "cmo", "admin", "super_admin"];
const EXEC_ROLES: Role[] = ["ceo", "cmo", "admin", "super_admin"];

/** Who can see a meeting: attendee, organizer, or a tier their role clears. */
function canSeeMeeting(meeting: Meeting, user: User): boolean {
  if (meeting.attendees.includes(user.id)) return true;
  if (meeting.organizer === user.id) return true;
  if (meeting.tier === "all") return true;
  if (meeting.tier === "management" && MANAGEMENT_ROLES.includes(user.role))
    return true;
  if (meeting.tier === "exec" && EXEC_ROLES.includes(user.role)) return true;
  return false;
}

/* --------------------------------- Helpers --------------------------------- */

const TIER_BADGE: Record<Meeting["tier"], { tone: "blue" | "neutral" | "green"; label: string }> =
  {
    exec: { tone: "blue", label: "Executive" },
    management: { tone: "neutral", label: "Management" },
    all: { tone: "green", label: "All hands" },
  };

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-NG", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function isZoom(location: string): boolean {
  return /zoom|virtual|online|teams|meet/i.test(location);
}

/* ----------------------------------- Page ---------------------------------- */

export default function MeetingsPage() {
  const me = useCurrentUser();
  const meetings = useAppStore((s) => s.meetings);
  const users = useAppStore((s) => s.users);

  const [selectedDay, setSelectedDay] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<Meeting | null>(null);
  const [scheduleOpen, setScheduleOpen] = React.useState(false);
  const [showPast, setShowPast] = React.useState(false);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekEnd = new Date(startOfToday);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const visible = React.useMemo(
    () => (me ? meetings.filter((m) => canSeeMeeting(m, me)) : []),
    [meetings, me]
  );

  const upcoming = React.useMemo(
    () =>
      visible
        .filter((m) => new Date(m.date).getTime() >= now.getTime())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visible]
  );

  const past = React.useMemo(
    () =>
      visible
        .filter((m) => new Date(m.date).getTime() < now.getTime())
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visible]
  );

  if (!me) return null;

  const thisWeek = upcoming.filter((m) => new Date(m.date) < weekEnd);
  const hoursThisWeek = (
    thisWeek.reduce((s, m) => s + m.durationMins, 0) / 60
  ).toFixed(1);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfToday);
    d.setDate(d.getDate() + i);
    return d;
  });

  const listed = selectedDay
    ? upcoming.filter((m) => dayKey(new Date(m.date)) === selectedDay)
    : upcoming;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Meetings</h1>
          <p className="mt-0.5 text-sm text-muted">
            Your schedule across the dealership — you only see meetings meant for you.
          </p>
        </div>
        {can(me.role, "meetings", "create") && (
          <Button onClick={() => setScheduleOpen(true)}>
            <Plus className="h-4 w-4" /> Schedule meeting
          </Button>
        )}
      </div>

      {/* Stat tiles */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Upcoming meetings"
          value={String(upcoming.length)}
          sub="visible to you"
          icon={<CalendarDays className="h-4 w-4" />}
        />
        <StatTile
          label="This week"
          value={String(thisWeek.length)}
          sub="next 7 days"
          icon={<CalendarClock className="h-4 w-4" />}
        />
        <StatTile
          label="Hours scheduled"
          value={`${hoursThisWeek}h`}
          sub="this week"
          icon={<Clock className="h-4 w-4" />}
        />
        <StatTile
          label="Past meetings"
          value={String(past.length)}
          sub="on record"
          icon={<History className="h-4 w-4" />}
        />
      </div>

      {/* Week strip */}
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Next 7 days
          </p>
          {selectedDay && (
            <button
              onClick={() => setSelectedDay(null)}
              className="cursor-pointer text-xs font-medium text-accent hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {weekDays.map((d, i) => {
            const key = dayKey(d);
            const dayMeetings = upcoming.filter(
              (m) => dayKey(new Date(m.date)) === key
            );
            const isToday = i === 0;
            const isSelected = selectedDay === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedDay(isSelected ? null : key)}
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-1 rounded-xl border px-1 py-2.5 transition-colors sm:py-3",
                  isSelected
                    ? "border-accent bg-accent-subtle"
                    : "bg-raised hover:bg-surface",
                  isToday && !isSelected && "ring-2 ring-accent/60"
                )}
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                  {d.toLocaleDateString("en-NG", { weekday: "short" })}
                </span>
                <span
                  className={cn(
                    "text-base font-semibold",
                    (isToday || isSelected) && "text-accent"
                  )}
                >
                  {d.getDate()}
                </span>
                <span className="flex h-1.5 items-center gap-0.5">
                  {dayMeetings.slice(0, 3).map((m) => (
                    <span key={m.id} className="h-1.5 w-1.5 rounded-full bg-accent" />
                  ))}
                  {dayMeetings.length > 3 && (
                    <span className="text-[9px] font-semibold text-accent">
                      +{dayMeetings.length - 3}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Upcoming list */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">
            {selectedDay
              ? `Meetings on ${formatDate(
                  weekDays.find((d) => dayKey(d) === selectedDay)?.toISOString() ??
                    startOfToday.toISOString()
                )}`
              : "Upcoming"}
          </h2>
          <Badge tone="neutral">{listed.length}</Badge>
        </div>

        {listed.length === 0 ? (
          <Card>
            <EmptyState
              icon={<CalendarDays className="h-8 w-8" />}
              title={selectedDay ? "Nothing scheduled that day" : "No upcoming meetings"}
              hint={
                selectedDay
                  ? "Pick another day on the strip above, or clear the filter."
                  : "Meetings you organise or are invited to will appear here."
              }
            />
          </Card>
        ) : (
          listed.map((m) => {
            const d = new Date(m.date);
            const shown = m.attendees
              .map((id) => users.find((u) => u.id === id))
              .filter((u): u is User => Boolean(u));
            const tier = TIER_BADGE[m.tier];
            const Zoom = isZoom(m.location);
            return (
              <Card
                key={m.id}
                role="button"
                tabIndex={0}
                onClick={() => setDetail(m)}
                onKeyDown={(e) => e.key === "Enter" && setDetail(m)}
                className="flex cursor-pointer items-center gap-4 p-4 transition-all hover:border-accent/50 hover:shadow-sm"
              >
                <div className="flex h-13 w-13 shrink-0 flex-col items-center justify-center rounded-xl bg-accent-subtle">
                  <span className="text-lg font-bold leading-none text-accent">
                    {d.getDate()}
                  </span>
                  <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                    {d.toLocaleDateString("en-NG", { month: "short" })}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{m.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatTime(m.date)} · {m.durationMins} mins
                    </span>
                    <span className="inline-flex items-center gap-1">
                      {Zoom ? (
                        <Video className="h-3.5 w-3.5" />
                      ) : (
                        <MapPin className="h-3.5 w-3.5" />
                      )}
                      {m.location}
                    </span>
                  </div>
                </div>

                <div className="hidden items-center -space-x-2 sm:flex">
                  {shown.slice(0, 4).map((u) => (
                    <Avatar
                      key={u.id}
                      src={u.avatar}
                      name={u.name}
                      size={28}
                      className="ring-2 ring-raised"
                    />
                  ))}
                  {shown.length > 4 && (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface text-[10px] font-semibold text-muted ring-2 ring-raised">
                      +{shown.length - 4}
                    </span>
                  )}
                </div>

                <Badge tone={tier.tone}>{tier.label}</Badge>
              </Card>
            );
          })
        )}
      </div>

      {/* Past meetings (collapsed) */}
      <div>
        <button
          onClick={() => setShowPast((v) => !v)}
          className="flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-muted hover:text-foreground"
        >
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", !showPast && "-rotate-90")}
          />
          Past meetings
          <Badge tone="neutral">{past.length}</Badge>
        </button>
        {showPast && (
          <Card className="mt-2.5 divide-y divide-border/60">
            {past.length === 0 ? (
              <p className="p-4 text-sm text-muted">No past meetings on record.</p>
            ) : (
              past.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setDetail(m)}
                  className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left hover:bg-surface"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-muted">{m.title}</span>
                    <span className="block text-xs text-muted/70">
                      {formatDate(m.date)} · {formatTime(m.date)} · {m.location}
                    </span>
                  </span>
                  <Badge tone="neutral">{TIER_BADGE[m.tier].label}</Badge>
                </button>
              ))
            )}
          </Card>
        )}
      </div>

      {/* Detail + schedule modals */}
      <MeetingDetailModal meeting={detail} onClose={() => setDetail(null)} />
      <ScheduleMeetingModal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        organizer={me}
      />
    </div>
  );
}

/* ------------------------------- Detail modal ------------------------------ */

function MeetingDetailModal({
  meeting,
  onClose,
}: {
  meeting: Meeting | null;
  onClose: () => void;
}) {
  const users = useAppStore((s) => s.users);
  const vehicles = useAppStore((s) => s.vehicles);
  const expenses = useAppStore((s) => s.expenses);

  const brief = React.useMemo(() => {
    if (!meeting) return [];
    const avail = availableVehicles(vehicles);
    const monthly = expensesThisMonth(expenses);
    const bullets = [
      `Inventory: ${avail.length} units available worth ${formatNairaCompact(
        inventoryValue(vehicles)
      )}.`,
      `Spend this month: ${formatNairaCompact(expenseTotal(monthly))} with ${
        pendingExpenses(expenses).length
      } expenses pending approval.`,
    ];
    const text = `${meeting.title} ${meeting.agenda.join(" ")}`;
    if (/budget/i.test(text)) {
      const top = byCategory(monthly)[0];
      if (top) {
        bullets.push(
          `Biggest budget line this month: ${top.category} at ${formatNairaCompact(
            top.total
          )}.`
        );
      }
    }
    return bullets;
  }, [meeting, vehicles, expenses]);

  if (!meeting) return null;

  const organizer = users.find((u) => u.id === meeting.organizer);
  const attendees = meeting.attendees
    .map((id) => users.find((u) => u.id === id))
    .filter((u): u is User => Boolean(u));
  const tier = TIER_BADGE[meeting.tier];

  return (
    <Modal open onClose={onClose} title={meeting.title} wide>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            {formatDate(meeting.date)}, {formatTime(meeting.date)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {meeting.durationMins} mins
          </span>
          <span className="inline-flex items-center gap-1.5">
            {isZoom(meeting.location) ? (
              <Video className="h-4 w-4" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
            {meeting.location}
          </span>
          <Badge tone={tier.tone}>{tier.label}</Badge>
        </div>

        {/* AI meeting brief */}
        <div className="rounded-xl border border-accent/25 bg-accent-subtle/60 p-4">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
              AI meeting brief
            </span>
          </div>
          <ul className="mt-2 space-y-1.5">
            {brief.map((b) => (
              <li key={b} className="flex gap-2 text-xs leading-relaxed">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                {b}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Agenda
          </p>
          {meeting.agenda.length === 0 ? (
            <p className="text-sm text-muted">No agenda items yet.</p>
          ) : (
            <ol className="space-y-1.5">
              {meeting.agenda.map((item, i) => (
                <li key={item} className="flex items-start gap-2.5 text-sm">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface text-[10px] font-semibold text-muted">
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ol>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Attendees ({attendees.length})
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {attendees.map((u) => (
              <div key={u.id} className="flex items-center gap-2.5">
                <Avatar src={u.avatar} name={u.name} size={30} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {u.name}
                    {u.id === meeting.organizer && (
                      <span className="ml-1.5 text-[10px] font-semibold uppercase text-accent">
                        Organizer
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted">{u.title}</p>
                </div>
              </div>
            ))}
          </div>
          {organizer && !meeting.attendees.includes(organizer.id) && (
            <p className="mt-2.5 text-xs text-muted">
              Organised by <span className="font-medium text-foreground">{organizer.name}</span>{" "}
              ({organizer.title})
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
