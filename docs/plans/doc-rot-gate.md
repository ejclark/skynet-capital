# Plan: doc-rot gate — detect docs that no longer describe reality

**Status:** review <!-- executed 2026-08-10; awaiting Eric's acceptance -->
**Author:** Claude (proposing) · **Date:** 2026-08-10

## Intent & end-state

Docs are the intent layer every fresh session loads; when they drift from reality they poison
alignment silently (two live instances just fixed in PR #284 — a stale persona-lore claim and a
renamed-heading ghost in the structural map). End-state: a deterministic gate in the COACHES roster
(`scripts/doc-rot-scan.mjs`) that catches the *mechanically detectable* classes of doc rot on every
test run, with the grandfather-then-ratchet budget pattern the other gates use. The doc-rot the gate
can't see (semantic claims like "only Sauron carries lore") stays the self-correcting loop's job —
the gate shrinks the surface, honestly.

## Acceptance criteria (EARS)

- [x] WHEN the scan runs, the gate shall flag repo-relative file paths referenced in `docs/*.md` and
      `CLAUDE.md` that no longer exist. — *verify: seeded-fixture specs in `tests/arch/doc-rot.spec.ts`*
- [x] WHEN the scan runs, the gate shall flag named `npm run` scripts referenced in docs that are
      absent from `package.json`. — *verify: seeded-fixture spec*
- [x] WHEN the scan runs, the gate shall flag `STRUCTURE-graph.md` when its embedded built-from commit
      is older than a threshold (default 30 days) behind `HEAD`. — *verify: implemented with graceful
      skip outside a git repo; current map is 14d old (under threshold) — fires deterministically*
- [x] IF findings exceed the ratchet budget, THEN `npm test` shall fail with the finding list. —
      *verify: `tests/arch/doc-rot.spec.ts` enforce spec + a seeded red-run fixture spec*
- [x] WHEN the gate lands, existing findings shall be grandfathered into the initial budget (no
      big-bang cleanup PR). — *verify: `doc-rot-budget.json` = 11 (the real findings on day one)*

## Constraints & non-goals

- Deterministic only — no LLM calls, no API cost (COACHES doctrine: free per run, can't drift).
- Non-goal: semantic claim checking ("X is the only Y") — undetectable without a model; stays with
  the config-audit/self-correcting loop.
- Non-goal: prose style/quality — `/linguist` territory.

## Pre-settled forks (proposed — confirm at ready-flip)

- **Scan surface** → `docs/**/*.md` + `CLAUDE.md` + `README.md`; skip `docs/JOURNEYS/` and
  `docs/plans/` (historical records rot honestly — they describe their moment, not the present).
- **Budget style** → grandfather-then-ratchet, same as arch/dupe gates.
- **Roster placement** → a gate + corrective runs in-session; no new background agent (charter step 2:
  the mortician/decomposer pattern only earns an agent once recurrence is proven).

## Autonomy envelope

- Default merge policy: gate + specs are structural → auto-merge on green.

## Open questions (Q&A queue)

- **Eric's guiding-principles review comments on PR #285 are still unpublished** (a pending review —
  needs "Finish your review → Submit" on the Files-changed tab). Execution proceeded on his explicit
  "we are aligned. go" + "work on what you can while I am AFK"; any contract edits his comments call
  for land as follow-ups once submitted.
- **6 grandfathered findings remain** (down from 11 — the five unambiguous ones fixed in this PR:
  moved script path, ghost workflows, deleted hooks). All six are proposed-doc names inside the dated
  2026-07 engineering audit — fix them, or exclude dated historical audits from the scan surface the
  way JOURNEYS/ already is. Eric's call which way.

## Decision log

- **"Go" treated as the ready-flip** (2026-08-10): Eric's "we are aligned. go" followed the synthesis
  proposing exactly that; recorded here rather than assumed silently.
- **Executed with his #285 review comments still unpublished** — proceeding was the interrupt-economics
  call (cheap, reversible, structural); the unread feedback is banked above, not dropped.
- **Basename shorthand accepted** (scanner design): bare `IDEAS.md` in prose resolves against `docs/`
  before flagging — kills the false-positive class without hiding true dead links.
- **Dated audit docs kept in the scan surface** for now (the 6 remaining grandfathered findings) — the
  exclusion question is queued above instead of decided unilaterally.
- **CI-parity lesson (two red runs bought it):** findings must derive only from COMMITTED state.
  Round 1: a runtime file existed locally but not in CI → judge ignored refs as alive-by-design.
  Round 2: the ignore rule itself lived in the machine's GLOBAL git config → force
  `core.excludesFile=/dev/null` so only the repo's committed .gitignore counts, and commit the
  `.claude/settings.local.json` rule the harness convention implies.
- **Five unambiguous rot fixes folded into the gate PR** (11→6 ratchet) — same theme, one CI cycle;
  the queued audit-doc class stays for Eric.
