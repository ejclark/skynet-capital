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
- **North-star autonomous pipeline** — recycle the playbook artifact as a systems-level pipeline
  toward autonomous deployment (recognize signal → recommend → trade, with safeguards). (task #41)
- **Lore universe (mixed multiverse)** — give each persona a character card (name, archetype,
  allegiance, one-line legend) surfaced on `/u/:id` and woven into trade narration + cityscape + copy;
  keep the system extensible to adopt others' ideas. Confirm the pantheon direction with Eric before
  broad rollout. (task #79; Sauron + the Eye of Sauron are the first thread.)

### Feedback / engagement
- **Gamify feedback as "side quests"** — the core group skews D&D/gamer, so framing idea-contribution
  as accepting/proposing side quests could organically pique interest. v1 shipped (the `/feedback`
  "idea" kind is now a 🗺️ Side quest). Deeper version: a light quest board — proposed side quests
  visible, upvotable, with playful status (open → accepted → shipped), tied into the lore universe.
  _(src: Eric · while: extending the Claude side-quest idea system)_

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
