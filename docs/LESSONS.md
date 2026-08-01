# Lessons ledger — the learning Coach's record

Every net that catches a slip is a *lesson we paid for*. This file is where that payment is banked,
so the same tuition is never paid twice. It is the output artifact of the **`/retro` drill**
(`.claude/skills/retro/SKILL.md`) and is enforced by `tests/arch/lessons.spec.ts`.

**The rule: an incident is not closed until it has an entry here with a `PREVENTION` line.** A
prevention that is only a sentence in a chat window protects nothing — the next session never reads
it. Prevention ranks, best first:

1. **A gate or a script** — the drift becomes impossible, or is caught mechanically. Free forever.
2. **A doctrine line** in `CLAUDE.md` / `docs/COACHES.md` / `docs/ENGINEERING.md` — loaded into every
   session's context, so it steers the next decision.
3. **A ledger entry alone** — acceptable only when the cost of mechanizing exceeds the expected
   damage. Say so explicitly; don't default here because it's the cheapest.

**Entry format** (parsed by the gate — keep the field names):

```
### <short title>
- **SHA:** <7-char sha or `n/a`>   **DATE:** YYYY-MM-DD   **STATUS:** closed | open
- **SIGNAL:** what first indicated something was wrong, and how long after the cause
- **ROOT CAUSE:** the actual mechanism, not the symptom
- **PREVENTION:** gate / script / doctrine / ledger-only (+ where it landed)
- **SIDE QUESTS:** threads pulled (→ docs/IDEAS.md), or `none`
```

---

### The false abstraction — consolidating `clamp` dropped a NaN guard
- **SHA:** n/a   **DATE:** 2026-07-27   **STATUS:** closed
- **SIGNAL:** a spec (`expect(svg).not.toContain("NaN")`) went red immediately after the dedupe —
  seconds, the cheapest possible detection.
- **ROOT CAUSE:** two functions named `clamp` looked identical but weren't: `project.ts`'s version
  carried `Number.isFinite(v) ? … : lo`. The duplication gate measures *name collision*, not
  *behavioral identity*, so "same symbol in N files" was a false positive for consolidation.
- **PREVENTION:** doctrine — the `/dedupe` drill must diff behavior, not just signatures, before
  consolidating; the divergent one stays separate under a distinct name (`clampFinite`, with a
  comment saying why). Recorded in `docs/COACHES.md` → smell catalog (near-duplication is judgment).
- **SIDE QUESTS:** none — the gate behaved correctly; the drill needed the check.

### Branch protection silently killed every deploy for four merges
- **SHA:** 882f3c2   **DATE:** 2026-07-29   **STATUS:** closed
- **SIGNAL:** none for four merges — the `deploy` job failed *after* `semantic-release` and before
  `flyctl deploy`, and nothing watches a red `main`. Detected only when Eric said "semantic release
  failed." **Detection lag: 4 merges / ~2 days.** This is the failure this Coach exists to shorten.
- **ROOT CAUSE:** `@semantic-release/git` pushes the version bump directly at `main`. Making `verify`
  a required status check made that push illegal (`GH006`), so the release step threw and the job
  exited before the deploy step ever ran.
- **PREVENTION:** gate + doctrine. Plugin removed from `.releaserc.json` (the git tag is the version
  of record); `scripts/incident-scan.mjs` now flags any failed run on `main` that has no entry in
  this ledger, so a red `main` can never again go unnoticed for days.
- **SIDE QUESTS:** → the enumeration doctrine below; a prod smoke probe beyond the CI smoke test
  (docs/COACHES.md special teams → release verification).

### `prepare` ran before `COPY . .`, so the scene bundle was never built
- **SHA:** 24a5c0d   **DATE:** 2026-07-29   **STATUS:** closed
- **SIGNAL:** caught *before* merge by reading the Dockerfile rather than waiting for the run —
  then confirmed by the predicted failure of run 88. Detection lag: minutes, because the actor list
  was enumerated deliberately after the previous lesson.
- **ROOT CAUSE:** npm's `prepare` lifecycle runs during `npm ci`, which the Dockerfile executes in a
  layer *before* `COPY . .` — so `src/three/**` did not exist yet. Fixed with an explicit
  `RUN npm run build:scene` after the copy.
- **PREVENTION:** doctrine — **when you change a shared system, enumerate every actor that crosses
  it.** Branch protection has more consumers than PRs (semantic-release); `prepare` has more callers
  than developers (the Dockerfile, CI, `npm ci` anywhere). Landed in `docs/COACHES.md`.
- **SIDE QUESTS:** none.

### `npm test` never ran the suite — verified with a stand-in for the real command
- **SHA:** n/a   **DATE:** 2026-08-01   **STATUS:** closed
- **SIGNAL:** the *second* red CI run on `battle-of-the-wits` PR #1 — `✖ tests 1 / pass 0`, where
  the one "test" was the runner failing to load. Detection lag: only as long as it took CI to run,
  but it should have been zero, because every local check had reported 7/7 green minutes earlier.
- **ROOT CAUSE:** `package.json` declared `"test": "node --test tests/"`, which resolves the
  directory as a *module* and dies with `MODULE_NOT_FOUND`. I had hit that exact error while
  building the suite, worked around it at the shell with `node --test tests/*.test.mjs`, and then
  kept verifying with the workaround — never re-running the script CI invokes. The suite was green
  in every check I ran and had never once executed in the pipeline.
- **PREVENTION:** doctrine — **verify by running the project's own commands, not an equivalent.**
  A hand-typed stand-in tests your shell invocation, not the repo's contract; the moment they
  diverge, local green and CI red are both correct. Landed in
  `battle-of-the-wits/CLAUDE.md` → _Ship loop_ (`npm test`, `npm run validate`, sync-check by name)
  and generalized here. Corollary paid for in the same PR: install the linter the gate uses
  (shellcheck) locally rather than discovering its warnings from a red run.
- **SIDE QUESTS:** the harness has no gate asserting its own scripts execute — a `verify` step that
  runs each `package.json` script's smoke path would have caught this before the pipeline did
  (→ docs/IDEAS.md).

### A gate scoped to the files that existed, not the category it defended
- **SHA:** n/a   **DATE:** 2026-08-01   **STATUS:** closed
- **SIGNAL:** noticed while adding a *new* executable (`harness-bootstrap`) to the harness — the
  shellcheck step's glob was `harness-*-scan`, so the new launcher would never have been checked.
  Detection lag: caught before merge, but only because the next change happened to be adjacent to
  the gate. Nothing would have reported the hole on its own.
- **ROOT CAUSE:** the gate's scope was written as the **enumeration of files that existed when it
  was written** rather than as the **category it was meant to defend** ("every shipped executable").
  `harness-ship` was already silently exempt and had been carrying a real SC2015 the whole time —
  `git diff --quiet && git diff --cached --quiet || { …fail… }`, where a failure of the *first*
  command also runs the failure branch, making the two dirty-tree cases indistinguishable. Widening
  the glob to `plugins/*/bin/*` surfaced it immediately.
- **PREVENTION:** doctrine — **scope a gate by category, never by enumeration.** A glob that lists
  today's filenames grants an exemption to every file added later, and the exemption is invisible:
  the gate still reports green, just for the wrong reason. Prefer a directory or role boundary
  (`plugins/*/bin/*`) over a name pattern (`harness-*-scan`). Landed in `battle-of-the-wits`
  (widened glob + comment saying why) and generalized here.
- **SIDE QUESTS:** the same question applies to every other gate's scope — `arch-scan`/`dupe-scan`
  read `sourceDir` from the descriptor (category, good), but any future gate matching by filename
  pattern deserves the same audit (→ docs/IDEAS.md).
