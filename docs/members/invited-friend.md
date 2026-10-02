# The invited friend — signed in as a member, sees their own book and the shared league

_A proto-member: not a real person, so there are no quotes; the description is the plan's
(2026-09-26) and the fixture's. Twin: `e2e/journeys/invited-friend.journey.json`._

**Why this member exists.** Every other signed-in member file signs in as `crawl@example.test`,
which is linked to `human-eric` AND listed as an owner (`SKYNET_ALLOWED_EMAILS`) — so every
signed-in journey was really Eric, the fund owner, and no test had ever seen what anyone else sees.
Eric, 2026-09-26: *"Other people that log in should have the perspective of their accounts/data,
not mine."* This file is that perspective, and its journeys are the standing check that the line
between "mine" and "the league's" holds.

## 1. Who

A friend Eric invited a few weeks ago. They are on the guest list, not the owner list: they can
sign in, and they cannot invite anyone or touch the fleet. They connected their own paper account
and later took over one of the bots (The Day Trader), so they own two accounts, one human and one
bot. They come to see how their money is doing, place a trade now and then, and check where they
stand against Eric and the bots. They expect their Profile to be theirs, and the leaderboard to be
everyone's.

## 2. What they own

- Fixture: **`human-friend`** (display name "Friend", SIM-HUMAN-FRIEND, one XLE position, one
  filled buy) and **`day-trader`** (the bot), both linked to `friend@example.test` by
  `scripts/crawl/fixtures/owner-links.json`. The human row exists only in the crawl's frozen copy
  of the roster (`scripts/crawl/frozen-fixtures.mjs`); `fixtures/offline/participants.json` is
  never touched.
- Tier: **member**. The email is on the guest list the frozen dir writes
  (`SKYNET_ALLOWLIST_STORE`, the same store `/invite` writes in production) and NOT on
  `SKYNET_ALLOWED_EMAILS`, so the server treats it as an invited member, never an owner
  (`src/server/auth/resolve-auth.ts` → `ownerEmails`).
- Rungs: whatever the fixture's one fill earns (101). Device: phone and desktop, equally.

## 3. What they are trying to do

1. Open Profile and see their own money: net worth, where it is, what they hold.
2. Place a trade from their own account, never someone else's.
3. See where they stand in the league, and what everyone else traded.
4. Look at a bot that is not theirs out of curiosity, without being able to touch it.
5. Check on the bot they took over: is it running, and what does it believe right now. _(Added
   2026-09-29, #3816 slice 9 — the Day Trader is their money too.)_

Needs: *"Show me my accounts."* · *"Don't let me trade from anyone else's."* · *"Show me the
league."*

## 4. How they decide

By the name on the page. The first thing they read is whose account this is (the net-worth
heading, the account picker); if it names someone else, nothing else on the page is trustworthy.
They skip the owner's tools entirely — they would not know what a guest list or a fleet switch is
for, and seeing one would read as "I am in the wrong place".

## 5. What frustrates them

- **The playbook names of another member's bot (code, not yet seen by the crawl)** —
  `docs/IA.md:326` says a non-owner's `/u/<bot>` Heartbeat withholds playbook ids (#885), but
  `/api/desk/<bot>/heartbeat` returns every `playbookId` to any viewer
  (`src/server/desk-json-routes.ts:86`, no ownership check) and the page renders them
  (`app/src/shell/heartbeat.tsx:51`). Offline no decision trail is wired, so j3 s2 passes on
  absent data — it goes red the day a crawl boot wires one, which is when the fix lands.
- Nothing else on the boundary: every j1 step holds today, at both widths. The friend meets the
  same probe findings every member meets (disabled Activity rows with no reason, a chart pane that
  says "Pick a symbol" with no input — dead end 3's family) — the ledger carries those.

## 6. Journeys

### j1 — my own book, not the owner's

1. `/app/accounts` — Profile on the friend's own account: "Net worth · Friend", the money strip,
   the account picker offering Friend and The Day Trader; the league card beside it ranks everyone.
   **WHEN the invited friend opens Profile, the app shall open the friend's own account and shall
   not open, name as theirs, or list the positions of the owner's account.** Judge: can this reader
   tell this is their own money, in ten seconds?
2. desktop only — `/app/accounts` — the blotter: XLE on its row. **WHEN the invited friend reads
   their positions, the app shall show the positions of the friend's own accounts.** Judge: can
   this reader find what they hold? (`s2p`, phone only: XLE as a card.)
3. `/app/trade` — the ladder's rungs point at the friend's desk; the ticket's account picker offers
   only the friend's two accounts. **WHEN the invited friend opens Trade, the app shall put the
   friend's own account on the ticket and offer only the friend's accounts to trade from.** Judge:
   can this reader tell which account an order would come from?
4. `/app/trade?desk=human-eric` — a link naming the owner's account. **IF the invited friend opens
   Trade on another member's account, THEN the app shall keep the ticket on the friend's own
   account.** Judge: does this reader know whose account an order would come from?
5. `/app/settings?section=account` — the friend's own account card; no fleet-wide switch, no list
   of accounts nobody owns. **WHEN the invited friend opens Settings, the app shall show only the
   friend's own accounts and shall not show the fleet controls or the owner's account tools.**
   Judge: can this reader tell these settings change only their own accounts?
6. `/app/settings?section=guests` — falls back to Preferences; no Guest list entry. **IF the
   invited friend opens the guest list's address, THEN the app shall not show the guest list.**
   Judge: does this reader land somewhere that makes sense?

### j2 — the shared league

1. `/app/leaderboard` — every account ranked, Eric and the friend among them. **WHEN the invited
   friend opens the leaderboard, the app shall rank every member's accounts, the friend's and the
   owner's alike.** Judge: can this reader find where they stand?
2. `/app/activity` — the league's fills: the friend's XLE buy beside Eric's EEM buy. **WHEN the
   invited friend opens Activity, the app shall show the whole league's fills, other members'
   included.** Judge: can this reader tell who did what today?
3. `/app/activity` — the Booked P&L strip above the feed: realized P&L per account across the
   league, each a link into its page, on screen without a tap (offline nothing is booked yet — the
   frozen fixture has no closes). **WHEN the invited friend opens Activity, the app shall show
   realized P&L for every member's accounts, the friend's and the owner's alike, without paging
   away from the feed.** Judge: can this reader tell where they stand on what has been closed?
   _(Added 2026-09-29, #3816 slice 9; the section became a strip in #784 slice 3.)_

### j3 — another member's bot, read only

1. `/app/u/sauron` — tiles, the blotter with Guidance on each row, "You can trade only your own
   accounts."; no Close, no New trade. **WHEN the invited friend opens another member's bot, the
   app shall show its book read-only, with no control that would write to it.** Judge: can this
   reader tell they are looking, not trading?
2. `/app/u/sauron/decisions` — Heartbeat; offline, "No decision trail is wired in this
   deployment." **WHEN the invited friend reads another member's bot's heartbeat, the app shall not
   name the playbooks it runs.** Passes offline on absent data (§5). Judge: can this reader tell
   the bot is alive without learning its playbooks?

### j4 — my bot

_(Added 2026-09-29, #3816 slice 9 — the friend is the only member in these files who owns a bot
and is not the owner.)_

1. `/app/accounts?account=day-trader&section=heartbeat` — Profile on The Day Trader: the section
   switch gains Heartbeat · Thesis; Heartbeat says whether the loop is alive (offline: no
   decision trail is wired). **WHEN the invited friend opens Profile on the bot they own, the app
   shall offer its Heartbeat and show whether it is alive.** Judge: can this reader tell whether
   their bot is running?
2. `/app/accounts?account=day-trader&section=thesis` — Thesis on their own bot: its standing call
   and the markers behind it. **WHEN the invited friend opens Thesis on the bot they own, the app
   shall show that bot's standing call.** Judge: can this reader tell what their bot believes
   right now?

**How the check was proven to bite (2026-09-26).** Pointing the friend's human link at
`human-eric` turned j1 s1–s5 red at both widths (Eric's net worth, his EEM row, his desk on the
ticket, his account card); adding the friend to `SKYNET_ALLOWED_EMAILS` turned s5–s6 red (Mission
Control, Unclaimed accounts, the Guest list). Neither change was kept.

Journey map: [`maps.md`](maps.md) (after the next full crawl). Findings: [`friction-ledger.md`](friction-ledger.md).

## 7. Feature seeds

- **Say whose account it is on Trade** — the ticket's account picker is the only place the owner's
  name would show, and a `<select>` option is invisible to the check; a visible "Trading from
  Friend" line would make the boundary readable by eye and by test. _(src: invited-friend · while:
  j1 s3)_
- **A decision-trail fixture for the crawl** — one recorded pass per bot in the frozen dir, so the
  heartbeat's playbook boundary is checked against data, not absence. _(src: invited-friend ·
  while: j3 s2)_
