"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Send, Sparkles, X } from "lucide-react";
import {
  answerQuery,
  SUGGESTED_QUESTIONS,
  type AssistantReply,
} from "@/lib/assistant-engine";
import { useAppStore, useCurrentUser } from "@/store/app-store";

interface Message {
  id: number;
  from: "user" | "assistant";
  text: string;
  href?: string;
  hrefLabel?: string;
  /** streaming reveal progress 0..text.length */
  revealed?: number;
}

let msgId = 0;

export function AssistantWidget() {
  const router = useRouter();
  const me = useCurrentUser();
  const users = useAppStore((s) => s.users);
  const vehicles = useAppStore((s) => s.vehicles);
  const expenses = useAppStore((s) => s.expenses);
  const equipment = useAppStore((s) => s.equipment);
  const meetings = useAppStore((s) => s.meetings);
  const tasks = useAppStore((s) => s.tasks);

  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [thinking, setThinking] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const scrollToBottom = React.useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    });
  }, []);

  const streamIn = React.useCallback(
    (reply: AssistantReply) => {
      const id = ++msgId;
      setMessages((prev) => [
        ...prev,
        { id, from: "assistant", ...reply, revealed: 0 },
      ]);
      const total = reply.text.length;
      const step = Math.max(2, Math.round(total / 45));
      const timer = setInterval(() => {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== id) return m;
            const next = Math.min(total, (m.revealed ?? 0) + step);
            return { ...m, revealed: next };
          })
        );
        scrollToBottom();
      }, 24);
      setTimeout(() => clearInterval(timer), (total / step) * 24 + 400);
    },
    [scrollToBottom]
  );

  const ask = React.useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text || !me || thinking) return;
      setMessages((prev) => [...prev, { id: ++msgId, from: "user", text }]);
      setInput("");
      setThinking(true);
      scrollToBottom();
      const reply = answerQuery(text, {
        me,
        users,
        vehicles,
        expenses,
        equipment,
        meetings,
        tasks,
      });
      // A believable beat before the answer starts streaming.
      setTimeout(() => {
        setThinking(false);
        streamIn(reply);
      }, 650 + Math.random() * 500);
    },
    [me, users, vehicles, expenses, equipment, meetings, tasks, thinking, streamIn, scrollToBottom]
  );

  if (!me) return null;

  return (
    <>
      {/* Floating launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex cursor-pointer items-center gap-2 rounded-full bg-accent py-3 pl-4 pr-5 text-sm font-semibold text-white shadow-lg shadow-accent/30 transition-transform hover:scale-105"
        >
          <Sparkles className="h-4.5 w-4.5" />
          Ask AbujaCar AI
        </button>
      )}

      {/* Slide-over panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-xs lg:bg-transparent lg:backdrop-blur-none">
          <div
            className="absolute inset-0 lg:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="animate-fade-up relative flex h-full w-full max-w-md flex-col border-l bg-raised shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b bg-sidebar px-4 py-3.5 text-sidebar-foreground">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
                  <Sparkles className="h-4 w-4 text-white" />
                </span>
                <div>
                  <p className="text-sm font-semibold">AbujaCar AI Assistant</p>
                  <p className="flex items-center gap-1.5 text-[11px] text-sidebar-muted">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" />
                    Watching your live business data
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="cursor-pointer rounded-md p-1.5 text-sidebar-muted hover:text-sidebar-foreground"
                aria-label="Close assistant"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.length === 0 && (
                <div className="rounded-xl border border-accent/20 bg-accent-subtle/60 p-4">
                  <p className="text-sm font-medium">
                    Hi {me.name.split(" ")[0]} 👋
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">
                    I&apos;m your operations copilot. Ask me about inventory,
                    expenses, meetings or performance — every answer comes from
                    your live data. I can also take you anywhere in the app.
                  </p>
                </div>
              )}

              {messages.map((m) =>
                m.from === "user" ? (
                  <div key={m.id} className="flex justify-end">
                    <p className="max-w-[85%] rounded-2xl rounded-br-md bg-accent px-3.5 py-2 text-sm text-white">
                      {m.text}
                    </p>
                  </div>
                ) : (
                  <div key={m.id} className="flex gap-2">
                    <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-accent-subtle">
                      <Sparkles className="h-3 w-3 text-accent" />
                    </span>
                    <div className="max-w-[85%]">
                      <p className="whitespace-pre-line rounded-2xl rounded-tl-md border bg-surface px-3.5 py-2 text-sm leading-relaxed">
                        {m.text.slice(0, m.revealed ?? m.text.length)}
                        {(m.revealed ?? m.text.length) < m.text.length && (
                          <span className="animate-pulse-dot ml-0.5 inline-block h-3.5 w-0.5 translate-y-0.5 bg-accent" />
                        )}
                      </p>
                      {m.href &&
                        (m.revealed ?? m.text.length) >= m.text.length && (
                          <button
                            onClick={() => {
                              setOpen(false);
                              router.push(m.href!);
                            }}
                            className="mt-1.5 inline-flex cursor-pointer items-center gap-1 rounded-lg bg-accent-subtle px-2.5 py-1.5 text-xs font-semibold text-accent hover:bg-accent hover:text-white"
                          >
                            {m.hrefLabel ?? "Open"}{" "}
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        )}
                    </div>
                  </div>
                )
              )}

              {thinking && (
                <div className="flex items-center gap-2 pl-8 text-xs text-muted">
                  <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-accent" />
                  <span
                    className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-accent"
                    style={{ animationDelay: "0.2s" }}
                  />
                  <span
                    className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-accent"
                    style={{ animationDelay: "0.4s" }}
                  />
                  thinking…
                </div>
              )}
            </div>

            {/* Suggestion chips */}
            <div className="border-t px-4 pt-3">
              <div className="flex flex-wrap gap-1.5 pb-3">
                {SUGGESTED_QUESTIONS.slice(0, 4).map((s) => (
                  <button
                    key={s}
                    onClick={() => ask(s)}
                    className="cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium text-muted transition-colors hover:border-accent/50 hover:text-accent"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                ask(input);
              }}
              className="flex items-center gap-2 border-t p-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your business…"
                className="h-10 flex-1 rounded-lg border bg-surface px-3 text-sm placeholder:text-muted/70 focus:outline-2 focus:outline-offset-1 focus:outline-accent"
              />
              <button
                type="submit"
                disabled={!input.trim() || thinking}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg bg-accent text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
