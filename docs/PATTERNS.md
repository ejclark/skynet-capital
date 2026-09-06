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

## The vocabulary — three words for "where does this information go"

Settled by the wargame on #1740 (2026-09-06). Each has a live instance today; use the word, not a
description, when asking for a change.

| Word | It means | The mechanism | Live instance |
|---|---|---|---|
| **kind** | a filter over one list | a query qualifier and a rail chip, one model; never a tab | `is:buy` / `is:bot` on Activity (`app/src/routes/activity.tsx`); `lens:` / `sym:` on Research |
| **section** | a different *shape* of data on the same page | the rail's section switch (`app/src/shell/section-switch.tsx`), exactly one current, URL-stateful via `?section=`; pages on a phone | Settings and Activity's Booked P&L (#1749) |
| **sub-view** | a full view of its own | a nested route plus rail sub-nav | the desk's Pulse / Decisions / Playbooks (`app/src/shell/profile-rail.tsx`) |

A section that grows into a full page graduates to a sub-view — the legacy desk's `?tab=performance`
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

## The ledger — trading surfaces

The milestone ↔ feature grammar (#1461, "The Rail Over the Form") and the Fidelity ticket study
(#1461, #1481 — the `/teardown` of 2026-09-05; frames stay in the private artifact, never here).
Skipped patterns keep a row too: a "no" with its reason is a decision the next session should not
re-make.

| Pattern | The mechanic, in a sentence | Where it lives | Came from | Status |
|---|---|---|---|---|
| **Milestone strip grammar** | Eyebrow · rail · status line, teal-edged, the same three parts wherever a milestone meets a feature; names only on rungs you have reached. | `app/src/shell/milestone-strip.tsx` | #1461 | placed on `/trade` |
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
| **A real desk's order-type inventory** | Eight order types and five time-in-force options listed flat. | — | Fidelity study row 5 | declined here — list only what this desk executes; vapor options disabled "coming soon" are a trap |
| **Three buying powers, margin, strategy dropdown** | Cash · margin · option buying power, a type selector, a calls/puts strategy list. | — | Fidelity study row 20 | declined here — paper, one desk, one number; the strategy list is the rail's preset |

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
