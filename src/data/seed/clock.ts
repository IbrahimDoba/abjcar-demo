/**
 * All seed dates are computed relative to "today" so the demo never looks
 * stale. Anchored to local midnight so every import in one session agrees.
 */
const ANCHOR = new Date();
ANCHOR.setHours(0, 0, 0, 0);

export function daysAgoISO(days: number, hour = 10, minute = 0): string {
  const d = new Date(ANCHOR);
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function daysAheadISO(days: number, hour = 10, minute = 0): string {
  return daysAgoISO(-days, hour, minute);
}

/** Label like "Feb 2026" for the month `n` months before the current one. */
export function monthLabel(monthsAgo: number): string {
  const d = new Date(ANCHOR);
  d.setDate(1);
  d.setMonth(d.getMonth() - monthsAgo);
  return d.toLocaleDateString("en-NG", { month: "short", year: "numeric" });
}

/** ISO date for day `day` of the month `n` months before the current one. */
export function monthDayISO(monthsAgo: number, day: number): string {
  const d = new Date(ANCHOR);
  d.setDate(1);
  d.setMonth(d.getMonth() - monthsAgo);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  d.setHours(11, 0, 0, 0);
  return d.toISOString();
}

/** Current quarter label, e.g. "Q3 2026". */
export function currentQuarter(): string {
  const q = Math.floor(ANCHOR.getMonth() / 3) + 1;
  return `Q${q} ${ANCHOR.getFullYear()}`;
}

/** Deterministic PRNG so seeded "randomness" is stable within a session. */
export function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
