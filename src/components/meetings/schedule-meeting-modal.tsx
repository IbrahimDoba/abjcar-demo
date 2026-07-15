"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import type { Meeting, User } from "@/lib/types";
import { useAppStore } from "@/store/app-store";
import {
  Avatar,
  Button,
  Field,
  Input,
  Modal,
  Select,
  Textarea,
  useToast,
} from "@/components/ui/primitives";

const DURATIONS = [30, 45, 60, 90, 120];

export function ScheduleMeetingModal({
  open,
  onClose,
  organizer,
}: {
  open: boolean;
  onClose: () => void;
  organizer: User;
}) {
  const users = useAppStore((s) => s.users);
  const addMeeting = useAppStore((s) => s.addMeeting);
  const { toast } = useToast();

  const [title, setTitle] = React.useState("");
  const [date, setDate] = React.useState("");
  const [time, setTime] = React.useState("09:00");
  const [duration, setDuration] = React.useState("60");
  const [location, setLocation] = React.useState("");
  const [tier, setTier] = React.useState<Meeting["tier"]>("all");
  const [agendaText, setAgendaText] = React.useState("");
  const [attendees, setAttendees] = React.useState<string[]>([]);

  function toggleAttendee(id: string) {
    setAttendees((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function reset() {
    setTitle("");
    setDate("");
    setTime("09:00");
    setDuration("60");
    setLocation("");
    setTier("all");
    setAgendaText("");
    setAttendees([]);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date || !time) return;
    addMeeting({
      title: title.trim(),
      date: new Date(`${date}T${time}`).toISOString(),
      durationMins: Number(duration),
      location: location.trim() || "Showroom A — meeting room",
      tier,
      agenda: agendaText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      attendees,
      organizer: organizer.id,
    });
    toast("Meeting scheduled");
    reset();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Schedule meeting" wide>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Title">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Weekly stock review"
            required
          />
        </Field>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Date">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </Field>
          <Field label="Time">
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </Field>
          <Field label="Duration">
            <Select value={duration} onChange={(e) => setDuration(e.target.value)}>
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {d} mins
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Location">
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Zoom, Showroom A…"
            />
          </Field>
          <Field label="Visibility tier">
            <Select
              value={tier}
              onChange={(e) => setTier(e.target.value as Meeting["tier"])}
            >
              <option value="all">All hands — everyone can see</option>
              <option value="management">Management &amp; above</option>
              <option value="exec">Executive only</option>
            </Select>
          </Field>
        </div>

        <Field label="Agenda (one item per line)">
          <Textarea
            rows={3}
            value={agendaText}
            onChange={(e) => setAgendaText(e.target.value)}
            placeholder={"Review pending reservations\nAgree pricing on aging stock"}
          />
        </Field>

        <div>
          <span className="mb-1.5 block text-xs font-medium text-muted">
            Attendees
            {attendees.length > 0 && (
              <span className="ml-1 text-accent">· {attendees.length} selected</span>
            )}
          </span>
          <div className="flex flex-wrap gap-2">
            {users.map((u) => {
              const selected = attendees.includes(u.id);
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggleAttendee(u.id)}
                  className={cn(
                    "flex cursor-pointer items-center gap-1.5 rounded-full border py-1 pl-1 pr-2.5 text-xs font-medium transition-colors",
                    selected
                      ? "border-accent/40 bg-accent-subtle text-accent"
                      : "bg-raised text-muted hover:text-foreground"
                  )}
                >
                  <Avatar src={u.avatar} name={u.name} size={20} />
                  {u.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!title.trim() || !date || !time}>
            Schedule meeting
          </Button>
        </div>
      </form>
    </Modal>
  );
}
