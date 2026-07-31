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
