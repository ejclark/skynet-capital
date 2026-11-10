# Working agreements — the full text of rules CLAUDE.md states in one line

These apply to specific task classes, so they load when that task comes up instead of in every session (#6470). A rule moved here that gets broken in the task class it governs goes back into `CLAUDE.md`: read this file before doing one of these tasks.

## A brain-dump is a planning session

**A brain-dump is a planning session, not a spec** (Eric, 2026-09-06, on a numbered list of
"misc thoughts, non-exhaustive" about the research surface: "Thinking out loud — love it. This is
exactly what I tend to do. A lot... I figured the prompt I gave would be helpful for a planning
session"). When a prompt arrives as numbered/nested thoughts with hedges ("I can't see enough to
grok", "not sure how to improve", "there's likely many talking points I have yet to articulate"),
read it as a design conversation: each item is a *signal about an outcome*, the mechanism named
beside it is a first guess, and the hedged items are the ones he most wants Claude to fill in. The
deliverable is an assessment plus the IA decision written down (a `plan` issue, per the IA rule
in `CLAUDE.md`) — never a build of the list verbatim, and never a paragraph per item echoing it back. Hunt
in proximity (the "talking points I have yet to see" are an explicit invitation for side quests),
quantify the hunches against the corpus/code, and hand back the smallest vocabulary that turns his
"feels out of place" into a precise request. Store the reasoning where it survives the session
(the issue, `/journey`), not in chat. **And when the brief carries acceptance criteria, the
planning session ends by starting the build, not by handing the `ready` flip back** (Eric,
2026-09-06, after the research brief produced a plan issue and a "flip `ready`" ask: "I provided
rich acceptance criteria... this was intended to establish plumbing to enable you to grind through
the work"). The written decision is the plumbing; his brief was the go signal. Flip the plan
yourself through the door a session has for plans — a comment whose first line is exactly
`ready — take slice 1 per the state block`, the brief cited beneath it, ending with the lane
footer (`FOOTER`, `scripts/moneypenny/labels.mjs`) so only that first line is judged — never
the `ready` label ([`docs/ISSUES.md`](docs/ISSUES.md) → *Ready — the one definition*). The plan
lane then claims slice 1; check that `in-progress` lands, because a refused flip leaves only a
notice in the Actions run while the plan sits idle. The flip comes back to him only when a fork
he alone can settle is genuinely blocking. **Between the research and the grind, a rubber-duck
round** (Eric, 2026-09-06: "This is a prime time to pair with coworkers when they are in this
state... rapid ideation which produces aha moments that accelerate emergence of new designs... it
organically battle tests talking points"). The trigger is his state, not a checklist: while he is
thinking out loud, bounce the research findings back as short options he can react to — a pattern
on a candidate surface, a number that contradicts a hunch, the fork the code just surfaced — and
let the reactions amend the plan before slice 1 opens. Timeboxed, divergent, never a build; the
interrogation pass is the adversarial half, this is the generative half. Evidence it earns its
place: the fog-of-war audit and the propose-then-place rule both came out of the banter *after* the
research brief, not from the research itself.

## Fog of war

**Fog of war is a first-class reveal pattern, with written criteria** (Eric, 2026-09-06, on the
research day lens: "a spot on / perfect scenario"). Withhold a *capability* behind an earnable
rung, never *information* a member needs to stay safe; draw the door visible · named · disabled ·
counted. The decision tree and the instance ledger live in
[`docs/FOG-OF-WAR.md`](docs/FOG-OF-WAR.md) — run a candidate through it before fogging anything. **The general rule this instance taught:** Claude *proposes* patterns it
knows how to deliver, rendered on a candidate surface; Eric *places* them. A rejected placement
banks the pattern (`docs/IDEAS.md` inbox), never the idea — fog of war was declined for the
ticket on 2026-09-05 and landed on the research day lens a day later. Once a textbook case is
found, run its criteria across the app: the same tree finds the other candidates *and* strips the
gates that were never the pattern, which is how the emerging design gets its noise removed.

## Plans live in GitHub issues

**Plans live in GitHub issues, never in the repo** (Eric, 2026-08-21: _"plans belong in github
issues, not in source code"_ — a correction he has had to repeat; #433 moved the committed ones). A
plan is an issue in the house format (intent & end-state · EARS criteria · constraints · settled
forks · open questions · Eric's steps · slicing sketch — see #429, #466), labelled `enhancement` +
`plan`, in the capsule shape every issue uses ([`docs/ISSUES.md`](docs/ISSUES.md) — one-line ask,
metadata table, 2–4 talking points and a picture above the fold, the whole brief in one `<details>`).
Eric's label/comment is the `ready` flip; Claude executes unattended, banking mid-flight questions as
issue comments instead of guessing — the richer the issue, the fewer interventions. **The blessing
cadence is standing, not per-instance** (Eric, 2026-09-06: "my answer for 'whenever i want to bless
work to proceed' remains consistent; now, always now"). Once a plan is `ready`, a slice closes, or a
PR merges, the next slice starts without a fresh nod — re-asking "should I continue?" on work already
inside the envelope is the same scaling failure as a recurring blessing-ask (`CLAUDE.md` → *Hard boundaries*).
This answers *when*, not *what*: the hard boundaries in `CLAUDE.md` (irreversible/governance/spend, a genuine
taste fork, a load-bearing decision only he can settle) still always stop for him — "always now" means
never idle on ready, in-envelope work, not never ask at all. Label semantics
(2026-08-22): **`needs-eric` means exactly one thing — a decision only he can make.** Everything else
not yet shippable has its own marker: `needs-info` (the member) · `next-slice` (nobody) · `plan` (a
ready-flip) · `needs-design` (Eric, 2026-09-29: a more prescriptive marker than a bare "not ready" —
the next step is a Claude Design session, not a build or a decision; carries the `/design` brief to
fire when there's time, per `docs/HANDOFFS.md`). Priority is `P0`–`P3`, a label only Eric sets
(2026-09-29, #4064: one tap on his phone, readable by every lane); `npm run rank` derives a class for
everything else and his label always wins. **And a lane that shows no decision remains may remove it** (Eric, 2026-09-04, on
Moneypenny clearing it from #1318 after a bottleneck-research call sheet found the "decision" was
already-written policy: "that is fantastic; ideal") — evidence in a comment, the work routed on
(`feedback` / `next-slice`), the label gone. The queue must stay honest about what actually needs
him; a stale `needs-eric` is a blessing-ask that spends his attention on nothing. **And a fork
thin on data is not `needs-eric` yet** (Eric, 2026-09-07, deferring all four forks a cockpit-roadmap
plan had put to him: "I tend to defer these decisions. Completing other known work consistently
provides extra insights that result in strong enough data points to make an informed decision; the
fork erodes into a clear/linear path"). Two checks before the label, both written down: *erosion* —
defer only while work already in the plan could reveal or reshape the answer, naming the slice whose
landing reopens it (`next-slice`); if nothing upcoming bears on it, it is not eroding, it is
unanswered — and *the deciding question* — name the one question whose answer would settle it and
go get it ("craft the right questions to ask… Having the answers to all the right questions
provides the data points to make an informed decision") before it reaches him. The mechanical step
is `docs/grind/interrogate.instructions.md` → step 8. [`docs/plans/`](docs/plans/README.md) holds only legacy in-flight plans — never add files there.

## PR-watch status replies

**A PR-watch status reply is one line, plus an optional second for why** (Eric, 2026-09-04, after a
wake reply re-narrated a PR body the notification had already carried, then confirmed the one-liner
alone was right but welcomed a trailing why): `#<N> — <verdict/ask>. <what it unlocks, if not
obvious>.` — e.g. `#1267 — waiting on you to R+M. Closes the deploy-churn side of "no adverse
effects on deploy."` Never restate what the PR body, the CI run, or the notification's own payload
already said; a wake with nothing new to report earns silence (re-arm the check-in), not a recap.

## A finished session archives itself

**A finished session archives itself — it asks first only when a human opened it** (Eric,
2026-09-28: "The point is to reduce the pileup of open sessions" — and sessions marked finished still
"look like they have follow-up actions"; 2026-10-01, after 46 spawned sessions in one day left 35
finished but open: archiving "should be the default path as a clean up activity"). Done is checked,
not assumed: every PR it opened is merged or closed; every follow-up it produced (an open question, a
parked item, a watch date) has a home — an issue, `docs/IDEAS.md`, or its plan issue — never only the
chat; its plan issue's state block is current; no PR watch or scheduled check-in is pending. Then
`get_session` (no id) decides the shape:
- **Spawned** (`origin: claude_code_mcp_seed` — another session's `create_session`) → no ask. Write
  the final report, then `archive_session` on its own id as the last tool call **of that same turn**.
  An ask costs a whole extra turn (a full context re-read) for a decision already made, and archiving
  is reversible (Unarchive).
- **Opened by hand** (any other origin — app, phone, CLI) → ask **"archive this session?"** as a
  yes/no `AskUserQuestion` form (Eric, 2026-09-29: "makes this process easier to navigate"); on yes,
  archive as the final action. **The ask carries its proof** (Eric, 2026-10-18: "give me confidence
  that when there is a question to ask about archiving, it's a simple yes"): run
  `scripts/archive-audit.mjs` on a manifest of the session's PRs, children, check-ins and follow-up
  homes, and put its table in the question; ask only on `ARCHIVE: yes`. A red row carrying a
  `HEAL:` is the session's to fix and re-run, never his to answer (Eric, same day: "Self healing and
  improving needs to be part of the process"); say which heals ran, and send one that recurs to
  `/retro` for a prevention.
- **Done-check fails** (blocked, PR open, watch pending) → never archive: the open session is the
  signal that it still needs someone.
- **Spawned sessions carry `issue:<n>`** (Eric, 2026-10-01: "if grouped, we could archive the
  group"): `create_session` tags each child with the issue it serves, so one issue's sessions are
  one group. When that issue closes, the spawner archives every open session in the group whose PRs
  are merged or closed — one sweep catches the children that stopped short of archiving themselves.

`archive_session` releases the container the call runs in, so its spinner can sit for a minute with
no result — that wait is teardown, not thinking. Nothing goes after it.

## Pictures first

**Pictures first — the fridge rule** (Eric, 2026-08-20: "dumb this shit down and draw more
pictures... I want some god damn pictures to hang on the fridge"). Every PR and report-out opens
with something he can judge **by eye in ~10 seconds** — screenshots for UI work, a mermaid map for
everything else — then at most 3 short bullets; ALL remaining text below the fold. A wall of text
above the fold is a defect, not a style choice. **A plan (plan mode, a `plan` issue) opens the
same way**: a linted mermaid picture of the sequence first, the prose short beneath it (Eric,
2026-09-26: "Isn't claude Plans an excellent place to render mermaid charts… tell a higher
altitude story"). **A plan's top half is his** (Eric, 2026-09-26: "the latest plans seem to have a
TON of implementation details that drowns out a lot of the updates"): the picture, what changed
since the last version, the slices in plain words; paths, function names, px values and commands go
in a builder appendix at the bottom of a plan file, or below the fold / below the state block's Log
in a plan issue ([`docs/ISSUES.md`](docs/ISSUES.md) → *The state block*). The PR template carries
the format; grammar guide [`docs/PICTURES.md`](docs/PICTURES.md); screenshots commit small (≤~100KB) under `docs/shots/pr-<n>/`.

## Research leads with the call

**Research leads with the call** (Eric, 2026-08-23). This app exists to make money on the market; a
research doc that describes a situation without saying **what to do about it** has done half the job.
Every research deliverable opens with a **call sheet** — one row per horizon (single event) or name
(multi-name study): **the call · confidence · the one-line why · the dated observation that proves it
wrong**. Three rules keep it honest: **confidence is stated and drives size** (a low-confidence call
is a stand-aside, never a small bet); **every call carries its dated falsifier** (the tape
adjudicates, not the narrative); **"don't" is a first-class call** (an honest sheet is often mostly
refusals — in a compounding book, refusals are P&L). `npm run research:lint` fails a doc missing
either grade or falsifier; `/research` folds method and ledger behind the decision header. Contract:
[`docs/process/EVENT-RESEARCH.md`](docs/process/EVENT-RESEARCH.md); provenance
`docs/research/nvda-aug-2026-print.md`. Paper-only, educational — the deploy decision on real capital
stays Eric's.

## When Eric's action is needed

**When Eric's action IS needed — procedural, pre-verified, near-zero** (Eric, 2026-08-15):
hand him a TLDR-format **numbered procedure**, never prose; perform due diligence against the
instructions first (commands run, links checked, states confirmed — his steps must work on the
first try); and before handing anything over, ask whether the step can be **automated away
entirely** — the default is action-required-from-Eric ≈ zero, and a step survives to his list
only when it is genuinely his (the irreversible class) or carries a key value-unlock/trade-off
worth his judgment, stated as such. **Step anatomy:** `N. <the do> — <the why, trailing, read only
if wanted>` — imperative-first so the list is executable by scanning the left edge alone. Close
with a one-or-two-line **gist** (what the steps accomplish together / the state after).
**Better than a procedure: one line to paste** (Eric, 2026-09-30, after #4053's secrets went from
a five-step list to `scripts/setup-dependabot-secrets.sh`: "copy/paste this script, copy/paste
the output, profit… a far superior experience"). When his step is a *task* rather than a decision,
script it: one command that is independent of his checkout state (`bash <(git show origin/main:…)`
— his terminal may sit on a stale branch), does the work, verifies itself, and ends on a success
line he can paste back. Prove it end to end against a stub before handing it over. A task is not a
decision — never label it "needs your call". **And a decision gets the same short-circuit:**
screenshots or rendered options he can judge by eye, never prose to parse.

> **Superseded in part (Eric, 2026-10-24):** the paste-a-command path above no longer applies. "Running terminal commands is out of the question; I expect you to automate this piece through a web interface." A task for him is an in-app form or a committed config change, and even a credential goes through an owner-only form. The spirit stands: one action, self-verifying, works first time. #5955 asked him for a paste two days after that correction, because this paragraph still said to (#6470).
