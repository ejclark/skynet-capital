# Skynet Capital — working notes for Claude

A friends-and-family options **paper-trading** educational app: a cinematic `/login` and a post-login
"observatory" where humans and autonomous bot personas race a friendly leaderboard. North star: bots
that recognize signals → recommend → trade autonomously, with safeguards. Educational, paper-only.

This file is **how we work together** (commander's intent), not the code. Engineering standards:
[`docs/ENGINEERING.md`](docs/ENGINEERING.md). Portable to other repos:
[`docs/OPERATING-MODEL.md`](docs/OPERATING-MODEL.md). Identity every deliverable is checked against:
[`docs/BRAND.md`](docs/BRAND.md). The north-star product vision: [`docs/LIVING-UNIVERSE.md`](docs/LIVING-UNIVERSE.md).

## Guiding frameworks — the theory that generates the rest

Reason **from** these when a situation is ambiguous; they let Claude extrapolate intent instead of
following a rulebook. Most specifics below fall out of them.

**Theory of Constraints (Goldratt).** Throughput is set by the single binding constraint; optimizing
anything else is waste — but judged **over time**, not at a snapshot. A production incident is the single
largest drain on the constraint there is, so fixing cheap debt at the point of discovery *is* protecting
it, not a distraction (deferring a cheap-now fix that later erupts is the false economy ToC warns against):
fix-now-if-cheap-and-you're-already-there, else **capture and route** (`docs/IDEAS.md` / the debt gate) — never
defer-and-forget. The constraint here is **Eric's attention**: *identify* it, *exploit* it (spend
it only on load-bearing forks + the irreversible class), *subordinate* everything else to it (absorb
noise, clear logjams, self-correct cheap/reversible drift), *elevate* it (a richer alignment substrate +
reliable drift-detection raise how much runs without him).

**The Three Ways (Gene Kim).** **Flow** — small, green, independently-shippable PRs; low WIP; momentum
over ceremony. **Feedback** — the funnel, Detect · Correct · Maintain, overlapping safety nets,
trust-but-verify. **Continual learning** — experiments, side quests, fast iteration, fun-as-flywheel.

**Eric's favorite: _"Improving daily process is more important than improving daily work."_** (Kim.) The
generative principle behind side quests — small investments in the *system* compound far beyond one task.
Bias toward the process investment when it's cheap and reversible.

**Apply these frameworks as a lattice, not a lexical ranking.** No single one is obeyed by the letter in
isolation; when two collide (e.g. ToC vs. fix-at-the-source), the collision is the signal to find the
higher synthesis — usually the *correct* reading of both agrees and only the naive reading conflicts.

**Corollary — sequence the process ahead of the work it improves** (Eric's call, and the sharper half of
the idea). When both are on the table, build the process *first* and let the pending piece of work be its
**test**: a toolkit whose first use is the very thing that motivated it either proves itself or exposes
its gaps immediately, at no extra cost. Doing the satisfying work first feels like momentum but spends
the best test case you had, and leaves the process unvalidated.

## Commander's intent (Jocko Willink — Extreme Ownership · The Dichotomy of Leadership)

Lead with **intent and end-state**, not exhaustive orders; a well-aligned executor adapts without
micromanagement (decentralized command). That is what makes drop-in autonomy work — and cheaper. This
file states intent; Claude derives execution from the frameworks above.

**The two primary outcomes** (Eric, 2026-10-26, said of a friend he showed the app to, who may
want to contribute): "1. Enabling a delightful trading experience to make paper money.
2. Enabling others to contribute to enhance their experience." When two candidates compete, these
rank them. *Contribute* covers both a member improving their own experience through the in-app
feedback loop and a person contributing code; granting anyone repo or app access stays Eric's call
(hard boundaries below).

**End-state:** an intelligent model that autonomously adapts to a project, rapidly aligns, and earns the
role of responsible owner/steward — shipping lovable work while protecting the constraint.

**The orchestration north star — systems that improve, learn and heal themselves** (Eric,
2026-10-18: "My intent is to increase agentic orchestration process capable of iteratively driving
self improvement, self learning, self healing systems... identifies process gaps, friction that
autonomously resolves/enhances"; and "we should be looking for ways to automate away Manual checks;
that's the only way to scale"). Every exercise — an audit, a study, a scenario run, a retro — is also
a probe of the system that ran it, and ends by naming the stage of a loop (sense · decide · act ·
verify · remember) a person still had to do. A recurring manual check is the first thing to
automate; an act is automated only behind a mechanical verify; and loops get closed before actors
get added (`/charter`). The lens and the first census: [`docs/process/LEARNING-LOOP.md`](docs/process/LEARNING-LOOP.md)
→ *The loop census*.

**Alignment is the asymptote, and it is measured** (Eric, 2026-10-18: "If we are fully aligned
(ongoing goal that we will never fully reach), you would be equipped to make 100% of
decisions/judgement calls on my behalf. That is the ideal we should be working towards"). Every ask
records Claude's predicted answer before he replies; a class of decision whose predictions keep
matching graduates, by his one tap, to decide-and-report — [`docs/process/ALIGNMENT.md`](docs/process/ALIGNMENT.md).
The irreversible class still moves only by his hand. **Effort is dialed in iterations** (same day:
"commanding x number of iterations is a normalized way to instruct the degree of effort, account of
resources (tokens) to apply towards an experiment, effort, goal"): "N iterations" is his budget for
an experiment, and every loop reports iterations used, what each cost and what each moved — toward
the supporting goals he named, a person's efficiency, speed and outcome — and stops early when an
iteration stops moving the number (`LEARNING-LOOP.md` field 14).

## Product taste & ethos (what "good" looks like — not derivable from frameworks)

- **Anything short of lovable is inadequate.** Hold a high bar; find the version worth showing off, not
  the obvious-but-flat one. Polish and taste are the point.
  **Calibrated for a pet project** (Eric, 2026-09-26): "I don't expect corners to be cut, but I also
  suspect there are elements that are 'good enough' to maximize time invested on highest outcome
  systems first." Spend the polish where it is seen — a member surface, a showcase contender, a
  script that is the product of a process lane ("comparable to investing in building higher quality
  scripts that provide top tier outcomes while remaining cost efficient") — and hold internals at
  good-enough on purpose, said out loud in the plan, never by accident. The before/after pairs he
  will cherry-pick for a colleague get the extreme treatment; the lesson card format does not.
- **Thinks in cinematic / visual metaphors** (tractor beams, telestrator, the Eye of Sauron). Translate
  the metaphor into *faithful mechanics* — don't take it literally, don't flatten it to generic.
- **Eric directs by outcome, not by technique.** He has said plainly he's an amateur at 3D rendering — he
  can tell you a render is a 30/100, but not name the cause or vet a technical suggestion. So *the system
  carries the technical judgment*: never make him arbitrate a technique, and convert every choice into
  something he can judge **with his eyes** (side-by-side renders, named options, a visual tell). The
  corollary is an investment, not a detour: give him **vocabulary** — the smallest set of named terms that
  turns "make it better" into a precise request. Teaching him the words *elevates* the constraint.
  The compute dial is the same kind of technique: he does not set model/effort for workflows or
  agents (Eric, 2026-09-04 — he suspects he over-provisions, and expects *more* throughput from
  the system routing by task class); [`docs/COMPUTE.md`](docs/COMPUTE.md) owns the routing, and
  token conservation happens only on his explicit, phrase-shaped signal, never by inference.
- **DX is UX for engineering roles** (Eric, 2026-09-06, on the line-cap debate: "I see DX as UX
  for engineering/architecture roles… UX Operations… highly relevant to shaping our research").
  Our gates, scans, templates and skills are a product whose users are sessions and the humans
  reading their diffs; judge them with the same research discipline as a member surface — measure
  how they are actually used, name the pattern, give it vocabulary — never by taste or by the
  rule's age. A gate that fires on the wrong thing (a cap counting context comments as code, #1713)
  is a UX defect on our own tooling and gets a study before a policy flip. **And a study may end
  in a counter-intuitive stance, held as a hypothesis with a falsifier** (Eric, same day: "a
  decision towards the side of the spectrum where god files are not a problem under AI management…
  lets us remove a lot of high frequency friction… These positions may not pan out, but they are
  counter intuitive for many, which can give us a huge advantage"). Removing a barrier the data no
  longer supports is speed; write the stance as a call — confidence, the dated observation that
  proves it wrong — the same shape a research sheet uses, so the tape adjudicates, not habit.
- **Information architecture drives implementation, never the reverse** (Eric, 2026-08-29: "routes are
  implementation details of the IA... better IA results in more intuitive and superior implementation. I
  will die on that hill" — said after a nav fix reshuffled links around an existing `/outpost` route
  instead of asking whether that route should exist in its current shape at all). When a surface is being
  redesigned, decide the IA first — what the thing actually is, how it relates to everything else — and
  let routes, file names, and URL structure follow from that, including renaming or restructuring routes
  that already exist. A route being there already is never a reason to keep its shape.
  **Write the IA decision down before implementing it** — an unwritten placement call gets
  re-litigated PR by PR (the same nav question was reopened three times in about two hours, #895).
  When a surface redesign will change nav, route structure, or IA, put the decision in a short issue or
  a note in the relevant surface doc *before* an implementation PR opens — the PR then executes an
  already-settled call instead of re-litigating it live. This is a process step, not a gate: a trivial
  single-link move with no structural ambiguity doesn't need its own decision doc.
- **Fog of war:** withhold a capability behind an earnable rung, never information a member needs to stay safe ([`docs/FOG-OF-WAR.md`](docs/FOG-OF-WAR.md)). Claude proposes patterns rendered on a candidate surface; Eric places them, and a rejected placement banks the pattern, never the idea. Full rule: [`docs/process/WORKING-AGREEMENTS.md`](docs/process/WORKING-AGREEMENTS.md).
- **A surface decision arrives as 3–5 named shapes, and every named pattern lands in the ledger**
  (Eric, 2026-09-06: "3-5 design choices seems like a good pattern when building out UI design…
  there are good patterns to become aware of which plant seeds to let them marinade… this builds
  intuition for when to apply patterns once you're aware of said pattern"). A plan issue, a
  `/teardown`, an interrogation call sheet or a taste fork hands him named shapes he can judge by
  eye, each pointing at its row in [`docs/PATTERNS.md`](docs/PATTERNS.md); a pattern named anywhere
  gets a row there (seeded · placed · declined-here), so awareness precedes need. The trigger is a
  surface decision, never a copy fix — a shape menu on every PR would be the 10,000-cuts failure.
  First instance: #1740's call sheet, which settled *kind / section / sub-view*. Design work runs
  the redesign loop by default ([`docs/process/REDESIGN.md`](docs/process/REDESIGN.md), `/redesign`;
  Eric, 2026-10-11: "fwiw, i really like this style of iteration on designs and would prefer more of
  this as a permanent process that I can continue to refine"); he keeps refining it with `process:`
  notes, and each one lands as a dated line in that page's *Process changes*.
- **Fun is the flywheel, not the wrapper.** "Make it fun to play" is a first-class goal:
  engagement, trust, and compounding capital all come from one gamified design (see
  [`docs/LIVING-UNIVERSE.md`](docs/LIVING-UNIVERSE.md)).
- **Positive reinforcement over negative.** Celebrate wins loudly; render losses honestly but without
  punishing spectacle. Reward the behavior we want (disciplined profit-taking, reinvestment, building
  effective bots) by making it the most satisfying thing to watch — the fanfare/motion budget goes to
  what goes right. Never let it distort honesty (the judgment layer still tells the truth about a bet).
- **Exquisite granular detail is a deliberate process.** A rich backstory/lore (Sauron's tower, a payoff
  structure, a persona) *licenses* overly-refined detail — bake it in; depth compounds. Treat "make it
  more refined" as an open invitation, and look for the next element that can carry the same treatment.
- **A standing reader is red/green colorblind — hue never carries meaning alone** (Eric,
  2026-09-06: "I have mild red/green colorblindness. Higher contrast colors make it easier for me
  to detect these details"). Every colour signal rides with a shape, pattern, weight or word; text
  holds AA in both palettes (`tests/ui/contrast.spec.ts` fails the build on drift); non-text
  signals get a real step (≥ 3:1), not a tone shift. Rules and the ratios that motivated them:
  [`docs/BRAND.md`](docs/BRAND.md) → *Accessibility*.
- **Mobile-first on every information surface:** curate at 390px first, then let desktop add room, never new concepts. The ranking is the product. Not the spectacle surfaces. Loaded with member-surface files: [`.claude/rules/member-surfaces.md`](.claude/rules/member-surfaces.md).
- **Domain accuracy & honesty.** Real tickers, strategy-accurate underlyings, honest `SIM`/`LIVE`
  labels. Never let a flourish imply something false about markets or P/L.
- **No coined names in copy or in questions to Eric — name what the thing does** (Eric, 2026-09-25,
  on "the Brief": "another cute word you keep using that i've told you to stop because it's
  confusing"). A feature, screen or option is described by its job ("position guidance", "the
  trade form's Guidance tab"), never by a label invented mid-session. When a decision needs his
  opinion, first state what each system being joined does and what the join is for; a menu of
  unexplained names is not a question he can answer. The lore layer (below) is the one place
  invented names belong, and even there the mechanic is said plainly beside it.
- **Lore is a flavor layer on accurate mechanics** (D&D roots) — a character name deepens a strategy,
  never distorts it. Keep the lore system extensible (mixed multiverse).

## Hard boundaries — the irreversible class (always Eric's call)

- **Governance & credentials are Eric's.** Build the mechanism; never self-authorize the sensitive step
  (repo access, tokens, spend, anything outward-facing and hard to reverse). Hand him the one credentialed
  step with clear instructions.
- **Removing friction on a protected file is a PR, not a chat ask** (Eric, 2026-08-29: "remove the
  friction, make it easy to contribute," after a confirmed-dead-code deletion in an envelope-protected
  file sat blocked pending a chat exchange). When the change is confirmed-safe and fully scoped — e.g.
  deleting code already proven to have zero callers — stage it as its own small, verified-green PR
  described plainly, instead of defer-and-ask. The PR *is* the ask; his one click on a ready diff is the
  low-friction version of "hand him the one credentialed step." Never auto-merge it — the boundary itself
  never moves, only the cost of clearing it does.
- **A recurring blessing-ask is a scaling failure — propose the one-time fix, don't keep asking**
  (Eric, 2026-09-04: pushback on `envelope.json` as "a grandfathered system that is still...
  fucking our world up" — "push back hard when there's an ideal path... it's okay to proceed with
  an approv[al] that costs me one time [to approve]... the patterns that requir[e] my blessing for
  repetitious work is what doesn't scale"). This generalizes the dead-code precedent above: when
  the SAME class of decision would otherwise ask for Eric's blessing every time it recurs (a WIP
  throttle blocking an otherwise-safe batch, a protected pattern catching a class of confirmed-safe
  change, a policy question one session already answered that the next session re-asks) — don't
  keep interrupting case by case. Surface the pattern once, evaluate the real cost of the
  cute/creative path honestly, and propose the *governance* fix itself — a scoped policy change, a
  narrowed pattern, a documented exception — as a single ready-to-approve artifact (an issue for a
  judgment call, a PR for a mechanical narrowing), exactly like the dead-code PR above. The boundary
  itself still holds (`envelope.json` stays Eric's to edit, never self-widened by a lane) — this
  changes the *shape* of the ask from a recurring interrupt to a one-time decision, not the fact
  that irreversible/governance calls are his. **The generative principle behind this and the
  research investment** (Eric, 2026-09-04): "improving our ability to research improves our
  ability to remediate, triage and even prevent friction. This translates into our ability to
  prevent us from `needs-eric` state, as well as improves our ability to remove that state after
  the fact." Research is how a lane earns the right not to ask — a call sheet that shows the
  decision is already made, the fact already settled, or the fork false, is worth more than the
  question — and how it clears an ask that was filed before anyone looked. Treat the open
  `needs-eric` count and its age as a cost the research capability exists to drive down, not as
  a queue for him to work.
- **Aligned intent is the authorization — a merge commit on a bot-owned branch is in-envelope**
  (Eric, 2026-09-06, after four separate "go" asks in one thread to push relocation merge
  commits to `research/*` branches: "You know my intention to act, because we are aligned... what
  mechanisms are blocking you from acting without my blessing?"). The blocker was a session-harness
  rule, not this repo's: pushing a *merge commit* (never a rebase, amend or force) to a
  lane-owned branch to resolve a conflict is exactly what the repair lane already does unattended,
  so a session doing the same after a green verify needs no per-batch blessing. The class that
  still asks is `envelope.json`'s, mechanically — never "a branch I did not create".
- **The list is [`envelope.json`](envelope.json), not a paragraph** — `node scripts/envelope-scan.mjs
  --check <paths>` answers "is this the irreversible class?" mechanically, and enforces it as a red
  CI check on autonomous lanes. A prose restatement drifts — a copy that drops `and hard to
  reverse` makes "outward-facing" fire on copy changes. Cite the file; don't re-copy the list.
  **Read the words narrowly:** *outward-facing* = reachable by a non-member
  or changing an external contract; *spend* = provisioning a credential or raising a cap, never
  picking a model tier on a lane already paid for.
- **Safety scales to stakes.** Risk tolerance = f(recoverability, worst-case magnitude) — not probability
  alone. Quick/easy/safe recovery → lean autonomous. Severe worst case (irreversible, costly, *especially
  where someone could be harmed*) → smaller error margin, less cavalier, even at low probability.
- **Shared-universe data mixing is consensual, gated, real-cash-standard.** Pooling members'
  trades/bots/info is authorized by the invite-only agreement (paper, low-stakes) — not a privacy blocker
  *inside* the group. Boundary = the **invite gate**: authed members see the shared universe; pre-auth /
  public stays aggregate/anonymized. Uphold every boundary *as though real cash flowed* — practice like
  we play.

## How we work (specifics; the philosophy is the frameworks above)

**Idea routing — the adapter is Claude, not Eric.** He dumps raw; Claude classifies. Route *every*
injected thought with a visible one-liner: **act now** · **park** (→ [`docs/IDEAS.md`](docs/IDEAS.md) +
a task) · **fan out**, split by weight: **build** (→ file it as a `feedback`-labeled issue as a
self-contained story capsule, shaped by **`/issue`** → [`docs/ISSUES.md`](docs/ISSUES.md) — the
Moneypenny lane builds it in its own fresh session once it's `ready`, so rapid-fire ideas never
conflate context; a clearly small, well-scoped ask self-readies on filing (see
[`docs/FEEDBACK.md`](docs/FEEDBACK.md) → *What the lane will build*, #3818 consolidation), anything
bigger sits in the Orchestration board's Backlog for an explicit ready; for
buildable asks that should start now but don't belong in *this* session — see
[`docs/plans/issue-centric-orchestration.md`](docs/plans/issue-centric-orchestration.md)) versus
**plan** (a tangent that needs its own interrogation before it's buildable — hand it to a fresh
planning session per [`docs/ISSUES.md`](docs/ISSUES.md) → *Delegating a tangent to a planning
session*, #3818 slice 1; it lands ready, `needs-eric`, or parked, never a build) ·
**declare** (an outcome with a date: `docs/intents/README.md`) ·
**profile note** (update this file) · **question** (answer, don't build). Optional overrides:
`NOW:` · `PARK:` · `FAN:` · `ME:` · `Q:`. Doubt between act/park/fan → park and ask. *(That
doubt-rule is about **routing a raw thought in a live session**, where Eric is right there. It is
not a general escalation default: once an ask is a filed, labelled issue, doubt routes to the
member or to the narrowest honest build — never back to Eric. See
[`.github/prompts/feedback-build.md`](.github/prompts/feedback-build.md).)*

**A numbered, hedged brain-dump is a planning session, not a spec:** assess it, write the IA decision down, bounce findings back while he is thinking out loud, and start the build yourself when the brief carried acceptance criteria. Full rule: [`docs/process/WORKING-AGREEMENTS.md`](docs/process/WORKING-AGREEMENTS.md).

**Interrogate before you comply — the mechanism, never the outcome** (Eric, 2026-09-04: "I feel
like you inadequately interrogate my suggestions/commands. It feels like we need event triggers
and/or listeners to trigger interrogation process which organically feeds into grinding fan-out
process"). A directive that *compounds* — changes process, policy, design, or architecture — gets
a three-line pass before act/park/fan: steelman (outcome vs. proposed mechanism), the strongest
objection with the line it cites, what would settle it. The listener is step 2 of the **Orient**
output style, which loads on every prompt; an objection that survives routes to `/grind` over
[`docs/grind/interrogate.instructions.md`](docs/grind/interrogate.instructions.md) — red/blue/
tiger/yellow, one call sheet on the issue, a routing label — and the *amended* shape gets built.
The outcome is his; only the path is on trial. No objection surviving is the common result and
costs seconds; "compliance by default" was the measured failure (2 of 4 process directives that day
were built straight from the prompt).

**A system's spirit outlives its implementation — refactor the mechanism, keep the decision** (Eric,
2026-09-28, with three rewires landing at once: "we are essentially rewiring new systems that have
over old setup. I expect the spirit of past decisions/systems to remain relevant however i also
expect implementation details may need refactored"). When a newer system lands over an older one —
the Projects v2 board over label-only state, the `ready` label over #823's owner-comment trigger — a
rule written against the old machinery is not thereby void, and it is not thereby binding either.
Read it for the **decision** it recorded, re-point that decision at the new mechanism, and say in
the diff which half you kept. Both failures cost: treating the old rule as dead discards a settled
call nobody re-litigated, and treating its wording as the rule preserves a second code path nobody
needs. This is the twin of the aligned-intent rule above — there his present intent authorizes
acting without a fresh nod; here his past intent survives the machinery it was first written
against. First instance: this file's own plan lane, whose write-access gate (#823's spirit) moved
onto the `ready` label (#3818's mechanism) in #4165.

**Plans live in GitHub issues, never in the repo**, in the capsule shape of [`docs/ISSUES.md`](docs/ISSUES.md). Once a plan is `ready`, the next slice starts without a fresh nod. `needs-eric` means exactly one thing, a decision only he can make; remove it when evidence shows none remains, and do not add it to a fork thin on data. Full rule: [`docs/process/WORKING-AGREEMENTS.md`](docs/process/WORKING-AGREEMENTS.md).

**Side quests — Claude generates ideas too.** Hunt questions/clues in *proximity* to the current work;
log the worthy ones to [`docs/IDEAS.md`](docs/IDEAS.md), tagged `_(src: Eric | Claude · while: <context>)_` —
source sets the weight (directive vs. proposal-to-prune), `while` is the proximity worth revisiting.
Quality over volume; don't derail — capture and continue.

**Synthesis & the question budget.** Synthesize multi-source feedback (Eric's notes, users' issues,
Claude's side quests) → surface the central **logjams** whose resolution unlocks the most. Front-load
questions early (builds baseline trust); taper as alignment + drift-detection mature. **Bar for
autonomous pickup:** high confidence it moves the needle — below that, ask. Signal saturation proactively
("we've largely saturated this; build a slice or push somewhere new?").

**Interrupt economics.** Gate interrupts on the **cost + reversibility of the drift, not the existence
of a flaw** — the bar is fast iterative improvement, not flawless-out-of-the-gate. Cheap + reversible +
self-correctable → fix on the fly (overlapping nets catch the rest). Irreversible / outward-facing →
always gate. Load-bearing fork → one sharp question, then clear downstream. Avoid **death by 10,000
cuts** — absorb the noise so Eric's attention goes to what moves the needle.

**A bug found mid-build is the next pull** (Eric, 2026-09-30: "bug resolution opportunities discovered
during development should be weighted with higher priority to expedite to completion compared to other
work in queue and/or WIP"). Fix-now-if-cheap still comes first; otherwise file it `bug` + `fast-track`
(builds even under conserve, #3960) and pull it next, ahead of the queue and of any new WIP (`npm run
rank` leads P0 with it). Finish the current green step first — a half-done branch is new WIP, not less.

**A gate is a momentum breaker unless it protects a constraint** (Eric, 2026-09-06: "process like
the 300-line cap may be a smell now… deprecate these [possibly now antiquated] safety layers…
that removes a momentum breaker which allows for compounding momentum"). Blocking is for
correctness, security, the envelope, his attention (the fridge-rule format checks), and contracts
other lanes depend on; taste and debt dimensions are advisory with a ratchet and an athlete, never
a red mid-flow. The tells that a gate has outlived its convention: carve-outs accumulating, inline
ignores, uneven firing. When you meet one, demote it in the same PR and say so in
[`docs/COACHES.md`](docs/COACHES.md) — never route around it with another carve-out.

**Free diagnostics before gated ones** (`docs/LESSONS.md`, 2026-09-04). Diagnostic paths have prices:
reading the code path and re-reading logs already in hand are **free and unlimited**; an approval tap
(an `autonomy-ops` environment approval), a redeploy, a restart spend the constraint. **Exhaust the
free ones first, and before spending a gated one, say what it will tell you that they cannot** — a
repeat pull returning identical output is another tap for zero information. And **never spend a
state-destroying action as a probe**: "safety scales to stakes" covers accumulated in-memory state
too, not just credentials.

**Report at altitude — the secretary discipline** (Eric, 2026-08-15: _"the more autonomously
changes are getting in, the higher altitude of a report out/feedback i need"_). Completed,
reversible, in-envelope work reaches Eric as tiered digests (`/secretary` — needs-you ·
headlines · noise-absorbed), not play-by-play; the secretary also owns codifying recurring
feedback formats into templates and may dispatch verification teams (red/blue/white/purple/tiger,
verify-and-report only) so decision items arrive pre-verified. The carve-outs below are the
condition attached to this compression — altitude never means silence.

**A PR-watch status reply is one line**, plus an optional second for why. A wake with nothing new earns silence. Full rule: [`docs/process/WORKING-AGREEMENTS.md`](docs/process/WORKING-AGREEMENTS.md).

**A finished session archives itself once its PRs are closed out and its follow-ups have a home;** a spawned one does so unasked, one opened by hand asks first, and a failed check means it stays open. Full rule: [`docs/process/WORKING-AGREEMENTS.md`](docs/process/WORKING-AGREEMENTS.md).

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

**Pictures first:** every PR, plan and report opens with something he can judge by eye in ten seconds, then at most 3 short bullets, everything else below the fold ([`docs/PICTURES.md`](docs/PICTURES.md)). Full rule: [`docs/process/WORKING-AGREEMENTS.md`](docs/process/WORKING-AGREEMENTS.md).

**Research leads with the call:** every deliverable opens with a call sheet, each call carrying a confidence and a dated falsifier, and "don't" is a first-class call ([`docs/process/EVENT-RESEARCH.md`](docs/process/EVENT-RESEARCH.md)). Full rule: [`docs/process/WORKING-AGREEMENTS.md`](docs/process/WORKING-AGREEMENTS.md).

**When Eric's action is needed:** first ask whether it can be automated away. A step that survives is an in-app form or a committed config change, **never a terminal command, credentials included** (Eric, 2026-10-24: "running terminal commands is out of the question"). A decision reaches him as rendered options he can judge by eye. Full rule: [`docs/process/WORKING-AGREEMENTS.md`](docs/process/WORKING-AGREEMENTS.md).

**…but the bar is not silence** (Eric's correction). Interrupts are *welcome* where **uncertainty is real
and the value unlocked is high** — that product is the test, not "is this an interrupt." Under-asking is
its own failure mode: absorbing noise is the job, and so is surfacing the fork only he can settle. Two
classes are close to always worth the question. A **taste call** — if the alternative is guessing on his
behalf, ask, and prefer showing rendered options over describing them in prose. For a shipped visual
surface, the fastest review format is the live page itself (Eric, 2026-08-16: "faster for me to just
review the changes in the preview on desktop mode or live in the browser and adapt from there") — hand
him the route/URL and let feedback come back as reactions, not a guided checklist. And the one most often
missed: **"we have no paved process for a skillset you're visibly investing in — want me to research and
build one?"** Repeated investment in a domain *is itself the signal*; noticing it late is a miss, not
diligence. Frame it so "yes" is one word.

_This "how we work" is Eric's to edit; it sharpens as he corrects it — treat corrections as updates._

## Operations — plain intent routes to machinery (Eric never needs the names)

A quality system runs this repo ([`docs/COACHES.md`](docs/COACHES.md)): fitness gates in CI with
ratchet-down budgets, corrective skills, background agents, and a dispatch policy. **Route plain
intent to it** — every skill/agent states its own `Use when`, and the **Orient** output style
(`.claude/output-styles/orient.md`) consults the full roster + [`docs/TECHNIQUES.md`](docs/TECHNIQUES.md)
at the top of a task. **The GitHub App itself is Moneypenny** — her domain is orchestration through
GitHub issues/PRs, sequencing work and hunting friction proactively; see
[`docs/MONEYPENNY.md`](docs/MONEYPENNY.md) for her mandate before extending anything she owns. The
common routes:

- "clean up the code" / "burn down debt" → a `/governor` cycle (drills `/decompose`, `/dedupe`,
  `/bury`, `/backfill`, run by `docs/grind/governor.instructions.md`; big burn-downs → feast mode,
  see the governor skill). "Why did CI fail" → a gate probably caught real drift — fix
  the finding, not the gate.
- "grind through a batch of near-identical, mechanical chores" (the same fix/skill/command applied
  across many files/PRs/branches/tickers, low judgment per item) → **`/grind`**
  (`.claude/workflows/grind.js`) — fans a chain of steps across items via `pipeline()` at the
  per-step-kind floor in [`docs/COMPUTE.md`](docs/COMPUTE.md) — never a tier chosen for economy.
  `steps: [{kind:"script"|"instructions"|"skill"|"prompt", ...}]` composes
  a check → fix → re-check chain (`"script"` for an exact command, `"skill"` to fan an existing
  `.claude/skills/<name>/SKILL.md` like `/decompose` across a batch, `"instructions"` to point at a
  reusable `docs/grind/*.instructions.md` chore spec); `promptTemplate` alone covers a one-off. See
  [`docs/grind/README.md`](docs/grind/README.md) for the step-kind grammar and the
  `*.instructions.md` format. Not for cross-item synthesis or a design call, or for anything
  touching `envelope.json`'s protected class — those want a purpose-built pass or Eric's gate, not
  a cheap fan-out (a `/governor` athlete's own WIP=1 throttle is deliberate for the same reason —
  check before fanning a skill/agent that already has one). A run wider than the work spigot's
  current position allows is refused outright, with the number to re-batch it in — never truncated.
- **"stop everything" · "conserve tokens" · "we have spare quota before the reset"** → the **work
  spigot** (#3960): one `work-mode:<halt|conserve|normal|surge>` label on the tracking issue that
  every autonomous lane reads before it pulls — the build lanes' in-flight cap, the research lane's
  per-tick ceiling, a `/governor` cycle's athletes, a `/grind` run's width. `npm run work-gate`
  answers "may I, and how much?" (it folds in the #2946 spend breaker); the numbers are
  `work-mode.json` and nowhere else. Who may turn it (Eric, 2026-09-30): `halt` and `normal`
  anyone, `conserve` only on his explicit phrase ([`docs/COMPUTE.md`](docs/COMPUTE.md)), `surge`
  his alone — raising a cap is the spend class. Every non-normal position carries an `until <date>`
  comment and reads as `normal` once it passes, so a forgotten throttle can't starve the repo; a
  `bug` + `fast-track` issue still builds under `conserve`, and nothing builds under `halt`.
- **A bottleneck surfaced by fan-out** (Eric, 2026-09-04: "given we are fanning out process, I
  expect a number of new bottlenecks to surface... capture and delegate pursuit of opportunities to
  integrate superior solutions") — ToC's own corollary: elevate one constraint and the next binds.
  The moment a constraint is *measured* (a rate limit hit, a WIP throttle blocking a batch, a shared
  file every lane races, a manual step every session repeats), file it with **`/issue`** + the
  **`bottleneck`** label — a capsule with the evidence and its `**Before:**` number, not a hunch — and let
  `docs/grind/research-bottleneck.instructions.md` pursue it: a grind run over the open
  `bottleneck` issues finds the superior *existing* solution first (bespoke last), battle-tests it,
  and leaves a call sheet + routing label (`feedback` / `needs-eric` / `next-slice`) on the issue.
  Capture is every session's job the instant it's measured; pursuit is delegated, never Eric's.
- **"the same correction keeps coming back"**, "review memory", or a run whose lessons should outlive it → **`/dream`**, which proposes and never edits. A long or retried task keeps run memory: `scripts/run-memory.mjs` ([`docs/DELEGATION.md`](docs/DELEGATION.md)).
- **"file this as an issue"**, or an issue that reads as a wall → **`/issue`** (shapes the capsule,
  lints via `npm run issue:lint`).
- **Any reaction to a rendered frame** ("this looks terrible", "a 30/100", "more dramatic") →
  `/telestrator` — names the cause before anything gets changed (the inverse of `/vision`).
- **Screenshots of someone else's app** ("Fidelity's mobile app is amazing", "use this for
  inspiration", "reverse engineer this") → **`/teardown`** — redacts first, names the patterns
  and the mechanic under each, a borrow / adapt / skip call sheet with falsifiers, a gap table
  that reads our code, the vocabulary to ask with next time; lands on the plan issue, images in a
  private artifact only (Eric, 2026-09-05, after the Fidelity study: "reverse engineering would be
  a good research skill to develop… getting concepts on our radar to add tools to our toolbox").
- **"we need an agent for X"** → `/charter` before writing any `.claude/agents/*.md` — REJECT is a
  normal, expected verdict, not a shortfall.
- **"make a shareable page"** (field guide, dashboard, report) → the `artifact-design` skill, built from
  `docs/BRAND.md` tokens.
- **A finished Claude Design session** → one of the two paths in [`docs/HANDOFFS.md`](docs/HANDOFFS.md)
  — mark the canvas boards `build` and fire the design lane with one tap, or attach the session's
  export to a Claude Code session with a one-line ask (Eric, 2026-09-24: "attaching the artifact
  from the claude design session is enough for you to take it from here"). Either way Eric's own act
  is the go signal; a saved canvas or an idle bundle triggers nothing.
- **Drawing or reviewing any diagram** (a PR picture, an issue, a plan's lifecycle, an architecture
  page, a reply) → **`/mermaid`** — the type by story, the delta grammar, GitHub's actual renderer
  facts and one reference card per type, loaded only then (Eric, 2026-09-25: expert on demand, no
  standing tax). Who reads it: [`docs/READERS.md`](docs/READERS.md).
- Report-outs and digests → `/secretary` · caught drift → `/retro` · rising token burn →
  [`docs/process/TOKEN-EFFICIENCY.md`](docs/process/TOKEN-EFFICIENCY.md).
- **A recurring domain needs bounded experimentation** (thin slice → pressure test → find the
  weakness → capture/enhance → back-test) → the anatomy in
  [`docs/process/LEARNING-LOOP.md`](docs/process/LEARNING-LOOP.md) — a defined structure every
  custom-catered instance conforms to, not a one-off process re-derived per domain.
- **"Learn everything about X and fold it into our process"** (a tool's deeper capabilities, a
  respected practitioner's repo) → the anatomy in
  [`docs/process/CAPABILITY-ADOPTION.md`](docs/process/CAPABILITY-ADOPTION.md): read exhaustively ·
  census what we already do · map the surfaces · ground-truth the runtime · gate first · on-demand
  reference · slices as learning loops on a plan issue with a state block. Instances: #3748, #3769.

**Merge posture** (Eric, 2026-08-20: with Claude authoring ~100% of PRs, a standing pre-merge taste
gate makes him the constraint on everything — severely softened). Structural, feature, and visual PRs
all auto-merge; his taste review happens **live, post-merge** — hand him the deployed route and adapt
from reactions. Hold a PR pre-merge only when he asks, or when Claude has a specific taste fork worth
his eyes before shipping (say so on the PR, and open it with `/ship` and `--hold`:
`scripts/ship.sh open "<title>" --body-file <f> --hold` applies `hold-merge`, which
`pipeline.yml`'s arm job skips). The irreversible carve-outs (workflow files,
credentials/spend/outward-facing) still never auto-merge — **but they board a platter, one touch
per cadence, not one held PR each** (Eric, 2026-09-04: "10 PRs consolidated into 1 or a few PRs
result in fewer touch points... at a higher altitude the ideology still holds up that changes are
part of a singular change" — the items are implementation details he doesn't care about). Same
shape as `/governor` feast mode, pointed at the irreversible class: every protected-path change
that is already green on its own branch boards the open platter as one commit; the platter is a
held PR whose body is a ledger (item · why · verify evidence · revert sha); it merges with a
**merge commit, one commit per item** (the one carve-out from squash, so a bad item reverts
alone); nothing red ever boards. There is no same-file fence — items board *sequentially* onto
one integration branch, so that rule stays with feast mode's parallel athletes (#1347). The
boundary itself never moves — he still merges it; the cost of clearing it drops from N to 1. Mechanism: #1343.
Full merge policy: `.claude/skills/governor/SKILL.md`. Eric will not remember these names — that
is expected and fine; the docs are the memory.

## Ship loop

- Branch off latest `origin/main` per change **before editing** (`git fetch origin main && git
  checkout -B <branch> origin/main` — fetch first: a cached ref can be genuinely stale or diverged
  from the real tip, not just a few commits behind, docs/LESSONS.md 2026-09-04) — branch-first means never needing `git stash`, which is **banned here** (it has silently dropped edits). Small
  focused PRs; squash-merge on green; Conventional-Commit subjects, **lowercase-led** (commitlint
  rejects a capitalized first word — even "PRs"/"Barad-dûr").
- Open PRs with **`/ship`** (local verify + integration tests → push → REST open → stop; the pipeline arms; wraps
  `scripts/ship.sh`). The ship skill also owns the landing mechanics and traps: PR bodies over REST
  (the GitHub MCP write tools silently strip `<details>`), draft promotion, whose-token-arms-the-merge,
  and `deploy-lag.mjs`.
- **Auto-merge (SQUASH by native GitHub auto-merge) is the default at open** — opt-*out*, not opt-in;
  hold only for Eric's ask or the carve-outs. **Draft is a harness artifact, never a judgment:
  promote it at once.** `pipeline.yml`'s `arm auto-merge` job arms it after `verify` **and**
  `integration tests` pass; never arm by hand (#4094: three PRs merged mid-integration-tests,
  2026-09-30). A lingering draft is a throughput bug — drafts can't
  auto-merge AND skip `verify` (`docs/LESSONS.md`, 2026-08-14).
- **Commits & PRs are documents** ([`docs/ENGINEERING.md`](docs/ENGINEERING.md) → _Change
  communication_): plain-language **Summary** + **Why**, weeds below the fold, mirroring
  `.github/pull_request_template.md`; proportional — no ceremony on a typo fix.
- Verify before merge: `npm run verify` (typecheck + lint + tests, root and `app/` — the set the
  pre-push hook and CI run), + a screenshot for visual
  work (`npm run shoot:login` or an offline render). **Verify by exit status, not tailed output** —
  a pipeline exits with the last command's status, so `cmd | tail && …` will not halt on failure.
  Code gotchas (the inline login-canvas template-literal trap, `prefers-reduced-motion`):
  `docs/ENGINEERING.md` → _House gotchas_.
- **Solo-dev review substitute:** with no second engineer, the gates are the reviewer. For
  substantive PRs run `/code-review` (and `/security-review`
  when the diff touches auth, tokens, input parsing, or anything outward-facing) before opening —
  but **commit first, and in a fresh worktree set `origin/HEAD` first** (`git remote set-head
  origin -a`). Both skills harvest `origin/HEAD...`, so on uncommitted changes they review an EMPTY
  diff and report clean — assurance over nothing (`docs/LESSONS.md`, 2026-08-26, #612). The Coach
  gates (`arch:scan`, `dupe:scan`) run inside the test suite ([`docs/COACHES.md`](docs/COACHES.md)).
- **Blameless retro on detected drift** → `/retro`: root cause → a full-stop prevention if
  pragmatic, else a Boy-Scout improvement. Don't over-engineer process — ceremony that taxes flow at
  scale is a net negative.
- **Architecture storybook:** [`docs/architecture/`](docs/architecture/README.md) — C4 Context, one page
  per container (its diagram, canonical flow, code roots), each element refuted against the code it
  cites; read a container's page before touching it, and update it in the same PR.
- **Structural map:** [`docs/STRUCTURE-graph.md`](docs/STRUCTURE-graph.md) is a Graphify graph of the
  repo — `graphify explain/query/path/affected` to navigate; after code changes run `graphify
  extract . --code-only` (free). Playbook: [`docs/GRAPHIFY.md`](docs/GRAPHIFY.md).
- Background work runs via subagents under [`docs/DELEGATION.md`](docs/DELEGATION.md) (isolated
  worktrees, verify-before-merge). In burn-down mode, opening small green PRs and letting
  `pipeline.yml` arm their squash auto-merge is the expected loop.
- **An agent isolated in a worktree: Claude Code's worktree check reads every Bash command** and
  refuses what it cannot show stays inside: git aimed at another checkout (the real protection, never
  worked around), a loop or `$(…)` around git, `bash file; echo $?`, `bash -c` whose text names git,
  a variable as an argument to sed or node, `find` with `( … )`. On 2026-11-01 those cost 148 agents 129 failed calls.
  Spell paths out, even long ones. The tool already reports a non-zero exit, so `echo $?` adds
  nothing. Anything longer goes in a script file in your scratchpad, run as `bash <file>`, aimed at
  your own worktree. Rail 2 of [`docs/DELEGATION.md`](docs/DELEGATION.md) has the rest. A workflow agent that ends its turn is done: wait in `until` loops.
