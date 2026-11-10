# Energy for AI — learn the sector by playing it, then pick two names

**Last assessed:** 2026-11-07 · **Campaign modes:** explore a sector → find names (#6952 slice 1) ·
**Built on:** [the 08-12 energy study](ai-energy-constraint.md), re-checked against the 11-06 tape and
the companies' own Q3 filings · Paper only: nothing here places an order.

<!-- Why the call is not the first section: the research shelf promotes a decision header (see
DECISION_HEADINGS in src/server/research-event-calls.ts) above the article, which would show every
answer before its question. Never write that heading's literal text anywhere in this file: the shelf
matches it as a substring, comments included. This page is played, so the house's
call is the last card (## The house's call), and the PR that shipped it leads with the call instead.
Each "##" is one encounter: the member route folds it into a card whose title is the heading. -->

**How to play.** Open a card, read the question, and pick an answer before you tap **Reveal**. The
house's answer marks every claim **measured** (the house computed it from prices; re-run
`node scripts/research/energy-recheck.mjs --as-of=2026-11-06`) or **reported** (a company filing,
a news report or an earlier study), each with its source and date. Six cards explore how the sector
works; five more ask whether you'd watch a name or stand aside. The last card asks two questions in
your own words. Those answers are the score.

**What changed since the 08-12 study, in one line:** the companies mostly delivered, and their
stocks fell anyway. The five names it called enterable are down 22.9% on average since then; the
regulated utilities it rejected are up.

## Explore 1 · Power gets scarce in Virginia. Who keeps the windfall?

Data centers in northern Virginia need more power than the grid can supply. Two kinds of company
sell that power.

- **A.** The regulated utility (Dominion, D). It owns the local wires and plants.
- **B.** The merchant generator (Constellation, CEG, or Vistra, VST). It sells power at market prices.
- **C.** Both, about equally.

<details><summary><strong>Reveal the house's answer</strong></summary>

**B, the merchant generator.** A regulated utility earns a return a state commission sets, about
10% on what it builds, so scarcity grows its construction budget, not its profit margin. A merchant
generator sells into a market. When power gets scarce the price rises and it keeps the difference.
*(reported · the 08-12 study, "How the sector works")*

**Research age:** that explanation is 87 days old, past the 30-day line, so it was re-checked. The
mechanism is a fact about how the two businesses are regulated and still holds. **What the tape did
is the lesson:** since 08-12, the merchants fell and the regulated utilities rose. *(measured · 08-12
→ 11-06 closes)*

| Merchant generators | Since 08-12 | Regulated utilities | Since 08-12 |
|---|---:|---:|---:|
| CEG | −10.2% | D | +1.8% |
| VST | −14.8% | SO | +0.6% |
| NRG | −26.5% | DUK | +4.4% |
| TLN | −7.2% | | |

On 10-22, a selloff the midterm ledger ties to Meta raising its spending plan, the merchant basket
fell 7.20% in one session while the utilities fund (XLU) rose 2.07%. *(measured · 10-22 closes;
the basket figure is the [midterm ledger](events/midterm-elections-2026-11-03.md)'s)* Keeping the
windfall and having a rising stock are different things. The next card shows one reason why.

</details>

## Explore 2 · The purest price of power scarcity

Where would you look to see, as one public number, how scarce power is in the eastern US grid?

- **A.** The daily wholesale power price in Texas.
- **B.** The price of the eastern grid operator's (PJM) yearly auction, where generators get paid just
  for promising to be available three years ahead.
- **C.** The stock price of the biggest utility.
- **D.** The natural gas price.

<details><summary><strong>Reveal the house's answer</strong></summary>

**B, the capacity auction**, priced in dollars per megawatt-day. PJM covers 13 mid-Atlantic states,
Virginia's data-center cluster included. *(reported · the 08-12 study)*

**The catch:** that price is capped. The auction cleared at the $325 ceiling three years running while
buying 6,831 MW less than PJM's own reliability target; PJM's simulation put the uncapped price at
$554–777. *(reported · the 08-12 study, citing PJM)* So the clearest scarcity signal in the market
can't show scarcity above $325, and the merchant windfall from Explore 1 is capped with it.

**Re-checked 11-07:** the cap covers the 2028/29 and 2029/30 auctions. The next one opens
**2026-12-09** (PJM's filing; the house had it estimated at 12-15). *(reported ·
[PJM backstop ledger](events/pjm-reliability-backstop-results-2026-12-02.md), fetched 11-02)* One
correction to the 08-12 wording: "locked through May 2030" means the 2029/30 delivery year. The
2030/31 auction, around May 2027, is the first one outside the cap, and no extension had been found
as of 09-09. *(reported · [2027-05 auction ledger](events/pjm-capacity-auction-2027-05.md))*

</details>

## Explore 3 · Who gets paid first, and who gets paid last?

A hyperscaler (Microsoft, Amazon, Google, Meta) decides to build a data center. Money flows out to
four groups. Which one gets paid **last**?

- **A.** Merchant generators selling the power.
- **B.** Makers of turbines, transformers and cooling equipment.
- **C.** Electrical contractors who wire the site.
- **D.** Gas producers and pipelines that fuel the plants.

<details><summary><strong>Reveal the house's answer</strong></summary>

**D, gas and pipelines**, and only once the plants actually burn fuel. Equipment makers get paid when
the order is placed, years earlier. Pricing power sits wherever capacity is sold out furthest ahead.
*(reported · the 08-12 study, "Money flow when AI demand hits")*

**What the tape did since 08-12:** the layer paid first fell hardest; the layer paid last held up
best. *(measured · 08-12 → 11-06)*

| Paid first: equipment | Since 08-12 | Paid last: gas | Since 08-12 |
|---|---:|---:|---:|
| Vertiv, cooling (VRT) | −36.6% | Energy Transfer, pipelines (ET) | −9.7% |
| Powell, switchgear (POWL) | −36.0% | EQT, gas producer | −8.3% |
| GE Vernova, turbines (GEV) | −25.5% | | |

When the market doubts AI spending, it sells first whatever depends most on new orders.

</details>

## Explore 4 · Twenty-eight names, one bad headline

The house follows 28 stocks tied to energy for AI: cooling, turbines, nuclear, gas, pipelines,
merchant power. On 11-05, the Nasdaq-100 fund (QQQ) fell 6.5%. How many of the 28 closed down?

- **A.** About a third. They're in different businesses.
- **B.** About half.
- **C.** All 28.

<details><summary><strong>Reveal the house's answer</strong></summary>

**C, all 28.** Seventeen fell 5% or more. The three regulated utilities moved −0.2%, +0.2% and
+0.4%. *(measured · 11-05 closes)*

It wasn't a one-off. On the basket's worst sessions since the study, nearly all of it fell together:
*(measured)*

| Session | Names down | Fell 5%+ | S&P 500 fund (SPY) |
|---|---:|---:|---:|
| 10-14 | 27 of 28 | 16 | −1.1% |
| 11-04 | 25 of 28 | 18 | **+1.7%** |
| 11-05 | 28 of 28 | 17 | −4.4% |

The 08-12 study called this **one trade in eight costumes**. Owning cooling, nuclear and pipelines
feels diversified, but they all depend on one thing: hyperscaler spending. On 11-04 the market rose
and this group still fell. *(reported · the 08-12 study, Portfolio rule 1)* That is why the study capped
the whole group at one slice of the book.

</details>

## Explore 5 · Sold out through 2028. Is that pricing power?

Modine (MOD), a data-center cooling maker, reported on 11-03: data-center revenue up 95%, record orders
and backlog, full-year outlook raised. What did the stock do the next day?

- **A.** Rose about 10%.
- **B.** Roughly flat.
- **C.** Fell about 20%.

<details><summary><strong>Reveal the house's answer</strong></summary>

**C. It fell 21.4% on 11-04.** *(measured)* The same release showed gross margin down 1.6 points to
20.7%. *(reported · Modine 8-K, 2026-11-03)*

SPX Technologies (SPXC), the 08-12 study's top pick, showed the same pattern a week earlier. Its
cooling backlog grew 14% in one quarter, not counting acquisitions, but it cut its cooling margin
outlook to 23.1–23.5% from 24.5–25.0%, blaming labor and supply-chain inefficiencies. The stock
opened 7.5% lower. *(reported · SPX 8-K and 10-Q, 2026-10-29/30; gap measured)*

The 08-12 study had a rule for this: **"sold out" is not pricing power. Ramp costs break margins
first.** A company can have more orders than it can fill and still earn less on each one while it
expands. The market pays for the margin, not the backlog.

</details>

## Explore 6 · A constraint nobody priced: permission

The 08-12 study mapped physical bottlenecks: power plants, transformers, turbines, fuel. On election
day, 11-03, towns voted on local measures about building data centers. What happened?

- **A.** Most passed. Towns want the tax base.
- **B.** About half passed.
- **C.** Nearly all were voted down.

<details><summary><strong>Reveal the house's answer</strong></summary>

**C. Voters rejected 40 of 41.** *(reported · CNBC 2026-11-05, as cited in
[the 11-05 drop study](drop-exits-nvda-crwv-2026-11.md))* The polling had warned: 64% opposed rapid
data-center construction and 77% expected higher power bills. New York has a statewide hyperscale
moratorium and Texas a pause and audit. *(reported · Reuters/Ipsos, June 2026, and the
[midterm ledger](events/midterm-elections-2026-11-03.md))*

**Why it matters for who profits:** a town saying no doesn't make power less scarce. It makes new
building slower. That hurts whoever is paid per new build: equipment makers, and merchant power sold
to new data centers. Regulated utilities face their own risk, rules that push the cost onto data
centers instead of households, but they are not paid per project. *(the house's inference, not a
measurement)* The house can't yet separate this from the rest of 11-05's selloff: the merchant
basket's move that day, net of the market, was within normal range. *(measured · midterm ledger)*

</details>

## Find names · how these cards work

Five cards follow, one for each name the 08-12 study called enterable. Each shows the 08-12 pitch,
what the house's checks say today, and three choices with equal weight: **watch it**, **enter at
starter paper size**, or **stand aside**. Standing aside is a real answer. The house takes it when
the evidence is thin.

**The house's checks** are the instruments its multi-symbol sweep runs on every name:
`research:dossier` (what the house already holds or tests on it), `earnings-cycle` (how the stock
behaves around its earnings reports compared with ordinary days) and `intraday-edges` (whether any
time-of-day pattern survives trading costs). Every 08-12 verdict below is **87 days old** and was
re-checked on 11-07 against the company's own Q3 filing.

## Find names 1 · SPXC, the cooling-tower maker

**The 08-12 pitch** *(87 days old)*: every liquid-cooled data-center megawatt still leaves through a
cooling tower or dry cooler. Data-center outlook raised twice, capacity target tripled, stock flat all
year and among the least crowded names. **Kill it if** the data-center backlog stalls or the capacity
target is walked back.

| Check | Result |
|---|---|
| Price | $142.71 · **−34.6%** since 08-12 · −42.1% from its high *(measured)* |
| Q3 (10-29) | revenue +20.5%; cooling backlog +14% in the quarter without acquisitions; capacity target held at ~$1.1B a year; cooling margin outlook **cut** *(reported · SPX 8-K/10-Q)* |
| Shock days | −6.1% on 11-04, −9.7% on 11-05. It used to be −5.4% on DeepSeek day. *(measured)* |
| Earnings reports | no edge: the run-up before reports isn't significant (n=15 since 2023, p=0.34) *(measured)* |
| Intraday | no edge after costs *(measured)* |

**Watch · enter at starter size · stand aside?**

<details><summary><strong>Reveal the house's verdict</strong></summary>

**Watch.** The kill condition hasn't fired: backlog is growing faster than before. But two things in
the pitch are now false. Margins are slipping (Explore 5), and the stock trades with the crowded AI
names, falling 9.7% on 11-05. **It becomes enterable** if the Q4 report (about 2027-02-23, estimated)
shows cooling margin at 23% or better with backlog not shrinking. **Strongest case against waiting:**
the kill condition hasn't fired and the house rule is to buy shock days. Waiting for proof means
paying after the rebound.

</details>

## Find names 2 · CMI, the generator maker inside a truck-engine company

**The 08-12 pitch** *(87 days old)*: its Power Systems unit had record sales at 24.5% margins, backup
generators sold out into late 2028, and a multi-gigawatt hyperscaler deal, all inside a stock priced
like a truck-cycle company (~19x earnings). **Kill it if** a truck downturn swamps power, or new
generator capacity in 2027–28 erodes pricing.

| Check | Result |
|---|---|
| Price | $450.07 · **−29.2%** since 08-12 · −37.9% from its high *(measured)* |
| Q3 (11-05) | Power Systems sales $2.29B (+15%), margin **25.4%** (from 22.9%); data centers named as the driver; truck engines +20%; full-year revenue growth trimmed to ~10% on weak pickups *(reported · Cummins 8-K)* |
| Not re-confirmed | the "sold out into 2H-2028" line and the multi-gigawatt deal aren't in the release *(the house could not read the call)* |
| Valuation | ~14.6x earnings without one-off tax gains, against ~19x in August *(measured from the 8-K numbers)* |
| Shock days | −5.8% on 11-04 while the S&P rose; −4.9% on 11-05 *(measured)* |
| Earnings reports · intraday | no edge either way *(measured)* |

**Watch · enter at starter size · stand aside?**

<details><summary><strong>Reveal the house's verdict</strong></summary>

**Watch, and nearest to enterable of the five.** Neither kill condition fired: trucks grew, and the
power margin went up, not down. The business got better and the stock got 29% cheaper. What's still
missing is confirmation, from the call or a primary source, that the sold-out window and data-center
orders held. The 11-04 drop came with no news from Cummins itself. **Strongest case against
waiting:** the company's own numbers already answer the kill conditions, so waiting is the
headline-driven caution the house's entry rule warns against.

</details>

## Find names 3 · BWXT, the naval and nuclear-fuel monopoly

**The 08-12 pitch** *(87 days old)*: sole supplier of Navy reactors and the only US maker of
advanced reactor fuel at scale. It gets paid whichever small-reactor design wins. Record $8.4B backlog,
about 55% turning into revenue by end-2027, stock flat. **Kill it if** new orders run below revenue
(book-to-bill under 1.0) **two quarters in a row**.

| Check | Result |
|---|---|
| Price | $119.52 · **−30.6%** since 08-12 · −49.7% from its April high *(measured)* |
| Book-to-bill | Q2 **0.72**, Q3 **0.56** *(reported · BWXT 8-Ks, 2026-08-03 and 2026-11-02)* |
| Backlog | record $8.56B, but up only through the Precision Components purchase (07-01); without it, backlog shrank about $0.4B *(reported 10-Q; the split is the house's inference)* |
| Still good | revenue +10%, adjusted EPS +26%, first 2027 outlook calls for growth *(reported)* |
| Earnings reports | after reports it trails the S&P over ten days on average, beating it 2 times in 15 *(measured)* |

**Watch · enter at starter size · stand aside?**

<details><summary><strong>Reveal the house's verdict</strong></summary>

**Stand aside: the 08-12 thesis is killed.** The kill condition was set in advance and it fired: two
quarters of book-to-bill under 1.0. Backlog growth now comes from an acquisition, not orders. A new
case would have to be filed fresh, for example on a Q4 book-to-bill of 1.0 or better in February.
It shouldn't revive this one. **Strongest case against:** Navy awards are lumpy. Year to date
book-to-bill is 1.27, earnings are up 26%, and the stock is half price.

</details>

## Find names 4 · ET, the pipeline feeding data centers

**The 08-12 pitch** *(87 days old)*: the one gas name where AI demand was already in current
earnings: about 900,000 Mcf a day flowing to Oracle data centers, guidance raised, at 8–9x earnings
against 12x+ for its peer Williams. A partnership, so it issues a K-1 tax form. **Kill it if** Oracle
has a credit or spending shock.

| Check | Result |
|---|---|
| Price | $18.92 · **−9.7%** since 08-12, a new low on 11-06 *(measured)* |
| Q3 (11-03) | adjusted EBITDA $5.03B (+31%, mostly from acquisitions); full-year guide **raised** to $19.7–19.9B from $18.8–19.1B; two new gas contracts for power plants under construction in Missouri *(reported · Energy Transfer 8-K)* |
| Not re-confirmed | the release doesn't mention Oracle or data-center volumes |
| The customer | Oracle sold **$10B of new stock** and **$10B of bonds at 7.0–8.65%** on 11-04 and says keeping investment-grade ratings is a priority; its stock is −24% since 08-12 *(reported · Oracle 8-Ks 2026-10-28 and 11-04; price measured)* |
| Shock days | −3.5% on 11-04, −1.4% on 11-05: the mildest of the five *(measured)* |
| Earnings reports · intraday | no edge; the run-up before reports is a pipeline-sector pattern, not ET's own *(measured)* |

**Watch · enter at starter size · stand aside?**

<details><summary><strong>Reveal the house's verdict</strong></summary>

**Watch.** The business delivered: guidance was raised by about $0.9B. The kill condition has
**partly fired**. A company that pays 7–8.65% to borrow and sells $10B of stock to fund data centers
is the credit strain the condition named, though there's been no default or spending cut. ET's daily
moves barely track Oracle's (correlation 0.07, n=61, measured), so the market isn't trading it as an
Oracle bet yet. **It becomes enterable** when the Q3 filing or call confirms the Oracle volumes and no
rating agency has cut Oracle. **Strongest case against:** ET lagged the S&P by 5 points on its own
report day, which may be the market pricing the counterparty risk early.

</details>

## Find names 5 · CEG, the nuclear fleet selling to hyperscalers

**The 08-12 pitch** *(87 days old)*: the cheaper leg of a crowded group. The stock was 26% off its
peak while guidance was raised, with 920 MW of new long contracts. Half size only. **Scale up if**
federal regulators (FERC) settle the rules for data centers sited at power plants, or a hyperscaler
signs a new contract priced outside the auction cap.

| Check | Result |
|---|---|
| Price | $249.95 · **−10.2%** since 08-12 · −33.7% from its high *(measured)* |
| New contracts | Amazon, 09-30: 20 years, 690 MW at Calvert Cliffs. Google, 10-06: 20 years for 890 MW of added capacity across 11 plants, plus 15 years for 2,700 MW from existing plants. Prices not disclosed *(reported · Constellation press releases)* |
| Google deal day | +12.25% to $300.40, all of it given back since *(measured)* |
| Other news | DOE conditional loan commitment of up to $5B for added capacity, 10-27 *(reported · Constellation)*; no final FERC ruling found *(the house could not reach ferc.gov)* |
| Shock days | −6.7% on 11-04, −2.5% on 11-05 *(measured)* |
| Earnings reports | no edge before reports (n=15 since 2023, p=0.10); after them it has trailed the S&P by 3.3 points over a month on average *(measured)* |
| Next report | **about 11-09** *(estimate, reported by Zacks; not confirmed by the company)* |

**Watch · enter at starter size · stand aside?**

<details><summary><strong>Reveal the house's verdict</strong></summary>

**Watch, and it resolves in days.** One of the two scale-up gates may have printed: two hyperscalers
signed 15–20-year contracts. That is how a merchant generator gets around the $325 cap (Explore 2):
it sells straight to the data center for decades. The house can't tell whether those contracts are
priced above the cap, because the prices weren't published. **The condition:** the report around 11-09
holds full-year guidance. Then it's enterable at half size, and at full size if management shows the
Google price sits above the cap. **Strongest case against waiting:** the gate the pitch waited for
has arguably printed, and the stock is 17% below its deal-day close.

</details>

## The bench · fourteen names behind a condition

The 08-12 study kept fourteen more names, each waiting on a named, dated event. Three of those
events were due by now:

| Name | Waiting on | Status 11-07 |
|---|---|---|
| ITRI, grid software | Q3 Networked Solutions growth turning up | **Not met.** That segment's revenue fell 1% *(reported · Itron 8-K, 2026-10-27)* |
| LEU, uranium enrichment | Piketon plant financing closing with under 10–15% dilution | **Not met.** No financing close in its 8-Ks since 08-12; the proposed 2027 DOE budget has no further funding for its HALEU contract *(reported · Centrus 8-K, 2026-11-04)* |
| VST, merchant power | the December auction **and** Texas's data-center audit resolving | **Can't happen in 2026.** Texas's grid operator said its study will miss its own deadline *(reported · [Texas audit ledger](events/ercot-data-center-audit-filing-2026-12-10.md))* |

The other eleven weren't re-checked here and stay behind their conditions, per the 08-12 study.
Their prices since 08-12 are in the method section's table.

## Your turn · two questions, in your own words

1. **Power gets scarce. Who profits, and why doesn't that always show up in the stock?**
2. **Which two names would you watch, and what would make you act?**

Say or write your answers before you open the house's call below.

## The house's call

**The house's answers to your two questions:**

1. **Who profits:** the merchant generator keeps the scarcity windfall, because a regulated utility's
   return is set for it. But the eastern grid caps the scarcity price at $325 a megawatt-day, so the
   generators that actually lock in the windfall sign 15–20-year contracts directly with
   hyperscalers, as CEG did with Google and Amazon. **Why the stock doesn't always show it:** the
   market paid for the windfall years ago, and it trades the whole group as one bet on hyperscaler
   spending. Since 08-12 that bet has gone against it, even as the companies delivered.
2. **The two to watch: CMI and CEG.** CMI's business improved and its stock got 29% cheaper; it's one
   confirmation from enterable. CEG may have printed the gate it was waiting on, and its report around
   11-09 settles it within days.

| Name | 08-12 | 11-07 | Confidence | Proves the call wrong |
|---|---|---|---|---|
| CMI | enterable | **watch, nearest to enterable** | medium | CMI closes above $500.10 (its 10-30 close) before its Q4 report (~2027-02-05, estimate): waiting cost the entry |
| CEG | enterable, half size | **watch until the ~11-09 report** | medium | the report cuts full-year guidance (kill), or holds it and the stock is back above $300.40 within 20 sessions (waiting cost the entry) |
| SPXC | enterable | **watch** | medium | SPXC closes above $165.20 (10-28, before its report) by 2027-02-23 while its margin outlook keeps falling |
| ET | enterable | **watch** | medium-low | a rating agency cuts Oracle below investment grade before ET's Q4 report (~2027-02-17, estimate): kill |
| BWXT | enterable | **stand aside: killed** | high | Q4 book-to-bill of 1.0 or better (~2027-02-22, estimate). That would open a new case, not revive this one |
| The group | cap the sleeve | **still one trade** | high | the next session where the median name falls 5% or more has fewer than 20 of the 28 down |
| Hyperscaler spending | the master tripwire | **not fired** | medium-low (no call read) | the first hyperscaler guides 2027 spending down or says "digestion" |

**Don't, today:** no name on this page is enterable on 11-07. Two are one fact away. Nothing here
places an order. A strategy built from these cards shadow-tests first (the build-a-strategy slice of
#6952).

## How this was checked

**Two inputs, kept apart.** Prices are **measured**: `node scripts/research/energy-recheck.mjs
--as-of=2026-11-06` (Yahoo daily closes, split- and dividend-adjusted, peaks from daily closes, never
monthly ones). Each shock session is chosen by the median name's move, so one name's bad report can't
make a basket shock. Fundamentals are **reported**: each company's own Q3 8-K press release and 10-Q,
fetched from SEC EDGAR on 11-07, plus the house's dated event ledgers where cited.

**The house's checks per name** (the instruments `.claude/workflows/symbol-sweep.js` runs, run
directly per name rather than through the workflow): `npm run research:dossier -- <SYM>`,
`node scripts/research/earnings-cycle.mjs <SYM> --bench SPY --peers …`,
`node scripts/research/intraday-edges.mjs <SYM>`. Each name's re-check ended with the strongest
argument against its own verdict, printed on its card.

**Limits, stated:**

- Web search wasn't available to this build, so no call transcript or news aggregator was read.
  Wherever a claim needed one (CMI's sold-out window, ET's Oracle volumes, the price of CEG's contracts),
  the card says so. CEG's contract facts come from Constellation's own press pages; ferc.gov, Reuters and
  Utility Dive refused the fetch.
- No earnings-cycle sample includes the Q3 reports yet (each stops at the prior print); reactions
  to them were measured from daily bars.
- The 11 bench names not listed on the bench card were not re-checked; their prices are below.
- Correction to the 08-12 study: "the collar is locked through May 2030" means the 2029/30 delivery
  year. The 2030/31 auction (~May 2027) falls outside it.

**The tape, 08-12 → 11-06** *(measured; columns: since the study · this year · below the 52-week
daily-close high · each of the basket's three worst shared sessions since the study · DeepSeek day,
the 08-12 study's crowding census)*:

| Name | Close | Since 08-12 | YTD | From 52w high | 11-04 | 10-14 | 11-05 | 2025-01-27 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| **Tier 1 · enterable on 08-12** | | | | | | | | |
| SPXC | 142.71 | -34.6% | -28.7% | -42.1% (2026-06-22) | -6.1% | -2.1% | -9.7% | -5.4% |
| CMI | 450.07 | -29.2% | -10.9% | -37.9% (2026-06-25) | -5.8% | -0.6% | -4.9% | -5.1% |
| BWXT | 119.52 | -30.6% | -30.6% | -49.7% (2026-04-15) | -7.8% | -3.2% | -5.4% | -12.7% |
| ET | 18.92 | -9.7% | +20.9% | -12.9% (2026-09-10) | -3.5% | -1.1% | -1.4% | -5.9% |
| CEG | 249.95 | -10.2% | -28.9% | -33.7% (2025-12-11) | -6.7% | -5.5% | -2.5% | -20.8% |
| **Tier 2 · behind a condition** | | | | | | | | |
| ITRI | 98.44 | -4.1% | +6.0% | -8.0% (2026-07-28) | +3.4% | -2.5% | -2.1% | -1.2% |
| EQT | 49.40 | -8.3% | -6.7% | -26.6% (2026-03-25) | -2.9% | -3.1% | -3.6% | -9.7% |
| VST | 124.80 | -14.8% | -22.3% | -34.3% (2025-11-07) | -13.8% | -6.5% | -6.2% | -28.3% |
| GNRC | 176.78 | -20.3% | +29.6% | -40.2% (2026-06-22) | -9.5% | -7.6% | -9.0% | -1.4% |
| NRG | 88.29 | -26.5% | -43.7% | -51.5% (2026-02-24) | -13.5% | -5.9% | -3.2% | -13.2% |
| LEU | 104.60 | -43.5% | -56.9% | -69.0% (2026-01-28) | -3.2% | -10.7% | -3.8% | -15.0% |
| AAON | 57.19 | -32.8% | -24.8% | -61.3% (2026-06-03) | -15.7% | -6.6% | -6.6% | -15.1% |
| HUBB | 429.45 | -16.0% | -2.4% | -22.5% (2026-04-23) | -2.5% | -1.0% | -4.4% | -8.9% |
| SARO | 27.63 | +0.9% | -3.7% | -16.6% (2026-01-27) | +1.9% | -0.6% | -1.6% | +0.3% |
| VMI | 404.31 | -17.8% | +1.0% | -30.5% (2026-06-25) | -3.9% | -1.4% | -5.4% | -3.7% |
| ENS | 147.02 | -21.1% | +0.6% | -39.4% (2026-05-26) | -7.1% | -2.2% | -8.6% | -1.0% |
| KGS | 41.67 | -32.3% | +14.1% | -45.0% (2026-06-26) | -11.3% | -3.7% | -5.6% | -11.3% |
| SEI | 57.77 | -6.3% | +26.4% | -30.2% (2026-06-18) | -16.9% | -10.9% | -12.3% | -30.4% |
| PEG | 72.61 | -3.4% | -7.2% | -14.3% (2026-02-17) | +0.6% | +0.1% | -0.2% | -6.8% |
| **Consensus leaders (not proposed)** | | | | | | | | |
| GEV | 774.11 | -25.5% | +18.7% | -34.1% (2026-06-30) | -9.3% | -6.2% | -7.5% | -21.5% |
| VRT | 182.86 | -36.6% | +12.9% | -51.4% (2026-05-14) | -12.9% | -6.1% | -14.0% | -29.9% |
| POWL | 133.12 | -36.0% | +25.4% | -58.6% (2026-05-11) | -12.4% | -7.3% | -12.6% | -16.1% |
| BE | 173.24 | -27.0% | +99.4% | -49.9% (2026-06-22) | -6.4% | -9.2% | -16.4% | -24.8% |
| TLN | 338.64 | -7.2% | -9.7% | -22.7% (2026-06-22) | -8.5% | -6.2% | -3.2% | -21.6% |
| **Regulated utilities (zero survivors)** | | | | | | | | |
| D | 68.60 | +1.8% | +20.7% | -3.3% (2026-07-16) | +4.4% | +0.8% | -0.2% | +4.2% |
| SO | 92.34 | +0.6% | +8.5% | -5.3% (2026-03-16) | -0.7% | +1.4% | +0.2% | +3.6% |
| DUK | 127.78 | +4.4% | +11.9% | -2.6% (2026-03-16) | +2.4% | +1.2% | +0.4% | +2.5% |
| **Killed on 08-12** | | | | | | | | |
| MOD | 96.61 | -51.6% | -27.6% | -68.5% (2026-06-02) | -21.4% | -8.6% | -7.3% | -26.3% |
| OKLO | 23.55 | -47.8% | -67.2% | -79.1% (2025-11-07) | -5.8% | -8.6% | -13.2% | -25.6% |
| SMR | 5.08 | -47.0% | -64.1% | -84.3% (2025-11-06) | -4.5% | -10.2% | -14.8% | -27.5% |
| UEC | 6.92 | -39.1% | -40.8% | -65.6% (2026-01-28) | -4.9% | -6.6% | -9.9% | -11.7% |
| **Benchmarks** | | | | | | | | |
| SPY | 735.29 | -4.6% | +8.7% | -5.6% (2026-10-06) | +1.7% | -1.1% | -4.4% | -1.4% |
| QQQ | 656.10 | -9.2% | +7.2% | -13.6% (2026-10-06) | +1.0% | -2.0% | -6.5% | -2.9% |
| XLE | 61.62 | +1.6% | +40.6% | -12.0% (2026-10-30) | -4.7% | +0.6% | -3.0% | -1.0% |
| XLU | 43.13 | -0.9% | +3.1% | -7.8% (2026-02-27) | +0.4% | -0.4% | -0.7% | -2.3% |

Basket median on the shock sessions: 2026-11-04 -6.1% · 2026-10-14 -5.5% · 2026-11-05 -5.4%
