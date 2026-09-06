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
pattern it uses and points at its row here. First instance: #1740's call sheet (verbatim · amended ·
reject · status quo), which settled the *kind / section / sub-view* vocabulary below.

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

## The ledger

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
| **Fidelity ticket / chain patterns** | The named patterns from the `/teardown` on Fidelity's mobile ticket and options chain. | #1461, #1481 (plan issues; images private) | Eric, 2026-09-05 | seeded — rows pending, one per pattern |

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
