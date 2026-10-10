# Member study readout — profile-2026-10, full list (text only)

_The uncapped list the generator wrote; screens stay in the run record, not the repo._


## A member, stuck

The eric member on a phone, at their most confused (confusion 3 of 3):

| Before | What they did | After | Yours |
|---|---|---|---|
| (screen in the run record) | tapped "← Back to Eric" | (screen in the run record) | _your screenshot goes here (`--owner-shot`)_ |

> "As Eric, I'm backing out of this Trade ticket — it opened an order form, not MSFT's position detail — so I can get one last look at the positions list. — "Trade · Ticket · Chart · Chain · Guidance · Outlook". "Nothing dated on MSFT Oct 5 – Oct 11." "New trade — Paper account · market, limit or stop". "← Back to Eric". No P/L numbers anywhere on this screen." — eric

## What it found

**Found 12 of your 12 without seeing them (3 only partly) · 66 new structural problems · 69 new smaller ones.**

Partly means the right place with a vaguer reason; the bar counts it as found. Full matches alone: 9 of 12 (75%).

With 12 items the range is wide: 12 of 12 is anywhere from 76% to 100% (95% confidence).

Not counted as new: 9 structural already on your key (re-found, not new) · 4 smaller already on your key (re-found, not new).

It missed the bar: negative control (still reported: A9, A12, S1, S5, S7, needs pass).

## New structural problems

### 1. The phone Positions list shows only lifetime P/L per row (MSFT +$414, AAPL +$462). There is no TODAY column, which the desktop table has — so on phone the day's loser is unreachable and the header's −$71 can never be attributed to a holding.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 |
|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

> "the app never breaks that $71 out by position, so I can't tell you which of the two caused it."

_Found by simulated members (eric) · critical._

### 2. Tapping a position row on phone opens the Trade order ticket instead of a position detail — no P/L anywhere on the destination.

| Frame 1 |
|---|
| (screen in the run record) |

> "Tapping MSFT didn't open a position detail — it dropped me into a trade order ticket with no P/L at all."

_Found by simulated members (eric) · high · reported 1 more time._

### 3. No freshness stamp anywhere on the human book — no "as of" time on net worth, positions or guidance. The only candidate, the "live · seq 0" chip in the desktop header, has no tooltip on hover and no last-updated time.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 |
|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

> "The only freshness signal anywhere is a "live · seq 0" chip in the header, which has no tooltip and no last-updated timestamp… I wouldn't put money to work on this read without a stated refresh time."

_Found by simulated members (eric) · high._

### 4. The R&D call board — the only surface in the app that stamps its own freshness — stamps every item stale (17–33 days) and every call reads "stand aside" / "no action", so the one place that states freshness states only that it is out of date.

| Frame 1 |
|---|
| (screen in the run record) |

> "the one place that does stamp itself — the R&D call board — stamps everything as stale, 17 to 33 days old… So my confidence that anything I'm reading reflects today's prices is close to zero."

_Found by simulated members (eric) · high._

### 5. Trade → Guidance is a per-symbol lookup ("Pick a symbol to see guidance for it") with no book-level view, so a question about the whole book dead-ends there every time.

| Frame 1 |
|---|
| (screen in the run record) |

> "I'm skipping the per-symbol Guidance box — I need book level."

_Found by simulated members (eric) · high._

### 6. "The Council" reads as a bot/rules roster but is a weekly one-line thesis post box. He opened it as his bot-roster guess in four sessions, twice in the same run.

| Frame 1 | Frame 2 |
|---|---|
| (screen in the run record) | (screen in the run record) |

> "The Council isn't a bot roster at all — it's a weekly one-line thesis post box, and nobody's posted."

_Found by simulated members (eric) · moderate._

### 7. Events opens on a Week span that is empty — "Nothing dated on what you hold in Oct 5 – Oct 11" — which reads as "you have nothing coming" when five of his holdings' items sit later in the month. He had to scroll back up and find the Month switch himself.

| Frame 1 | Frame 2 |
|---|---|
| (screen in the run record) | (screen in the run record) |

> "The calendar opened on a week view that showed nothing at all, so I had to find the Month switch myself."

_Found by simulated members (eric) · high · reported 1 more time._

### 8. The events list gives an estimated DEF 14A proxy filing (Oct 22) the same weight and the same ◆ marker as the MSFT earnings print (Oct 27), with no way to filter to the announcements that actually carry price risk. Both sessions answered Oct 22 and missed the earnings date.

| Frame 1 | Frame 2 |
|---|---|
| (screen in the run record) | (screen in the run record) |

> "it's an estimated date and coverage is thin (35 of 734 dated records name a ticker), so… Oct 22 is my first marker but I wouldn't bet the trim on it being the only one."

_Found by simulated members (eric) · high · reported 1 more time._

### 9. The landing Net Worth card is scoped to one account and never says so — it reads "NET WORTH · ERIC $98,479" with no hint that a whole-book roll-up exists. He had to open the account picker and guess that it rolls up rather than just switches.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 |
|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

> "I had to guess that the headline $98,479 was only one account — the card didn't say which scope it was showing, so I needed one extra check before I trusted the number."

_Found by simulated members (eric) · moderate · reported 1 more time._

### 10. The Positions list sits below the fold on the Profile Overview — the member landed on net worth, chart and league panels and had to scroll every single time before their own holdings were on screen.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 | Frame 7 |
|---|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

> "the positions weren't on screen when I landed, so I had to scroll before I could confirm anything"

_Found by simulated members (returning-trader) · moderate · reported 3 more times._

### 11. Nowhere in the bot page is there a month-to-date (or any period-labelled) performance figure. Pulse's headline tiles — EQUITY, NET REALIZED, WIN RATE, PROFIT FACTOR, MAX DRAWDOWN — carry no window label at all, so the member cannot tell whether +$571 / +$1,015 is this month, this quarter or all time. Every 'how did it do this month' session ended with a guessed, inferred figure.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 | Frame 7 | Frame 8 | Frame 9 | Frame 10 | Frame 11 | Frame 12 | Frame 13 | Frame 14 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

> "No screen anywhere labelled a month-to-date figure, so I spent ten steps scrolling Pulse and Overview and still had to infer the month number from an equity-curve date range — I'm not confident the figure I'd quote is right."

_Found by simulated members (bot-watcher) · critical._

### 12. Time-based performance is split awkwardly across tabs: Overview carries only today's move and unrealized paper P/L, Pulse carries lifetime-looking stats, and neither covers 'the month'. Members bounced Pulse → Overview → Pulse hunting for the missing middle.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 |
|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

> "Overview loaded but only shows today's P/L and unrealized paper gain — no month-to-date figure."

_Found by simulated members (bot-watcher) · high._

### 13. Once you scroll into Pulse, nothing on screen says whose numbers these are — the sticky bar reads 'Skynet Capital', not 'Sauron' — so the member scrolled back to the top mid-task just to confirm the figures weren't the whole desk's, then scrolled all the way back down.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 |
|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

> "Header just says "Skynet Capital" — I want to be sure these weeks belong to Sauron and not some overall account."

_Found by simulated members (bot-watcher) · moderate._

### 14. The 'which playbooks this bot runs' list on Heartbeat does not fit a phone screen and offers no count or summary, so counting how many are live is manual scrolling arithmetic — both members overshot the middle rows and had to scroll back up to trust their tally. The recorder also logs a layout shift near the SAURON row.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 | Frame 7 | Frame 8 | Frame 9 | Frame 10 | Frame 11 | Frame 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

> "The playbook list was there, but it didn't fit on one screen and there was no count anywhere, so I had to scroll down then back up to tally which ones were actually live myself."

_Found by simulated members (bot-watcher) · high._

### 15. The 'On' badge on a playbook does not mean it is doing anything: three rows are On but parked waiting on an estimated earnings date, one is On and trading live signals. The member had to read each row's prose to separate them, invented their own 'genuinely active' count, and still did not land the expected answer.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 |
|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

> "The On vs "Can't fire" labels took a second read to understand… 5 toggled on, but only 2 of the 8 are genuinely doing something."

_Found by simulated members (bot-watcher) · high._

### 16. The Positions list is silently scoped to the selected account. CRWV sits in the Sauron account, so searching and filtering inside Eric returns "No positions match" with nothing saying the list is account-limited — one session abandoned over this, two burned most of their taps on it.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 |
|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

> "The holding was hidden behind an account filter nothing told me about, so I spent most of my taps searching an account that could never contain it."

_Found by simulated members (phone-only) · critical._

### 17. The Trade tab is only a new-order form — no holdings and no automations below it — but it is the first place members go for "my positions" or "my running bots"; two to three scroll-screens are spent confirming there is nothing there.

| Frame 1 | Frame 2 |
|---|---|
| (screen in the run record) | (screen in the run record) |

> "The page barely moved — Trade is only the order form, no positions list below it."

_Found by simulated members (phone-only) · high._

### 18. The Leaderboard shows standings only, not what anyone traded, so a member looking for another account's trades lands there first and has to guess that "Activity" is the league-wide feed rather than their own history.

| Frame 1 | Frame 2 | Frame 3 |
|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) |

> "Leaderboard does list bots and humans, but only equity figures — no trades."

_Found by simulated members (invited-friend) · low._

### 19. On the home/Profile page, the right-rail league list ("1 Eric Human +2.25% … 3 Sauron Bot −0.64%") shows names that look like links but are not clickable. The only way into an account is the small "Full leaderboard ›" line or the top-nav Leaderboard, which this member only found by hunting after the first tap died.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 | Frame 7 | Frame 8 | Frame 9 | Frame 10 | Frame 11 | Frame 12 | Frame 13 | Frame 14 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

> "Clicking Sauron's name did nothing — page unchanged."

_Found by simulated members (first-timer) · high · reported 1 more time._

### 20. Nothing on a bot's or person's account page tells you what scheduled news is coming for what it holds. Upcoming dated events live only on a one-line MARKET CALENDAR strip at the top of the Trade page, which is a different section entirely — so the whole task becomes a guessing tour of Pulse, Thesis, filter chips and Guidance.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 | Frame 7 |
|---|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

> "Nothing on screen said "here is the next scheduled news" — I had to guess my way through Pulse, Thesis, a filter chip and a Guidance popup."

_Found by simulated members (first-timer) · critical._

### 21. The account tabs (Pulse, Heartbeat, Thesis) name concepts a first-timer has not met, so there is no way to tell which one holds what. Pulse sounded like news and was an equity curve; Thesis sounded like "what it expects next" and was plays.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 |
|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

> "The vocabulary (rung, thesis, play) meant I couldn't tell which tab was the right one."

_Found by simulated members (first-timer) · high · reported 3 more times._

### 22. On Trade the pane strip (Ticket · Chart · Chain · Guidance · Outlook · Watchlist · Orders) is 507px of content in a 358px box: "Watchlist" renders 5px wide and "Orders" sits entirely off-screen at x=455, with the strip ending flush at the right edge and no fade, arrow or half-word peek. The census could only reach Orders by scrolling the container programmatically.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 | Frame 7 |
|---|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

On Trade the pane strip (Ticket · Chart · Chain · Guidance · Outlook · Watchlist · Orders) is 507px of content in a 358px box: "Watchlist" renders 5px wide and "Orders" sits entirely off-screen at x=455, with the strip ending flush at the right edge and no fade, arrow or half-word peek. The census could only reach Orders by scrolling the container programmatically — this breaks H6 recognition rather than recall (plus navigational excise — the only route to two panes is an undiscoverable gesture), which matters because phone-only's named job is "reach a pane on Trade" and they never scroll sideways on purpose, so two of seven panes do not exist for them — including Orders, the one pane that actually knows about the CRWV $80 PUT this link was built for; the fix: At 390 wrap the pane strip to two rows or collapse it to a labelled picker ("Ticket ▾"); if it must scroll, cut it mid-label so a half-word peeks and add an edge gradient. Test this: ask a phone user to find Orders from a cold start.

_Found by expert reviews (expert 1) · critical · reported 3 more times._

### 23. One bot has two homes with two vocabularies: /app/accounts?account=sauron (Overview · Activity · Events · Heartbeat · Thesis · Milestones · Feedback) and /app/u/sauron (Overview · Activity · Pulse · Heartbeat · Thesis · Settings). "Events" and "Pulse" name the same idea; only the second page carries the positions table with per-row Guidance and Close; the bridge between them is a 158×15px grey link called "Open as the league sees it", answered by "Open in your Accounts" going the other way. "Full pulse ↗" opens a third shell again.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 | Frame 7 | Frame 8 | Frame 9 | Frame 10 | Frame 11 | Frame 12 | Frame 13 | Frame 14 | Frame 15 | Frame 16 | Frame 17 | Frame 18 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

One bot has two homes with two vocabularies: /app/accounts?account=sauron (Overview · Activity · Events · Heartbeat · Thesis · Milestones · Feedback) and /app/u/sauron (Overview · Activity · Pulse · Heartbeat · Thesis · Settings). "Events" and "Pulse" name the same idea; only the second page carries the positions table with per-row Guidance and Close; the bridge between them is a 158×15px grey link called "Open as the league sees it", answered by "Open in your Accounts" going the other way. "Full pulse ↗" opens a third shell again — this breaks Information architecture — organisation and labelling (one object, one home); H4 consistency, which matters because bot-watcher arriving from the leaderboard lands on the half of the bot with no decisions and no guidance, and the link to the real desk is the smallest text on screen; returning-trader's "row to the ticket" path exists only on the page they were not sent to. Neither page says which is authoritative, and eric is maintaining two surfaces for one bot; the fix: Collapse to one bot page with one tab vocabulary; if a public/owner distinction is needed, make it a mode switch on the same route ("League view / My view") and vary only the owner-only controls, flagged inline. Until merged, promote the cross-link to a real button labelled "Positions & guidance →" placed above the chart.

_Found by expert reviews (expert 1) · high · reported 2 more times._

### 24. Member-level content lives inside an account's tab strip: "Milestones" and "Feedback" render "Your milestones — the same on every account" with a "HUMAN · Eric" chip under the heading "NET WORTH · SAURON $996,966", both silently drop the account picker, and the right rail carries a "YOUR COUNCIL LINE" composer whose own caption says it is "yours as a member, not this account's" — beside a select called "Tag your bot's play". The Milestones copy also claims "this session isn't linked to an account yet" above a linked million-dollar account.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 | Frame 7 | Frame 8 | Frame 9 | Frame 10 | Frame 11 | Frame 12 | Frame 13 | Frame 14 | Frame 15 | Frame 16 | Frame 17 | Frame 18 | Frame 19 | Frame 20 | Frame 21 | Frame 22 | Frame 23 | Frame 24 | Frame 25 | Frame 26 | Frame 27 | Frame 28 | Frame 29 | Frame 30 | Frame 31 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

Member-level content lives inside an account's tab strip: "Milestones" and "Feedback" render "Your milestones — the same on every account" with a "HUMAN · Eric" chip under the heading "NET WORTH · SAURON $996,966", both silently drop the account picker, and the right rail carries a "YOUR COUNCIL LINE" composer whose own caption says it is "yours as a member, not this account's" — beside a select called "Tag your bot's play". The Milestones copy also claims "this session isn't linked to an account yet" above a linked million-dollar account — this breaks Information architecture — organisation; H2 match with the real world, which matters because invited-friend decides by the name on the page: a card saying "your" with Eric's name in it under someone else's net worth tells them they are looking at the wrong thing, and with the picker gone they cannot tell whose page they are on or get back to their own. first-timer is told to connect an account on a page visibly showing one, which reads as the app being wrong about them; the fix: Lift Milestones, Feedback and the council composer out of the account tab strip into member-level navigation; leave the account tabs account-scoped (Positions, Orders, Events, Decisions, Thesis). If a member-scoped card must appear here, head it with the member's own name and suppress the account hero. Derive the "not linked" copy from actual session state.

_Found by expert reviews (expert 1) · high · reported 2 more times._

### 25. The Thesis tab leads with a complete, operable-looking Subscribe card — Target account select, "Capital allocated $0" slider, Subscribe and Steering Rules buttons — and only underneath, in small grey prose, admits that subscribing "isn't wired yet" and Steering Rules "aren't built yet". The thesis itself sits below the dead form, and Subscribe is enabled at $0.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 | Frame 7 | Frame 8 | Frame 9 | Frame 10 | Frame 11 | Frame 12 | Frame 13 | Frame 14 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

The Thesis tab leads with a complete, operable-looking Subscribe card — Target account select, "Capital allocated $0" slider, Subscribe and Steering Rules buttons — and only underneath, in small grey prose, admits that subscribing "isn't wired yet" and Steering Rules "aren't built yet". The thesis itself sits below the dead form, and Subscribe is enabled at $0 — this breaks H5 error prevention / H1 visibility of system status, which matters because bot-watcher's stated rule is "don't show me buttons I can't press" — a control that renders and then fails costs more trust than one absent. invited-friend, reading "Target account: Eric" on a bot they do not own, reads it as being able to point someone else's money at a bot; and phone-only meets the buttons a screen before the reason; the fix: Remove the form until it works and put one visible sentence in its place — "Subscribing capital to a bot isn't built yet; a bot trades only its own account" — after the thesis, not before it. If the controls must render, disable them with that sentence beside each, never below.

_Found by expert reviews (expert 1) · high · reported 1 more time._

### 26. "Sign out" is an unlabelled 30px icon sitting 8–10px from the equally unlabelled Settings gear and Moneypenny button; one tap ends the session with no confirmation and a full reload, and the destination is a dead end — "You're signed out" with no sign-in button, no link and nothing tappable on the screen.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 | Frame 7 | Frame 8 | Frame 9 | Frame 10 | Frame 11 | Frame 12 | Frame 13 | Frame 14 | Frame 15 | Frame 16 | Frame 17 | Frame 18 | Frame 19 | Frame 20 | Frame 21 | Frame 22 | Frame 23 | Frame 24 | Frame 25 | Frame 26 | Frame 27 | Frame 28 | Frame 29 | Frame 30 | Frame 31 | Frame 32 | Frame 33 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

"Sign out" is an unlabelled 30px icon sitting 8–10px from the equally unlabelled Settings gear and Moneypenny button; one tap ends the session with no confirmation and a full reload, and the destination is a dead end — "You're signed out" with no sign-in button, no link and nothing tappable on the screen — this breaks H5 error prevention / H3 user control and freedom / H9 recovery, which matters because phone-only thumbs three identical glyphs with no hover to tell them apart, and bot-watcher "will click anything that looks clickable"; the mis-tap is destructive, unconfirmed and strands them on a black screen where recovery means knowing the URL. For first-timer, that is the end of their ten minutes; the fix: Move Sign out into the Settings page or a named account menu rather than beside it; if it stays in the header, give the row 44px labelled targets and a confirm step. Either way, put a primary "Sign back in" button on the signed-out screen and return the member to the route they left.

_Found by expert reviews (expert 1) · high · reported 2 more times._

### 27. "+ Add an account" does not add an account: it full-reloads, drops ?account=sauron, switches the page's account to Eric, and auto-scrolls 716–1082px down into the Milestones/Onboarding chapter headed "Welcome to the league, Eric" — with no add control in sight and no link back to the account just left.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 | Frame 7 | Frame 8 |
|---|---|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

"+ Add an account" does not add an account: it full-reloads, drops ?account=sauron, switches the page's account to Eric, and auto-scrolls 716–1082px down into the Milestones/Onboarding chapter headed "Welcome to the league, Eric" — with no add control in sight and no link back to the account just left — this breaks H1 visibility of system status / H3 user control and freedom (a link must name its destination), which matters because bot-watcher and invited-friend judge a page by whose name is on it, and a tap that quietly swaps the subject and drops them mid-way through someone else's onboarding reads as the app being broken; eric, who already has accounts linked, lands in a first-timer welcome and has to re-select Sauron. For phone-only the screen simply changes under them; the fix: Open the connect-an-account step directly (a panel or dialog on this page) without reloading, without scrolling and without changing the selected account; if it must route, keep ?account=, land at the top of the destination under a heading that says "Add an account", and offer a back link to the account you came from.

_Found by expert reviews (expert 1) · high · reported 2 more times._

### 28. The header "Status" control opens a full fleet-operations board to every member: deploy commit hashes ("main (afb76b8) is the deployed commit"), "Bots deploy", "Controls bridge", "Persona gate", "1 persona(s) live", an "Open Actions" link, and six rows whose state is carried by a coloured dot plus a sentence. It takes over the screen with no visible close, is labelled "the same read-only panel for every member", and is footed "Generated 2026-10-08 19:00 UTC" — a day stale — while claiming "This page is current".

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 | Frame 7 | Frame 8 | Frame 9 | Frame 10 | Frame 11 | Frame 12 | Frame 13 | Frame 14 | Frame 15 | Frame 16 | Frame 17 | Frame 18 | Frame 19 | Frame 20 | Frame 21 | Frame 22 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

The header "Status" control opens a full fleet-operations board to every member: deploy commit hashes ("main (afb76b8) is the deployed commit"), "Bots deploy", "Controls bridge", "Persona gate", "1 persona(s) live", an "Open Actions" link, and six rows whose state is carried by a coloured dot plus a sentence. It takes over the screen with no visible close, is labelled "the same read-only panel for every member", and is footed "Generated 2026-10-08 19:00 UTC" — a day stale — while claiming "This page is current" — this breaks H2 match with the real world / H8 aesthetic and minimalist design / H10, which matters because invited-friend skips the owner's tools entirely and reads one as "I am in the wrong place"; first-timer meets four unmet concepts in their first ten minutes and closes the tab. eric asked for exactly this check by name — "a sanity/pulse check against live information sources" — and a panel whose job is freshness, which is itself a day old and says "current", is worse than none; he also cannot read the dot column; the fix: Give members a three-line version: is the market open, are the bots running, when was the last pass — with a state word beside every dot (OK / LATE / OFF) and the generated-at line at the top, in local time. Keep commits, the bridge and the persona gate behind an owner-only disclosure, add a visible close, and show per-row age with a refresh rather than a claim.

_Found by expert reviews (expert 1) · high · reported 2 more times._

### 29. The only route to a decision's reasoning is an unlabelled 22×22px chevron in the table's left gutter — below the 44px minimum, with no column header, no word and no open/closed state — while the row body, symbol and side badge are all inert. The WHY column header it belongs to is 164px off the right edge.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 | Frame 7 | Frame 8 | Frame 9 | Frame 10 | Frame 11 | Frame 12 | Frame 13 | Frame 14 | Frame 15 | Frame 16 | Frame 17 | Frame 18 | Frame 19 | Frame 20 | Frame 21 | Frame 22 | Frame 23 | Frame 24 | Frame 25 | Frame 26 | Frame 27 | Frame 28 | Frame 29 | Frame 30 | Frame 31 | Frame 32 | Frame 33 | Frame 34 | Frame 35 | Frame 36 | Frame 37 | Frame 38 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

The only route to a decision's reasoning is an unlabelled 22×22px chevron in the table's left gutter — below the 44px minimum, with no column header, no word and no open/closed state — while the row body, symbol and side badge are all inert. The WHY column header it belongs to is 164px off the right edge — this breaks H6 recognition rather than recall / H7 flexibility and efficiency, which matters because bot-watcher's entire visit is the WHY text and they will tap the symbol first, get nothing, and conclude the reasons are not published; phone-only taps one-handed with a thumb at the far screen edge and misses. The page promises "and why" in its standfirst and then hides the door; the fix: Make the whole row the disclosure target with a ≥44px hit area, keep the chevron as the affordance but put the word "Why" beside it on the first row (or as a labelled chip at the row's end), and give the gutter column a header. Show the first clause of the why inline in each collapsed row so the page is skimmable without any taps.

_Found by expert reviews (expert 1) · high · reported 1 more time._

### 30. The global nav shows "Profile" as the current section while a bot's book fills the screen, and tapping "Profile" — the page you are apparently already on — silently swaps the account from Sauron to Eric (or Jordan), resets the layout and changes the whole tab strip. The account itself is named only in a 105px picker that truncates to "Sauron · B".

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 | Frame 7 | Frame 8 | Frame 9 | Frame 10 | Frame 11 | Frame 12 | Frame 13 | Frame 14 | Frame 15 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

The global nav shows "Profile" as the current section while a bot's book fills the screen, and tapping "Profile" — the page you are apparently already on — silently swaps the account from Sauron to Eric (or Jordan), resets the layout and changes the whole tab strip. The account itself is named only in a 105px picker that truncates to "Sauron · B" — this breaks H1 where am I / H3 user control and freedom / IA labelling, which matters because invited-friend reads the name on the page to decide whether to trust it; "Profile" meaning "somebody else's bot" and then meaning "me" on the same tap teaches them the heading cannot be relied on. bot-watcher taps the lit nav item to re-orient and loses the bot they came for with no back affordance; eric loses his place mid-review; the fix: Label the active nav item by what is shown ("Accounts" on /app/accounts, "My profile" for the member's own) and put the account's name in a page heading above the tabs — breadcrumb "Profile › Sauron · Bot". Make the current section's nav item a no-op that preserves ?account=, and never change the selected account as a side effect of navigation.

_Found by expert reviews (expert 1) · high · reported 2 more times._

### 31. Opening Moneypenny reflows the whole app instead of overlaying it: the tapped button jumps 435–440px, the layout shifts 0.09–0.11, the top nav is compressed until it overflows by 85–108px (Leaderboard clipped, R&D gone) into a sideways scroller with no cue, the chart container cuts off 34px, and .desk-tiles clips 99px with overflow hidden so the CASH tile cannot be reached by any gesture.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 | Frame 7 | Frame 8 | Frame 9 | Frame 10 | Frame 11 | Frame 12 | Frame 13 | Frame 14 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

Opening Moneypenny reflows the whole app instead of overlaying it: the tapped button jumps 435–440px, the layout shifts 0.09–0.11, the top nav is compressed until it overflows by 85–108px (Leaderboard clipped, R&D gone) into a sideways scroller with no cue, the chart container cuts off 34px, and .desk-tiles clips 99px with overflow hidden so the CASH tile cannot be reached by any gesture — this breaks H4 consistency and standards / H3 user control and freedom, which matters because first-timer is told to "say hello to Moneypenny" as step two, and the act of doing so destroys the navigation they were still learning — the panel tells them to "open Trade" while the Trade link has just scrolled out of a clipped nav bar. eric asks the assistant a question about what he is looking at and the asking removes the view; part of the page becomes permanently unreachable; the fix: Render the assistant as an overlay drawer above the content (or a sheet below it) at a fixed width so the page beneath keeps its geometry; never shrink the nav below the width of its items — collapse it to a labelled menu instead — and never let .desk-tiles clip with hidden overflow.

_Found by expert reviews (expert 1) · high · reported 2 more times._

### 32. Two "Settings" links promise the bot's settings and deliver the global app Preferences page (density, tower motion, theme): the sixth tab inside the bot's own tab strip — which is also the item hidden off the right edge — and the link in the account header beside "Open as the league sees it", directly above the Sauron account row. Both land on the same place as the gear in the top bar, on a page with a different shell and no route back.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 | Frame 7 | Frame 8 | Frame 9 | Frame 10 | Frame 11 | Frame 12 | Frame 13 | Frame 14 | Frame 15 | Frame 16 | Frame 17 | Frame 18 | Frame 19 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

Two "Settings" links promise the bot's settings and deliver the global app Preferences page (density, tower motion, theme): the sixth tab inside the bot's own tab strip — which is also the item hidden off the right edge — and the link in the account header beside "Open as the league sees it", directly above the Sauron account row. Both land on the same place as the gear in the top bar, on a page with a different shell and no route back — this breaks H4 consistency and standards / H2 match with the real world; control adjacency, which matters because Every other item in that strip is bot-scoped, so bot-watcher and invited-friend read this one as Sauron's settings; being dumped on app-wide theme switches destroys their sense of where they are and reads as "I am in the wrong place". eric clicking Settings beside "Sauron · Bot" expects the bot's configuration and has to find his way back; the fix: Either make both links real per-account settings, or delete them — the gear already serves global preferences. If a global link must live in a header, put it in the icon row, not in an object's own tabs, and rename it "App settings".

_Found by expert reviews (expert 1) · high · reported 2 more times._

### 33. On Trade the brightest, largest object is a row of eight numbered dots under "MILESTONE · TRADING LADDER · 0/8 EARNED" — and it is not a progress meter, it is the order-type picker: tapping a node silently rewrites the ticket (301 turns Stock/Buy into Option/Buy-to-open/Put; 401 replaces the ticket with a multi-leg builder; 501 strips the side buttons), while the rungs' real names exist only as hover text. The nodes are 41×49px butted edge to edge, and the counter reads 0/8 on a page that also shows a filled order.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 | Frame 7 | Frame 8 | Frame 9 | Frame 10 | Frame 11 | Frame 12 | Frame 13 | Frame 14 | Frame 15 | Frame 16 | Frame 17 | Frame 18 | Frame 19 | Frame 20 | Frame 21 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

On Trade the brightest, largest object is a row of eight numbered dots under "MILESTONE · TRADING LADDER · 0/8 EARNED" — and it is not a progress meter, it is the order-type picker: tapping a node silently rewrites the ticket (301 turns Stock/Buy into Option/Buy-to-open/Put; 401 replaces the ticket with a multi-leg builder; 501 strips the side buttons), while the rungs' real names exist only as hover text. The nodes are 41×49px butted edge to edge, and the counter reads 0/8 on a page that also shows a filled order — this breaks H5 error prevention / H6 recognition rather than recall / H2, which matters because phone-only has no hover, so the most powerful control on the page is eight unlabelled dots they read as a progress bar — and they never discover that rung 202 is the covered call they came for. bot-watcher taps one out of curiosity and their draft is replaced with no notice; first-timer meets "rung" and "ladder" before either is explained and a counter that stays at zero after a visible fill reads as broken; the fix: Separate the two jobs: keep the ladder as a read-only progress strip (one line, "Rung 101 · 0/8"), and put a labelled picker next to the ticket — "What do you want to do? Buy stock · Sell a cash-secured put · Sell a covered call" — in the words traders use, with the rung number as a small badge. Space targets to 44px with gaps, and when a play rewrites a started draft, scroll the ticket into view and show "switched to 202 Sell a covered call — undo". State the rule the counter obeys.

_Found by expert reviews (expert 1) · high._

### 34. Which account an order will hit is carried only by a small picker — "Sauron", preset purely from the desk= parameter — about 300px into the page, while every ticket field and the Review button sit a full screen below it where no account name is visible; the page heading is the generic word "Trade" and the ticket heading "New trade". The Option positions card at the bottom says "Held contracts on this account" without naming it. Nothing states ownership or whether the signed-in member may submit.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 | Frame 7 | Frame 8 | Frame 9 | Frame 10 | Frame 11 | Frame 12 | Frame 13 | Frame 14 | Frame 15 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

Which account an order will hit is carried only by a small picker — "Sauron", preset purely from the desk= parameter — about 300px into the page, while every ticket field and the Review button sit a full screen below it where no account name is visible; the page heading is the generic word "Trade" and the ticket heading "New trade". The Option positions card at the bottom says "Held contracts on this account" without naming it. Nothing states ownership or whether the signed-in member may submit — this breaks H1 visibility of system status / H5 error prevention, which matters because invited-friend owns two accounts and needs "don't let me trade from anyone else's"; a shared link drops them onto a fleet bot's ticket that looks fully operable, and they find out only at submit, if at all. eric can fill the bot's book believing it is his, and at the moment of pressing Close or Review there is no name on screen at all; the fix: Put the account in the page title and the ticket heading ("Trade — Sauron (bot)"), repeat it in the Option positions heading and in the review/confirm step, and print ownership beside the picker ("Sauron · fleet bot · you can view, not trade"). For a member who does not own the account, render the ticket read-only with that sentence visible rather than rejecting at submit. Test this: open the URL as a guest.

_Found by expert reviews (expert 1) · high._

### 35. The "AT RISK — Down 116% from what you paid" card is dismissed by a 24–44px "×" labelled "Not now" — made likelier to be mis-hit by the 106px shift on that very control — and is replaced immediately by an unrelated playbook card, with "1 of 2" becoming "1 of 1", no confirmation, no undo, and no trace of where the dismissed decision went or whether it returns.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 |
|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

The "AT RISK — Down 116% from what you paid" card is dismissed by a 24–44px "×" labelled "Not now" — made likelier to be mis-hit by the 106px shift on that very control — and is replaced immediately by an unrelated playbook card, with "1 of 2" becoming "1 of 1", no confirmation, no undo, and no trace of where the dismissed decision went or whether it returns — this breaks H3 user control and freedom / H9 help users recover from errors, which matters because The at-risk line is the only piece of decision guidance on the page and the one thing eric says he comes for; he reviews on a phone while travelling, where a single accidental tap removes it with no way back and no statement of whether "not now" means today or the session; the fix: Make dismissal reversible: leave a one-line stub in the same slot — "Dismissed CRWV $80 PUT · Undo" — for the rest of the session, and say in the card footer where dismissed decisions go ("comes back tomorrow").

_Found by expert reviews (expert 1) · high · reported 1 more time._

### 36. History is written two different ways, so Back is a coin toss: section switches, span changes, date changes and every filter chip use replaceState (Back leaves the page entirely instead of undoing the change), while the Activity anchors and the already-active tabs use pushState — the latter adding dead entries at the identical URL so a Back press appears to do nothing.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 | Frame 7 | Frame 8 | Frame 9 | Frame 10 | Frame 11 | Frame 12 | Frame 13 | Frame 14 | Frame 15 | Frame 16 | Frame 17 | Frame 18 | Frame 19 | Frame 20 | Frame 21 | Frame 22 | Frame 23 | Frame 24 | Frame 25 | Frame 26 | Frame 27 | Frame 28 | Frame 29 | Frame 30 | Frame 31 | Frame 32 | Frame 33 | Frame 34 | Frame 35 | Frame 36 | Frame 37 | Frame 38 | Frame 39 | Frame 40 | Frame 41 | Frame 42 | Frame 43 | Frame 44 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

History is written two different ways, so Back is a coin toss: section switches, span changes, date changes and every filter chip use replaceState (Back leaves the page entirely instead of undoing the change), while the Activity anchors and the already-active tabs use pushState — the latter adding dead entries at the identical URL so a Back press appears to do nothing — this breaks H3 user control and freedom, which matters because bot-watcher's third stated need is literally "get back to where I came from" and on a phone Back is the universal undo; a member who filters to "Losing", finds nothing and swipes back loses Sauron rather than the filter, and after four tab taps Back behaves as if none of them happened; the fix: Pick one rule — push history for anything that changes what the page is showing, and never push for a no-op — so Back walks sections and clears one filter at a time; render the active tab as a non-navigating current item (aria-current, no href); and keep the chosen chip in sync when the member navigates back.

_Found by expert reviews (expert 1) · high · reported 2 more times._

### 37. Nothing returns a member to where they came from. There is no breadcrumb on either bot page; "Full leaderboard ›", "Everyone's lines ›" and "Full pulse ↗" all leave one-way with scroll reset to 0 and no trace of the account just left; the global Leaderboard tab lands on a default sort (?by=equity) rather than the list state the member left; and the one page that does it right — Trade's "← Back to Jordan" — names an account that was never visited when arriving from Sauron, while Trade's own "← Back to Sauron" sits above the h1 and pushes forward rather than going back.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 | Frame 7 | Frame 8 | Frame 9 | Frame 10 | Frame 11 | Frame 12 | Frame 13 | Frame 14 | Frame 15 | Frame 16 | Frame 17 | Frame 18 | Frame 19 | Frame 20 | Frame 21 | Frame 22 | Frame 23 | Frame 24 | Frame 25 | Frame 26 | Frame 27 | Frame 28 | Frame 29 | Frame 30 | Frame 31 | Frame 32 | Frame 33 | Frame 34 | Frame 35 | Frame 36 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

Nothing returns a member to where they came from. There is no breadcrumb on either bot page; "Full leaderboard ›", "Everyone's lines ›" and "Full pulse ↗" all leave one-way with scroll reset to 0 and no trace of the account just left; the global Leaderboard tab lands on a default sort (?by=equity) rather than the list state the member left; and the one page that does it right — Trade's "← Back to Jordan" — names an account that was never visited when arriving from Sauron, while Trade's own "← Back to Sauron" sits above the h1 and pushes forward rather than going back — this breaks H3 user control and freedom / IA navigation — where am I, how do I get back, which matters because bot-watcher's third need is getting back, and returning-trader's closing need is "put me back on my book when I'm done"; the app proves it knows the pattern on Trade and then does not use it, mis-names it, or resets the sort so a member who had ordered the field by 1M return must redo it on every bot they open; the fix: Carry the referrer: put a "‹ Leaderboard" / "‹ Sauron" / "‹ Your accounts" crumb above the heading of every page entered from a desk, restoring the origin's query string and scroll position and naming the actual origin. Mark Leaderboard as the active nav section for /app/u/*.

_Found by expert reviews (expert 1) · high · reported 2 more times._

### 38. Tapping "Trade" in the top nav while already on Trade discards every URL parameter and silently switches the account from Sauron to Eric: the chart disappears, the back-link becomes "← Back to Eric", the calendar line changes, and the contract is gone — with no confirmation, no notice and no undo.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 |
|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

Tapping "Trade" in the top nav while already on Trade discards every URL parameter and silently switches the account from Sauron to Eric: the chart disappears, the back-link becomes "← Back to Eric", the calendar line changes, and the contract is gone — with no confirmation, no notice and no undo — this breaks H5 error prevention / H3 user control and freedom, which matters because bot-watcher clicks whatever is nearest and returning-trader taps the section name to get back to the ticket; both end up on a different person's book with the contract lost. invited-friend, who decides by the name on the page, will not notice the account changed under them; the fix: Make the current section's nav item a no-op (or a scroll-to-top) that preserves desk/symbol/strike/exp, and never change the active account as a side effect of navigation — an account change should come only from the account control, and should be announced inline with an undo.

_Found by expert reviews (expert 1) · high._

### 39. "See plays that fit your playbooks ↗" and the FORM row's win/loss ticks are in-page jumps dressed as page changes: the first uses the external-link arrow, scrolls 743–835px on its own and switches both section and chapter (?section=milestones&chapter=playbooks) to land on three cards all marked LOCKED with "Nothing arms yet"; the ticks silently switch section and scroll 172–307px to land mid-table with the requested row clipped and unhighlighted. "Show in table" jumps 393px and leaves the decision card it came from entirely out of view with no route back.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 | Frame 7 | Frame 8 | Frame 9 | Frame 10 | Frame 11 | Frame 12 | Frame 13 | Frame 14 | Frame 15 | Frame 16 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

"See plays that fit your playbooks ↗" and the FORM row's win/loss ticks are in-page jumps dressed as page changes: the first uses the external-link arrow, scrolls 743–835px on its own and switches both section and chapter (?section=milestones&chapter=playbooks) to land on three cards all marked LOCKED with "Nothing arms yet"; the ticks silently switch section and scroll 172–307px to land mid-table with the requested row clipped and unhighlighted. "Show in table" jumps 393px and leaves the decision card it came from entirely out of view with no route back — this breaks H3 user control and freedom / H1 / H2 — the promise and the destination do not match, which matters because phone-only reads above the fold and then taps; being teleported eight screens into a different section with no "back to where I was" means a second visit. bot-watcher clicks a tick expecting to see that trade and cannot tell whether the click worked; returning-trader loses the card that explained the row they are now staring at, and must remember the strike and the loss figure from the previous screen; the fix: Drop the ↗ for in-page jumps and relabel to what is actually there ("See the playbooks you can unlock" — saying so if all are locked); offset anchors below the sticky header and highlight the target row for a few seconds; keep the decision card visible while its row is highlighted (scroll the blotter inside its own container) or add "↑ Back to the decision" beside the row.

_Found by expert reviews (expert 1) · moderate._

### 40. The overview card stacks eight unrelated blocks with no headings and no consistent treatment for "this is a link" — net worth, three hover-only stats, "Where your money is", cash ready to use, a playbooks link, time decay, market exposure — and the decision card's own controls come at four different sizes and weights: "Review on Trade ↗" (139×35 filled), "Show in table" (108×35 outlined), "✦ Why, and details ▾" (116×15 bare text), a 24px dismiss ×, and 30px carousel arrows that wrap silently from 1 of 2 to 2 of 2 with only a small counter changing.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 | Frame 7 | Frame 8 | Frame 9 |
|---|---|---|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

The overview card stacks eight unrelated blocks with no headings and no consistent treatment for "this is a link" — net worth, three hover-only stats, "Where your money is", cash ready to use, a playbooks link, time decay, market exposure — and the decision card's own controls come at four different sizes and weights: "Review on Trade ↗" (139×35 filled), "Show in table" (108×35 outlined), "✦ Why, and details ▾" (116×15 bare text), a 24px dismiss ×, and 30px carousel arrows that wrap silently from 1 of 2 to 2 of 2 with only a small counter changing — this breaks Cognitive excise / H6 recognition rather than recall / H4 consistency, which matters because phone-only gets one screen and one thing, and here the first screen offers nine tappable-looking items of which only one leads anywhere useful, with nothing distinguishing a label from a control; a 15px text control and a 24px × are below a comfortable one-handed target, and bot-watcher concludes the carousel arrows are random rather than a two-item loop; the fix: Give each block a small heading, use one visual treatment for links and leave plain text plain, drop the stats whose only purpose was a hover tooltip, bring every control in the decision card to a 44px touch height with one filled button per card, and either disable the carousel arrow at each end with a visible reason or replace the arrows with two dots.

_Found by expert reviews (expert 1) · moderate._

### 41. Each blotter row hides three unlabelled expanders that do different things — a 22px caret opens a metrics strip, the "3 buys" lot-count text opens the fills, "Close all" opens a quantity form — none of which look like controls before you click, none of which mark themselves as expanded, and none of which offer a close; the inserted lot rows carry a timestamp and numbers but no symbol. "+ New view" likewise swaps the chip row for a "Name this view…" field with a dimmed Save button, no cancel, and no sentence saying what a view saves.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 | Frame 7 | Frame 8 | Frame 9 | Frame 10 | Frame 11 | Frame 12 | Frame 13 | Frame 14 | Frame 15 | Frame 16 | Frame 17 | Frame 18 | Frame 19 | Frame 20 | Frame 21 | Frame 22 | Frame 23 | Frame 24 | Frame 25 | Frame 26 | Frame 27 | Frame 28 | Frame 29 | Frame 30 | Frame 31 | Frame 32 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

Each blotter row hides three unlabelled expanders that do different things — a 22px caret opens a metrics strip, the "3 buys" lot-count text opens the fills, "Close all" opens a quantity form — none of which look like controls before you click, none of which mark themselves as expanded, and none of which offer a close; the inserted lot rows carry a timestamp and numbers but no symbol. "+ New view" likewise swaps the chip row for a "Name this view…" field with a dimmed Save button, no cancel, and no sentence saying what a view saves — this breaks H6 recognition rather than recall / H3 user control and freedom / H10, which matters because bot-watcher clicks whatever looks clickable and cannot predict which of three adjacent targets gives the fills; phone-only has no hover, so a pill reading "3 buys" gives no hint it opens anything, a greyed Save button with nothing beside it reads as broken rather than as waiting for a name, and once in naming mode there is no marked way out; the fix: One expansion per row with a visible chevron and a pressed state, revealing metrics and fills together with the symbol repeated on the lot rows; keep the close form a separate clearly-labelled action. Add an × beside Save view, a one-line hint under the field ("Name it to save — this view remembers your current filters"), and enable the button on the first character.

_Found by expert reviews (expert 1) · moderate · reported 2 more times._

### 42. The feed shows ten or eleven rows ending at Sep 15 with no total count, no date range, no paging and no end-of-list marker, so it is impossible to tell whether this is Sauron's whole history or the newest page of it — on a page whose standfirst says "every order this account placed".

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 |
|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

The feed shows ten or eleven rows ending at Sep 15 with no total count, no date range, no paging and no end-of-list marker, so it is impossible to tell whether this is Sauron's whole history or the newest page of it — on a page whose standfirst says "every order this account placed" — this breaks H1 visibility of system status, which matters because Someone who heard Sauron had a bad week needs to know the list is complete before concluding anything from it; an unmarked truncation makes the bot look as though it stopped trading in September; the fix: State the count and span under the heading ("47 orders · Sep 15 – Oct 6") and add explicit paging or an end-of-list marker.

_Found by expert reviews (expert 1) · moderate._

### 43. The playbook filter chips are bare codes with no counts and no explanation — CRWV-WHEEL, HC-SAURON, SAURON, and in the play-tag select S1-NVDA, G1-GOOG, TACO-DJT, NVDA-CALL-SPREAD — and one of them shares the account's own name, so "SAURON" reads as "everything by Sauron" rather than one strategy among several. Their definitions live on a different tab.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 | Frame 7 | Frame 8 | Frame 9 | Frame 10 | Frame 11 | Frame 12 | Frame 13 | Frame 14 | Frame 15 | Frame 16 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

The playbook filter chips are bare codes with no counts and no explanation — CRWV-WHEEL, HC-SAURON, SAURON, and in the play-tag select S1-NVDA, G1-GOOG, TACO-DJT, NVDA-CALL-SPREAD — and one of them shares the account's own name, so "SAURON" reads as "everything by Sauron" rather than one strategy among several. Their definitions live on a different tab — this breaks H2 match with the real world / H6 recognition rather than recall, which matters because eric skips a menu of coined names and invited-friend and first-timer have met none of these identifiers, so the field becomes a wall they step around and lines get posted untagged — the grouping data eric wants never fills; bot-watcher filtering by "SAURON" believes they have widened to everything when they have narrowed; the fix: Show each as a human name with the code secondary ("CRWV wheel — covered calls on CRWV · CRWV-WHEEL"), put the playbook's one-line purpose on the chip itself with a count, rename the self-titled playbook so no strategy shares the account name, and pre-select the play matching the position the member is looking at.

_Found by expert reviews (expert 1) · moderate._

### 44. A decorative layer (div.char-blend, the "LEAGUE · 1M RETURN" block) sits over the decision card's action row, so the centres of "Previous decision", "Review on Trade ↗" and "Next decision" are not tappable — all three taps landed on the div and the buttons render washed-out behind it. The same defect covers the centre of the "CRWV $80 PUT" position row and the "New trade" card at 390px, where taps land on the league overlay and nothing happens.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 | Frame 7 | Frame 8 | Frame 9 | Frame 10 | Frame 11 | Frame 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

A decorative layer (div.char-blend, the "LEAGUE · 1M RETURN" block) sits over the decision card's action row, so the centres of "Previous decision", "Review on Trade ↗" and "Next decision" are not tappable — all three taps landed on the div and the buttons render washed-out behind it. The same defect covers the centre of the "CRWV $80 PUT" position row and the "New trade" card at 390px, where taps land on the league overlay and nothing happens — this breaks H5 error prevention (a control that looks pressable but is not) with H1 visibility of system status, which matters because The decision card is the only guidance on the page and the only exit returning-trader has from guidance to a ticket; bot-watcher is the first to notice a button that does nothing and says a control that renders then fails costs more trust than a greyed one with a reason; the fix: Set pointer-events:none on the char-blend and league overlay layers and lower their z-index below the card and list action rows; then re-run the control census and confirm every button reports hit != null, including the centre of every position row at 390.

_Found by expert reviews (expert 2) · critical · reported 1 more time._

### 45. At least a dozen controls render as buttons and produce no visible change when operated: WIN RATE, PROFIT FACTOR, MAX DRAWDOWN, Time decay, Market exposure, LOCKED IN, ON PAPER, "locked in" in the net-worth line, the "All positions" saved view, the "All" chip, the EXPIRES IN column header (the only header that is a button at all), and four table headers whose definitions appear to be hover-only.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 | Frame 7 | Frame 8 | Frame 9 | Frame 10 | Frame 11 | Frame 12 | Frame 13 | Frame 14 | Frame 15 | Frame 16 | Frame 17 | Frame 18 | Frame 19 | Frame 20 | Frame 21 | Frame 22 | Frame 23 | Frame 24 | Frame 25 | Frame 26 | Frame 27 | Frame 28 | Frame 29 | Frame 30 | Frame 31 | Frame 32 | Frame 33 | Frame 34 | Frame 35 | Frame 36 | Frame 37 | Frame 38 | Frame 39 | Frame 40 | Frame 41 | Frame 42 | Frame 43 | Frame 44 | Frame 45 | Frame 46 | Frame 47 | Frame 48 | Frame 49 | Frame 50 | Frame 51 | Frame 52 | Frame 53 | Frame 54 | Frame 55 | Frame 56 | Frame 57 | Frame 58 | Frame 59 | Frame 60 | Frame 61 | Frame 62 | Frame 63 | Frame 64 | Frame 65 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

At least a dozen controls render as buttons and produce no visible change when operated: WIN RATE, PROFIT FACTOR, MAX DRAWDOWN, Time decay, Market exposure, LOCKED IN, ON PAPER, "locked in" in the net-worth line, the "All positions" saved view, the "All" chip, the EXPIRES IN column header (the only header that is a button at all), and four table headers whose definitions appear to be hover-only — this breaks H1 visibility of system status; H10 (help that exists only on hover does not exist); H4 consistency, which matters because phone-only has no hover, so a dozen controls simply read as broken on the first screen — and these are precisely the terms a newcomer needs defined (profit factor, locked in, on paper, breakeven, decay); bot-watcher, who notices dead buttons first, loses trust in the numbers beside them; the fix: Make each label's tap open an inline definition panel beneath the figure (the same text the hover shows), or strip the button role and render it as plain text; give every column header a real sort with a visible arrow, and never attach meaning to hover alone.

_Found by expert reviews (expert 2) · high._

### 46. Standing is carried by hue alone in a dozen places: the league bars, the equity curves (the only difference between Eric's chart and Sauron's is green versus red), the breakeven gradient ramp, the AT RISK stripe, the In profit/Losing chips, the Events calendar's four dot states, the chart legend's two colour swatches, the "WHERE YOUR MONEY IS" striped bar with no legend or labels, and every status dot. Where a +/− sign or a word is present it rescues the figure; the bars, stripes, ramps and dots have no second channel at all.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 | Frame 7 | Frame 8 | Frame 9 | Frame 10 | Frame 11 | Frame 12 | Frame 13 | Frame 14 | Frame 15 | Frame 16 | Frame 17 | Frame 18 | Frame 19 | Frame 20 | Frame 21 | Frame 22 | Frame 23 | Frame 24 | Frame 25 | Frame 26 | Frame 27 | Frame 28 | Frame 29 | Frame 30 | Frame 31 | Frame 32 | Frame 33 | Frame 34 | Frame 35 | Frame 36 | Frame 37 | Frame 38 | Frame 39 | Frame 40 | Frame 41 | Frame 42 | Frame 43 | Frame 44 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

Standing is carried by hue alone in a dozen places: the league bars, the equity curves (the only difference between Eric's chart and Sauron's is green versus red), the breakeven gradient ramp, the AT RISK stripe, the In profit/Losing chips, the Events calendar's four dot states, the chart legend's two colour swatches, the "WHERE YOUR MONEY IS" striped bar with no legend or labels, and every status dot. Where a +/− sign or a word is present it rescues the figure; the bars, stripes, ramps and dots have no second channel at all — this breaks H4 consistency and standards — status encoded in a channel this member cannot read, which matters because eric is red/green colourblind and is the only standing reviewer, judging shipped visuals on the live route on his phone; a losing bot and a winning bot look the same to him at a glance, which defeats the five-second read these pages exist for; the fix: Add a second channel everywhere status is coloured — ▲/▼ glyphs on percentages, filled vs hollow markers on bars and chart endpoints, a word in every chip, a distinct shape per calendar state repeated in the legend, direction from a zero line on bars, and inline name+percentage labels on the money bar. Verify with a greyscale render of each page before shipping: if you cannot tell which account is losing, it is not fixed.

_Found by expert reviews (expert 2) · high._

### 47. The row action slot is inconsistent and dangerous: the two share rows put "Guidance" (a safe read) at x=722, and the option row directly beneath puts "Close" — a destructive position-closing control — at the same x, same 105×36 size, same shape. The one position with a strike, an expiry and a decaying premium is also the only row with no guidance offered, and no sentence says why. The confirm panel that follows renders inside the sideways-scrolled blotter, so its subject line is clipped ("…+$1,856 total P/L", "T · 6 NOV 26").

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 | Frame 7 | Frame 8 | Frame 9 | Frame 10 | Frame 11 | Frame 12 | Frame 13 | Frame 14 | Frame 15 | Frame 16 | Frame 17 | Frame 18 | Frame 19 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

The row action slot is inconsistent and dangerous: the two share rows put "Guidance" (a safe read) at x=722, and the option row directly beneath puts "Close" — a destructive position-closing control — at the same x, same 105×36 size, same shape. The one position with a strike, an expiry and a decaying premium is also the only row with no guidance offered, and no sentence says why. The confirm panel that follows renders inside the sideways-scrolled blotter, so its subject line is clipped ("…+$1,856 total P/L", "T · 6 NOV 26") — this breaks H5 error prevention with H4 consistency and H9 (a destructive confirmation you cannot read), which matters because returning-trader's errand is the option decision; having clicked Guidance twice at that spot, the third click starts closing a position they came to read about — and the confirmation that should save them has its subject cut off at the box edge; the fix: Give destructive actions their own column and a danger treatment so "read" and "close" never share an x-position; show the same action set on every row, disabling the inapplicable one with a visible reason rather than swapping the button; and render the confirm panel outside the horizontal scroller, full width, naming the position and quantity in words.

_Found by expert reviews (expert 2) · high · reported 1 more time._

### 48. Of the six chart ranges only 7D visibly redraws. 1M changes nothing at all (identical text hash), and 3M, 1Y, YTD and ALL all draw a line of exactly the same shape with the same "your high $1,003,412 · 9/9" legend — consistent with the table where 1M, 3M and 1Y all read −0.64%, i.e. the account has about a month of history. Nothing says so.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 | Frame 7 | Frame 8 | Frame 9 | Frame 10 | Frame 11 | Frame 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

Of the six chart ranges only 7D visibly redraws. 1M changes nothing at all (identical text hash), and 3M, 1Y, YTD and ALL all draw a line of exactly the same shape with the same "your high $1,003,412 · 9/9" legend — consistent with the table where 1M, 3M and 1Y all read −0.64%, i.e. the account has about a month of history. Nothing says so — this breaks H1 visibility of system status, which matters because bot-watcher opened this page because Sauron had a bad week and is trying to see whether the week is noise or a trend; four buttons that appear to do nothing read as a broken page, and the real answer — there is not enough history yet — is never stated; the fix: When a range exceeds the account's history, keep the button pressable but caption the chart ("only 23 days of history — showing all of it"); if a range truly has no distinct data, grey it with that sentence beside it. Test whether the series is genuinely identical or the range filter is simply not applied.

_Found by expert reviews (expert 2) · high._

### 49. A decorative tower illustration holds the right third of the window (≈190–470px of 1280, roughly 37%) top-to-bottom on every page and in every frame, while the content column beside it clips tables by 99–164px, prints one column header over another, pushes the league standing and the council composer below the fold, and on sparse sections (Feedback) stretches to full height beside two sentences and one button.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 | Frame 7 | Frame 8 | Frame 9 | Frame 10 | Frame 11 | Frame 12 | Frame 13 | Frame 14 | Frame 15 | Frame 16 | Frame 17 | Frame 18 | Frame 19 | Frame 20 | Frame 21 | Frame 22 | Frame 23 | Frame 24 | Frame 25 | Frame 26 | Frame 27 | Frame 28 | Frame 29 | Frame 30 | Frame 31 | Frame 32 | Frame 33 | Frame 34 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

A decorative tower illustration holds the right third of the window (≈190–470px of 1280, roughly 37%) top-to-bottom on every page and in every frame, while the content column beside it clips tables by 99–164px, prints one column header over another, pushes the league standing and the council composer below the fold, and on sparse sections (Feedback) stretches to full height beside two sentences and one button — this breaks H8 aesthetic and minimalist design — decoration consuming the width the data needs, which matters because eric's named value is to "gain the screen real estate on the left to elevate design to something way more engaging, fun, and ultimately useful". The art delivers the engaging half; the cost is that the only grid on the page cannot fit and the two functional things in that column get cropped. This reports the consequence, not a preference on the art; the fix: Cap the art at a bounded band (≈320px) or move it behind the content, let the blotter and its expanded panels span the full content width, and make that column pay its rent with live content — the bot's standing call, its next scheduled pass, or the selected trade's reasoning in a master–detail layout. Test at 1280 and 390 and measure scrollWidth vs clientWidth after the change.

_Found by expert reviews (expert 2) · high._

### 50. Reached from the R&D rail link, the destination document is 487px wide in a 390px window — the whole page scrolls sideways — and it shifts 0.052 on arrival.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 | Frame 7 | Frame 8 | Frame 9 |
|---|---|---|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

Reached from the R&D rail link, the destination document is 487px wide in a 390px window — the whole page scrolls sideways — and it shifts 0.052 on arrival — this breaks H4 consistency and standards; phone-only's "never make me scroll sideways", which matters because phone-only's one hard rule is broken at the document level, not in one widget: content is off the right edge of every screen of that route, which reads as the app being broken rather than the page being wide; the fix: Find the fixed-width child on /app/research (the filter chip row or the call-board grid are the likely culprits) and let it wrap or scroll inside its own box; the document must never exceed 100vw. Verify on the R&D batch.

_Found by expert reviews (expert 2) · high · reported 1 more time._

### 51. The sticky chrome stack (brand nav + account switch + tab row + market calendar, ≈140–179px, 21% of an 844px viewport) overlays page content and swallows controls: the harness recorded "Next decision" covered by the session pill, "Not now" covered by the Settings link, "✦ Why, and details ▾" and "Show in table" covered by the account switch, "List" covered by the Activity tab, the play select parked underneath div.cockpit-head, and decision-card numbers bleeding half-visible behind the header.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 | Frame 7 | Frame 8 | Frame 9 | Frame 10 | Frame 11 | Frame 12 | Frame 13 | Frame 14 | Frame 15 | Frame 16 | Frame 17 | Frame 18 | Frame 19 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

The sticky chrome stack (brand nav + account switch + tab row + market calendar, ≈140–179px, 21% of an 844px viewport) overlays page content and swallows controls: the harness recorded "Next decision" covered by the session pill, "Not now" covered by the Settings link, "✦ Why, and details ▾" and "Show in table" covered by the account switch, "List" covered by the Activity tab, the play select parked underneath div.cockpit-head, and decision-card numbers bleeding half-visible behind the header — this breaks H1 visibility of system status with H5 error prevention (an in-page jump target lands under a fixed overlay), which matters because "Why, and details" is the link eric and returning-trader actually want and it is the one the header eats whenever the table is in view; a control visible at one scroll position and unreachable at another reads as flakiness, and on a phone a control under the header cannot be tapped at all; the fix: Set scroll-margin-top equal to the full sticky stack height on every anchor target, collapse the market strip into the title bar on scroll (or cap the sticky stack at one row), and give the header an opaque background.

_Found by expert reviews (expert 2) · high._

### 52. All guidance on the route is per-position: a two-card carousel about one option each, dismissible to zero, plus per-row Guidance links. Nothing anywhere answers what to execute across the book, how to rebalance it, when to take profit, or when to wait — and a decision panel ends at the explanation ("AMZN reached the tranche's target; taking it") with no way to act on, mirror or copy it.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 | Frame 7 | Frame 8 | Frame 9 |
|---|---|---|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

All guidance on the route is per-position: a two-card carousel about one option each, dismissible to zero, plus per-row Guidance links. Nothing anywhere answers what to execute across the book, how to rebalance it, when to take profit, or when to wait — and a decision panel ends at the explanation ("AMZN reached the tranche's target; taking it") with no way to act on, mirror or copy it — this breaks Information architecture — organisation (content grouped by instrument, not by the decision the member came to make); H7 flexibility, which matters because eric named four decisions and all four are whole-book decisions; this is the page where he reviews the book, and today he must synthesise them himself from a carousel, a cash block and a blotter. This is the half of the need the app does not have, and the page's shape currently hides that it is missing; the fix: Add a book-level band above the positions that rolls the per-position cards up into the four named decisions (execute / rebalance / take profit / wait), each with a count, a call line and its own freshness stamp, with the per-position cards as expandable evidence; add one action to each decision panel ("Mirror this on my book" opening Trade prefilled) and rename "the whole pass" to say where it goes.

_Found by expert reviews (expert 2) · high._

### 53. "Activity" names two different destinations visible at the same moment, 40–240px apart, and both can read as current: the global rail item goes to /app/activity, the whole league's feed, silently dropping ?account=sauron with no breadcrumb on the destination; the section tab is this account's blotter.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 | Frame 7 | Frame 8 | Frame 9 | Frame 10 | Frame 11 | Frame 12 | Frame 13 | Frame 14 | Frame 15 | Frame 16 | Frame 17 | Frame 18 | Frame 19 | Frame 20 | Frame 21 | Frame 22 | Frame 23 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

"Activity" names two different destinations visible at the same moment, 40–240px apart, and both can read as current: the global rail item goes to /app/activity, the whole league's feed, silently dropping ?account=sauron with no breadcrumb on the destination; the section tab is this account's blotter — this breaks H4 consistency and standards; IA labelling, which matters because returning-trader navigates by the house shape ("Activity is what happened") and bot-watcher taps the biggest nearest word; they tap the rail expecting Sauron's box score, land in everyone's feed, and have lost the bot entirely — the one thing they came for; the fix: Rename one by scope — the rail becomes "League" or "Feed", the section tab becomes "Sauron's orders" — never mark the global tab current on an /app/u/* route, and add a "Sauron ›" breadcrumb whenever the league feed is entered from an account page.

_Found by expert reviews (expert 2) · high · reported 1 more time._

### 54. The last three closes — the richest fact on the page, per their accessible names "Closed 9/24, win: AMZN, +$516", "Closed 9/29, loss: TSLA, −$230", "Closed 10/1, win: META, +$285" — are drawn as three unlabelled 26×22 ✓/✗ glyphs in the FORM row, with no ticker, no amount and nothing marking them as links. Tapping one jumps to section=activity, scrolls 172–307px, lands mid-table with the top row sliced under the calendar strip, and gives the requested row no highlight at all.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 | Frame 7 |
|---|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

The last three closes — the richest fact on the page, per their accessible names "Closed 9/24, win: AMZN, +$516", "Closed 9/29, loss: TSLA, −$230", "Closed 10/1, win: META, +$285" — are drawn as three unlabelled 26×22 ✓/✗ glyphs in the FORM row, with no ticker, no amount and nothing marking them as links. Tapping one jumps to section=activity, scrolls 172–307px, lands mid-table with the top row sliced under the calendar strip, and gives the requested row no highlight at all — this breaks H6 recognition rather than recall with H1 (information hidden rather than minimised) and H3, which matters because bot-watcher reads a bot like a box score — the box score is here but encoded in three glyphs — and then asks for one trade and gets a wall of eight rows with no marker on the one they asked for, having lost their place on Overview with no way back to it; the fix: Render the three closes as labelled chips ("AMZN +$516 · 9/24") that are obviously links, keeping ✓/✗ as a shape prefix since eric is colourblind; offset the jump anchor by the sticky header, highlight the target row persistently with a caption, and restore Overview's scroll when the Overview tab is pressed.

_Found by expert reviews (expert 2) · high · reported 1 more time._

### 55. Sauron's own league row is the one that falls below the fold on Sauron's own page — the league card sits at the bottom of the right rail under the illustration and rank 3 (Sauron, −8.64%) is sliced in half at default scroll — while the page header simultaneously says "Beating" with no comparator.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 |
|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

Sauron's own league row is the one that falls below the fold on Sauron's own page — the league card sits at the bottom of the right rail under the illustration and rank 3 (Sauron, −8.64%) is sliced in half at default scroll — while the page header simultaneously says "Beating" with no comparator — this breaks Information architecture — organisation and navigation (the page's subject should be visible on the page); H1, which matters because bot-watcher opened this page because they heard Sauron had a bad week, and the −8.64% line that answers that is the only league row not on screen; the header's unexplained "Beating" contradicts it without reconciling the two; the fix: Anchor the league card on the subject account — show Sauron's row and rank first with the leader for contrast — or surface its rank into the top stat strip, and write the standing as a sentence ("Beating the field by +1.8% this month") rather than a bare word.

_Found by expert reviews (expert 2) · high._

### 56. The permission sentence "You can trade only your own accounts." floats alone between the tiles and the view chips, ~120–380px from the row-level Guidance buttons and ticket links it is the only explanation of; the "New trade" card's reassurance names "the gate" ("the gate reviews before anything is sent") as if it were known.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 | Frame 7 | Frame 8 | Frame 9 |
|---|---|---|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

The permission sentence "You can trade only your own accounts." floats alone between the tiles and the view chips, ~120–380px from the row-level Guidance buttons and ticket links it is the only explanation of; the "New trade" card's reassurance names "the gate" ("the gate reviews before anything is sent") as if it were known — this breaks Information architecture — a control's label must sit next to what it affects; H10 help and documentation, which matters because invited-friend is the person who needs this sentence and skips body copy — placed where it is, the one line that answers "can I touch this?" is read before any button exists and forgotten by the time one appears; first-timer stops at an unexplained proper noun in the sentence meant to reassure them; the fix: Move the sentence into the row-action area or onto the affordance itself ("Guidance — read-only, this is Sauron's book") and drop the free-floating line; say what happens instead of naming a mechanism ("Nothing is sent until you review and confirm").

_Found by expert reviews (expert 2) · moderate · reported 1 more time._

### 57. One quantity has several names across adjacent screens: "ON PAPER" on the desk, "TOTAL P/L" in the table over the same money, "NET REALIZED … booked, not on paper" on Pulse, "Unrealized" on the leaderboard, and "DAY P/L" versus "TODAY"; the rail widget offers two metrics (1M, Equity) while the leaderboard offers five with different names, and "1M" appears twice on one bot page meaning two different things.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 | Frame 7 | Frame 8 | Frame 9 | Frame 10 | Frame 11 | Frame 12 | Frame 13 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

One quantity has several names across adjacent screens: "ON PAPER" on the desk, "TOTAL P/L" in the table over the same money, "NET REALIZED … booked, not on paper" on Pulse, "Unrealized" on the leaderboard, and "DAY P/L" versus "TODAY"; the rail widget offers two metrics (1M, Equity) while the leaderboard offers five with different names, and "1M" appears twice on one bot page meaning two different things — this breaks H4 consistency and standards; IA labelling, which matters because invited-friend and first-timer must hold a translation table in their heads to compare a bot page with the leaderboard they just left — memory waste for no gain; a member clicking through from the widget must re-map labels to find the view they were looking at; and "on paper" collides with "paper account", which means something else entirely here; the fix: Pick one name per quantity app-wide — Today, Total P/L, unrealised, booked — reserve "paper" for the account type, use identical metric labels in the widget and the leaderboard, and carry the widget's current metric through the link as a query parameter.

_Found by expert reviews (expert 2) · moderate._

### 58. Expanding a decision changes nothing in the URL, so an opened explanation cannot be linked, shared or returned to after a reload, and the "the whole pass" link inside it does not say where it goes.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 |
|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

Expanding a decision changes nothing in the URL, so an opened explanation cannot be linked, shared or returned to after a reload, and the "the whole pass" link inside it does not say where it goes — this breaks H3 user control and freedom; H7 flexibility, which matters because bot-watcher follows bots the way people follow a fantasy league — the natural next act after reading "META panic −0.58 has stopped falling; claiming a tranche" is to send it to someone, and there is nothing to send; the fix: Give each decision a hash route (#order-2026-10-01-meta) that opens the panel and scrolls to it on load, add a copy-link affordance inside the open panel, and rename the link to say where it leads ("See all 7 candidates from this pass").

_Found by expert reviews (expert 2) · moderate._

### 59. On the council page the right half is the tower illustration and the composer sits in a narrow card on the left, while the feed itself is one line of empty state ("Nobody's spoken yet this week — be the first."); the same composer already exists in the account rail with no indication the two are one object.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 |
|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

On the council page the right half is the tower illustration and the composer sits in a narrow card on the left, while the feed itself is one line of empty state ("Nobody's spoken yet this week — be the first."); the same composer already exists in the account rail with no indication the two are one object — this breaks H8 aesthetic and minimalist design; posture, which matters because eric wants this real estate elevated to something engaging and useful, and a full-width page spending half its area on art to hold one sentence is the opposite of the tighter grouping he asked for; two live composers also mean two places to check whether you already posted; the fix: Give the feed the full measure with one composer pinned at the top, show last week's lines when this week is empty so the page is never blank, and reduce the account-page instance to a one-line status link.

_Found by expert reviews (expert 2) · moderate · reported 1 more time._

### 60. The leaderboard calls itself a leaderboard while the subtitle says "Figures, not placings", there are no 1-2-3 positions on screen, the "THE MATCH · LIVE · 94% Bots" bar is a meter with no stated scale, "Bots lead on total equity by $873,275" sits as plain text between two cards attached to neither, and the standing bars encode rank by hue alone.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 |
|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

The leaderboard calls itself a leaderboard while the subtitle says "Figures, not placings", there are no 1-2-3 positions on screen, the "THE MATCH · LIVE · 94% Bots" bar is a meter with no stated scale, "Bots lead on total equity by $873,275" sits as plain text between two cards attached to neither, and the standing bars encode rank by hue alone — this breaks H2 match with the real world; IA organisation and labelling, which matters because invited-friend's third need is "show me the league" and bot-watcher arrives to find Sauron; a board that disclaims placings and shows an unscaled meter answers neither, and eric cannot read the bars at all; the fix: Either show placings or rename the page to what it is; give the match bar a stated scale and an axis; attach the "bots lead" sentence to the card it describes; and encode standing by length plus a number rather than hue.

_Found by expert reviews (expert 2) · moderate._

### 61. The owner's private writing tools sit in the middle of a bot's page: "YOUR COUNCIL LINE · One line, once a week — yours as a member, not this account's", a free-text box prompting "I think NVDA runs, because…", "Tag your bot's play (optional)", Commit and "Everyone's lines ›" — on a page headed NET WORTH · SAURON, with the body copy also reading "WHERE YOUR MONEY IS", "96.5% of your account" and "You lead the league".

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 | Frame 7 | Frame 8 | Frame 9 | Frame 10 | Frame 11 | Frame 12 | Frame 13 | Frame 14 | Frame 15 | Frame 16 | Frame 17 | Frame 18 | Frame 19 | Frame 20 | Frame 21 | Frame 22 | Frame 23 | Frame 24 | Frame 25 | Frame 26 | Frame 27 | Frame 28 | Frame 29 | Frame 30 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

The owner's private writing tools sit in the middle of a bot's page: "YOUR COUNCIL LINE · One line, once a week — yours as a member, not this account's", a free-text box prompting "I think NVDA runs, because…", "Tag your bot's play (optional)", Commit and "Everyone's lines ›" — on a page headed NET WORTH · SAURON, with the body copy also reading "WHERE YOUR MONEY IS", "96.5% of your account" and "You lead the league" — this breaks Information architecture — organisation; H2 match with the real world, which matters because invited-friend decides by the name on the page — "if it names someone else, nothing else on the page is trustworthy" — and an editable box addressed to them inside another member's bot reads as "am I about to write as Sauron?"; the card itself has to apologise for this in its own subtitle; the fix: Give the council line one home (Activity › The Council) and show only a read-only "this week's lines" strip on an account page; address every figure and sentence by the account's name wherever the viewer is not the owner ("Where Sauron's money is", "Sauron is 3rd of 3").

_Found by expert reviews (expert 3) · high._

### 62. Tapping the already-selected span button silently sets span=all, leaving the four-segment control with nothing lit and only the small line "any date · everything dated on your book" to say so, with no "All" segment to tap back to; the week stepper meanwhile keeps the accessible names "Previous week"/"Next week" while the span is Month or Quarter.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 | Frame 7 | Frame 8 | Frame 9 | Frame 10 |
|---|---|---|---|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

Tapping the already-selected span button silently sets span=all, leaving the four-segment control with nothing lit and only the small line "any date · everything dated on your book" to say so, with no "All" segment to tap back to; the week stepper meanwhile keeps the accessible names "Previous week"/"Next week" while the span is Month or Quarter — this breaks H4 consistency and standards / H2 match with the real world, which matters because a segmented control that is also a deselecting toggle has no precedent bot-watcher or returning-trader would recognise, and eric scanning the picture on a phone reads an unlit group as a rendering fault with no obvious route back to the week he was on; screen-reader and phone users are told they are stepping a week while the page steps a quarter; the fix: Add an explicit "All" segment, make the group mutually exclusive and non-deselecting so the lit segment always names the state shown, and re-label the arrows with the current span. Test what the arrows actually move at each span.

_Found by expert reviews (expert 3) · high._

### 63. Two filter chips ("Expiring within 3 weeks", "Earnings before expiry") match nothing on a three-position book, and the result is a bare "No positions match this filter." with no count on the chips, no "Clear", and the raw query (dte:<21, event:before-expiry) left sitting in the search box; the summary tiles above still read 3 open positions.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 | Frame 7 | Frame 8 | Frame 9 | Frame 10 | Frame 11 | Frame 12 | Frame 13 | Frame 14 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

Two filter chips ("Expiring within 3 weeks", "Earnings before expiry") match nothing on a three-position book, and the result is a bare "No positions match this filter." with no count on the chips, no "Clear", and the raw query (dte:<21, event:before-expiry) left sitting in the search box; the summary tiles above still read 3 open positions — this breaks H9 help users recover from errors / H5 error prevention, which matters because phone-only reads the first line and taps the first button; the book has vanished, the only exit is a chip two rows above the message, and the strip above contradicts the list below, so the page reads as broken rather than empty; the fix: Show a count on every chip and disable the zero ones with the count as the reason; put "Show all 3 positions" inside the empty state next to the sentence; scope the summary strip to the filter or label it "Whole book" with a "1 of 3 shown" line above the table.

_Found by expert reviews (expert 3) · high._

### 64. The blotter's three view names are List, Map and Runway with no preview or caption of what a Map or a Runway of positions is, only Map and Runway write a lens param, and after the scroll reset both land looking identical to List; the saved-view row beside them offers "All positions" (a pressable no-op) and "+ New view" with no statement of what a view captures.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 | Frame 7 | Frame 8 | Frame 9 | Frame 10 | Frame 11 | Frame 12 | Frame 13 | Frame 14 | Frame 15 | Frame 16 | Frame 17 | Frame 18 | Frame 19 | Frame 20 | Frame 21 | Frame 22 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

The blotter's three view names are List, Map and Runway with no preview or caption of what a Map or a Runway of positions is, only Map and Runway write a lens param, and after the scroll reset both land looking identical to List; the saved-view row beside them offers "All positions" (a pressable no-op) and "+ New view" with no statement of what a view captures — this breaks H2 match with the real world / information architecture — labelling, which matters because bot-watcher clicks whatever is nearest and interesting and the reward for trying "Runway" is a page that scrolls to the top and looks unchanged, which reads as a broken button rather than a different lens; eric has asked for coined words to stop and will not trust a saved view whose contents he cannot see; the fix: Name the lenses by content ("List · Risk map · Time to expiry") with a one-line caption under the row, make all three write the lens param, style the active saved view as selected and inert, and show the captured state under the name field ("Options · Losing · dte:<21 · List") with a Cancel beside Save.

_Found by expert reviews (expert 3) · high._

### 65. Per-account blotters have no way to narrow by symbol, side, outcome or date — the account's Activity section has no filter at all, and the bot desk's Activity offers a symbol box only — while the league-wide Activity feed one tap away offers a rich filter plus eight chips (Trades, Ideas, Buys, Sells, Bots, Humans).

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 | Frame 7 | Frame 8 | Frame 9 | Frame 10 | Frame 11 | Frame 12 | Frame 13 | Frame 14 | Frame 15 | Frame 16 | Frame 17 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

Per-account blotters have no way to narrow by symbol, side, outcome or date — the account's Activity section has no filter at all, and the bot desk's Activity offers a symbol box only — while the league-wide Activity feed one tap away offers a rich filter plus eight chips (Trades, Ideas, Buys, Sells, Bots, Humans) — this breaks Information architecture — search/filter; H7 flexibility and efficiency, which matters because bot-watcher opened the app because Sauron had a bad week and must read thirteen-plus undifferentiated rows, with three identical NVDA buys, to find anything; the capability exists in the app but not where the narrowing is actually needed, and the skill learned on one page does not transfer; the fix: Reuse the same filter control, with the same syntax, above every per-account blotter, pre-scoped to the account, with side and date chips beside it and the period control adjacent so range and text filter sit together; make the numeric and date headers sortable.

_Found by expert reviews (expert 3) · moderate._

### 66. Three stacked layers of view machinery — tabs, "Positions 3 · List · Map · Runway", "All positions · + New view", a query box and six or seven filter chips — fill most of a 390px screen above a list of three holdings, and on the bot desk the same toolbar outranks the content it narrows.

| Frame 1 | Frame 2 | Frame 3 | Frame 4 | Frame 5 | Frame 6 | Frame 7 | Frame 8 | Frame 9 | Frame 10 | Frame 11 | Frame 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) | (screen in the run record) |

Three stacked layers of view machinery — tabs, "Positions 3 · List · Map · Runway", "All positions · + New view", a query box and six or seven filter chips — fill most of a 390px screen above a list of three holdings, and on the bot desk the same toolbar outranks the content it narrows — this breaks H8 aesthetic and minimalist design (posture mismatch), which matters because phone-only wants one screen, one thing in thirty seconds; saved views and a query language are long-session tools and here they push the three things they came for below the fold, and first-timer meets four unmet concepts (Heartbeat, Runway, Map, New view) before the first number; the fix: On phone, and whenever a book is under about ten rows, show the list first behind a single "Filter" control that opens the chips; keep lenses and saved views for wider widths or for books long enough to need them.

_Found by expert reviews (expert 3) · moderate._

Not counted as new:

- F-c7ae830981: already on your key (S3), so re-found, not new — not counted.
- F-cf9fe1274a: already on your key (S5), so re-found, not new — not counted.
- F-c71269c84c: already on your key (B3), so re-found, not new — not counted.
- F-e6b46d862d: already on your key (S5), so re-found, not new — not counted.
- F-cc333717e6: already on your key (B5), so re-found, not new — not counted.
- F-1db6522694: already on your key (B1), so re-found, not new — not counted.
- F-a2d17667cd: already on your key (S5), so re-found, not new — not counted.
- F-da3da5dda6: already on your key (S3), so re-found, not new — not counted.
- F-350320f755: already on your key (S5), so re-found, not new — not counted.

## Your items, one by one

| Your item | Members | Experts | Words | Measurements (not blind) | Note |
|---|---|---|---|---|---|
| A1 — Playbook status/config popover (heartbeat chip "Market closed · idle, last pass …") is useful but sits in an odd spot — not attached to what it describes. | partly | partly | partly | — |  |
| A2 — Calendar controls (period nav + Day/Week/Month/Quarter) are disconnected from the content they control — placement. | partly | yes | — | — |  |
| A3 — Calendar controls appear on most sections but not all, and drive nothing on many of them (inert control). | — | yes | — | — | **disputed** |
| A4 — Cash ready to use is not presented with total net worth; idle capital should read beside net worth. | — | partly | — | — | **disputed** |
| A5 — Content shifts when switching between sections/tabs (layout jumps). | partly | yes | — | yes | **disputed** |
| A6 — Activity line items do not show which playbook triggered the trade; it should be visible at the row level. | yes | partly | — | — |  |
| A7 — Activity row's expanded detail is a wall of text, not human-readable/scannable. | — | yes | — | — | **disputed** |
| A8 — Needs-a-decision guidance is detached from the position it concerns; guidance should be inline with the position. | — | partly | — | — | **disputed** |
| A9 — The at-risk call/copy on a sold put is wrong or one-dimensional ("Down 111% from what you paid" / sell after a drop on a volatile name) — copy half counts; signal-richness half is out of denominator. | — | partly | yes | — |  |
| A10 — Horizontal scrolling on the positions/decision area (columns or buttons pushed past the edge). | yes | yes | — | yes | **disputed** |
| A11 — Guidance button navigates away to another page and the user must scroll through lots of content to find guidance — disorienting. | yes | yes | — | — | **disputed** |
| A12 — Filter chips (and similar same-page refinements) scroll the page to the top, breaking flow. | yes | yes | — | yes | **disputed** |
| **Found** | 7 of 12 (32%–81%) | 12 of 12 (76%–100%) | 2 of 12 (5%–45%) | 3 of 12 (9%–53%) | |

The measurements were designed after reading your list, so they never count as finding anything.

The two matchers agreed on 95% of 691 findings (Cohen's kappa 0.893).
- Disputed F-1fe79edfbb: one matcher said none (0), the other A10 (0.5); a third matcher said none (0).
- Disputed F-032e5de1c0: one matcher said A4 (0.5), the other none (0); a third matcher said none (0).
- Disputed F-abc3e85100: one matcher said A8 (0.5), the other A11 (0.5); a third matcher said A11 (0.5).
- Disputed F-d39e90e4f7: one matcher said A11 (0.5), the other none (0); a third matcher said A11 (0.5).
- Disputed F-e6b46d862d: one matcher said S5 (0.5), the other none (0); a third matcher said S5 (0.5).
- Disputed F-1d303083de: one matcher said A7 (0.5), the other A5 (0.5); a third matcher said A5 (0.5).
- Disputed F-a2d17667cd: one matcher said S5 (0.5), the other none (0); a third matcher said S5 (0.5).
- Disputed F-06cfe464b5: one matcher said A7 (0.5), the other A5 (0.5); a third matcher said A5 (0.5).
- Disputed F-89ad961c7a: one matcher said none (0), the other A10 (0.5); a third matcher said A10 (0.5).
- Disputed F-e93d2c8033: one matcher said A5 (0.5), the other none (0); a third matcher said A5 (0.5).
- Disputed F-0844c42472: one matcher said none (0), the other A10 (0.5); a third matcher said A10 (0.5).
- Disputed F-3da4dfb279: one matcher said A12 (0.5), the other none (0); a third matcher said A5 (0.5).
- Disputed F-56d18b8be3: one matcher said A10 (0.5), the other none (0); a third matcher said A10 (0.5).
- Disputed F-d16c30807f: one matcher said A10 (0.5), the other none (0); a third matcher said A10 (0.5).
- Disputed F-452eab0368: one matcher said A10 (0.5), the other none (0); a third matcher said A10 (0.5).
- Disputed F-d88418bb3f: one matcher said A5 (0.5), the other none (0); a third matcher said none (0).
- Disputed F-d5e1304d03: one matcher said A5 (0.5), the other none (0); a third matcher said A5 (0.5).
- Disputed F-e68dbf74c4: one matcher said A10 (0.5), the other none (0); a third matcher said A10 (0.5).
- Disputed F-1d141eb36a: one matcher said none (0), the other A10 (0.5); a third matcher said A10 (0.5).
- Disputed F-fc80fa24be: one matcher said none (0), the other A12 (0.5); a third matcher said none (0).
- Disputed F-53435a2176: one matcher said A10 (0.5), the other none (0); a third matcher said A10 (0.5).
- Disputed F-56c688f07a: one matcher said none (0), the other A3 (0.5); a third matcher said none (0).
- Disputed F-59013f7516: one matcher said A5 (0.5), the other S7 (0.5); a third matcher said A5 (0.5).
- Disputed F-8d0e2cb4d2: one matcher said none (0), the other A5 (0.5); a third matcher said A5 (0.5).
- Disputed F-b9894e8b5f: one matcher said A12 (0.5), the other A5 (0.5); a third matcher said A5 (0.5).
- Disputed F-bd65eb7bc6: one matcher said A12 (0.5), the other A5 (0.5); a third matcher said A5 (0.5).
- Disputed F-db7afea72b: one matcher said A5 (0.5), the other none (0); a third matcher said none (0).
- Disputed F-fad4bbc5ee: one matcher said none (0), the other A12 (0.5); a third matcher said none (0).
- Disputed F-45516ba73f: one matcher said A10 (0.5), the other none (0); a third matcher said A10 (0.5).
- Disputed F-f9a5cc0ee1: one matcher said none (0), the other A5 (0.5); a third matcher said A5 (0.5).
- Disputed F-f21f4d31d0: one matcher said none (0), the other A5 (0.5); a third matcher said A5 (0.5).
- Disputed F-4631860f16: one matcher said none (0), the other A3 (0.5); a third matcher said none (0).
- Disputed F-fa25265d54: one matcher said none (0), the other A5 (0.5); a third matcher said none (0).
- Disputed F-45d60a92a1: one matcher said none (0), the other A3 (0.5); a third matcher said none (0).
- Disputed F-4682853778: one matcher said A10 (0.5), the other none (0); a third matcher said A10 (0.5).
- Disputed F-f9cb1bc08b: one matcher said none (0), the other A5 (0.5); a third matcher said A5 (0.5).
- Disputed F-603f8ba0be: one matcher said A5 (1), the other none (0); a third matcher said none (0).
- Disputed F-fc82ac2e6d: one matcher said none (0), the other A5 (0.5); a third matcher said A5 (0.5).

Of what the blind evaluators reported, 279 of 317 were real (88%); 13 came from the test world, not the app, and are left out.

By member: bot-watcher 3 of 12 · eric 4 of 12 (1 hinted) · first-timer 2 of 12 · invited-friend 2 of 12 · phone-only 3 of 12 (1 hinted) · returning-trader 2 of 12.

Members succeeded in 43% of 87 sessions; middle ease 5 of 7. (Counted over every session, not only the tasks you found hard, so this is a rough check, not the plan's calibration test.)

## The design battle-test

Did not run: the round missed the bar on its negative control (a calibration fault in the method, explained in the method half), so per the plan no design fork was battle-tested.

## What members hire this area for

Hired for: eric: Decide what to do with the whole book today — what to trade, what to rebalance, what to take off, and what to leave alone — without reading a wall of text to get there. · returning-trader: Turn one holding they already know about into a placed order, with the strike and expiry decided for them, and end up back on their book. · bot-watcher: Follow what an automated account has been doing lately and understand, in its own words, why — like reading a box score after a bad week. · phone-only: Check the book and anything needing attention in thirty seconds, one hand, one screen — and understand every disabled thing without hovering. · invited-friend: See how their own money is doing across their two accounts, trade only from theirs, and see where they stand against everyone else. · first-timer: Work out what to do first in an app where they own nothing yet, and get an account linked so they can place a first trade..

| Stage | What members want from it | What the area holds |
|---|---|---|
| Define | minimize the time it takes to know whether anything needs my attention today; minimize the number of screens I must read before I know where I stand overall; minimize the effort it takes to tell what to do first when I own nothing yet; maximize how much of my standing I can take in above the fold on a phone | — |
| Locate | minimize the time it takes to find the one holding I came for; minimize the number of taps from a list to the account or bot I want to read; minimize the chance I lose my place in a long list while narrowing it; minimize the effort it takes to tell which of my accounts a holding sits in | — |
| Prepare | maximize my confidence that the suggested move is reasonable right now; minimize the effort it takes to learn which strike and until when; maximize how much of what is coming up against my holdings I can see at a glance; minimize the reading needed to understand what an automated account believes right now | — |
| Confirm | maximize my certainty that the money and account named here are mine; minimize the time it takes to know how fresh these numbers are; minimize the number of controls I can see but cannot press without being told why, in words; minimize my reliance on colour alone to tell good from bad | — |
| Execute (not served here) |  | — |
| Monitor | minimize the time it takes to see whether my order filled; maximize my understanding of why an automated account placed the orders it did; minimize the effort it takes to tell a good week from a bad week for a bot; minimize the time it takes to see whether the automated strategies are actually running | — |
| Modify (not served here) |  | — |
| Conclude | minimize the number of taps to get back to my book after acting or reading; minimize the chance I end up somewhere I did not intend after following a link; maximize my sense that I am done and nothing was left hanging | — |

Measured: minimize the time it takes to know whether anything needs my attention today (Task success); minimize the effort it takes to understand a disabled control and whose account I am on, without hovering (Happiness).

## What it missed

Nothing on your list was missed.

## One question

Scale to **the trade page and its guidance (where the profile hands members off)** next (predicted cost: about 830 model calls and 8 wall-clock hours for one area at this method's current speed; 1 area ≈ 1 working day until the experts run in parallel), revise the method first, or stop?

If you like, sit one short session yourself on the same tasks.
