# Plan: the history layer — from silently recording to actually consumed

**Status:** executing <!-- Eric: "Plan looks good. we are aligned. execute" (2026-08-10) -->
**Author:** Claude (proposing) · **Date:** 2026-08-10
**Provenance:** 4-agent research pass (seam, consumers, ops, game demands) → draft → 3-critic
adversarial pass (contract, factual truth, execution safety; 3 blocking + 8 important findings folded
in). Claims cite file:line.

## The premise inversion (read this first)

Three docs (THE-GAME.md:185-189, GAMEBOARD-PLAN.md:55-56, IDEAS.md:156-159) call "flip the prod
sampler" the one Eric-owned blocker. **That flip already merged** — `fly.toml:18` sets
`SKYNET_HISTORY_DIR=/data/history` on the mounted `skynet_data` volume (commit `c335bd0`, on `main`),
and the 5-minute sampler runs unconditionally (`src/scripts/serve-dashboard.ts:59-71`). History is
accruing in prod now. So this plan is not "turn it on" — it is **make durable history trustworthy and
consumed**. Today the only reader is the `/u/:id` performance panel; the built-and-tested metrics
layer (`history-metrics.ts` — zero production callers), the ceremony transition stream (derived,
pushed, consumed by nothing — the reducer drops it at `reduce.ts:26-28` and the hub short-circuits on
identical state), and the views' honest seams ("light up here once we've recorded your history" —
`render-dashboard.ts:282,313`; "once we've recorded trade history" — `compare-view.ts:160`) all wait.

## Intent & end-state

Durable history stops being a write-only artifact, without ever implying a false number:

1. **The realized-P/L record becomes continuous** — today it resets to 0 on every deploy
   (`reduce.ts:74-77` accumulates in memory; Alpaca reads never carry it; `GAPS-2026-08.md:46-48`),
   writing false cliffs into the permanent record.
2. **The board reads history** — windowed deltas + the doubling trophy light up via the already-built
   pure functions, honestly labeled.
3. **Ceremony transitions get a safe, restart-aware data path** ready for the taste-gated visual
   layer later.
4. **The record stops lying** — the stale "one Eric-owned op" claims and volume docs corrected.

## Acceptance criteria (EARS)

**Slice 1 — realized-P/L continuity (prerequisite for everything below)** — ✅ shipped (PR #290)
- [x] WHEN the dashboard server boots in live mode, it shall seed each participant's cumulative
      `realizedPl` from that participant's **max-`at`** durable sample (list order is unguaranteed —
      `history-store.ts:27`), merged into `initial` **before** `ObservatoryHub` construction, before
      streams, before the sampler. — *verify: spec — boot against a fixture store; first snapshot
      carries the persisted value; a fill arriving pre-seed cannot be clobbered (ordering is
      structural, not temporal)*
- [x] WHEN rehydration completes at boot, the server shall write one synchronization sample so the
      durable stream has a fresh, trusted baseline. — *verify: spec*
- [x] IF a participant has no history samples, THEN `realizedPl` shall stay 0 (the honest default). —
      *verify: spec*
- [x] WHEN a participant with existing history re-onboards via `/add`, the seed-sample path shall not
      write a `realizedPl: 0` sample over their record (idempotent or carrying the rehydrated value —
      today's `?? 0` at `serve-dashboard.ts:97` would re-introduce the cliff). — *verify: spec*
- [x] WHEN a JSONL line is torn/malformed (crash or ENOSPC mid-append), history reads shall skip and
      log it rather than throw — today `JSON.parse` escapes `readJsonlEntries`
      (`jsonl-store.ts:28-39`), and after this slice the newest line is exactly the one boot reads. —
      *verify: spec with a truncated-line fixture*
- [x] WHEN the server runs offline (fixture replay), it shall use an in-memory history store and skip
      rehydration — the looping replay (`replay-event-stream.ts:39-46`) re-books realized P/L each
      loop, so a durable offline store + rehydration would compound fabricated P/L per restart. —
      *verify: spec — two offline boots against the same fixture yield identical `realizedPl` and
      identical rendered panels*

**Honesty bound (stated, accepted):** rehydration restores continuity, not perfection. Fills in the
≤5-minute tail before a shutdown and fills during dashboard downtime (the bots process trades on —
`fly.toml` runs it separately) are permanently unobserved; the recorded value is a documented
undercount at those boundaries, never an overcount. True backfill needs the S7+ ledger / Alpaca
activities read — a named non-goal here.

**Slice 2 — windowed reads**
- [ ] WHEN a consumer passes `{since}` to `list`, the store shall return only samples at or after it.
      Whole-file reads remain (the JSONL primitive parses the full file — `jsonl-store.ts:57-64`);
      accepted at 5-min cadence, revisit at the years-away scaling cliff. — *verify: spec*
- [ ] WHEN a cross-participant metric needs all histories, `readAllHistory` on
      `DashboardServerConfig` shall serve them; the export path (`export-dashboard.ts` — renders with
      no history plumbing) and store-less test renders shall degrade to the honest seams via
      optional-with-seam view signatures. — *verify: spec + export render*

**Slice 3 — metrics light up the board**
- [ ] WHEN a participant has ≥2 samples spanning a day, the leaderboard shall show a daily equity
      delta (`changeOver`, honest `partial` flag rendered as such). — *verify: spec + offline render*
- [ ] WHEN any account's equity reaches 2× its **first recorded sample**, bots-vs-humans shall
      surface the first-to-double trophy, labeled "since first sample" — `firstAccountToDouble`
      measures from the earliest sample (`history-metrics.ts:67-80`), which for members predating
      sampling is *not* their true seed; the label carries that honestly. — *verify: spec asserts the
      label text*
- [ ] WHEN history is absent or under-windowed, every new panel shall render its honest
      still-accruing seam, never a fabricated number. — *verify: spec*
- [ ] WHEN Eric taste-judges the offline render, the history behind it shall be deterministic — a
      committed `fixtures/offline/history/` seed read into the in-memory store, so screenshots can't
      be polluted by prior-run leftovers in `data/history` (today's unconditional durable store makes
      offline trophies fabricatable). — *verify: spec — two consecutive offline boots render
      identical panels*

**Slice 4 — ceremony data path (data only, no visuals)** — ✅ shipped (PR #291)
- [x] WHEN the server boots, transition derivation shall baseline **from the present** — the boot
      synchronization sample — never from pre-restart durable samples. Downtime transitions are
      deliberately swallowed (they were never observed; deriving them from stale cash deltas would
      fire ceremonies for pre-restart activity at boot, and a silently-failed pre-crash save would
      re-fire already-celebrated ones). — *verify: spec — a restart between two samples derives
      nothing across the gap; post-boot pairs derive normally*
- [x] WHEN a transition is derived, it shall carry an opaque compare-only id
      `type:participantId:prevAt:nextAt` (type included — one `(prev,next)` pair can emit both
      `took_profit` and `deployed_capital`; omitting type would dedupe a real ceremony). Fire-once is
      scoped to **within a session / across SSE reconnects** — cross-restart dedupe would need a
      fired-ledger and is unnecessary under baseline-from-present. — *verify: spec*
- [x] WHEN transitions are delivered, they shall ride a channel that bypasses the state fold — today
      `reduce` returns identical state and the hub short-circuits (`observatory-hub.ts:29-31`), so
      transitions reach zero listeners; and delivery must not trigger a full-board re-render per
      transition (the WorldPatch gap, `GAPS-2026-08.md:41-44`). — *verify: spec on the hub channel;
      no reducer state change per transition*

**Slice 5 — the record tells the truth**
- [ ] WHEN this plan ships, `grep -rn "one Eric-owned op\|turn the prod sampler on NOW\|cheapest
      unblocking act" docs/` shall exit non-zero (the stale claims live at THE-GAME.md:186-189,
      GAMEBOARD-PLAN.md:55-56, IDEAS.md:156-159), DEPLOY.md/RUNNING.md shall describe what the volume
      actually holds (accounts + history) and the snapshot-only backup posture, and the doc-rot scan
      shall stay at 0. — *verify: the named greps + `npm run docrot:scan`*

## Constraints & non-goals

- **Honesty invariants:** no fabricated numbers; partial windows say so; absent history renders
  seams; the slice-1 honesty bound is documented where the number renders.
- **Additive, reversible:** no change to the JSONL on-disk sample format; a *new* additive file is
  allowed if ever needed, rewriting existing ones is not. No pruning/compaction (retention is Eric's
  fork — Q2).
- **Arch budgets (precise):** `history-sampler.ts` is at its cap (64/64) — the transition prev-map
  and derivation move *out* into new modules (e.g. `transition-baseline.ts`), shrinking the sampler,
  not growing it. `history-store.ts` has headroom (80/110) — the `{since}` filter lands in place.
  `leaderboard-view.ts` (93/94) and `compare-view.ts` (164/165) are at their caps — slice-3 panels
  land as new modules those views only compose.
- **Corrupted prefix (pre-settled — veto if you'd rather repair):** samples predating the slice-1 fix
  keep their false cliffs; consumers of realized-P/L *transitions* treat pre-fix samples as untrusted
  (baseline-from-present already guarantees this for ceremonies), and cumulative displays label from
  rehydration onward. The permanent record is never rewritten. If you want the prefix *repaired*
  (rewriting history files), that touches the permanent record and is yours to order explicitly.
- **Non-goal:** per-fill LedgerEvent log (win rate, "which plays worked", discipline renown, HIT/MISS
  feed, downtime backfill) — GAMEBOARD-PLAN.md:34,59 rules it S7+.
- **Non-goal:** ceremony visual treatment — taste-gated (`serve-dashboard.ts:63-65`); slice 4 readies
  data only.
- **Non-goal:** renown scoring — behind Eric's five open forks (THE-GAME.md:200-211).

## Pre-settled forks (proposed — confirm or veto at refinement)

- **Rehydration source** → the history store itself (max-`at` sample per participant at boot); a
  dedicated realized ledger can supersede at S7+.
- **Boot ordering** → read store → build seeded `initial` → construct hub → write boot sample → start
  streams + sampler. Structural, spec-pinned.
- **Transition baseline** → from the present (boot sample), never the durable past. Downtime
  transitions swallowed, honestly.
- **Windowed reads** → optional `{since}` on `list` (filters results; whole-file I/O accepted).
- **Metrics placement (data, not look)** → daily delta on leaderboard; first-to-double trophy on
  bots-vs-humans; labels say "since first sample." Final look ships behind an offline render you
  judge by eye.
- **Doc corrections ride the slices that make them true** — doc-rot budget stays 0 throughout.

## Autonomy envelope

- Slices 1, 2, 4, 5: structural/correctness — auto-merge on green (default policy).
- Slice 3: data wiring auto-merges; rendered panels are visual work — offline render screenshots
  posted for your eye (see Q6 for the merge mechanics).
- Nothing touches credentials/spend/outward-facing. The one optional credentialed act is Q1, yours.

## Refinement questions for Eric (batched; each answerable in a word or two)

1. **Prod verification (1 minute, yours):** `fly ssh console -a skynet-capital -C "ls /data/history"`
   — `*.jsonl` files listed = history really accruing since the last deploy. Run it, or trust the
   pipeline?
2. **Retention:** proposed **keep everything forever** (~13 MB/participant/year; the game design
   assumes it — city persists, first-to-double, transcript). Ratify?
3. **Backup posture:** today the only net is Fly's platform daily snapshots (~5-day retention),
   documented nowhere. Proposed: document that as accepted-for-now; an explicit off-machine export
   (credentials/spend) queued separately for your gate. OK?
4. **Per-position digest in samples:** schema-additive extension that would cheaply unlock the
   *ground-break* ceremony (a buy is equity-invisible in samples) and per-tower topping-out. Real
   scope add (~+1 slice). In now, or later with the ledger?
5. **Academy server persistence:** blocked on a real viewer↔participant identity link (today
   best-effort by display name — `dashboard-server.ts:309-314`). Recommendation: defer to the
   Alpaca-OAuth identity work. Agree?
6. **Slice-3 merge mechanics:** once you've approved the offline screenshots, pre-authorize
   merge-on-green for those panel PRs, or hold each for your nod?

## Open questions (Q&A queue)

_(empty — refinement owns getting these to zero before ready)_

## Decision log

- **Reading of the ready-flip (2026-08-10).** Eric's "Plan looks good. we are aligned. execute" is
  taken as the flip **with all six proposed answers standing** (each question carried a
  recommendation). Recorded rather than assumed silently; the two readings where I chose the
  conservative branch: **Q4** per-position digest → *later, with the ledger* (no scope add), and
  **Q6** slice-3 panels → *held for Eric's nod* (taste carve-out unchanged). Say the word if either
  reading is wrong.
- **Q1 prod verification not run.** `fly ssh console` is credentialed and outward-facing — Eric's, per
  the hard boundary. Non-credentialed corroboration used instead: `fly.toml:18` is on `main` and the
  pipeline deploys on every push, so the env is live as of the last green deploy.
- **Slice 1 landed as a new module** (`src/observatory/history-boot.ts`) rather than inline wiring —
  `serve-dashboard.ts` is at its arch cap (152/152), and the boot ordering is load-bearing enough to
  deserve its own spec. The script got *smaller*.
- **Seed-sample idempotency chosen over "carry the rehydrated value"** for the `/add` re-onboarding
  case — skipping a redundant write is simpler and strictly safer than computing a value on a path
  that must never block onboarding.
- **Slice order changed: 4 before 2 and 3.** Slices 2 (`{since}`, `readAllHistory`) and 3 (panels)
  both land plumbing with no consumer until the panels exist, and the panels are held for Eric's eye.
  Slice 4 fixes a live latent bug and builds directly on slice 1's boot sample, so it went first;
  slice 2's read API will ship *with* its slice-3 consumer rather than as unused surface.
- **Ceremony channel became its own module, not a hub method.** The first cut put
  `emitTransition`/`subscribeCeremonies` on `ObservatoryHub` and blew its arch budget (75 > 51). The
  gate was right: the hub's job is the state fold and this is the deliberate *bypass* of it, so
  `CeremonyChannel` stands alone. Budget respected, cohesion improved.
- **The `world_transition` event variant was deleted, not left dormant.** With ceremonies on their own
  channel it had no producer, and the reducer branch it fed was unreachable — dead code by the
  mortician's definition, buried in the same PR that orphaned it.
- **Browser delivery deliberately not wired.** A named SSE event with no client listener is dead
  plumbing; the channel is spec-verified server-side and the browser hop lands with the visual slice.
- **Torn-line guard logs and skips** (`jsonl-store.ts`) rather than failing loudly: the newest line is
  exactly what boot rehydration reads, so a torn byte must not fail startup. Behavior guard only — the
  append-compatible format constraint holds.
