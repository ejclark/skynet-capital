# The returning trader — one account, wants to sell a covered call

_A proto-member grounded in one real member's production counts (#8161 comment 7120379211,
2026-11-23): counts and dates only, no name, words or message text. The shape is the plan's
(2026-09-26) and the fixture's. Twin: `e2e/journeys/returning-trader.journey.json`._

## 1. Who

A member who traded paper stocks for about six weeks after joining: dozens of trades across about
a dozen names, mostly shares. They sent the app several wishes in their first month and none
since, then stopped trading with every position still open. The account kept moving without them
and now sits below its high. They are back now after weeks away, on a Tuesday: first to see what
happened while they were gone, then to do one thing with it: sell a covered call on shares they hold. They know the words
(strike, expiry, premium) and the house shape of the app (Profile is my book, Trade is where
orders go, Activity is what happened). They do not want to learn anything new today; they want
the path from "my position" to "the order is in" to be four taps and a review.

## 2. What they own

- Fixture: **`human-eric`** as the crawl's signed-in member (`crawl@example.test` linked by
  `scripts/crawl/fixtures/owner-links.json`) — one account, SIM-HUMAN-ERIC, one EEM position
  (shares). The same fixture Eric's own file uses; what differs is the intention, not the book.
- Rungs: whatever the fixture's fills earn. Device: desktop mostly; a phone for the fill check.
- The real member (#8161 comment 7120379211): joined 08-25, 62 paper trades across 12 symbols,
  mostly stock, the last on 10-05; 6 filings, all in August; still holds those positions, down
  about 12% from the account's peak. The fixture holds one EEM position where the real member
  holds positions from about twelve names.

## 3. What they are trying to do

1. See what each holding did while they were away.
2. See the position (Cockpit → Positions).
3. Read its guidance: is a covered call reasonable now, at which strike, until when.
4. Draft the order on Trade, prefilled from the guidance.
5. See the fill on Activity.
6. Get back to where they started.

Needs: *"What did my holdings do while I was gone?"* · *"Take me from the row to the ticket."* ·
*"Tell me the strike and why."* · *"Put me back on my book when I'm done."*

## 4. How they decide

By their own book first: which holdings moved while they were gone, and by how much, in dollars.
Then by the guidance's call line and its confidence; they read "what would change this" second and the
assumptions never. They skip the chart. They trust a prefilled ticket and distrust a blank one.

## 5. What frustrates them

- **6 (fixed, #3807 slices 2a + 2b + 2d + 2e)** — Trade's "← Back to account" and the rail's
  "← Leaderboard" are gone (2a), and the topbar's Profile tab always lands on the cockpit (2b).
  Their own account's page links the same account on their Profile page ("Open in your Accounts",
  `app/src/shell/account-head.tsx`), and the Profile page links back from the account's name menu
  ("<name> as the league sees it", `app/src/shell/account-menu.tsx`, 2e).
- **9 (found by run 0; fixed)** — `/api/accounts/networth` answered 500 on the offline fixture
  (`h.equity.forEach`, `src/server/networth-api-routes.ts`, when the history read carried no
  equity series); the Overview said "Net worth is unreachable right now." and the positions
  blotter vanished with it — one failed feed blanked the whole page. Root cause: the fixture
  transport answered `/v2/account/portfolio/history` with the account payload; it now 404s and
  the route degrades to "—" windows with the blotter intact.
- **8 (fixed, #3807 slice 3b-2)** — a docked Trade had no entry to the standalone Chain.
- **3 (fixed, #3807 slice 2e)** — on a phone, the Chain pane said "Pick a symbol on the Ticket…"
  with no input of its own.
- **7** — two "Playbooks": the Profile chapter with a disabled Arm
  (`app/src/shell/playbooks-chapter.tsx`) and R&D's subscribe-able store
  (`app/src/shell/playbooks-section.tsx`).

**Found by the cross-feature journeys (#8005 slice 3, 2026-11-23)** — each pinned as a `known_gap`
on its step; the line flips to fixed with the fix.

- **Open — j5 s2** (medium): with no model, a filing goes without a draft to read or a Submit.
- **Open — j5 s3** (medium): a filing drops the screen and symbol it came from, so she asks where it
  bites.
- **Open — j5 s4** (low): after filing, "Profile → Feedback" is named in words, never linked.

## 6. Journeys

### j1 — sell a covered call on a position I hold

1. `/app/accounts` — the cockpit: the account's name (its menu holds the switcher), Overview ·
   Balance · Ledger · Events. **WHEN a member with one linked account opens Profile, the app
   shall open that account's cockpit on Overview.**
   Judge: can this reader tell what to do next in ten seconds?
2. `/app/accounts` — the Overview: net worth, then the positions blotter — EEM, its guidance
   line under the row (desktop). **WHEN the member opens Overview, the app shall show the held
   positions with a way into each one's guidance, even when net worth cannot be read.** On a phone
   the blotter is one card per position and EEM's card is the way in — it opens the position on
   Trade, where Guidance is a tab (`s2-phone`). Judge: can this reader tell which position to
   act on?
3. `/app/u/human-eric` — the desk's blotter: EEM, its guidance line under the row, whose Guidance
   opens in place (desktop); the EEM card (phone); they click it. **WHEN the member opens their desk, the app shall show each held
   position with a way into its guidance.** Judge: can this reader tell which position to act on?
4. `/app/trade?desk=human-eric&symbol=EEM&section=guidance` — Trade, EEM prefilled, the Guidance
   pane (offline: "No live quote for EEM — nothing to advise on"; the lever calls need a live quote
   and are specified by `tests/options/position-guidance*.spec.ts`, not by the crawl). **WHEN the
   member follows a position into Trade, the app shall open Trade with that symbol and its
   guidance pane.** Judge: can this reader tell whether to sell the call today?
5. `/app/trade?desk=human-eric&symbol=EEM` — no back link on the stage (the rail's "← Back to
   account" left with the rail); the topbar's Profile tab always lands on the cockpit. **WHEN the
   member wants to return from Trade to their book, the app shall link back to the cockpit they
   came from.** _Fixed — dead end 6 (#3807 slices 2a + 2b)._ Judge: does the reader land where they started?
6. desktop only — the docked bench, "Options chain" beside the milestone strip. **WHEN Trade is
   docked at desktop width, the app shall offer an entry to the standalone options chain.**
   _Fixed — #3807 slice 3b-2._ Judge: can the reader find the chain from here?

### j2 — the fill on Activity

1. phone only — `/app/trade?desk=human-eric&section=chain` — "Pick a symbol to browse its options
   chain." with the Symbol field in the same note. **WHEN a pane needs a symbol it does not have,
   the app shall offer the symbol input in that pane.** _Fixed — #3807 slice 2e._ Judge: can this
   reader tell what to do next in ten seconds?
2. `/app/activity` — the feed. **WHEN the member opens Activity, the app shall show the feed with
   the newest event first.** Judge: can the reader find today's fill?
3. `/app/accounts?section=ledger` — Profile → Ledger: the orders on their own account, newest
   first, the EEM buy among them — the fill on their own book, not only in the league's feed.
   **WHEN the member opens their Profile's Ledger, the app shall list their own account's
   orders, newest first.** Judge: can the reader find their own fill?

### j3 — my own desk, and back

1. `/app/accounts` — the head's account name opens its menu, whose "<name> as the league sees it"
   opens the same account's page, `/u/human-eric` (`app/src/shell/account-menu.tsx`). **WHEN the
   member is on their Profile page with one account picked, the app
   shall link that account's page as the league sees it (`/u/:id`).** _Fixed — #3807 slice 2e._
   Judge: does the reader know there are two pages for one account?
2. `/app/u/human-eric` — their own account's page: the head (name, HUMAN, SIM, "Open in your
   Accounts"), the switch with Settings, tiles, the blotter with Close, New trade. **WHEN the member
   is on their own account's page, the app shall link back to the same account on their Profile
   page.** _Fixed — dead end 6 ("Open in your Accounts")._ Judge: does the reader land where they started?

### j4 — playbooks, twice

1. `/app/accounts?section=milestones&chapter=playbooks` — "Prove the play by hand, then arm it", Arm · soon disabled. **WHEN the member
   opens the Profile's Playbooks chapter, the app shall relate it to the Playbook Store (one
   playbook system, not two).** _known gap — dead end 7._ Judge: does the reader know which
   Playbooks this is?
2. `/app/research?section=playbooks` — the store, "Subscribe as" in the rail. **WHEN the member
   opens R&D → Playbooks, the app shall show the store with a subscribe-as account picker.** Judge:
   does the reader know which Playbooks this is?

### j5 — a fix, from the screen where it bites (cross-feature, #8005)

_Phone. Crosses Trade → Moneypenny's chat (note, draft, Submit) → Profile → Feedback._

1. `/app/trade?desk=human-eric&symbol=EEM` — EEM on Trade, Moneypenny's dock under it; 'File
   feedback' asks what is wrong. They tap "File feedback". **WHEN a member asks to file a fix from
   the screen where it bites, Moneypenny shall ask what is wrong, on that screen.** Judge: does this
   reader know how to report it?
2. `/app/trade?desk=human-eric&symbol=EEM` — the note and the answer to her one question, then the
   filing goes at once: no draft to read, no Submit. They tap "File feedback", then type "The chart
   pane goes blank when I switch back from Guidance", then send, then type "Here on the ticket, on
   my phone. A good outcome: the chart stays drawn.", then send. **WHEN Moneypenny has what she
   needs to file a fix, the app shall show the draft with Submit and Never mind before anything
   files.** _Known gap (medium, fix S, `app/src/live/moneypenny-filing.ts:187`) — with no model call
   the filing skips its draft: the scripted path files the member's words the moment they answer her
   one question, with no card to read and no Submit, while the live path parks a draft and waits for
   the member's own Submit._ Judge: does this reader know what will be filed?
3. `/app/trade?desk=human-eric&symbol=EEM` — she asks 'where in the app does this bite you' on the
   screen that knows: Trade, EEM, Eric's account. They tap "File feedback", then type "The chart
   pane goes blank when I switch back from Guidance", then send, then type "Here on the ticket, on
   my phone. A good outcome: the chart stays drawn.", then send. **WHEN a member files from a
   screen, the draft shall carry the screen and the symbol on it, so the member never retypes where
   it bites.** _Known gap (medium, fix M, `src/server/feedback-api-routes.ts:102`) — a filing drops
   the page it was filed from: the draft carries only the member's words and the request no route,
   account or symbol (only the landing page publishes its keys, app/src/live/page-keys.ts;
   docs/IA.md §5.6, MISSING 31), so she asks where it bites on the very screen that knows._ Judge:
   does this reader have to explain where they are?
4. `/app/trade?desk=human-eric&symbol=EEM` — Submit on the draft; she says it is filed and links
   where its status shows. They tap "File feedback", then type "The chart pane goes blank when I
   switch back from Guidance", then send, then type "Here on the ticket, on my phone. A good
   outcome: the chart stays drawn.", then send, then tap "Submit". **WHEN a member submits a drafted
   fix, Moneypenny shall say it is filed and link where its status shows.** _Known gap (low, fix M,
   `app/src/live/moneypenny-script.ts:191`) — where filing works, the desk's line after it says
   'Profile → Feedback shows where it stands' in words, never a link (OPS_LINE); and this world
   files nothing: the offline boot sets no feedback token by design (scripts/crawl/server.mjs: a
   filing would open a real issue), so a sent fix never comes back with its number here._ Judge: can
   this reader find out what happens to it?
5. `/app/accounts?section=feedback` — Profile → Feedback: the member's filings with where each
   stands, and 'Talk to Moneypenny' back to the conversation that files them. **WHEN a member opens
   their filings, the app shall show where each filing stands and a way back to the conversation
   that files them.** Judge: can this reader tell where their filing stands?

Journey map: [`maps.md`](maps.md#returning-trader). Findings: [`friction-ledger.md`](friction-ledger.md).

## 7. Feature seeds

- **One "back" that remembers** — Trade's back link returns to the page the member arrived from
  (cockpit or desk), never a fixed route. _(src: returning-trader · while: j1 s4)_
- **The symbol input travels with the pane** — Chain, Chart and Guidance each carry the symbol
  field when they have no symbol, instead of pointing at the Ticket. _(src: returning-trader ·
  while: j2 s1)_
- **One Playbooks** — the Profile chapter and the R&D store are one surface with two states (prove
  by hand · subscribe). _(src: returning-trader · while: j4 s1)_
