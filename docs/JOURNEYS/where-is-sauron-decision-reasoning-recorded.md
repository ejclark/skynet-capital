# Journey — where is Sauron's decision reasoning recorded, and can it be trusted?

_Started 2026-09-22. Status: **closed** — PRs #3576–#3579 shipped; the trail is live, the CI break
that masked it is fixed, and a doctrine loop now watches the persona's own coded rules for drift._

---

## The question, verbatim

> 1. What do you need from me to start? Is you building a plan, integrating and war gaming said
> plan good enough for now?
> 2. I see nothing under Saurona activity with this information.

Followed, after a wrong hypothesis was floated and falsified:

> I don't see anything that represents Sauron's thought process on either activity section. What
> am I missing?

Then, after being asked to check the raw API directly, no prose — just the screenshot of
`{available: false, kind: "bot", cycles: []}`.

---

## Where it stands

Four PRs, in the order the investigation actually forced:

| # | PR | What it fixed |
|---|---|---|
| 1 | #3576 | `openDecisionDb()` never created its parent directory — the actual root cause |
| 2 | #3577 | `@playwright/test` 1.63.0 (dependabot #3370) broke test collection repo-wide, found while checking #3576's own CI |
| 3 | #3578 | Docs note: `integration tests` isn't wired as a required merge check (why #2 went unnoticed 11 hours) |
| 4 | #3579 | `doctrine-scan.mjs` + the first per-bot dossier (`docs/BOTS-SAURON.md`) — PR 8 of issue #2287 |

None of this was visible from the outside: every decision-transparency feature shipped earlier that
day (reasoning, vitals, funnel, expectancy, retrospectives) was silently dark in production, and
docs/IDEAS.md carried a same-day note claiming the opposite ("verified... wired in prod").

---

## What moved, and what moved it

### 1. "Sauron is probably in observe/dry-run mode"

**Claim** — Claude, reading `fly.bots.toml`'s `SKYNET_AUTONOMOUS_MODE = "observe"` default,
concluded the empty activity feed was by design, not a bug. **Challenge** — the user posted three
screenshots: real filled Sauron trades today (AMZN, MRVL, TSLA, GOOGL, META) with real prices and
P&L, on both the account and global activity feeds. **Resolution** — the hypothesis was flatly
wrong; Sauron was trading live. Claude acknowledged it explicitly and pivoted to root-cause mode
rather than defending the guess.

### 2. "The stale-UI-copy PR or a missing env var explains the empty Decisions tab"

**Claim** — a same-day PR (#3532) had touched the "not wired" message text, and `SKYNET_AUDIT_DIR`
had a documented history of being unset. Either looked like a plausible cause. **Challenge** —
reading #3532's actual diff showed it changed wording only, never the `trail.available` condition;
reading `fly.toml` confirmed `SKYNET_INSIGHTS_DIR` was correctly pinned. **Resolution** — both ruled
out by direct evidence before spending anything expensive (a GitHub Actions run, a redeploy) —
"free diagnostics before gated ones" held up as the right ordering here.

### 3. "The decision audit trail is verified wired in prod" (docs/IDEAS.md, added earlier that day)

**Claim** — a different, parallel Claude session, while shaping issue #3527, wrote: *"the decision
audit trail (`DecisionDb`) is wired in prod (verified while shaping issue #3527)."* **Challenge** —
this session's user hit the raw `/api/desk/sauron/decisions` API directly and got
`available: false`. **Resolution** — the earlier claim was made in good faith but not actually
verified against a live request; it was wrong. Left uncorrected in this window (deliberately —
`docs/LESSONS.md`'s own convention is dated entries are historical record, not something to rewrite
after the fact); the live behavior is now the correction.

### 4. "The breaker in PR 8 should be trade-insights-loop.md's full insight-nudge system"

**Claim** — the plan text says PR 8 includes "the effectiveness breaker... `trade-insights-loop.md`
slice 3 is unbuilt, sanctioned and pre-argued." Read literally, that could mean building the whole
promotion-ladder-gated insight system. **Challenge** — that system's slices 1–2 (retrospective
capture feeding same-day nudges, the promotion ladder itself) don't exist yet; the breaker has
nothing real to gate today. **Resolution** — shipped `DoctrineEffectivenessBreaker` as a pure,
tested class copied from `SafetyController`'s shape, deliberately unwired — same "shipped dark
until the volume exists" pattern PR 3's SQLite store used. Wiring it in is explicitly deferred to
when slices 1–2 land.

### 5. "PR 8 and the dossier (task #13) are independent, sequential tasks"

**Claim** — the session's own task list had PR 8 (the scanner) and the dossier as separate,
sequential items, dossier listed second. **Challenge** — `doctrine-scan.mjs` reads a dossier's
adaptation ledger; with no dossier, it has nothing to scan and no way to prove its own logic against
real content. **Resolution** — resequenced: built the dossier (`docs/BOTS-SAURON.md`, via a
research subagent reading `sauron.ts`, `sauron-hardcore.ts`, guards, and git history) before the
scanner, then verified the scanner against the real file, not a synthetic fixture.

### 6. "Reuse forward-test-id-scan.mjs's `FT-<event-id>-<n>` namespace for doctrine's own registrations"

**Claim** — the plan names an `FT-bot-<persona>-<n>` pre-registration namespace, implying it should
fit the existing forward-test register's placement contract. **Challenge** — that contract's
`NAMESPACED_RE` requires the id segment to end in a date token; `bot-sauron` has none, so
`FT-bot-sauron-1` would fail `--contract` (a BLOCKING CI gate) on day one. **Resolution** — gave
doctrine its own ledger format entirely (`docs/BOTS-<PERSONA>.md`'s "Adaptation ledger" table, no
`FT-` ids at all) rather than widening a blocking gate's regex for one speculative future case.

### 7. "git stash was a safe shortcut mid-task"

**Claim** — Claude used `git stash -u` once, mid-session, to inspect origin/main's files. **Challenge**
— the user asked directly why it's banned, calling it a possible implementation detail rather than
a real constraint. **Resolution** — both sides right in part: the user's instinct that not every
CLAUDE.md rule deserves blind deference is sound house doctrine ("a gate is a momentum breaker
unless it protects a constraint"), but this one isn't stale — `docs/LESSONS.md` names two concrete
incidents (a silent drop on pop; a 2026-08-13 recurrence where an agent hit the exact warned-about
failure mode). The stash in this session popped cleanly, which is exactly the false reassurance the
ban warns about — a silent failure mode doesn't announce itself until it does. No cost to avoiding
it either: switching branches directly (used successfully elsewhere this same session) covers the
same need with no silent-loss risk.

## Rejected branches

- **A literal in-place `.replace()` for the doctrine ledger's due-date marker** (as the plan's own
  wording, "replaced in place," suggested) — killed by a lesson already in this codebase's own
  history: `event-material-decide.mjs`'s `applyScreen()` used to do exactly this and was changed to
  append-only on 2026-09-19 after two concurrent screens raced the same line and corrupted it.
  Reusing the newer, battle-tested shape rather than the plan's literal (but pre-lesson) wording.
- **Wiring `doctrine-scan.mjs --validate` into a blocking `tests/arch/*.spec.ts` gate**, mirroring
  `forward-test-id-scan.mjs --contract` — deferred, not killed. One dossier today doesn't justify a
  blocking placement gate; revisit on the third dossier (the same "rule of three" this repo already
  applies to recruiting agents).
- **Building the full `trade-insights-loop.md` insight-nudge system inside PR 8** — deferred; its
  own slices 1–2 (retrospective capture, promotion ladder) aren't built, and pre-empting their design
  to wire a breaker with nothing to gate would have widened PR 8 well past this session's actual
  scope.

## Open forks

- **Is hardcore Sauron currently armed?** — a Fly secret (`SKYNET_HARDCORE_BOTS`) can override the
  checked-in `[env]` block and is invisible from this repo. Settled by: an `autonomy-ops` session
  checking the live secret directly.
- **Does the missing branch-protection gate on `integration tests` need fixing?** — flagged, not
  fixed (repo-settings change, out of scope for the PR that surfaced it). Settled by: whoever owns
  branch protection checking whether `integration tests` is in the required-checks list.
- **Has plain Sauron's missing stop-loss ever actually mattered?** — the dossier's own stated
  falsifier: by 2026-12-31, does the decision-audit log show every historical panic-claim fill
  exiting via the reciprocal fade within a bounded window with no adverse excursion? If yes, the gap
  never bit in practice; if no, it's a real, live risk.

## Side quests banked

- `integration tests` isn't a required merge check despite its own doc comment calling it
  "blocking from day one" → docs/IDEAS.md, shipped as PR #3578 _(src: Claude · while: root-causing
  PR #3576's failing e2e check)_.
