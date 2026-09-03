# FairFill — Equitable CSR Allocation & Impact Reallocation Engine

> **Fund where impact is high. Protect where need is highest.**

FairFill is a decision-support prototype for allocating India's mandatory 2% CSR spend (Companies Act, Section 135 / Schedule VII) across regions and projects. It combines structural geographical fairness, evidence-based underservice measurement, equity-adjusted impact optimization, NGO delivery reliability, and time-compressed project monitoring — with every decision fully explainable and every fund movement requiring explicit human approval.

FairFill does **not** autonomously transfer money. It proposes. A human approves.

---

## 1. Project overview

CSR allocation today is usually either (a) purely impact-maximizing, which systematically starves already-underserved regions with fewer "investable" projects, or (b) an equal split across states, which ignores need entirely. FairFill does neither:

1. **Layer 1 — Structural geographical fairness.** A max-min water-filling algorithm caps how much of the total pool any single region can absorb, so one region's high-impact projects can never crowd out the rest.
2. **Layer 2 — Equity-adjusted impact optimization.** Within each region's cap, projects are funded tier-by-tier using marginal impact-per-rupee, adjusted by evidence-based underservice, geographical equity, and NGO trust.
3. **Monitoring.** Funded projects run on a judge-controlled simulated clock. Milestones resolve as self-controlled (judge decides success/failure) or external-dependency (system auto-pauses with no penalty).
4. **Salvage & reallocation.** A missed self-controlled milestone triggers a salvage evaluation. Below a 60% completion threshold, the engine proposes reallocating the project's unspent, still-capped funds to the best-scoring project in the same region — never automatically executed.

The scoring and allocation engine is fully **deterministic**: same inputs always produce the same outputs. No LLM is used anywhere in the core allocation, scoring, or simulation logic — see [§12](#12-known-limitations--future-work) for where an AI evidence-ingestion layer could plug in later.

---

## 2. Architecture

```
                    FAIRFILL
                       │
              ┌────────┴────────┐
              │                 │
        EVIDENCE LAYER      ALLOCATION LAYER
   Regional need/underservice   │
   Historical funding      Layer 1 — Max-min water-filling
   Domain indicators        (regional budget caps)
                                 │
                            Layer 2 — Marginal tiered
                            allocation (impact × trust ×
                            underservice × equity)
                                 │
                          Proposed allocation
                                 │
                          Human approval (release)
                                 │
                         PROJECT MONITORING
                    Simulated clock → milestone engine
                                 │
                          Milestone outcome
                        ┌────────┴────────┐
                   Completed          Missed → Salvage
                                             │
                                  Reallocation proposal
                                             │
                                     Human approval
```

The conceptual separation between Layer 1 (structural fairness) and Layer 2 (marginal impact optimization) is preserved end-to-end — regional caps are computed once, independently of project quality, and only then do projects compete for a slice of their own region's cap.

### Backend structure

```
server/src/
  config/fairfillConfig.ts     # every tunable constant (ALPHA, BETA, thresholds, weights)
  db/client.ts                 # Prisma client singleton
  seed/seed.ts                 # deterministic demo dataset (also powers Reset Demo)
  services/
    fairfill/
      underservice.ts          # evidence-based underservice scoring
      equity.ts                # geographical equity (funding relative to need vs. peers)
      trust.ts                 # NGO trust multiplier derivation
      scoring.ts                # Layer 2 adjusted-score formula + breakdown
      regionalFairness.ts      # Layer 1 max-min water-filling
      marginalAllocation.ts    # Layer 2 tier-by-tier marginal fill + concavity check
      runFairFill.ts           # orchestrates a full FairFill run
      allocations.ts           # allocation approve/reject
      salvage.ts                # salvage threshold evaluation
      reallocation.ts          # reallocation proposal/approve/reject
      comparison.ts             # illustrative traditional-vs-FairFill comparison
    simulation/
      stateMachine.ts           # project lifecycle state machine
      simulationClock.ts        # judge-controlled simulated clock
      milestoneEngine.ts         # milestone resolution, evidence, salvage trigger
      projectView.ts
    audit.ts                    # audit event logging
  controllers/ · routes/ · middleware/ · utils/
tests/                          # vitest unit tests for every algorithm + state machine
```

### Frontend structure

```
client/src/
  pages/        Overview · Regions · RegionDetail · Projects · ProjectDetail ·
                 Allocations · Simulation · Reallocations · Evidence · Audit
  components/    AllocationFlow · EquityMap · ScoreBreakdown · ProjectTimeline ·
                 ComparisonChart · WhyFairFill · AuditFeed · EvidenceModal ·
                 MetricCard · StatusBadge · Sidebar · StateViews
  services/api.ts
  hooks/useToast.tsx
  types/index.ts
```

All algorithmic logic lives in the backend. The frontend only calls the REST API and renders responses — no scores, allocations, or simulation outcomes are computed in React.

---

## 3. Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + TypeScript + Vite, Tailwind CSS, TanStack Query, Recharts, Framer Motion, Lucide icons |
| Backend | Node.js + TypeScript + Express |
| Database | SQLite via Prisma ORM |
| Tests | Vitest |

No external API is required. The app works fully offline after `npm install`.

---

## 4. Setup instructions

### Prerequisites

- Node.js ≥ 18 (developed on Node 22)
- npm ≥ 10

### Install & seed (one command)

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
```

Or all at once:

```bash
npm run setup
```

### Run (frontend + backend together)

```bash
npm run dev
```

This starts the backend on **http://localhost:4000** and the frontend on **http://localhost:5173** (Vite proxies `/api` to the backend — no CORS configuration needed in the browser). Open http://localhost:5173.

### Run individually

```bash
npm run dev:server   # backend only, http://localhost:4000
npm run dev:client   # frontend only, http://localhost:5173
```

### Environment variables

`server/.env` (already present with sane defaults; copy `server/.env.example` if recreating):

```
DATABASE_URL="file:./dev.db"
PORT=4000
```

No other environment variables or secrets are required — the entire demo runs on local SQLite with seeded evidence data.

### Re-seeding / resetting

```bash
npm run db:seed
```

or, with the app running, click **Reset Demo** in the sidebar (calls `POST /api/demo/reset`). Both paths wipe every table and reseed the identical deterministic scenario, so the demo can always be restarted from a clean state.

### Running tests

```bash
npm test
```

26 Vitest unit tests cover underservice/equity/scoring math, max-min water-filling, marginal tiered allocation (including the non-concave fallback), salvage threshold logic, and every project state transition (valid and invalid).

### Production build

```bash
npm run build
```

Builds the server (`server/dist`) and the client (`client/dist`) via `tsc`/`vite build`.

---

## 5. API documentation

All endpoints are prefixed with `/api`. Errors return `{ "error": "message", "details"?: ... }` with an appropriate 4xx/5xx status.

| Method | Path | Description |
|---|---|---|
| GET | `/dashboard` | Aggregate KPIs for the Overview page |
| GET | `/config` | Exposes ALPHA/BETA/thresholds/weights so the UI can show the exact formula |
| GET | `/regions` | All regions with indicators, projects, NGOs |
| GET | `/regions/:id` | One region + live underservice/equity explanation |
| GET | `/projects` | All projects |
| GET | `/projects/:id` | One project + full score breakdown |
| GET | `/projects/:id/milestones` | A project's milestones |
| POST | `/fairfill/run` | Runs Layer 1 + Layer 2, creates PROPOSED allocations |
| GET | `/fairfill/comparison` | Illustrative traditional-vs-FairFill allocation comparison |
| GET | `/allocations` | All allocations |
| POST | `/allocations/:id/approve` | Approves + releases an allocation (funds the project) |
| POST | `/allocations/:id/reject` | Rejects a proposed allocation |
| POST | `/simulation/:projectId/advance` | `{ months }` — advances the simulated clock |
| POST | `/simulation/:projectId/rewind` | Moves the clock back one month |
| POST | `/simulation/:projectId/jump` | Jumps straight to the next unresolved milestone's month |
| POST | `/simulation/:projectId/fail-milestone` | `{ actualCompletion? }` — forces the current milestone to fail |
| POST | `/milestones/:id/complete` | Marks a specific milestone complete |
| POST | `/milestones/:id/evidence` | `{ filename, description, simulatedLocation }` |
| GET | `/reallocations` | All reallocation proposals |
| POST | `/reallocations/:id/approve` | Approves & releases a reallocation |
| POST | `/reallocations/:id/reject` | Rejects a reallocation |
| GET | `/audit` | Full audit event log (most recent first) |
| POST | `/demo/reset` | Wipes and reseeds the entire demo scenario |

---

## 6. Algorithm explanation

### 6.1 Underservice (evidence-based, never self-reported)

For each authoritative indicator (e.g. doctors per 10,000 population, hospital beds, healthcare access, CSR funding per beneficiary):

```
gap = clamp(1 − regionalValue / benchmarkValue, 0, 1)     (lower-is-worse indicators)
underserviceScore = Σ (weight_i × gap_i)
```

Default weights (configurable in `config/fairfillConfig.ts`): doctor availability 0.30, hospital beds 0.25, healthcare access 0.25, CSR funding gap 0.20. The same four-slot structure is reused for Water & Sanitation and Education domains with domain-appropriate indicators.

### 6.2 Geographical equity (funding relative to need, not absolute money)

```
fundingPerNeed = historicalCSR / needIndex
equityScore = clamp(0.5 + (peerAverageFundingPerNeed − fundingPerNeed) / peerAverageFundingPerNeed, 0, 1)
```

A region funded well below its peer-group average *relative to its own need* scores high on equity — regardless of how much absolute money it received. A region overfunded relative to peers scores near zero. This deliberately avoids the naive "less money in ⇒ more money out" fallacy.

### 6.3 Layer 2 scoring formula

```
impactEfficiency = (impactUnits / amount) × 100,000        (impact per ₹1 lakh)
adjustedScore = impactEfficiency × trustMultiplier × (1 + ALPHA·underservice + BETA·equity)
```

Defaults: `ALPHA = 0.30`, `BETA = 0.20` (configurable). The full breakdown (raw impact, trust multiplier, underservice bonus %, equity bonus %, final score) is returned by the API and rendered as a waterfall in the UI — no score is ever shown as a single opaque number.

### 6.4 Layer 1 — max-min water-filling

Given the total pool and each region's demand (sum of its eligible projects' requested budgets):

1. Compute an equal share of the *remaining* pool across still-unsatisfied regions.
2. Any region whose outstanding demand fits within that share is fully satisfied and removed from the active set, freeing its unused share for the rest.
3. Repeat until either the pool is exhausted or no more regions can be satisfied — remaining regions split what's left equally.

This guarantees no single region can consume the whole pool just because it hosts high-impact projects — its cap is a fair ceiling, not its actual demand.

### 6.5 Layer 2 — marginal tiered allocation

Each project has 1–3 funding tiers (cumulative amount → cumulative impact). At every step, the engine looks at *every project's next available tier only*, scores its **marginal** impact-per-rupee (adjusted by trust/underservice/equity), and funds whichever affordable increment scores highest — repeating until nothing more fits in the region's cap. This is genuine marginal allocation, not a single one-shot ranking.

**Concavity check.** A project's tiers must show non-increasing marginal efficiency (diminishing returns). If a project's tiers violate this, it is flagged `NON_CONCAVE` and instead funded via a lump-sum fallback: ranked once, in full, against the remaining cap.

### 6.6 Salvage logic

```
SALVAGE_THRESHOLD = 60%
completion ≥ 60%  → recommend BRIDGE_TRANCHE
completion < 60%  → recommend REALLOCATE
```

Always a **proposal**. Never auto-executed.

### 6.7 Reallocation

The destination search is restricted to the **source project's own region**, so a reallocation can never cross — and therefore never violate — the Layer 1 regional fairness cap it was originally funded under. The amount offered is capped by the *smaller* of (a) the source's own unfunded gap and (b) how much of the region's cap is still genuinely unspent — this prevents a reallocation from ever conjuring money that was never actually part of any region's allocation, which would silently overspend the total pool. Both the proposal and the approval step re-validate this bound.

---

## 7. Simulation model

Real CSR projects take months; the prototype uses a **judge-controlled simulated clock** (`currentSimulatedMonth`), never real elapsed time.

- **Previous Month / Advance 1 Month / Advance 3 Months / Jump to Next Milestone** move the clock.
- A milestone whose due month is reached gets an automatic treatment:
  - **External dependency**: immediately paused for human review — no penalty, since the delay isn't the NGO's fault.
  - **Self-controlled, strictly in the past** (skipped over by a multi-month jump): auto-completes at its expected value, so the judge isn't forced to individually resolve every earlier housekeeping milestone.
  - **Self-controlled, due exactly this month**: becomes pending and is **never** auto-resolved — it waits for an explicit **Complete Current Milestone** or **Simulate Failure** click. The clock alone must never decide a self-controlled outcome.
- **Simulate Failure** forces the current milestone to miss (default actual = half its expected completion, or pass `actualCompletion` explicitly), which for a self-controlled milestone immediately triggers salvage evaluation and, if below threshold, a reallocation proposal.

### Project state machine

```
DRAFT → PROPOSED → APPROVED → FUNDED → IN_PROGRESS
  → MILESTONE_COMPLETED → IN_PROGRESS | COMPLETED
  → MILESTONE_MISSED → PAUSED | UNDER_REVIEW | REALLOCATION_PROPOSED
REALLOCATION_PROPOSED → REALLOCATED | PAUSED
```

Every transition is validated server-side (`services/simulation/stateMachine.ts`) — an invalid transition throws and is never silently allowed.

---

## 8. Demo instructions

### Seeded scenario

- **4 regions**: Bundelkhand (Healthcare, high underservice + high equity gap), Vidarbha (Water & Sanitation, high underservice), Coastal Odisha (Education, moderate), North Bengaluru Urban (Healthcare, well-served control region).
- **5 NGOs**, **11 projects**, **22 milestones**.
- Three projects are built for the milestone-simulation demo:
  - **Rural Primary Healthcare Centre** (Bundelkhand) — successful story.
  - **Community Health Facility** (Bundelkhand) — external-dependency pause story.
  - **Rural Water Access Project** (Vidarbha) — self-controlled failure → salvage → reallocation story.
- A dedicated contrast pair on the Projects page: **Urban Diagnostic Imaging Center** (higher raw impact, low underservice/equity) vs. **Bundelkhand Mobile Health Units** (lower raw impact, much higher underservice/equity) — FairFill's adjusted score makes the latter win, which the UI calls out explicitly.

### 4–5 minute walkthrough

1. **Overview** — show the ₹1 Crore pool, 4 regions, 11 projects.
2. Click **Run FairFill** — watch Layer 1 compute regional caps live, then Layer 2 fund projects within each cap.
3. Open **Regions → Bundelkhand** — show the "Why this score?" panels (underservice contributors, equity vs. peer average).
4. Open **Projects** — point at the comparison card: Urban Diagnostic Imaging Center (higher raw impact) loses to Bundelkhand Mobile Health Units (higher underservice + equity) on final score.
5. Go to **Allocations** and approve the proposed allocations (at least all of Vidarbha's, so a reallocation destination exists).
6. Open **Simulation**, select **Rural Water Access Project**.
7. Click **Advance 3 Months** — the clock reaches Month 3, "Pipeline deployment" becomes the pending milestone.
8. Click **Simulate Failure** — see completion drop to 35%, milestone marked MISSED, salvage evaluated live in the event feed.
9. Go to **Reallocations** — see the proposal (source, remaining amount, destination, why it was chosen).
10. Click **Approve & Release** — the destination project's funding increases immediately; check **Audit Log** for the full closed-loop trail.
11. Click **Reset Demo** any time to restart from a clean seeded state.

---

## 9. Scoring & explainability

Every score shown in the UI is a full waterfall, never a bare number:

```
Raw impact efficiency     170.0
NGO trust multiplier      × 1.10
Underservice adjustment   + 21.9%
Geographical equity adj.  + 17.6%
Final score                261.0
```

Every reallocation proposal shows source, remaining amount, reason, destination, destination score, and why that destination was chosen — including confirmation that the regional fairness constraint is satisfied.

---

## 10. Governance

FairFill is a **decision-support system**. It does not autonomously transfer money. Every allocation and every reallocation is a proposal that requires explicit human approval before funds move. This is stated directly in the product UI (sidebar) and is enforced server-side — there is no code path that releases funds without an approval action.

---

## 11. Demo mode / reset

**Reset Demo** (sidebar, with a confirmation dialog) wipes every table and reseeds the identical deterministic scenario used at first install — the judge can never accidentally leave the system in a broken state, and the exact same demo can be repeated indefinitely.

---

## 12. Known limitations & future work

- **Single shared peer cohort.** All four regions currently share one peer group for the equity calculation; the architecture supports multiple named peer groups (e.g. rural vs. urban cohorts) — the seed data simply uses one for a clean pairwise comparison.
- **Domain indicator weights are shared across domains** for simplicity (same four-slot weighting for Healthcare/Water/Education); a production system would tune weights per domain.
- **No authentication/roles** — this is a single-tenant prototype; a real deployment would need CSR-committee login, per-company scoping, and audit-actor identity beyond the placeholder "CSR Administrator".
- **Rewinding the clock** moves `currentSimulatedMonth` back but does not revert already-resolved milestone outcomes — documented as a deliberate simplification rather than building full undo/redo.
- **Evidence is human-reviewable, not verified.** No computer vision or ML runs on uploaded evidence; this is explicit and intentional for the prototype.
- **Future AI evidence layer.** The architecture's Evidence Layer is intentionally separated from the deterministic Allocation Layer specifically so an AI-assisted ingestion pipeline (e.g. OCR on government indicator PDFs, satellite-imagery-based underservice estimation, or LLM-assisted evidence summarization) could be added later *without* touching the scoring or allocation math — it would only ever produce new `RegionIndicator` rows, never scores or allocations directly. Determinism of the core engine (same inputs → same outputs) is a deliberate governance property, not an oversight.

---

## 13. Quality bar checklist

Verified end-to-end (both via API tests and a full headless-browser click-through of the live UI) before calling this complete:

- [x] Backend, frontend, database all run together via `npm run dev`
- [x] `npm run db:seed` produces 4 regions / 5 NGOs / 11 projects / 22 milestones
- [x] Run FairFill computes real, reproducible regional caps and project allocations
- [x] Score breakdown is fully transparent (impact, trust, underservice, equity, final)
- [x] Allocation approval releases funds and transitions the project to IN_PROGRESS
- [x] Advancing the simulated clock, completing milestones, and simulating failure all work
- [x] Salvage logic correctly recommends REALLOCATE below 60% completion
- [x] Reallocation proposal, approval, and release all work and stay within budget
- [x] Audit log captures the full closed-loop trail
- [x] Reset Demo restores a clean, identical seeded state
- [x] 26 automated tests pass (`npm test`)
