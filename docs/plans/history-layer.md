# Plan: the history layer — from silently recording to actually consumed

**Status:** draft <!-- awaiting Eric's refinement pass + ready flip -->
**Author:** Claude (proposing) · **Date:** 2026-08-10
**Research basis:** 4-agent deep-read (seam, consumers, ops, game-layer demands), all claims cited to file:line.

## The premise inversion (read this first)

Three docs (THE-GAME.md:185-189, GAMEBOARD-PLAN.md:55-56, IDEAS.md:156-159) call "flip the prod
sampler" the one Eric-owned blocker. **That flip already merged** — `fly.toml:18` sets
`SKYNET_HISTORY_DIR=/data/history` on the mounted `skynet_data` volume (commit `c335bd0`, on `main`),
and the 5-minute sampler runs unconditionally (`src/scripts/serve-dashboard.ts:59-71`). History is
accruing in prod right now. So this plan is not "turn it on" — it is **make durable history trustworthy
and consumed**: today the only reader is the `/u/:id` sparkline panel, while a fully-built metrics
layer (`history-metrics.ts` — zero production callers), a ceremony event stream (derived, pushed,
rendered by nothing), and the academy's server-side progression all sit unwired.

## Intent & end-state

Durable history stops being a write-only artifact. End-state, in order of load-bearing-ness:

1. **The data is trustworthy**: realized P/L survives restarts (today it resets to 0 every deploy —
   `reduce.ts:74-77` accumulates in memory; `GAPS-2026-08.md:46-48` — writing false cliffs into the
   permanent record and threatening false `took_profit` ceremonies).
2. **The board reads it**: windowed deltas and the doubling trophies light up the views that today
   render "coming once we have history" seams — using the already-built, already-tested pure functions.
3. **Ceremonies survive restarts**: transition derivation replays from durable samples instead of an
   in-memory prev-map (`history-sampler.ts:45` — today every restart forgets its baseline), with
   fire-once idempotency, so the data path is ready for the taste-gated visual layer later.
4. **The record stops lying**: the stale "one Eric-owned op" claims and the volume-contents docs are
   corrected (semantic rot the doc-rot gate can't see).

Not in this plan (see non-goals): the per-fill trade ledger (GAMEBOARD-PLAN rules it S7+), ceremony
*visuals* (Eric-taste-gated), academy server persistence (blocked on viewer↔participant identity —
queued as a refinement question).

## Acceptance criteria (EARS)

**Slice 1 — realized-P/L durability (the prerequisite for everything below)**
- [ ] WHEN the dashboard server boots, the observatory shall seed each participant's cumulative
      `realizedPl` from that participant's most recent durable history sample. — *verify: spec — boot
      against a fixture store, first rendered snapshot carries the persisted value*
- [ ] IF a participant has no history samples, THEN rehydration shall leave `realizedPl` at 0 (the
      current honest default). — *verify: spec*
- [ ] WHEN a deploy restarts the server, the recorded sample stream shall show no realized-P/L cliff
      to zero. — *verify: spec — sample sequence across a simulated restart is monotone-continuous*

**Slice 2 — windowed reads**
- [ ] WHEN a consumer requests history since a timestamp, the store shall return only samples at or
      after it, without loading unbounded history into every render path. — *verify: spec on
      `list(participantId, {since})`*
- [ ] WHEN a cross-participant metric needs all histories, a single read path shall serve them
      (`readAllHistory` on `DashboardServerConfig`), offline mode omitting it honestly. — *verify: spec*

**Slice 3 — metrics light up the board**
- [ ] WHEN a participant has ≥2 samples spanning a day, the leaderboard shall show a daily equity
      delta (from `changeOver`, honest `partial` flag rendered as such). — *verify: spec + offline render*
- [ ] WHEN any account has doubled its seed, the bots-vs-humans view shall surface the
      first-to-double trophy (`firstAccountToDouble`). — *verify: spec + offline render*
- [ ] WHEN history is absent (offline/no samples), every new panel shall render its honest
      still-accruing seam, never a fabricated number. — *verify: spec*

**Slice 4 — ceremony data path (data only, no visuals)**
- [ ] WHEN the server boots, transition derivation shall re-baseline from the last durable sample per
      participant, so a restart does not swallow (or double-fire) transitions. — *verify: spec*
- [ ] WHEN a transition is derived, it shall carry a deterministic id (participantId + sample
      timestamps), so replay/reconnect can be de-duplicated fire-once. — *verify: spec*

**Slice 5 — the record tells the truth**
- [ ] WHEN this plan ships, THE-GAME.md / GAMEBOARD-PLAN.md / IDEAS.md shall no longer describe the
      sampler flip as pending, and DEPLOY.md/RUNNING.md shall describe what the volume actually holds
      (accounts + history) and the backup posture. — *verify: grep + doc-rot scan stays 0*

## Constraints & non-goals

- **Honesty invariants:** no fabricated numbers; partial windows say so; absent history renders seams.
- **Additive, reversible:** no change to the JSONL on-disk format (append-compatible only); no
  pruning/compaction (retention is Eric's open fork — see questions).
- **Arch budgets:** `history-sampler.ts` is pinned at exactly 64 lines, `history-store.ts` at 110
  (`arch-budget.json:46-47`) — new logic lands in new modules (e.g. `history-rehydrate.ts`), not by
  growing pinned files past their caps.
- **Non-goal:** per-fill LedgerEvent log (win rate, "which plays worked", discipline renown, HIT/MISS
  feed) — GAMEBOARD-PLAN.md:34,59 rules it S7+; this plan shapes nothing against it.
- **Non-goal:** ceremony visual treatment — explicitly taste-gated (`serve-dashboard.ts:63-65`);
  slice 4 readies the data path only.
- **Non-goal:** renown scoring — needs Eric's five open forks (THE-GAME.md:200-211) settled first.

## Pre-settled forks (proposed — confirm or veto at refinement)

- **Rehydration source** → the durable history store itself (last sample per participant at boot), not
  a new ledger file. Cheapest correct fix; a dedicated realized ledger can supersede it at S7+.
- **Windowed reads** → extend `HistoryStore.list` with an optional `{since}` arg (backward-compatible)
  rather than a new streaming API. The scaling cliff is years away at 5-min cadence; simplest thing.
- **Metrics placement (data, not look)** → daily delta column on the leaderboard; first-to-double
  trophy on bots-vs-humans. *Placement* is proposed here; final *look* ships behind an offline render
  Eric judges by eye before merge (the visual-work carve-out holds).
- **Transition id** → `participantId:prevAt:nextAt` string, derived not stored — idempotent by
  construction, no store-format change, satisfies GAMEBOARD-PLAN's fire-once-by-seq intent.
- **Doc corrections ride the slices that make them true** (no separate docs PR), keeping the doc-rot
  budget at 0 throughout.

## Autonomy envelope

- Slices 1, 2, 4, 5: structural/correctness — auto-merge on green (default policy).
- Slice 3: data wiring auto-merges; the *rendered* panels are visual work — offline render screenshots
  posted for Eric's eye; merge waits for his nod unless he pre-authorizes at refinement.
- Nothing here touches credentials/spend/outward-facing surfaces. One optional credentialed act exists
  (see question 1) and is Eric's.

## Refinement questions for Eric (batched — the ball was in my court; these survived)

1. **Prod verification (1 minute, yours):** the flip is merged, but only a green deploy makes it live.
   `fly ssh console -a skynet-capital -C "ls /data/history"` — a list of `*.jsonl` files confirms
   history is really accruing. Want to run it, or trust the pipeline?
2. **Retention (GAMEBOARD-PLAN fork 3, needs your ratification):** the game design silently assumes
   forever (city persists, first-to-double, transcript). Proposed: **keep everything, forever** —
   ~13 MB/participant/year makes pruning premature. Ratify or bound it.
3. **Backup posture:** today the only net is Fly's platform daily snapshots (~5-day retention),
   documented nowhere. Proposed: document that as the accepted posture now; an explicit off-machine
   export (touches credentials/spend) queued separately for your gate. OK?
4. **Per-position digest in samples:** extending the sampler to also record a small per-position
   digest would cheaply unlock the *ground-break* ceremony (a buy is equity-invisible today) and
   per-tower topping-out. Schema-additive but a real scope add (~+1 slice). In, or later with the
   ledger?
5. **Academy server persistence:** blocked on a real viewer↔participant identity link (today
   best-effort by display name — `dashboard-server.ts:309-314`). Defer to the Alpaca-OAuth identity
   work (my recommendation), or accept name-keyed best-effort now?

## Open questions (Q&A queue)

_(empty — refinement owns getting these to zero before ready)_

## Decision log

_(empty until execution)_
