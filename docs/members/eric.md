# Eric — the owner

_Built only from his recorded words (quoted, dated) and the fixture. Every other sentence is a
guess and says so: `hypothesis — proves it wrong: <a dated, observable event>`. This file is his to
edit (README → "How a member edits their own file"). Twin: `e2e/journeys/eric.journey.json`._

## 1. Who

The owner of the app and its only standing reviewer; a paper trader who wants the app to tell him
what to do with his book, not just show it. In his words (2026-09-26): *"I need to guidance on what
trades to execute, how to rebalance my portfolio, when to take profit, when to wait to enter the
market, etc. Knowing my persona provides you more creative thought on features that help me through
my journeys."* And on why this file exists at all: *"I also want a persona for me to better
understand the journeys, how I think, my needs, etc."*

- _hypothesis — he enjoys side quests: the proximity hunt is a standing ask of his (CLAUDE.md →
  "Side quests — Claude generates ideas too", and the brain-dump rule's "explicit invitation for
  side quests", 2026-09-06), so a surface that offers the next adjacent thing keeps him longer than
  one that ends. Proves it wrong: a dated note from him that a suggested detour on a member surface
  was noise._

What is known, not guessed: he is red/green colourblind (2026-09-06: *"I have mild red/green
colorblindness. Higher contrast colors make it easier for me to detect these details"* —
`docs/BRAND.md` → Accessibility); he reviews on his phone while travelling (`docs/LESSONS.md`,
2026-09-04 — five approval taps from a phone); he judges shipped visuals on the live route
(2026-08-16: *"faster for me to just review the changes in the preview on desktop mode or live in
the browser and adapt from there"*); he wants pictures before prose (2026-08-20: *"dumb this shit
down and draw more pictures... I want some god damn pictures to hang on the fridge"*).

- _hypothesis — he reads a page's left edge first and decides in seconds whether it is for him
  (he asks for numbered procedures executable "by scanning the left edge alone", CLAUDE.md
  2026-08-15). Proves it wrong: a live review after 2026-09-26 where he reacts first to something
  in the right column or below the fold._
- _hypothesis — a page that makes him choose a mechanism (a strategy name, a chart setting) loses
  him; a page that shows him two rendered outcomes keeps him (CLAUDE.md → "Eric directs by
  outcome, not by technique"). Proves it wrong: a dated request from him for a specific technique
  setting on a member surface._

## 2. What he owns

- Fixture participant **`human-eric`** — `fixtures/offline/participants.json`: display name
  "Eric", kind human, timezone **America/Chicago**, account `sim-eric` / **SIM-HUMAN-ERIC**, cash
  $61,200.00 of $102,300.00 portfolio value, status ACTIVE, **one position: EEM** (shares).
- The crawl signs in as `crawl@example.test`, linked to `human-eric` by
  `scripts/crawl/fixtures/owner-links.json` (the same owner-link shape the volume uses).
- Rungs: whatever the offline fixture's fills earn — the ladder is read from the server, never
  assumed here. Devices: a phone (travelling) and a desktop (live review).
- Owner tier: `SKYNET_ALLOWED_EMAILS` (`src/server/auth/resolve-auth.ts:14`) — he can invite; the
  governance and credential steps are his (CLAUDE.md → Hard boundaries).

## 3. What he is trying to do

Ranked, in his words (2026-09-26): **what trades to execute · how to rebalance my portfolio · when
to take profit · when to wait to enter the market.** Four decisions on the whole book, not on one
position. Read together they are one need — **decision guidance at book level** — of which the app
today has only the per-position half (`src/options/position-guidance.ts`: "one pure function from a
member's stake plus the live-checked market inputs to the fixed-order template").

Beneath the trading need, the design need he named the same day: *"a key part of the value add is
to gain the screen real estate on the left to elevate design to something way more engaging, fun,
and ultimately useful."* And the conduit he sees for the "when", in two messages the same day: *"The calendar widget is a
good conduit to have a lot of information within reach but be highly efficient on screen real
estate."* Then: *"Where my head goes with reach and design.. this can serve multiple purposes.. the
calendar to have a glance at what events are happening in various time frames.. which can help
influence playbooks to consider, strategies to try, decisions to execute."*

## 4. How he decides

- **By outcome, with his eyes.** *"My gut tells me we can get rid of the left navigation on all
  non-settings pages with better designs. Higher fidelity designs help carry the wow factor to
  engage people's interest"* (2026-09-26). He states the outcome and a first guess at the mechanism;
  the mechanism is on trial, the outcome is not (CLAUDE.md → Interrogate before you comply).
- **IA first, then lift, then tighten** (2026-09-26): *"figure out the information architecture
  first. the tighter we can group information through organized data structures.. the more this
  elegance will come out in our designs. iterate to find details that link information together
  through wargaming scenarios until diminishing returns take over. lift and shift sections when
  grouping. It's easier to iterate when all the right pieces are present than to mentally juggle all
  the pieces in your head to get a perfect design up front. Favor simplicity first, then break all
  the problems down to fit everything together in a tighter design."* (His numbered list — 1, its
  sub-item, 2 — run together here with the numbers dropped.)
- **Defers a thin fork until data erodes it** (2026-09-07): *"I tend to defer these decisions.
  Completing other known work consistently provides extra insights that result in strong enough
  data points to make an informed decision; the fork erodes into a clear/linear path."*
- **Wants freshness stated** (2026-09-25, on guidance): *"a sanity/pulse check against live
  information sources to ensure we're not acting on cached/stale information."*
- **Reads first:** the picture, the standing, what needs him. **Skips:** a wall of text, a menu of
  coined names (2026-09-25: *"another cute word you keep using that i've told you to stop because
  it's confusing"*), a mechanism he would have to arbitrate.
- _hypothesis — on a phone he reads only what is above the fold of the first screen and acts on at
  most one thing. Proves it wrong: a phone-session reaction after 2026-09-26 that cites something
  two screens down._
- _hypothesis — a "wait" call satisfies him only when it names the date it reopens; an open-ended
  wait reads as the app having no opinion. Proves it wrong: him accepting an undated "wait" on the
  live route without asking when._

## 5. What frustrates him

The dead ends he would hit on his own book today (numbers from README → "The eight dead ends"):

- **6** — Trade's "← Back to account" goes to the desk, not the cockpit he came from
  (`app/src/routes/trade.tsx:698`); the cockpit never links his own desk.
- **9 (found by run 0; fixed)** — on the offline fixture `/api/accounts/networth` answered 500
  (`h.equity.forEach`, `src/server/networth-api-routes.ts`) and the whole Overview — standing,
  the money strip, the positions blotter — became "Net worth is unreachable right now."; one
  failed feed blanked the page his Monday read starts on. Root cause: the fixture transport
  answered `/v2/account/portfolio/history` with the account payload (a prefix match on
  `/v2/account`); it now 404s like every unfixtured endpoint, the route degrades to "—"
  windows, and the step is a passing acceptance test.
- **8** — a docked Trade with no entry to the Chain; a greyed control whose reason is a tooltip
  he cannot hover on a phone (`app/src/shell/thesis-drawer.tsx:81`, `app/src/routes/playbooks.tsx:42`).
- **Not one of the eight, and the one that matters most to him:** every decision surface is
  per position. The "when" (the calendar, `app/src/shell/event-horizon.tsx`) lives only on R&D; the
  split of his money (`app/src/shell/money-strip.tsx`) has no target to be measured against; a
  "wait" (`src/options/position-guidance-rules.ts:231`) has no book-level home and no reopen date;
  "Lock in profit" is a decision-card kind (`app/src/shell/decision-pager.tsx:26`), not a rung
  celebrated beside its explanation.

## 6. Journeys

Each step: `goto` · what he sees · the EARS acceptance line · the judge line. Steps marked
**known gap** cannot be satisfied today; their twin in the JSON is `test.fail()` until fixed.

### j1 — the Monday read

1. `/app/accounts` — the cockpit opens on his account: the switcher, Overview · Activity. **WHEN
   the owner opens Profile, the app shall open his own account's cockpit on Overview.** Judge: can
   this reader tell what to do next in ten seconds?
2. `/app/accounts` — his standing (Net worth · Eric, the value) and the money strip; the return
   windows read "—" on desktop (the offline fixture keeps no history) and the phone shows the
   value's one line. **WHEN the owner opens the cockpit, the app shall show the book's standing
   and what needs a decision above the fold, even when one feed cannot be read.** Judge: can this
   reader tell what to do next in ten seconds?
3. `/app/accounts` — no calendar on the book; the week's events are a tab away. **WHEN the owner
   reads the book on a Monday, the app shall show the week's events that touch the tickers held,
   on the same page.** _known gap — the calendar exists only as R&D's rail control; the date key
   never joins the book. The check is the calendar's own "Week" lens button, exactly — the
   blotter's "Expiring within 3 weeks" view tab is not a calendar._ Judge: does this reader know
   what is happening this week to what they hold?
4. `/app/research` — the calendar, the board's calls, the day lens fogged behind rung 501. **WHEN
   the owner opens R&D, the app shall show the calendar with the current range and the calls in
   it.** Judge: can this reader tell which events matter to their book?

### j2 — take profit or hold

1. `/app/u/human-eric` — the desk's blotter: EEM, Guidance on the row (desktop); the EEM card
   (phone); he taps it. **WHEN the owner asks whether to take profit on a position, the app shall
   offer that position's guidance from the blotter.** Judge: can this reader tell which position to
   act on? _(The cockpit's own blotter is the intended door; today it vanishes with finding 9.)_
2. `/app/trade?desk=human-eric&symbol=EEM&section=guidance` — the Guidance pane for EEM. Offline:
   "No live quote for EEM — nothing to advise on"; live: the lever calls — call · confidence · why ·
   what would change this (`src/options/position-guidance.ts`, specified by
   `tests/options/position-guidance*.spec.ts`, which the crawl cannot reach without a quote).
   **WHEN the owner opens a position's guidance, the app shall open the guidance pane for that
   symbol and say when it cannot advise.** Judge: can this reader tell whether to take profit today?
3. same page — a per-position sheet; nothing says what taking profit here does to the whole book,
   and no win is celebrated. **WHEN a lever call says take profit, the app shall celebrate the rung
   beside the explanation of why it was right.** _known gap — "Lock in profit" is a card kind, not
   a celebrated rung (BRAND: celebration pairs with explanation)._ Judge: does this reader feel the
   win and know why it was earned?

### j3 — rebalance

1. `/app/accounts` — the money strip should be here: shares · options · cash as a bar, each named
   with its amount; offline it is one sentence. **WHEN the owner reads where the money is, the app
   shall show the split as amounts and shares of the whole.** _known gap — crawl finding 9: the
   strip is the net-worth card's bottom row (`app/src/shell/money-strip.tsx:9`) and vanishes with
   the 500._ Judge: can this reader tell what is over- or under-weight?
2. `/app/accounts` — the split, with nothing to compare it to. **WHEN the owner reads the split, the
   app shall show it against a target allocation he set once, and name what to trim or add.**
   _known gap — no target allocation exists anywhere; settings never asks for one._ Judge: can this
   reader tell what to trim or add?

### j4 — wait

1. `/app/trade?desk=human-eric&symbol=EEM&section=guidance` — the Guidance pane; live, a lever
   whose call is Wait, with what would change it. **WHEN a lever's call is wait, the app shall say
   so as a first-class call and name what would change it.** Judge: does this reader know they are
   waiting on purpose?
2. `/app/accounts` — the book; no standing wait, no date that reopens the question. **WHEN the
   owner has decided to wait, the app shall carry the wait on the book with the date that reopens
   it.** _known gap — "wait" is per position only; nothing at book level carries a wait or a
   reopen date, and the calendar's range never reaches /accounts._ Judge: does this reader know
   when to look again?

### j5 — the phone check (every step at 390×844, touch)

1. `/app/accounts` — the switcher, sections as a row. **WHEN the owner opens the cockpit on a
   phone, the app shall show the account and the section switch above the fold.** Judge: can this
   reader tell what to do next in ten seconds?
2. `/app/trade?…&section=guidance` — the Guidance pane alone, the pane switch across the top.
   **WHEN the guidance renders on a phone, the app shall show the pane alone with the pane switch
   visible.** Judge: can this reader tell whether to act, without scrolling?
3. `/app/research` — the calendar in the phone strip, the fog notice beside the day lens. **WHEN
   R&D renders on a phone, the app shall keep the range control and its fog notice visible without
   hover.** Judge: can this reader change the week from here?

Journey map: [`maps.md`](maps.md#eric) (generated by the crawl). Findings: [`friction-ledger.md`](friction-ledger.md).

## 7. Feature seeds

One line each; routed to `docs/IDEAS.md` or a `feedback` issue by the plan's slice 4.

- **A book-level guidance sheet** — aggregate `position-guidance`'s fixed-order template across
  every position: one call sheet for the book (what to execute · trim · take · wait), each call
  with confidence, why and what proves it wrong. _(src: Eric · while: j2 s3)_
- **A target allocation he sets once** (settings: shares / options / cash, or by playbook) that
  rebalance guidance reads and the money strip is drawn against — "what to trim or add" in words.
  _(src: Eric · while: j3 s2)_
- **"Wait" as a first-class call with the date that reopens it** — carried on the book, not only
  in one position's sheet; the reopen date is a day on the calendar. _(src: Eric · while: j4 s2)_
- **Profit-take celebration with its explanation beside it** — the rung, the number, and the
  sentence that says why it was right, in one frame (BRAND: celebration pairs with explanation;
  positive reinforcement never distorts honesty). _(src: Eric · while: j2 s3)_
- **The calendar's range as the "when" for entries** — the week or quarter picked on the calendar
  narrows guidance's entries and "until" lines to that range; a burning day is one that touches a
  ticker held. _(src: Eric · while: j1 s2)_
- **"Since you last looked" at book level** — the guidance tab's own diff line
  (`app/src/shell/guidance-view.tsx:173`) for the whole book, first thing on a Monday. _(src: Eric
  · while: j1 s1)_
- **A phone cockpit that is one decision** — above the fold on 390: standing, the one thing that
  needs him, one button. _(src: Eric · while: j5 s1)_
