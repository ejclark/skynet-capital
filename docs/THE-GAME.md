# The Game — rules, scoring, and the season loop

_A living design (src: Eric's brief — "find a fun way to gamify the premise"; drafted by Claude).
Sequencing and the flagged forks are Eric's calls. This is the durable home for the **game layer** —
refine it in place._

Three docs, three jobs. [`LIVING-UNIVERSE.md`](LIVING-UNIVERSE.md) says what the world **shows**
(data → skyline). [`GAMEBOARD-PLAN.md`](GAMEBOARD-PLAN.md) says how the board is **built** (the
projection IR, the piece contract, the phasing). This one says what you **play** — the rules, the
scoring, the weekly ritual, and how someone who has never bought a share has a great first week.

## The problem this design exists to solve

The league is five-ish people and **two of them have never traded**. Against that roster, a
percent-return leaderboard is not a game — it is a ranking. It produces one winner, one runner-up,
and two people who quietly stop opening the tab by week three. Churn kills the flywheel before the
telemetry ever earns the trust that unlocks real capital.

So the binding design constraint is not "how do we visualize a portfolio." It is:

> **A novice must be able to have a genuinely great week in week one — honestly, without knowing what
> a call option is — while a veteran still has a real game to win.**

Everything below falls out of that single constraint. Nothing below distorts the truth about money to
get there; the honesty discipline is what makes the win feel earned instead of handed over.

---

## Move 1 — You don't play the market. You play your bot.

**The competitive unit is a persona, not a trade.** What you *do* each week is govern: pick an
archetype, fund it, set its risk appetite, let it run hot or throttle it, take profit, retire it,
build a better one. The bot places the orders.

Why this is the load-bearing move:

- **It equalizes without cheating.** A novice is never asked to stock-pick under time pressure
  against someone who has done it for twenty years. They choose a character from the lore roster, set
  one dial, and a level-1 income play executes. The skill actually being tested — allocation, when to
  let a thesis run, when to cut, when a strategy has stopped working — is *teachable in a season*.
- **It is not a concession; it is the north star.** The endgame is autonomous trading. Every hour
  spent playing this game is an hour spent making the bots better, which is the exact thing that
  eventually trades real money. The game and the product stop being two roadmaps.
- **It makes losing instructive instead of humiliating.** "My bot got chopped up in a range" is a
  systems problem with a fix. "I picked wrong" is a verdict on you. The first one brings people back.

Manual trades stay allowed — some people will want to place them, and forbidding it would be
paternalistic. They score by the same rules (Move 2), so nobody is penalized for either style.

**Existing seam:** `src/bots/bot-registry.ts` + `src/personas/` already bind a persona to a paper
account; `docs/AUTONOMY-READINESS.md` already scores whether a persona is fit to run. The game layer
is a surface over machinery that exists.

## Move 2 — Two ledgers: **Equity** is the truth, **Renown** is the game

One number cannot be both an honest P/L and a fair contest. So run two, side by side, always labeled:

| Ledger | What it is | Rule |
| --- | --- | --- |
| **Equity** | real paper account value, P/L, drawdown | **never distorted, never adjusted, never bought.** The truth about money. |
| **Renown** | the competitive score | earned per unit of **risk taken and process followed**, not per dollar held |

Renown is scored on things a beginner can do on day one and a veteran can never coast on:

- **Risk-adjusted return** — return against drawdown / capital at risk, so a $10k account that
  compounds carefully out-scores a $100k account that got lucky with size once.
- **Discipline** — exited at the stated plan, honored the stop, didn't over-concentrate, took profit
  where the thesis said to. **Pays out in a down week**, which is the whole point.
- **Called it** — a thesis committed *before* the week, scored after. Direction calls need zero
  options vocabulary.
- **Learning** — courses and degrees. `src/domain/curriculum.ts` already emits points and `RANKS`
  (Observer → Apprentice → Wheeler → Options Trader → Strategist); this is that ladder, promoted from
  a client-side badge into the league's scoreboard.
- **Building** — a persona you authored that beats its benchmark, or that other members adopt.
- **Contributing** — a side quest or idea that lands (already a 🗺️ in the feedback funnel).

**Why this stays honest.** Renown does not lie about money — it *scores a different thing*. It says
"you played well," not "you made money," and it shows both numbers next to each other so the two can
visibly disagree: `Equity $10,240 (−1.8%) · Renown 1,180 (+140)` is a legible, true, and genuinely
encouraging week. It also teaches the correct lesson — **process over outcome** — which is precisely
the educational mandate in [`BRAND.md`](BRAND.md), delivered as a scoreboard instead of a lecture.

**Implementation shape:** a pure function over equity history + trade events + curriculum state, same
testable pattern as `src/observatory/reduce.ts`. One place computes renown; the views are dumb.

## Move 3 — Renown is a currency, and the city is what you spend it on

This is the piece the SimCity metaphor is missing today. `LIVING-UNIVERSE.md` describes a city that
**reflects** state beautifully — but SimCity is not a visualization, it is a *building* game, and
building needs a currency that is **not** your P/L. Otherwise the only way to grow your world is to
be up, and the person most in need of a reason to come back has none.

So the city splits into two layers, and the line between them is the honesty rail:

- **The truthful layer — never purchasable.** Towers = positions, height = size, footprint = capital
  committed, health/lighting = P/L, construction = a bet still maturing, storm = volatility. Entirely
  data-derived, exactly as the visual vocabulary already specifies. **No amount of renown buys a
  tower.**
- **The earned layer — bought with renown.** Civic landmarks, the university campus, district
  styling, a persona's monument, the aesthetic of your empire, the reserve's architecture. Expressive
  and cosmetic; it says *how you have played*, not *what you are worth*.

Read together, a city answers two questions at a glance: **how am I doing** (truth) and **how have I
played** (earned). And a novice grinding through a flat quarter still watches their campus rise
because they graduated two courses and called three weeks correctly. They have something to build.

This also gives the "landmarks that level up" idea its economy: a persona's tower still scales with
**standing among peers** (honest, relative, unbuyable), while the *district around it* is where
earned development accrues.

---

## The loop — what a week actually feels like

| When | Ritual | Why it matters |
| --- | --- | --- |
| **Sunday** | **The Council.** Everyone commits one line: a thesis and their bot's stance for the week. Visible inside the gate. | This is where the argument happens — and **the argument is the product**. It costs a beginner nothing ("I think NVDA runs, because…") and it is the input to "called it." |
| **Mon–Fri** | **The world runs.** Bots trade, the city animates, ceremonies fire — ground breaks on a deployment, a building tops out on realized profit. | Ambient, glanceable, no obligation. The push-worthy moment is something happening in *your* city. |
| **Friday** | **The Recap.** Auto-generated per member: what your bot did and why, what it cost or earned, one lesson, renown awarded **with the reason named**. | Closes every loop. Wins get the fanfare; losses get an honest post-mortem and no punishing spectacle. |
| **Quarter** | **The Season.** Renown standings reset; **the city persists**. | New race every quarter so nobody runs away with it in week two — but you keep your empire, which is the emotional contract that makes building worth it. |

Season awards are the trophies already banked in [`BACKLOG.md`](BACKLOG.md) — first to double,
biggest single-day gain, longest green streak — plus the process-side ones this design adds: best
risk-adjusted quarter, most disciplined exit record, best called-it rate, most improved.

## Fairness without dishonesty

Three mechanics, no fake multipliers:

1. **Per-unit-of-risk scoring** (Move 2) does most of the work — account size stops being destiny.
2. **Divisions by degree, not by handicap.** Your division is your academy rank. Everyone appears in
   the open standings *and* in their division, so a beginner can genuinely win something in month
   one without the win being invented for them.
3. **The mentor bounty — the highest-leverage social mechanic here.** Renown for helping someone
   else's thesis or bot: the veterans are now *incentivized to want the novices to do well*. It turns
   a zero-sum ranking into a cooperative league with a scoreboard, which is exactly BRAND's
   "everybody's welcome to win," implemented rather than asserted.

## Education as consequence, not homework

The academy already exists (`src/domain/curriculum.ts`, `src/domain/plays.ts`, `/learn`). The game
layer makes it *matter*:

- **A degree is a permission, not a badge.** `PLAY_LEVELS` 1–4 gate what your bot may actually trade.
  Level 4 — the plays whose loss is uncapped — requires graduating. The ladder becomes a real safety
  rail, and "unlock the next tier" becomes a goal instead of a chore. (Human-side twin of the bot
  autonomy-readiness ladder.)
- **Every ceremony carries a "why" card.** You learn options by watching your own city explain
  itself — the covered call that just paid, the assignment that just happened, in plain language.
- **Persona-professors teach in character** — Sauron on disciplined risk, the Day Trader on momentum.
  Lore is the flavor; the mechanics stay accurate.
- **The novice's first ten minutes:** choose a persona → charter signed → **city founded** (the
  key-to-the-city ceremony) → reserve landmark lights, scaled to their dry powder → their bot writes
  a cash-secured put and **the ground breaks**. Zero jargon required to have a first great moment.

## The graphics question — 2D or 3D

**Recommendation: hybrid, and the repo is already leaning this way.** The reason it isn't a painful
either/or is the seam that already shipped: `src/universe/project.ts` → `WorldState` is a pure,
serializable projection. Renderers are dumb skins over it, so the rendering choice is reversible and
can differ per surface.

- **2.5D isometric (canvas/SVG) for the everyday surfaces** — the four views, the tiles, server-side
  rendering, phones, fast iteration. `GAMEBOARD-PLAN.md`'s verdict stands **for the everyday board**,
  and its reasoning (no asset pipeline on the critical path, hand-authored fidelity) still holds.
- **Babylon for the hero moments** — and this already works: `src/three/` renders Barad-dûr and the
  Eye, with `?power=` / `?health=` as the very leveling dials the observatory will feed from real
  standings. Use 3D as the **ceremony camera**: the founding, a landmark leveling up, the season
  finale flyover of your empire. High fidelity where it lands emotionally, once per week rather than
  on every page load.
- **Why not all-3D now:** it puts an asset pipeline in front of every future feature and taxes the
  constraint (Eric's attention) for a payoff the everyday views don't need.
- **The promotion trigger:** when free-orbit exploration of your own city becomes a *core*
  interaction — i.e. when player-authored cityscapes land — 3D graduates from ceremony camera to
  primary surface. That is a decision to make on evidence, not up front. (ADR-worthy when it happens;
  `GAMEBOARD-PLAN.md` item 1 called out the same revisit triggers.)

---

## What this needs that doesn't exist yet

1. **The history / persistence layer — the one real blocker.** Renown, discipline scoring,
   ceremonies, seasons and called-it all need durable *events*, not snapshots. **Turning the prod
   sampler on is the cheapest unblocking act in the whole design** (`SKYNET_HISTORY_DIR=/data/history`)
   — data starts accruing the day it flips, and every ceremony depends on having history to diff.
   Already flagged in `GAMEBOARD-PLAN.md` S5 as Eric's one op.
2. **A `renown` module** — pure, tested, one source of truth, over history + curriculum + trades.
3. **Thesis capture** — a very small write surface for the Council (one line per member per week).
4. **Server-side academy progression** — already in `IDEAS.md`; required before a degree can gate
   anything real.
5. **Season boundaries** — a start/end record so standings can reset while the city persists.

Ordering note: 1 is the constraint; 2–5 are cheap once it exists. The board work in
`GAMEBOARD-PLAN.md` (S1b → S5) and this game layer converge on the same dependency, which is a good
sign that it is the real one.

## Eric's forks — nothing here proceeds past these

1. **The competitive unit.** Bot-first (recommended), you-trade-first, or both scored identically?
   This is the load-bearing one — everything else assumes bot-first.
2. **Does renown buy cosmetics?** Recommended yes, with the truthful layer strictly unpurchasable. If
   the answer is no, Move 3 collapses back into pure visualization and the "reason to return while
   flat" problem needs a different solution.
3. **Season length** — a quarter is the recommendation (long enough for a thesis to play out, short
   enough that a bad start isn't fatal).
4. **Divisions at five players** — real bracket, or just a label on the open standings?
5. **The mentor bounty** — worth the scoring complexity, or is the group small enough that it happens
   socially anyway?
