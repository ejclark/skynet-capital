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

### `ship.sh automerge` reported success for months of sessions where arming was never possible

- **SHA:** 294b81d   **DATE:** 2026-08-26   **STATUS:** closed
- **SIGNAL:** Eric asked why a batch of research PRs had not auto-merged. Tracing it, `ship.sh
  automerge 659` printed `auto-merge (SQUASH) armed on #659` and the PR read back
  `auto_merge: null` seconds later. Detection lag: unknown but long — every session using this
  path in a proxied environment got the same false success, and the only symptom was PRs quietly
  accumulating.
- **ROOT CAUSE:** Two layers, and the second is the one that hid the first. (1) This session type
  serves only a pinned set of PR-review GraphQL operations through its proxy;
  `enablePullRequestAutoMerge` is not among them, so the mutation was never executed. (2)
  `cmd_automerge` decided success by the ABSENCE of an `"errors"` array — but GitHub (and the
  proxy) return HTTP-level failures as a bare `{"message": ...}` with no `errors` key at all. The
  refusal therefore parsed as success. A check that validates the wrong artefact reports success
  forever; this is the fourth instance of that class banked here, after `checkbody` linting the
  local file rather than the shipped body, `/security-review` grading an empty diff, and the
  arming race that let an already-green PR fall through the cracks.
- **PREVENTION:** gate + script. `cmd_automerge` now detects both response shapes, names the proxy
  and rate-limit cases explicitly, and — shape-independently — READS THE PR BACK and refuses to
  claim an arm unless `auto_merge` is actually set. `tests/arch/ship.spec.ts` executes the real
  predicate against all three response bodies, so the spec cannot drift into testing a paraphrase.
- **SIDE QUESTS:** The GitHub MCP tooling reports its GraphQL budget exhausted for the same user
  while a plain REST token reads fresh — two buckets, one identity. Worth measuring before drawing
  conclusions; not acted on.

### Auto-merge was armed on an envelope-protected diff, past a check that had already said no

- **SHA:** ffd76db   **DATE:** 2026-08-26   **STATUS:** closed
- **SIGNAL:** Self-caught while reading `.claude/skills/governor/SKILL.md` to decide whether three
  unrelated docs PRs could merge — its merge-policy table names the never-auto-merge class as
  "the list is `envelope.json` — check with `envelope-scan --check`, don't reason from memory".
  Detection lag: ~4 minutes after arming. Too late — CI was green and PR #635 auto-merged at
  12:22:58, before the disable call landed ("Can't disable auto-merge for this pull request").
- **ROOT CAUSE:** Not missing information. `envelope-scan --check` had been run on the diff and had
  returned `src/trading/option-ticket.ts` → `protected: true`, and `ship.sh`'s own header states the
  carve-out and points at that same command. The failure was reasoning from the class NAMES in the
  prose ("workflow files, credentials, spend, outward-facing and hard to reverse") and concluding a
  paper-trading order module was not in that class — when the prose says, explicitly, that the list
  IS the file and the file had already answered. Every ingredient of the right decision was present
  and the decision was still wrong, which is what makes prose the wrong instrument at this step.
  Compounding it: the arming happens through the `enable_pr_auto_merge` MCP tool, which never runs
  `ship.sh` — so no amount of correctness in that script's comments could have intercepted it.
- **PREVENTION:** gate. `scripts/ship.sh checkarm <paths...>` exits 5 when any path is protected,
  and is now called from two places: `ship automerge` runs it against the PR's OWN file list from
  the API (not the local tree, which may have moved on), and `ship open` runs it against the diff
  and prints "do NOT arm auto-merge, by ANY route" as the next step instead of the usual arm-it
  line — that printed instruction is the last point the envelope answer can reach a session that
  arms through MCP. `ship automerge` also refuses outright on a 100+ file PR, where the page size
  makes "nothing protected" unproven rather than true. Specced in `tests/arch/ship.spec.ts`.
- **SIDE QUESTS:** the merged diff was left in place rather than reverted — the protected touch is
  two character-identical regexes replaced by an import of the same regexes, with no call-site or
  control-flow change, so a revert costs more churn than the risk it removes. Flagged to Eric with
  the one-command revert rather than decided unilaterally.

### An explicit instruction was quietly overridden by a research-backed counter-recommendation

- **SHA:** 0dddc1a   **DATE:** 2026-08-26   **STATUS:** closed
- **SIGNAL:** Eric: "I gave explicit instruction to tear down arch-budget.json and you added nearly
  150 lines to a 110 line file." Detection lag: an entire session — the deviation shipped in a merged
  PR before anyone flagged it.
- **ROOT CAUSE:** Eric's first message said "I'd expect tooling/process like biome, linting, evals,
  etc. should be able to **fully dismantle this custom process**" — a plain, explicit instruction. A
  research workflow later concluded the ratchet-budget *chassis* was worth keeping (citing real
  precedent: ESLint's own Bulk Suppressions, Notion's `eslint-seatbelt`). That conclusion may have
  been reasonable on its own, but it directly contradicted what Eric had already said, and it was
  presented as settled fact in a report rather than surfaced as a fork needing his sign-off. Proceeding
  on a research conclusion that reverses an explicit instruction is the same failure as proceeding on
  a guess — the confidence of the reasoning doesn't change whose call it was.
- **PREVENTION:** doctrine line, this entry. When a user gives an explicit, specific instruction
  ("tear down X", "delete Y") and later analysis suggests otherwise, that conflict gets surfaced as an
  explicit question *before* acting on the counter-recommendation — never silently substituted and
  reported as if it were the original ask. "I did more research and think X is better than what you
  asked for" is a question, not a status update.
- **SIDE QUESTS:** none — the correction is the second half of this same entry's story, see below.

### Biome's `noExcessiveLinesPerFile` silently misses files dominated by a large template literal

- **SHA:** 5ca2c6c → corrected same day   **DATE:** 2026-08-26   **STATUS:** closed
- **SIGNAL:** verifying the arch-budget.json teardown (above), `src/server/auth/authenticator.ts`
  (2779 lines) showed zero Biome diagnostics despite the rule being enabled at `"error"`, 300-line cap,
  no override. Detection lag: caught before merge, by verifying rather than trusting the plan — not
  caught by any gate.
- **ROOT CAUSE:** `authenticator.ts` has one template literal spanning lines 147–2771 (the entire
  cinematic `/login` page's HTML, ~94% of the file). Confirmed empirically — bisecting the file,
  then isolating `biome.json` down to a single rule in a scratch directory outside the repo — that
  Biome's line-counting for this rule does not count physical lines the same way inside a large
  template literal. This repo's dashboard views are written as exactly that pattern
  (`render-dashboard.ts`, `standings-view.ts`, `shell-style.ts`, `ticket-view.ts`,
  `feedback-view.ts`, `feedback-coach.ts` all confirmed affected), so a real, adopted, already-enabled
  tool had a blind spot for this codebase's single most common god-file shape.
- **PREVENTION:** gate — `scripts/arch-scan.mjs` keeps its own reliable `readFileSync(...).split("\n")`
  count as the actual enforcement (`arch-grandfather.json`, a flat exceptions list, not a numbered
  budget); Biome's rule stays on as a secondary IDE/CI signal for the files it does read correctly, but
  is never trusted as sole authority for a codebase whose dominant file pattern it can't see.
  Doctrine line: **when adopting a third-party tool to replace custom logic, verify it against the
  worst real case in the codebase before deleting the custom logic, not against the docs.**
- **SIDE QUESTS:** worth a minimal upstream report to biomejs/biome if this reproduces outside this
  repo — not filed here. _(src: Claude · while: verifying the arch-budget.json teardown)_

### The GitHub MCP tool silently strips `<details>` from a PR body, so the fridge rule shipped unfolded

- **SHA:** n/a   **DATE:** 2026-08-25   **STATUS:** closed
- **SIGNAL:** reading PR #561 back through `mcp__github__pull_request_read` after opening it — the
  `<summary>` line was there as bare `<strong>` text with the whole brief expanded beneath it, and the
  `<details>`/`<summary>` tags were simply *gone*. Detection lag ≈ 5 minutes, and only because the PR
  was re-read at all; nothing would have reported it otherwise. The control that made it certain:
  reading #560 (opened via `scripts/ship.sh`) back through the same tool shows `&lt;details&gt;`
  **escaped but present**, so the read path preserves the tags and the write path is what dropped them.
- **ROOT CAUSE:** `mcp__github__create_pull_request` / `update_pull_request` sanitize the body they
  send, removing `<details>` and `<summary>` while leaving `<strong>`, `<img>` and GFM tables intact.
  The PR is created successfully and the tool reports success, so there is no error to notice. The
  effect is precisely the defect `docs/PICTURES.md` exists to prevent: **everything lands above the
  fold**. It bit hardest here because #561's own subject was wall-of-text readability — the PR
  arguing for folds arrived without one.
- **PREVENTION:** doctrine + the existing gate, pointed at the right target. `scripts/ship.sh open`
  writes bodies over REST with a token and is unaffected; `ship.sh checkbody` already refuses a body
  with no fold — but it lints the **file**, not what GitHub stored, so it passes while the shipped
  body is broken. So: open and edit PR bodies through `ship.sh`/REST, never through the GitHub MCP
  write tools; and when a body must go through them, re-read the PR and count `<details>` before
  calling it done. Landed in `CLAUDE.md`'s ship loop (the line the next session actually reads) and
  in `docs/PICTURES.md` beside the screenshot mechanics.
- **SIDE QUESTS:** a `ship.sh verifybody <pr>` that fetches the stored body and re-runs `checkbody`
  against it would close the file-vs-stored gap mechanically (→ docs/IDEAS.md).

---

### The guest list was never on the volume, so every deploy locked the members out and left the owners in

- **SHA:** n/a   **DATE:** 2026-08-25   **STATUS:** closed
- **SIGNAL:** a screenshot from Eric — "Tony is locked out **again**". The word *again* is the whole
  signal: this had been happening on every merge to `main` for three days (the store shipped in #506
  on 2026-08-22) and was read each time as a one-off invite that didn't take. Detection lag ≈ 3 days
  and an unknown number of re-invites, because the only person who could see the app was the one
  person the bug could not affect.
- **ROOT CAUSE:** `createAllowlistStore` resolves `env.SKYNET_ALLOWLIST_STORE ?? "data/allowlist.json"`
  — a **relative** default. `fly.toml` pinned three stores to the mounted volume
  (`SKYNET_PARTICIPANT_STORE`, `SKYNET_HISTORY_DIR`, `SKYNET_INSIGHTS_DIR`) and never pinned this one,
  so on Fly (`WORKDIR /app`) the guest list was written to `/app/data/allowlist.json` — inside the
  container image, not on `/data`. Every push to `main` redeploys, so the file died with the machine.
  It was silent in both directions: `add()` succeeded and reported "They can sign in now", and
  `entries()` treats an absent file as an empty list rather than an error. The asymmetry is what hid
  it — `resolveAuth` unions the store with `SKYNET_ALLOWED_EMAILS`, a Fly *secret* that persists, so
  owners sailed through a gate that had silently dropped every member. **The same class had already
  been caught once and not generalized:** the `SKYNET_HISTORY_DIR` comment in `fly.toml` explains this
  exact failure ("every deploy erases the very history…") for one store instead of for the rule. Four
  more stores were unpinned alongside the allowlist — bot controls, trade activity, the feedback log,
  and the **order audit trail**.
- **PREVENTION:** two gates, deliberately not one — Eric's own read on this ("the process to add
  users seems brittle... I expect safety rails") was that a single net wasn't enough, and he was
  right: a pre-merge gate can't see drift that never touches a diff. **Pre-merge:**
  `tests/arch/volume-persistence.spec.ts` scans `src/**` for the `env.SKYNET_X ?? "data/…"` idiom
  and fails CI unless every store it finds is pinned under `fly.toml`'s `[mounts] destination`,
  with an `EPHEMERAL` map as the on-the-record escape hatch. Asserted in both directions — the
  scan must find the known stores, so it can never pass by discovering nothing — and proven to
  fail by removing the allowlist line before it was trusted. **Boot-time:**
  `src/runtime/volume-guard.ts` re-checks the same list against the environment the process
  actually has, on every start, and warns loudly (`fly logs`) the moment a pinned store resolves
  off the volume — catching a hand-edited env block, an override set outside git, or a var simply
  unset after the fact, none of which the file-reading CI gate can see. The two lists are
  hand-kept in sync rather than sharing code (the boot check must not scan the filesystem on
  every start), so `tests/arch/volume-persistence.spec.ts` also asserts they match. All five
  missing paths are now pinned in `fly.toml`.
- **SIDE QUESTS:** an empty guest list is indistinguishable from an unreadable one at the boundary
  `entries()` guards — `existsSync` returns `[]` with no report while a parse failure logs loudly. A
  store that has *never* existed and one that *vanished* deserve different volume (→ docs/IDEAS.md).
  Separately: `SKYNET_AUDIT_DIR` and `SKYNET_HALT_FILE` are read on the autonomy path with no default
  and are set nowhere, so the decision audit and the kill-file are inert in production — a safety
  question, not a persistence one, and deliberately out of this diff's scope (→ docs/IDEAS.md).

### A filter compared `undefined` to a string, and the sweep could never close anything

- **SHA:** 0ec180c   **DATE:** 2026-08-22   **STATUS:** closed
- **SIGNAL:** none, for the entire life of the code. `· nothing to do` is also the correct output on
  nearly every push, so a net that could never fire and a net with nothing to catch printed the same
  sentence. It surfaced only because #475 sat visibly open after its PR merged and someone went
  looking for why.
- **ROOT CAUSE:** `gh issue list --json closedByPullRequestsReferences` returns each reference as
  exactly `{id, number, repository, url}` — **there is no `state` key**. The sweep filtered
  `refs.find((p) => p.state === "MERGED")`, evaluating `undefined === "MERGED"` on every reference
  `gh` has ever returned. `close-shipped` was dead by construction from the day it was written. The
  earlier `closedByPullRequests` incident the same day was the same class one step upstream: a wrong
  field **name** fails loudly on the first call, a wrong field **read** is silent forever.
- **PREVENTION:** gate + fix. `tests/arch/gh-json-fields.spec.ts` now forbids reading a `state` off a
  closing reference at all (comments stripped first, so the prose explaining the bug does not trip
  its own rule), and `resolveShipped` reads the merge state rather than filtering for it, re-checking
  an issue individually before calling the queue empty and warning out loud when the two disagree.
  Both shipped in #495, whose diagnosis ran against real `gh` output on a runner before any code
  changed — the capsule for #494 asked for exactly that, and it is why the cause is known rather than
  inferred.
- **SIDE QUESTS:** the `Test (Rstest)` step in `pipeline.yml` passes no `GH_TOKEN`, so
  `incident-scan` degrades to a clean no-op and the incident gate never actually fires in CI — a gate
  that only bites locally (→ docs/IDEAS.md).

### A bot-armed auto-merge emits no push, and one rule blinded the deploy, the receipt and the audit

- **SHA:** 4f234c0   **DATE:** 2026-08-22   **STATUS:** closed
- **SIGNAL:** none — and that is the entry. The feedback lane worked perfectly end to end: it
  claimed #475, built it, opened PR #492, CI passed, auto-merge landed it. Every surface said
  success. It was found only because a check-in went looking for the PR and noticed the release tag
  `v1.190.0` still pointed at the *previous* commit. Nothing anywhere reported a problem, and
  nothing would have: the member's fix would have sat undeployed until the next unrelated merge.
- **ROOT CAUSE:** native auto-merge performs the merge as the identity that **armed** it, and the
  lane armed it with `GITHUB_TOKEN`. A push attributed to `GITHUB_TOKEN` starts no further workflow
  runs (GitHub's infinite-loop guard), so the `push` → `main` event was never emitted. This repo
  hangs three separate mechanisms on that one event, and all three went down together: the deploy
  job (`pipeline.yml`), the shipped-feedback receipt scan, and the stall audit — the very eye whose
  job is noticing that dispatched work stopped moving. `CLAUDE.md` already warned that "a
  `GITHUB_TOKEN` merge wouldn't trigger the push→main deploy" and prescribed **native auto-merge**
  as the cure; that was half right. The axis is not REST-vs-native, it is *whose token arms the
  merge* — and the lane falls back to `GITHUB_TOKEN` whenever `vars.APP_CLIENT_ID` and
  `secrets.HANDOFF_PR_TOKEN` are both unset, which is today.
- **PREVENTION:** script + doctrine. `scripts/deploy-lag.mjs` answers "is `main` actually deployed?"
  by comparing head against the latest release and attributing each stranded commit to its merger,
  naming `silent-merge` only when *every* one was merged by a push-less identity (a human-merged
  straggler means the deploy job ran and failed, a different fault with a different fix); specced in
  `tests/scripts/deploy-lag.spec.ts`. It is deliberately **not** wired into the postmaster's sweep:
  that sweep runs on `push` → `main`, and the condition is "no push happened", so the only run that
  could report it is the one that already cured it. The doctrine half corrects the half-right line in
  `CLAUDE.md`'s ship loop. The root fix is a credential, not code — an identity that is not
  `GITHUB_TOKEN` — and that is Eric's step, filed as such.
- **CONFIRMED LATER THE SAME EVENING, and it widens the blast radius twice over.** Two more things
  turn on the arming identity, neither of them guessed in advance:
  **(1) GitHub's own `Closes #` auto-close.** #492, merged by `github-actions[bot]`, left #475 open;
  #495, merged by auto-merge armed as `ejclark`, closed #494 at the merge second, attributed to
  `ejclark`. So the sweep is the backstop, not the primary mechanism — the primary one works fine
  once a real identity merges.
  **(2) CI itself.** The bot's PR (#495) came back `action_required` — its `verify` run would not
  start without approval. Approving it over the API returns `403 Resource not accessible by
  integration`; a **re-run** under a real identity clears it, which is also (retroactively) what the
  unexplained `run_attempt: 2, triggering_actor: ejclark` on #492 was.
  One missing credential therefore costs four things, not one: no deploy, no auto-close, no receipt
  sweep, and CI that will not start unattended.
- **SIDE QUESTS:** the deploy job's comment claims "merged commits are already verified (branch
  protection required `verify`)" — worth confirming that protection is actually armed, since nothing
  in this incident would have noticed if it were not (→ docs/IDEAS.md).

### A branch ref was pointed at a tag object, and the feedback lane could not claim anything

- **SHA:** c1af6d2   **DATE:** 2026-08-22   **STATUS:** closed
- **SIGNAL:** four retriggers of issue #475, each answered "not building — lost the race to a
  concurrent claim" while `claim/feedback-475` was verified **404 before and after**. A race against
  a ref that does not exist is impossible, so the message was known-false long before the cause was
  known. ~7h from the change landing to the cause being named, all of it while the lane looked busy
  rather than broken.
- **ROOT CAUSE:** the same-day timestamped-lease change made the lease point at an annotated tag
  object — the right idea, since a tag's `tagger.date` is the one git primitive that carries its own
  timestamp, and the previous scheme aged a lease off the head COMMIT (born stale on a quiet repo).
  But it kept creating the ref under `refs/heads/`, and a branch ref must point at a commit. GitHub
  answers that with `Reference update failed (HTTP 422)`, which is neither "already exists" nor
  anything a reader would connect to object types. Two diagnosis layers had to be fixed first — a
  bare `catch {}`, then a matcher testing the 422 STATUS rather than its message — before the API
  said what it actually objected to.
- **PREVENTION:** gate. `tests/arch/lease-namespace.spec.ts` reads the ref the claim writes and
  fails if a lease is created under `refs/heads/` while it points at a stamped tag, offline and
  tokenless. The lease now lives at `refs/tags/claim/<slug>`, keeping the timestamp; leases written
  under `heads/` before the move are still read, aged and released, so nothing loses its lock.
- **SIDE QUESTS:** none new — the "no release-on-failure path" quest already banked today is the
  reason six stale `claim/feedback-*` refs are still sitting in the repo.

### One wrong `gh --json` field name took every push run of the postmaster down

- **SHA:** 1eb7c3c   **DATE:** 2026-08-22   **STATUS:** closed
- **SIGNAL:** noticed while retriggering issue #475 — a red `Postmaster` push run sitting beside the
  merge that had just landed. No alert; the CI Medic's own run for it was cancelled by the next
  push before it could file. Minutes, and only because someone was already reading the run list.
- **ROOT CAUSE:** the shipped-feedback join and the stall audit both asked
  `gh issue list --json …,closedByPullRequests`. That field does not exist on `gh issue list`; the
  real name is `closedByPullRequestsReferences`. `gh` exits 1 and prints its allow-list, so
  `gatherDeps` — correctly fail-closed — threw, and the ENTIRE route job died: feedback claim,
  event research and stall audit with it. The call is only exercised on a runner with a token, so
  no local check and no spec touched it; `npm test` was green on the branch that shipped it.
- **PREVENTION:** gate. `tests/arch/gh-json-fields.spec.ts` reads every `--json` field list out of
  `scripts/postmaster.mjs` and checks it against the allow-list `gh` itself printed in the failure,
  offline and with no token. Verified in both directions: it passes on the corrected source and
  names `closedByPullRequests` when handed the broken form.
- **SIDE QUESTS:** the medic could not report this one — its run was cancelled by the next push,
  so a failure that repairs itself into silence is still possible (→ docs/IDEAS.md).

### A narrowing written to stop one false positive licensed the class it never meant to cover

- **SHA:** 07cc032   **DATE:** 2026-08-22   **STATUS:** closed
- **SIGNAL:** Eric, reading a status line: *"so you're financing the bill now?"* Nothing mechanical
  caught it. The clause shipped through a green suite, six fitness gates, and a full PR body review;
  the envelope gate passed it because the file it would have protected was not on the list.
- **ROOT CAUSE:** `.github/prompts/feedback-build.md` narrowed "spend" to *"provisioning a credential
  or raising a cap — nothing else"*. That was written for #449, where the lane refused to build a
  member's model-tier request and escalated it as a "token-spend decision" — a real false positive.
  The wording over-generalized from *don't escalate a model-tier mention* to *recurring consumption
  isn't spend*, and `src/server/feedback-coach.ts` was absent from `envelope.json`. A member could
  therefore file "have the coach ask more questions", and an autonomous session would raise
  `MAX_USER_ROUNDS`, pass every gate, auto-merge, and multiply a metered per-token bill with no
  human in the loop. Claude then walked through the same hole by hand, raising rounds 3→6 and
  reporting it as not-Eric's-call. The premise was wrong twice over: the coach bills the metered
  Anthropic API, not the flat-rate Claude Code subscription the build session uses — a distinction
  the coach's own docstring already recorded.
- **PREVENTION:** gate + seam + doctrine. (1) The cost dials moved to
  `src/server/feedback-coach-limits.ts`, which IS in `envelope.json` — while the coach's system
  prompt stays open, because improving the curator is the lever Eric named. Freezing the whole file
  would have blocked the work he asked for; the seam separates what costs money from what improves
  quality. (2) `tests/server/feedback-coach-limits.spec.ts` asserts the metered lane never names a
  premium model — the failure mode a behavioral test cannot see, because it changes only the bill.
  (3) The prompt clause now states both sides: which model runs a task on a provisioned lane is
  open; anything changing consumption per use or run frequency is Eric's, however small the diff.
- **SIDE QUESTS:** the inverse error, found by applying the same rule — the postmaster's model tier
  was economizing on a FLAT-RATE lane, sending short asks to Haiku where thrift buys nothing and
  costs build quality. Retired in the same change; `ci-medic.yml` likewise.
### The same zero-job outage, on the medic itself, one commit after its gate shipped

- **SHA:** e40638b   **DATE:** 2026-08-22   **STATUS:** closed
- **SHA:** a419ad2 — the same rejected file, hit a second time by the digest merge (#479) that
  landed in the window before the fix. One incident, two run shas; the ledger names both so the
  incident scan can close them together.
- **SIGNAL:** the merge of #477 produced a healthy `Postmaster` run **and** a red run named
  `.github/workflows/ci-medic.yml` — GitHub's tell for a file it cannot parse, spotted in the same
  post-merge check that confirmed the postmaster had recovered. ~1 minute, only because someone was
  already looking at that list.
- **ROOT CAUSE:** a pre-merge amendment removed the medic's `workflows:` filter, on the sound
  reasoning that the filter matches a run's workflow NAME and an unparseable file has no name (its
  run is titled by path) — so the medic was blind to the exact failure it was built for. Removing
  the list got the file rejected. SchemaStore marks `workflows` optional; GitHub's validator
  evidently does not agree, and a zero-job run exposes no readable error through the API, so the
  precise objection is unconfirmed — the amendment also folded the job's `if:` across lines.
  **The deeper cause is not the YAML: it is that a workflow file cannot be tested before merge**, so
  a plausible improvement to one went in on reasoning alone.
- **PREVENTION:** gate + doctrine. (1) `workflow-lint` gained a fourth rule — a `workflow_run`
  trigger must name its workflows — labelled in the source as a house rule from this incident, not
  a schema requirement. (2) The filter is restored with the workflow PATHS listed alongside the
  names, which covers the unparseable case without removing the list. (3) Doctrine, now in the
  file's own header: on a workflow file, revert to the last shape that provably parsed and keep the
  delta minimal, rather than guessing between two candidate causes.
- **SIDE QUESTS:** none new — this is the third face of the 2026-08-22 workflow-fragility theme
  already banked above.

### A duplicated job key made postmaster.yml unparseable, and the run reported zero jobs

- **SHA:** 4235123   **DATE:** 2026-08-22   **STATUS:** closed
- **SIGNAL:** a re-label of issue #475 produced no Postmaster run at all. Working backwards from
  that silence found two red runs on `main` whose *name* was `.github/workflows/postmaster.yml`
  rather than `Postmaster` — GitHub's tell for a file it could not parse. ~7 minutes, and only
  because someone was already looking; no notification fires for a workflow that never starts.
- **ROOT CAUSE:** a scripted edit computed its deletion range as `s[:start] + s[end:]` where `end`
  matched an EARLIER occurrence of the anchor string (the event-research lane has the same
  `- if: steps.gate.outputs.armed == 'true'` step shape). With `end < start` the slice does not
  delete a region, it **duplicates** one — leaving `build-feedback:` defined twice. The local check
  was `yaml.safe_load`, which silently keeps the last duplicate key, so the file parsed clean
  locally and was rejected by GitHub. A rejected workflow does not fail one job; it produces a run
  with zero jobs, so the whole postmaster — feedback lane, event research, stall audit — was dead
  while `main` showed one anonymous red run.
- **PREVENTION:** gate. `scripts/workflow-lint.mjs` + `tests/arch/workflows.spec.ts` check the three
  states that file was actually in: duplicate mapping keys, a `steps.<id>.outputs` reference whose
  step no longer exists, and a `needs:` naming an undefined job. Verified against the broken file
  itself before landing. Second prevention: the CI Medic now treats a failed run with **zero**
  failing jobs as the workflow-rejected shape and files it (`parseFailure()`), instead of finding
  no failing job and filing nothing — the exact hole this incident would have fallen through.
- **SIDE QUESTS:** an anchor-based scripted edit should assert `end > start`; the deeper habit is to
  diff against the last-good file before pushing a workflow (→ docs/IDEAS.md).

### A feedback build died in bash before Claude was ever invoked, and nothing was watching

- **SHA:** 2d5921f   **DATE:** 2026-08-22   **STATUS:** closed
- **SIGNAL:** Eric, reading the Actions tab by hand — "a feedback submission job failed … blocking
  automatic pr generation." Zero automated signal: run 32545818804 failed at 02:17, the issue kept
  its `feedback` label and its claim lease, and the only eye on red runs (`incident-scan`) reports
  at the *next* test run and asks for a lesson, never a repair. Detection was a human, hours later.
- **ROOT CAUSE:** the model-tier heuristic in `postmaster.yml` built its reason string as
  `"…$(printf '%s' "$BODY" | grep -q '```' && echo ", includes a code block")"`. Under
  `set -euo pipefail` a command substitution whose `&&` short-circuits exits 1, and an assignment
  taking that status aborts the step. So every feedback issue **over 600 chars with no code fence**
  killed its own build — the branch was unreachable in testing because the only bodies exercised
  were short ones or fenced ones. Introduced by 4f60f18; first live body to hit it was #475 (1,410
  chars, no fence). Worse than a loud failure: the claim lease was already taken, so the issue read
  as claimed-and-building while nothing built it.
- **PREVENTION:** gate + script + doctrine. (1) The decision moved out of the workflow into
  `modelTier()` in `scripts/postmaster.mjs` — pure, and specced across all three branches including
  the exact 1,410-char body (`tests/scripts/model-tier.spec.ts`). (2) The claim step is now one
  specced call (`--claim-feedback`), deleting the last inline `node -e` + `jq` bash in that lane.
  (3) The **CI Medic** lane (`.github/workflows/ci-medic.yml`, `scripts/ci-medic.mjs`) turns a red
  run on `main` into a capsule issue plus a dispatched repair session, so the *next* silent failure
  is noticed by the system rather than by Eric.
- **SIDE QUESTS:** the claim lease has no release-on-failure path — a job that dies after claiming
  leaves the lease to expire on its 2h TTL (→ docs/IDEAS.md).

### Plans kept landing as committed files after Eric had moved them to GitHub issues
- **SHA:** n/a   **DATE:** 2026-08-21   **STATUS:** closed
- **SIGNAL:** Eric, on "draft the plans": "plans belong in github issues, not in source code. This is
  an error you persistently make." A repeat: #433 had already migrated the committed plans and
  #461/#462 the handoffs, yet the next session reached for `docs/plans/` again.
- **ROOT CAUSE:** the alignment substrate taught the old flow. `CLAUDE.md` → _Plans_ pointed at
  `docs/plans/` and `docs/plans/README.md` described a file lifecycle, so every session loaded the
  stale doctrine; the correction lived only in chat and in Eric's memory — never in the one doc that
  steers the next decision. Doc rot in the file read every session.
- **PREVENTION:** doctrine. `CLAUDE.md` → _Plans_ now says issues-only, names the house format
  (#429, #466) and forbids new files under `docs/plans/`; the README carries a superseded banner;
  persistent memory banks the correction. Ledger-only would not do — the doctrine line is what the
  next session actually reads.
- **SIDE QUESTS:** none

### The AI-first feedback front door shipped dead — its inline script ran before the form existed
- **SHA:** f7d91d7   **DATE:** 2026-08-21   **STATUS:** closed
- **SIGNAL:** Eric, within hours of the deploy: "the feedback form looks to be broken.. clicking on
  ai does nothing." Reproduced locally with Playwright: no console error, no network call, the click
  handler simply never attached. No mechanical net fired — the script's spec checked every DOM id
  existed on both sides, but never WHEN the script ran; the spec and the bug were blind to each
  other by construction (same shape as the 2026-08-16 wrapper miss).
- **ROOT CAUSE:** #449 made the coach the front door: intro box above the form, real form
  `display:none` until the coach yields a draft — but the inline `<script>` stayed attached to the
  intro markup, ABOVE the form. Inline scripts execute at parse time, `#fdbk-form` didn't exist
  yet, and the script's own `if (!box || !form) return;` null-guard exited silently. Dead "Let's
  shape it", dead "Skip →", hidden form: the entire member feedback funnel down, invisibly — every
  click path was designed to fail loudly except the wiring itself.
- **PREVENTION:** by-construction fix + gate. The script now attaches on `DOMContentLoaded`
  (markup order can never break it again) AND renders below the form; the spec pins both nets
  (readiness guard present; script rendered after every id it queries) in
  `tests/server/feedback-coach-script.spec.ts`.
- **SIDE QUESTS:** a real-browser CI smoke of the critical funnels (/feedback click-through) —
  parked in docs/IDEAS.md.

### `/security-review` reported clean over an EMPTY diff, on an envelope-protected file
- **SHA:** n/a   **DATE:** 2026-08-26   **STATUS:** closed
- **SIGNAL:** the session building #579 ran `/security-review` on `src/alpaca/alpaca-options-client.ts`
  — the brokerage client that can place option orders, and one of the narrowest files in
  `envelope.json`. The skill first failed to load (`origin/HEAD` is unset in a fresh worktree); after
  `git remote set-head`, it loaded and harvested **nothing**, because its command targets
  `origin/HEAD...` and the changes were still uncommitted. It was on course to return a clean verdict
  over a zero-line diff. Caught only because that session noticed the harvest was empty and reviewed
  the real diff by hand instead — no net would have caught it.
- **ROOT CAUSE:** two stacked, and the second is the dangerous one. (1) A git worktree does not
  inherit `origin/HEAD`, so the skill cannot resolve its base. (2) The harvest is `origin/HEAD...`,
  which by definition excludes uncommitted work — and **CLAUDE.md's own ship-loop instruction said to
  run it "before opening the PR"**, i.e. exactly when the changes are uncommitted. The documented
  workflow led directly into the silent case. A review that examines nothing and says "clean" is
  worse than one that errors, because it reads as assurance precisely where assurance is load-bearing.
- **PREVENTION:** the ship-loop bullet now says **commit first**, and in a worktree run
  `git remote set-head origin -a` first, with the reason attached so the instruction cannot decay back
  into the trap. The skill itself is a Claude Code built-in and cannot be fixed from this repo.
- **THE PATTERN, third sighting tonight:** a check that validates the wrong artefact reports success
  forever. `ship.sh checkbody` lints the local file while the transport rewrites the payload (the
  stripped `<details>` folds, 2026-08-25, and the defanged image embeds recorded directly below).
  Now a review skill grading an empty harvest. **When a gate passes, confirm it examined the thing you
  meant** — an empty input is not a pass.
- **SIDE QUESTS:** a `ship.sh` preflight that refuses to open a PR when a review skill's harvest came
  back empty would close all three; banked rather than built, since it wants its own specs.

### A fridge-rule picture did not render — and the cause is still open, so verify the STORED body
- **SHA:** n/a   **DATE:** 2026-08-26   **STATUS:** closed
- **SIGNAL:** a build session shipping #575 wrote a fridge-rule screenshot into its PR body the
  documented way — a committed `docs/shots/` PNG, SHA-pinned, `checkbody` green. Reading back what
  GitHub had actually **stored** showed the markdown defanged: the leading `!` stripped and the URL
  wrapped in backticks, so the image rendered as a literal code span, not a picture. Detection lag:
  minutes, and only because that session re-read the stored body instead of trusting `checkbody`.
- **ROOT CAUSE:** **not established** — corrected 2026-08-26, same night. The first version of this
  entry blamed "the outbound path for this session type." Three later sessions produced evidence
  against that, and the claim should not have been written as settled:
  - PR #605 carries an intact `![...]` embed in its stored body, so embeds plainly CAN survive.
  - `ship.sh open`'s SHA-pinning rewrites only the URL path segment (`scripts/ship.sh`, the
    `re.sub` over `raw.githubusercontent.com/…/docs/shots/`); it cannot strip a `!` or add backticks.
  - Three Wave-4 sessions independently found the GitHub MCP **read** tool strips
    `<details>`/`<summary>` *on display* while the stored body is intact — so a session that reads
    its own PR back through that tool can mistake sanitised output for a broken publish.
  Whether #575's embed was genuinely mangled on the way out, or merely looked mangled on read-back,
  is unresolved. What IS solid is the blind spot: `ship.sh checkbody` lints the local FILE, never
  what the API stored — the same gap that let MCP-stripped folds pass (2026-08-25). A gate that
  checks the input while something downstream may rewrite it reports success forever.
- **PREVENTION:** **verify the stored body over REST after opening** — not via the MCP read tool,
  which sanitises, and not from `checkbody`, which never saw it. Do NOT stop committing screenshots
  on the strength of this entry: the fridge rule stands, `docs/shots/` is still where they go, and a
  mermaid diagram remains a fine picture when a diagram is the honest one. If a REST read-back shows
  an embed actually mangled, THEN fall back to pointing at the committed PNG in Files changed. The
  durable fix is for `checkbody` to verify the STORED body, which closes this and the `<details>`
  case together.
- **SIDE QUESTS:** teach `ship.sh` a `--verify-stored <pr>` pass that re-reads the opened PR and
  fails on a defanged embed or a missing fold — one check closing two recorded incidents.

### The fridge rule's own instruction embedded link rot — #446's screenshots died a day after merge
- **SHA:** 29a0113   **DATE:** 2026-08-20   **STATUS:** closed
- **SIGNAL:** the hat-team communication research (white-hat rendering probe) found PR #446's
  fridge-rule screenshots — the flagship "pictures first" PR — returning 404 one day after merge,
  while a SHA-pinned URL to the identical file returned 200. Detection lag: ~1 day, and only
  because a research pass happened to check; no net watched for dead images in merged bodies.
- **ROOT CAUSE:** the PR template instructed embedding screenshots "via the branch's
  raw.githubusercontent URL." Squash-merge deletes the branch, so every image URL written per the
  instruction dies the moment the PR succeeds — the rule shipped its own rot into the permanent
  record (`main`'s squash bodies are the durable context cache).
- **PREVENTION:** gate + script + doctrine. `scripts/ship.sh open` now SHA-pins every
  `docs/shots/` raw URL to HEAD at open time, and `ship.sh checkbody` refuses any unpinned
  `raw.githubusercontent.com` URL (both proven in `tests/arch/ship.spec.ts`); the mechanics are
  doctrine in `docs/PICTURES.md`. The three dead links already baked into #446's immutable squash
  body stay dead — the files themselves live on `main`, noted here for the record.
- **SIDE QUESTS:** the landing meter (per-PR picture/waiver/reaction telemetry riding the digest
  tick) → filed as issue #456 via the new fan-out route.

### A wrapper shipped a PR claiming a contract "validated clean" when it hadn't
- **SHA:** n/a   **DATE:** 2026-08-16   **STATUS:** closed
- **SIGNAL:** CI red on Eric's first real `handoff:ship` run (#354) — 122 lint errors — and the
  handoff gate failing the bundle's contract. But the PR body that same script had written said
  *"Contract validated clean by `handoff-scan --validate` before this PR opened."* Detection lag:
  minutes, and only because CI ran; the false claim itself was never going to be caught mechanically.
- **ROOT CAUSE:** two independent misses. (1) `handoff-import.mjs` exited `0` unconditionally after
  pushing while its `--no-push` path correctly exited `clean ? 0 : 1` — so its documented contract
  ("exit 1 means authoring work remains", docs/HANDOFFS.md) was true on one path and false on the
  other. `handoff-ship.mjs` read that exit code as the chain's stop condition, so a dirty contract
  read as success: PR opened, body asserting a validation that never passed. With `--ready` it would
  have flipped a *skeleton* contract to `ready` and licensed an unattended build from it. (2) The
  wrapper's own failure-mode tests exercised the dirty-contract case **only** under `--no-push` —
  the single mode where the exit code was already right. The test and the bug were blind to each
  other by construction.
- **PREVENTION:** gate + spec. The importer exited `clean ? 0 : 1` on both paths (fix at the
  source, so every caller inherits it), and an arch spec asserted every terminal exit after the
  contract scan carried the verdict. *(2026-08-21: importer, spec, and the handoff system they
  guarded were all retired together — handoffs live as GitHub issues now, docs/HANDOFFS.md. The
  transferable lesson stands: a wrapper's exit code IS its contract, and specs must exercise the
  path that ships, not only the dry-run path.)*
- **SIDE QUESTS:** the deeper prompt — "must a bundle merge into the codebase at all?" — became the
  issue-as-mailbox intake (Eric's question, same session); the repo being public is what makes
  attachment retrieval viable at all.

### Three consecutive PRs shipped with a literal `{}` description
- **SHA:** 6e587aa   **DATE:** 2026-08-15   **STATUS:** closed
- **SIGNAL:** Eric read a PR page and saw `{}` where the document should be — a human net, after
  three PRs (#346–#348) over ~2 hours. Nothing mechanical would ever have flagged it: the PRs
  merged green, and the doctrine ("PRs are documents", CLAUDE.md ship loop) lived only in prose.
- **ROOT CAUSE:** `scripts/ship.sh cmd_open` silently defaulted the body to the literal string
  `"{}"` when `--body-file` was omitted, and sessions omitted it on "small" PRs — a silent
  default plus an unenforced doctrine. The context cache lost three entries.
- **PREVENTION:** gate + eval. ship.sh now refuses to open without a non-empty `--body-file`
  (the silent default is deleted), and `tests/arch/ship.spec.ts` proves the refusal in CI so the
  prevention itself cannot regress (Eric's call: "an eval can likely catch that type of
  regression"). The PR template now encodes the three-audience layering (human top → hybrid
  details → optional machine-context fold) and the empty bodies were backfilled.
- **SIDE QUESTS:** none

### Every PR that started as a draft merged without CI ever running
- **SHA:** 5dcd38b   **DATE:** 2026-08-14   **STATUS:** closed
- **SIGNAL:** none from the system — the gate reported no failure because it never ran. Caught only
  because a session watching its own PR read the check runs directly and found `verify: skipped` on a
  PR that had been marked ready for review. Detection lag: unbounded. Nothing in the repo could have
  raised this on its own, and the dashboard of green checkmarks looked exactly the same either way —
  which is what makes a silent gate worse than a red one.
- **ROOT CAUSE:** `pipeline.yml` filtered `verify` on `draft == false` but never added
  `ready_for_review` to the `pull_request` trigger's `types:`. GitHub's default types are
  `opened`/`synchronize`/`reopened` only, so the sequence was: draft PR opens → run fires → `verify`
  skips (correctly, it's a draft) → PR promoted to ready → **no run fires at all** → the stale
  `skipped` check remains the latest word on that SHA → branch protection counts a skipped check as
  a pass → merge allowed. Each half was individually reasonable; the hole existed only in their
  composition, which is why reading either one in isolation looks fine. Blast radius was not an edge
  case: Claude opens every PR as a draft by default, so this was the normal path for Claude-authored
  work, and #322 merged through it having run zero tests in CI.
- **PREVENTION:** gate — `types: [ opened, synchronize, reopened, ready_for_review ]` in
  `.github/workflows/pipeline.yml`, so promoting a draft fires a real run and `verify` moves to
  *pending* (which branch protection blocks on) instead of staying *skipped* (which it doesn't). The
  rationing intent is preserved exactly: drafts still don't burn runner minutes. The comment block
  above the trigger carries the *why*, co-located, so a future edit can't quietly drop it again.
- **SIDE QUESTS:** worth confirming `verify` is actually listed as a required check in branch
  protection — this fix guarantees the run happens, but only branch protection makes it *block*. That
  setting is Eric's (repo settings, not expressible in-repo). Broader thread → docs/IDEAS.md: a
  "skipped ≠ passed" audit over the other gates, since any check that can skip itself inherits this
  same shape.

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

### Concurrent background-agent worktrees raced and flipped the main checkout's core.bare to true
- **SHA:** n/a   **DATE:** 2026-08-13   **STATUS:** closed
- **SIGNAL:** the session's stop-hook git-check fired four times in about an hour with "fatal: this
  operation must be run in a work tree" — `git status` in the main checkout failed outright each
  time, even though nothing there had actually changed. Detection lag: seconds per occurrence (the
  stop hook itself catches it immediately); the *pattern* wasn't recognized as a race until the
  third/fourth repeat.
- **ROOT CAUSE:** three background agents ran concurrently with `isolation: "worktree"`, each
  running `git worktree add`/`remove` against the SAME shared `.git` directory (worktrees share
  their parent repo's `.git` by design). Git 2.43.0's worktree add/prune path writes the shared
  `.git/config`; concurrent writes from multiple agent processes racing on that file corrupted it,
  flipping `core.bare` from `false` to `true` — which makes every git command in the main checkout
  (and every other worktree) fail with "must be run in a work tree," even though the working tree
  and its files were never touched.
- **PREVENTION:** ledger-only, deliberately not mechanized tonight — the fix is one command
  (`git config core.bare false`) and takes seconds once the signature is recognized; building a
  real fix (serializing worktree operations, or avoiding concurrent `isolation: "worktree"` agents
  against one repo) costs more engineering than the four recurrences tonight cost to fix by hand.
  Recognize the signature — "fatal: this operation must be run in a work tree" from a checkout that
  was fine moments earlier, especially with parallel worktree-isolated agents running — and run
  `git config core.bare false` immediately. Never treat it as real uncommitted-work loss, and never
  run a destructive git command (`reset --hard`, `clean -f`) in response to this specific error.
- **SIDE QUESTS:** worth a future look — does a newer git version fix this race, or does the
  harness's worktree-isolation feature serialize `git worktree` calls internally so this can't
  happen? Neither investigated tonight. → docs/IDEAS.md.

### A background agent used `git stash` despite CLAUDE.md's explicit warning, and hit the exact failure mode warned about
- **SHA:** n/a   **DATE:** 2026-08-13   **STATUS:** closed
- **SIGNAL:** the agent building PR #318 self-reported, unprompted, in its final report: "I hit the
  exact `git stash` failure mode CLAUDE.md warns about (silently misapplied a stash across a moving
  branch ref)... recovered cleanly via `git show <ref>:<path>` restores... no work was lost."
  Detection lag: none from outside — self-caught and self-recovered inside the same agent run; it
  only surfaced at all because the agent chose to disclose it in its report.
- **ROOT CAUSE:** CLAUDE.md already carries an explicit warning ("Branch-first avoids needing
  `git stash`... don't use `git stash` in this environment — it has silently dropped stashed edits
  on pop"), but it's prose inside a long file, not a mechanically enforced rule, and a subagent
  working under branch-motion pressure (its base branch was being actively pushed to by the parent
  session concurrently) reached for the familiar general-purpose git tool anyway. Same shape as the
  "deploy doom loop" lesson above: a warning that already existed in doctrine and still wasn't
  enough, because nothing stops the tool from being reachable.
- **PREVENTION:** ledger-only, justified explicitly — there is no standard git hook that intercepts
  `git stash` (hooks fire on commit/push-shaped events, not on stash), and agents run in ordinary
  shells rather than a restricted git wrapper, so a hard mechanical gate isn't cheaply available
  today. This entry is the reinforcement: a second, concrete, recent instance to point future
  sessions at, since the first (prose-only) warning wasn't enough on its own.
- **SIDE QUESTS:** → docs/IDEAS.md — a `git stash`-blocking shell wrapper for agent bootstraps, if
  the harness ever exposes a place to inject one.

### The flip button did all the work, then died at `gh pr create` — Actions can't open PRs by default
- **SHA:** 76f9276   **DATE:** 2026-08-17   **STATUS:** closed
- **SIGNAL:** the first-ever dispatch of "Flip a handoff to ready" (the pipeline canary,
  `brief-horizon`) failed with `GraphQL: GitHub Actions is not permitted to create or approve pull
  requests (createPullRequest)`. Detection lag: none — it was the run's own exit code, surfaced
  within seconds, because the canary existed to be watched.
- **ROOT CAUSE:** **Settings → Actions → General → Workflow permissions → "Allow GitHub Actions to
  create and approve pull requests"** is **off by default** on GitHub repositories. Every workflow
  in this repo that opens a PR (`handoff-flip.yml`, `handoff-inbox.yml`) had been written assuming
  the capability, and none had ever executed its final step against the real repo — the mailbox's
  live tests were all no-zip smoke tests, which return before the PR step. So the defect sat latent
  in two workflows at once. Worse than the failure itself was its *shape*: the flip had already
  committed and pushed the branch, so the run failed after doing all the real work, leaving a
  correct branch stranded behind an error message that named no next step.
- **PREVENTION:** two layers. (1) The setting is enabled — the actual fix, one checkbox, and it
  unblocks every current and future PR-opening workflow. (2) Mechanical, in the postmaster cutover:
  `execute()` wraps PR creation so a refusal no longer discards the work — it comments the
  `…/compare/<branch>?expand=1` URL on the originating issue, prints it, writes it into the run
  receipt, and names the setting in the message, so the reader can fix the cause rather than the
  symptom. Specced with a fixture where PR creation is refused.
- **THE CANARY EARNED ITSELF:** this is the case the canary was staged for. Had the first dispatch
  been `trailer-debut`, the same failure would have landed on a large public-facing bundle instead
  of a one-line text change — and had it first appeared via the mailbox, it would have struck after
  downloading and importing a real zip. Fifth defect of the day found by running the thing rather
  than reasoning about it.
- **SIDE QUESTS:** → docs/IDEAS.md — a repo-settings preflight (a scripted check that the
  capabilities the workflows assume are actually enabled), since this class of defect is invisible
  to every local gate.

### The chain was severed at the join — a workflow's issue can never wake another workflow
- **SHA:** 099ff3c   **DATE:** 2026-08-17   **STATUS:** closed
- **SIGNAL:** Eric, watching the canary sit: *"I'm waiting.. when will i know?"* The handoff was
  `ready`, `handoff-detect` had run green, and the `[handoff] brief-horizon` issue was open — yet
  nothing built it. `claude.yml` had **4 lifetime runs, all from issues created with my own token**;
  issue #367, created by a workflow, produced **zero**. Detection lag: the whole evening, and only
  because a human asked. Every workflow involved was green the entire time.
- **ROOT CAUSE:** **events triggered by `GITHUB_TOKEN` do not start other workflow runs** —
  GitHub's infinite-loop guard, and it is silent by design: no error, no annotation, no skipped
  run to notice. The architecture was `detect opens an issue mentioning @claude` →
  `claude.yml hears issues.opened` → builds, and the middle arrow never existed. It had never
  worked once. What made it survive a full day of building was the **hourly polling Routine
  masking it**: the poller was assumed to be the belt to the event path's braces, so its silence
  read as "nothing due" rather than "the only path is dead". A backup that quietly carries the
  load hides the failure of the thing it backs up.
- **PREVENTION:** structural, not a note — the hop is **deleted**. `postmaster.yml` scans and
  builds in the same run, so no critical-path step depends on one workflow's write emitting an
  event another workflow hears. The issue still opens, but it is now explicitly a **receipt, never
  a trigger**, and both `.github/workflows/postmaster.yml` and `docs/HANDOFFS.md` say so at the
  top, in the place a future session editing the trigger block will read. Claiming moved to an
  atomic `POST /git/refs` lease visible in `git ls-remote` within seconds, so "did anything pick
  this up?" is now answerable in one command instead of inferred from silence. Measured after:
  claim ref appeared **23 seconds** after dispatch, against a 20-minute blind window before.
- **THE POLLER WAS THE BUG'S ACCOMPLICE:** Eric named this before the mechanism was found —
  *"waiting for commits to a doc file - seems flimsy af"*, then *"we want event driven
  architecture, not polling (shit) architecture"*. The critique was right for a reason neither of
  us had yet: polling did not just add latency, it **concealed a severed chain** by making the
  end-to-end outcome look merely slow.
- **SIDE QUESTS:** → docs/IDEAS.md — retire the hourly pickup Routine once the event path has run
  clean a few times; a redundant path that can mask a dead one is a liability, not a safety net.

### A build session ran 21 turns, spent $0.88, changed nothing — and CI went green
- **SHA:** n/a   **DATE:** 2026-08-17   **STATUS:** closed
- **SIGNAL:** the first real `build the handoff` job finished **successful** with an untouched
  repo: no branch, no commit, no PR. The result line said it plainly for anyone who read past the
  status: `"is_error": false, "num_turns": 21, "total_cost_usd": 0.877…,
  "permission_denials_count": 6`. Detection lag: none once the log was opened — but the workflow's
  own green check actively argued against opening it.
- **ROOT CAUSE:** `anthropics/claude-code-action@v1` grants **only GitHub's own tools by default**.
  Every `git`, `npm`, and file-write call the build prompt asked for was refused, six times, and
  the session reasoned its way around the refusals for 21 turns. The action then exited `success`
  because **the session completed without error** — which is a true statement about the session and
  a false one about the build. That gap is the whole defect: a green check that certifies the
  wrong noun.
- **PREVENTION:** mechanical, at the source — `claude_args: --allowedTools "Bash,Read,Write,Edit,
  Glob,Grep"` on the build step, with the failure narrated in a comment directly above it so the
  next person to touch that step reads the story before editing the flag. Verified against the
  action's own configuration reference in `anthropics/claude-code-action` — not from memory: the
  flag is camelCase *inside* `claude_args`, and a top-level `allowed_tools` input is not the
  current surface.
- **GREEN IS NOT DONE — CHECK THE ARTIFACT, NOT THE CHECK:** three of today's seven defects
  (`handoff-import`'s unconditional exit 0, the severed event chain, this one) share one shape: a
  success signal describing a *narrower* event than the one being relied on. The durable habit is
  to verify the **artifact** — is there a branch, a commit, a PR? — never the status of the process
  that was supposed to produce it.
- **SIDE QUESTS:** → docs/IDEAS.md — have the postmaster's auditor treat "claim ref exists, no
  branch after N minutes" as a stall and say so, which would have caught this without anyone
  reading a log.

### The same severance, one hop over — a PR opened by `GITHUB_TOKEN` gets no checks at all
- **SHA:** n/a   **DATE:** 2026-08-17   **STATUS:** closed
- **SIGNAL:** the canary's PR (#371) opened successfully, carrying a clean five-file diff and three
  well-formed commits — and `get_check_runs` returned **`total_count: 0`**. Not a failing check: no
  checks. `mergeable_state: "blocked"`, because a required check that never runs never passes.
  Detection lag: none, but only because the artifact was inspected directly rather than the run's
  status — the postmaster run itself was green and correct.
- **ROOT CAUSE:** **the identical `GITHUB_TOKEN` severance banked two entries above, at a hop I had
  not audited.** The fix for that one removed the *issue* hop (scan and build now share a run), and
  I stopped there — but the build's final act is opening a PR, also with `GITHUB_TOKEN`, so
  `pull_request.opened` is never emitted and `pipeline.yml`'s `verify` never fires. Fixing one
  instance of a class and not sweeping for the rest is the actual mistake here; the mechanism was
  already fully understood and written down when this defect shipped.
- **PREVENTION:** two layers, and the honest one is not mechanical yet. (1) **Immediate, token-free:
  close and reopen the PR from any account that is not the Actions token** — `reopened` is already
  in `pipeline.yml`'s `types:` list (kept there by the draft-skip lesson of 2026-08-14, which pays
  for itself again here), so CI arms within seconds. Used on #371: `verify` went green. (2) **The
  real fix is a credential and therefore Eric's** — a fine-grained PAT, used for the PR-opening
  steps, so the PR is authored by an identity whose events GitHub does not suppress. Deliberately
  **not** self-authorized, and deliberately not worked around by having the build job mint its own
  check run named `verify`: a gate that certifies itself is worse than a gate that visibly did not
  run. **Authorized and mechanised same-day**, then improved the same afternoon when Eric read the
  shape and said *"a probot app seems like a superior later abstraction as the postmaster role"* —
  correct, and for the reason that matters: the **App identity** is what GitHub does not suppress,
  and unlike a PAT it never expires. Every PR-facing step now reads
  `steps.app-token.outputs.token || secrets.HANDOFF_PR_TOKEN || secrets.GITHUB_TOKEN`, minting the
  App token per job (the action revokes it at job end). The middle tier is deliberate — a repo that
  already minted the PAT must not be silently downgraded by the upgrade. Setup for both is in
  `docs/HANDOFFS.md`, and the last tier degrades loudly (a run warning naming the close/reopen
  workaround) rather than stranding work, so a missing identity is a nuisance and never an outage.
- **THE CLASS, NOT THE INSTANCE:** every place this repo's automation writes through
  `GITHUB_TOKEN` and expects a downstream reaction is suspect until checked. Three found so far:
  issue-opened (fixed by collapsing the hop), PR-opened (this), and any push to a branch made by a
  workflow (unexercised today, same property). The sweep is the deliverable, not the patch.
- **SIDE QUESTS:** → docs/IDEAS.md — an artifact-shaped auditor rule for this exact shape: *PR open
  for N minutes with zero check runs* → comment and warn. Same family as the claim-with-no-branch
  rule; both ask "did the thing actually happen?" rather than "did the process report success?".

### The deploy doom loop, thirteen more times — the same fixed bug, not new incidents
- **SHA:** fd415ee   **DATE:** 2026-08-11   **STATUS:** closed
- **SHA:** 0906c84   **DATE:** 2026-08-11   **STATUS:** closed
- **SHA:** f9526ba   **DATE:** 2026-08-10   **STATUS:** closed
- **SHA:** c5da8a6   **DATE:** 2026-08-10   **STATUS:** closed
- **SHA:** 4b63c13   **DATE:** 2026-08-10   **STATUS:** closed
- **SHA:** cbd18bf   **DATE:** 2026-08-10   **STATUS:** closed
- **SHA:** 201c52d   **DATE:** 2026-08-10   **STATUS:** closed
- **SHA:** d07c0d3   **DATE:** 2026-08-10   **STATUS:** closed
- **SHA:** 1163671   **DATE:** 2026-08-10   **STATUS:** closed
- **SHA:** 494b704   **DATE:** 2026-08-10   **STATUS:** closed
- **SHA:** b85486e   **DATE:** 2026-08-10   **STATUS:** closed
- **SHA:** 1b6df05   **DATE:** 2026-08-10   **STATUS:** closed
- **SHA:** a5ebe9d   **DATE:** 2026-08-10   **STATUS:** closed
- **SHA:** b29b4fb   **DATE:** 2026-08-10   **STATUS:** closed
- **SHA:** e9390b9   **DATE:** 2026-08-09   **STATUS:** closed
- **SIGNAL:** `incident-scan.mjs`'s own 14-day lookback still carried 21 unlearned `main` failures
  when this batch closure was written — only `615a269` (the entry directly above) had a ledger
  line. Detection lag: none, since the scan is the detector; the gap was that 14 of its 15 findings
  in the doom-loop window had never been closed out with an entry.
- **ROOT CAUSE:** every SHA above is the **same defect already root-caused and fixed by `615a269`**
  ("the deploy doom loop") on the same two days: the pre-push hook re-running the full suite on
  `main`, which counted its own prior failures via this very gate, climbing self-amplified (28→41
  and up) until the `prepare` fix landed. They were never separate incidents to investigate — they
  are the raw symptom the `615a269` entry already explains and closes. Writing 14 near-duplicate
  postmortems for one bug would be a worse ledger than one, so this entry batch-closes them by
  reference instead of re-deriving what is already on record.
- **PREVENTION:** already mechanized (see `615a269`: `prepare` is `test -n "$CI" || husky`). The
  gap this entry actually closes is process, not code: **an incident isn't done at "root-caused,"
  it's done at "every commit sha it produced has a ledger line"** — the gate checks individual
  shas, so a batch failure needs a batch closure the same day the root cause is found, not a lone
  entry that leaves siblings to accumulate as phantom debt. Doctrine line worth keeping in mind for
  the next self-amplifying gate: close the *whole blast radius*, not just the sha that got looked at.
- **SIDE QUESTS:** none — the finding is fully captured under `615a269`.

### The App/PAT fix for `GITHUB_TOKEN` severance was designed 2026-08-17 but never installed
- **SHA:** e122ee8   **DATE:** 2026-08-17   **STATUS:** closed
- **SIGNAL:** two consecutive "Flip a handoff to ready" runs on the same commit both failed opening
  the authorization PR: `pull request create failed: GraphQL: GitHub Actions is not permitted to
  create or approve pull requests (createPullRequest)`. Separately, in this same session, PR #448
  (a postmaster-opened feedback PR) sat on "1 workflow awaiting approval" and PR #445 needed a
  manual push from a real identity before `verify` would even start. Detection lag for the ledger
  gap: three days, until this retro.
- **ROOT CAUSE:** this is **not a new defect** — it is the exact class the 2026-08-17 entry two
  above ("The same severance, one hop over") already diagnosed and built a fix for: work done under
  the bare `GITHUB_TOKEN` carries no real GitHub identity, so GitHub suppresses the reactions that
  identity would normally trigger (`pull_request.opened` never fires; and, the piece this session
  newly confirmed empirically, a **workflow run whose triggering actor is `github-actions[bot]`
  requires manual approval** — proven live on PR #445: the original push (actor
  `github-actions[bot]`) sat `action_required`; an identical push moments later from a real
  collaborator ran immediately, no gate). The fallback chain that entry built —
  `steps.app-token.outputs.token || secrets.HANDOFF_PR_TOKEN || secrets.GITHUB_TOKEN` — degrades
  honestly, but **the App was never installed and no PAT was ever added**, so every postmaster run
  since has been running on the bottom, honest-degrade tier: real GitHub identity, still absent.
- **PREVENTION:** the gate/script and the doctrine line both already exist (`docs/HANDOFFS.md`
  steps 1-6, written 2026-08-17). What's missing cannot be mechanized further from inside the
  repo — a GitHub App installation and its two secrets (`APP_CLIENT_ID`, `APP_PRIVATE_KEY`) are
  themselves credentials, squarely the irreversible class CLAUDE.md reserves for Eric. Ledger-only
  by necessity: the fix is one five-minute owner action away, already documented, not a missing
  mechanism.
- **SIDE QUESTS:** → docs/IDEAS.md — a check-in nudge (weekly postmaster digest, or the incident
  scan itself) that names "the App/PAT fallback is still on its bottom tier" explicitly, rather
  than relying on someone noticing the pattern across unrelated symptoms three days apart.

### `ensureLabel`'s upsert never upserted — curl without `--fail` hid a 404 as success
- **SHA:** b76ac2e   **DATE:** 2026-08-19   **STATUS:** closed
- **SIGNAL:** the stall audit's `gh issue edit --add-label stall-flagged` failed outright:
  `'stall-flagged' not found`. `ensureLabel()` runs immediately before that call specifically to
  prevent this. Detection lag: immediate (the job failed loudly), but the actual defect sat
  unnoticed in `ensureLabel` itself until this retro.
- **ROOT CAUSE:** `ensureLabel`'s upsert-by-PATCH-then-POST-create-fallback pattern is correct in
  shape, but its `curl` calls were missing `--fail`. Without it, `curl -sS` exits `0` for **any**
  HTTP response, including a 404 body for a label that doesn't exist yet — so the `try` never
  threw, the `catch` (which contains the create-via-POST fallback) never ran, and the label was
  silently never created. The comment directly above the code ("GitHub auto-creates a label the
  first time it is applied") describes the *intended* self-healing behavior; the missing flag is
  exactly why it didn't happen.
- **PREVENTION:** gate/script — `scripts/postmaster.mjs`'s `ensureLabel` now passes `--fail` on
  both the PATCH and the POST, so a real HTTP failure (including "doesn't exist yet") throws and
  reaches the fallback, while the intentionally-swallowed "already exists" 422 on the POST still
  degrades silently exactly as designed. Fixed in this PR, not deferred.
- **SIDE QUESTS:** none — worth a quick sweep of other bare `curl` calls in the repo's scripts for
  the same missing-`--fail` shape, but `importZip`'s (the only other one) already carries `-f`.

### A handoff-flip retry raced its own successful predecessor — not a defect
- **SHA:** 2969eb9   **DATE:** 2026-08-17   **STATUS:** closed
- **SIGNAL:** "Flip a handoff to ready" failed for `brief-horizon` with `brief-horizon is 'ready',
  not 'draft' — nothing to authorize.`
- **ROOT CAUSE:** a precondition check working exactly as designed. An earlier run (`e122ee8`,
  entry above) had already flipped `brief-horizon` to `ready`; this run was a retry of the same
  intent arriving after the fact, and `handoff-scan.mjs --validate` correctly refused to re-flip an
  already-ready handoff. The failure is the guard catching a stale retry, not a gap letting
  anything wrong happen.
- **PREVENTION:** ledger-only — this is the system behaving correctly under a race that is itself
  a symptom of the `e122ee8` PR-creation failures above (retries happen because the first attempt
  visibly failed to open a PR, even though the flip itself had already landed). No new mechanism
  needed; closing the `e122ee8` gap removes the retries that produce this shape.
- **SIDE QUESTS:** none.

### `claude-code-action@v1` rejects `push` as an event type — the event-research lane's first live firing
- **SHA:** e854590   **DATE:** 2026-08-20   **STATUS:** closed
- **SHA:** 76f6215   **DATE:** 2026-08-19   **STATUS:** closed
- **SHA:** 5de1b7f   **DATE:** 2026-08-19   **STATUS:** closed
- **SIGNAL:** the Postmaster's "research due events" job failed with `##[error]Action failed with
  error: Unsupported event type: push`. Detection lag: none — the job failed loudly on its own
  first three real firings.
- **ROOT CAUSE:** that job runs `anthropics/claude-code-action@v1` on a `push` trigger (research
  due calendar events after every merge to `main`), but the action's entrypoint does not recognize
  `push` among its supported GitHub event types and aborts before doing any research. This is a
  genuinely new defect (not a recurrence of the identity-severance class above) — the lane simply
  had never fired on a real push before this window.
- **PREVENTION:** gate/script — `.github/workflows/postmaster.yml`'s `route` job now re-fires
  itself via `gh workflow run postmaster.yml -f command=scan` when a push turns up due events,
  instead of letting `build-events` invoke the action directly under `push`; `build-events`'s `if:`
  now requires `github.event_name == 'workflow_dispatch'`, so it only ever runs on that
  re-dispatched pass, which `claude-code-action@v1` does support. **This one WAS self-authorized to
  edit despite being a workflow file** — normally the outward-facing/irreversible carve-out per
  CLAUDE.md, held for Eric — because Eric gave direct, explicit, in-the-moment instruction to fix
  this specific failure ("that's a problem we need to fix, pronto") while watching it happen live;
  that is his authorization for this one change, not a standing exception to the carve-out.
- **SIDE QUESTS:** → docs/IDEAS.md — (a) audit every `claude-code-action@v1` trigger in this repo
  for event types the action actually supports, rather than discovering each gap on its first
  firing; (b) the `build` job (handoff builds) shares the identical exposure whenever a handoff is
  claimed on a `push`-triggered run rather than a `workflow_dispatch` — unconfirmed whether it has
  ever actually hit this in practice, worth the same re-dispatch treatment if it does.

### A markdown screenshot embed — and `<details>`/`<summary>` — vanished through `ship.sh` too: the 2026-08-25 attribution to the GitHub MCP tools was incomplete
- **SHA:** 5eb6b8a   **DATE:** 2026-08-26   **STATUS:** closed (worked around; the constraint itself
  is outside repo control)
- **SIGNAL:** PR #661's fridge picture — `![alt](<SHA-pinned raw.githubusercontent.com URL>)`, opened
  via `scripts/ship.sh open` (REST, not the GitHub MCP write tools) — came back from
  `pull_request_read` with the `!` dropped and the URL wrapped in stray backticks/quotes,
  non-identically across two otherwise-identical attempts. Separately, the SAME PR body's
  `<details><summary>...</summary>...</details>` fold — the exact shape CLAUDE.md and the
  2026-08-25 entry above say is safe over REST — also came back stripped, twice, over a plain
  `curl` PATCH.
- **ROOT CAUSE:** isolated with direct REST probes (payload built and diffed locally first —
  confirmed byte-identical up to the `curl` call each time, so not a `ship.sh` bug, and not the
  GitHub MCP SDK either): a bare-text mention of a `raw.githubusercontent.com`/`github.com/.../blob/...`
  URL survives untouched; wrapping the *identical* URL in `[text](url)`/`![alt](url)` markdown link
  syntax gets it neutralized. `<details>` survived in a short, isolated single-line test body but
  was stripped in the full-size real PR body, both times, over REST — so the trigger is not
  "REST vs MCP" as previously recorded, and is not fully characterized (content size/shape
  dependent, not deterministically reproduced in a minimal repro). This is a session-side outbound
  content-safety layer (not documented in the local agent-proxy README, which only covers
  TLS/connectivity failures) — plausibly anti-exfiltration/anti-auto-fetch for links, and
  anti-hidden-content for the fold, applied even to legitimate same-repo content. **Correction to
  the 2026-08-25 entry and to CLAUDE.md/`docs/PICTURES.md`'s current framing: "ship through REST
  and the fold survives" is not reliably true in this session** — REST is necessary (still avoids
  the MCP tool's own separate stripping) but not sufficient. Not a bug to work around by disguising
  content — that would be evading a deliberate safety boundary.
- **PREVENTION:** doc-only (no code fix exists for a constraint outside repo control) —
  `docs/PICTURES.md` → *Screenshots* now names the link-mangling finding and the fallback: waive
  the picture section honestly (`Picture: waived — <reason>`), name the committed `docs/shots/...`
  path in prose (GitHub's own Files-changed tab renders it inline, unaffected by this), and send
  the image directly to the user in-session (`SendUserFile`). For `<details>`: until the trigger is
  characterized, treat *any* automated PR-body write in this session as unreliable for the fold —
  after writing one, always re-fetch and check for the literal `<details>` tag, not just for
  `<img>`/tables (the 2026-08-25 mitigation), and flatten to plain sections if it's gone rather than
  retrying the same call.
- **SIDE QUESTS:** → docs/IDEAS.md — (a) worth a follow-up probe (not done here, to stay bounded)
  whether an image uploaded through GitHub's own attachment flow (`user-attachments/assets/...`)
  survives where a repo-file URL doesn't; (b) characterize the actual `<details>` stripping
  trigger (body size? specific preceding content? something else?) instead of the current
  "sometimes it survives, sometimes it doesn't" — a minimal bisection would settle it in a few
  more probes, deliberately not spent here to stay on the shipping task.
