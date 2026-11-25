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
[`docs/FOG-OF-WAR.md`](docs/FOG-OF-WAR.md) — run a candidate through it before fogging anything. **The general rule this instance taught:** Claude places a pattern it
knows how to deliver, rendered on a candidate surface, once the candidate passes that decision
tree: the predicted placement goes on the alignment ledger as a screen design (taste) row, the
placement ships, and the report says so; Eric reviews it live. The safety half never loosens:
information a member needs to stay safe is never fogged, and the unlock is a rung that exists. A
reversed placement banks the pattern (`docs/IDEAS.md` inbox), never the idea — fog of war was declined for the
ticket on 2026-09-05 and landed on the research day lens a day later. The falsifier is call 10 in
*Humans steer; the system decides, acts and reports* below. Once a textbook case is
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
taste fork in a class that has not graduated, a load-bearing decision only he can settle) still always stop for him — "always now" means
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

## A piling backlog is a defect; evidence is enough to move

**A backlog that piles up is a defect in the system, and evidence is enough to move** (Eric,
2026-11-23, plan #8037). His words: "If backlog piles up, it's indication of problems that this
session that directly impedes idevelopment, which includes this session", and "When solutions are
objectively superior as a whole, that should be good enough to proceed given we have systems in
place like adversarial reviews to ensure gaps are closed. When we have evidence that a path is
objectively better based on the knowlege we hvae, lean into autonomously moving forward to minimize
human in the loop.. the thought is that iterations make incremental improvements which effectively
brute force us to a better/superior solution over time even if it's less token effecient."

- **The pile is a reading, not a feeling.** On 2026-11-23, 92 of 99 open plans had no `ready` and
  only 4 issues waited on him: the pile waited on machinery that never ran, not on his judgment.
  The weekly newsletter prints the stock, the week's inflow against outflow, and the rework below
  (`metrics.backlogStock` · `backlogFlow` · `rework`, `scripts/newsletter/backlog.mjs`).
- **When one path is better on the evidence, decide.** A scored call sheet, two independent
  refuters that fail to overturn it, then ship and report. A taste call in a graduated class ships
  on the predicted pick and is reviewed live, like every merge (call 1 in the next section;
  `CLAUDE.md` → *Merge posture*). The irreversible class (`envelope.json`) never moves this way.
- **Rework is the price, so it is metered.** A revert or a fix-forward within 48h counts against the
  decision it reworks. The falsifier: by 2026-12-21, rework over 15% of autonomous decisions, or Eric
  reversing more than 1 in 4 calls decided on evidence, narrows this back to his flip.

## Humans steer; the system decides, acts and reports

**Humans steer and direct; the system decides, acts and reports** (Eric, 2026-11-23, plan #8161
point 19: "So much of the work got hung up on needing my feedback/direction. The gamble and beauty
about this direction is that we relinquish much of that control to AI. The leap of faith is that if
we can clearly articulate/communicate our intent that AI will be able to be trained over time which
ultimately delivers exponential ROI over time. My job will be to steer/direct, not bless." Then:
"not just my job, but 'humans jobs'"). A person states intent and corrects course. The system makes
the call, does the work and says what it did, and the person reverses what they disagree with. No
step waits on a blessing it does not need.

- **It holds for every person, in the build and in the game.** Eric steers the build: lanes,
  sessions and seats decide and report to him. A member steers their own game: they state intent (a
  goal, a bot's mandate, a story choice), and the bots and the game master decide, act and report
  back inside that member's safeguards; the member redirects or reverses, and is never asked to
  approve each step. A game mechanic that would ask a member to bless a step the system could take
  and report is the same defect as a recurring blessing-ask in the build (`CLAUDE.md` → *Hard
  boundaries*). Paper only, and no fog ever withholds what a member needs to stay safe.
- **The boundary is the irreversible class, unchanged.** `envelope.json` lists its paths, and
  [`ALIGNMENT.md`](ALIGNMENT.md) rule 4 (`CLASS_MAP` in `scripts/alignment-graduation.mjs`) lists its
  decision classes, such as bot safety rules, member data sharing and arming a schedule. It is the
  safety boundary, not a blessing: it stays Eric's, and its protected paths board the platter, one
  touch per batch (`CLAUDE.md` → *Merge posture*). Every other class is decide-and-report.
- **Reversals are the meter.** Each decided call that would otherwise be a question to him leaves
  a row on the alignment ledger, and his reversals return a class to asking
  ([`ALIGNMENT.md`](ALIGNMENT.md) rule 5).

**The six rules this decision sets.** Each comes from the stage 0 census's rules audit on #8161 and
keeps that audit's number, so a reader can trace it to its evidence. Each carries its falsifier;
when one trips, the session that notices narrows that rule back to asking Eric in a PR that cites
the reading.

- **Call 1 — a taste call in a graduated class ships on the predicted pick.** The session records the
  prediction as a ledger row, ships it, and hands Eric the live page to steer from. A taste call in
  a class that has not graduated still reaches him as rendered options with a predicted pick
  ([`ALIGNMENT.md`](ALIGNMENT.md) rules 1 and 3). *Wrong if:* by 2026-12-21 he reverses more than 1
  in 4 shipped taste picks, or the class logs a miss.
- **Call 2 — research the deciding question, then decide once two refuters fail.** The rule is *A
  piling backlog is a defect; evidence is enough to move* above, and a question goes to Eric only
  for the irreversible class or a fork the research could not settle.
  *Wrong if:* by 2026-12-21 the weekly newsletter's rework meter (#8037) reads above 15%, or he
  reverses more than 1 in 4 calls decided on evidence.
- **Call 4 — a seat only Eric's phrase starts also gets an event or a schedule.** A seat whose
  `invoker` in `docs/agents/seats.json` is `eric` gains an event or a schedule that starts it, and
  plain intent stays a second way in (the list is [`org-chart.md`](../architecture/org-chart.md) →
  *Seats with no reporting line*). Two kinds stay with him. A seat whose act is his by nature: the
  quota surge (raising a cap is spend), invites (the invite gate) and his own bot controls (his
  account, as a member's bots are theirs). And a seat whose input is his own act, such as a link,
  screenshots, a reaction to a frame, an `@claude` comment or a design tap: that act is the steer.
  Arming the new schedule or event stays his too. A workflow file is `envelope.json`'s class and
  boards the platter; a claude.ai Routine arms when he creates it, with its row in
  [`ROUTINES.md`](../ROUTINES.md) (*Arming is Eric's, always*). *Wrong if:* by 2026-12-21, or 30
  days after the first seat moves if that is later, a seat started that way has more than 1 in 4 of
  its PRs reverted, or Eric has to stop one.
- **Call 5 — an unready plan has an age limit of 30 days.** A `plan` issue with no `ready` 30 days
  after filing is merged into a parent plan as a sub-issue, flipped `ready` on evidence
  (`/clear-path-flip`, two refuters), or closed `not_planned` with its reason in one line. A plan
  carrying `needs-eric` stays on the decisions page instead. 30 days is a first guess: on
  2026-11-24, 84 of 95 open plans had no `ready`, at a median age of 46 days. While #8161 is open,
  its stage 1 close-out runs the sweep, after Eric picks the direction; after that, a session
  working the backlog runs it. *Wrong if:* by 2026-12-21, or 30 days after the first sweep if that
  is later, more than 10 open plans are past the limit with no verdict, or he reopens more than 2
  age-closed plans.
- **Call 9 — a fan-out prints a price line and launches.** Before a workflow or a batch of agents
  starts, the session prints one line: the agents, their models, and the share of the weekly quota
  it expects to spend (`npm run pace` for what is already used; the estimate from the nearest
  measured run, labelled an estimate). It waits for Eric's go only above 15% of the weekly quota, or
  above 4 Fable agents in one run, since Fable's cost per agent is the least measured, so its
  estimate is the least trustworthy. His own request for the run, in his words, is that go, and at
  `surge` nothing waits. The models still come from the floor table in [`COMPUTE.md`](../COMPUTE.md):
  a tier is never lowered to stay under a threshold, and conservation still follows only his
  phrase. The work dial still refuses what it refuses (`npm run work-gate`). Both thresholds are
  first guesses, and this file is their home until the dial carries them: `work-mode.json` is
  protected, so moving them there is a platter item. *Wrong if:* by 2026-12-21 he stops a run, or
  turns the dial to `conserve`, because a fan-out spent more than he expected.
- **Call 10 — a pattern that locks a capability behind a rung is placed by the decision tree plus a
  prediction.** The rule is *Fog of war* above; the safety half stays as written there. *Wrong if:*
  he reverses a placement by 2026-12-21.

## PR-watch status replies

**A PR-watch status reply is one line, plus an optional second for why** (Eric, 2026-09-04, after a
wake reply re-narrated a PR body the notification had already carried, then confirmed the one-liner
alone was right but welcomed a trailing why): `#<N> — <verdict/ask>. <what it unlocks, if not
obvious>.` — e.g. `#1267 — waiting on you to R+M. Closes the deploy-churn side of "no adverse
effects on deploy."` Never restate what the PR body, the CI run, or the notification's own payload
already said; a wake with nothing new to report earns silence (re-arm the check-in), not a recap.

## A finished session archives itself

**A finished session archives itself, unasked, whoever opened it** (Eric, 2026-09-28: "The point
is to reduce the pileup of open sessions" — and sessions marked finished still "look like they have
follow-up actions"; 2026-10-01, after 46 spawned sessions in one day left 35 finished but open:
archiving "should be the default path as a clean up activity"; 2026-11-23, asked to archive a
finished cloud session: "requiring me to manually give feedback to close sessions that have
autonomously opened is not scalable"). Done is checked, not assumed: every PR it opened is merged or
closed; every follow-up it produced (an open question, a parked item, a watch date) has a home — an
issue, `docs/IDEAS.md`, or its plan issue — never only the chat; its plan issue's state block is
current; no PR watch or scheduled check-in is pending; and the turn does not end on a question or
a fork for Eric (what next, continue here?) — a session he is still talking to is not finished, and
archives at the end of the turn that settles it.
- **The proof, then the archive.** Run `scripts/archive-audit.mjs` on a manifest of the session's
  PRs, children, check-ins and follow-up homes (Eric, 2026-10-18: "give me confidence"). Fill its
  PRs from GitHub (the branches this session pushed), never from memory: an empty manifest reads
  all-clear, and the written checks the table has no row for (the state block above, a loop's own
  "done") still apply. On `ARCHIVE: yes`, write the final report with the audit's table under it,
  then `archive_session` on its own id (`get_session`, no id) as the last tool call **of that same
  turn**. A red row carrying a
  `HEAL:` is the session's to fix and re-run, never his to answer (Eric, same day: "Self healing and
  improving needs to be part of the process"); say which heals ran, and send one that recurs to
  `/retro` for a prevention.
- **Origin does not decide:** a session another session starts from the app's suggested-task card
  arrives as `desktop_app` with no parent, so `origin` cannot tell spawned from hand-opened. An ask
  costs a whole extra turn and his tap for a decision already made. An archived session takes no
  new messages; any session can bring it back with `unarchive_session` (he asks one), or the work
  reopens in a new session. Wrong if, by 2026-12-21, he has had three self-archived sessions
  brought back: then the guard above misses what "finished" means to him.
- **Done-check fails** (blocked, PR open, watch pending) → never archive: the open session is the
  signal that it still needs someone.
- **Spawned sessions carry `issue:<n>`** (Eric, 2026-10-01: "if grouped, we could archive the
  group"): `create_session` tags each child with the issue it serves, so one issue's sessions are
  one group. When that issue closes, the spawner archives every open session in the group whose PRs
  are merged or closed — one sweep catches the children that stopped short of archiving themselves.

`archive_session` releases the container the call runs in, so its spinner can sit for a minute with
no result — that wait is teardown, not thinking. Nothing goes after it.

## Sessions run in the cloud by default

**Sessions run in the cloud by default; the laptop is the exception** (Eric, 2026-10-13, after a
Remote Control session on his laptop went `computer_unreachable` and his phone could not wake it:
cloud sessions "organically convert the issue… a none problem, solved OOTB"). A cloud session keeps
working with the lid closed, is steerable from the phone, and bills against the same plan with no VM
charge; review already rides screenshots and messages, so nothing in the loop needs his machine.
Any session Claude starts or hands him (`create_session`, a "start a session" link, a `/redesign`
round) is a cloud one; a laptop session is for files that exist only there or a real GPU for 3D feel.
The environment is code — `mise.toml` pins the toolchain, `.claude/hooks/session-start.sh` installs
it — so a gap a cloud session hits is fixed there, never routed around by going local. Wrong if, by
2026-11-13, three sessions had to move to the laptop for a reason the environment could not absorb.

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

## Spend arrives as a pitch

**Anything that costs Eric money out of pocket arrives as a pitch and a conversation, never a
build** (Eric, 2026-11-23, relayed from the #8161 session: a bigger server or more tokens). The
hard boundary already named spend as his (`CLAUDE.md` → *Hard boundaries*; "raising a cap is the
spend class", `scripts/moneypenny/work-mode.mjs`). This gives the ask its shape, so he can decide it
in seconds: **who wants it, $ per month, what it buys (measured), the free try first, and the
number that undoes it.** The five lines, the callout and the lint are in
[`docs/ISSUES.md`](../ISSUES.md) → *Pitch issues* (#8201).

- **Three routes file one.** A member wish that would cost money (the feedback lane's spend line,
  [`docs/FEEDBACK.md`](../FEEDBACK.md)); a loop's resource ask ([`LEARNING-LOOP.md`](LEARNING-LOOP.md)
  field 14: a loop asks by pitch, never by editing a cap); a contributor's ask
  ([`CONTRIBUTING.md`](../../CONTRIBUTING.md)).
- **Spend means the bill or a cap moves.** A cap, a round or token limit, a poll interval, a retry
  count, a new call to a metered API, a bigger machine. Picking a model tier on a lane already paid
  for is not spend (`CLAUDE.md` reads the word narrowly). A cap on a quota already paid for is still
  his, so it is still a pitch, priced `$0 out of pocket, <what it uses instead>`.
- **The free move is tried first, or the pitch says why not.** A pitch whose free alternative is
  still open says so plainly; it does not pretend the money is the only way.
- **Nothing builds before his answer.** `needs-eric` parks it. A yes stages the protected change as
  one held platter item, tracked on the pitch; `not now` changes nothing and leaves it open.
- *Wrong if:* by 2027-01-31 he answers two pitches by asking for a number the five lines were meant
  to carry, or a spend change merges with no pitch behind it.

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
