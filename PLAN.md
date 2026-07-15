# AbujaCar Demo — Product & Build Plan

**Product:** AbujaCar Operations Hub — an all-in-one internal admin & business operations system for a car dealership in Abuja, Nigeria.
**Deliverable:** A polished, clickable Next.js demo (no database, no real backend) used to showcase and sell the product.
**Status:** Planning — no code written yet.
**Date:** July 2026

---

## 1. Vision & Elevator Pitch

> "Run the entire dealership from one screen, from anywhere. Inventory, expenses, equipment, meetings, and business planning — with an AI assistant that watches the numbers and tells you what to do next. Every employee sees exactly what's relevant to their role; leadership sees everything."

The demo's job is **not** to be functional software. Its job is to make a dealership owner say *"I want this."* Every decision below optimizes for that: realistic Nigerian data, beautiful dashboards, visible role-based differences, and AI moments that feel magical.

### What makes the demo sell
1. **The role switcher** — watching the app transform live between "Sales Staff" and "CEO" views is the single most persuasive moment.
2. **AI recommendation cards** — "The Toyota Camry 2019 has sat in inventory 94 days; consider a 7% markdown" feels like the future.
3. **Real Nigerian context** — Naira everywhere, Abuja locations, cars Nigerians actually buy, Nigerian staff names. It should feel like *their* business, not a US template.

---

## 2. Users & Roles (RBAC)

Seven roles, grouped in three tiers. The demo ships with one pre-made account per role plus an in-app role switcher.

| Role | Tier | Sees | Can do (in demo, simulated) |
|---|---|---|---|
| **Super Admin** | Admin | Everything + system settings, audit log, user management | All actions, manage roles |
| **Admin** | Admin | Everything except system settings | All business actions |
| **CEO** | Executive | All dashboards, financials, planning, AI strategic insights | Approve budgets/plans, schedule exec meetings |
| **CMO** | Executive | Marketing spend, sales performance, inventory turnover, campaign planning | Manage campaigns, marketing expenses |
| **Manager** | Operations | Their department: team, inventory, expenses (submit/approve up to a limit), meetings | Approve staff expenses, assign tasks, schedule team meetings |
| **Operator** | Operations | Inventory & equipment day-to-day: check-in vehicles, log equipment status | Update vehicle status, log equipment maintenance |
| **Staff / Employee** | Operations | Own tasks, own expenses, own schedule, assigned vehicles | Submit expenses, view meetings, update assigned tasks |

### Demo accounts (seed data)
| Name | Role | Notes |
|---|---|---|
| Alhaji Musa Abubakar | Super Admin | The owner |
| Ngozi Okafor | Admin | Head of administration |
| Ibrahim Danladi | CEO | |
| Funke Adeyemi | CMO | |
| Chinedu Eze | Manager | Sales manager |
| Aisha Bello | Operator | Lot & logistics |
| Tunde Balogun | Staff | Sales executive |

### RBAC implementation (demo)
- A single `permissions.ts` matrix: `role → module → view | create | edit | approve | delete`.
- Navigation, page sections, table columns (e.g. profit margin hidden from Staff), and action buttons all read from the matrix.
- Route-level guard: visiting a forbidden page shows a branded "You don't have access" screen (this is itself a demo moment — proves the RBAC story).

---

## 3. Modules & Page-by-Page Spec

### 3.1 Login & Role Switcher
- Polished branded login page; clicking a demo account chip logs in instantly (no password needed, or any password accepted).
- Persistent role-switcher in the top bar (styled as a subtle "Demo mode" control) so the presenter can flip roles mid-pitch without logging out.

### 3.2 Dashboard (role-aware home)
Every role lands on a different dashboard composition:
- **CEO/Admin:** Revenue (month/quarter), profit margin, total inventory value, expense burn, top AI insights, cash-position sparkline, upcoming exec meetings.
- **CMO:** Marketing spend vs. sales, lead sources, fastest/slowest-selling models, campaign performance.
- **Manager:** Team performance, pending expense approvals (with badge count), department inventory, today's meetings.
- **Operator:** Vehicles pending inspection, equipment maintenance due, today's arrivals/deliveries.
- **Staff:** My tasks, my expense claims status, my schedule, my assigned vehicles.

KPI stat tiles + 2–3 charts + an activity feed. This page carries the most visual weight — invest design time here.

### 3.3 Inventory (Vehicles)
- Vehicle grid/table: photo, make/model/year, VIN, trim, mileage, condition (Nigerian used / foreign used "tokunbo" / brand new), purchase price, listing price, margin, days in stock, status (Available / Reserved / Sold / In Repair / In Transit).
- Filters: make, status, price range, days-in-stock.
- Vehicle detail page: photo gallery, full spec sheet, cost breakdown (purchase + clearing/customs + repairs), status timeline, assigned salesperson, AI pricing suggestion card.
- Actions (simulated): add vehicle, change status, mark sold (triggers a nice confetti/success moment — memorable in a pitch).
- Summary bar: total units, total inventory value (₦), average days-in-stock, units sold this month.

### 3.4 Expenses
- Expense table: date, category (Fuel & Generator, Vehicle Repairs, Customs & Clearing, Salaries, Rent, Marketing, Utilities, Logistics), amount (₦), submitted by, status (Pending / Approved / Rejected), receipt thumbnail.
- Submit-expense form (Staff) → appears in Manager's approval queue → approve/reject updates it live (in-memory). **This end-to-end flow across two roles is a scripted demo moment.**
- Monthly breakdown chart by category; budget-vs-actual bars; AI anomaly card ("Generator fuel spend is up 41% vs 3-month average").

### 3.5 Equipment & Assets
- Registry: generators, car lifts, diagnostic scanners, air compressors, towing truck, office equipment, CCTV.
- Each asset: purchase date, cost, condition, assigned location, maintenance schedule, next-service-due date.
- Maintenance log + "due soon" alerts that also surface on the Operator dashboard.

### 3.6 Business Operations
- **Tasks board** (kanban: To Do / In Progress / Done) — assignable, department-tagged.
- **Departments overview**: Sales, Logistics, Workshop, Admin, Marketing — headcount, active tasks, monthly spend.
- **Activity/audit feed**: who did what, when (also proves accountability to the buyer).

### 3.7 Meetings & Schedule
- Calendar (month/week views) + upcoming-meetings list.
- Meeting detail: agenda, attendees (role-filtered — Staff only see meetings they're invited to), location (showroom / Zoom), AI "meeting brief" card that summarizes relevant numbers for the agenda.
- Schedule-a-meeting form with attendee picker.

### 3.8 Business Planning
- **Goals/OKRs:** quarterly targets (e.g. "Sell 45 units in Q3 2026") with progress bars fed by mock sales data.
- **Budget planner:** allocate monthly budget by category, compare vs. actuals.
- **AI strategy card:** "Based on 6-month trends, SUVs (RAV4, Highlander) turn over 2.3× faster than sedans — consider shifting 20% of purchasing budget."
- Visible to Executive/Admin tiers only.

### 3.9 Reports & Analytics
- Pre-built report views: Sales performance, Inventory aging, Expense summary, Staff performance.
- Date-range picker, export button (generates a real CSV client-side — cheap to build, feels complete).

### 3.10 User Management (Admin/Super Admin only)
- User table with roles, status, last active; add/edit user modal; role assignment.
- Super Admin additionally sees: system settings, audit log, permission matrix viewer (a page that *displays* the RBAC table — surprisingly persuasive to buyers).

### 3.11 AI Assistant & Recommendations (scripted/mock)
Two surfaces, both fully scripted — no API calls:

**A. Recommendation cards** (embedded per-module, role-aware)
- Inventory: aging-stock markdown suggestions, restock recommendations ("Corollas sell in 12 days avg — you have 1 left").
- Expenses: anomaly detection, cost-saving suggestions.
- Planning: strategic insights for executives.
- Each card: insight text, supporting mini-stat, and Accept / Dismiss buttons (accepting shows a success toast).

**B. Chat assistant** (floating button, slide-over panel)
- Scripted intent matcher: keyword-match the user's message to ~15 pre-written Q&A pairs, with typing animation and streaming-style reveal.
- Covered intents: "how many cars are available?", "what did we spend on fuel this month?", "which car has been in stock the longest?", "schedule a meeting with the sales team", "summarize this month's performance", navigation requests ("take me to expenses" — actually navigates).
- Suggested-question chips so the presenter (or client) taps a chip instead of free-typing — this keeps the live demo on the happy path.
- Fallback response: "In the full version, I can answer anything about your business data. In this demo, try one of the suggested questions."
- Answers are computed from the actual mock data at render time (not hardcoded strings), so numbers always match what's on screen. **This matters: if the dashboard says 34 cars, the AI must say 34.**
- Architecture note: the assistant sits behind an `AssistantProvider` interface, so swapping the scripted engine for the real Claude API later is a one-file change.

---

## 4. Mock Data Design

No database. A `src/data/` layer of typed seed data + Zustand store for runtime mutations (approve expense, mark sold, etc.). Mutations persist to `localStorage` so the demo survives a refresh mid-pitch, with a "Reset demo data" button in settings.

**Realism requirements:**
- **Currency:** Naira everywhere, formatted `₦12,500,000` (Intl.NumberFormat, `en-NG`).
- **Vehicles (~35–40 units):** Toyota Corolla, Camry, Hilux, RAV4, Highlander, Land Cruiser; Honda Accord, CR-V; Lexus RX350, ES350; Mercedes GLE, C300; Hyundai Elantra; Kia Sportage; Ford Ranger. Mix of "Tokunbo" (foreign used), Nigerian used, and brand new. Realistic Nigerian prices (e.g. Tokunbo Camry 2018 ≈ ₦14–18M, Land Cruiser 2021 ≈ ₦120M+).
- **Vehicle photos:** sourced online — direct Unsplash/Pexels image URLs per vehicle (hand-picked so each photo actually matches the make/model/color in the seed data, not random cars), served through `next/image` with the hosts allowed in `next.config.js` `images.remotePatterns`. Same approach for staff avatars (e.g. pravatar/Unsplash portraits) and any equipment photos. Every image gets a styled fallback (brand-colored placeholder with the model name) so a dead URL or slow connection never shows a broken image during a pitch. Note: this makes the demo internet-dependent — fine for a hosted Vercel demo, just don't pitch from a dead zone.
- **Expenses:** ~6 months of history so charts have shape; include recognizably Nigerian line items (generator diesel, customs clearing at Tin Can/Apapa, VIO/vehicle papers).
- **People:** Nigerian names across regions (already listed in §2).
- **Dates:** seeded relative to "today" so the demo never looks stale.

All data flows through a repository interface (`getVehicles()`, `getExpenses()`...) so a real API/DB can replace the mock layer later without touching UI code.

---

## 5. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router) + TypeScript** | Requested; deployable to Vercel in minutes |
| Styling | **Tailwind CSS + shadcn/ui** | Fast, polished, consistent; dark mode nearly free |
| Charts | **Recharts** | Clean defaults, plays well with Tailwind theming |
| State | **Zustand** (+ localStorage persist) | Simple runtime store for demo mutations |
| Auth | **Mock session in a context/cookie** | Role switcher; no auth library needed |
| Icons | **lucide-react** | shadcn default |
| Calendar | Lightweight custom month/week grid | Avoids heavy calendar deps for a demo |
| Deployment | **Vercel** | Client can open it on their phone — "accessible from anywhere" proven literally |

Explicitly **not** in the demo: database, real auth, file uploads, emails/notifications backend, payments, real AI API.

---

## 6. Architecture & Folder Structure

```
src/
  app/
    (auth)/login/
    (app)/                     # authenticated shell: sidebar + topbar
      dashboard/
      inventory/  [id]/
      expenses/
      equipment/
      operations/
      meetings/
      planning/
      reports/
      users/
      settings/
  components/
    ui/                        # shadcn primitives
    layout/                    # sidebar, topbar, role-switcher
    dashboard/  inventory/ ... # module components
    assistant/                 # chat panel, recommendation cards
  data/
    seed/                      # vehicles.ts, expenses.ts, users.ts, ...
    repository.ts              # typed access layer (future DB swap point)
  lib/
    permissions.ts             # RBAC matrix — single source of truth
    assistant-engine.ts        # scripted intent matcher
    format.ts                  # ₦ and date formatting
  store/                       # zustand slices
```

### Design direction & color scheme

Modern SaaS admin (Linear/Vercel-dashboard energy), generous whitespace, dark mode toggle, fully responsive (the "access from anywhere" pitch demands it looks great on a phone).

**Palette — black, white, blue:**

| Token | Light mode | Dark mode | Used for |
|---|---|---|---|
| Background | `#FFFFFF` | `#0A0A0B` (near-black) | Page background |
| Surface | `#F8FAFC` | `#131316` | Cards, sidebar |
| Text primary | `#0A0A0B` | `#FAFAFA` | Headings, body |
| Text muted | `#64748B` | `#94A3B8` | Labels, secondary text |
| **Accent** | `#2563EB` (blue-600) | `#3B82F6` (blue-500) | Primary buttons, active nav, links, chart primary series, focus rings |
| Accent subtle | `#EFF6FF` | `#1E3A8A/20` | Selected states, info banners, AI card backgrounds |
| Border | `#E2E8F0` | `#27272A` | Dividers, card borders |

Semantic colors stay conventional (green = approved/sold, amber = pending/aging, red = rejected/overdue) but desaturated to sit quietly inside the monochrome+blue system. Charts: blue as the hero series, grays for comparison series — never a rainbow. The sidebar is the "black" statement piece: near-black in both modes with white text and a blue active indicator, which gives the app its signature look and makes the role switcher pop.

---

## 7. Build Plan (Phased)

| Phase | Scope | Est. effort |
|---|---|---|
| **1. Foundation** | Project setup, design tokens, app shell (sidebar/topbar), login + role switcher, RBAC matrix + guards, seed data + repository layer | 2–3 days |
| **2. Core modules** | Dashboards (all roles), Inventory list/detail, Expenses + approval flow | 3–4 days |
| **3. Supporting modules** | Equipment, Operations/tasks, Meetings, Planning, Reports, User management | 3–4 days |
| **4. AI layer** | Recommendation cards (data-computed), chat assistant with intent matcher + suggested chips | 2 days |
| **5. Polish & deploy** | Responsive pass, dark mode, empty/error states, demo-reset button, seed-data realism pass, Vercel deploy, demo script rehearsal | 1–2 days |

**Total: roughly 11–15 working days (~2.5–3 weeks)** for a genuinely polished demo.

### Suggested 10-minute demo script (build toward this)
1. Login page → enter as **Staff** (Tunde): submit a fuel expense.
2. Switch to **Manager** (Chinedu): approval badge appeared → approve it live.
3. Manager's inventory → open a Camry → AI markdown suggestion on aging stock.
4. Switch to **CEO**: full financial dashboard, business planning with OKR progress, AI strategy card.
5. Open the AI assistant → tap "Summarize this month's performance."
6. Switch to **Super Admin**: user management + permission matrix — "you control who sees what."
7. Pull it up on a phone: "and this is on your phone, from anywhere."

---

## 8. Pricing the Demo

Assumptions: Nigerian market, solo developer/small studio, ~2.5–3 weeks of skilled full-stack work, USD figures at roughly ₦1,500/$ (verify the current rate before quoting).

### What comparable work costs
A bespoke, multi-role, 10-module admin demo of this polish is realistically **₦1.5M–₦3.5M ($1,000–$2,300)** in the Nigerian market from a competent independent builder; a Lagos/Abuja agency would quote **₦4M–₦8M+** for the same thing. Below ₦1M you're signaling "template," which undermines the premium positioning of the product itself.

### Three ways to structure it (recommendation: Option B)

**A. Straight fixed fee — ₦2.5M ($1,650)**
Clean, simple. Demo is theirs regardless of what happens next.

**B. Credited deposit — ₦2M, fully credited against the full build (recommended)**
"The demo costs ₦2M. If you commission the full system, that ₦2M comes off the price." This filters out non-serious clients, gets you paid for the demo work, and psychologically commits the client to the bigger project. Quote the full production system (database, real auth, real AI, deployment, training) at **₦12M–₦20M ($8k–$13k)** so the credit feels meaningful, and mention a support retainer of **₦300k–₦500k/month** exists — it anchors the demo price as small.

**C. Risk-sharing — ₦1M for the demo + premium full-build price**
Only if the client relationship is new and budget-sensitive: lower demo fee, but the full build is quoted at the top of the range.

### Terms to insist on
- 50% upfront, 50% on delivery — non-negotiable for demo work.
- Demo is delivered as a hosted link + walkthrough; **source code transfers only with the full-build contract** (protects your leverage).
- Scope-lock: the module list in §3 is the contract. New modules during the demo phase are change requests.
- 2 rounds of revision included; further rounds billed.

---

## 9. Risks & Open Items

- **Exchange-rate drift:** re-check ₦/$ before quoting; quote in ₦ with a validity window (e.g. "valid 14 days").
- **Scope creep:** the all-in-one pitch invites "can it also do payroll/CRM/WhatsApp?" — answer is always "in the full build," and it goes on the upsell list.
- **Data realism:** budget real time for the seed-data pass; unrealistic numbers are the fastest way to lose a dealership owner who knows their margins cold.
- **Naming:** confirm the client's actual brand name/spelling ("AbujaCar"?) and logo availability before the polish phase.
- **Later decision (not needed now):** which AI provider/model for the full build, hosting choice for production, and whether the full build is single-tenant or a multi-dealership SaaS (the SaaS angle dramatically changes what you could eventually charge).
