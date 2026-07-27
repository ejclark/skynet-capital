# Autonomy plan — unlocking human-vs-bot gameplay

**Goal (Eric):** get autonomous bot trading locked down, which unlocks bare-minimum human-vs-bot
gameplay. This plan turns that into a sequence of small, shippable, mostly-offline PRs — each one
unlocking the next — and marks the few steps that are Eric's to authorize.

This is the execution companion to [`AUTONOMY-READINESS.md`](AUTONOMY-READINESS.md) (which defines the
eval gate). That doc says *when* a bot is allowed to trade; this doc says *what to build* to get there.

---

## Where we already are (the hard parts exist)

The engine is real and runs today — this is not a from-scratch effort:

- **Decision → risk → execution:** `persona.decide(context, portfolio)` is pure (`src/personas/*`);
  `AutonomousTrader.evaluate()` (`src/autonomous/autonomous-trader.ts`) risk-guards the intents and
  places paper orders via `bot-broker` → `AlpacaTradingClient`.
- **Live runner:** `npm run run:autonomous` (`src/scripts/run-autonomous.ts`) is event-driven off the
  Alpaca market-data stream, with `MomentumTracker` + `SentimentTracker`; an offline mode replays
  fixtures against in-memory brokers with no keys.
- **Eval harness:** `npm run eval:persona` (readiness) and `npm run eval:safety` (generic safety
  battery across all personas).
- **The board already reflects fills:** a bot's paper fills propagate to the observatory exactly like a
  human trade; the **Bots-vs-Humans** and **Leaderboard** views exist.

## Definition of done — "bare minimum human vs bot"

Bots trade autonomously **on their own during market hours, safely, from an always-on host that is not
Eric's laptop**; the board shows their trades live; a scoreboard ranks humans vs bots; and Eric can
enable/disable a persona and **halt everything instantly**.

## The gaps between here and done

1. **Safety substrate** — `evaluate()` places immediately. There is no **observe (dry-run) mode**, no
   **kill switch**, no **audit log**, and no **circuit breakers**. (This is the load-bearing gap.)
2. **Readiness gate** — nothing ties "may trade autonomously" to *passing the readiness eval*. The
   runner will trade any persona named in an env var.
3. **Hosting & cadence** — the runner is a laptop CLI. It needs an **always-on host** and
   **market-hours gating** (the "bots aren't scanning 24/7 / tied to my laptop" problem).
4. **Observability** — autonomous decisions aren't surfaced. Eric can't watch *what a bot decided and
   why* without reading logs.
5. **Game framing** — the scoreboard exists but isn't framed as a live "match."

---

## Unlock sequence

Each phase is one or a few small PRs. **Everything is offline-verifiable except Phase 4** (which needs a
market open and is Eric's to run). Build order is chosen so the *safe* pieces land first.

### Phase 0 — Safety substrate _(offline)_
- **P0.1 Observe mode. ✅ shipped.** `AutonomousTrader` has a `mode: "observe" | "live"`. In observe it
  computes and records the full decision but **places nothing**. The runner reads `SKYNET_AUTONOMOUS_MODE`
  (**default `observe` — safe by default** on the live path). Unit-tested: zero orders in observe.
- **P0.2 Audit log. ✅ shipped.** Every cycle emits a `DecisionRecord` (`src/autonomous/decision-record.ts`)
  — timestamp, persona, mode, raw intents, guarded intents, and a per-intent outcome
  (`placed` / `rejected` / `observed` / `cooldown-skipped`). `JsonlAuditStore` persists one append-only
  JSONL per persona (set `SKYNET_AUDIT_DIR`). This is the record everything else reads.
- **P0.3 Kill switch + circuit breakers. ✅ shipped.** `SafetyController` (`src/autonomous/safety.ts`) is
  the halt state machine the trader consults via `blockedReason()` at the top of every cycle — halted →
  it decides and places nothing, and the halt is recorded on the `DecisionRecord`. **Kill switch:**
  `touch $SKYNET_HALT_FILE`. **Auto-halt breakers:** daily-loss cap, order-rate ceiling, consecutive
  errors, and a data-gap check (empty / non-finite quotes). Once tripped it stays halted until an
  explicit `reset()`. Fully unit-tested; the runner wires the halt-file + feeds the breakers.

### Phase 1 — The readiness gate _(offline)_
- **P1.1 Readiness gate. ✅ shipped.** `assessReadiness(persona, …)` (`src/autonomous/readiness.ts`)
  runs the generic safety battery + the persona's quality pack and returns a `ready` verdict. The runner
  gates on it: a persona that isn't ready is **pinned to observe** (watched, placing nothing) no matter
  what `SKYNET_AUTONOMOUS_MODE` says — enablement requires a green readiness result, not just an env var.
  Strict by design: no pack, any safety violation, or a sub-threshold score ⇒ not ready.
- **P1.2 Expand the eval battery. ✅ shipped.** The generic safety battery grew from 9 → 15 scenarios,
  adding the market-shock cases the readiness gate should demand: flash-crash, short-squeeze,
  missing-quote (blind on price), Infinity values, overnight-gap, and an underwater account. All 8
  personas survive all 15 (`npm run eval:safety`); a spec pins the new ids so they can't be dropped.

### Phase 2 — Observability _(offline + board)_
- **P2.1 Bot decision view. ✅ shipped.** A bot's `/u/:id` profile now shows an **Autonomous decisions**
  panel — recent cycles with mode (LIVE / OBSERVE / HALTED) + per-intent outcome + rationale, read from
  the P0.2 audit trail (`readDecisions` ← `JsonlAuditStore`, wired when `SKYNET_AUDIT_DIR` is set).
  Bots only; an honest seam when no trail is wired.
- **P2.2 Live autonomous cycles on the board.** _(next)_ Wire the audit/CycleReport stream so an
  autonomous cycle is visible as it happens (SSE), not just after a fill.

### Phase 3 — Hosting & cadence _(the laptop problem; Eric authorizes the deploy)_
- **P3.1 Market-hours gating.** The runner only assesses when the market is open (Alpaca calendar/clock),
  and sleeps otherwise. Pure logic — offline-testable with a fake clock.
- **P3.2 Always-on host.** Run the autonomous runner as a **Fly machine** (or scheduled worker) carrying
  the bot secrets, so it runs without Eric's laptop. **I build the mechanism; Eric provisions the secrets
  and the hosting spend.**

### Phase 4 — Market-open validation _(Eric, live, one market open)_
- **P4.1** Enable **one** persona (day-trader) in **observe** mode on a market open. Watch decisions
  stream to the audit log with **no placement**. Confirms the read is sane before any order.
- **P4.2** Flip that persona to **live paper**. Watch it place; the board reflects it; verify the kill
  switch halts it instantly.

### Phase 5 — Bare-minimum gameplay
- **P5.1** A human account and the enabled bot both live on the board; the Bots-vs-Humans / Leaderboard
  scoreboard frames the match (a "live match" read + standings). Mostly framing on top of what exists.

---

## Eric's irreversible-class steps (never self-authorized)

- The **autonomous-enable flag** per persona (and the observe→live flip).
- **Bot Alpaca paper secrets** (`SKYNET_BOT_<PERSONA>_KEY/SECRET` as Fly secrets).
- **Hosting spend** (the Fly machine for the always-on runner).
- **Go-live on a market open** (Phase 4).

Everything else — observe mode, audit log, kill switch, breakers, the readiness gate, market-hours
gating, the decision view — is safe, offline, and mine to build and verify.

## Recommended first pickup

**Phase 0 (safety substrate)** — observe mode + audit log + kill switch. It's pure engine work,
verifiable offline with the in-memory broker, and it's the safe foundation every later phase reads from.
Nothing places a real order until Eric explicitly flips a persona to live in Phase 4, so this whole
substrate can be built and merged without touching a credential.
