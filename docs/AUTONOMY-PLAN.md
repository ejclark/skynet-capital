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

### Phase 0 — Safety substrate _(offline; my recommended first pickup)_
- **P0.1 Observe mode.** `AutonomousTrader` gains a `mode: "observe" | "live"`. In observe it computes
  and records intents but **places nothing**. Wired to `SKYNET_AUTONOMOUS_MODE` (default `observe` — safe
  by default). Unit-tested against the in-memory broker (asserts zero orders placed in observe).
- **P0.2 Audit log.** Every decision — observed or placed — is appended to a JSONL **audit store**
  (mirror `jsonl-cycle-report-store.ts`): timestamp, persona, context snapshot, raw intents, guard
  actions (what was clamped/dropped and why), and the resulting order or "observed only." This is the
  record everything else reads.
- **P0.3 Kill switch + circuit breakers.** A **halt** the loop checks every cycle (a flag file / env /
  small endpoint), plus **auto-halt** on breach conditions: daily-loss cap, order-rate ceiling,
  cash/position-cap breach, repeated API errors, or a data gap (stale/NaN quotes). Halting is instant and
  logged. Offline-testable by feeding breach scenarios.

### Phase 1 — The readiness gate _(offline)_
- **P1.1 Readiness registry.** Record `eval:persona` results (id, score, pass/fail, timestamp). The
  runner **refuses to trade** a persona that hasn't passed at/above threshold — enablement requires a
  green readiness result, not just an env var.
- **P1.2 Expand the eval battery** to the safety-critical scenarios named in `AUTONOMY-READINESS.md`
  (crash, squeeze, gap, missing-quote, NaN, rate shock). Surface the confidence number the gate reads.

### Phase 2 — Observability _(offline + board)_
- **P2.1 Bot decision view.** Surface the P0.2 audit log: extend `/u/:id` for bots (or a small
  `/u/:id/decisions`) to show recent autonomous decisions + rationale + guard actions. Read-only.
- **P2.2 Live autonomous cycles on the board.** Wire the audit/CycleReport stream so an autonomous cycle
  is visible as it happens (SSE), not just after a fill.

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
