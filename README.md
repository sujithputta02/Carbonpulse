# CarbonPulse 🟢💨

A smart, personalized carbon assistant designed to help individuals estimate their footprint, track daily actions, and get small, realistic recommendations to reduce emissions. Built using **Next.js (App Router)** and **Tailwind CSS**, powered by **Bun**.

---

## Why CarbonPulse?

Most individuals want to reduce their environmental impact but face two major obstacles:
1. **Tool Overload:** Existing carbon footprint calculators demand hours of utility bill lookup, forcing immediate user drop-off.
2. **Generic Recommendations:** Tips like "install home solar panels" are useless for a budget-sensitive student renting an apartment.

**CarbonPulse** acts as a supportive coach, not a data audit sheet. By combining a 1-minute qualitative onboarding questionnaire, visual splits, easy activity presets, and a rule-based coaching engine, we make carbon consciousness low friction and actionable.

---

## Features & Core Workflows

1. **Interactive Hero Check:** Visitors can play with sliders and toggle selections directly on the landing page to preview their estimated monthly footprint.
2. **Multi-step Onboarding:** Wizard mapping name, household split, budget constraints, commute patterns, food preferences, and personal goals. Form state is auto-saved locally so progress isn't lost.
3. **Dynamic Dashboard:** Custom visual feedback cards, interactive category charts (Recharts donut split), weekly carbon trend bars, active goal tracking, and logging history feeds.
4. **Natural-Language Coach:** An embedded assistant widget displaying the single best recommendation, explicitly explaining *why* it fits the user's budget, goals, and highest emission sources.
5. **One-Click Quick Presets:** Log common actions in under 5 seconds (e.g. "Veggie Day", "Commute via Train") or log custom quantities.
6. **Operations Panel:** An admin portal (`/admin/factors`) allowing administrators to update carbon coefficients dynamically and audit previous values.

---

## Tech Stack & Architecture

- **Framework:** Next.js 16 (App Router, Server Components + Actions)
- **Runtime & Manager:** Bun (1.3.14)
- **Styling:** Tailwind CSS (v4) with Custom Glassmorphism Panels and Glowing Dark Modes
- **Visualization:** Recharts (SVG Responsive Charts)
- **Validation:** Zod Schema Validation
- **Database:** Local JSON File Storage (`data/db.json`)
  - *Why JSON?* Lightweight, 100% portable, zero compilation/C++ binding issues (unlike node-sqlite or better-sqlite3 across M-series ARM and Linux architectures), and delivers sub-millisecond response times.
- **Testing:** Vitest

---

## Setup & Local Run Instructions

Ensure [Bun](https://bun.sh/) is installed.

### 1. Install Dependencies
```bash
bun install
```

### 2. Run the Development Server
```bash
bun dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Run the Test Suite
```bash
bun test
# or
npx vitest run
```

---

## Information Architecture

```
├── app/
│   ├── layout.tsx         # Immersive navigation header & footer
│   ├── page.tsx           # Interactive Landing page & hero estimator
│   ├── actions.ts         # Server Actions for DB mutations
│   ├── onboarding/
│   │   └── page.tsx       # 5-step onboarding wizard (Draft auto-save)
│   ├── dashboard/
│   │   ├── page.tsx       # Server component data loader
│   │   └── DashboardClient.tsx # Charts, coach alerts, goal updates
│   ├── track/
│   │   └── page.tsx       # Presets & manual entry logs
│   ├── history/
│   │   ├── page.tsx       # Server component log loader
│   │   └── HistoryClient.tsx   # Tabular activity list & deletion triggers
│   ├── admin/factors/
│   │   ├── page.tsx       # Server component factors loader
│   │   └── FactorsClient.tsx   # Admin coefficient overrides & audit logs
│   ├── about/
│   │   └── page.tsx       # Scientific citation & formulas
│   ├── privacy/
│   │   └── page.tsx       # Local-data privacy statements
│   └── globals.css        # Theme variables, glassmorphism filters, animations
```

---

## Heuristics Recommendation Logic

Tips are scored and dynamically prioritized using a multi-criteria decision heuristic:

$$\text{Recommendation Score} = (\text{HighestCategoryMatch} \times 4.0) + (\text{BudgetCompatibility} \times 3.0) + (\text{GoalMatch} \times 3.0) + (\text{Ease} \times 0.1) + (\text{Impact} \times 0.1)$$

- **Category Match:** If a user's biggest emissions category is `FOOD`, food tips get an additional $+4.0$ score.
- **Budget Fit:** If budget sensitivity is `HIGH`, high-investment tips (e.g. smart thermostat) are penalized, while cost-saving options (e.g. cold wash) are boosted.
- **Goal Match:** Boosts tips matching user goals (saving money, maximizing carbon reduction, building habits).

---

## Accessibility & Security Compliance

### Accessibility (a11y)
- **Keyboard Navigation:** Forms, inputs, checkboxes, and tabs are fully traversable with `Tab` and activated via `Space`/`Enter` keys.
- **Contrast Ratios:** Contrast exceeds WCAG 2.1 AA limits (min 4.5:1 for body and controls).
- **Chart Fallbacks:** To support screen readers, Recharts are paired with semantic `sr-only` HTML tables holding duplicate coordinates data.

### Security
- **Isolated Secrets:** Critical API keys (`GOOGLE_AI_API_KEY`, `GOOGLE_MAPS_API_KEY` or `LLM_API_KEY`) are kept server-side in Server Actions.
- **Local Fallbacks:** In case external AI APIs are missing, the coach falls back on localized rule-based heuristics without rendering a broken page.
