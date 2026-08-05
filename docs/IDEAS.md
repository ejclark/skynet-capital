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

### Voice profiles — decode Eric, and a rack of borrowable expert lenses
Full reasoning banked in [`JOURNEYS/voice-profiles.md`](JOURNEYS/voice-profiles.md); this is the
pickup list. Four layers, not one artifact — **stance** (the epistemic contract; when to disagree,
what to do with a bad premise), **decode** (how Eric compresses intent into words), **perception /
expression** (a borrowed register, socketed in per skill), **context** (what is true *here*).
Build order: rack → customer conversations → archetypes → personal profile.
- **Instrument first.** Tag corrections for a week as *misread* vs. *never told you* — that ratio is
  the gating number for the whole thesis and nobody knows it. Check what `duel-log.mjs intent`
  already records before building a second instrument.
- **Stance layer is the cheapest and highest-yield slice** — a dozen dials, written as commander's
  intent rather than orders (*"the end state is that when you say 'this looks good,' I can trust
  it"*), plus a `/stance-audit` that re-reads a transcript with no stake in the original answer.
- **Lens test before building any borrowed voice:** *did this expert face a constraint that forced
  them to solve a representation problem we also have?* Descriptive novelists yes; "expert
  architects" no.
- Every derived rule must carry the utterance that produced it — the audit surface, not documentation.
- Later: a `PersonaLore.voice` field so bot personas speak in-character (deferred — product surface).
_(src: Eric · while: the voice-profile thought experiment — "capture the idiolect and prosody of my
voice")_

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

### The Eye — volumetric rebuild, and the still-open sun/gravity/electric direction
Shipped (PR #265): the Eye rebuilt as a real raymarched volume — the shipped 2D-skin version showed
empty bloom from behind (the tower's own "drag to orbit" invited exactly that view); now a genuine 3D
density field, correct from every angle, with a round-orb body and an almond gaze-aperture blended by
azimuth (a direct correction — the first raymarch pass made the whole body almond-shaped). Two real
bugs found and fixed mid-build (a wrong-root scale miscalculation, a corona system anchored to the
wrong point in space), both banked in `docs/art/EYE.md` so the next piece doesn't repeat them.
- **Still open: "burns like the sun, gravity containing the outward fire, friction generating electric
  charge."** A physically-motivated redesign, not yet built — the sun-like plasma read, a stronger
  contain-vs-escape dynamic at the boundary, and the electric layer reframed as a genuine consequence
  of that shear rather than decoration. Verbal brief only so far (the intended reference video turned
  out to be the wrong file — see below); next pass should run through `render-alchemist` first.
  _(src: Eric · while: reviewing the volumetric Eye — "the scale of 0-100, this is a 95")_
- **Lesson: a reference video was a fidelity benchmark, not content reference** — a screen recording of
  an unrelated AI-video-generator marketing page was shared to point at production polish (atmospheric
  depth, light falloff, grain, motion), not the literal imagery. Cost a round of clarification;
  `render-alchemist`'s loop now leads with distinguishing "fidelity gap" from "content-match" asks
  before spending a research pass on the wrong question. _(src: Claude · while: extracting reference
  frames that showed no Eye content at all)_

### The forge — 3D strategy, the vision register, and follow-ups (see [`3D-STRATEGY.md`](3D-STRATEGY.md))
Shipped on the gamify branch: the 3D deployment playbook (`docs/3D-STRATEGY.md`), the `/vision`
register skill (Pierce Brown-provenance pastiche generalized from `docs/art/EYE.md`; salience-finding
prose compiled into bounded generation prompts — long prose measurably degrades generators), and the
forge roster (`art-director` → `piece-wright` → `set-dresser`: decompose complex 3D models into
small ground-up pieces, one green screenshot-proven rep each; visual output always waits for Eric's
taste). Follow-ups, in leverage order:
- **Compute prominence** — nothing ranks bots 0..1 yet; `projectWorld` takes a caller-supplied map
  (`project.ts:137`). A small observatory-side rank function unlocks live landmark leveling — the
  cheapest slice that makes the tower *real*. _(src: Claude · while: grounding the 3D strategy)_
- **Ceremony-camera slice** — `Animation.CreateAndStartAnimation` on the existing `__towerCamera`
  + `FramingBehavior` + the pipeline's dormant DOF; fires on topping-out/founding ceremonies.
- **Package gaps** — `@babylonjs/loaders` (via `registerBuiltInLoaders` from `/dynamic`) and
  `@babylonjs/gui`, version-matched to core; prerequisites for GLB loading and diegetic labels.
- **First art-director rep** — run the roster end-to-end on one scene ask (e.g. the energy empire's
  reactor) to shake out the build-sheet format before it matters. _(src: Claude · while: designing
  the forge relay)_
_(src: Eric · while: "guidance on 3D gamification strategies" + "prompt like Pierce Brown" + "sub-agents
to decompose complex 3d models")_

### The game layer — rules, renown, and the season loop (see [`THE-GAME.md`](THE-GAME.md))
Full design banked; this is the pickup list. The premise the design solves: with two never-traded
members in a five-person league, a percent-return leaderboard produces one winner and two people who
stop opening the tab. Three moves — **you play your bot, not the market** (the competitive unit is a
persona, which equalizes honestly *and* is the autonomous-trading north star); **two ledgers**
(equity = the untouched truth, **renown** = a per-unit-of-risk score paying for discipline, called-it
theses, degrees, and building bots — so a flat week can still be a great week); and **renown as the
currency you spend on the city** (the truthful layer — towers, health, construction — stays
unpurchasable; the earned layer — campus, landmarks, district styling — is what you build). Loop:
Sunday Council (commit a thesis) → the week runs → Friday Recap → quarterly Season reset with the
city persisting.
- **The one blocker is the history/persistence layer** — renown, ceremonies, seasons and called-it
  all need durable *events*. Flipping the prod sampler on (`SKYNET_HISTORY_DIR=/data/history`) is the
  cheapest unblocking act in the design and is Eric's op (same dependency `GAMEBOARD-PLAN.md` S5
  names). _(src: Claude · while: designing the game layer)_
- **A pure `renown` module** over history + curriculum + trades, same testable pattern as `reduce.ts`.
- **Degrees as permissions** — `PLAY_LEVELS` 1–4 gate what a bot may trade; needs server-side academy
  progression (already in this file). Makes the ladder a real safety rail, not a badge.
- **Thesis capture** — a one-line-per-member-per-week write surface (the Council).
- **Mentor bounty** — renown for helping another member's bot/thesis, so veterans are incentivized to
  want the novices to do well. _(src: Claude · while: designing for the two-novice roster)_
- **Graphics: hybrid, not either/or** — 2.5D isometric for the everyday views, Babylon for hero
  ceremonies (already real in `src/three/`); `WorldState` keeps the choice reversible and per-surface.
  Promote 3D to primary when free-orbit exploration of your own city becomes a core interaction.
- **Eric's forks:** competitive unit (bot-first?) · does renown buy cosmetics? · season length ·
  divisions at five players · mentor bounty worth the complexity?
_(src: Eric · while: "I need to figure out a fun way to gamify the premise of skynet-capital")_

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
- **Doc-rot gate — the highest-severity gap found, and it has evidence not just a hypothesis.** Two
  live instances: `STRUCTURE-graph.md` carries a `"Working with Eric"` node for a heading renamed to
  "How we work", and `persona-lore.ts` says *"Only Sauron carries one today"* while all eight personas
  carry lore. Nothing in the repo checks whether docs still describe reality — `incident-scan` checks
  that incidents produce lessons, not that lessons stay true. A Level-7 self-improving system that
  drifts degrades **silently**, and it poisons the input every future session loads.
  _(src: Claude · while: journey on voice-profiles)_
- **Mutation testing — the one gate that measures whether the other nine work.** Portfolio finding:
  `arch` · `dupe` · `clone` · `dead` · `depgraph` · `spec:gap` · `incident` are seven scanners, all
  **static and structural**; `eval:persona` / `eval:safety` are behavioral but example-based. Deep on
  shape, thin on behavior. Mutation testing is diagnostic rather than additive — delete a condition on
  purpose and see whether anything screams; if nothing does, the suite is decorative and we'd never
  have known. _(src: Claude · while: journey on voice-profiles)_
- **Metamorphic properties on `eval:persona`** — there is no oracle for what trade a persona *should*
  make, but relations hold regardless: *a bearish persona must not increase exposure when sentiment
  drops.* Asserting relations instead of outputs tests behavior we never enumerated, which is exactly
  where the induction gap lives. _(src: Claude · while: journey on voice-profiles)_
- **Differential window on promotions** — when `/dedupe` or `/decompose` consolidates, keep the
  pre-promotion original for N weeks and assert the abstraction agrees with it. Detects a boiled-out
  condition **without knowing in advance what was dropped**, because the two diverge exactly where the
  discarded condition mattered. The missing partner to `dupe:scan`: we detect duplication and prompt
  consolidation, but never verify the consolidation preserved behavior across the cases the copies
  differed on. Pair with a one-line **discard log** beside each promotion (what was dropped and why) —
  detection tells you *that*, the log tells you *why*. _(src: Claude · while: journey on voice-profiles)_
- **Is `OPERATING-MODEL.md` still load-bearing after its promotion?** It is `CLAUDE.md` with the
  Skynet-specific parts boiled out — a promotion already performed, and the live test case for the
  discard problem. Empirically checkable. _(src: Claude · while: journey on voice-profiles)_
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
