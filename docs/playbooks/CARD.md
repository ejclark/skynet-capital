# The playbook card

| | Wheel | Long call | Dip-to-bounce | Call spread |
|---|---|---|---|---|
| Does | ● | ● | ● | ● |
| Why it should pay | ● | ● | ● | ● |
| Fit | ◐ view | ◐ view | ▲ NBIS | ▲ NVDA |
| Stage | ● | ● | ● | ● |
| Entry | ◐ setting | ◐ view | ● | ◐ verdict |
| Position | ◐ setting | ◐ view | ● | ◐ verdict |
| Size | ◐ setting | ● | ● | ● |
| Exit | ● | ● | ● | ◐ verdict |
| Settings | ◐ setting | ◐ view | ◐ setting | ◐ setting |
| House rules | ● | ● | ● | ● |
| Research | ◐ verdict | ◐ view | ◐ verdict | ◐ verdict |
| Proves it wrong | ◐ view | ◐ view | ▲ NBIS | ◐ verdict |

_Caption — the card's twelve fields, filled for four of today's playbooks from the code at `a073793`
(2026-11-03); a second reader checked every claim against the code. **●** the rule names no ticker ·
**◐** the code types a value for one ticker, and the card holds it as a subscriber **setting**, the
subscriber's dated **view**, or the study's **verdict** on that ticker, with the same decisions ·
**▲** a break: today's decisions need a rule written for that ticker._

- **2 of 4 fit with no rule for one ticker: the wheel and the long call.** Everything the code types
  for CRWV moves to a setting with bounds, or to the subscriber's dated view.
- **2 breaks, one kind:** NBIS on the dip-to-bounce and NVDA on the call spread run below their
  strategy's own fit line, on a study's call. The code marks that tier (△) but writes no lower line
  for it and no rule for what such a ticker may do.
- **The shape changed in four places:** size is a unit and a count, not a share of the budget; fit
  splits into a screen and who may admit a ticker below it; two fields are new, stage and house rules.

<details>
<summary><strong>Why this page exists</strong> — a playbook is meant to be a strategy, and its symbols settings</summary>

Eric, 2026-11-03: _"playbooks are intended to be agnostic.. symbols are intended to be configuration
options"_, and _"consider that playbook shape are only loosely defined and still very much a
WIP/concept."_ Members will subscribe to a playbook and configure it with allocated funds and
settings; for now only bots do.

#6771 turns that into graded slices. This page is slice 1, the shape on paper: write the card a
playbook is described in, fill it for four of today's playbooks from their code, and record every
place one of them needs a rule for a single ticker. It proposes no new playbooks (slice 3 does) and
changes no code. Paper trading only.

</details>

## 1. The words: playbook, strategy, pair

Eric's **playbook** is the code's **strategy**. What the code calls a `Playbook` is narrower: one
strategy running on one ticker, which the code also calls a **pair**.

| Eric says | The code says | What it is | Where |
|---|---|---|---|
| a playbook | **strategy** (`StrategyId`, `Strategy`) | The rules with no ticker: what it does, what it buys, whether its window counts toward an earnings report, whether an owner's dated view may run it where its study says stand aside (`runsOnConviction`), and the screen that tests a ticker for it (`screen`, or `noScreen` saying why there is none). Ten today. | `src/playbooks/pair-table.ts:26-36`, `src/playbooks/pair-table.ts:38-72` |
| — | **pair** (`Pair`), id like `MU-DIP-BOUNCE` | One strategy on one ticker, with the study's verdict on whether the ticker fits: ✓ researched, △ researched but below the house bar, ◆ an owner's conviction, ~ screened, ✗ stand aside, ? not studied, ⊘ can't run. The id is looked up, never built from parts. Sauron's pair holds ten tickers and the two scouts none; every other pair holds one. | `src/playbooks/pair-table.ts:245-254`, `src/playbooks/pair-table.ts:474-490`, `src/playbooks/pair-table.ts:548-558` |
| — | **setting** (`WheelSetting`, `CallSpreadSetting`, …) | One ticker's words and numbers, handed to its strategy's template (`wheel()`, `longCall()`, `dipBounce()`, `callSpread()`), which returns one `Playbook` for that ticker. The registry calls each template once per pair. | `src/playbooks/wheel.ts:77-98`, `src/playbooks/call-spread.ts:93-105`, `src/playbooks/registry.ts:255-268` |
| — | **`Playbook`**, "playbook id" | What the engine runs, and it is a pair: its id is the pair's id and `symbols` holds the pair's ticker. A subscriber's view may rebuild it narrower under the same id, so one pair can run as several builds. | `src/playbooks/playbook.ts:191-208`, `src/playbooks/steered-playbook.ts:105-137` |
| subscribe | **subscription** (`PlaybookSubscription`) | One account running one pair: mode, a dollar budget, pause (`enabled`), a symbols filter that only narrows, compounding, the view that steers it, a play target. With no budget, share buys are uncapped but every option open is refused. | `src/domain/types.ts:317-375`, `src/engine/option-guards.ts:279` |
| allocated funds | **allocation** | One optional dollar cap per account and strategy. Each pair's budget must fit inside it when the budget is written; trades read only the subscription's own budget. | `src/subscriptions/strategy-budgets.ts:15-33`, `src/subscriptions/strategy-budgets.ts:82-107` |
| settings | **mode** (`PlaybookMode`) | conservative · standard · aggressive. Mode moves each strategy's deltas, counts and limit prices; the one per-mode number every `Playbook` carries (`size`, a fraction of equity) is zero for all four strategies here. | `src/domain/types.ts:128`, `src/playbooks/playbook.ts:207-208` |

So when a member "subscribes to a playbook and picks its symbols", today's code has one subscription
per pair, which means one per ticker, each inside the strategy's allocation. The Store already draws
one card per strategy with its pairs as rows (`docs/IA.md`, row "Strategy card · pair row"). This card
describes the strategy; a ticker's study verdict is data about that ticker, the way its next earnings
date is.

## 2. The card

Twelve fields. The test started from ten; the right-hand column says what it changed and why.

| # | Field | What it holds | Changed by the test |
|---|---|---|---|
| 1 | **Does** | One line. | — |
| 2 | **Why it should pay** | The thesis, and where the edge comes from: a study, or the subscriber's dated view. | **Where from:** the long call has no measured edge; its reasons are its owner's view. |
| 3 | **Fit** | The screen: the script, the line a ticker must clear, and the exit the screen measured. Then who may admit a ticker below that line: nobody, a stated lower tier, or a subscriber's dated view. | **Split.** No trading code reads any screen; a typed pair row decides. Of the five pairs here, one clears its declared line (MU); two run on an owner's dated view (both CRWV pairs); two run below their line on a study's call (NBIS, NVDA). |
| 4 | **Stage** | Records only (it files what it would do and places nothing), or trades; and the test that moves it. | **New:** the dip-to-bounce records only. The house bots also run in observe mode today, which places nothing for any playbook (`fly.bots.toml:48`). |
| 5 | **Entry** | The trigger, one per phase, and what blocks it. | **Phases and blockers:** the wheel opens two different ways; the long call has no trigger at all, only blockers. |
| 6 | **Position** | Instrument, structure, strike and expiry choice, per phase. | Per phase (the wheel). |
| 7 | **Size** | The unit per entry, the count by mode, and what trims it. | **Replaced "a share of the allocation":** none of the four sizes that way. Each buys a count of contracts, spreads or tranches, and the budget only trims it. |
| 8 | **Exit** | Take profit, stop, time stop, roll; what happens to a position that does not recover; the house exits that apply. | **Added "does not recover":** the dip-to-bounce's stuck tranches stop new buys and keep their sells working. |
| 9 | **Settings** | Each choice a subscriber makes, with its bounds: symbols (from those that fit), a budget inside the allocation, mode (a table of what it moves), pause, compounding, and the view that steers it with what that view may narrow. | **Bounds, a mode table, the view.** Today the ticker comes with the pair, and per-ticker numbers are typed into the registry rather than chosen. |
| 10 | **House rules** | What it meets because the house says so: options level, one option playbook per ticker per bot, the print rules and any exemption, the 10:00 ET wait. | **New:** every option play meets these, and a subscriber choosing symbols needs to see them. |
| 11 | **Research** | What it reads: its declared screen, the study's verdict, the view, the earnings calendar, data feeds; and what it borrows from another strategy. | **Added "borrows":** the call spread runs on the run-up's evidence. |
| 12 | **What proves it wrong** | The strategy's own test: its unit (trades, reports or a date), its line, and whether code enforces it. A view's check belongs to the subscriber and is stated separately. | **Unit and enforcement:** none of the four states a number of trades, and two state tests no code runs. |

**How a field is marked.** ● when no value or rule typed for one ticker drives the field's decisions;
a ticker's words (thesis, findings, company name) are copy, not rules. ◐ when one does, and the card
holds it as a subscriber setting with bounds, the subscriber's dated view, or the study's verdict on
the ticker, giving the same decisions on today's pair. ▲ when nothing in the card can hold it without
naming the ticker. Market data read at run time (quotes, bars, the option chain, the earnings
calendar) counts as data, not a rule.

## 3. The four cards

### The wheel — strategy `wheel`, pair `CRWV-WHEEL` (◆ conviction)

| Field | What the code does | Mark |
|---|---|---|
| Does | Sells a cash-secured put; if assigned, sells covered calls on the shares until they are called away, then starts again. Each step is read from the positions alone, so a restart reads it correctly. `src/playbooks/wheel.ts:162-184` | ● |
| Why it should pay | Selling premium pays when options price more movement than the stock goes on to make, which the declared screen measures (`scripts/research/premium-fit.mjs:8-14`). CRWV's study says its premium is fair, not rich, so the pair runs on its owner's bet against the study (`src/playbooks/registry.ts:166-174`). | ● |
| Fit | Screen: `premium-fit`, passed when next month's implied volatility is at or above the 60th percentile of the stock's 30-day moves over 252 sessions and more than 5 points above their mean (`src/playbooks/research-signals.ts:99-110`). No trading code reads it. CRWV fails it and runs on its owner's dated view, which this strategy allows (`src/playbooks/pair-table.ts:95`, `src/playbooks/pair-table.ts:316-333`). | ◐ view |
| Stage | Trades. | ● |
| Entry | Holding no option and under 100 shares: sell a put. Holding 100 shares or more with no call: sell a covered call. Blocked with no report on the calendar, from 2 days before a report through the session after it, or with no expiry that ends before the next blackout (`src/playbooks/wheel.ts:186-244`, `src/domain/protected-window.ts:47-58`). The shortest expiry is 30 days; CRWV's setting lowers it to 14 (`src/playbooks/registry.ts:188`). | ◐ setting |
| Position | One sold option. Put: out of the money, at the strike nearest the mode's delta (0.15 / 0.20 / 0.25) or a setting's lower one; CRWV aims at 0.15 in every mode (`src/playbooks/registry.ts:189`). Call: nearest 0.20 / 0.25 / 0.30, at or above both share cost and spot. Expiry: the latest listed from the shortest expiry to 45 days that ends before the blackout (`src/playbooks/wheel.ts:148-160`, `src/playbooks/wheel.ts:315-345`). A view may cap the put's strike; the seeded view caps CRWV's at its cycle study's floor (`src/playbooks/conviction-seeds.ts:54-58`). | ◐ setting |
| Size | Contracts. A put sale asks for one by default; CRWV's setting asks for 3 / 6 / 10 by mode (`src/playbooks/registry.ts:192`). The guard trims that to the whole puts the budget room and cash secure, at most 20; a covered call is always one (`src/engine/option-guards.ts:49-59`, `src/engine/option-guards.ts:234-251`). | ◐ setting |
| Exit | None of its own: no take profit, stop, time stop or roll. Puts and calls are held to expiry or assignment. House exits: a sold option whose expiry now spans a report is bought back 2 sessions before the blackout, and a paused or exits-only wheel buys its put back at T-2 (`src/playbooks/option-hygiene.ts:18-39`, `src/playbooks/option-hygiene.ts:59-69`). A failed check stops new puts but lets an open put ride (`src/playbooks/with-conviction-gate.ts:21-27`). | ● |
| Settings | The pair (the ticker comes with it), mode, a budget (needed for any open), pause, compounding, a play target that is only logged, and the view that steers it. With no view this ◆ pair only exits (`src/domain/types.ts:317-375`, `src/subscriptions/subscription-roster.ts:98`). The shortest expiry, put delta and puts per sale are typed per pair, not chosen (`src/playbooks/registry.ts:188-192`). On the card they become settings bounded at 14–30 days, at most the mode's delta, and 1–20 puts. | ◐ setting |
| House rules | Options level 1. One option playbook per ticker per bot (`src/subscriptions/subscribe-eligibility.ts:184-188`). No sold option held across a report. | ● |
| Research | The declared screen, re-run weekly; no trade reads it. The pair row supplies the status, study and check date each order cites (`src/playbooks/pair-table.ts:316-333`). The seeded view's strike cap reads the cycle-phase study (`src/playbooks/conviction-steering.ts:101-112`). | ◐ verdict |
| Proves it wrong | Every order states: retire if net P/L is below $0 on 2027-01-29, or more than 1 in 3 sold puts finish in the money (`src/playbooks/wheel.ts:128-130`). The bots check the view's date, with net P/L summed over every pair that view steers; the seeded view waives the 1-in-3 test (`src/playbooks/conviction-check.ts:128-165`, `src/playbooks/conviction-seeds.ts:40-50`). No number of trades is stated. | ◐ view |

### The long call — strategy `long-call`, pair `CRWV-LONG-CALL` (◆ conviction)

| Field | What the code does | Mark |
|---|---|---|
| Does | Buys calls on the latest listed expiry 120 to 200 days out, at the strike nearest the mode's delta (0.70 / 0.60 / 0.50), holds them through earnings, and sells everything at double the average cost or with 45 days left. `src/playbooks/long-call.ts:57-72` | ● |
| Why it should pay | No measured edge: no study measures long calls held through reports (`src/playbooks/pair-table.ts:119-120`). The reasons in code are its owner's view of CRWV. A bought call's worst case is its premium, which is why it may hold a report, not why it pays (`src/engine/option-guards.ts:176-183`). | ● |
| Fit | No screen. A ticker runs only as a ◆ pair with a check day and a study; without one, `longCall()` throws when the registry loads (`src/playbooks/long-call.ts:305-311`). On the card: runs only on a subscriber's dated view. | ◐ view |
| Stage | Trades. | ● |
| Entry | No trigger: it always wants to hold calls. With none held it buys while under its cap; holding, it adds the same contract only with 90+ days left and the ask within 10% of cost (`src/playbooks/long-call.ts:239-254`). Blocked while an exit is due, while a sold contract or put sits on the ticker, inside the report's protected window, in the view's quiet period, and before 10:00 ET. The seeded view adds 6 quiet sessions after CRWV's report (`src/playbooks/conviction-seeds.ts:67`). | ◐ view |
| Position | One bought call: the latest listed expiry 120 to 200 days out, strike nearest the mode's delta and at most 0.10 off; adds buy the contract already held (`src/playbooks/long-call.ts:113-126`, `src/playbooks/long-call.ts:201-217`). The seeded view sets the earliest expiry to 2027-03-18 (`src/playbooks/conviction-seeds.ts:66`). | ◐ view |
| Size | Contracts. Each buy asks for a third of the mode's cap (15 / 30 / 60), so a full budget is in within three orders; the guard trims to at most 20 and to what the budget and cash pay for (`src/playbooks/long-call.ts:74-87`, `src/engine/option-guards.ts:52-59`). | ● |
| Exit | Sells once the bid is double the average cost, or at 45 days left; time wins a tie (`src/playbooks/long-call-rules.ts:9-12`, `src/playbooks/long-call-rules.ts:64-79`). No stop, no roll; it holds through reports. With a sold contract or put on the ticker it sells nothing, and expiry hygiene's T-2 close is the only exit (`src/playbooks/long-call.ts:344-363`). | ● |
| Settings | The pair (the ticker comes with it), mode, a budget (needed to open), pause, compounding, the filter, a play target, and the view that steers it. A subscription that names no view is pointed at the one seeded view that steers the pair, and inherits its limits and check day (`src/subscriptions/conviction-pointer.ts:99-105`, `src/playbooks/conviction-seeds.ts:47`). | ◐ view |
| House rules | Options level 2. One option playbook per ticker per bot. Exempt from the rule against holding an option across a report, but it still needs a report on the calendar and never opens inside a blackout (`src/engine/option-guards.ts:176-198`). Opens wait until 10:00 ET (`src/engine/guards.ts:244-247`). | ● |
| Research | None declared, "unvalidated" (`src/playbooks/research-signals.ts:111-115`). It reads the view's limits and check day, the earnings calendar and option quotes. | ◐ view |
| Proves it wrong | The view's check day, 2027-01-29: net P/L of the view's pairs on that bot below $0 stops new buys, and exits still run (`src/playbooks/conviction-check.ts:138-153`, `src/playbooks/conviction-seeds.ts:45`). No number of trades is stated. | ◐ view |

### The dip-to-bounce — strategy `dip-bounce`, pairs `MU-DIP-BOUNCE` (✓) and `NBIS-DIP-BOUNCE` (△)

| Field | What the code does | Mark |
|---|---|---|
| Does | Buys a $1,000 tranche when a completed 5-minute bar from 10:00 ET closes two of the stock's own 5-minute ranges below the session's volume-weighted average price, and sells it one range higher. Records only. `src/playbooks/dip-bounce.ts:8-15` | ● |
| Why it should pay | A dip far below the session's average price, measured in the stock's own range, tends to bounce far enough to pay costs. Over 58 sessions it netted +0.39% a buy on MU (t 5.3) and +0.62% on NBIS (t 2.2) after 5 bps a side; those nets used a day-5 hand-off exit that the coded rule does not run (`docs/research/intraday-dip-bounce-2026-10.md:37-48`, `scripts/research/dip-bounce.mjs:246-249`). | ● |
| Fit | Screen: `dip-bounce.mjs`, whose declared line is "makes money after 5 bps a side, and clears a day-clustered t of 3.5" (`src/playbooks/research-signals.ts:76-82`). MU clears it. NBIS, at t 2.2, does not, and runs beside MU on the study's call, marked △ below the house bar (`src/playbooks/pair-table.ts:447-465`). No code reads the screen. | ▲ NBIS |
| Stage | Records only: it files what it would buy and sell, and its size is zero in every mode (`src/playbooks/dip-bounce-play.ts:28-47`). It goes live only by a later PR, after 30 observed days (`src/playbooks/registry.ts:230-236`). | ● |
| Entry | One buy per cross: it re-arms when a bar closes back above the level, or buys again only 2 ranges below its last signal. Nothing on a report day or the session either side. Refused at the levels under Exit, or with all 25 tranches out (`src/playbooks/dip-bounce.ts:216-243`, `src/playbooks/dip-bounce.ts:303-333`). | ● |
| Position | Shares: as many whole shares as $1,000 buys at the signal bar's close, with a sell resting one range higher (`src/playbooks/dip-bounce-observation.ts:90-122`). | ● |
| Size | $1,000 a tranche, at most 25, so the rule keeps its own $25,000 book; the subscription's budget is never read (`src/playbooks/dip-bounce.ts:62-77`, `src/playbooks/dip-bounce.ts:206`). On the card, size and its limits would read off the subscriber's allocation. | ● |
| Exit | Target only: the resting sell fills at the open when a later bar opens at or above it, else when a bar trades through it. No stop, time stop or roll. A position that does not recover stops new buys: a tranche 3 sessions old or 30% of the book tied up (the signal level), or 5 sessions, 50%, or the book down 8% in a week (the gate level). The sell keeps working at both (`src/playbooks/dip-bounce.ts:17-28`, `src/playbooks/dip-bounce.ts:317-333`). | ● |
| Settings | The pair (the ticker comes with it) and pause. Mode, budget, filter and compounding change nothing it records, and a paused subscription records nothing (`src/playbooks/with-playbooks.ts:135`, `src/playbooks/with-playbooks.ts:170-184`). | ◐ setting |
| House rules | One share playbook per ticker per bot (`src/subscriptions/subscribe-eligibility.ts:184-188`). | ● |
| Research | It reads 5-minute IEX bars (the study priced consolidated bars) and the house earnings calendar (`src/alpaca/alpaca-intraday-bars.ts:6-17`). Each pair row carries the study, the status and a shelf date, 2027-01-15, after which the pair takes no new subscription (`src/playbooks/pair-table.ts:427-465`). | ◐ verdict |
| Proves it wrong | Dated tests in the study, one per ticker: MU is wrong if the re-run on fresh bars has t under 2 or the recorded run nets at or below 0; NBIS is wrong if the re-run nets at or below 0 at 5 bps (`docs/research/intraday-dip-bounce-2026-10.md:19-25`). No code runs them, and no number of trades is stated. | ▲ NBIS |

### The call spread — strategy `call-spread`, pair `NVDA-CALL-SPREAD` (✓ borrowed)

| Field | What the code does | Mark |
|---|---|---|
| Does | Buys one call debit spread (a call near 0.50 delta, and a higher call sold on the same expiry) in a ticker's pre-earnings window on a confirmed report date, and sells it back before the report. `src/playbooks/call-spread.ts:42-53` | ● |
| Why it should pay | It borrows the run-up's edge: the stock tends to rise in the sessions before a confirmed report, and the last week is a coin flip (`src/playbooks/call-spread.ts:42-48`). The spread's own P/L is untested, and the borrowed number measures 20 sessions before through the report day's close, not the D-20 to D-6 it trades (`scripts/research/earnings-controls.mjs:49-65`). | ● |
| Fit | Screen: the run-up's, whose declared line is the house bar, about p 0.001 (`src/playbooks/research-signals.ts:59-65`). NVDA's run-up is p 0.0032: below the bar, marked △ on the run-up's own row, and borrowed by this pair, which shows a plain ✓ (`src/playbooks/pair-table.ts:262-272`, `src/playbooks/pair-table.ts:371-392`). | ▲ NVDA |
| Stage | Trades. | ● |
| Entry | Opens only with no contracts on the ticker and a confirmed report date, from D-enter through D-(exit+1) trading sessions, and not within 3 calendar days after a report (`src/playbooks/call-spread.ts:143-162`, `src/playbooks/call-spread.ts:483-496`). NVDA's window, D-20 to D-6, is typed in its setting (`src/playbooks/registry.ts:134-135`); its row already records the measured exit, D-5. | ◐ verdict |
| Position | A call debit spread on one expiry: long the liquid call nearest 0.50 delta (within 0.10), short a higher strike nearest the mode's delta (0.30 / 0.25 / 0.20, within 0.05). Expiry: the latest listed after D-exit and before the report's blackout (`src/playbooks/call-spread.ts:69-82`, `src/playbooks/call-spread.ts:210-227`). | ◐ verdict |
| Size | One spread, whatever the budget: the guard caps a spread at one, and the budget only refuses an open it cannot pay for (`src/engine/option-guards.ts:49-59`). | ● |
| Exit | No take profit, stop or roll. The whole spread closes as one order from D-exit, priced from mid toward the natural side as sessions pass, and at natural within 3 days after a report (`src/playbooks/call-spread.ts:352-430`). Expiry hygiene's T-2 close is the backstop (`src/playbooks/option-hygiene.ts:18-40`). | ◐ verdict |
| Settings | The pair (the ticker comes with it), mode (the short leg's delta and the open's price), a budget (needed to open), compounding, pause, the filter. A view is optional; if one points here, its check applies (`src/playbooks/with-conviction-gate.ts:20-52`). | ◐ setting |
| House rules | Options level 3 (`src/playbooks/call-spread.ts:457`). One option playbook per ticker per bot, and the run-up's shares yield the ticker to it (`src/playbooks/option-ownership.ts:3-47`). Opens wait until 10:00 ET (`src/engine/guards.ts:244-247`). Anything but one clean spread on the ticker is left to expiry hygiene (`src/playbooks/call-spread.ts:170-201`). | ● |
| Research | Borrows the run-up's: it declares `derivesFrom` the ticker's run-up pair, but nothing reads that, and the window is typed a second time (`src/playbooks/call-spread.ts:456`, `src/playbooks/registry.ts:33`). It reads the earnings calendar and option chains. | ◐ verdict |
| Proves it wrong | Each open states: retire if the stock's D-enter to D-exit return is at or below zero on 2 of the next 3 reports (`src/playbooks/call-spread.ts:331-334`); that counts reports, not trades, and no code enforces it. What is enforced: past its shelf date, 2027-03-31, the pair takes no new subscription (`src/subscriptions/subscribe-eligibility.ts:165-166`). | ◐ verdict |

## 4. What the test found

- **2 of 4 fit the card with no rule for one ticker: the wheel and the long call.** The wheel's three
  CRWV numbers become bounded settings, which no subscription can carry yet (slice 4). Both CRWV
  pairs' convictions, limits and check days become the subscriber's dated view, which a subscription
  already points at.
- **The dip-to-bounce and the call spread break once each, the same way.** One ticker runs below its
  strategy's own declared fit line on a study's call: NBIS at t 2.2 against 3.5, NVDA at p 0.0032
  against about 0.001. The code marks that tier, △ "below the house bar" (`src/playbooks/pair-table.ts:548-558`),
  but writes no lower line for it and no rule for what such a ticker may do; every decision treats △
  as ✓. Both breaks are a missing rule, not a missing field: Fit has a place for the tier.
- **Against #6771:** the criterion asks for 3 of 4, and this is 2. The falsifier's line is "cannot
  express two of the four", and today's reading sits on it; it is judged on 2026-12-15. One decision
  closes both breaks without naming a ticker: what a ticker below its strategy's bar may do. That
  question is on #6771.
- **Nothing states a number of trades.** The card asks each playbook for one; slice 2's grader is
  what counts them.
- **Three bugs, filed on the way:** the NVDA call spread wears ✓ though its borrowed verdict misses
  the house bar (#6772); MU's and NBIS's next reports are missing from the calendar the dip-to-bounce
  reads (#6773); the CRWV wheel's Store text quotes a superseded study run (#6774).

## Exit, now required (#6954 slice 4, 2026-11-07)

Field 8 is no longer optional. A strategy carries its exit plan before it executes (Eric,
2026-11-01): a stop, a profit target or a time exit. A live bot's guards refuse an opening order
`no-exit-plan` from a pair that declares none of the three in its mode (`src/engine/guards.ts`,
`src/playbooks/exit-plan.ts`).

| Pair | Stop (sell all at market, below cost) | Target or time exit it declares |
|---|---|---|
| S1-NVDA, G1-GOOG, TACO-DJT, SAURON | 8% / 12% / 16% (conservative / standard / aggressive) | the run-up's or event's window closing; SAURON none (he sells into euphoria) |
| CRWV-WHEEL | none, on purpose | each sold contract ends at expiry; assigned shares leave by a covered call |
| CRWV-LONG-CALL | none | sells at 2× cost, or with 45 days left |
| NVDA-LONG-LEAP | none | sells half at 2× cost, the rest with 180 days left |
| NVDA-CALL-SPREAD | none (the loss is the debit paid) | sells 5 trading sessions before the report |
| BETA-SCOUT | none | sells each pick at the next session's first check |

- **The option pairs carry no stop** because the stop mechanism reads share positions only: on a
  contract it would fire on nothing, and on the wheel it would sell the shares its owner chose to
  hold. A stop priced on the contract's own premium is parked in `docs/IDEAS.md`.
- **A stopped-out pair stays out of the name**: until its window closes, or until the next session
  for a pair with no window, so a stop is never followed by a buy-back at the lower price
  (`src/playbooks/stop-latch.ts`).
- **The stop levels are unmeasured** (`HOUSE_STOP_LOSS`). Wrong if by 2026-12-15 more than half of
  stop-triggered paper exits recover past their entry within 5 sessions.

## Fit, below the bar (#6954 slice 5, 2026-11-07)

Eric answered #6771's question on 2026-11-06 ("fully autonomous trade execution where we steer, not
just watching"), read as C: a pair below its strategy's own fit line trades as it does today, at a
smaller size written once. Field 3's "who may admit a ticker below that line" now has an answer: the
△ tier, at the below-bar floor (`src/playbooks/fit-floor.ts`).

| Pair | Why it is below its bar | What changes |
|---|---|---|
| S1-NVDA | p 0.0032 against the house bar's ~0.001 | each opening buy risks at most 1% of the account (its size was 1% / 2% / 3% by mode) |
| NVDA-CALL-SPREAD | borrows S1-NVDA's verdict | a spread whose one debit is over 1% of the account is refused `below-bar-floor` |
| NBIS-DIP-BOUNCE | t 2.2 against 3.5 | nothing yet: it records only; the floor applies once it trades |

- **Every such opening order says so**: its reason ends "below its bar: sized to at most 1% of the
  account", so the decision record shows why it was small. Exits are never sized by the floor.
- **An owner can set a smaller floor** (#6954 slice 5c, 2026-11-07): the Playbook Store's form
  asks "Most each new order may risk (% of the account)" on these pairs only. Empty is the house
  1%. The Store refuses in words a value at or below 0, one at or above 1%, or a new one on a pair
  at its bar (a floor saved before a pair met its bar can still be cleared). Lowering it passes the
  delegation fog; raising or clearing it does not. The bots size the pair to the smaller of the two
  within one poll (`subscriptions.v5`), the decision's label names that percent, and the bot's
  settings change log records it ("each new order at most 0.5%").
- **The floor is unmeasured.** Wrong if by 2026-12-31 at least 10 closed below-bar paper trades
  average worse than −2% while at-or-above-bar pairs are positive; that pair then records only.

<details>
<summary><strong>How this was checked</strong> — four readers, four refuters, only what survived</summary>

- A workflow on main at `a073793` (2026-11-03): one reader per playbook filled the ten starting
  fields from the code, each claim with a `file:line`; then one refuter per card tried to break every
  claim against the code (fact, mark, restatement, omission). Of 40 fields, 4 survived as written and
  36 were corrected with their own cites; nothing a refuter could not confirm is on this page.
  Refuters confirmed 19 of the readers' 19 shape breaks and added 10.
- The doc-rot scan (`scripts/doc-rot-scan.mjs`) holds every path and line cite here: a path that
  disappears, or a line past the end of its file, is flagged. A line that moves inside its file is not
  caught, so a PR that edits a cited file re-reads the rows that cite it.

</details>

<details>
<summary><strong>Where the code disagrees with its own comments</strong> — found while filling the cards</summary>

- The wheel's header and `wheel()` say one contract at a time (`src/playbooks/wheel.ts:44`), but CRWV
  asks for 3 / 6 / 10 puts and the guard allows a cash-secured put up to 20 (`src/engine/option-guards.ts:52-59`).
- The wheel strategy's summary says "two to six weeks out" (`src/playbooks/pair-table.ts:92-93`):
  that is CRWV's setting (14 days on), not the template's default of 30–45 days
  (`src/playbooks/wheel.ts:71-73`).
- A shortest expiry outside 14–30 is clamped silently (`src/playbooks/wheel.ts:401`), while
  `src/playbooks/conviction-steering.ts:11-15` says a setting outside its bounds is refused whole.
- The seeded view's live strike cap on CRWV's wheel is the cycle study's median floor, $53.67
  (`src/playbooks/conviction-studies.json:142`), while the claim's words and the registry comment
  name a $48–52 band (`src/playbooks/registry.ts:186`).
- `longCall()` says one contract per cycle (`src/playbooks/long-call.ts:320`); each buy asks for a
  third of the cap (`src/playbooks/long-call.ts:84-87`).
- A subscriber who states their own check day gets a one-pair view that narrows nothing
  (`src/playbooks/conviction-record.ts:175-182`), so their long call runs without the seeded view's
  6-session wait or expiry floor: wider than the default.
- The dip-to-bounce rule calls k 2, m 1 "the only cell that cleared costs on MU"
  (`src/playbooks/dip-bounce.ts:8`), but every MU cell nets positive at 5 bps
  (`docs/research/intraday-dip-bounce-2026-10.md:71-84`).
- `DIP_BOUNCE_RULE.windowSessions` (20) is declared and never read; the bars feed fetches 32
  calendar days (`src/playbooks/intraday-bars-feed.ts:26-27`).
- The dip-to-bounce strategy lacks `movesNoCapital`, so the Store asks for a budget the playbook never
  reads (`src/playbooks/pair-table.ts:68-71`, `src/playbooks/pair-table.ts:171-181`).
- A pair past its shelf date "takes no new entries" (`src/playbooks/pair-table.ts:220-222`); in code
  only a new subscription is refused (`src/subscriptions/subscribe-eligibility.ts:18-20`), so live
  subscriptions keep opening.
- The call spread says it is "sized by its Store allocation" (`src/playbooks/call-spread.ts:453`);
  the guard always buys one spread.
- S1-NVDA's registry evidence says 14 of 14, P=0.004 (`src/playbooks/registry.ts:35`); both NVDA pair
  rows say 15 of 15, p=0.0032 (`src/playbooks/pair-table.ts:270`).
- NVDA's 2026-11-18 report is an estimate in the checked-in calendar
  (`src/domain/earnings-calendar.ts:102-112`), so on 2026-11-03, inside its D-20 to D-6 window, the
  run-up and the call spread open nothing.

</details>
