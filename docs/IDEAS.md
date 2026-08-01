# Ideas & Backlog

The durable home for ideas so they leave the working context but never get lost. Eric injects
thoughts freely; Claude routes each one here (see the routing convention in
[`CLAUDE.md`](../CLAUDE.md)). The in-session task list is the *working subset* pulled from this file;
this file is the permanent record (the session environment is ephemeral — uncommitted notes die with
it).

**Format:** newest ideas at the top of _Inbox_. When one is picked up, move it to _In progress_, and
to _Shipped_ (with the PR#) when done. Keep entries one or two lines — enough to reconstruct intent.

**Attribution:** every idea records its source and the proximity that exposed it —
`_(src: Eric | Claude · while: <context>)_`. Eric-sourced entries are intent; Claude-sourced ones
(_Side quests_ below) are proposals to prune. Items without a tag predate this convention and are
Eric-sourced.

---

## Inbox (captured, not yet started)

### The Foundry — meta-system ideas (the machine that builds the machine)
A distinct class from the product ideas below: these are ideas about **the operating model itself** —
templates, mechanics, roles, and loops that make Claude-plus-Eric a better system regardless of which
product it's pointed at. They belong here (one think tank, not two) but they resolve to
`docs/OPERATING-MODEL.md` / `docs/COACHES.md` / `.claude/` rather than to `src/`. Portable by
construction — anything here should survive a lift-and-shift to another repo.

**1. Template systems for building artifacts.** A generator + house style for the things we keep
hand-rolling:
- **Skills** — a skill template (we author them ad hoc today; `skill-creator` exists upstream but our
  house conventions — drills, ratchets, gates — aren't encoded in a template).
- **Instructions that reinforce strong opinions** — an instruction template that *takes a position*
  rather than staying neutral: TDD/BDD, Theory of Constraints, semantic release, Conventional Commits.
  The bet: opinionated defaults beat configurable ones for an autonomous executor.
- **Sub-agents** — a delegation template (the coach/athlete pattern in `docs/COACHES.md` generalized
  into a fill-in-the-blanks form).

**2. Systems to develop, refine, or reinforce.** The mechanics list, verbatim in intent:
- **Self-healing systems** — detect *and correct* without a human in the loop (we detect well; the
  correct half is still mostly Claude-triggered).
- **Learning loops** — the `/retro` + `docs/LESSONS.md` ledger is the seed; generalize it.
- **Eval** — we have gates but no *evals*: no scored, repeatable measurement of whether a skill/agent
  got better. The biggest gap in the roster.
- **Decomposing skills → reduce complexity** — `/decompose` exists for code; the same drill applied to
  *skills and instructions* (a god-skill is a god-file).
- **Maintaining balance** — the explicit anti-goal of over-optimizing one dimension (test granularity,
  gate strictness, ceremony) at the cost of flow.
- **Fleet management** — configuration drift across repos/environments; **portability** (lift-and-shift
  the whole operating model into a new repo in one move). Today `docs/OPERATING-MODEL.md` is the
  hand-carried version — this asks for the mechanized one.
- **Research role** — a coach whose job is to *reinforce decisions with data* rather than assert them.
  Pairs with eval: research finds the evidence, eval scores the outcome.
- **An interactive systems-level diagram** — highly visual, pleasing, and **zoomable**: out to the
  altitude of whole systems, in to granular detail. `docs/STRUCTURE-graph.md` (Graphify) is the data
  layer with no viewer; the cinematic-metaphor bar applies (this is a telestrator for the architecture).
- **Persona creator** — a template/generator for personas (product-side bot personas and operating-model
  roles are the same shape).

**3. Archetype: automation engineer (Eric's read on himself).** _Flagged high priority with a real
deadline — it's meant to influence an onboarding decision for a new position at work._ Anthropic's
Claude Code team is described as five archetypes and zero job titles: **Prototyper** (many fast
throwaways to find what's worth building), **Builder** (validated prototype → production), **Sweeper**
(deletes underperforming features, prevents bloat), **Grower** (iterates on shipped work against real
user behavior), **Maintainer** (keeps mature systems reliable at scale) — fluid, not sequential; one
person may prototype Monday and sweep Friday.
Eric's thesis: **automation engineer is the orthogonal sixth** — not a stage in that pipeline but a
support/enablement role standing *underneath all five*, because every one of them carries manual
process. The pairing partner who chips away at that manual work. "The mechanic in the pit crew, not
the race-car driver."
_Objective note (Claude, as asked):_ the article does not name an automation/enablement archetype, and
it leans the other way — "the general model beats the specialized one," with Claude Code itself
absorbing maintainer work (reviewing PRs before humans do) rather than a specialist tooling role being
created. Two honest readings: (a) the role is real but *invisible* in that framing because at Anthropic
it's dissolved into the tooling everyone uses — which is an argument for the archetype's value, not
against it; (b) the framing genuinely doesn't have a seat for it, and the closest fit is Sweeper +
Maintainer, whose shared substance is manual-process removal. Worth deciding which reading the
onboarding conversation should be built on. Note also the article is one writer's secondhand summary,
not an Anthropic publication — weight it accordingly.

**3a. The archetypes are a lifecycle, and automation is the axis crossing it (Eric's sharpening).**
Two claims that make the thesis much stronger than "a sixth role":
- **The five archetypes are a development lifecycle progression** — explore → productionize → prune →
  iterate → sustain, the traditional SDLC under new names. What Anthropic changed is not the mechanics
  but their *granularity*: the stages stopped being job titles held by different people and became
  **modes one person moves between weekly**. This is the pattern overlaying the still-unknown lifecycles
  of the AI ecosystem — same mechanics, different positions on the timeline, much shorter cycle time.
- **Therefore automation engineer isn't a sixth stage — it's the axis crossing all five.** If the
  archetypes are modes rather than roles, the binding constraint stops being headcount-per-stage and
  becomes **mode-switching cost**, and mode-switching cost *is* manual process. The automation engineer
  operates on the constraint itself rather than on any one stage. That is Theory of Constraints stated
  in org terms, and it reframes the role from support to leverage.
- **Eric's evidence, his own core strengths:** tech-debt cleanup; Renovate automation; and specifically
  **building the test systems that earn gold-tier Renovate recipes — automerge everything but breaking
  changes.** The load-bearing insight there: the automation is not the merge rule, it's the *verification
  coverage that makes the merge rule safe*. Trust is a function of test depth. Dependency upkeep is
  archetypal Maintainer work, and automating it doesn't delete the mechanic — it relocates it to a
  machine and hands the human's attention back. That is the whole argument in one artifact.
- **This repo is the second instance of the same move** — Coach gates (arch/dupe/dead/spec-gap) plus
  auto-merge-by-default is gold-tier Renovate applied to a codebase's own structure instead of its
  dependencies. Verification earns autonomy; the ratchet keeps it earned. Useful as a portfolio exhibit
  for the onboarding conversation: the pattern demonstrated twice, in two domains.
_(src: Eric · while: reconsidering the archetype thesis after the objective read)_

**4. The meta-ask: this file should be a think tank, not a list.** Eric's framing — a "multifaceted
container" where ideas **interconnect and associate**, so new systems *emerge* from the associations
and increase resiliency; a source of intent/goals/interests Claude can read to **influence decisions
and suggest priority by possible impact**; and "another way to index." Today `IDEAS.md` captures well
and associates not at all: flat sections, no cross-links, no impact/effort signal, no query surface,
and nothing reads it back into a decision. The gap is the association + retrieval layer, not capture.
_(src: Eric · while: asking whether we have a think-tank system — a full raw dump, routed here intact)_

**5. Prescriptive instructions vs. "the general model beats the specialized one."** Eric's instinct is
detailed, opinionated instructions; the article emphasizes generality. **These are different layers and
don't actually conflict:** "general beats specialized" is a claim about the *model/agent* (don't build a
narrow bespoke agent), not about the *context you hand it*. Prescriptive instructions don't specialize
the model — they supply priors it cannot derive. General model + sharp context beats both a specialized
model and a general model with vague context.
- **The throughput argument, and it holds:** deep frontend knowledge → highly prescriptive instructions
  → less thinking time → better DX → more delivered (better UX) → fewer tokens → more throughput. Same
  compounding loop as `docs/COACHES.md` → _Resource cost is a fitness dimension_.
- **Where prescription earns its keep:** (a) choices that are **arbitrary but must be consistent** —
  the model can't derive them and guesses differently every session, so convention is pure win; (b)
  **hard-won non-obvious knowledge** — this library breaks in this specific way. Skip prescribing what's
  derivable from the codebase itself, or what the model already does well; that's context budget spent
  for nothing.
- **The caveat worth designing around: prose prescriptions rot,** and a stale confident instruction is
  *worse* than none because it gets followed. Frontend ecosystem half-life is short. So the highest form
  of Eric's frontend knowledge is **not prose opinions — it's scripts, gates, and templates** (ladder
  rungs 3–4), which can't drift back the way prose can and cost ~nothing per run. Exactly the gold-tier
  Renovate move again: don't write "check dependencies carefully," build the coverage that makes it
  mechanical. A **frontend doctrine + gate set** is the concrete deliverable, and it's portable.
- **Gap this exposes — nothing detects redundancy in our own working patterns.** The codification
  ladder's rule of three (manual once → skill on the second → agent on the third) has **no detector**:
  `dupe-scan`/`arch-scan` see repetition in *code*, nothing sees "Claude did this same manual dance
  three sessions running." That's the optimization-opportunity sensor Eric is asking for, and it's the
  missing input to the whole ladder. Candidate: mine session transcripts / git history for recurring
  command+edit shapes and surface them as codification candidates.
_(src: Eric · while: arguing prescriptive instructions against the article's generality claim —
"if tasks are highly redundant, we should be looking for opportunities to optimize")_

**6. Third-party personas/archetypes Claude can assume.** Requested alongside the voice profile: a
roster of **lenses** Claude can deliberately adopt, seeded from the article's five (Prototyper,
Builder, Sweeper, Grower, Maintainer) plus **sub-archetypes** underneath each. The value is that each
archetype asks a *different question* of the same diff — a Sweeper reviewing a feature PR ("what does
this let us delete?") reaches conclusions a Builder never will. Open fork: what shape does this take —
a `/lens` skill that reviews under a named archetype, distinct `subagent_type` entries so a panel can
run in parallel, or a declared mode Claude announces and holds for a stretch of work? The panel form
composes with idea #7 below. Note the honest tension: the article's own claim is that the general model
beats the specialized one, so the win here is **forced perspective diversity on one general model**,
not narrow specialists. _(src: Eric · while: asking for a voice profile — "highly useful to have 3rd
party personas/archtypes to assume")_

**7. Tangent — sub-agents are divide-and-conquer; the unlock is coordination.** Eric's framing, and it
names the real bottleneck: spawning parallel agents is the easy half and we already do it
(`docs/DELEGATION.md`, the coach/athlete roster). What's weak is **coordination** — agents don't share
findings, can't see each other's work, collide on the same files, and re-derive the same context from
scratch. Parallelism without coordination caps out fast and can go *negative* (merge conflicts,
duplicated effort, contradictory changes). Threads worth pulling: a shared scratch/blackboard agents
read and write; explicit file-territory claims to prevent collisions (the governor's collision check is
the seed); a synthesis step that reconciles findings rather than concatenating them; and passing
*decisions* down rather than making each athlete rediscover them. Frame it as the constraint: adding
agents doesn't raise throughput once coordination is binding — elevate coordination instead.
_(src: Eric · while: the voice-profile ask — flagged by him as a tangent)_

**8. Battle of the wits — portability makes systems comparable, comparison makes them improvable.**
Eric's chain: _if we can port systems, we can compare them → a competition between ecosystems → process
gaps surfaced as enhancements._ The load-bearing insight is that **portability and comparability are the
same property**. Lifting a system out of a repo forces you to define its boundary — what's the operating
model vs. what's the project — and a defined boundary is exactly the interface that lets you *substitute*
one system for another against the same workload. Portability forces the interface; the interface enables
substitution; substitution is the experiment. This also closes the roster's biggest hole (idea #2 —
"eval": gates but no scored, repeatable measurement of whether a skill/agent got *better*); Eric has
proposed the mechanism for it.
- **Two existing pieces this docks onto.** `scripts/duel-log.mjs` already logs fanout/fanin/intent to
  mine eval scenarios — a tournament flywheel comparing *agents on one task* (`docs/GAMEBOARD-PLAN.md`
  §eval seed). This idea is the same flywheel **one altitude up**: systems on one task suite. And
  `docs/COACHES.md` → _Detection lag_ is the sharpest available scoring dimension, since it measures the
  system watching itself.
- **The design correction that makes it evidence instead of vibes:** comparing two *repos* is badly
  confounded — different domain, size, age, language — so a score gap doesn't attribute to the operating
  model. The strong form holds the **work** constant and varies the **system**: a fixed task suite
  (decompose this file, fix this bug, add this feature, catch this planted drift) that any ecosystem
  instance runs. Then it's a benchmark, not a beauty contest.
- **Candidate scoreboard, all already emitted in pieces:** detection lag; gate budgets and their ratchet
  trajectory; resource cost (tokens, GraphQL/core buckets, GHA minutes, wall-clock); PR cycle time;
  escaped-defect count from `docs/LESSONS.md`.
- **The deliverable is the process diff, not the trophy.** If system A caught a planted drift in seconds
  and system B took days, the *gap* is the output — winner-takes-all discards the useful half. Best
  practices merge back to both; the same judge-panel shape as the persona lenses (#6), and the same
  engine as the product's own leaderboard — the operating model getting the treatment the product gets.
_(src: Eric · while: "food for thought" — riffing on portability from the fleet-management thread)_

**9. Load-bearing metaphors — a catalog, and a rubric for *why* they hold.** Eric: certain words/things
"provide abstract structures that are useful to model… these are key components that carry the weight of
the architecture," and we should be **hyper-sensitive to detecting and detailing why they're effective**.
The *why* is the whole idea — a list of nice analogies is decoration; a rubric is a tool.

**The distinction this exposes, which `CLAUDE.md` doesn't yet draw.** There are two classes of metaphor
here and only one is documented:
- **Skin** (aesthetic/lore) — the Eye of Sauron, tractor beams, the telestrator. Flavor on accurate
  mechanics; buys engagement and memorability. This is what CLAUDE.md's "cinematic metaphors" line covers.
- **Skeleton** (structural/generative) — these *generate mechanics*, not looks, and they answer questions
  their author never anticipated. Already everywhere in this repo, unnamed as a class: the **coaching
  staff** (defense/offense/special teams, head coach, athletes, drills), **atomic design**
  (atoms/molecules/organisms), the **ratchet**, **Theory of Constraints**, **the Three Ways**,
  **commander's intent** (Jocko), nets/eyes/funnels. The doctrine that made this repo work is almost
  entirely borrowed skeletons.

**Rubric — what predicts a metaphor carries architectural weight:**
1. **Surplus structure.** The source domain has more detail than you've spent, so it keeps answering.
   DNA offers replication, expression, mutation, recombination, junk regions. "The codebase is a garden"
   answers once and stops.
2. **The source solved a real constraint under pressure.** Importing a battle-tested structure imports
   its proof. This is why borrowed beats invented.
3. **Isomorphism of *relations*, not nouns.** The mapping must preserve how parts interact. Failure mode:
   only the vocabulary transfers.
4. **It makes falsifiable, non-obvious predictions.** ToC predicts "optimizing a non-constraint is waste"
   — checkable, and counterintuitive. A decorative metaphor predicts nothing.
5. **Its breaking point is nameable.** Knowing where the analogy stops is what keeps it honest.
   Anti-pattern: **metaphor capture** — driving decisions past the isomorphic region. More dangerous for
   skeletons than skins, because a wrong skeleton still produces *plausible* architecture.

**DNA (Eric's first example) — the richest unexploited vein.** *Genotype → phenotype* is the mapping:
a compact spec that **expresses** into a large artifact conditioned on environment — i.e. `CLAUDE.md` is
genome, each session's behavior is phenotype, and the same genome expresses differently per repo.
Immediate yields: **configuration drift is mutation** (fleet management = genomic integrity across a
population, idea #2); **junk regions** are dead code and unread docs (the mortician already patrols);
**recombination** is the merge-back step of battle-of-the-wits (#8). And the Jurassic Park detail is a
*warning*, not a flourish: they reconstructed from a **partial** genome and the **gap-filler determined
the organism**. Porting a system with gaps means the destination environment silently fills them — the
sharpest argument yet for making the operating model's boundary explicit before lifting it.

**Three branches / checks and balances (his second, and the punchline: "the orchestration layer as a
team/nation").** The real mechanism is *separated powers with mutual veto* — no single actor completes a
consequential action alone. Mapped: Claude **proposes** (executive), gates + CI **ratify** (legislative),
`/retro` + `LESSONS.md` **judge** whether an action conformed to doctrine (judicial), and Eric's
irreversible class is a **constitutional limit** rather than an office. Two findings the lens produces
that we didn't have:
- **The judiciary is our weakest branch.** It only convenes *after* an incident. Nothing asks
  prospectively "is this action legitimate under our own doctrine?"
- **There is no amendment process, and doctrine changes are currently *easier* than code changes.** Code
  passes gates, review, CI; `CLAUDE.md` takes a plain edit. A constitution makes self-modification
  deliberately *harder* than ordinary action. That inversion is a real structural bug, and the metaphor
  is what surfaced it — which is itself the argument for the whole idea.
- Note it also **is** the coordination substrate from tangent #7: checks and balances is precisely a
  protocol for many actors acting without collision or capture.
_(src: Eric · while: proposing a system for abstract structures worth modeling — "hyper sensitive to
detecting and detailing why these are effective")_

**10. The side-quest generator — "choose your own adventure" as the think tank's read surface.** Branding
idea, and it closes the loop on the original ask (#4): a generator that **assesses all available context
and offers a series of quests to pick up**. Capture exists (`IDEAS.md`), association is forming (these
Foundry entries cross-reference), but nothing *reads it back into a decision* — this is that missing
layer, and it's the half Eric named first ("a source of intent/goals/interests you could use to influence
decision choices and even suggest priority based on the possible impact").
- **Inputs, all already emitted:** `IDEAS.md` (intent), gate outputs and their ratchet budgets (named
  targets), `LESSONS.md` open incidents, git history, and *proximity* to whatever is currently being
  worked — the `while:` tag was designed for exactly this retrieval.
- **The "choose your own adventure" mechanic is the load-bearing part.** Picking a quest must *change
  what's offered next* — that branching is the emergence Eric wants, not a static ranked list. A hand of
  3–5 offers beats a backlog dump; the offer set is the product.
- **Quest tiers encode impact/effort in vocabulary the repo already speaks** (D&D roots, personas, the
  academy's ranks): **main quest** (the current thread) · **side quest** (adjacent, cheap, `IDEAS.md`
  already uses the term) · **bounty** (a gate-named target with a ratchet attached) · **boss fight** (the
  big structural ones needing dedicated focus). Naming the tier *is* the prioritization.
- **Composes with the roster:** persona lenses (#6) change which quests get offered — a Sweeper offers
  deletions, a Grower offers iterations; battle-of-the-wits (#8) supplies the scoreboard; the redundancy
  detector (#5) generates bounties automatically. This is the surface all of them present through.
- On-brand by construction: the product is a game where bots race a leaderboard — the operating model
  getting a quest board is the same treatment at a different altitude ("fun is the flywheel, not the
  wrapper"). Likely lands as a `/quests` skill.
_(src: Eric · while: thinking about branding — "side quest generator, choose your own adventure")_

**11. Flow-state capture — the cost is *obligation*, not length or latency.** Eric is having ideas
faster than they can be banked. First diagnosis (Claude's) was that long replies break flow — **Eric
corrected it:** _"faster responses would also reduce my ability to think/type out new ideas."_ Generation
time is **buffer** — he drafts the next idea while Claude writes. So latency is a *feature*, and the real
tax is a response that **demands a decision**: questions, option menus, anything that must be read and
answered before he can continue. Optimize for _"nothing here needs you,"_ not for brevity or speed.
- **Firehose mode** — a declared stretch where Claude keeps working and banking but issues **no
  questions, no option menus, no decision requests**. Length is fine; obligation is not. Synthesis and
  forks queue up for when he surfaces. _Eric has standing authorization to be **reminded** to enter it —
  "I'll try to remember that, but may forget. if reminding me is beneficial/needed, do it."_
- **Capture without a round trip** — voice memo / phone notes / an append-only scratch file Claude
  ingests in batch. The lowest-friction capture is the one that doesn't need Claude present at all.
- **Batch refinement as a subagent job** — refine the whole file periodically instead of each idea on
  arrival. Cluster, dedupe, cross-link, promote. This is where "continuously refine" actually belongs.
- The full pipeline Eric has now specified across these entries: **capture → batch-refine → associate →
  generate quests (#10) → dispatch with territories (#7)**. Every stage is named; none are built.

**12. Waterfall reconsidered — the economics inverted, and it's presentation-worthy.** Eric's thesis:
requirements-gathering used to buy weeks/months/years of development per day collected; now that same
development lands in days, so **exhaustive upfront requirements look worth more than they did.** His
sharpening is the load-bearing part: *"Should we be reducing iterations, or just iterations with humans
involved?"* — small iterations under the hood remain the best way to build while meeting quality bars,
but for humans the goal has moved toward **one-shotting bosses**.
- **The distinction is right and it's the whole insight: the two loops now have opposite economics.**
  Machine iterations are cheap, verifiable, and non-constraint → run them constantly. Human iterations
  spend the actual constraint → make each one resolve maximum uncertainty. That's ToC, not nostalgia for
  waterfall.
- **Where the classic anti-waterfall argument survives:** cheap building weakens the *cost-of-late-
  discovery* half (a wrong requirement now costs days, so the escalation curve flattens) — but it does
  **not** weaken *"users don't know what they want until they see it."* That's human cognition, not
  engineering cost. Cheap building actually makes a **prototype a better elicitation instrument than an
  interview**, which cuts against pure waterfall.
- **Resolution worth presenting: waterfall the _definition of done_, not the design.** Exhaustive upfront
  *acceptance criteria* + taste guardrails are what let the machine iterate unsupervised; exhaustive
  upfront *design* is still wrong and now cheap to fix, so it earns little. This makes `/ears` (the
  existing EARS skill) the load-bearing upstream artifact rather than a nicety — the requirement format
  *is* the autonomy interface.
- **And it's falsifiable via #8:** run the same task suite with thin vs. exhaustive upfront requirements;
  measure human touches, rework, and cycle time. The battle-of-the-wits harness makes this an experiment
  instead of an opinion — a strong spine for the presentation.
_(src: Eric · while: asking how to stay in flow — "we should investigate if this is a moving goalpost…
it feels presentation worthy")_

**13. Raid vocabulary for the one-shot thesis — and "Leroy Jenkins" as the *anti*-pattern.** Eric wants
to name the one-shot-boss pursuit and floated **Leroy Jenkins** as gamer-native branding (most engineers
are gamers). Two notes:
- **Used straight it inverts the meaning.** The meme is the player who charges in *while the raid is
  still planning* and wipes the group — the famous audio is three minutes of meticulous prep that Leroy
  detonates. One-shotting via exhaustive upfront acceptance criteria is his exact opposite. So Leroy is
  the perfect name for the **named failure mode**: the agent that charges off without the acceptance
  criteria. Every quest system wants a named anti-pattern; this is a great one, and gamers will get it
  instantly.
- **The stronger find: raiding is a genuine skeleton metaphor** (passes the #9 rubric with surplus to
  spare) because it is *literally a domain that solved "how do you one-shot a boss."* Its answer is
  Eric's two-loop thesis already proven in the wild: **unlimited cheap practice pulls** (machine
  iterations) + **exhaustive prep and assigned roles** (upfront acceptance criteria) → **the one-shot**
  (the expensive human-facing execution). Native vocabulary that maps without forcing: **one-shot** (real
  raiding term — clearing on the first attempt), **prog** (progression: iterating on a boss you haven't
  beaten), **wipe** (failed attempt, cheap, expected), **pull**, **raid prep / consumables**, **roles**
  (tank/healer/DPS — pairs with the persona lenses, #6), **world first**. Boss fights are already the
  quest-tier name in #10, so the vocabulary is half-adopted.
_(src: Eric · while: naming the one-shot pursuit — "leroy-jenkins feels like a clever name for gamers
(most engineers)")_

**14. Firehose is its own flow — exit criteria, ceiling-sensing, and idea maturity states.** Three linked
pieces from one dump:

**(a) Firehose has context that must be retained, and needs an exit criterion.** Entering the flow is
cheap; *leaving and returning* is where context is lost — both the main task's context and the firehose's
own thread. So the mode needs an explicit resume anchor (what were we doing before) and a defined trigger
for breaking out, either back to the main task or into picking work up from the log.

**(a2) The exit signal is the background refinement pass completing — Eric's addition, and it beats the
alternatives.** Refinement runs **off the main thread** (delegated to a sub-agent, i.e. off the
constraint), and _"the refinement could finish in the background, at which point a judgement call to
pivot could be made."_ Why this is the right trigger rather than a timebox or a saturation check:
- A timebox interrupts **arbitrarily**; saturation-checking requires **self-monitoring mid-flow**, which
  is itself the expensive evaluation we're trying to avoid. A completed refinement pass instead **arrives
  carrying exactly the information the pivot decision needs** — ceilings assessed, associations computed,
  candidates ranked. Maximum information at the moment of interrupt.
- It is `docs/COACHES.md`'s own doctrine applied to attention: **"put the watcher on a path you already
  walk — never add a poller."** Don't schedule a check that *asks* whether to stop; hang the signal on
  work that was already going to finish. Same shape as the incident eye riding `ship.sh`.
- It is a **non-blocking** interrupt — the pivot becomes *available*, not demanded, which satisfies the
  obligation rule in `VOICE.md`. Firehose can simply continue if the hand isn't compelling.
- **Refinement latency is therefore a feature, like response latency** (#11): a ten-minute pass is fine
  because it runs while he dumps. And the agent is a **non-constraint resource** — running it in parallel
  costs the constraint nothing, spending it only on the small, well-informed judgment at the end. Textbook
  subordinate-everything-to-the-constraint.
- **Output format matters: deliver a ranked hand, not a report.** The pass's completion payload should
  *be* the quest offer (#10) so the judgment call is a glance, not a reading assignment.

**(b) Ceiling-sensing — "the ability to quickly sense upper limit/capability on ideas is a required
intuition."** These ideas "could also be groundbreaking," so the payoff is asymmetric: **dropping one
groundbreaking idea costs far more than over-exploring ten mediocre ones.** Design consequences:
- **Do not evaluate ceilings mid-flow.** Evaluation is expensive and is exactly the *obligation* that
  breaks flow (see VOICE.md). Capture is cheap; assessment belongs in the batch refinement pass. The
  mid-flow exit trigger should use only **cheap** signals — saturation (ideas starting to repeat), a
  timebox, or an external commitment — never "is this one good enough?"
- **Ceiling predictors, for the refinement pass:** does it **elevate the binding constraint** or optimize
  a non-constraint (ToC — the latter has ~zero ceiling no matter how elegant); does it **multiply other
  work** or terminate; does it **generalize/port** beyond this repo; does it have **surplus structure**
  (#9) that keeps generating; is it **measurable** (an unmeasurable ceiling is unknown, not high).
- **The computable proxy, and it's the payoff of the whole think tank: association density.** An idea
  that docks onto many others is structurally load-bearing. The association layer isn't only for
  retrieval — **it *is* the ceiling sensor**, which is exactly the "new systems emerge from associations"
  prediction from #4 coming true. Cross-reference count is a rankable signal available for free once the
  graph exists.

**(c) Maturity states, and they mirror the codification ladder.** `docs/COACHES.md` already has the
shape — work descends a ladder as its contract gets written. Ideas want the same: **raw** (captured,
unassessed) → **refined** (clarified, ceiling-assessed, cross-linked) → **specified** (acceptance
criteria written) → **queued** (in the backlog, territory assigned) → **in flight** (agent burning down)
→ **shipped**.
- **"Specified" is the autonomy boundary**, and #12 says why: an idea becomes handoff-ready *precisely
  when its acceptance criteria exist*. The waterfall thesis defines the state transition that makes
  scaled sub-agent handoff safe — the two ideas are one mechanism. `/ears` is the promotion gate.
- **This resolves the `IDEAS.md` / `BACKLOG.md` split** flagged at the start: they aren't two files,
  they're two **states** of one pipeline. The "strong associations to the backlog to funnel stuff into
  the queue" Eric wants is just the raw→queued transition made explicit rather than two disconnected
  documents.
- Queue organization and parallel burn-down is the existing governor + athlete roster; it's gated on
  coordination (#7), not on more agents.
_(src: Eric · while: firehosing — "the ability to quickly sense upper limit/ceiling capability on ideas
is a required intuition we need developed")_

**15. Swappable harnesses + a harness-template generator — #9 turned from a catalog into an engine.**
The biggest structural idea yet. A **harness** is a complete metaphorical nomenclature the system runs
under, changeable as a **setting**: dungeon crawler · coach/team (the current one) · orchestra ·
CEO/corporate · startup · three branches of government. Eric's reasoning — _"specialties have nuanced
specialized skillsets that are hyper effective; those skillsets rise to the occasion and is a good way to
generate ideas."_

**Why it actually works (the mechanism, per the #9 rubric).** Each domain evolved specialized tooling for
*its own* characteristic failure mode, so swapping harnesses **imports a different problem-solving
toolkit** — not a coat of paint:
| Harness | The problem its domain solved | Native question it asks first |
|---|---|---|
| Orchestra | **Synchronization** (conductor, shared score, rehearsal) | "who's out of time — is anyone not reading the same score?" |
| Coach/team | Performance improvement via drills + measurement | "who's underperforming, and which drill fixes it?" |
| Dungeon crawl | **Exploration under incomplete info with real risk** (mapping, scouting, resources, save points) | "what's the route, what kills us, what do we need before the boss?" |
| CEO/corporate | **Accountability at scale** (org chart, ownership, RACI) | "who owns this, and what's the return?" |
| Startup | **Decisions under uncertainty** (MVP, runway, pivot) | "what's the cheapest test, and how long can we fund it?" |
| 3 branches | **Legitimacy and non-capture** | "who can veto this, and was it legitimate?" |
**So the swap rule is: adopt the harness whose native domain already solved the problem you currently
have.** Synchronization trouble → orchestra. Ownership ambiguity → corporate. Unknown territory with
downside risk → dungeon crawl. That is what "rises to the occasion" means, made operational.

**Why "killer feature for evals on the fly" is correct.** Battle-tested domains come with battle-tested
**success criteria**: an orchestra scores together/in-tune/on-tempo; a raid scores one-shot vs. wipe
count; a corporation scores the number; a team has a scoreboard. Adopting a harness therefore yields a
**scoring rubric for free** — the metaphor *generates* the eval. This is the missing-eval hole (#2) filled
from a second direction, and it composes with #8: different harnesses are different scoreboards over the
same work, i.e. multi-lens verification.

**The two design constraints that keep it honest:**
1. **The mechanics must be invariant.** A harness is a **presentation + question-set layer over an
   unchanged core** — gates, ratchets, acceptance criteria, and what is *true* never move. Same rule as
   `CLAUDE.md`'s "lore is a flavor layer on accurate mechanics," and the risk is **metaphor capture**
   (#9) multiplied by N: six harnesses is six ways to produce plausible-but-wrong architecture.
2. **The template generator is what makes N affordable.** Eric: _"this effectively requires all paradigms
   developing in tandem at once… more heavy up front but feels super powerful."_ Correct — without a
   template, N harnesses is N× maintenance and guaranteed drift. The generator defines the **harness
   interface** (roles, work units, quality gates, failure modes, success criteria, progression tiers) so
   a new theme is a filled-in form rather than a rewrite. Building the interface is also what proves the
   core is genuinely theme-independent.

**Dungeon-crawler specifics (the first theme to build):** a route plan through the dungeon; bosses to
beat; **diagrams mapping the layout**, with key boss-fight stages, choreography/orchestration, sequencing
and battle plans visualized. Two strong docks:
- **"Ties back into the main storyline (ADRs)"** — sharp, and literal: `docs/adr/` (9 entries) is the
  persistent record of decisions made. **Cleared rooms are ADRs**; the dungeon layout is the accumulated
  path of decisions; the main storyline is the architecture's history. The map is a *view* of the ADR log,
  not a new artifact to maintain.
- It **is** the zoomable interactive systems diagram from the original dump (#2, item 8) — "highly
  visual, pleasing, zoom in to granular detail and out to higher-altitude systems." First message meets
  fifteenth: the dungeon map is that diagram wearing a theme, and boss-fight choreography is the
  zoomed-in detail level.
_(src: Eric · while: firehosing themes — "harness-template generator… this would be a killer feature to
develop evals on the fly")_

**16. The journal — and Eric is right that it's a system-level word like DNA.** A daily journal/diary
that captures context, builds rapport, and becomes the **data source for stories worth telling** — "a
chronological bridge to retroactively store context." He then self-corrects: _"perhaps I am simply
describing our backlog as a journal. If so, the journal is a system level word like DNA."_ Applying the
#9 rubric to his own idea — and it passes, hard:
- **Surplus structure, unusually deep.** *Journal* carries at least three battle-tested traditions:
  the **diary** (chronology, voice changing over time, re-reading, marginalia), **double-entry
  bookkeeping** (journal → ledger, auditability), and **computing's write-ahead log** (event sourcing,
  journaling filesystems, crash recovery). Each solved durability and reconstruction under real pressure.
- **Its sharpest prediction, and it's checkable:** event sourcing says *current state must be derivable
  from the log — if it isn't, you have hidden state.* Ask that of this repo and the gap appears
  immediately (below).
- **Its known breaking point:** journals don't compress. Infinite append is unusable without indexing
  and summarization — which is precisely why the association layer (#5) and the refinement pass (#15)
  are its necessary companions, not optional polish.

**The resolution to "am I just describing the backlog?" — no, and the difference is the useful part.**
**A backlog is forward-looking and mutable** (reorder, edit, delete). **A journal is backward-looking and
immutable** (append-only; you never rewrite yesterday, you append a correction). `IDEAS.md` currently
tries to be both — a mutable Inbox *and* an append-only Shipped list — which is why it feels muddled.
They are two structures and the repo needs both; #15's maturity states are the **pipeline between them**.

**The real gap this names: nothing journals the _reasoning_.** Git journals the code, `docs/adr/`
journals decisions, `LESSONS.md` journals incidents (already literally called a *ledger*),
`data/duel-log.jsonl` journals raw intent via the `UserPromptSubmit` hook — a proto-journal already
running. But the *why*, the path, the discarded branch of thinking is nowhere. **This session is the
proof:** sixteen-plus ideas emerged from a conversation, and if it ended now only the outcomes would
survive — the derivation would be gone. That derivation is exactly the "stories worth telling" material,
and the source for presentations, the ADR main storyline (#16), and the lore layer.
_(src: Eric · while: firehosing — "a daily journal is a chronological bridge to retroactively store
context")_

**17. Anti-patterns as a reassessment corpus — the generalization of #12.** Eric: anti-patterns are
well-known and most probably still apply, _"but it feels like the goalpost has significantly moved on
certain properties where AP's may be a source/collection of patterns worth reassessing."_ Waterfall (#12)
was the first instance; this is the general method, and it's a rich vein because **an anti-pattern is a
cost/benefit judgment frozen into a rule.** Each encodes an economic assumption from its era; when the
economics shift, the rule outlives its justification but keeps its authority.

**The discriminator that makes this systematic rather than contrarian:** _an anti-pattern flips when its
cost was borne by **human labor that is now cheap**; it survives — or worsens — when its cost is borne by
**human attention**, which is still the constraint._

| Anti-pattern | Cost it was pricing | Verdict |
|---|---|---|
| **Waterfall / BDUF** | Late discovery of wrong requirements | **Partially flips** — waterfall the *definition of done*, not the design (#12) |
| **Rewrite from scratch** | Years of work + loss of accumulated bug fixes | **Flips hardest** — if a rewrite takes days *and* the test suite encodes the accumulated fixes, Spolsky's objection largely dissolves. Tests are the knowledge |
| **Copy-paste / DRY violation** | Maintenance across N sites | **Softens** — and this repo already paid for it: `LESSONS.md` records a consolidation that *dropped a NaN guard*. Premature abstraction's cost didn't fall; duplication's did |
| **Not Invented Here** | Labor to rebuild what exists | **Flips for small utilities** — cheap to build, while dependencies still carry supply-chain and drift cost (Eric's Renovate domain) |
| **Speculative generality / YAGNI** | Building for a future that didn't arrive | **Weakens but holds** — building got cheap; *carrying* it (context budget, maintenance) did not |
| **Gold plating** | Over-building beyond requirements | **Survives, possibly worsens** — the cost is review attention, and cheap generation produces more to review |
| **Cargo cult programming** | Copying without understanding | **Worsens** — the failure mode is comprehension, which nothing made cheaper |
Presentation-worthy alongside #12, and **testable via #9's harness**: reassessed anti-patterns are
exactly the kind of claim a fixed task suite can settle.
_(src: Eric · while: firehosing — "anti patterns may be a source/collection of patterns worth
reassessing")_

**17a. The anatomy of an anti-pattern — and the tandem hypothesis.** Eric's sharpening, and it turns
#17 from a verdict table into a research program. _"Iterating through antipatterns to study/analyze the
anatomy of what makes it an anti pattern seems worthwhile no matter what."_ Three yields plus one
genuinely novel claim:
- **The value is unconditional.** Whether or not a pattern flips, dissecting it yields **a source of
  problems to avoid → scenarios to guard against → high-quality eval scenarios.** Every anti-pattern's
  failure mode is a ready-made test: *does the system produce this, and does it detect it?* This fills
  the missing-eval hole (#2) for the **third** time from a third direction — after #9 (harness metrics)
  and #8 (the task suite). Eval keeps getting filled from every angle, which by the association-density
  logic of #15 makes it one of the highest-ceiling items in the Foundry.
- **A softened stance is itself a journal entry** — and specifically an **ADR**. "We decided X because
  constraint Y moved" is exactly the ADR form (`docs/adr/`), which is the #16 journal doing its job:
  recording not the new position but *the reasoning that moved it*.

**The tandem hypothesis (Eric's, and it's the strongest claim in this thread):** _"an antipattern 'drift'
doesn't become a positive tradeoff until multiple antipatterns are applied in tandem to cover gaps as a
net positive."_ It holds, and the underlying mechanism generalizes it: **an anti-pattern is a practice
whose characteristic failure mode is *unguarded*.** The "anti" is doing the work of "unguarded." Name the
exposed gap, cover it, and the practice becomes legitimate technique. Worked pairs:
- **Waterfall + rewrite-from-scratch.** Waterfall alone fails on late discovery of wrong requirements;
  rewrite alone fails on lost accumulated bug fixes. But exhaustive upfront *acceptance criteria* are
  precisely what preserve accumulated knowledge through a rewrite. **Each covers the other's fatal flaw**
  — and together they are #12 + #17 already stated as one move.
- **Duplication + reliable machine-wide refactoring.** Duplication's cost was maintenance across N sites;
  guard that and you get duplication's *benefit* (no premature coupling — the `clamp`/NaN lesson) without
  its cost.
- **BDUF + throwaway prototyping.** BDUF fails because you don't know what you want; prototypes fail by
  shipping as production. Prototype to *discover* the requirement, then specify it exhaustively. That is
  the Prototyper→Builder handoff from the archetypes (#3).
- **Gold plating + an aggressive Sweeper.** Over-building accumulates bloat only if nothing deletes;
  pair it with reliable subtraction and over-building becomes cheap *search*.

**And this is Eric's own signature move, generalized.** "Automerge everything" is an anti-pattern
*unguarded* — reckless. Add the test systems, the gates, the ratchet and a rollback path, and it's
gold-tier Renovate. Same shape as this repo's Coach gates enabling auto-merge-by-default. He has been
applying compensating controls to anti-patterns his whole career; this names the general form, which is
what makes it teachable — and it is the sharpest available framing for the archetype case (#3).
_(src: Eric · while: firehosing — "it's possible that an antipattern 'drift' doesn't become a positive
tradeoff until multiple antipatterns are applied in tandem")_

**18. Hoist the harness to its own repository — harness-as-host, repos pulled in as payload.** The
convergence point for #2 (fleet management / portability), #8 (battle of the wits) and #16 (swappable
harnesses). Eric: elevate the "battle of the wits" engineering harness into **its own repo** with fully
automated GitHub pipelines like `skynet-capital`, where **the harness pulls a repository into itself to
perform work** — which is what lets multiple projects be developed in tandem.

**The direction of coupling is the whole design decision, and Eric's instinct is right.**
- **Harness-as-dependency** (each repo installs the harness, the conventional shape) is *precisely where
  configuration drift comes from* — N repos on N versions, the exact concern from #2.
- **Harness-as-host** (his proposal — the harness clones the target, runs coaches against it, opens PRs
  back) makes **drift structurally impossible: there is only one instance to drift from.** Onboarding a
  new repo becomes "point the harness at it" rather than a port. Improvements propagate to every project
  at once instead of stranding in whichever copy got them — that is the compounding that makes "projects
  in tandem" real.

**What hoisting forces, and why the forcing is the point.** The harness is npm/TS-specific today
(`arch-scan`, `dupe-scan`, biome, rstest). Hoisting demands a **capability descriptor** the target repo
declares — how to typecheck, lint, test, build, ship. That is the same forcing function as #9
(portability forces the boundary), #16 (the harness-template interface), and #12 (acceptance criteria as
the autonomy interface): **three separate threads all resolve to "define the interface."** The Jurassic
Park warning from #10 applies literally — lift with gaps and the destination environment fills them
unpredictably, so the descriptor must be explicit rather than inferred.

**Battle of the wits becomes native rather than aspirational.** With repos pulled into one host, running
a fixed task suite against different harness *versions or configurations* is trivial and — critically —
**methodologically sound**: same host, same target, one variable. That is exactly the controlled
experiment #8 said was missing when comparing two unlike repos. Hoisting is what upgrades it from
opinion to evidence.

**Dogfooding is the first eval.** The harness should be its own first customer: if it cannot measurably
improve its own repository, it has no business improving others. A clean, honest gate on the whole idea.

**⚠ Governance boundary — Eric's call, do not self-authorize.** A harness with write access to N
repositories is a **blast-radius multiplier** and needs cross-repo credentials: squarely the irreversible
class in `CLAUDE.md`. Build the mechanism, keep the token grant, the app installation, and the scope
decisions as **one clearly-documented credentialed step handed to Eric**. Worth designing narrow from the
start: per-repo opt-in, least-privilege scopes, PRs only (never direct pushes to `main`), and an explicit
allowlist rather than org-wide access.
_(src: Eric · while: firehosing — "hoist the harness to its own repository… the engineering harness has
the ability to pull a repository into the harness to perform work")_

**19. Adversarial mechanisms — the think tank needs a prosecutor, not just a librarian.** Eric wants
mechanisms that **critically assess ideas, poke holes, and rubber-duck continuation toward bigger ideas**,
explicitly framed as maximizing the constraint. Correct, and urgent — because:

**The honest finding first: this session has a suspicious base rate.** ~21 ideas banked, essentially all
of them *strengthened*; roughly four meaningfully challenged (the Leroy Jenkins inversion, the confounded
two-repo comparison, the article naming no enablement role, the harness credential blast radius). Real
idea distributions contain more duds than that. **A think tank that only amplifies is an echo chamber
with good typography** — and by Eric's own ToC framing, affirmation is cheap while *falsification is the
scarce good*: the highest-value act is killing a bad idea before he spends attention on it.

**Why in-thread critique is structurally compromised.** After twenty turns of building a structure,
Claude is invested in its coherence — critique from inside the thread is biased toward the frame it
helped build. Independence has to be *engineered*, not intended.

**Mechanisms, ranked by how well they buy real independence:**
1. **Context-blind refuters.** Fresh sub-agents given **only the idea**, never the affirming build-up,
   and prompted to **refute** rather than "evaluate" — the verb changes the behavior. Run several, take a
   majority. Critique is a *non-constraint* resource: run it freely, exactly like machine iterations.
2. **Perspective-diverse critics beat N identical skeptics** — redundant skeptics miss the same things.
   Distinct lenses: cost-to-build · what-does-this-replace · who-maintains-this-in-six-months ·
   what's-the-simplest-thing-that-would-work-instead · how-would-this-fail-silently.
3. **The persona lenses (#7) already are this roster.** A Sweeper aimed at an *idea* asks "what does this
   let us delete, and is it worth its own maintenance?" — a native hole-poker. #7 is not only for code.
4. **Falsification criteria at capture.** Every idea gets a *"this is wrong if ___"* line. Ideas that
   cannot produce one are unfalsifiable — which is itself the finding. EARS discipline (#12) applied to
   ideas rather than features.
5. **Pre-mortem** — assume it shipped and failed; explain why. Cheap, effective, catches optimism.
6. **A floor sensor to pair with the ceiling sensor.** Association density measures *upside only*.
   Nothing currently measures build cost, carrying cost, or risk class — so a dense-but-expensive idea
   and a dense-but-cheap one rank identically today. The refinement pass should compute both.
7. **Distinguish critique from continuation.** Eric asked for two different things: a **critic**
   ("where does this break?") and an **extrapolator** ("and therefore what?" — pushing an idea to its
   logical end until it either breaks or reaches something bigger). Different roles, different prompts;
   the rubber-duck function is the second one.

**The design change that matters most: the refinement pass should ship every idea with its strongest
objection attached.** Today's planned output (#15) is a ranked hand — a *sales* document. Ranked-hand-
plus-attached-objection is a *decision* document, and it maximizes the constraint precisely: Eric's
attention lands on a judgment that already has both sides, instead of on discovering the downside himself.

**Postscript — the saturation signal fired from the human, not the system.** Eric read the critique turn
as the system steering him at diminishing returns. Half right, and the other half is the finding: there
is **no saturation detector** — the critique ran because *he asked for it*. `CLAUDE.md` already requires
signalling saturation proactively ("we've largely saturated this; build a slice or push somewhere new?"),
and that did not happen; the trigger stayed on the constraint, which is the exact failure mode this whole
document is about. The corroborating evidence was visible and unremarked: the last several entries were
increasingly **ideas about the idea system** (#19 is an idea about assessing ideas), and self-reference is
the classic sign a vein is mined out. Cheap fix, consistent with #15a2 — the refinement pass should report
*novelty* alongside density, and recursion depth is a usable proxy.
_(src: Eric · while: firehosing — "refining mechanisms that are highly capable to assess my ideas
critically, poke holes... feels worthwhile in maximizing the constraint")_

**20. The one-shot — a self-replicating bootstrap for the whole system.** A skill (or equivalent) that is
a **living document able to replicate the complicated system/configuration setup we've built**:
`CLAUDE.md`, `.claude/` skills and agents, `settings.json` hooks, the gate scripts, the CI workflows, the
doc spine. Run it once against a fresh repo and get the operating model.

**Why it's the highest-value *verifiable* item in the Foundry.** Portability is claimed in three places —
#2 (lift-and-shift), #9 (portability **is** comparability), #18 (hoist the harness) — and **none of them
can be checked today.** A one-shot that executes into an empty repo and yields a working system is the
**proof** that the model is portable rather than merely described as portable. It is also the cheapest of
the big items, and a strong portfolio artifact for the archetype case (#3): "a system that replicates
itself" is an automation engineer's calling card.

**The design fork that decides whether it rots:**
- **Generated (recommended)** — a script reads the live repo and *emits* the bootstrap, so it cannot drift
  from what it describes.
- **Prescriptive** — the document is the source of truth and the repo is generated from it. Zero drift by
  construction, but a large up-front inversion.
- Either way, **the real deliverable is not the document — it's the CI job that runs it into a scratch
  repo and asserts the result.** The DNA test from #10 stated exactly: *can the genome express into a
  working phenotype?* And the Jurassic Park warning applies literally — a partial genome plus
  environmental gap-filling yields something you did not intend. **An untested bootstrap is worse than
  none**, because it carries false confidence. Same shape as gold-tier Renovate for the third time: the
  automation isn't the rule, it's the verification that makes the rule safe.

**⚠ Objections (attached per #19):**
1. **It partially overlaps #18 and they may be substitutes, not complements.** If the harness is hoisted
   as *host*, you point it at a repo instead of installing anything — and the replicator becomes
   redundant for everything the harness carries. Building both without deciding the boundary is
   duplicated machinery. Probable split: the **one-shot bootstraps what must live in-repo** (CLAUDE.md,
   hooks, settings, the doc spine); the **host supplies gates and agents** from outside. That boundary
   needs deciding *before* either is built.
2. **Essential vs. accidental is unsolved.** Much of this repo's config is skynet-specific (Fly deploy,
   brand tokens, the login canvas). A one-shot that copies everything ports the accidents. This is the
   **fourth** independent thread now demanding the same capability descriptor / interface work (#9, #16,
   #18, #20) — which is strong evidence that the interface, not any of the four, is the actual next build.
3. **"Living" is the weakest word in the idea.** Living means maintained, and nothing here is maintained
   automatically today. Unless it is generated *and* CI-verified, it rots within weeks and becomes a
   README that no longer works.
_(src: Eric · while: firehosing — "a living document that has the capability to easily replicate the
complicated system/configuration setup we've built")_

**20a. Scope correction — the one-shot must carry the _plumbing_, not just the drills.** Eric:
*"tooling and process choices like semantic release, commitlint and all the other plumbing should be
dropped in as part of the one shot."* Correct, and it names a gap the first build left open: the
`battle-of-the-wits` plugins ship **drills and gates**, while the process plumbing — the pipeline
workflow, `commitlint.config.js`, `.releaserc.json`, version sync, the PR template, the lockfile
discipline — exists only as *that repo's own setup*. An adopter installing the plugins today gets the
coaches and then has to hand-roll the pipeline that makes them run. That is the whole value gap.
- **This session is the argument.** Standing up that pipeline cost three red runs — a missing
  lockfile, an `npm test` script that never executed the suite, and a shellcheck warning that fails
  the job. All three are *setup* defects, not project defects, and every future adopter would
  rediscover each one. A drop-in that is **already proven green** deletes that tax permanently. The
  artifact to template is exactly the one now running: `verify` → merge → `release` → v1.0.0.
- **Mechanism: a skill, not a plugin file.** Plugins cannot write into a target repo on install
  (`settings.json` only accepts `agent` / `subagentStatusLine`), so the one-shot has to be an
  invocable drill — `/harness-core:bootstrap` — that writes the plumbing and reports what it wrote.
- **It needs the descriptor to choose a template.** The pipeline is Node/npm-shaped; a Python or Go
  repo needs a different one. That makes this the **fifth** independent thread demanding the
  capability descriptor (#9, #16, #18, #20, #20a) — the interface is now unambiguously the highest-
  leverage build.
- **Being opinionated is the feature, but declare it.** Conventional Commits, semantic-release and
  ratcheting gates are *choices*, not laws — consistent with Foundry #1 ("instructions that reinforce
  strong opinions"). The bootstrap should state plainly what it is imposing and why, so an adopter
  disagrees deliberately rather than discovering it later.
- **⚠ Workflow files are a carve-out.** Writing `.github/workflows/` changes what runs with repo
  credentials, so a bootstrap that touches them stays reviewed, never auto-merged (`CLAUDE.md` →
  merge policy).

**21. A GUI for the harness — and the read/write line that decides whether it's worth building.** Eric
floats a GUI to make options obvious and let a human pick preferences, settings, configurations, and see
what mode the system is in — then objects to his own idea (*"replicating a bunch of behavior feels most
likely like a bad idea due to integration maintenance pitfalls"*) and lands, emphasis-last as usual, on
the real thesis: **"full automation to remove the need for humans to manually change config seems
better."**

**His self-objection is correct and stronger than he stated.** A GUI that *replicates* harness behavior
is a second implementation of the same truth — two sources for what the system does, guaranteed to
diverge. Every harness change becomes a GUI change, so the wrapper taxes the thing it wraps. That is
**configuration drift (#2), his own named enemy, reappearing at the UI layer.** Concretely: Claude Code
already ships `/plugin`, `/context` and `/config`, so a bespoke control panel would partially duplicate
native surfaces — the integration-maintenance pitfall is not hypothetical.

**The distinction he is circling: read surfaces are safe, write surfaces are not.**
- **Read / observability** — current budgets, debt trajectory, what the athletes did, which modality is
  active. **Generated from the system, so it cannot drift**: if it's derived, it's always true. High
  value, near-zero maintenance. (The Foundry constellation artifact is an instance of exactly this.)
- **Write / control** — a second input path for state the system already owns. This is the part that
  rots, and the part he's right to distrust.

**The principle worth adopting outright: every config option is a decision the system failed to make.**
A setting is deferred judgment. If the system can decide from evidence — measured debt, detected
toolchain, observed drift — the setting should not exist. **This is already the harness's proven design:
nobody picks a budget; the ratchet sets it from measurement.** Eric's conclusion is that philosophy
generalized, not a new idea — which is the best argument for it.
- Applied to his own example, **modality should be inferred, not selected.** #16's swap rule already
  says: adopt the harness whose native domain solved the problem you currently have. If the system can
  classify the problem, it can pick the theme; manual selection is the fallback, not the design.

**Where a control surface *is* legitimate — and it's a precise, small set.** The correct scope is
**exactly the decisions that cannot be automated by design: the irreversible class** (credentials, spend,
outward-facing actions). Those are Eric's calls permanently, so surfacing them is not deferred judgment,
it's the residue. A panel that shows *"here is the one credentialed step waiting on you"* is genuinely
useful; a panel of toggles is debt.
- **The one thing automation cannot replace: legibility to someone who didn't build it.** If
  `battle-of-the-wits` is adopted elsewhere, "what is this doing and why" is a real need — but that is
  still a *read* surface, so it reinforces the same conclusion rather than qualifying it.
_(src: Eric · while: reviewing the lifted harness — "full automation to remove the need for humans to
manually change config seems better")_

**22. The doctor/hospital harness — diagnose, then prescribe.** Eric: a system that can **diagnose
problems and prescribe medicines**. A harness theme (#16), and it scores unusually well on the #9
rubric — but the reason to build it is that it **names a hole the current harness actually has**.

**The finding: we have screening and treatment, and no diagnosis step.** Gates emit *symptoms*
(`arch-scan`: this file is 600 lines). Drills apply *treatments* (`/decompose`, `/dedupe`,
`/retro`). Nothing in between asks **"what is actually wrong here?"** — `--candidate` picks a target
straight off a symptom score. And the single misdiagnosis already in `docs/LESSONS.md` is exactly
that missing step: *"The false abstraction — consolidating `clamp` dropped a NaN guard."* The gate
reported a symptom (same symbol, two files), the treatment was applied without a differential, and
the real condition was two *different* functions that happened to share a name. That is a metaphor
identifying a defect we paid for, not a reskin.

**What the vocabulary imports that we lack:**
- **Symptom → differential → diagnosis.** Several conditions produce one symptom: duplication may be
  copy-paste, convergent evolution, or a false positive. Rule out before treating.
- **Iatrogenic harm / _first, do no harm_.** A named category for *the treatment causing the
  disease* — which is precisely what the `clamp` lesson was. The harness has no word for this today.
- **Contraindications.** A treatment that is unsafe given another active condition — don't `/dedupe`
  code the mortician is about to delete. This is the collision problem from coordination (#8) with a
  vocabulary that makes it obvious.
- **Screening vs. diagnostic tests.** Gates are *screening*: cheap, run on everything, tolerate false
  positives. That frames tuning as **sensitivity vs. specificity** — a rigorous way to argue about
  gate thresholds that we currently do by feel.
- **Chronic vs. acute.** An incident is acute (ER → `/retro`); structural debt is chronic (managed,
  never "cured"). Different protocols, and the harness currently treats them identically.
- **Dosage / titration** — one treatment per PR; the ratchet *is* titration. **Prognosis** — will
  this worsen untreated? Prioritize by trajectory, not just current severity. **The chart** —
  `LESSONS.md` is the medical record. **Vitals** — the incident eye is monitoring.

**Where it breaks (name it, per the rubric):** code is not a patient — it can be replaced wholesale,
consent and bodily autonomy have no analogue, and "sick code" can moralize what are ordinary
tradeoffs. Keep it diagnostic, never moral.
_(src: Eric · while: the CI/CD port — "a doctor/hospital system which have the ability to diagnose
problems and prescribe medicines")_

**23. Ingest and index the tooling docs — the research role given a corpus.** Eric: take inventory of
everything Claude offers (features, parts, strategies), **ingest the docs and index them with
Graphify**, so the system can identify *proper* paths for a stated goal rather than deferring to gut
instinct. He frames the trade explicitly: indexing "greatly reduces the tax while squeezing out most
of the value on demand," and compounds into a knowledge-base powerhouse.

**Immediately actionable, not speculative — the corpus is already published for this.**
`https://code.claude.com/docs/llms.txt` is a machine-readable index of **174 pages**, each a direct
`.md` URL with a one-line description. That is an ingestion manifest, purpose-built. No scraping.

**The real prize is _discovery_, not lookup — and that reframes the value.** Doc *access* already
exists (WebFetch). What doesn't exist is knowing **what to reach for**, and you cannot use a feature
you don't know is there. Evidence from this session:
- Eric's flow-state problem was solved by a `UserPromptSubmit` **hook** — surfaced only because
  `settings.json` happened to get read. Nothing would have suggested it.
- Building the plugin marketplace required fetching the docs **twice** mid-task (plugins, then
  plugin-marketplaces) because the manifest schema wasn't known. Each fetch was a stall.
- Worse: Claude **asserted a wrong capability claim** — that session repo-scope was fixed at attach
  time and only a new session could clear the 403. It re-checks per request. That was a statement
  about tooling behavior made without a source, and a corpus is the direct corrective.
This is a **detection-lag** argument (`docs/COACHES.md`): the failure mode isn't slow lookup, it's
*never finding out the feature existed* — invisible and unmeasurable today.

**Objections, attached (per #19):**
1. **Docs rot faster than an index of them.** Claude Code ships fast; a stale snapshot becomes
   *confidently wrong*, which is worse than absent — the same rot argument that sank "living" in #20
   and prescriptive prose in #5. Needs a refresh path (`llms.txt` is diffable, so this is tractable)
   and a visible "indexed as of" stamp.
2. **Graphify on prose ≠ Graphify on code.** Code edges are real (imports, calls); doc edges are
   semantic and fuzzier, so the graph may be far lower-signal than `STRUCTURE-graph.md`. Prove it on
   one slice (hooks + skills + plugins, ~20 pages) before committing to 174.
3. **"All tooling in our ecosystem" is unbounded.** Start with one corpus, measure whether it changes
   a decision, then expand. Otherwise this is a research project wearing a task's clothes.

**Where it docks:** it *is* the **research role** from the original dump (#2) — "reinforce decisions
by data" — with the corpus that makes the role real rather than aspirational. Pure **read surface**
(#21), so it carries none of the control-plane risk. And it makes ceiling-sensing (#15) cheaper:
"has someone already solved this?" becomes a query instead of a guess.
_(src: Eric · while: firehosing after the harness lift — "index it with graphify… over time that
builds up a knowledge base powerhouse")_

**24. Extend the index to the _ecosystem_ — continuous tool selection driven by evals.** Eric: take
#23 beyond first-party docs to **MCP servers and the public skills / instructions / sub-agent
ecosystem**, and with quality evals plus analytics in place, *constantly look for better tooling to
improve solutions* — because **"the cost of changing is cheap."**

**This is the first idea that gives eval a _decision to serve_,** and that matters more than it
sounds. Eval has now been demanded from five directions — harness-native success criteria (#16), the
fixed task suite (#9), anti-pattern failure modes (#17a), probing questions, and now tool selection.
The first four *measure*; this one **acts on the measurement**. A scoreboard nobody trades on rots;
a control loop doesn't. If eval gets built, this should be its first consumer.
- **It is battle-of-the-wits (#9) pointed at tools instead of harnesses:** hold the task suite
  constant, vary the tool, keep the winner. Same methodology, same requirement that the suite be real.
- **The discovery surface already exists** — an MCP registry, `anthropics/claude-plugins-community`,
  and in-session search over plugins/skills. So this is plumbing, not invention.

**⚠ The load-bearing claim — "the cost of changing is cheap" — is the weakest part, and one failure
mode is severe:**
1. **Supply chain is the serious one.** Community MCP servers and plugins execute **with your
   credentials**. "Constantly adopt better tooling" + "changing is cheap" is a mechanism for pulling
   arbitrary third-party code into a system that has cross-repo write (#18). That is squarely the
   irreversible class: adoption must stay a **reviewed, pinned, human-authorized** step — pin to a
   commit SHA, never a moving ref; read what it does before it runs. Cheap to *try* is not cheap to
   *trust*.
2. **Switching cost is not the edit — it is the re-verification and the lost tuning.** A swap
   invalidates accumulated budgets, ignore lists, and prompt phrasing that worked around a quirk.
   That is configuration drift (#2) arriving through the front door.
3. **Churn without hysteresis produces thrash, not compounding.** Swapping on *any* improvement
   oscillates; require a materially better result over a stable margin before moving.

**Where Eric is right, and it is a real asymmetry:** for a solo operator with strong verification,
switching cost genuinely *is* far lower than in a team — no retraining, no coordination, and the
gates make a regression detectable fast. Most orgs err hard in the opposite direction and marry their
tools. The correct posture is his default *with* the supply-chain brake attached.
_(src: Eric · while: firehosing — "if we have quality evals in place to measure… we should be able to
constantly look for better tooling to improve solutions")_

**25. The throughput sequence — rails, then _coordination_, then agents.** Eric's plan: layer safety
rails in the correct order, then add sub-agents to increase throughput, with token budget as the
lever — *"if we have tokens to burn, that directly correlates to the speed and amount of work we can
ship."*

**The correction that changes the order: tokens convert to throughput only until a different
constraint binds, and two bind first.**
1. **Coordination** — Eric's own earlier tangent (#7). Athletes don't share findings, collide on
   files, and re-derive context. Past that point more agents produce conflicts and duplicated work;
   throughput can go **negative**. Adding fuel to a jammed machine burns fuel.
2. **Review capacity** — every athlete PR still consumes the actual constraint for taste and
   architecture. More agents means more PRs means *more* of Eric's attention spent, not less. That is
   the classic ToC trap: optimizing a non-constraint.
So the sequence is **rails → coordination substrate → agents**, not rails → agents.

**Safety rails, in dependency order (the loot table already encodes most of this):**
| # | Rail | State |
|---|---|---|
| 1 | Required check on `main` | ✅ landed |
| 2 | Auto-merge armed at PR-open | ✅ landed |
| 3 | **Frozen budgets** — gates block growth only; without this athletes fight pre-existing debt | ⬜ |
| 4 | **Territory claims** — an athlete may not touch files another is holding | ⬜ (governor's collision check is the seed) |
| 5 | Worktree isolation | ✅ exists |
| 6 | **Blast-radius limits mechanized** — PRs only, never a push to `main`; never workflow files, credentials, or the irreversible class. Doctrine today, must become a gate | ⬜ |
| 7 | **WIP cap + kill switch** — max N concurrent athletes, and a way to stop them all | ⬜ |
| 8 | **Token ceiling per athlete** — a runaway loop must not burn the month | ⬜ |
Rail 8 is the direct answer to the token point: **if tokens are the fuel, a cost ceiling is the fuel
gauge** — a safety rail, not an optimization.

**On token burn and UX, the compounding lever is codification, not restraint.** `docs/COACHES.md`
already says it: a model-in-the-loop procedure costs tokens *every* run; a script is a one-time build
cost then ~free forever. **Spend tokens once to make a task free, rather than spending fewer tokens
per task.** This session is the proof — `harness-bootstrap` collapsed a multi-turn manual setup into
one command, permanently.

**Immediate next build, in order:** (a) freeze `battle-of-the-wits`' own debt — it currently fails
its own dungeon check, and dogfooding is the honest first eval; (b) the coordination substrate;
(c) mechanize the blast-radius limits; only then (d) fan out.
_(src: Eric · while: the dungeon persona work — "sequence the work to layer safety rails in the
correct order, and start adding sub-agents to increase throughput")_

**26. The personas as a _learning_ product.** Eric: the flavors/personas like the Dungeon Crawler are
"delightful and could be a valuable product for learning/educating."

**Why it holds — the pedagogy is already load-bearing, not decorative.** Engineering *process* is
abstract and badly taught: bootcamps teach syntax, almost nobody teaches how a codebase stays alive
over three years. A dungeon crawl makes the three things that are hardest to convey — **sequencing,
prerequisites, and risk** — legible at a glance. And the strongest property is one the harness already
has: **loot is capability, earned by verification.** That teaches "autonomy is earned, not granted"
*through the mechanic* rather than by asserting it. Mechanics that embody the lesson beat prose that
states it, which is the entire difference between a course and a game.
- **It converges with the University metaphor already banked above.** "Degrees gate capability — a
  diploma is a real permission, not a badge" is *exactly* the loot table, one altitude up. Two
  independently-arrived-at ideas describing one mechanic is a strong signal.
- **It fits the existing ethos rather than pivoting from it** — skynet is educational-first already;
  this is the same thesis pointed at a second domain. And it would be the **third** instance of
  Eric's own gold-tier-Renovate pattern: first applied to dependencies, then to a codebase's
  structure, now *taught*.

**⚠ Objections, attached — the first is the serious one:**
1. **This is a second product, and there is one constraint.** `skynet-capital` is unfinished. Two
   products competing for the same attention is the classic split, and the think tank should say so
   rather than cheer. **Strongest form of the idea avoids this entirely:** make it the *teaching
   layer of the harness itself* — an adopter learns the discipline by using it, because the loot
   table explains why the sequence exists. Zero new product surface, already half-built. Extract a
   product later only if it proves valuable in place.
2. **Teaching by metaphor risks cargo-cult understanding** — learners fluent in the vocabulary and
   innocent of the mechanism. That is **metaphor capture** (#9) aimed at a student. Mitigation is
   already in the renderer: always show the real number behind the game element.
3. **Weak willingness-to-pay.** "Learn engineering process" monetizes far worse than "learn to code."
   More plausible as content/marketing, or as a feature inside something else, than standalone.
4. **It is downstream of the harness being good.** Four PRs old, proven in one repo. Productizing an
   unproven thing is premature — the dogfood and portability evidence has to land first.
_(src: Eric · while: reviewing the dungeon plan of attack — "delightful and could be a valuable
product for learning/educating")_

**27. The brand is converging — and it adds a _participants_ dimension.** Eric's taxonomy:
**dungeon-crawler** → **battle of the wits** → **battle bots** ("like battle tanks at Aquent"), with
his emphasis landing, as usual, on the last items: **a collaboration point**, and **personal
references for potential customers**.

**The names are coherent rather than three candidates** — all competitive, gamified, friendly-
adversarial — and they line up with `skynet-capital`'s own core loop (bots racing a leaderboard).
That consistency is itself evidence the brand is real and not being invented.
- **"Battle bots" names a mechanic we already specified.** Battle-of-the-wits (#9) *is* agents and
  systems competing on a held-constant task suite. So the brand converges on the engine rather than
  decorating it — and the competitive framing is what makes it **multi-participant**, which is the
  genuinely new dimension here. Until now every idea assumed an audience of one.
- **Collaboration falls out naturally:** multiple people's harnesses competing on a shared task suite
  is a community mechanic *and* the eval corpus (#24) at the same time. One build, two payoffs.

**⚠ Flag before this goes anywhere outward-facing:** **BattleBots** is a long-running, actively
enforced television/robot-combat trademark. Commercial use of that name — or anything close — is a
real legal exposure, and it is far cheaper to know now than after a logo exists. "Battle of the Wits"
is much safer (a Princess Bride allusion, not a protected mark) and is already the repo name. If the
competitive sub-brand matters, find a phrase that isn't one letter from an enforced mark.

**Open question — Claude cannot assess this one.** *"Battle tanks at Aquent"* is a specific thing
Eric experienced and Claude has no knowledge of it; the collaboration idea rests on what it actually
was (an internal competition? a team event? a product?). **Do not infer it.** Ask before building on
it.

**Standing objections carry over from #26:** naming and go-to-market imply a second product against
one constrained attention, and the harness is six PRs old and proven in one repo. "Personal
references for potential customers" is a go-to-market step — worth banking, premature to act on.
_(src: Eric · while: the doctrine decoupling work — "I think the brand name is emerging, and it adds
a new dimension")_

**28. 3D competency (Three.js + Babylon.js) and a cinematic Skynet Capital intro.** Eric wants real
competency in both engines and **"Blizzard level video cinematic capabilities"** for an intro.

**Neither thread is greenfield — say so before planning as if it were.**
- **Three.js is live:** `src/three/` is ~1,150 lines across `scene-main.ts`, `pieces/{tower,eye}.ts`
  and a `kit/` of pure modules (`profile`, `rng`, `params`, `env`, `materials`, `greebles`), with an
  esbuild `build:scene` step and `scripts/shoot-tower.mjs` as a deterministic screenshot harness.
- **Babylon is scaffolded but unused:** `docs/babylon-mcp.md`, `.mcp.json`, and two setup scripts
  wire a local semantic-search server over Babylon docs/API/source, and idea #2 above already banks
  Babylon as the composable engine for the gameplay layer.

**⚠ The honest read on "Blizzard level", because the gap is a category not a quality slider.**
Blizzard cinematics are **offline-rendered** — Maya/Houdini/RenderMan, path-traced, hundreds of
artist-years per minute. No realtime browser engine reaches that, and no amount of Three/Babylon skill
closes it. Saying otherwise sets up a disappointment.
- **But the thing that reads as "cinematic" is direction, not polygon count** — camera choreography,
  timing, lighting, restraint. A well-directed low-poly shot beats an undirected detailed one, every
  time.
- **The real unlock, and it is available here: an intro does not have to run in realtime.** Render it
  **offline, frame by frame, at high sample counts**, then ship an MP4. That decouples visual ambition
  from the browser's frame budget entirely — the ceiling stops being "what renders at 60fps on a
  laptop" and becomes "what we are willing to wait for." It is also how the reference cinematics are
  actually made.
- **The machinery already exists**: `shoot-tower.mjs` renders the scene headlessly via Playwright and
  captures deterministically. Frame-stepping that harness (advance a fixed dt, capture, repeat) and
  piping to ffmpeg is a straight extension, not a new system — the engineering half is small.

**Where the work actually splits, and it matters for who does it:**
| Half | Nature | Owner |
|---|---|---|
| Offline frame-render → video pipeline | pure engineering, deterministic, testable | Claude |
| Camera choreography, timing, art direction, lore beats | **taste** | Eric (`CLAUDE.md`: visual work waits for his eye) |

**On engine choice — resist picking one on principle.** Three.js is lower-level and already carries
the Eye/tower; Babylon is batteries-included (scene graph, PBR, GUI, glTF, physics, WebGPU) and better
suited to a navigable gameplay scene. Running both is a real cost (two mental models, two asset
pipelines), so it should be a *measured* decision — which is exactly what the battle-of-the-wits
harness (#9) is for: same scene, both engines, compare. Competency-building doubles as the first real
eval.
_(src: Eric · while: the dungeon-map work — "Blizzard level video cinematic capabilities with an
intro to Skynet Capital")_

### The University metaphor — elevate the academy into a full "Skynet University"
Eric likes the university framing; bank it to expand on. The `/learn` academy + risk ladder
(`src/domain/curriculum.ts`, `src/domain/plays.ts`, `RANKS`) is the seed — reframe the whole
learn/experiment/graduate arc as a **university** with a coherent, extensible vocabulary:
- **Majors / faculties** — options fundamentals, the Wheel, directional longs, volatility, risk mgmt;
  each a track with its own 100→400-level courses (the tiers already exist).
- **Degrees gate capability** — graduating a level *unlocks* what a member (or their bot persona) may
  actually trade — the human-side twin of the bot autonomy-readiness eval (ties to the academy
  "graduation → capability" thread already in the inbox). A diploma is a real permission, not a badge.
- **Persona-professors** — the D&D/lore personas (`persona-lore`) teach their specialty (Sauron on
  disciplined order/risk; the Day Trader on momentum) — lore as the faculty, mechanics stay honest.
- **Campus in the empire** — a university building rises in the sim-city cityscape as you matriculate;
  a Living-Universe landmark tying learning to the nation-building metaphor (a natural pairing with the
  founding-reserve / event-ceremony work).
- **Semesters / cohorts / a quad** — friendly, social framing (study groups, co-op) over the friends-
  and-family league; office hours, a syllabus, a transcript (needs the history/persistence layer for a
  real transcript). Keep it celebratory, everyone-graduates-eventually.
_(src: Eric · while: reviewing the founding-reserve / academy engagement work — "I like the university
metaphor, bank it to expand on")_

### Babylon.js as the composable 3D engine for the gameplay layer
As the product heads toward SimCity-of-the-empire / human-vs-bot gameplay, the hand-rolled 2D canvas +
one-off WebGL shaders won't scale to real 3D scenes. **Babylon.js** is the best-in-class
batteries-included option (scene graph, PBR materials, physics, GUI, glTF asset pipeline, WebGPU) for a
composable engine. Evaluate it for the north-star gameplay surface (#41): the empire cityscape as a
navigable 3D scene, personas as entities, plays as scripted set-pieces. Weigh bundle size + the
"self-contained inline / no external host" constraint (login is CSP-inline today; a game view would be
its own route/bundle, so that constraint likely relaxes there). _(src: Eric · while: shipping the WebGL
eye-gaze hero reveal — "the direction we may be headed")_

### Options academy — progression & the in-app play picker (follow-ups to the risk ladder)
The `/learn` academy + `src/domain/plays.ts` risk ladder shipped (PR #178): CCP-first, riskier plays
gated per level. Natural next threads, in priority order:
- **Server-side progression.** Academy graduation is client-side localStorage today. Persist a learner's
  unlocked level per participant so it survives devices and can gate real actions (needs the history/
  persistence backend, or a small per-user KV). _(src: Claude · while: building the options academy)_
- **Gate the play picker against the ladder.** When an in-app play-selection surface exists (and the
  login playbook), hide plays above the learner's unlocked level using `unlockedPlays()` / `isLocked()`
  — "withhold the complex/risky selections until graduated" enforced for real, one source. _(src: Eric ·
  while: know-your-audience progressive disclosure)_
- **Interactive lessons.** Each academy lesson could summon its play on a mini payoff/forecast canvas
  (reuse the login playcall machinery) so learners *see* the shape, not just read it. _(src: Claude ·
  while: building the options academy)_
- **Graduation → capability.** Tie academy level to what a member (or their bot persona) may actually
  trade — the human-side twin of the bot autonomy-readiness eval ladder. _(src: Claude · while: building
  the options academy)_

### North-star epic — the Living Universe (see [`LIVING-UNIVERSE.md`](LIVING-UNIVERSE.md))
The cityscape as a multiplayer, SimCity-like shared world that reflects everyone's trades, bots, and
market events — **potentially _the brand itself_**, the addictive hook. **Fun as the flywheel**
(engagement → legibility/trust → capital → autonomy). Reflects portfolio positions, news, economy, and
politics; domain-themed empires; construction = maturing bets; a judgment axis (good bet vs. hype vs.
legal risk) held to an honest, data-sourced standard. Phased:
- **P1 Landmarks from personas** — personas as skyline structures beyond the Eye (display-only). _(src: Eric)_
- **P2 "Your city"** — logged-in cityscape driven by `ParticipantSnapshot` (positions→towers, P/L→health); needs two-modes (#54) + history layer. _(src: Eric)_
- **P3 Market-event vocabulary** — regimes + macro events → city phenomena (oil shock→smoke/traffic, bull→cranes, bear→fog); matrix tracers as the transition/comms medium. _(src: Eric)_
- **P4 Contributable personas** — users add bot personas that join the universe (plugin behind the persona-lore seam). _(src: Eric)_
- **P5 Full ecosystem** — trades/events continuously animate a world that communicates the league's live state; the instrument panel underwriting autonomous real-money trading. _(src: Eric)_
- **Scale across the four views** — the sim-city grammar renders at different zoom: individual = a city,
  comparison = two cities (commonality + contrast), leaderboard = a region/map, bots-vs-humans = country
  vs country where the *units of measure change* (buildings fall off; GDP/territory/development emerge).
  A per-view rendering spec over the existing routes. _(src: Eric)_

### Living Universe — event ceremonies, the founding & player agency (see [`LIVING-UNIVERSE.md`](LIVING-UNIVERSE.md))
- **The founding + "key to the city" ceremony** — starting/uninvested capital renders as a landmark
  reserve (an empire *about to rise*, scaled to dry powder); crossing the threshold founds the city in
  the member's name, the post-login twin of the login "key to the city" reveal. _(src: Eric · while: sim-city gamification of starting state)_
- **Events as ceremonies (positive-reinforcement bias)** — deploy capital → ground breaks/construction
  begins; take ~20-30% profit on a sizable position → a building tops out; grow + reinvest → a
  hard-to-miss development/upgrade. Wins get the fanfare; losses render honestly but without punishing
  spectacle. **Depends on the history/persistence layer** (transition events can't be read from a
  snapshot). _(src: Eric · while: sim-city gamification of profit/loss)_
- **Bots as the conduit to nation-building** — first-class: a member's own bots are the primary engine
  that grows their empire and climbs the leaderboard; building a better bot *is* building a better
  nation. Elevates Living Universe P4 (contributable personas); trading authority earns up the
  autonomous-contribution trust ladder. _(src: Eric · while: sim-city gamification / user-contributed bots)_
- **Player-customizable cityscapes → a contributor on-ramp (constraint-elevation)** — let players add
  personal touches to their nation's cityscape; that authoring surface is a *bridge* to learning
  AI/Claude development, turning engaged players into direct project contributors. This **elevates the
  binding constraint (Eric's attention)** per ToC — more contributors = more capacity, fewer single
  points of failure. Eric expects token headroom to support it. Governance-gated (contributions ride the
  autonomous-contribution trust ladder). _(src: Eric · while: sim-city gamification / onboarding contributors)_

### Detail scaling — a higher-order dimension (emergent architecture)
- **Barad-dûr: squeeze more juice from the totem** — the Eye is great; the supporting tower now has a
  faithful fortress pass (stepped tiers, buttresses, forge-slits, iron-horn shoulder crown, bigger
  footprint). Reads subtle at its far-left mid-depth placement — candidate to push prominence/footprint
  further, or promote the Eye tower to a foreground hero element. _(src: Eric · while: refining the Eye of Sauron totem)_
- **A higher-order dimension to keep packing detail at scale** — as rich totems accumulate (Barad-dûr,
  per-domain empires, event ceremonies), the current flat login-canvas / skyline structure will stop
  cleanly absorbing them. Expect to need a broader organizing dimension — e.g. zoomable levels-of-detail,
  a district/region hierarchy, or a dedicated "explore your empire" surface — that lets detail nest at
  multiple scales instead of competing for one canvas. This design **emerges organically** as pieces stop
  fitting cleanly; watch for the seams and formalize the dimension when they appear. _(src: Eric · while: refining the Eye totem — foreseeing detail outgrowing one canvas)_
- **Compose the animation board from Lego pieces (scene-graph refactor)** — the login canvas is one
  large `draw*` monolith; as the sim-city gameboard evolves it needs a **composable piece system**: each
  element (a tower, the Eye, a scanner, a playcall panel, a ceremony, a forecast) is a self-contained
  **piece** with a uniform contract (place / size / z-depth / update / draw / reduced-motion), added to
  the board like Lego instead of hand-wired into one function. Unlocks reuse across the four views + the
  login, independent testing per piece, and the levels-of-detail nesting above. The seam is showing now
  (the board is getting crowded). Likely a **layered scene graph** (layers → pieces) with a shared
  transform/camera. Big refactor — sequence deliberately; until then, prefer adding new board work as
  observatory-side pieces rather than growing the login monolith. _(src: Eric · while: evolving the sim-city gameboard — build onto it like Lego)_

### Living Universe — landmarks that level up (see [`LIVING-UNIVERSE.md`](LIVING-UNIVERSE.md))
- **Persona landmark = a character you level up** — a bot's landmark prominence scales with its standing
  **relative to peers** (rank by return/equity/win-rate). Two mixed expressions: the tower itself grows
  more powerful (height/mass/Eye-blaze/beam reach/aura), and/or the district around it clearly thrives
  (brighter windows, construction, tracers). The landmark IS the scoreboard. Rises and falls as
  standings shift. _(src: Eric · while: the Tower of Sauron as a levelable character)_
  - **First real slice (P1):** in the observatory, render each bot-persona's landmark (the Eye for
    Sauron) into its empire skyline, scaled by rank among bots — snapshot-derivable, connects the login
    Eye motif to the live board. Persistent leveling/accretion leans on the history layer. _(src: Claude · while: capturing the leveling mechanic)_
- **The signal read IS the lead bot as a character** — the on-chart signal/assessment reads like a
  Terminator sizing up the situation (HUD target-lock, threat/opportunity appraisal). That "assessment
  voice" is a *character*, the same way the Tower of Sauron is one: make the lead bot a persona that
  visibly does the detect→assess→recommend, with its own signature look/motion. Each nation (1 human +
  ~2 bots) then has ONE bot serving the control-tower role (detect · correct · maintain) — Sauron's Eye
  is that persona's expression; a Terminator-flavoured bot would express the same mechanics differently
  (reticle/scan-line/HUD instead of a gaze/beam). The mechanics are shared; the skin is the persona.
  Ties to the persona-lore seam (#79) and the levelable-landmark mechanic above. _(src: Eric · while: the signal assessment feeling like a Terminator character — a template for per-nation lead bots)_
- **The player's tower is a personalised landmark on a fixed anchor** — the primary player's tower now
  renders at a STABLE central-left position (a reliable render point); that fixed anchor is the canvas for
  per-user personal touches (silhouette, palette, crown, signature motion) so each member's login/board
  feels theirs. The primary player is likely a HUMAN, and human towers may carry their own distinct
  characteristics (vs. the bot Eye/tower) — form TBD. _(src: Eric · while: anchoring the primary tower centrally + per-user personalisation)_

### Play-feedback system — game-combat model for board telemetry (Eric-directed)
The single terminal that narrates one play (and pushed the hero down / can't show many characters) is
the wrong shape. Model it like a **game**: a character invokes a **play** (attack/defense move from its
playbook); the play **resolves** against the market → **HIT** (paid off) / **MISS** (stopped out) /
**LIVE**; feedback = damage/reward (realized P/L), health (equity delta), loot (rank climb). Must handle
**many characters at once** — a log where every bot's actions stack, not one terminal for one play.
- **Foundation shipped:** `play-feedback.ts` — pure `PlayOutcome` model + `renderPlayFeedbackLog`
  (multi-character, HIT/MISS/LIVE badges, damage/reward coloring, honest idle + escaping), tested. A
  composable board piece (Lego direction). _(src: Eric · while: reframing the terminal-input feedback)_
- **Next:** style + wire it into the observatory (a live "playcall feed" showing every bot's actions),
  then bring it to the login (replacing the terminal's role there); add floating combat-text on resolve
  (the "+$420 · HIT" pop) and health/loot deltas. Full system per Eric's game-move framing.

### Governance — Eric's calls (do not build unattended)
- **Formalize the participation agreement / consent** — the shared universe pools members' trades/
  bots/info; that's authorized by the invite-only agreement. Capture the consent language explicitly
  (surfaced at signup / `/welcome`) so the basis for data-sharing is on record. Eric to define the
  wording; low-stakes (paper) but held to a real-cash integrity standard. _(src: Eric · while: clarifying the shared-universe data boundary)_
- **Autonomous GitHub-issue contribution system** — autonomously pick up & act on issues, starting
  narrow (tier 1: additive, display-only persona/landmark integrations) and widening by a progressive-
  trust ladder. Rails-first, mantra **Detect · Correct · Maintain**: brand + Graphify `affected` +
  tests + alignment review gate every change; drift blocks/reverts. Sensitive steps (granting
  autonomy, credentials, **real-money trading**) always Eric's. Framework in `LIVING-UNIVERSE.md`. _(src: Eric)_

### Larger tasks (need dedicated focus)
- **Login terminal drawer + backstory** — convert the canvas play-panel into a terminal-style DOM
  drawer that opens with a preamble/backstory. (tasks #68/#72; canvas→DOM migration; best done live.)
- **Two modes** — intro `/login` = fast preview (gist, gloss details); logged-in = slow, controllable,
  studyable inspection. (task #54)
- **Decoupled playcall drawer** — a left collapsible drawer housing Signal→Play→profit, decoupled from
  the trend chart, carried into the logged-in view; move the playcall recap into it with a connector
  line to its chart position. (tasks #49 + #51-remainder)
- **/add as the character sheet — persona field = character class** — the persona-id input on `/add` is
  really the CLASS slot of a character sheet; redesign the flow around that: bot setup presents the
  roster as selectable class cards (name, thesis, lore line, risk read from its eval report), Human is
  the classless default, and the chosen class's readiness-eval badge shows on the card ("READY 100/100").
  First slice: replace the free-text persona field with a class picker fed from the persona registry +
  PERSONA_LORE + eval reports. The Banker (shipped) is the first character created THROUGH the
  sheet→eval→roster pipeline; its realized income is the honest peg for the tournament prize pot
  (in-app points — no transfers needed). _(src: Eric · while: recognizing the persona field as the character-class slot)_
- **Bot creation as a D&D character-sheet flow** — a guided process that walks a user through standing up
  a bot, leaning into the primary-tower template. Steps: (1) **account setup identical to a human's** —
  reuse the same account flow, no separate path; (2) **build the bot persona / strategy** — a
  character-sheet-style profile builder that defines the strategy it employs (archetype, playbook, risk,
  the tower/landmark skin). Turnaround idea: run persona-building **through GitHub issues** — Claude picks
  up the issue, comments only when it needs user input, and (as trust matures) completes the work and
  closes it (extends the autonomous-issue system below + the persona-lore seam #79). **Hard gate:** this
  hinges on **autonomous bot trades being stable/tested first** — that behaviour is not yet proven, so
  build the creation flow only once autonomy is ready (ties to the north-star pipeline below + Eric's
  irreversible-class calls). _(src: Eric · while: leaning into the primary-tower template — bot onboarding)_
- **Hero-character piece system / skill** — a reusable generator that emits a **high-fidelity primary
  character out of the box** (the caliber of the Barad-dûr tower), configurable as a **board piece**, so
  we can **autonomously create new primary characters from user input** (a persona's character sheet →
  its faithful landmark). Generalises the Sauron work into an archetype template: silhouette + the
  "surrounding area" detail (massif/base/turrets) + crown + a signature **energy/motion** (Sauron =
  fire+electric gaze/beam) + the levelable-landmark hooks + a persona binding. Likely a **Claude skill**
  (documented generation process) that is the visual counterpart to the eval-gated persona flow: the eval
  proves the persona *trades* soundly; this proves it *renders* as a lovable hero. Depends on the **Lego
  pieces scene-graph refactor** (uniform piece contract) and feeds **contributable personas (P4)** +
  bot-creation. Big — needs dedicated focus; Barad-dûr is the first worked example to extract the template
  from. _(src: Eric · while: detailing the Sauron tower — wanting hero fidelity to be systematic + generable)_
- **North-star autonomous pipeline** — recycle the playbook artifact as a systems-level pipeline
  toward autonomous deployment (recognize signal → recommend → trade, with safeguards). (task #41)
- **Lore universe (mixed multiverse)** — give each persona a character card (name, archetype,
  allegiance, one-line legend) surfaced on `/u/:id` and woven into trade narration + cityscape + copy;
  keep the system extensible to adopt others' ideas. Confirm the pantheon direction with Eric before
  broad rollout. (task #79; Sauron + the Eye of Sauron are the first thread.)
  - **Real name + character alias (identity duality).** Real names are ideal for accountability —
    within the invite gate, people should know who represents what (consistent with the consensual
    shared-universe boundary). *On top of that*, the gamification warrants a **character alias** people
    brand their personas with — D&D-style: you create and roleplay a character. So a member carries both:
    their real identity (known to the league) and one or more persona aliases (the character on the
    board/leaderboard/cityscape). The alias is the brand; the real name is the record. Bots already have
    aliases (Sauron, JARVIS); this extends the same to humans' personas. Product decisions for Eric:
    where the real name shows vs. the alias, and whether aliases are per-account or per-bot.
    _(src: Eric · while: gamifying persona identity — real names + D&D-style character aliases)_

### Feedback / engagement
- **Gamify feedback as "side quests"** — the core group skews D&D/gamer, so framing idea-contribution
  as accepting/proposing side quests could organically pique interest. v1 shipped (the `/feedback`
  "idea" kind is now a 🗺️ Side quest). Deeper version: a light quest board — proposed side quests
  visible, upvotable, with playful status (open → accepted → shipped), tied into the lore universe.
  _(src: Eric · while: extending the Claude side-quest idea system)_
- **Timed play events + bounties** — a time-boxed group event where everyone's play is measured over a
  window, with a **bounty** as the prize; adds a fun competitive beat (and pairs with human-vs-own-bot).
  Two constraints to design around: (1) **everyone needs powder to participate** — solve in-app by
  granting a fixed **event stake** (equal starting powder for the event) so entry never depends on a
  member's balance; (2) **funding a real bounty pot** means moving cash between accounts — see the
  Alpaca note below. **Recommended framing:** since the league is **paper**, model the bounty as
  **in-app points / a prize ledger** (no real money movement at all) — sidesteps transfers entirely and
  keeps it low-stakes. A real-cash bounty is a separate, later, governance-gated step.
  - _Alpaca transfer feasibility:_ the normal **Trading API / OAuth** path (individual accounts) has **no
    peer-to-peer transfer** — cash only moves via ACH to an account's **own** linked bank. Moving cash
    **between** accounts (e.g. a "bank"/secondary-bot account funding others) requires the **Broker API**
    "**journal**" endpoints (JNLC cash / JNLS securities) between accounts under one firm — a heavy B2B
    integration (firm onboarding, KYC), not the friends-and-family paper path. And on **paper** accounts
    the cash is simulated, so there's nothing real to journal. ⟹ real-money bounties = live + Broker API
    + Eric's irreversible-class call; the in-app points version needs none of that.
  _(src: Eric · while: brainstorming group engagement — timed events + bounties)_
- **Time-of-day volatility on the login market** — realism enhancement: mornings run hotter (higher
  volatility) than midday; drive the ambient `regimeVol` by a time-of-day curve so the tape breathes like
  a real session. Small, cosmetic; deferred behind the core play work. _(src: Eric · while: calming the playcall candles — market-hours realism)_

### Side quests (surfaced by Claude while working — proposals to prune)
- **Test coverage & quality audit** — the suite (~178) skews to pure logic (personas, reducers, server
  routes, renderers, empire skyline); the login canvas animation + the vision layer are screenshot- or
  docs-verified, not unit-tested (by nature). Audit for *logic* behaviors that lack a test (dashboard
  routes, observatory metrics, reduce/persistence). Balance is the goal: small **single-responsibility**
  tests (one behavior each — avoid long bundled workflows that hide failures and mix altitudes), but not
  so granular it becomes death-by-10,000-cuts. _(src: Eric · while: reviewing the suite size)_
- **Isolated-worktree `node_modules/.bin` is empty** — athletes launched with `isolation: worktree` get a
  checkout whose `node_modules/.bin` lacks the tool shims (biome/tsx), so husky hooks and the two
  subprocess-path specs (`app-version`, `dep-graph`) fail until `node_modules` is symlinked from the
  primary checkout (then removed). Every backfiller hit this and worked around it. Fix: provision the
  worktree's `.bin` at worktree-create so athletes don't each re-solve it. _(src: Claude · while: running feast athletes in isolated worktrees)_
- **`bot-broker` drops `credentials.accessToken`** — `createBotBroker` wires `FetchAlpacaTradingTransport`
  with only `{ baseUrl, apiKey, apiSecret }`, never forwarding `bot.credentials.accessToken`, so an
  OAuth-connected bot ("Connect with Alpaca", Round B) would auth with a blank key/secret instead of its
  Bearer token. Latent today (no OAuth bots yet); real fix before Round B ships. A `.todo` in
  `tests/bots/bot-broker.spec.ts` documents it. _(src: Claude · while: backfilling bot-broker specs)_
- **Empire skyline on the comparison view** — render two empire skylines side by side on `/compare`
  (the "two cities" from the scale ladder: commonality = shared towers, contrast = coal/rail vs.
  solar/silicon silhouettes). Reuses `renderEmpireSkyline`; the next natural P2 slice.
  _(src: Claude · while: building the empire skyline)_
- **Sector map from a data source** — `SECTOR_BY_TICKER` is a curated table; as holdings diversify,
  drive it from a real sector feed (or derive) so any ticker themes correctly. _(src: Claude · while: building the empire skyline)_
- **Refine energy/gold/broad silhouettes** — the non-tech sector shapes are basic; give each the
  exquisite-detail treatment once those sectors actually appear in holdings. _(src: Claude · while: building the empire skyline)_
- **Skyline label collision at high position counts** — ticker labels crowd past ~6 holdings; needs the
  same collision handling as the canvas labels (#47). _(src: Claude · while: building the empire skyline)_
- **Machine-checkable brand cohesion (`brand.json`)** — emit tokens + anchor→node bindings + per-scope
  rules so BCP's *Enforce* step can lint deliverables against the brand automatically (per community
  scope). The deeper half of the BCP × Graphify integration. _(src: Claude · while: running Graphify)_
- **Refactor candidates from the graph** — Graphify flags low-cohesion communities (`MarketContext`,
  `dashboard-data.ts`, `data-source.ts`) as split opportunities. Not urgent; run `affected` first on
  any target. _(src: Claude · while: reading the structural map)_
- **Dead-code sweep from isolated nodes** — 126 weakly-connected nodes flagged; most are config keys
  (noise), but some may be genuinely unused exports. Verify carefully (entry points / test-only aren't
  dead) before removing. _(src: Claude · while: reading the structural map)_
- **Install Graphify as a native `/graphify` skill** — `graphify install --platform claude` would make
  the commands first-class in-session; env is ephemeral so it doesn't persist, but worth it if a
  durable place to store the skill emerges. _(src: Claude · while: exploring Graphify's command surface)_
- **Eye searchlight sweep + drifting embers** — at rest, a slow narrow beam from the Eye scans the
  skyline, and embers drift up from the tower; deepens the lore anchor without stealing focus.
  _(src: Claude · while: making the Eye of Sauron more pronounced)_
- **Tie billboard ticker prices to the real sim market** — the marquee prices are independent seeded
  walks; driving them from the actual sim tape (or the `/pulse` cohort data) would make the city
  cohere with the trend it sits under. _(src: Claude · while: adding ticker billboards)_
- **Reduced-motion "distant flash"** — under `prefers-reduced-motion` the storm never fires lightning
  (rainT never reaches the threshold); render one static distant flash so the frozen frame still reads
  as a storm. _(src: Claude · while: adding the rain + lightning storm)_
- **Verify + polish the 3-bot board** — with Sauron added, sanity-check the leaderboard /
  bots-vs-humans / compare views with three bots (ordering, cohort aggregates, spacing). The offline
  server render got interrupted and was never confirmed. _(src: Claude · while: adding the Sauron persona)_
- **Login canvas frame-budget audit** — the login now stacks rain + weather + Eye + city + beams +
  playcall; a quick perf pass (frame cap, offscreen work, DPR cost) would protect the "lovable" feel
  on weaker devices. _(src: Claude · while: layering cityscape effects)_
- **Persona WATCHING richness parity** — the playcall's WATCHING/fear-greed panel is rich; the six
  older personas have plain one-line theses. A light pass could give each a signature "watches"
  signal, feeding the future lore cards. _(src: Claude · while: adding the Sauron persona)_

### Eric's governance calls (do not build unattended)
- **Feedback triage / auto-fix automation** on the issues the in-app funnel now creates. (task #74)
- **Self-service "request feedback access"** collaborator flow — largely *superseded* by the in-app
  feedback funnel (PR #80); likely closeable. (task #76)
- **History / persistence backend** — append-only equity + realized-P/L history to unlock
  performance-over-time, win rate, and "which plays worked" across the four observatory views (they
  currently ship with honest "coming once we have history" seams).

---

## In progress

_(nothing right now)_

---

## Shipped (recent)

- Nation skylines on `/bots-vs-humans` — each cohort's holdings aggregated by ticker into one country skyline — PR (this)
- Empire thumbnails on the board — a compact skyline per participant card on `/` (region of cities) — PR (this)
- Empire skyline on `/u/:id` — positions → a domain-themed city (Living Universe P2, first slice) — PR (this)
- Persona character cards on `/u/:id` (lore mechanism half of #79) — persona-lore registry threaded
  via `personaId`, the approach Graphify's `path` query pointed to — PR (this)
- Eye of Sauron crowns a left-side empire tower and commands the tractor beam — PR #88, #89
- Sauron persona (the cold order-imposer bot) — PR #87
- Taller RSI oscillator lane — PR #86
- Cityscape: rain + blue-lightning storm — PR #85
- Cityscape: sparse red/amber accents — PR #84
- Cityscape: market-hours lighting — PR #83
- Cityscape: ticker billboards — PR #82
- In-app self-service feedback funnel + setup runbook — PR #80, #81
