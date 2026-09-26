# The bot-watcher — wants to know what Sauron did, and why

_A proto-member: no quotes; the description is the plan's (2026-09-26). Twin:
`e2e/journeys/bot-watcher.journey.json`._

## 1. Who

A member who does not trade much themselves but follows the bots the way other people follow a
fantasy league. They heard Sauron had a bad week and opened the app to see what it did. They read
decisions like a box score: what it wanted, what it was allowed, what happened. They will click
anything that looks clickable and are the first to notice a button that does nothing.

## 2. What they own

- Fixture: **anonymous** — the crawl walks this member on the OPEN boot (no auth env), where
  every viewer is signed in to nothing and owns nothing. That is also the honest state of any
  member on someone else's desk: the server never checks ownership on reads.
- Rungs: none that matter here. Device: either.

## 3. What they are trying to do

1. Find Sauron from the leaderboard.
2. Read its desk, its decisions, its thesis.
3. Get back to where they came from.

Needs: *"Show me what the bot did."* · *"Explain its words."* · *"Don't show me buttons I can't
press."*

## 4. How they decide

By curiosity, not intention: the next click is whatever is nearest and most interesting. They read
the persona's own words in the decisions and skip the numbers. A control that renders and then
fails costs them more trust than a control that is greyed with a reason.

## 5. What frustrates them

- **4** — on another member's desk, Close / Close this buy render, then fail at the server
  (`app/src/shell/blotter-row.tsx:290`; `src/server/account-identity-gate.ts:63`); New trade and
  Guidance go to `/trade?desk=sauron`, which silently switches to the viewer's own account
  (`app/src/routes/trade.tsx:628`).
- **5** — promises that do not exist: "click a symbol for its fill timeline"
  (`app/src/routes/u.$id.index.tsx:92`); Thesis markers link `#act-<id>` anchors that exist only
  on `/accounts`; `/u/:id` has no Activity (`app/src/shell/desk-rail.tsx:33`).
- **6** — the desk rail always says "← Leaderboard" (`app/src/shell/desk-rail.tsx:78`) — fine for
  this member, wrong for one who came from their cockpit.
- **8** — Thesis Subscribe is disabled with its reason only in `title`
  (`app/src/shell/thesis-drawer.tsx:81`); "past the guards" with no gloss
  (`app/src/shell/decisions-section.tsx:133`).

## 6. Journeys

### j1 — what did Sauron do, and why

1. `/app/leaderboard` — the match bar, ranked rows, Sauron with a BOT chip; they click it. **WHEN a
   viewer opens the leaderboard, the app shall list every account with a link into its desk.**
   Judge: can this reader find the bot they heard about?
2. desktop only — `/app/u/sauron` — tiles, the blotter with Close on every row. **WHEN a viewer
   opens another account's desk, the app shall render no write control that will refuse them.**
   _known gap — dead end 4 (the phone's card layout has no Close; the table does)._ Judge: does
   this reader know what they may do here?
3. `/app/u/sauron` — the footer promises "click a symbol for its fill timeline". **WHEN the desk
   promises an interaction, the app shall have a target for it.** _known gap — dead end 5._
   Judge: can this reader tell what to do next in ten seconds?
4. `/app/u/sauron/decisions` — every cycle: what the persona wanted, "N past the guards", what
   happened. **WHEN a viewer reads a bot's decisions, the app shall gloss its own words where they
   appear.** Judge: does a first-time reader understand "past the guards"?
5. `/app/u/sauron/thesis` — the thesis, its markers, a disabled Subscribe cluster. **WHEN a control
   is disabled, the app shall show its reason as visible text, not only in a title.** _known gap —
   dead end 8._ Judge: does this reader know why Subscribe is off?
6. `/app/u/sauron` — the desk rail: Active · Decisions · Thesis · Pulse · ← Leaderboard. **WHEN a
   viewer is on a desk, the app shall offer that account's activity beside its decisions.** _known
   gap — dead end 5._ Judge: can this reader find what the bot actually did?

Journey map: [`maps.md`](maps.md#bot-watcher). Findings: [`friction-ledger.md`](friction-ledger.md).

## 7. Feature seeds

- **A read-only desk** — on an account the viewer does not own, no write control renders; New
  trade and Guidance say whose account they would open. _(src: bot-watcher · while: j1 s2)_
- **A gloss on every house word** — "intents", "guards", "past the guards" wrapped in the glossary
  term the rest of the app already uses. _(src: bot-watcher · while: j1 s4)_
- **Thesis markers that land** — `#act-<id>` links resolve on the page that renders them, or go
  to `/accounts?…#act-<id>` explicitly. _(src: bot-watcher · while: j1 s5)_
