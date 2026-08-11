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

### A regenerated Alpaca key landed in the wrong GitHub secret slot, and there was no way to fix it right
- **SHA:** 9e748be   **DATE:** 2026-08-11   **STATUS:** closed
- **SIGNAL:** Eric noticed a self-service bot ("JARVIS") showing "Account unreachable," and separately
  suspected he'd pasted its just-regenerated key into Sauron's `BOT_SAURON_ALPACA_KEY` GitHub secret by
  hand while trying to fix it. No mechanism caught either half — an invalid key fails loudly, but a key
  merely pointed at the WRONG account authenticates fine and would have looked completely healthy.
  Detection lag: unknown — the wrong-account half was self-reported, not detected, because nothing in
  the system could have detected it.
- **ROOT CAUSE:** two compounding gaps. (1) No mechanism anywhere compared *which real Alpaca account*
  two credential pairs resolved to — only whether each pair was individually valid. Two participants
  silently sharing one account (positions merging, P/L unattributable, each sizing orders against cash
  the other spends) was invisible by construction. (2) There was no sanctioned way to update a stored
  credential after regenerating it — `addParticipant` refuses a duplicate id outright — so a regenerated
  key had nowhere honest to go, which is very plausibly *why* it got pasted into an unrelated secret slot
  instead.
- **PREVENTION:** gate + script. `account-collisions.ts`/`account-guard.ts` capture each participant's
  real Alpaca `account.id` and refuse to trade (autonomous path) or silently display (dashboard boot,
  loud `console.error`) any pair that resolves to the same one — the confirmed-collision case, never
  triggered on merely-missing information. `participant-service.ts` gained `rotateCredentials` + a
  `/rotate` route: the sanctioned path for "I regenerated my key," verified against Alpaca before
  anything stored changes, so the next regeneration has somewhere honest to go.
- **SIDE QUESTS:** one, self-caught during `/security-review` on the fix itself (SHA d2e0bdd) — the
  first cut of `/rotate` checked only that the target id existed, not that the caller had any right to
  touch it. Ids are fully public (persona names, displayName-derived human slugs on every profile URL),
  so any authed member could have redirected ANOTHER named participant's account to credentials of their
  own choosing. Fixed in the same PR before it shipped: the caller's OAuth-resolved identity (the same
  `resolveCurrentId` "isSelf" nav already uses) must match the target for a human account. Left
  deliberately unenforced for bot targets (no session identity to check) and password-mode (matches that
  mode's existing all-trusted model everywhere else) — both are recorded as known, bounded residual gaps
  rather than silently declared closed.

### The deploy doom loop — a gate that counted main failures ran inside the job it counted
- **SHA:** 615a269   **DATE:** 2026-08-11   **STATUS:** closed
- **SIGNAL:** Eric noticed "the publish/release event is failing." Three consecutive pushes to `main`
  had failed while every PR branch passed green — the asymmetry nobody was watching, because
  auto-merge reports the PR check, not the post-merge deploy. Detection lag: ~3 merges.
- **ROOT CAUSE:** two mechanisms compounding. (1) `npm ci` in the deploy job ran `prepare: husky`,
  installing git hooks **in CI**; semantic-release then pushed, the **pre-push hook fired**, and it
  re-ran the entire suite — exactly what that job's own comment swears never happens ("this path
  never re-runs the suite — it only ships"). (2) The suite includes the unlearned-incident gate,
  which counts *failed `main` runs*. So the gate ran inside the job whose failure it counts: one
  failure became an unlearned incident, which failed the next deploy, which became another incident.
  Self-amplifying — 28 and climbing. It only bit on `main` because the pre-push hook inherits the
  step's `GITHUB_TOKEN`; on PRs the same scan 401s and no-ops, which is why PR CI stayed green and
  hid it.
- **PREVENTION:** script — `prepare` is now `test -n "$CI" || husky`, so CI never installs hooks and
  the deploy path cannot re-run the suite. This is a **recurrence**: `docs/COACHES.md` already records
  "npm's `prepare` has more callers than developers (the Dockerfile's `npm ci`)" from a previous
  outage of the same shape. The lesson had been written and was still not enough, because it lived as
  doctrine rather than as a gate — that is the real finding, and the reason this one is mechanized.
- **SIDE QUESTS:** two, → docs/IDEAS.md — (a) a gate whose own failure mode is self-amplifying should
  be structurally forbidden from gating the path it measures; (b) nothing alerts on a red `main` after
  a green PR auto-merges, which is precisely the blind spot that let this run three deep.

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
