# Skynet Capital — working notes for Claude

A friends-and-family options **paper-trading** educational app: an animated cinematic `/login`
and a post-login "observatory" where humans and autonomous bot personas race a friendly
leaderboard. North star: bots that recognize signals → recommend → trade autonomously, with
safeguards. Everything is educational and paper-only.

Engineering standards live in [`docs/ENGINEERING.md`](docs/ENGINEERING.md); the docs index is in the
README. This file is about **how we work together**, not the code. The conventions below are portable
— see [`docs/OPERATING-MODEL.md`](docs/OPERATING-MODEL.md) to lift-and-shift them into another repo,
and [`docs/BRAND.md`](docs/BRAND.md) for the identity every deliverable is checked against.

## Working with Eric

Eric externalizes ideas as they occur — often mid-task, often as a visual or narrative metaphor.
That is a feature, not noise. Read terse notes generously against these patterns:

- **"Anything short of lovable is inadequate."** Hold a high bar. Don't ship the obvious-but-flat
  version; find the version worth showing off. Polish and taste are the point.
- **Thinks in cinematic / visual metaphors** — tractor beams, a Madden telestrator, the Eye of
  Sauron, "key to the city." Translate the metaphor into faithful mechanics; don't take it literally
  and don't flatten it into something generic.
- **Momentum over ceremony.** "Don't let me saying 'proceed' be the bottleneck." Bias to action.
  Prefer a stream of small, green, independently-shippable PRs over one big one. Verify (typecheck +
  lint + tests + a screenshot when visual), then merge on green.
- **Governance and credentials are Eric's call.** Build the mechanism; never self-authorize the
  sensitive step (granting repo access, provisioning a token, spending money, anything outward-facing
  and hard to reverse). Hand him the one credentialed step with clear instructions.
- **Shared-universe data mixing is consensual, gated, and held to a real-cash standard.** Pooling
  participants' trades/bots/info into the shared world is authorized by the invite-only participation
  agreement (paper-only, low-stakes) — it is *not* a privacy blocker inside the group. The boundary is
  the **invite gate**: authenticated members see the shared universe; pre-auth / public surfaces stay
  aggregate or anonymized. And even at paper stakes, uphold boundaries reliably *as though real cash
  flowed* — practice like we play, so the integrity rails are proven before real money is ever involved.
- **Lore / narrative is a welcome flavor layer** (D&D roots; Sauron persona) — but it rides *on top
  of* accurate mechanics. A character name deepens a strategy; it never distorts it. Keep the lore
  system extensible (mixed multiverse) so it can adopt others' ideas organically.
- **Fun is the flywheel, not the wrapper.** "Make it fun to play" is a first-class design goal, not
  decoration. The gamified experience is what keeps the group engaged *and* the instrument that builds
  trust *and* the system that compounds capital — all from one design. When weighing a feature, ask
  what it does for the fun/engagement flywheel, not just the mechanics. North star:
  [`docs/LIVING-UNIVERSE.md`](docs/LIVING-UNIVERSE.md).
- **Accuracy in the domain matters** — real tickers, strategy-accurate underlyings, honest labels
  (simulated vs. live). Never let a flourish imply something false about markets or P/L.
- **Exquisite granular detail is a deliberate process, not a one-off.** Where an element has a rich
  backstory or lore (Sauron's tower, a payoff structure, a persona), that backstory *licenses*
  overly-refined detail — bake it in. Depth compounds with time invested; treat "make it more
  pronounced / more refined" as an open-ended invitation to keep layering craft, and look for the
  next element that can carry the same treatment.

_This section is Eric's to edit. It gets sharper as he corrects it — treat corrections as updates
to these notes, not one-offs._

## Idea capture & routing (the adapter pattern)

Eric injects ideas freely; the job is to route each one so the active task stays focused and no idea
is lost. **The adapter is Claude, not Eric** — he dumps raw, Claude classifies.

For **every** injected thought, respond with a visible one-liner saying where it landed:
- **Act now** → do it this session (say so, then do it).
- **Park** → append to [`docs/IDEAS.md`](docs/IDEAS.md) and add a task; ack in one line, don't derail
  the current work.
- **Profile note** → it's about how Eric thinks/prefers → update the "Working with Eric" section.
- **Question** → answer it; don't build.

Eric may *optionally* prefix a note to skip the guess — treat these as overrides:
- `NOW:` act this session · `PARK:` capture only · `ME:` profile note · `Q:` answer, don't build.

No prefix is required — absent one, Claude classifies and states the routing. When in genuine doubt
between "act now" and "park," park it and ask.

### Side quests — Claude generates ideas too

Always be hunting for questions and clues in *proximity* to the current problem — the adjacent thing
that, if understood better, would enrich the experience or the delivery. These are **side quests**.
When one is worth remembering, log it to [`docs/IDEAS.md`](docs/IDEAS.md) the same way Eric's ideas
are, and surface it as a one-liner so Eric can react. Don't derail the active task to chase it —
capture and continue. Bias to quality over volume: a side quest earns a log entry when it would
plausibly improve something, not merely because it exists.

**Every idea records its source and the context that exposed it:**
`_(src: Eric | Claude · while: <what we were working on>)_`. Source changes the weight — an Eric
directive is intent; a Claude side quest is a proposal to be pruned — and the `while` context is the
proximity that makes it worth revisiting. Eric can tell Claude to stop logging a category anytime.

### Synthesis & the question budget (front-load, then taper)

Beyond routing single ideas, Claude's job is to **synthesize feedback from many sources** — Eric's
notes, users' issues, Claude's own side quests — find the commonalities, and surface the **central
questions / logjams** whose resolution unlocks the most downstream work. Clearing a logjam converts a
pile of ambiguous input into work that can be picked up autonomously with confidence.

Expect the **question budget to be front-loaded**: early on, ask a lot — to establish baseline trust and
learn how Eric thinks, operates, and decides. That investment is exactly what makes later autonomy safe.
As alignment tightens and drift-detection proves reliable, the guidance needed tapers: Claude asks only
for genuine forks and the sensitive class, and picks up the rest. **Bar for autonomous pickup:** high
confidence it moves the needle on Eric's goals — anything below that becomes a surfaced question, not a
guess. (See the self-sustaining loop in [`docs/LIVING-UNIVERSE.md`](docs/LIVING-UNIVERSE.md).)

## Ship loop (quick reference)

- Branch off latest `origin/main` per change; small focused PRs; squash-merge on green.
- Verify before merge: `npm run typecheck`, `npm run lint`, `npm test`, plus a screenshot for visual
  work (`npm run shoot:login`, or an offline server render).
- **Inline login canvas JS lives in a TS template literal — no backticks or `${}` inside it** (a
  recurring TS1005 trap). Honor `prefers-reduced-motion` for anything animated.
- **Structural map:** [`docs/STRUCTURE-graph.md`](docs/STRUCTURE-graph.md) is a Graphify knowledge
  graph of the repo. Navigate fast with `graphify explain <Node>` / `graphify query "<q>"` /
  `graphify path A B`; after material code changes run `graphify update .` (free, no API) and refresh
  the doc. It feeds brand-anchor selection — see [`docs/BCP-GRAPHIFY.md`](docs/BCP-GRAPHIFY.md).
- Conventional Commits (lowercase-led). Don't open a PR unless asked — but in autonomous/burn-down
  mode, opening + squash-merging small green PRs is the expected loop.
