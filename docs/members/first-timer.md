# The first-timer — signed in, nothing linked

_A proto-member: not a real person, so there are no quotes; the description is the plan's
(2026-09-26) and the fixture's. Twin: `e2e/journeys/first-timer.journey.json`._

## 1. Who

Someone Eric invited last night. They signed in with Google this morning for the first time, have
never seen the app, and own nothing in it: no paper key linked, no rung earned, no filing. They
know it is a friends-and-family paper-trading game with bots on a leaderboard, and roughly nothing
else. They will give it ten minutes on a laptop over coffee and, if the next step is not obvious,
close the tab and ask Eric on the group chat instead.

## 2. What they own

- Fixture: a **session with no participant** — the crawl mints a `skynet_session` cookie for
  `newcomer@example.test`, an email no owner-link or `ownerEmail` maps to, so `/api/settings`
  answers with zero accounts (the server's real answer, not a stub).
- Rungs: none. Accounts: none. Device: a laptop (the crawl also walks the phone frame).

## 3. What they are trying to do

1. Find out what to do first.
2. Say hello to Moneypenny (the feedback gate the ladder opens on — `src/domain/progression.ts:159`).
3. Link a paper key (the Onboarding chapter, `/app/accounts?section=milestones&chapter=onboarding`).
4. Place rung 101 — their first fill.

Needs, in plain words: *"Where do I start?"* · *"What is locked and why?"* · *"How do I get an
account into this thing?"*

## 4. How they decide

By the first sentence on the screen that sounds like an instruction. They read the biggest words
and the first button, never the rail. They skip anything that names a concept they have not met
(rung, playbook, desk). A greyed control with no reason reads as "broken", not "locked".

## 5. What frustrates them

- **1 (fixed)** — the first sign-in landed on the leaderboard with no onboarding cue. The topbar's
  Profile tab now opens on the connect guide for a member with no account.
- **2 (fixed)** — two contradictory gate sentences: `/learn` said "unlocks after your first
  feedback filing", while the server says "the moment you say hello to Moneypenny"
  (`src/domain/progression.ts`). Both now use one sentence (j1 s3).
- **3 (fixed)** — `/trade` with no account said "No accounts are linked to your session yet." with
  nothing to click. The words are now the link (j1 s5).

## 6. Journeys

### j1 — the first ten minutes

0. `/login` — the sign-in page: the scene behind it, one button per provider, "Continue with
   Google" first (the server serves it the same with or without a session). **WHEN an invited
   visitor opens the sign-in page, the app shall show a way to sign in at every width.** Judge:
   can this reader tell how to get in, in ten seconds? _(Added 2026-09-29, #3816 slice 9 — the
   first page this member ever saw; a spectacle surface, so the phone frame checks its honest
   fallback, not a curated layout.)_
1. `/app/` — the league table, ranked rows; the topbar's Profile tab is one tap away and lands on
   the Profile page, which opens on the connect guide for a member with no account. **WHEN a
   signed-in member with no linked account opens the app, the app shall keep a one-tap way into
   onboarding on screen: the Profile tab, landing on the connect guide.** _Fixed — dead end 1
   (#3807 slice 2b)._ Judge: can this reader tell what to do next in ten seconds?
2. `/app/accounts?section=milestones` — the milestones page: M·01 Onboarding first. **WHEN the member opens Profile
   before onboarding is complete, the app shall show M·01 Onboarding as the next step with one
   link into it.** Judge: can this reader tell what to do next in ten seconds?
3. `/app/accounts?section=milestones` — the M·02 card's gate note. **WHILE the trading ladder is gated, the app shall
   name the SAME unlock condition everywhere it is named.** _Fixed — #3807 slice 3b-4: with no
   account the card reads "link an account first, then it unlocks the moment you say hello to
   Moneypenny" — the step before the gate, then the server's words._ Judge: does this reader know
   what unlocks trading, in one sentence?
4. `/app/accounts?section=milestones&chapter=onboarding` — Welcome to the league: connect Alpaca, say hello, first trade. **WHEN the
   member opens onboarding, the app shall show the checklist with the first undone step first.**
   Judge: can this reader tell what to do next in ten seconds?

4b. `/app/accounts?section=feedback` — Profile → Feedback: what a filing is for, and one button,
   "Talk to Moneypenny", that opens her rail — where hello is said (goal 2); offline, a line that
   feedback is not switched on yet. **WHEN a member with no linked account opens Profile →
   Feedback, the app shall offer one control that opens Moneypenny.** Judge: can this reader tell
   how to say hello, in ten seconds? _(Added 2026-09-29, #3816 slice 9.)_

5. `/app/trade` — "No accounts are linked to your session yet — connect one in Onboarding." — the
   words are the link to the connect guide. **WHEN a member with no linked account opens Trade, the
   app shall link the empty state to onboarding.** _Fixed — #3807 slice 2e._ Judge: can this reader
   tell what to do next in ten seconds?

### j2 — the first rung, read before it is earned

1. `/app/accounts?section=milestones&chapter=trading` — One fill unlocks the next rung; 101 first. **WHEN the member opens the
   trading ladder before any fill, the app shall show rung 101 as the next rung and what earns
   it.** Judge: can this reader tell what to do next in ten seconds?

Journey map: [`maps.md`](maps.md#first-timer). Findings: [`friction-ledger.md`](friction-ledger.md).

## 7. Feature seeds

- **A landing that knows you are new** — first sign-in with no account lands on onboarding, or the
  leaderboard opens with one line and one button that say so. _(src: first-timer · while: j1 s1)_
- **One gate sentence, served from one place** — the server's own line
  (`progression.ts:159`) is the only copy; `/learn`, the strip, the ticket nav and the gate card
  render it once each, never three times on one page. _(src: first-timer · while: j1 s3)_
- **Every empty state is a door** — "No accounts are linked" carries the link that fixes it.
  _(src: first-timer · while: j1 s5)_
