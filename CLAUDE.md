# Skynet Capital — working notes for Claude

A friends-and-family options **paper-trading** educational app: an animated cinematic `/login`
and a post-login "observatory" where humans and autonomous bot personas race a friendly
leaderboard. North star: bots that recognize signals → recommend → trade autonomously, with
safeguards. Everything is educational and paper-only.

Engineering standards live in [`docs/ENGINEERING.md`](docs/ENGINEERING.md); the docs index is in the
README. This file is about **how we work together**, not the code.

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
- **Lore / narrative is a welcome flavor layer** (D&D roots; Sauron persona) — but it rides *on top
  of* accurate mechanics. A character name deepens a strategy; it never distorts it. Keep the lore
  system extensible (mixed multiverse) so it can adopt others' ideas organically.
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

## Ship loop (quick reference)

- Branch off latest `origin/main` per change; small focused PRs; squash-merge on green.
- Verify before merge: `npm run typecheck`, `npm run lint`, `npm test`, plus a screenshot for visual
  work (`npm run shoot:login`, or an offline server render).
- **Inline login canvas JS lives in a TS template literal — no backticks or `${}` inside it** (a
  recurring TS1005 trap). Honor `prefers-reduced-motion` for anything animated.
- Conventional Commits (lowercase-led). Don't open a PR unless asked — but in autonomous/burn-down
  mode, opening + squash-merging small green PRs is the expected loop.
