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
