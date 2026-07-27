# Skynet Capital — system map (the spine)

A one-screen, collapsible overview of every system in the app, so we can see the whole at a glance
and decide **where to aim next**. This is the *product/systems* view (what exists and how mature it
is); for the code-dependency graph use [`STRUCTURE-graph.md`](STRUCTURE-graph.md), and for how we
decide what to build use [`CLAUDE.md`](../CLAUDE.md) + [`IDEAS.md`](IDEAS.md).

Each node carries a **status** and, where useful, a `→ aim` pointer to the next slice.

**Status legend:** ✅ shipped · 🟡 partial (works, seams remain) · ⬜ planned · 💡 idea (in `IDEAS.md`)
· 🔒 governance-gated (Eric's irreversible-class call — build the mechanism, never self-authorize).

> Keep this current: when a system materially changes, update its node here in the same PR. Nodes are
> short by design — one line of intent, not a spec. Deep detail lives in the linked docs.

---

<details open>
<summary><strong>1 · Threshold — the <code>/login</code> experience</strong> ✅ &nbsp;<em>(the cinematic front door; single file: <code>server/auth/authenticator.ts</code>)</em></summary>

- ✅ **Living market backdrop** — indicator-driven tape (EMA / Bollinger / RSI) that fires option playcalls
- ✅ **Playcall lifecycle** — signal → forecast-on-trend → realized pen walks into the prediction → resolve/recap
- ✅ **Playbook menu** — user can *call a play*; plays carry a 101–401 complexity tier
- ✅ **Eye of Sauron tower** — detects signals, aims the gravity beam, hauls the play into view
- ✅ **Cityscape** — the empire skyline (parallax depth, market-hours lighting, ticker billboards)
- ✅ **Reveal VFX** — "key to the city" + WebGL eye-gaze fire/electric blinding flood on enter
- ✅ **Self-labeling chart** — play name/thesis + max P/L + live P&L render on the chart (no side drawer)
- 🟡 **Two modes** (#54) — login = fast preview; logged-in = slow/studyable. `→ aim:` the study-mode pacing pass
- 💡 **Terminal backstory** (#68/#72) — a left-panel terminal preamble/lore (deferred; user prefers no login side-panel)

</details>

<details>
<summary><strong>2 · Identity &amp; access</strong> ✅ &nbsp;<em>(<code>server/auth/*</code>)</em></summary>

- ✅ **OAuth sign-in** — Google + GitHub providers (`providers.ts`), sessions (`session.ts`)
- ✅ **Allowlist gate** — invite-only; `SKYNET_ALLOWED_EMAILS` is the sole authz gate (ADR-0005, ADR-0006)
- ✅ **Alpaca Connect** — OAuth link to a paper account (`alpaca-connect.ts`), no key-pasting
- 🔒 **Membership** — adding/removing a member is an allowlist secret change (Eric)

</details>

<details>
<summary><strong>3 · The Observatory — post-login views</strong> ✅ &nbsp;<em>(<code>server/dashboard-server.ts</code> + <code>observatory/render-dashboard.ts</code>; server-rendered routes, SSE live-refresh)</em></summary>

- ✅ **Board `/`** — everyone's cards, your card first + "YOU"; observer-mode funnel for the account-less
- ✅ **Individual `/u/:id`** — your desk: equity hero, tiles, positions, activity; founding CTA when funded-but-untraded
- ✅ **Leaderboard `/leaderboard`** — rank by equity / unrealized P/L / return % / realized P/L
- ✅ **Bots vs Humans `/bots-vs-humans`** — cohort aggregates + a live **match scoreboard** (avg-equity tug-of-war)
- ✅ **Compare `/compare`** — two participants side by side (two-cities skyline)
- ✅ **Onboarding** — `/welcome` guided setup, `/add` (matrix-styled Alpaca form), `/pulse` public cohort metric
- 🟡 **Personalization depth** — richer "your desk" story rides the history layer (§8)

</details>

<details>
<summary><strong>4 · The Living Universe — the sim-city</strong> 🟡 &nbsp;<em>(<code>universe/*</code> projection → <code>observatory/empire-skyline.ts</code> render; north star: <a href="LIVING-UNIVERSE.md">LIVING-UNIVERSE.md</a>)</em></summary>

- ✅ **World projection** — positions→structures (mass/health/sector), cash→reserve, persona→landmark (`project.ts`, pure + unit-tested)
- ✅ **Empire skyline** — a participant's holdings as a domain-themed city; renders across board/individual/compare/cohorts
- ✅ **Founding reserve** — dry powder as "the empire about to rise" (the post-login twin of the login reveal)
- ✅ **Persona landmarks** — the Eye crowns a bot's tallest tower; prominence = rank (P1)
- ⬜ **Event ceremonies** — ground-breaking on deploy, buildings top out on profit-taking (needs history, §8)
- ⬜ **Scale-ladder** — city → region → nation rendering across the four views (a per-view spec)
- 💡 **Babylon.js** — a real composable 3D engine if/when the flat canvas stops absorbing detail (`IDEAS.md`)

</details>

<details>
<summary><strong>5 · Autonomy — bots that trade</strong> 🟡 &nbsp;<em>(<code>autonomous/*</code>, <code>bots/*</code>, <code>scripts/run-autonomous.ts</code>; plan: <a href="AUTONOMY-PLAN.md">AUTONOMY-PLAN.md</a>)</em></summary>

- ✅ **Decision → risk → execution** — `persona.decide` → `applyGuards` → `AutonomousTrader.evaluate()` → broker
- ✅ **Safety substrate** — `SafetyController` (kill switch + circuit breakers), observe/live mode, JSONL decision audit
- ✅ **Readiness gate** — `assessReadiness()`: a persona can't go live without passing the eval battery
- ✅ **Market-hours gating** + **always-on hosting mechanism** — Fly two-process image (app + bots), safe-by-default observe
- 🔒 **Go-live (Phase 4)** — the observe→live flip on a market open, bot secrets, spend (Eric; runbook in <a href="AUTONOMY-DEPLOY.md">AUTONOMY-DEPLOY.md</a>)
- ⬜ **User-defined personas** — let a *member* create/configure their own bot. `→ aim:` a per-user persona **config store** + setup surface (see §11 for the MCP question)

</details>

<details>
<summary><strong>6 · Personas &amp; lore</strong> ✅ &nbsp;<em>(<code>personas/*</code>, <code>observatory/persona-lore.ts</code>)</em></summary>

- ✅ **Persona registry** — day-trader, futurist, news-fader, rumor-trader, gold-bug, banker, retail-investor, sauron
- ✅ **D&D lore layer** — a flavor skin over honest mechanics; persona character cards on `/u/:id`
- ✅ **Persona classes** — the class-picker derivation (`server/persona-classes.ts`)
- ⬜ **Contributable personas** — members add personas that join the universe (Living Universe P4; governance-gated)

</details>

<details>
<summary><strong>7 · Learn — the academy</strong> 🟡 &nbsp;<em>(<code>domain/curriculum.ts</code>, <code>domain/plays.ts</code>, <code>/learn</code>)</em></summary>

- ✅ **Gamified journey** — points/rank HUD, Wheel-first, milestones; risky plays hidden until you climb
- ✅ **Risk ladder** — `plays.ts` (CCP-first, 101–401 tiers); `curriculum.ts` (100/200 courses, ranks)
- 🟡 **Progression** — graduation is client-side localStorage today. `→ aim:` server-side per-user progression
- ⬜ **Gate actions by level** — hide plays above the learner's unlocked tier (`unlockedPlays`/`isLocked`) once a picker exists
- 💡 **University metaphor** — majors, degrees that gate capability, persona-professors, a campus landmark (`IDEAS.md`)

</details>

<details>
<summary><strong>8 · History &amp; performance</strong> 🟡 &nbsp;<em>(<code>observatory/history-store.ts</code>, <code>history-sampler.ts</code>, <code>equity-sparkline.ts</code>, <code>reduce.ts</code>)</em></summary>

- ✅ **Equity history** — periodic samples persisted to the volume; sparkline + "since first sample" on `/u/:id`
- ✅ **Realized P/L** — booked on sells in the reducer; shown on the desk + rankable on the leaderboard
- ✅ **Drawdown/peak** — worst peak-to-trough dip derived from samples
- ⬜ **Per-play win rate** — needs a **closed-trade ledger** in the reducer (P/L-semantics change → wants review before landing)
- ⬜ **"Which plays worked"** — per-trade outcomes over time (builds on the ledger)

</details>

<details>
<summary><strong>9 · Feedback &amp; contribution</strong> 🟡 &nbsp;<em>(<code>server/feedback-service.ts</code>, <code>/feedback</code>)</em></summary>

- ✅ **In-app funnel** — `/feedback` (authed) → creates labeled GitHub issues via a single bot token (no GitHub account needed)
- ✅ **Issue templates** — bug / feature / idea forms for collaborators
- 🔒 **Feedback triage automation** (#74) + self-service access flows (#76) — governance decisions pending

</details>

<details>
<summary><strong>10 · Platform &amp; delivery</strong> ✅ &nbsp;<em>(<code>fly.toml</code>, <code>docs/adr/*</code>, <code>scripts/*</code>)</em></summary>

- ✅ **Hosting** — Fly.io always-on dashboard (ADR-0001); offline data-source mode for keyless local runs (ADR-0002)
- ✅ **CD** — deploy to Fly on green squash-merge to main (ADR-0004); small-green-PR ship loop
- ✅ **Data source** — Alpaca market-data streams + broker (`alpaca/*`), news→sentiment (`news/*`)
- ✅ **Evals** — persona readiness + generic safety battery (`evals/*`, `scripts/eval-*`)
- ✅ **Decision records** — ADRs 0001–0006 accepted; ADR-0007 proposed (§11)

</details>

<details>
<summary><strong>11 · Agent interfaces — MCP</strong> ⬜ &nbsp;<em>(proposed; <a href="adr/0007-operator-control-plane-mcp.md">ADR-0007</a>)</em></summary>

- 🔒 **Operator control-plane MCP** — drive the fleet conversationally (list/inspect/observe/halt free; live-enable human-gated). *Proposed — awaiting accept.*
- ⬜ **Member-facing setup** — how a user creates a bot persona. **Two models:**
  - **Model A (recommended first):** in-app setup wizard on the existing engine + a per-user persona config store. *No MCP.*
  - **Model B (additive):** conversational "describe your bot" via MCP tools, per-user authz in the handlers, API-brokered (not account-shared). Calls the *same* backend as Model A.
- **Rule of thumb:** MCP is the right tool for the *conversational interface*, **not** for the trading engine, the config store, or the scheduler — those are plain backend and already largely exist.

</details>

---

## Where to aim (synthesis)

The binding constraint is **Eric's attention** (see `CLAUDE.md`). Ranked by leverage — how much each unlocks
downstream, weighted toward what's offline-buildable without spending the constraint:

1. **Per-play win-rate ledger** (§8) — the last dark seam in the history layer; unlocks "which plays worked" across every view. *Reducer P/L change → wants one review pass, then buildable.*
2. **User-defined persona setup — Model A wizard** (§5, §11) — the biggest product unlock for "members run their own bots"; plain backend (config store + engine wiring), no MCP required.
3. **Event ceremonies** (§4) — the sim-city comes alive on profit-taking/reinvestment; rides the history layer (#1).
4. **Accept ADR-0007** (§11) — the operator MCP; then the Model-B conversational layer becomes additive on top of #2.
5. **Server-side academy progression** (§7) — makes graduation real and lets it gate actions.

🔒 **Governance (Eric only, not built unattended):** the go-live flip (§5 Phase 4), feedback automation (§9),
contributable personas (§6), and every credential/spend step.
