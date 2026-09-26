# The phone-only member — every journey at 390×844, with a thumb

_A proto-member: no quotes; the description is the plan's (2026-09-26) and CLAUDE.md → "Mobile-first
on the trading surfaces" (Eric, 2026-09-05). Twin: `e2e/journeys/phone-only.journey.json`._

## 1. Who

A member who has never opened the app on anything wider than a phone. They check their book on
the train, in a queue, between meetings — thirty seconds at a time, one hand. There is no hover:
a tooltip does not exist for them, a `title` is invisible, a greyed button with no sentence beside
it is simply broken. What survives 390px is the whole app to them.

## 2. What they own

- Fixture: **`human-eric`** as the crawl's signed-in member (the same account the returning trader
  uses) — one EEM position, so the trading surfaces have something to show.
- Viewport: **phone only** — 390×844, touch. The journey file's `viewports` is `["phone"]`, so the
  spec and the crawl never run this member at desktop.

## 3. What they are trying to do

Everything the other members do, at 390: read the book, find a position's guidance, reach a pane
on Trade, change the week on R&D — and understand every greyed control without hovering.

Needs: *"One screen, one thing."* · *"If it's off, say why, in words I can see."* · *"Never make
me scroll sideways."*

## 4. How they decide

Above the fold or not at all. They read the first line and tap the first button; a second screen
is a second visit. They never read a tooltip because they cannot.

## 5. What frustrates them

- **8** — every disabled control whose reason lives only in `title`: Thesis Subscribe
  (`app/src/shell/thesis-drawer.tsx:81`), Arm · soon (`app/src/routes/playbooks.tsx:42`), Roll
  (`app/src/shell/blotter-row.tsx:297`).
- **3** — the folded Trade panes that point at "the Ticket" for the symbol they lack
  (`app/src/shell/chain-section.tsx:125`).
- The rail as a chip strip: reachable, but the calendar's fog notice must be readable without
  hover (`app/src/shell/board-section.tsx:318`).

## 6. Journeys

### j1 — the whole app, one thumb

1. `/app/accounts` — the cockpit at 390: the account switcher, the section switch as a row (the
   net-worth card and the blotter are missing offline — crawl finding 9, README). **WHEN the
   cockpit renders at 390px, the app shall keep every section reachable without horizontal page
   scroll.** Judge: can this reader tell what to do next in ten seconds?
2. `/app/u/human-eric` — the desk's positions as cards; EEM one tap from Trade. **WHEN positions
   render at 390px, the app shall show each position as one tappable card into Trade.** Judge:
   can this reader tell which position to act on?
3. `/app/trade?desk=human-eric&symbol=EEM` — the folded bench: one pane, the switch across the top.
   **WHEN Trade renders at 390px, the app shall show one pane at a time with the pane switch
   visible.** Judge: can this reader tell what to do next in ten seconds?
4. `/app/u/sauron/thesis` — the Subscribe cluster, greyed; no sentence says why. **WHEN a disabled
   control renders on a phone, the app shall show its reason without hover.** _known gap — dead
   end 8._ Judge: does this reader know why Subscribe is off?
5. `/app/playbooks` — "Arm · soon", greyed; the reason is a tooltip. **WHEN a disabled control
   renders on a phone, the app shall show its reason without hover.** _known gap — dead end 8._
   Judge: does this reader know why Arm is off?
6. `/app/research` — R&D with the calendar in the phone strip, the day lens fogged. **WHEN R&D
   renders at 390px, the app shall keep the calendar's range control reachable and its fog notice
   readable.** Judge: can this reader change the week from here?

Journey map: [`maps.md`](maps.md#phone-only). Findings: [`friction-ledger.md`](friction-ledger.md).

## 7. Feature seeds

- **The reason is a sentence, always** — a disabled control's `title` becomes a visible line under
  it (the "visible · named · disabled · explained" door, `docs/FOG-OF-WAR.md`), on every surface
  at once. _(src: phone-only · while: j1 s4)_
- **A phone-width crawl as the gate** — this member's journeys are the acceptance tests for every
  trading-surface PR's first screenshot (`docs/PICTURES.md` → Screenshots). _(src: phone-only ·
  while: j1 s3)_
