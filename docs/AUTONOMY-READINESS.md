# Autonomy readiness — evals as the gate to autonomous trading

**Status:** plan (not yet built). **Hard gate:** no persona trades autonomously until it passes this
readiness eval **and** Eric enables it (irreversible class — see `CLAUDE.md` → hard boundaries).

This doc is the "comprehensive plan in place" that must precede enabling autonomous trades. It also
doubles as a primer, because building evals is new to us.

---

## 1. What an eval actually is (the primer)

An **eval** is an automated **fitness test**: you feed a system a battery of scenarios, check its
outputs against what a good actor would do, and roll the results into a **score**. It's the same idea
as a unit test, but graded on a spectrum ("how good / how safe") rather than pass/fail, and aimed at
**judgment** ("did it make a sound decision?") rather than a single correct return value.

For us the "system under test" is a **persona** — a named strategy. The eval asks: *given this market
situation and this portfolio, what orders did the persona decide to place, and were they safe and
sound?* Run enough varied scenarios and the aggregate score is a **confidence number** we can put a
threshold on. Above the threshold → the persona is a candidate for autonomous trading. Below → it keeps
practicing (or a human keeps the wheel).

**Why our codebase is unusually ready for this.** A persona is a **pure function**:

```
persona.decide(context, portfolio) -> OrderIntent[]     // src/personas/persona.ts
```

No I/O, no randomness, no clock — *same inputs always produce the same orders*. That means an eval is
just: build a `MarketContext` + `Portfolio` fixture, call `decide`, and assert/score the intents. Risk
limits live separately in `applyGuards` (`src/engine/guards.ts`), so we can score the **raw judgment**
(what the persona *wanted*) and the **guarded outcome** (what the engine *allowed*) independently.

---

## 2. Pre-reqs to enabling autonomous trade (the checklist)

Autonomy turns on only when **all** of these are true. Think of it as the character's readiness sheet.

1. **Persona spec is declarative + versioned** — a persona's strategy, risk appetite, and its
   *moral/ethical boundaries* (paper-only, forbidden tickers, max exposure, must-honor stop-loss,
   disciplined profit-taking) are data we can inspect, diff, and test. (Today personas are code; the
   creation flow will let users author them — see §6.)
2. **Risk guardrails are enforced at the engine, not trusted to the persona** — already true
   (`applyGuards`). Autonomy must *depend on* the guard layer, never on the persona behaving.
3. **The readiness eval exists and the persona passes it** (§3–4) above a confidence threshold.
4. **A dry-run / observation mode** — on market open, the persona initiates *paper* trades with **no
   human interaction**, while a human watches, with a **kill switch** (§5). This is the only step that
   needs the market open; everything above is offline.
5. **Audit + circuit breakers** — every autonomous order is logged with its rationale; a breaker halts
   the persona on anomalies (e.g. N losing trades in a row, drawdown limit, an unexpected order type).
6. **Governance sign-off** — Eric flips the enable flag per persona. Never self-authorized.

Note the sequencing: **1–3 and 5 are buildable now, offline.** Only **4** waits for market open, and
only **6** is a human gate. "Prep the process for market open" = get 1–3+5 green so that on the next
open we can *observe* step 4.

---

## 3. The readiness eval — scenario battery

Scenarios are hand-built `MarketContext` + `Portfolio` fixtures (plus some drawn from replayed history
once the history layer lands). Categories, each probing a different failure mode:

- **Signal soundness** — a clean setup for the persona's thesis (e.g. momentum up for a momentum
  persona). Expect: it acts, in the right direction, sized sanely.
- **No-signal discipline** — flat / noisy tape. Expect: it does *nothing* (doesn't overtrade).
- **Adversarial / stress** — a crash, a squeeze, a gap, a data gap (missing quote), a NaN. Expect: it
  never crashes and never places a reckless order; degrades safely.
- **Risk-boundary probes** — a setup that tempts an oversized or cash-breaching order. Expect: the
  persona may over-ask, but the **guarded** result respects `maxPositionPct` and cash, and never shorts.
- **Ethics / persona-fidelity** — forbidden ticker, wrong-regime play, a "greedy" temptation. Expect:
  it stays inside its declared strategy and boundaries.
- **Discipline over time** (needs a short multi-step replay) — takes profit per its rule, cuts losers,
  doesn't revenge-trade.

Each scenario declares its **expectations** as data, so adding scenarios is cheap and reviewable.

## 4. Scoring → a confidence number

Two tiers, because they fail differently:

- **Safety gates (hard pass/fail).** Any violation = **not ready**, regardless of score: shorting,
  cash breach, position-cap breach after guards, a crash/throw, an order in a forbidden ticker, trading
  a `LIVE` account when the persona is paper-only. These are non-negotiable.
- **Quality score (0–100, weighted).** Among safe runs: signal accuracy, no-trade discipline, sizing
  sanity, persona fidelity, and (with replays) realized-P/L discipline. Weighted sum → the confidence
  score.

**Ready** = passes every safety gate **and** quality ≥ threshold (start strict, e.g. 85, tune with
evidence). Output is a small report: per-scenario result, the score, and *why* it failed — the same
artifact a user's persona-setup issue (§6) needs to show "you're not ready yet, here's what to fix."

## 5. Market-open observation protocol (step 4)

Once a persona is eval-ready, the *only* thing left needs a live market:

1. Enable the persona in **observe mode** against a **paper** Alpaca account (never live cash first).
2. On market open it runs the same `AutonomousTrader.evaluate` loop unattended — a human watches orders
   appear *without touching anything*. This is the actual proof the user described: "observe trades
   being initiated without human interaction."
3. A **kill switch** halts it instantly; circuit breakers auto-halt on the §2.5 conditions.
4. Review the session's audit log; graduate to a longer leash only on clean observed behavior.

---

## 6. How this powers the bot-creation flow (the payoff)

The eval *is* the low-barrier on-ramp the vision wants (see `IDEAS.md` → bot creation):

- A user stands up a bot (account setup identical to a human's), then authors a **persona** like a D&D
  character sheet — including its moral/ethical trading boundaries.
- Setup can run **through GitHub issues**: Claude picks up the issue, and the **readiness eval is the
  rubric** — it runs the persona, comments back with the score and the specific scenarios that failed,
  and iterates with the user until the persona **passes the eval**, which is what unlocks the
  autonomous-trade enable step (Eric's flag).
- This removes the clunky Alpaca UI from the user's path entirely: they spend their time **crafting a
  persona that trades well**, not wrestling a broker console — and it teaches options + risk by doing.
- New competitive axis: **you vs. your own bot personas**, and your bots vs. everyone else's.

## 7. Suggested build order (all offline except the last)

1. **Eval harness skeleton** — a scenario type, a runner over `decide` + `applyGuards`, the safety-gate
   + quality-score model, and a readable report. Wire it as `npm run eval:persona`.
2. **First scenario pack** — port/extend the existing per-persona BDD specs into scored scenarios; add
   the adversarial + risk-boundary probes.
3. **Persona spec surfacing** — make the declarative persona fields (risk, boundaries) explicit so the
   eval and the future author-flow read the same data.
4. **Audit log + circuit breakers** in the autonomous loop.
5. **Observe mode + kill switch** — then, on a market open, run step 4 and watch.

Steps 1–4 need no market and no live account — they're the "prep for market open" work. Step 5's live
observation is the payoff on the next open, behind Eric's enable flag.

---

_Owner: Eric (governance gate). Built by Claude up to the enable flag. This plan supersedes ad-hoc
"is the bot ready?" judgment with a measured, improvable score._
