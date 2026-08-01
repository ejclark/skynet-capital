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

### Diagnosing a render artefact from the diff instead of from the pixel
- **SHA:** n/a   **DATE:** 2026-08-01   **STATUS:** closed
- **SIGNAL:** three separate mis-attributions inside one work session, each costing a pass:
  (1) rays out of the Eye's pupil blamed on the chatoyancy lobe and damped four times — they were
  fbm's high octaves, since `fbm(angle * 3.2)` carries content past 100 cycles around a circle;
  (2) a wash across one side of the flame read as a shape problem for two passes — it was the gaze
  beam starting at the eyeball's centre and passing through it; (3) streaks attributed to volumetric
  scattering that was wired but never invoked, so it could not have produced them.
- **ROOT CAUSE:** reasoning from *what I had just changed* rather than proving which code path
  produces the pixel. The most recent edit is the most available explanation, and in a shader where
  a dozen terms sum into one colour it is usually the wrong one. Compounding it: shader terms are
  additive, so a wrong suspect can be damped repeatedly and the artefact only *seems* to respond.
- **PREVENTION:** doctrine — **isolate before you attribute.** Zero the suspected term and re-render;
  if the artefact survives, the suspect is innocent and every further tweak to it is waste. One
  screenshot cycle settles what an argument from the diff cannot. Recorded in `docs/COACHES.md`
  alongside the enumerate-every-actor rule, which is the same failure in a different medium: both
  are reasoning about a system from a local edit instead of from its actual inputs.
- **SIDE QUESTS:** the third instance was caught only because lint flagged an unused parameter —
  worth noting that the cheapest detector for "this feature never ran" was a general-purpose gate,
  not anything render-specific.
