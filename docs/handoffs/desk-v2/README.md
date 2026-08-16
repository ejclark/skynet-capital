# Handoff: Desk Chassis v2 + Trade Ticket

**Status:** draft <!-- draft | ready | executing | review | done — only Eric flips draft→ready -->
**Author:** Claude Design (spec) · Claude Code (contract reshape) · **Date:** 2026-08-16
**Provenance:** authored in a Claude Design session ~2026-08-14; the bundle sat staged-but-uncommitted
on Eric's Mac (the docs/LESSONS.md 2026-08-14 zero-commit incident) until salvaged 2026-08-16 from
`handoff/desk-v2`. The full design spec is preserved verbatim below the contract — reshaped, not
re-decided.

## Intent & end-state

The primary logged-in view (the "desk") becomes a net-worth-first instrument: one hero tile (net
worth, dollar-denominated multi-account chart, portfolio treemap, broker-convention balances) above
one tabbed event workspace, with trade execution (a guided/raw two-mode ticket) and
community/feedback anchored on the app rail. The design session's **Chassis Contract** (16 rulings,
below) is the binding ruleset; the bundled `.dc.html` is the visual bar.

## Acceptance criteria (EARS)

- [ ] WHEN the desk (`#4a`) is built, the implementation shall satisfy all 16 Chassis Contract rulings below. — *verify: PR review against the rulings list, one by one*
- [ ] WHEN the trade ticket ships, guided (`#5a`) and raw (`#5b`) shall be two modes of ONE ticket (guided default, raw toggle), and no order shall ever fire without the existing review screen. — *verify: trade-routes review flow + spec*
- [ ] WHILE turns 1–3 of the design file exist, the build shall not implement anything from them (historical explorations). — *verify: PR review*
- [ ] IF a bundle token disagrees with docs/BRAND.md, THEN the brand shall win and the divergence shall be logged in the decision log. — *verify: decision log entries*
- [ ] WHEN any slice ships, typecheck, lint, test, and the arch budgets shall stay green. — *verify: npm run verify exit status*

## Design bundle

| File | Authoritative for | Notes |
|---|---|---|
| `desk-directions.dc.html` | the visual bar — turns `#4a` (chassis), `#4b` (contract card), `#5a`/`#5b` (ticket), `#5c` (optional) | design reference, never production code; turns 1–3 are historical — do not build |
| this README (spec sections below) | contract rulings, screen anatomy, interactions, state, data requirements, implementation map | the design session's own words, preserved verbatim |
| `CLAUDE-md-snippet.md` | nothing — reference only | its guidance is superseded by docs/HANDOFFS.md |
| `github-workflow-design-handoff.yml` | nothing — reference only | NOT installed: workflow files are a hold-for-Eric carve-out, and `.github/workflows/handoff-detect.yml` already owns this job |

## Constraints & non-goals

- Everything under "Parked / explicitly deferred" below: XP/ranks/classes, guardrails surface,
  real-money confirmation stack, SIM/LIVE badges (until modes coexist), season theming,
  `+ VS LEAGUE` overlay rendering, skyline city, over/under predictions, home-rolled chat, mobile
  layouts.
- `#5c` (sentence assembler) is optional — build only after `#5a`/`#5b` work.
- This is a large, multi-PR build; each slice ships as its own small green PR per the repo ship loop.

## Autonomy envelope

- Visual work waits for Eric's taste — PRs open without auto-merge; he reviews live in the browser.
- The ticket must keep review-before-fire; nothing here touches live order authorization, credentials,
  or spend (the irreversible class stays Eric's).
- Brand wins on token conflicts; divergences logged, never silently adopted.

## Decision log

- 2026-08-16 — bundle salvaged from Eric's staged-but-uncommitted tree (commit `438e39f` on
  `handoff/desk-v2`) and relocated from `docs/handoffs/` flat into `docs/handoffs/desk-v2/`; the
  repo's own `docs/handoffs/README.md` (pickup doc) restored.
- 2026-08-16 — `github-workflow-design-handoff.yml` kept as bundle reference, not installed
  (duplicate of the shipped detect workflow + workflow-file carve-out).
- 2026-08-16 — `Desk Directions.dc.html` renamed to `desk-directions.dc.html` (the space broke
  the pre-commit hook's pathspec handling and would keep biting URLs/tools; content untouched).

---

<!-- ═══ The design session's spec, verbatim from here down — reshape happened above, not here. ═══ -->


## Overview
Redesign of the primary logged-in view (the "desk") for Skynet Capital, a friends-and-family options paper-trading league, plus the order-entry ticket. The desk is a net-worth-first instrument: one hero tile (net worth, dollar-denominated chart, portfolio treemap, broker-convention balances) above one tabbed event workspace, with trade execution and community/feedback anchored on the app rail. The design was converged over ~5 review rounds with the owner; the **Chassis Contract** below is the binding ruleset.

## About the Design Files
The bundled `desk-directions.dc.html` is a **design reference created in HTML** — a prototype document showing intended look and behavior, NOT production code to copy. It is a multi-turn exploration doc; only these sections are the handoff surfaces:

- **Turn 4 (`#4a`)** — Chassis v2, the default logged-in desk. **Build this.**
- **Turn 4 (`#4b`)** — The Chassis Contract (16 rulings). **Obey this.**
- **Turn 5 (`#5a`, `#5b`)** — The trade ticket: guided mode (5a) and raw mode (5b) are TWO MODES OF ONE TICKET (guided default, raw toggle). **Build both modes.**
- **Turn 5 (`#5c`)** — Sentence-assembler ticket. **Optional** enhancement of guided mode; build only after 5a/5b work.
- Turns 1–3 are historical explorations. **Do not build them.** (They contain superseded ideas: XP chips, skyline city, over/under predictions, side rails.)

**Target environment:** the `skynet-capital` codebase — a dependency-free Node/TypeScript server that renders HTML strings (no client framework, no bundler, no webfonts; CSP-safe by construction). Recreate these designs in that idiom: pure renderer functions returning HTML/SVG strings (see `src/observatory/*.ts`), design tokens as CSS custom properties in a shared `<style>` block, plain-links-over-JS for tabs/filters where possible (the existing `?tab=` pattern), progressive enhancement for the rest.

## Fidelity
**High-fidelity** for layout, hierarchy, tokens, typography, and component anatomy — recreate pixel-close using the repo's existing token system. **All data is fictional sample data** (names, dollar values, positions, option premiums); wire to real `ParticipantSnapshot` / Alpaca data. The SVGs (net-worth chart, treemap, payoff diagram, premium-by-strike chart) are reference renderings — implement as deterministic, server-rendered inline SVG exactly like `empire-skyline.ts` does today (pure function: data in, SVG string out).

## The Chassis Contract (binding rulings)
1. **Net worth leads** — combined across the member's accounts by default; a switcher isolates any combination (Alpaca caps a member at 3 accounts).
2. **Balances speak broker**: buying power, cash to trade, invested, today's G/L, total G/L.
3. **Charts: y = dollars, x = time.** Benchmark comparisons live ONLY in the Analysis tab, as % returns.
4. **One activity log** (event bus): every event typed and mode-tagged AUTO/MANUAL. Talk and raw transactions are tabs on the same feed, never separate surfaces.
5. **No XP, ranks, or classes.** Insights over points. Lore (persona names like Sauron, The Prospector) is seasoning, never a system.
6. **Real terms with plain glosses** everywhere a term appears (dual-label: "Circuit breaker · max daily loss — *trading stops for the day if losses hit the cap*").
7. **Treemap, not skyline**: area = capital deployed, color = unrealized P/L. Sim-city growth abstractions may build on it later — never announced in copy.
8. **One view, one subject** — every block moves the number or sharpens a decision.
9. **Talk is never home-rolled**: GitHub Discussions (giscus) + GitHub Issues, reachable from the rail.
10. **Orders review before they fire.** Paper-simple ticket until real money.
11. **History rows = round trips** (entry→exit per play). Analysis answers: win rate & expectancy per play type, premium capture %, benchmark % returns.
12. **Mode honesty scales with risk**: while everything is paper, one quiet footer disclosure ("Paper trading only") suffices; the moment SIM and LIVE coexist, every surface labels its mode.
13. **One altitude per layer**: a layer shows one line per thing; granularity is drill-in, never a co-tenant.
14. **Community & feedback cluster on the app rail** (talk, market reads, bug reports, feature asks → GitHub Discussions + Issues) — decoupled from trade surfaces.
15. **One workspace strip below the chart** — feed lenses and deep tables as sibling tabs. Default tab extends the chart; tabs never drive the chart; adaptive content may not shift layout.
16. **Trade types unlock by course level**, risk-ordered: 101 Buy stock · 102 Sell stock · 201 Sell secured put · 202 Sell covered call · 301 Buy long put · 302 Buy long call. 300-level locked until guided tour + level-up.

## Screens / Views

### Screen 1 — Desk Chassis (`#4a`, design width 1280px)
Root: horizontal flex on `--bg #0B0F14`.

**Icon rail** — 52px fixed, `--surface-2` bg, right hairline border. Top: brand square "S·C" (accent, 700). Nav icons 34×34, radius 9px, 14px glyphs, muted; active view (desk ◉) inverted: accent bg, `#06251F` glyph. Bottom cluster (margin-top:auto, gap 8px): ✎ feedback icon (34×34, muted — opens Community & Feedback menu: League talk ↗, Market read due date, Report a bug ↗, Request a feature ↗); **TRADE button** 38×38, radius 10px, accent bg, ⇅ glyph `#06251F`, with 7.5px mono accent label "TRADE" beneath. Trade is global chrome — one click from every screen.

**Main column** — padding 20px 24px 26px, column flex, gap 16px.

1. **Meta row**: breadcrumb `DESK / ERIC · ALL ACCOUNTS` (mono 10px, .2em tracking, muted; current segment `--text`) + YOU chip (mono 9px 700, accent bg, `#06251F` text, radius 5px); right: timestamp (mono 11px muted). No PAPER badge (ruling 12).
2. **North-star tile**: `--surface` bg, 1px border `color-mix(accent 40%, border)`, radius 14px, padding 18px 22px, column gap 13px.
   - **Number row**: net worth `$15,598,050` — mono, 44px, 700, tabular-nums. Beside it: period stats (1D/1W/1M/YTD), each a column: label mono 9px muted (YTD label accent), value 13px 700 `--pos`/`--neg`, dollar delta 9.5px muted. Top-right (margin-left:auto): **control cluster** — account chips ALL (active: accent bg) / ERIC / SAURON / PROSPECTOR (inactive: muted text, 1px border) · hairline divider (1×18px) · `+ VS LEAGUE` (dashed border — overlay of other members' traces; design intent only, defer) · divider · period chips 1D/1W/1M/YTD (active: accent text on accent-12% bg, radius 6px).
   - **Chart + treemap panel**: one bordered container (1px `--border`, radius 11px, `--surface-2`, overflow hidden), grid `2fr 1fr`, gap 0, vertical hairline between.
     - **Net-worth chart** (SVG, ref viewBox 884×232): y-axis dollar gridlines ($5.4M/$5.2M/$5.0M/$4.8M, mono 9px, right-anchored at x=50); seed line at $5.0M — accent, 28% opacity, dashed, labeled `SEED · THE FOUNDING` (8px mono accent, 1.4px tracking); x-axis month labels + `TIME →`; one polyline per account: Sauron `#35D0BA` 1.8w, Eric `#3FB950` 1.6w, Prospector `#8B9AAB` 1.4w; endpoint dots + right-anchored labels `SAURON $5.46M` (9.5px mono, persona color). Sauron's endpoint gets the ember mark: r6 `#FF9E3D` 25% halo + r2.8 `#FF7A2E` dot (the one sanctioned warm accent). Traces are per-account; the sum is the hero number.
     - **Treemap** (SVG, ref viewBox 320×206): cells = positions, area ∝ market value, 2px gutters, radius 2; fill = P/L tint (`#3FB950` 7–16% winners, `#F85149` 12–20% losers, muted 6% for the +9 aggregate cell); stroke = sector hue at 50% (tech `#35D0BA`, broad `#8B9AAB`, gold `#FFC24D`, energy `#FF9E3D`); labels: ticker mono 8–10px 700 `#E6EDF3`, weight % muted, P/L % colored. Footer bar (7px 12px, top hairline): `DEPLOYED · $4.37M · 17 POSITIONS` + accent `expand →`. No "city" language in copy (ruling 7).
   - **Broker strip**: 5-col grid, top hairline, 12px padding-top: BUYING POWER / CASH TO TRADE / INVESTED / TODAY'S G/L / TOTAL G/L — labels mono 9px .14em muted, values mono 14px 700 (G/L colored).
   - **Allocation bar**: label `ALLOCATION` + 8px two-segment bar (deployed = accent, reserve = pos 22%) + mono 10px caption `28% deployed · 72% cash reserve`.
   - **Caption line** (11px muted): "One trace per account — the sum is the number above; the switcher isolates any combination. Orders land on a review screen first, never fire on click."
3. **Workspace strip** (bottom hairline): tabs mono 11px, .06em, uppercase, padding 9px 13px, active = accent + 2px accent underline: `Since you were away` (active) · `Transactions` · `Talk · 3` · `Active · 5` · `History` · `Analysis`. Tabs are plain links (existing `?tab=` pattern). Tabs NEVER change the chart (ruling 15).
4. **Event stream panel** (`--surface`, radius 14px): header row: `EVENT STREAM · ALL SOURCES ON ONE BUS` (mono 9px muted) + filter chips ALL (active) / FINANCIAL ONLY — the filter is scoped to this tab only. Event rows: flex, baseline-aligned, 9px vertical padding, faint top hairline. Anatomy: time (mono 10.5px muted, 40px col) · type tag (70px pill, mono 9px, centered) · body (12.5px, actor bolded, instruments mono-bold) · action link (mono 10px accent, right). Tag palette: AUTO = accent border/text · MANUAL = `--text` + `--border` · INSIGHT = accent · TALK/RECAP = muted · gamified types use DASHED borders (hidden by FINANCIAL ONLY). Sample rows in the file show the exact voice ("**Sauron** placed SELL 4 NVDA 21AUG 150C — euphoria fade · rsi 81 → view reasoning →"). Footer: "the default tab extends the chart — events most relevant to what's plotted, for the selected accounts · associations adapt, layout never shifts…"
5. **Honesty footer** (mono 10px muted): "Paper trading only · History rows are round trips · benchmarks live in Analysis as % returns · unrealized P/L is mark-to-market vs. average cost".

### Screen 2 — Trade Ticket, GUIDED mode (`#5a`, ref width 600px)
Opened by the rail TRADE button or feed `open ticket →` links. Header: `NEW ORDER` eyebrow + GUIDED/RAW segmented toggle (active segment accent bg). Step indicator `1 PLAY ─ 2 SHAPE ─ 3 REVIEW` (mono, completed/active accent).

- **Play selector**: selected-play card (accent-tinted border): real term leads — "**Cash-secured put** — get paid to buy stock at a discount" + ⓘ (15px circle, hover/tap reveals the long explanation) + `change play ▴`. Below it the **risk-ordered dropdown** (ruling 16): rows `code · name · tldr`; codes mono 9.5px 700; selected row accent-tinted with ✓; OPTIONS marker on 201/202; 301/302 at 55% opacity with `🔒 LEVEL UP TO UNLOCK`; footer "ordered by risk · course number = difficulty · 300-level unlocks after the guided tour + level-up".
- **Field grid** (2-col): THE STOCK (`MSFT · $428.60 now`) · HOW MANY (`· contracts, 100 shares each` gloss; "2 · promises to buy 200 sh") · PRICE YOU'D HAPPILY BUY AT `· the strike` ($420, accent border = focused, "2.0% below now") · BY WHEN `· the expiration` (chip row 18 SEP active / 16 OCT / 20 NOV). Labels mono 9px .14em muted with lowercase gloss.
- **Premium-by-strike chart**: bordered `--surface-2` block, header `PREMIUM BY STRIKE · 18SEP26 PUTS · $/SHARE` + CHART/TABLE toggle (CHART active here). SVG bars per strike ($400–$435), selected strike accent 85%, others muted 28%; value labels above bars, strikes below; dashed spot line `NOW $428.60`. Tapping a bar sets the strike.
- **Explainer box** (accent-tinted): "You'd collect about **$2,140 now** ($10.70/sh premium) and set aside **$84,000** in case you're asked to buy — that's the 'cash-secured.'"
- **Honest payoff row** (top hairline): MAX PROFIT `+$2,140` (pos) · BREAKEVEN `$409.30` · MAX LOSS `−$81,860` (neg) + caption "max loss only if MSFT goes to $0 — honest numbers, always" + **Review order →** button (accent bg). Footer: "nothing fires from this screen — review always comes first".

### Screen 3 — Trade Ticket, RAW mode (`#5b`, ref width 680px)
Same header, RAW active. Grid `1.15fr 1fr`:
- **Broker field grid** (2-col): SIDE (BUY / SELL — SELL active with `--neg` border; gloss "selling = you take the premium") · QTY ("contracts · ×100 shares") · SYMBOL · TYPE (`MSFT PUT`, "put = the right to sell to you") · STRIKE · EXP (`$420 · 18SEP26`, "your buy price · your deadline") · ORDER (`LIMIT $10.70`, "limit = your floor, never worse") · TIME IN FORCE (`GTC`, "good-till-canceled — it waits"). Every field keeps its real broker name; gloss rides under (ruling 6).
- **Live readout panel**: `AT EXPIRATION · P/L VS MSFT PRICE` payoff SVG (red segment below breakeven, green flat cap above; breakeven dot + `$409.30`; `+$2,140 cap` label); rows: Buying power held `$84,000` · Max profit/loss `+$2,140 / −$81,860` · Guardrails `WITHIN CAPS ✓`.
- **Option chain, TABLE view** (dense): columns STRIKE / BID / ASK / Δ DELTA / OPEN INT; 7 rows ($405–$435); selected $420 row accent-tinted, bold, `◂ yours`; gloss footer "Δ delta — rough odds you're assigned · open interest — contracts outstanding · tap a row to set your strike". CHART/TABLE toggle (TABLE active here) — both views exist in both modes.
- Footer: gloss note + **Review order →**.

### Screen 4 — Sentence assembler (`#5c`, optional)
Guided-mode enhancement: intent sentence of pill-dropdowns ("I want to [get paid to buy] [MSFT] at [$420] by [Sep 18] for [200 shares]") + live translation panel `YOUR SENTENCE, IN BROKER` → `SELL 2 × MSFT 18SEP26 $420 PUT · LIMIT $10.70 · GTC` + same honest payoff stats and Review CTA. Purpose: teach the plain→broker translation by showing both simultaneously.

## Interactions & Behavior
- **Account switcher**: chips multi-select; hero number, chart traces, treemap, broker strip, and event stream all re-scope. Set-and-forget placement (top-right).
- **Period selector**: redraws chart domain + period stat emphasis. YTD default.
- **Tabs**: plain links; one-way (never mutate the chart). Default tab = digest of events most relevant to the current chart scope; adaptive emphasis may not shift layout (ruling 15).
- **FINANCIAL ONLY filter**: hides dashed-tag (non-broker) event types; lives inside the event tab only.
- **Ticket flow**: TRADE (rail) or contextual `open ticket →` → ticket (guided default; raw toggle persists per user) → **Review screen** (existing `trade-routes.ts` review pattern: form POST → review → confirm). No order ever fires from the ticket itself.
- **Chain interactions**: tap bar/row → sets strike, premium estimate + payoff numbers recompute. CHART/TABLE toggle persists per user.
- **Locks**: 301/302 rows non-interactive until curriculum level satisfied; tooltip explains the unlock path.
- **ⓘ affordances**: hover (desktop) / tap (mobile) reveals the folded long description.
- **Reduced motion**: no required animations; any added transitions must honor `prefers-reduced-motion` (repo convention).

## State Management
- Desk: `selectedAccounts: string[]` (default all), `period: '1D'|'1W'|'1M'|'YTD'`, `activeTab`, `eventFilter: 'all'|'financial'` — URL-param-backed where possible (shareable, no-JS friendly, matches leaderboard `?by=` precedent).
- Ticket: `{ mode: 'guided'|'raw', play: CourseCode, symbol, qty, strike, expiration, limit, tif, chainView: 'chart'|'table' }`; derived: premium estimate, cash-secured amount, max profit/loss, breakeven.
- Derived desk data: net worth = Σ selected equities; period deltas from history samples; treemap cells from merged positions.

## Data Requirements (the real work)
1. **History sampling per account** → period aggregates + chart traces. Seam exists: `src/observatory/history-store.ts` / `history-sampler.ts`.
2. **Unified event bus** (ruling 4): merge `DecisionRecord` (autonomous), Alpaca activities (fills), derived insights, talk pointers, recaps into one typed stream `{ at, type: FILL|DECISION|INSIGHT|TALK|RECAP|…, mode: AUTO|MANUAL, actorId, body, action? }`. SSE-pushed like the current board (`sse.ts`, `observatory-hub.ts`).
3. **Options chain data** (premiums, delta, open interest) per symbol/expiration — Alpaca options endpoints.
4. **Round-trip builder** for History/Analysis (pair entries/exits into plays) — needed later for the tabs pass, schema worth defining now.
5. **Curriculum gating**: `src/domain/curriculum.ts` maps to course codes 101–302 (ruling 16).

## Design Tokens (from `docs/BRAND.md` — already in the repo; do not fork)
`--bg #0B0F14 · --surface #131A22 · --surface-2 #0F151C · --border #223041 · --text #E6EDF3 · --muted #8B9AAB · --accent #35D0BA (machine/system) · --pos #3FB950 · --neg #F85149`. Warm ramp (`#FFF3D6 #FFC24D #FF7A2E #FF9E3D`) reserved for the Eye/ember accents only. On-accent text: `#06251F`. Type: `--sans` system stack (UI), `--mono` ui-monospace/JetBrains Mono (all data, labels, eyebrows, tickers — tabular-nums for money). Label grammar: mono 9–10px, letter-spacing .14–.22em, uppercase, muted. Radii: 5–6px chips, 8–11px controls/blocks, 13–14px cards. Green/red mean market direction ONLY — never decoration.

## Assets
None required — no images, no webfonts, no icon fonts. All glyphs are unicode (▦ ≣ ◆ ◉ ◈ ✎ ⇅ ⓘ 🔒 ▾ ▴ ◂ →) and all graphics are inline SVG generated server-side.

## Parked / explicitly deferred (do NOT build)
XP·ranks·classes; guardrails/oversight surface (returns with the autonomy spine); real-money confirmation stack; SIM/LIVE badges (until modes coexist); season theming on instruments; `+ VS LEAGUE` overlay rendering (chip ships disabled or hidden); skyline city; over/under predictions; home-rolled chat; mobile layouts (next design pass).

## Files
- `desk-directions.dc.html` — the design reference (open in a browser; turns t4 + t5 are the handoff surfaces; `#4b` is the contract card).

## Suggested implementation map (skynet-capital)
- `src/server/dashboard-server.ts` — route the desk as the default authed view.
- `src/observatory/dashboard-shell.ts` — rail (icons + ✎ + TRADE), tokens, workspace strip shell.
- NEW `src/observatory/desk-chassis.ts` — north-star tile renderer (number, controls, broker strip).
- NEW `src/observatory/networth-chart.ts` — dollar chart SVG (pattern: `equity-sparkline.ts`).
- NEW `src/observatory/portfolio-treemap.ts` — replaces `empire-skyline.ts` on the desk (keep skyline module until all call sites migrate).
- NEW `src/observatory/event-stream.ts` + bus assembly in `observatory-hub.ts`.
- `src/server/trade-routes.ts` + `self-service-forms.ts` — ticket (guided/raw) + existing review screen.
- `src/domain/curriculum.ts` — course-code gating for play types.
- Tests follow the repo's pure-renderer pattern: same data in → same HTML out.
