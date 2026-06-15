# CarbonPulse 🟢💨

A smart, personalized carbon assistant designed to help individuals estimate their footprint, track daily actions, and get small, realistic recommendations to reduce emissions. Built using **Next.js (App Router)** and **Tailwind CSS**, powered by **Bun**.

---

## 🎯 Chosen Vertical
**Climate Tech & Sustainability Coaching / Carbon Footprint Reduction.**

---

## 📝 Problem Statement
Most individuals want to reduce their environmental impact but face two major obstacles:
1. **Tool Overload:** Existing carbon footprint calculators demand hours of utility bill lookup, forcing immediate user drop-off.
2. **Generic Recommendations:** Tips like "install home solar panels" are useless for a budget-sensitive student renting an apartment.

**CarbonPulse** acts as a supportive coach, not a data audit sheet. By combining a 1-minute qualitative onboarding questionnaire, visual splits, easy activity presets, and a rule-based coaching engine, we make carbon consciousness low friction and actionable.

---

## 🤖 How the Smart Assistant Works
CarbonPulse represents a **dynamic carbon coach**. It does not merely track logs; it actively guides the user:
- **What Changed This Week:** Compares the last 7 days of tracked emissions against the previous week's logs (days 8-14), providing a percentage shift, direction, and detailed behavioral explanations of what drove the changes.
- **Next Best Action:** Pinpoints the single, highest-priority habit modification that the user has not yet adopted.
- **Micro-Dose Recommendations:** Instead of cluttering the UI, it bubbles up specific actions personalized to the user's circumstances.

---

## ⚙️ Personalization Logic (Heuristics scoring)
Tips are scored and dynamically prioritized using a multi-criteria decision heuristic:

$$\text{Recommendation Score} = (\text{HighestCategoryMatch} \times 4.0) + (\text{BudgetCompatibility} \times 3.0) + (\text{GoalMatch} \times 3.0) + (\text{Ease} \times 0.1) + (\text{Impact} \times 0.1)$$

- **Category Match:** If a user's biggest emissions category is `FOOD`, food tips get an additional $+4.0$ score.
- **Budget Fit:** If budget sensitivity is `HIGH`, high-investment tips (e.g. smart thermostat) are penalized, while cost-saving options (e.g. cold wash) are boosted.
- **Goal Match:** Boosts tips matching user goals (saving money, maximizing carbon reduction, building habits).
- **Explanation Context:** Every card displays a custom natural language rationale explaining *exactly* why it matches the user's goals (e.g. "Since your goal is to Save Money and you commute with a Petrol Car...").

---

## 📈 Carbon Calculation Assumptions
Assumptions are based on IPCC and EPA carbon factors:
- **Commuting:** Petrol cars produce $0.27\text{ kg CO2e / km}$, diesel cars $0.25\text{ kg}$, EV $0.05\text{ kg}$, bus $0.08\text{ kg}$, and train $0.04\text{ kg}$ per passenger-km.
- **Diet:** High-meat diets emit $7.26\text{ kg CO2e / day}$, low-meat $4.67\text{ kg}$, vegetarian $3.81\text{ kg}$, vegan $2.89\text{ kg}$ (split across 3 meals per day).
- **Home Energy:** Electricity is rated at $0.38\text{ kg/kWh}$, natural gas at $0.18\text{ kg/kWh}$ (split among household size).
- **Shopping:** Consumer items are estimated at $80\text{ kg}$ per electronic gadget, $15\text{ kg}$ per clothing item, and $5\text{ kg}$ per misc purchase.

---

## 🏢 Architecture & Folder Structure
We adhere to a strict **Domain-Driven Feature-based** architecture for maximum separation of concerns, testability, and structure:

```
src/
├── app/                  # Next.js App Router layout, pages, and server auth actions
├── components/           # Shared reusable visual elements (e.g., SkipLink)
├── features/             # Domain modules holding localized UI components
│   ├── onboarding/       # Questionnaire wizard steps (Personal, Transit, Diet, Energy, Goals)
│   ├── tracking/         # Logger presets, manual entries, history lists
│   ├── recommendations/  # Next best action cards, explanation text, attribute filters
│   └── dashboard/        # Summary cards, charts, goal checklists
├── lib/                  # Pure utility function libraries
│   ├── carbon/           # Math calculators and coefficients (emissionFactors)
│   ├── recommendations/  # Heuristic scoring arrays and weekly insights trends
│   └── validation/       # Zod schemas for sanitizing form inputs
├── types/                # Centralized Type declarations (user, activity, recommendation)
├── utils/                # Server utility actions (DB filesystem access, Session crypto)
└── tests/                # Comprehensive Vitest suite (calculations, validation, trends)
```

---

## 🔒 Security Practices
- **No Committed Secrets:** Environment configuration uses `.env.example` only. Fallback tokens are secure placeholder values.
- **Zod Schema Input Sanitization:** All forms, logs, and factor overrides are validated against Zod schemas on both the client-side and server-side to protect against malicious payloads.
- **Secure Sessions:** Cookie session signatures are signed using HMAC-SHA256 with constant-time cryptographic verification (`crypto.timingSafeEqual`) to mitigate timing attacks.
- **CSP Headers:** Implemented Strict Content-Security-Policy headers in `next.config.ts` (`default-src 'self'`), standard frame-guards (`X-Frame-Options: DENY`), and XSS protection headers.

---

## 🧪 Testing Strategy
All unit and integration tests are powered by **Vitest** for fast execution:
- **Footprint Calculations:** Validates baseline splits and single travel/diet log emissions math.
- **Recommendation Scoring:** Checks heuristic prioritizations, filters, and commuter exemptions.
- **Weekly Trend Insights:** Tests percentage shifts, direction computations, and dynamic explanation generation.
- **Form Schemas:** Validates that Zod flags negative inputs, empty names, or zero values.

Run tests:
```bash
bun test
```

---

## ♿ Accessibility (a11y) Features
- **Keyboard Navigation:** All interactive elements, tabs, forms, and buttons are fully traversable with `Tab` and activated via `Space`/`Enter` keys, with visible outline focus rings (`focus:ring-2 focus:ring-emerald-500`).
- **Skip Link:** A standard keyboard skip bypass link (`#main-content`) is rendered at the top of the body layout.
- **Semantic HTML:** Outlined layout structure using HTML5 semantic elements (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`).
- **Chart Screen Reader Tables:** Recharts components are paired with underlying, accessible `sr-only` HTML tabular matrices duplicate holding identical data.
- **Labels:** Every input has a unique explicitly bound `<label>` element.

---

## ⚡ Efficiency Decisions
- **Rule-Based Heuristic engine:** Avoids expensive LLM tokens, latency overheads, or cold start delays by utilizing local mathematical weighting.
- **In-Memory Cache:** Implements a cache on the JSON read operation to avoid redundant CPU/filesystem overheads.
- **Server Actions:** Reduces bundle size by executing calculations and database serialization server-side.

---

## 🔮 Limitations & Future Scope
- **Current Limitations:** The JSON DB files are local; multiple concurrent users write to the same `data/db.json` file.
- **Future Scope:** Integrating the Prisma ORM layer with PostgreSQL when moving to multi-tenant cloud architectures, and pulling real-time grid coefficient telemetry from local utility smart meters.
