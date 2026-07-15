# AbujaCar Operations Hub — Demo

All-in-one internal operations system for a car dealership in Abuja, Nigeria: inventory, expenses, equipment, business operations, meetings and planning — with role-based access and an AI assistant. Built as a **product demonstration**: no database, no real auth, no external APIs. All data is realistic seed data held in the browser (localStorage), so the demo works fully offline of any backend.

## Run it

```bash
npm install
npm run dev
```

Open the printed localhost URL and pick any demo account on the login page — no password. Use the role switcher in the top bar to flip between roles live.

## The 10-minute pitch

1. Sign in as **Tunde (Staff)** → submit a fuel expense.
2. Switch to **Chinedu (Manager)** → the approval badge appears → approve it live.
3. Open **Inventory** → the aging Camry shows an AI markdown suggestion.
4. Switch to **Ibrahim (CEO)** → full financial dashboard, planning with OKR progress.
5. Open the **AI assistant** → tap "Summarize this month's performance" — every number matches the dashboards because answers are computed from the live data.
6. Switch to **Alhaji Musa (Super Admin)** → User Management → the permission matrix: "you control who sees what."
7. Open it on a phone — it's fully responsive.

## What's real vs. simulated

- **Real:** RBAC (one matrix in `src/lib/permissions.ts` drives navigation, columns, buttons and route guards), all stats computed live from the data layer, expense approval flow, meeting scheduling, task board, CSV exports, dark mode, state persistence across refreshes ("Reset demo data" in Settings).
- **Simulated:** login (demo accounts), the AI (scripted intent matcher in `src/lib/assistant-engine.ts`, designed to be swapped for a real model call), vehicle photos (curated Unsplash images with branded fallbacks).

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · Zustand (+ localStorage persist) · Recharts · lucide-react

## Structure

```
src/
  app/(app)/        # authenticated shell + module pages
  components/       # ui primitives, layout, per-module components
  data/seed/        # realistic Nigerian seed data (₦, dates relative to today)
  lib/              # types, permissions matrix, stats, assistant engine
  store/            # zustand store — the demo's "database"
```

The production build adds real authentication, a database behind the existing repository-style data layer, and live AI integration.
