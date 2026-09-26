# The returning trader — one account, wants to sell a covered call

_A proto-member: no quotes; the description is the plan's (2026-09-26) and the fixture's. Twin:
`e2e/journeys/returning-trader.journey.json`._

## 1. Who

A member who linked a paper account weeks ago, has a few fills behind them, and comes back on a
Tuesday with one intention: sell a covered call on the shares they hold. They know the words
(strike, expiry, premium) and the house shape of the app (Profile is my book, Trade is where
orders go, Activity is what happened). They do not want to learn anything new today; they want
the path from "my position" to "the order is in" to be four taps and a review.

## 2. What they own

- Fixture: **`human-eric`** as the crawl's signed-in member (`crawl@example.test` linked by
  `scripts/crawl/fixtures/owner-links.json`) — one account, SIM-HUMAN-ERIC, one EEM position
  (shares). The same fixture Eric's own file uses; what differs is the intention, not the book.
- Rungs: whatever the fixture's fills earn. Device: desktop mostly; a phone for the fill check.

## 3. What they are trying to do

1. See the position (Cockpit → Positions).
2. Read its guidance: is a covered call reasonable now, at which strike, until when.
3. Draft the order on Trade, prefilled from the guidance.
4. See the fill on Activity.
5. Get back to where they started.

Needs: *"Take me from the row to the ticket."* · *"Tell me the strike and why."* · *"Put me back
on my book when I'm done."*

## 4. How they decide

By the guidance's call line and its confidence; they read "what would change this" second and the
assumptions never. They skip the chart. They trust a prefilled ticket and distrust a blank one.

## 5. What frustrates them

- **6** — Trade's "← Back to account" goes to the desk `/u/:id`, not the cockpit they came from
  (`app/src/routes/trade.tsx:698`); the desk rail only ever says "← Leaderboard"
  (`app/src/shell/desk-rail.tsx:78`); `/accounts` never links their own desk.
- **9 (found by run 0; fixed)** — `/api/accounts/networth` answered 500 on the offline fixture
  (`h.equity.forEach`, `src/server/networth-api-routes.ts`, when the history read carried no
  equity series); the Overview said "Net worth is unreachable right now." and the positions
  blotter vanished with it — one failed feed blanked the whole page. Root cause: the fixture
  transport answered `/v2/account/portfolio/history` with the account payload; it now 404s and
  the route degrades to "—" windows with the blotter intact.
- **8** — a docked Trade has no entry to the standalone Chain (`app/src/routes/trade.tsx:113` lists
  it; the docked bench never renders the switch).
- **3** — on a phone, the Chain pane says "Pick a symbol on the Ticket…" with no input of its own
  (`app/src/shell/chain-section.tsx:125`).
- **7** — two "Playbooks": the Profile chapter with a disabled Arm (`app/src/routes/playbooks.tsx:41`)
  and R&D's subscribe-able store (`app/src/shell/playbooks-section.tsx:84`).

## 6. Journeys

### j1 — sell a covered call on a position I hold

1. `/app/accounts` — the cockpit: the account switcher, Overview · Activity. **WHEN a member with
   one linked account opens Profile, the app shall open that account's cockpit on Overview.**
   Judge: can this reader tell what to do next in ten seconds?
2. `/app/accounts` — the Overview: net worth, then the positions blotter — EEM, Guidance on
   the row (desktop). **WHEN the member opens Overview, the app shall show the held positions
   with a way into each one's guidance, even when net worth cannot be read.** On a phone the
   blotter is one card per position and EEM's card is the way in — it opens the position on
   Trade, where Guidance is a tab (`s2-phone`). Judge: can this reader tell which position to
   act on?
3. `/app/u/human-eric` — the desk's blotter: EEM, Guidance on the row (desktop); the EEM card
   (phone); they click it. **WHEN the member opens their desk, the app shall show each held
   position with a way into its guidance.** Judge: can this reader tell which position to act on?
4. `/app/trade?desk=human-eric&symbol=EEM&section=guidance` — Trade, EEM prefilled, the Guidance
   pane (offline: "No live quote for EEM — nothing to advise on"; the lever calls need a live quote
   and are specified by `tests/options/position-guidance*.spec.ts`, not by the crawl). **WHEN the
   member follows a position into Trade, the app shall open Trade with that symbol and its
   guidance pane.** Judge: can this reader tell whether to sell the call today?
5. `/app/trade?desk=human-eric&symbol=EEM` — "← Back to account" points at the desk. **WHEN the
   member wants to return from Trade to their book, the app shall link back to the cockpit they
   came from.** _known gap — dead end 6._ Judge: does the reader land where they started?
6. desktop only — the docked bench, no Chain entry. **WHEN Trade is docked at desktop width, the
   app shall offer an entry to the standalone options chain.** _known gap — dead end 8._ Judge: can
   the reader find the chain from here?

### j2 — the fill on Activity

1. phone only — `/app/trade?desk=human-eric&section=chain` — "Pick a symbol on the Ticket to browse
   its options chain." **WHEN a pane needs a symbol it does not have, the app shall offer the
   symbol input in that pane.** _known gap — dead end 3._ Judge: can this reader tell what to do
   next in ten seconds?
2. `/app/activity` — the feed. **WHEN the member opens Activity, the app shall show the feed with
   the newest event first.** Judge: can the reader find today's fill?

### j3 — my own desk, and back

1. `/app/accounts` — nothing links the desk page for this same account. **WHEN the member is on
   their cockpit, the app shall link the other view of the same account (the desk) or fold it in.**
   _known gap — dead end 6._ Judge: does the reader know there are two pages for one account?
2. `/app/u/human-eric` — the desk; the rail's only way out is "← Leaderboard". **WHEN the member is
   on their own desk, the app shall link back to their cockpit.** _known gap — dead end 6._ Judge:
   does the reader land where they started?

### j4 — playbooks, twice

1. `/app/playbooks` — "Prove the play by hand, then arm it", Arm · soon disabled. **WHEN the member
   opens the Profile's Playbooks chapter, the app shall relate it to the Playbook Store (one
   playbook system, not two).** _known gap — dead end 7._ Judge: does the reader know which
   Playbooks this is?
2. `/app/research?section=playbooks` — the store, "Subscribe as" in the rail. **WHEN the member
   opens R&D → Playbooks, the app shall show the store with a subscribe-as account picker.** Judge:
   does the reader know which Playbooks this is?

Journey map: [`maps.md`](maps.md#returning-trader). Findings: [`friction-ledger.md`](friction-ledger.md).

## 7. Feature seeds

- **One "back" that remembers** — Trade's back link returns to the page the member arrived from
  (cockpit or desk), never a fixed route. _(src: returning-trader · while: j1 s4)_
- **The symbol input travels with the pane** — Chain, Chart and Guidance each carry the symbol
  field when they have no symbol, instead of pointing at the Ticket. _(src: returning-trader ·
  while: j2 s1)_
- **One Playbooks** — the Profile chapter and the R&D store are one surface with two states (prove
  by hand · subscribe). _(src: returning-trader · while: j4 s1)_
