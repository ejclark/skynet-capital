# Plan: the retrospective insight loop — event-driven, safety-railed, interim-persisted

**Status:** executing <!-- draft | ready | executing | review | done — only Eric flips draft→ready -->
**Author:** Claude (proposing) · **Date:** 2026-08-13 · **Ready:** 2026-08-13 (Eric, in-conversation)

## Intent & end-state

Eric's directive across this session's conversation: make position-close event-driven (not a daily
poll), harvest a retrospective from every close, and let that harvest inform *other* same-day trades
and *future* playbook candidates — "why wouldn't we want to use all available research/data at our
disposal... the solution to remove the fear [of thrashing] is to add safety layers." This plan is
that: an insight layer with a promotion ladder so raw data can influence trading without letting an
n=1 outcome compound into noise, backed by a self-healing breaker so the loop demotes itself the
moment its own numbers say it's not working — the same class of mechanism `SafetyController` already
uses for daily-loss/error/data-gap, not a new invention.

When this is done: every closed position (any playbook, scout, or persona) fires a structured
retrospective; same-day insights can nudge *already-safety-railed* actions (never originate an
unbounded new trade type); recurring patterns still require the existing human-reviewed
research/red-team gate before becoming a real playbook; and an effectiveness breaker watches the
insight layer's own track record and throttles it automatically if it underperforms.

## Acceptance criteria (EARS)

- [ ] WHEN any position closes (playbook, beta-scout, or persona exit), the system shall emit a
      structured retrospective record (entry thesis/playbook id, exit reason, realized outcome,
      sentiment/momentum delta since entry). — *verify: spec on the close-event hook*
- [ ] WHEN a retrospective is recorded, the system shall persist it durably across process restarts
      via the interim file-based store (slice 2 below). — *verify: spec restarting the store mid-test*
- [ ] WHEN an insight-triggered action is taken, the system shall route it through the existing
      `applyGuards` chain (S2/E1, position cap, cooldown/no-pyramid) — no new order path bypasses the
      rails. — *verify: spec asserting guard chain is invoked*
- [ ] WHEN an insight-triggered action is taken, its `reason` shall name the specific retrospective
      that drove it. — *verify: spec*
- [ ] WHEN the insight layer's own trades underperform a baseline (organic trades, or plain
      beta-scout) over a rolling window, the effectiveness breaker shall auto-disable same-day
      insight-triggered nudges until manually cleared. — *verify: spec with a fixture losing streak*
- [ ] WHEN a pattern recurs across multiple retrospectives, the system shall surface it as a
      **candidate** for the human-reviewed research/red-team pipeline — never auto-promote it to a
      live playbook. — *verify: spec asserts no direct path from insight → `enabledPlaybooks`*

## Constraints & non-goals

- **Paper only**, same as every other trading mechanism in this repo.
- **No new order path.** Insight-triggered actions ride the existing guard chain; they can only
  adjust ranking/conviction within an already-safety-railed action (e.g., beta-scout's picks), never
  originate a new unbounded trade type.
- **No auto-promotion to playbook.** A recurring pattern is a research candidate, not a live trade —
  same evidence bar (research + red-team) as every playbook in `docs/plans/trade-playbooks.md`.
- **Not the metrics layer.** `docs/plans/metrics-layer.md`'s Tier 1 stats are a downstream consumer
  of this data, not rebuilt here.
- **Interim persistence is explicitly throwaway.** Slice 2 (file-based, via the app process's
  existing volume) is a stopgap; slice 4 (SQLite + a dedicated `bots` volume) replaces it. Eric
  provisioned that volume on 2026-09-04 (`skynet_bots_data`), so the replacement is live, not
  pending. The write interface is kept narrow enough that swapping the backing store is a one-file
  change, not a rewrite.

## Pre-settled forks

- **The promotion ladder** → Observation (always fires, no trading influence) → same-day bounded
  nudge (adjusts ranking/conviction inside an existing safety-railed action, capped, decays at day
  rollover) → playbook candidate (human-reviewed research/red-team gate, same as today). No insight
  skips a rung.
- **The effectiveness breaker** → same shape as `SafetyController`'s existing breakers (daily-loss,
  data-gap, error-rate): a rolling-window underperformance check that **disables itself**, not one
  that fires an alert someone has to notice. Self-healing means the system's own metrics gate the
  system, not a human watching a dashboard.
- **Interim persistence (Eric, 2026-08-13)** → a small internal-only HTTP bridge: the `bots` process
  POSTs structured records to the `app` process (which already has a Fly Volume mounted at `/data`),
  over Fly's private `.internal` network — **not** the public `[http_service]` port. Zero new Fly
  resources, zero new secrets, no action needed from Eric for this slice. Superseded by slice 4 —
  the dedicated volume now exists.
- **The eventual DB** → SQLite via Node's built-in `node:sqlite` (no new dependency), on a *second*
  Fly Volume dedicated to the `bots` process (a volume can only attach to one machine; `app` and
  `bots` are separate machines). Verified: $0.15/GB/month, no LiteFS needed for this single-machine
  topology (LiteFS is for multi-region HA, which this app doesn't do). This was the one step that
  needed Eric — `fly volumes create` is real spend + infra, even if trivial cost — and he took it on
  2026-09-04: `skynet_bots_data`, mounted at `/data` by `fly.bots.toml`'s `[mounts]`.
  **Scope extended (2026-09-04, issue #1181):** the same DB/volume also carries momentum,
  sentiment, and per-persona cooldown tables — restoring trading-signal state across a deploy
  restart, not just the retrospective insight stream this plan originally scoped. One volume, one
  `openBotsStateDb` handle (`src/autonomous/bots-state-db.ts`).

## Autonomy envelope

- Slices 1–3 (retrospective capture, interim persistence, effectiveness breaker): pure logic +
  internal-only network surface, paper-only, no credentials. Security-reviewed before merge (new
  network listener parsing input); auto-merge after a clean review.
- Slice 4 (SQLite + dedicated volume): **cleared 2026-09-04** — it was held for Eric until
  `fly volumes create`, and he ran it. The code shipped dark first (schema and migration path built
  and tested fully offline per his explicit requirement, unused until the volume existed), then
  `fly.bots.toml` mounted the volume and set `SKYNET_BOTS_DB_PATH` / `SKYNET_AUDIT_DIR` /
  `SKYNET_BOTS_HEALTH_PATH` (#1264, his own merge). Nothing on this slice is waiting on him.
- **Never widenable here:** anything that lets an insight auto-promote to a live playbook without the
  existing research/red-team gate; anything that lets an insight-triggered action bypass `applyGuards`.

## Open questions (Q&A queue)

1. **Effectiveness breaker's exact underperformance threshold** (e.g., N insight-triggered trades,
   M% below baseline) — proposing a conservative default in slice 3, tune once real data exists.
2. **Dashboard treatment of insight-triggered nudges** — carried over from `trade-playbooks.md`'s open
   fork on beta-scout visual distinction; likely the same answer applies here.

## Decision log

- **2026-08-13 — Eric authorized proceeding in-conversation** ("proceed with building the plan out"),
  functionally the ready-flip for the safe/dark/reversible slices (1–3); slice 4 stays gated on his
  `fly volumes create` action per the credentials/spend boundary.
- **2026-08-13 — interim persistence design chosen: internal HTTP bridge over a second volume.**
  Rationale: the `bots` process has zero persistent storage today (`fly.toml` mounts scope to `app`
  only); routing through `app`'s existing volume needs no new Fly resources, so it ships tonight
  without waiting on slice 4.
- **2026-09-04 — slice 4 scope extended, code shipped dark (issue #1181, PR #1203).** Diagnosing
  Sauron's trading inactivity surfaced the same structural gap this plan's slice 4 already targets:
  a deploy restart wipes bot memory. `bots-state-db.ts` adds momentum/sentiment/cooldown tables to
  the same planned volume rather than opening a second one — still fully held on Eric's
  `fly volumes create`; nothing here changes that gate.
- **2026-09-04 — the gate cleared; slice 4 is live (PR #1264).** Eric ran `fly volumes create` for
  `skynet_bots_data` and merged the `fly.bots.toml` change himself: `[mounts]` at `/data`, plus
  `SKYNET_BOTS_DB_PATH`, `SKYNET_AUDIT_DIR` and `SKYNET_BOTS_HEALTH_PATH`. The two entries above
  are left as written — they were true on their dates — and this one supersedes them. Note for a
  future reader: the config merged slightly ahead of the volume, so three `deploy-bots` runs failed
  pre-flight with *"needs volumes with name 'skynet_bots_data'"* before the 23:44Z deploy went
  green. Fly refuses a deploy with an unfulfilled mount, so nothing bad reached production — but it
  is why a `ci-failure` issue (#1265) exists for a cause that no longer exists on `main`.
- **2026-09-05 — restore made observable (issue #1181).** The slicing sketch asked for slice 3 to be
  "verified live … logs showing momentum/sentiment context already populated instead of empty."
  Rather than depend on a `flyctl logs` grep — the exact read that already false-negatived a healthy
  boot into a rollback on 2026-09-04 — the health stamp now carries a `restored` block
  (`momentumSymbols`, `sentimentSymbols`, `cooldowns`), so every deploy's own smoke read of
  `/data/health.json` is the proof. `null` there means durability was dark; all-zeroes means the DB
  opened and was empty. Those are different failures and the stamp keeps them apart.
