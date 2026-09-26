# Patterns — the seed bank for UI design choices

Eric, 2026-09-06: *"3-5 design choices seems like a good pattern when building out UI design. We
have discovered several useful patterns already… there are good patterns to become aware of which
plant seeds to let them marinade… this builds intuition for when to apply patterns once you're
aware of said pattern."*

This page is where the seeds sit. Vocabulary used to be produced per teardown (`/teardown`), per
pattern doc ([`FOG-OF-WAR.md`](FOG-OF-WAR.md) keeps its own instance ledger) and per call sheet, and
never collected — so a pattern named in June was unknown to the session designing in September.
One ledger, one row per named pattern, so awareness precedes need.

Sibling docs: [`BRAND.md`](BRAND.md) (identity every pattern is checked against),
[`FOG-OF-WAR.md`](FOG-OF-WAR.md) (one pattern's full decision tree), [`PICTURES.md`](PICTURES.md)
(how a shape is shown so it can be judged by eye).

## How a surface decision arrives — the 3–5 shapes rule

A **surface decision** — a plan issue, a `/teardown`, an interrogation call sheet
([`grind/interrogate.instructions.md`](grind/interrogate.instructions.md)), a taste fork — hands
Eric 3–5 **named shapes** he can judge by eye, never a technique to arbitrate. Each shape names the
pattern it uses and points at its row here. Two instances so far: the five-option progressive-reveal
exercise on 2026-09-05 (spotlight · rail · chapters · fog of war · solo — Eric: "I like the rail
mechanic the best. This is light, and offers clickable components as a mechanic"; fog of war was
banked and landed elsewhere a day later), and #1740's call sheet (verbatim · amended · reject ·
status quo), which settled the *kind / section / sub-view* vocabulary below.

The trigger is a surface decision, not a PR. A copy fix, a rename, a one-link move never gets a
shape menu — that would be the 10,000-cuts failure CLAUDE.md → *Interrupt economics* names.

**Lo-fi shapes — when the decision is the template, not the placement** (Eric, 2026-09-21: "lofi is
preferred for structural changes to see the higher level templates w/out the high fidelity details
becoming a distraction"; convention set by the trading-parity study, `docs/research/trading-parity-2026-09.md`,
after its interrogation on PR #3406). A structural decision — what the *home* of a journey is, what
sits on one page versus a sheet or a drawer, the order of steps — arrives as 3–5 **greybox** shapes:
no brand tokens, no colour, no motion, but **real values** (real tickers, a real chain slice, real
bid/ask/greek strings, the real order sentence), because the defects that motivate a redesign are
density defects and boxes without values hide them. One artifact, three switchers — **shape × journey
step × viewport (390 first, then 1280)** — built on the same `render()`-and-state-buttons skeleton as
*The Rail Over the Form*. Each shape names the patterns it borrows (a row here, a row in the study),
and any prior decision it overturns: a fork settled in **Eric's own words** is rendered as an A/B on
the frame, flagged "reverses your call of <date>", never silently replaced; a Claude-derived mechanism
is overturnable with the row cited. A shape may borrow only rows graded `frame` or `vendor-quote` in the
study it comes from. Red and tiger passes run against each shape before Eric sees them. The greybox
HTML is committed (`docs/design/lofi/`) and the artifact is published from it — a lo-fi carries no
account data, so the teardown ban on frames does not apply. Lo-fi settles template and flow; hi-fi
(`/design`, the synced components) settles placement and polish. A pick is written into the owning
plan issue's decision log the moment it happens — Eric's reactions do not arrive on artifacts (0
comment threads on the precedent), the issue is the instrument.

## The vocabulary — three words for "where does this information go"

Settled by the wargame on #1740 (2026-09-06). Each has a live instance today; use the word, not a
description, when asking for a change.

| Word | It means | The mechanism | Live instance |
|---|---|---|---|
| **kind** | a filter over one list | a query qualifier and a rail chip, one model; never a tab | `is:buy` / `is:bot` on Activity (`app/src/routes/activity.tsx`); `lens:` / `sym:` on Research |
| **section** | a different *shape* of data on the same page | the rail's section switch (`app/src/shell/section-switch.tsx`), exactly one current, URL-stateful via `?section=`; pages on a phone | Settings and Activity's Booked P&L (#1749) |
| **sub-view** | a full view of its own | a nested route plus rail sub-nav | the desk's Pulse / Decisions / Playbooks (`app/src/shell/profile-rail.tsx`) |
| **bench** | several sections that are *one instrument's tools* and feed each other | docked together at the bench width, folded to exclusive sections below it; the section switch renders only when folded (`app/src/shell/frame.tsx`) | the Workbench on `/app/trade` — chart · chain · ticket · orders (#3407, Eric's pick 2026-09-22; slices 2–4 land it) |

A bench is a composition of sections, not a fourth word: below its width it *is* sections, and the
falsifier is written on the frame — if the docked bench reads as a mess on the live route it folds at
every width. A section that grows into a full page graduates to a sub-view — the legacy desk's `?tab=performance`
became `/u/:id/pulse` this way (`src/server/legacy-redirects.ts`). A tab strip as a fourth
navigation band was rejected: at phone width the topbar and the rail already each wrap into a
horizontal row, and a third band before content is what the mobile-first rule forbids.

## The ledger — shell and navigation

**Status** reads: *placed* (shipped on the surface named) · *seeded* (named, no surface yet, or a
surface chosen but not built) · *declined here* (rejected on one surface, banked for another — a
rejected placement never rejects the pattern). One row per pattern; a pattern with no row is
undocumented and gets one.

| Pattern | The mechanic, in a sentence | Where it lives | Came from | Status |
|---|---|---|---|---|
| **Dimensional precedence** | Topbar (app-level) → rail (a view's sub-nav *or* its controls) → content; higher steers lower, never the reverse. | `app/src/shell/frame.tsx` | Eric, live review 2026-08-28 | placed |
| **Constant geometry** | The rail column is the same width on every view, reserved even when empty, so content never shifts as you navigate. | `app/src/shell/frame.tsx` | Eric, 2026-08-28: "content shift greatly degrades user experience" | placed — Eric 2026-08-29 (#784): revisit when content breaks it |
| **Rail as sub-nav** | Links to sibling routes under one topbar tab, the current one marked, chapters indented. | `app/src/shell/profile-rail.tsx` | #1119 | placed |
| **Rail as controls** | A control in the rail drives the content beside it (chips, a metric picker, a calendar). | `app/src/routes/activity.tsx` (`WireRail`), `app/src/routes/index.tsx` (`RankRail`) | #738 | placed |
| **Section switch ("On this page")** | One section renders at a time, `aria-pressed` marks which, a leading accent bar marks it by shape not hue; progressive disclosure instead of anchor-scrolling. | `app/src/shell/section-switch.tsx` (generalized out of `settings-toc.tsx`) | Eric, 2026-09-04; #1740's wargame | placed on Settings and Activity (#1749) |
| **Fold the instrument on a phone** | A rail that is a block (the research calendar) folds to its head — range, arrows, lenses — with one tap to show the whole; the section switch rides the rail beneath it. | proposed for `/app/research` (#784, three frames rendered 2026-09-06) | #1740's Research fallback, re-rendered | seeded — Eric's reaction on the frames places it |
| **Radio vs checkbox in the rail** | Two controls that share a style but not a behaviour are a hue-only signal in disguise: the section switch (exactly one) carries a leading accent bar, the filter toggles (any number) carry none. | `app/src/styles/rail.css` (`.railctl-section`), `docs/BRAND.md` → Cohesion rules | #1749 | placed |
| **Rail becomes a strip on a phone** | At ≤860px the rail turns into a horizontal, scrollable chip row; labels hide, the current item gets an accent border. Does not hold for a rail that is a block (Research's calendar stays a ~290px block above the heading at 390px). | `app/src/styles/rail.css` | #738 | placed — Research's phone rail is the open case (#784) |
| **Chips ⇄ query text, one model** | Rail chips write the same tokens the filter bar accepts; the URL carries the query, so a link lands on the same filter. | `app/src/live/wire.ts`, `app/src/live/research.ts` | GitHub's Issues list | placed |
| **Exclusive-group toggle** | Picking a sibling replaces, never stacks a contradiction (`is:buy` vs `is:sell`). | `app/src/live/wire.ts` (`toggleWireQualifier`) | the blotter | placed |
| **Issues-list template** | A filterable list with a URL-stateful query and companion panels alongside. | `app/src/routes/activity.tsx` | GitHub | placed |
| **Segmented toggle with phone abbreviation** | A radio-style control whose labels shrink to abbreviations at phone width instead of wrapping. | `app/src/shell/toggle.tsx` | the ticket | placed |
| **Status pill** | Ops state as one topbar pill on every route, opening a popover, instead of a page. | `app/src/shell/status-pill.tsx` | #1296 | placed |
| **Hovercard** | A detail card on hover, suppressed where hover doesn't exist. | `app/src/styles/hovercard.css` | #738 | placed |
| **Fog of war** | Withhold a *capability* behind an earnable rung, never information a member needs to stay safe; the door is visible · named · disabled · counted. | [`FOG-OF-WAR.md`](FOG-OF-WAR.md) (tree + its own instance ledger) | Eric, 2026-09-06: "a spot on / perfect scenario" | placed |
| **Propose-then-place** | Claude proposes a pattern rendered on a candidate surface; Eric places it. A rejected placement banks the pattern, never the idea. | CLAUDE.md → *Fog of war is a first-class reveal pattern* | fog of war: declined for the ticket 2026-09-05, landed on the research day lens 2026-09-06 | placed (process) |
| **"Build me" placeholder** | A planned item is visible but disabled and reads as "help shape it", not broken; the same treatment on a rail item and a trade type. | #784 (Trade rail, `src/domain/trade-types.ts` ladder) | Eric, 2026-08-29 | seeded |
| **Onramp fold** | A how-to for an outside system (GitHub) folded behind a `<details>`, reference not front matter. | `app/src/routes/activity.tsx` (`.wire-onramp`) | #738 | placed — Eric, 2026-08-28: "feels out of place" (#784) |
| **Mobile-first curation** | What survives 390px is the curated set; desktop adds room for what was one swipe away, never new concepts. | CLAUDE.md → *Mobile-first on the trading surfaces* | Eric, 2026-09-05, from Fidelity's ticket | placed (rule) |
| **The Cockpit** | A sticky header (identity + one-line vitals) over a horizontal section switch; every lens one tap away, the header never scrolls off. | `app/src/routes/accounts.tsx` (`cockpit.css`) | #2953 — Eric chose it from four named shapes, 2026-09-11 | placed on `/accounts` (#3186) |
| **The Ledger** | The page is one long scroll of stacked sections in reading order; nothing switches, everything is reachable by scrolling. | — | #2953 | declined here — "too much scroll, no at-a-glance"; banked |
| **The Card Stack** | Each concern is a card; cards reorder by relevance and expand in place. | — | #2953 | declined here (`/accounts`); banked |
| **The Drawer** | Detail opens as a side drawer over a stable list; the list never loses its place. | — | #2953; superseded on the blotter by the inline row accordion (#2321) | declined here; banked for a surface whose detail is too large to fit inline |
| **Budget bar** | A gauge's fill answers "how much room is left against ITS OWN cap," never "what is the value" — always paired with a word and a number (hue never carries meaning alone), and an honest "not yet measured" state that renders as such, never as zero or a full bar. | `app/src/shell/wire-trade-row.tsx` (`GaugeBar`, generalized from `.pulse-progress` in `pulse.css`) | Eric, on the activity row's system-vitals gauges: "high level succinct feedback to state the health of the system and if it is healthy or in an unsustainable state" | placed on Activity's trade-row detail (PR 6, issue #2287) |
| **Inline row accordion** | A row's detail (here, a position's fill timeline) expands into its own row directly beneath it, in the same table, rather than a separate panel elsewhere on screen — its open state is its own, kept separate from any other fold the row already has (the detail-column fold hides at ≥1100px; the timeline never should). | `app/src/shell/blotter-row.tsx` (`timelineOpen`), `app/src/shell/positions-table.tsx` | #2321 — Eric's live-review complaint that the right-rail popup "read as too far removed from the row that triggered it" | placed on the blotter (desk page + unified Accounts view) |
| **Right sheet for a row's detail** | A slide-in panel from the screen edge, opened by a row click, showing that row's detail. | `app/src/shell/timeline-drawer.tsx` (retired) | #738 phase 2d | declined here — #2321; superseded by the inline row accordion above on this surface, kept as a pattern name in case a future surface's detail is too large to fit inline |

## The ledger — trading surfaces

The milestone ↔ feature grammar (#1461, "The Rail Over the Form") and the Fidelity ticket study
(#1461, #1481 — the `/teardown` of 2026-09-05; frames stay in the private artifact, never here).
Skipped patterns keep a row too: a "no" with its reason is a decision the next session should not
re-make.

| Pattern | The mechanic, in a sentence | Where it lives | Came from | Status |
|---|---|---|---|---|
| **Milestone strip grammar** | Eyebrow · rail · status line, teal-edged, the same three parts wherever a milestone meets a feature; names only on rungs you have reached. | `app/src/shell/milestone-strip.tsx` | #1461 | placed on `/learn/trading` since #3407 slice 5, AND back on `/trade` (above the `Bench`) since Eric, 2026-09-22, later the same day: "The milestone ladder is still on the left. As mentioned before, i want to restore previous design where this milestone information is rendered across the top" — closing a same-day loop (strip → rail → strip); the ticket also keeps its one-line rung chip (`rung-chip.tsx`) for a member deep in the form |
| **Ladder Rail** | The nav rail's own item list (`rail-item`/`rail-glyph`, `profile-rail.tsx`'s shape) restored click-to-preset for a rung as a rail control instead of a strip above the bench. | `app/src/shell/ladder-rail.tsx` (deleted) | Eric, 2026-09-22: "I also want this section restored on the trade page… find a better design to more organically integrate the behavior" | declined-here — reversed same day: "the milestone ladder is still on the left... restore previous design where this milestone information is rendered across the top." Satisfied the click-to-preset FUNCTION Eric asked to keep but not the PLACEMENT he'd already named; removed rather than kept running alongside the returned strip |
| **Workbench** (home of trading) | Chart and chain are the workspace, the ticket docks beside them, orders sit below; one symbol drives every pane; phone = sections. thinkorswim / Legend lineage (study rows 28, 29, 6, 9). | `app/src/routes/trade.tsx` (slices 2–4) | #3407 lo-fi — Eric, 2026-09-22: "the workbench is best" | placed — docked at 1280 since slice 4b, folded below it; the chain's own docked pane was reversed the same day, see Ticket Accordion |
| **Ticket Accordion** | Inside the Workbench: the chain is a collapsible step in the ticket form itself (open once a symbol commits, auto-collapse to one line on a strike/bid/ask pick) rather than a separate docked column; the chart is promoted into the column the chain vacates. | `app/src/shell/option-gate.tsx` (`chainOpen`), `app/src/routes/trade.tsx` (`Bench`) | #3407 lo-fi shapes (`docs/design/lofi/trade-chain-composition.html`) — Eric, 2026-09-22, live-reviewing the shipped Workbench: "is it possible to have that table be expandable in the same form" | placed — reverses part of the Workbench composition call from earlier the same day |
| **Collapsible dock pane** | Inside the Workbench: keeps the docked two-column geometry exactly, but the chain pane itself gets a header fold — collapses to one line after a pick, reopens on tap or on focusing the Strike field. | — | #3407 lo-fi shapes (`docs/design/lofi/trade-chain-composition.html`) | declined-here — Eric picked Ticket Accordion instead; banked |
| **One Ticket Card** | Account/Rung/Instrument-Side-Type composed into one `header` element by the caller, rendered INSIDE whichever ticket body's own `.gate-panel` — never loose siblings above a separate card. Every ticket kind and every locked/gated state gets the same one-card shape, for free (`LockedPanel`/`LadderGateCard`/`DraftOrderBuilder` all take the same `header` prop). | `app/src/routes/trade.tsx` (`DeskTicket`'s `header`/`headerNoNav`) | Eric, 2026-09-22: "instrument, side and type toggle controls should be part of a singular trading form on the same card" | placed |
| **Spread CTA** | Removes Spread from the Instrument toggle (it's an option construct, not a third instrument beside Stock/Option) and replaces it with a note at the end of the single-leg option form — a link once the form is drafted and the existing 401 rung is unlocked, a locked-explained sentence otherwise. Carries `?symbol=`/`?exp=` into the multi-leg builder for free (the same `onPreset` rung-switch mechanism already does). | `app/src/shell/option-gate.tsx` (`tkt-spread-cta`, `spreadPlay`) | Eric, 2026-09-22: "spread is a specific type of option and not it's own instrument... they perform that at the end of filling out the form for the first leg" | placed — no new milestone; reuses 401, already gated the same way every other rung is |
| **Arcade** (home of trading) | The symbol is the stage — quote · chart · position · working orders for it — and Trade is a paged sheet with a plan-gated commit and a celebration that explains. Robinhood lineage. | — | #3407 lo-fi | declined-here — the stage mechanic survives inside the bench (the chain on the workspace); the celebration rides the renown ledger, `next-slice` |
| **Outlook** (home of trading) | A belief ("NVDA up modestly by October") is the start; the builder proposes named structures with max loss on screen; the chain opens on the chosen leg. Strategy-builder lineage. | `src/options/recommend.ts` (`rankStructures`, unwired) | #3407 lo-fi | declined-here as a home — seeded as an auxiliary entry into the bench |
| **Register** (home of trading) | Orders and positions are the home; every action starts from a row; the ticket is a drawer. Fidelity Orders / IBKR lineage. | — | #3407 lo-fi | declined-here — reverses #674; its row actions (close, modify, roll, create-opposite) already live on the bench's orders section |
| **Feature layer owns its nav** | The form's controls (instrument · side · put/call) belong to the form, never to the ladder; change them and the rail's current node follows. | `app/src/shell/ticket-nav.tsx` | #1461 — Eric: "the trade form needs to stand on its own" | placed |
| **Preset, never drive** | A rail node or a chain cell stages the form (instrument, side, price); it assists, the member decides; a locked preset still renders, disabled. | `app/src/shell/milestone-strip.tsx` (`?play=`) | #1461 — Eric: "a pre-configured preset that assists the user, but doesn't drive" | placed on the rail · seeded on the chain (#1481) |
| **Locked = visible · disabled · explained** | Show a control disabled when the member can still earn it here, hide it only when it will never apply, and never leave it disabled without the reason beside it; exits (a sell) are never locked. | `app/src/shell/locked-panel.tsx` (`opensAfter`), `src/domain/progression.ts` | #1461; NN/g on disabled controls | placed |
| **Quote header** | Ticker, name, last, change, bid/ask and an as-of stamp above the form, because every number on the ticket depends on the price. | — | Fidelity study row 1 | seeded — costs a broker read pre-review |
| **Buy / Sell segmented control** | A filled segment with a check; colour is reserved for the CTA and for gains. | `app/src/shell/ticket-nav.tsx`, `app/src/shell/toggle.tsx` | Fidelity study row 2 | placed |
| **Amount with a unit toggle** | Shares or dollars, picked in a sheet; the dollar path is the newcomer's on-ramp. | — | Fidelity study row 3 | seeded — depends on notional orders on paper |
| **Pickers as bottom sheets** | A radio list in a sheet with one "learn about…" link at the bottom; a popover on desktop. | — | Fidelity study row 4 | seeded |
| **Time in force as a control** | Day by default, plus good-til-cancelled; nothing else until asked. | — | Fidelity study row 6 | seeded |
| **Contextual fields** | Limit price and conditions appear only when Limit is chosen; progressive disclosure one level below the ladder. | the ticket's `priceFieldFor` | Fidelity study row 7 | placed |
| **Sticky footer estimate** | Estimated value, live as you type, above a full-width Preview button. | post-review estimate shipped (#704, #716) | Fidelity study row 8 | placed post-review · live-as-you-type seeded |
| **As-of stamp** | "As of 10:04:20 AM ET" under the form; a SIM ticket never implies a price it does not have. | — | Fidelity study row 9 | seeded |
| **Search sheet with recents** | One input, shortcut chips, recent quotes; recents for us are positions and recently traded. | — | Fidelity study row 10 | seeded |
| **Straddle view** | One expiration at a time, strike down the centre, calls left, puts right, a current-price divider and an in-the-money rail; moneyness by geometry. | `app/src/shell/straddle-view.tsx`, `app/src/shell/chain-straddle.tsx` | Fidelity study row 11; Eric, 2026-09-05 | placed (#1481) |
| **Expiration chips, days in words** | A weekly mark on the chip and "Expires in 4 days" under it — the theta lesson in one line. | `app/src/live/straddle.ts` | Fidelity study row 12 | placed |
| **Scroll out from the centre** | Strike pinned; scrolling left grows the call side, right the put side; greeks are the outermost columns — additive, never base. | `app/src/shell/chain-straddle.tsx` | Fidelity study row 13; Eric: "the greeks can be a progressive enhancement/additive" | placed for the base view · greeks columns seeded (#1481 slice 2) |
| **Tap-to-preset from a cell** | Bid (sell) and ask (buy) are tappable; a tap stages one leg at that contract and price. | — | Fidelity study row 14 | seeded (#1481 slice 2) |
| **Header gloss at the point of choice** | Each chain column header carries a one-line gloss; an absent greek reads as absent, never 0.00. | — | Fidelity study row 15 | seeded |
| **One leg card, add a leg** | A single leg is a one-leg spread: action · quantity · expiration · strike · call/put, "+ Add leg" beneath. | `app/src/shell/draft-order-builder.tsx` (the builder), the gate (two panels today) | Fidelity study row 16 | seeded — share the leg card, keep two panels (#582) |
| **Bid · Mid · Ask chips** | All three shown, price prefilled from the ask on a buy; mid is the anchor a limit aims at. | — | Fidelity study row 17 | seeded |
| **Live estimate ×100** | $6.40 becomes $640 before Preview, labelled "$0 commission · paper"; the multiplier taught without a word. | — | Fidelity study row 18 | seeded |
| **Review as a sentence** | "Buy to open 1 $230 NVDA call · Sep 16, 2026", then Last / Bid / Ask and the warnings verbatim. | — | Fidelity study row 19 | seeded |
| **Working-orders view with cancel and replace** | Pending orders live on the trade surface (never a separate portfolio page), with honest states — "attempt to cancel" until the broker says "canceled". | — (dead renderer: `src/observatory/open-orders-view.ts`) | trading-parity study rows 1–2 (Fidelity, thinkorswim, Robinhood); #674 | seeded — P1 of the parity plan |
| **Confirm is where the warnings live** | One review dialog — edit · send · save — carries cost lines and every warning; skipping it is an explicit risk acceptance and is never offered to humans on paper. | `app/src/shell/trade-gate.tsx` (the merge box, partial) | study row 3 (thinkorswim Confirm-and-Send; Fidelity skip-by-agreement) | placed in part · the frame seeded |
| **Chance of profit with expected value** | Probability of profit never stands alone on a chain row or an order screen; the payoff asymmetry sits beside it. | — | study row 7 (Robinhood tap-a-strike; thinkorswim Prob ITM) | seeded — P2 |
| **Outlook → structure** | A plain-English belief (bullish · bearish · volatility · neutral) becomes a named structure with its max loss unavoidable on screen; one strategy price. | `src/options/recommend.ts`, `outlook.ts` (engine; no surface) | study row 8 (Robinhood Strategy Builder); ledger #19 | seeded — P3; the Outlook lo-fi shape |
| **Simulate with the trade's own gesture** | The payoff panel (expiration curve · today curve · price slices) opens from the same chain cell or position row that places the order. | `src/options/payoff-surface.ts` (built, unwired) | study row 9 (thinkorswim Analyze; Robinhood Simulated Returns) | seeded — P2 |
| **Position statement vocabulary** | P/L Open · P/L Day · Days · an ITM badge · live greeks on every option position. | `src/options/greeks-aggregator.ts` (built, unwired) | study row 10 (thinkorswim; Fidelity Option Summary) | seeded — P2 |
| **Counted interstitial before an irreversible threshold** | A door that counts (2nd, 3rd, 4th) and names what it opens or costs, at the moment it matters. | `src/domain/progression.ts` (zero-DTE gate, partial) | study row 17 (Robinhood legacy PDT Protection, 0DTE opt-in) | placed in part · the counter seeded |
| **Celebration on plan adherence, never on trade count** | The fanfare budget fires on a disciplined entry, a profit-take at plan, a bot deployed — with its one-line explanation; the trigger variable is never order count. | `app/src/shell/unlock-gate.tsx` (register) | study row 18; ledger #1–#2; the Massachusetts order §VIII.C.d | placed (rule) · triggers seeded |
| **Plan-derived alerts** | Alerts come from the member's own stop and target, never from default-on % moves. | `src/alerts/*` (substrate, #586; no delivery) | study row 20; ledger #11 (FCA 2024) | seeded — P4 |
| **Practice is the same UI one switch away; reset is a control** | Paper is not a toy mode; a blown-up book resets to a fresh scenario and the fiction is stated ("executions are simulations"). | the whole app is paper; no reset control | study row 27 (thinkorswim paperMoney) | seeded — reset must keep earned rungs |
| **Buy list of movers / most popular** | A ranked-by-move or by-popularity list with a buy affordance. | — | study row 21; ledger #15–#16 (Barber–Huang–Odean–Schwarz 2022) | declined here — adapt only as a taught exhibit with the −4.7% number and no order affordance |
| **One-motion submit / auto-send** | Swipe-to-submit or a lightning-bolt toggle that skips confirmation. | — | study row 23; `docs/research/trading-desk-ux.md` ("the review step is the lesson") | declined here — a swipe only if gated on filled plan fields |
| **A real desk's order-type inventory** | Eight order types and five time-in-force options listed flat. | — | Fidelity study row 5 | declined here — list only what this desk executes; vapor options disabled "coming soon" are a trap |
| **Three buying powers, margin, strategy dropdown** | Cash · margin · option buying power, a type selector, a calls/puts strategy list. | — | Fidelity study row 20 | declined here — paper, one desk, one number; the strategy list is the rail's preset |
| **Position guidance** | A fixed-order decision sheet on the position you hold — pulse strip (every input: source · as-of · fresh/aging/stale) → your stake → three lever calls (call · confidence · why · proves it wrong) → until/waiting-on → DTE strip → strike ladder → what changed since you last looked. Same sections, same place, every visit; stale inputs demote, never masquerade. | `src/options/position-guidance*.ts` (engine + markdown template) | #3729 — Eric, 2026-09-25: "a standardize template/form … to quickly parse information over repetition/time" | seeded — engine + markdown; UI homes are slices 4–6 |

## The ledger — discovery (gleaned from the retired Collections, #3623)

Collections (#588 → #617, 2026-08-26) was retired on 2026-09-23 after Eric's test: "collections feel
of more interest if they are a derivative/byproduct of research. Otherwise… a relic design." Its
origin was a Public.com teardown, not a research finding, so the *page* went. These are the ideas it
carried, banked here before the code was deleted. The last tree that has the code is the parent of
the retiring PR (`src/discovery/probe-tape.ts`, `collection-probes.ts`), so any of these can be
restored from history rather than rebuilt.

| Pattern | The mechanic, in a sentence | Where it lives | Came from | Status |
|---|---|---|---|---|
| **Membership by controlled experiment** | Run the thing on a hand-built tape, then again with ONE input neutralised; it earns the label only for behaviour that disappears in the control run — so a label names what the signal *caused*, never what merely co-occurred. | `playbook-probe.ts` keeps the date-window half (`probeWindow` walks a synthetic print, and an estimate-date re-run is the control); the persona tapes were deleted with Collections | #617 | placed for playbook traits · banked for bot behaviour — the candidate is proving a tactical playbook does what its card says (`docs/IDEAS.md`, 2026-09-23) |
| **A receipt behind every label** | Each membership carries the one sentence of evidence that earned it (the bot's own `reason` at the moment it acted, or what the probe observed), shown beside the label, never instead of it. | `PlayTrait.claim`, shown as the trait pill's tooltip on R&D → Playbooks (`playbook-store-cards.tsx`) | #617 | placed (traits) |
| **Absence is named, never dropped** | A catalog entry no category claims renders in a visible "on no shelf" bucket with the reason, instead of silently vanishing from the browse surface. | — (the "On no shelf" block, deleted) | #617 | banked — the R&D → Playbooks card does the same job by showing a tactical playbook's "no window" honestly rather than hiding it (#3626) |
| **Narrative shelves** | Browse by story ("Against the Crowd", "Ahead of the Print") rather than by a list or a sector. Public.com's "Themes". | — | #588 (Public.com teardown) | declined-here — #3623: not research-derived, and with four playbooks a shelf is a filter nobody needs yet |

## How a pattern enters

1. **Named anywhere → a row here.** A teardown's vocabulary list, a call sheet's shape names, a
   pattern doc's title: each becomes a row in the same PR or comment that names it.
2. **A row carries its provenance and its instance.** A pattern with no live instance is *seeded*;
   the row says which surface is the candidate.
3. **Placement is Eric's; proposal is Claude's.** Render the shape on the candidate surface (a
   screenshot, a mermaid map), never describe it. A "no" updates the status to *declined here* and
   names where it might land instead.
4. **A pattern that stops fitting gets a note, not a deletion** — the row is the memory that it was
   tried (constant geometry's row already carries its revisit note).

## The ledger — pictures

Rows for the picture grammar (`PICTURES.md`), one per named shape; the census of 2026-09-25 named the
anti-pattern and the two shapes that beat it.

| Pattern | The mechanic, in a sentence | Where it lives | Came from | Status |
|---|---|---|---|---|
| **One shape for every change** (anti-pattern) | Sources fan into one module and out to surfaces, whatever the change was; nothing marks what is new. | 8 of 11 diagrams in the 40-PR census | Claude, census 2026-09-25 | named — the thing the rows below replace |
| **Before/After halves** | A sequence diagram whose two `Note over` halves show the same exchange before and after the fix; the picture makes the causal argument. | PR #3737 | Claude, 2026-09-25 | placed |
| **Delta grammar** | Thick edge = new, dotted = removed, `subgraph "this PR"` = added; meaning survives without hue. | `PICTURES.md` → delta grammar; PR #3747's own picture | Eric's colourblind rule + census | placed |
| **Sketch register** | `look: handDrawn` marks a *proposed* diagram (a plan issue) as not built; classic look marks shipped. | `PICTURES.md`; plan issues | Claude, 2026-09-25 (the diagram cousin of the lo-fi greybox rule) | seeded — judged on #3748 vs slice 2's PR |
| **Diagram as procedure** | A `flowchart TD` decision tree sessions execute step by step; the instance ledger applies it. | `docs/FOG-OF-WAR.md` | Eric, 2026-09-06 | placed — named here for the first time |
| **Series map** | One flowchart with a subgraph per slice of a multi-PR series; this PR's edges thick. | the 11-PR guidance series (missed) | Claude, census | seeded |
| **Generated picture** | A diagram emitted from the same data as the table beside it — the picture cannot disagree with the data. | `scripts/platter-picture.mjs` via `ship.sh platter` (the held PR's two pictures, #3790); the digest kanban still seeded | Claude, 2026-09-25 | placed — #3790 (the held PR); seeded for the digest |
| **Storybook architecture** | One C4 page per container: context, container/component diagram, canonical flow, lifecycle, code roots — a component library of the system. | `docs/architecture/` (#3758); the lifecycle slot on a container page (#3791) | Eric, 2026-09-25 ("a storybook version… in a component library fashion") | placed — #3758, #3791 |
| **The door** | A PR's parse gate as a picture: the new path thick and first, the old path one dotted lane on the right, the fork a question, the cross-head no, the double circle done, no edge labels. | `PICTURES.md` → the delta-flowchart starter (#3787) | the round-3 design session, 2026-09-26 | placed — #3787 |
| **The held PR's two pictures** | Draw the moment the picture is read: at open time the button is the fork (what each button does to the undo); after landing the record in whichever ending is true, generated from the log. | `scripts/platter-picture.mjs`, `ship.sh platter` (#3790); the lifecycle on the ship loop's page (#3791) | the round-3 design session, 2026-09-26 (rule 5) | placed — #3790, #3791 |
| **Ink mode** | A second look beside the house teal: paper for what exists, gold for the one decision, seal red for a defect, the house dashed grey for the old path; a mode switched whole, never mixed. | `PICTURES.md` → the second snippet, verified on both canvases (#3788); the lint refuses any hex outside a snippet (#3789) | the round-3 design session, after a sumi-ink frame with one gold, 2026-09-26 | placed — Eric, 2026-09-26 ("promote. Phone looks fine"); decision pictures only |
| **The guiding wind · a mode switched whole · the glint** | Direction lives in the world, not an overlay (edge labels only when they are the choice); a look is a mode with a declared scope; exactly one element carries the accent, at the decision. | `PICTURES.md` rules 9, 11, 12 (#3787) | Ghost of Yōtei's mechanics, read in the teardown on #3786 | placed — as rules; the app-side versions seeded in `IDEAS.md` |
| **The second layer** | Detail that survives a phone: a spine that reads in ten seconds plus a second layer of claim-bearing detail — boxes of detail beside the spine (A), or a bold headline and one line of fact inside every node (C). | two candidates on #3778 (2026-09-26) | Eric, 2026-09-26 ("I expected more fine grained elaborate detail") | placed — Eric, 2026-09-26 ("both"): C on PR frames, A on pages, both at desk width; rule 18 |
| **Diagram as contract** | A drawn boundary compiles into an import gate; a drawn lifecycle compiles into EARS lines and specs; drift is a red check. | a boundary gate script under `scripts/` and the `/ears` skill (both slice 8–9 of #3748) | Eric, 2026-09-25 ("infrastructure as code… non-deterministic into deterministic") | seeded — slices 8–9 |
