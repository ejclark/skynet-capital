# The Living Universe — the cityscape as a shared, legible world

_A living sketch (src: Eric, expanded by Claude). North-star vision; sequencing and the governance-
gated pieces are Eric's calls. This document is the durable home for the idea — refine it in place._

## The idea

Skynet Capital as a **multiplayer, SimCity-like shared universe**: the cityscape isn't decoration, it's
a living reflection of what people do. Trades, positions, bots, and market events weave into the skyline
as accented detail, so the world visibly grows from everyone's contributions. Sauron's tower is the
first proof — a persona rendered as a landmark. The experience personalizes and gamifies by making the
system's state something you can *see and inhabit*.

## Why it matters — the flywheel

**Fun is the engine, not the wrapper.** The top-line design constraint is _make it fun to play_ — the
gamified world is what keeps the group showing up and arguing every week. That same world does three
jobs from one design:

1. **Fun / engagement** — a multiplayer universe that reflects everyone's moves keeps people playing.
2. **Observability → trust** — encoding positions, bots, and events legibly makes risk and opportunity
   glanceable; that legibility is what earns the confidence to let the system act on its own.
3. **Capital, compounding in the background** — the same play quietly builds a revenue-generating
   system. The endgame — **autonomous trading with real money** — is reached only once the fun has kept
   the group in, the telemetry has earned trust, and the capital is there **to go play with**.

So gamification isn't decoration on a trading system; it's the flywheel. Keep the group hooked → the
world stays legible → trust and capital accrue → autonomy unlocks → more to play with. Every stepping
stone below spins that wheel.

## The visual vocabulary (data → world)

A consistent grammar for turning state into the skyline. Extends what already exists (the storm =
volatility, market-hours lighting = session, ticker billboards = the tape).

| Signal | World expression |
| --- | --- |
| **A position** | a tower — ticker = building identity, size = height, P/L = health (lit/green vs. dim/red), concentration = district density |
| **A bot persona** | a landmark structure with its own signature (Sauron's tower / the Eye); the persona-lore registry is the seam |
| **Volatility** | the storm (shipped) — intensity scales with fear/greed |
| **Market session** | skyline lighting waking/resting (shipped) |
| **A macro event** | a phenomenon: oil shock → smoke plumes / fires; geopolitical (e.g. an oil-disrupting conflict → higher oil, logistics strain) → traffic jams, haze; a print (CPI/FOMC) → a broadcast pulse |
| **Regime** | bull → construction cranes, new lights, growth; bear → dimming, fog, gridlock |
| **Transition / comms** | **matrix tracers** as the connective medium — routing a change, a new contribution arriving, an event propagating across districts |

The point: someone glancing at the city reads the state of affairs — who's exposed where, what the
market is doing, where the risk and opportunity sit — without a single number.

## Phased roadmap (each phase a trust stepping stone)

1. **Landmarks from personas** (foundation, in progress). Persona cards shipped; next, personas as
   skyline structures beyond the Eye. Pure display, no account data.
2. **Your city (post-login, personalized).** Drive a logged-in cityscape from the current
   `ParticipantSnapshot` — positions → towers, P/L → health. Needs the two-modes split (#54) and leans
   on the history layer for change-over-time. Login stays sim/aggregate (pre-auth = no personal data).
3. **Market-event vocabulary.** A data-driven event → phenomenon system (regimes, macro events) atop the
   existing sim; real once an event feed is wired. The Iran/oil example → smoke + logistics motifs.
4. **Contributable personas.** People add bot personas that become part of the universe — the plugin
   architecture behind the persona-lore seam. Gated by the autonomous-contribution system below.
5. **The full ecosystem.** Trades/events/regimes continuously animate a world that communicates the
   league's live state — the instrument panel that underwrites autonomous real-money trading.

## Boundaries & consent

Mixing participants' trades, bots, and info into one shared world is **consensual by the invite-only
participation agreement** — paper-only and low-stakes, so it is not a privacy blocker inside the group.
The boundary that matters is the **invite gate**, and integrity is held to a real-cash standard:

- **In-group (authenticated members):** the full shared universe — others' positions, bots, landmarks —
  is visible by agreement.
- **Public / pre-auth:** aggregate or anonymized only (e.g. the `/pulse` cohort totals). No individual
  account detail leaks outside the gate.
- **Real-cash standard, at paper stakes:** uphold every boundary — the invite gate, honest `SIM`/`LIVE`
  labeling, the autonomous-system rails — reliably, *as though real cash flowed*. Practice like we play,
  so the discipline is proven before real money is involved. (Formalizing the participation agreement /
  consent language is Eric's to define — tracked in IDEAS.)

## The autonomous-contribution system — GOVERNANCE (Eric's calls; not built unattended)

Eric's emerging system: **autonomously pick up GitHub issues and act on them**, starting narrow (e.g.
integrating user-submitted bot personas into the universe) and widening privileges as trust deepens.
This is high-stakes and must be **designed rails-first**. Mantra: **Detect · Correct · Maintain.**

- **Bounded scope per privilege tier.** Each tier has an explicit allowlist of issue types it may act on
  (tier 1: additive persona integrations only — pure display, no engine/trading changes). Anything
  outside scope escalates to a human.
- **Detect drift.** Every autonomous change is checked against the brand system (`BRAND.md`), the
  structural map (Graphify `affected` before touching anything), the test suite, and an alignment
  review before merge. Drift = a defect that blocks.
- **Correct.** On detected drift, revert/repair automatically and surface it; never merge past a
  tripped rail.
- **Maintain.** Continuous verification (CI green, cohesion checks, a `brand.json` enforcer — see
  IDEAS) keeps the ecosystem from decaying as it self-evolves.
- **Progressive trust ladder.** Privileges (and responsibilities) expand only by Eric's explicit
  decision, one tier at a time, after the prior tier has a track record. The sensitive steps — granting
  autonomy, provisioning credentials, and above all **real-money trading** — are always Eric's, never
  self-authorized.

The safe first rung is tier 1: additive, display-only persona/landmark contributions with full
detect-correct-maintain rails. Everything beyond earns its place.

## Foundations we can build on today

- **Shipped:** the storm (volatility), market-hours lighting (session), ticker billboards (tape), the
  Eye/Sauron's tower (persona → landmark), the persona-lore registry (`personaId` → identity seam).
- **Data:** `ParticipantSnapshot` (positions, equity, personaId), the public `/pulse` cohort aggregate,
  fear/greed + scheduled/surprise event infra in the playcall.
- **Instruments:** Graphify (`affected`/`path` to keep autonomous changes safe), the operating model +
  BCP (to keep them on-brand), the idea OS (to route the side quests this ecosystem will generate).
