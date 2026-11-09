---
paths:
  - "app/src/**/*.{ts,tsx,css}"
  - "src/ui/**/*"
---

# Member surfaces

A trial of path-scoped rules (#6470): this loads when a matching file is read, so a session writing a new file without reading a neighbour misses it. If phone-layout fixes rise after this moved, it goes back into `CLAUDE.md`.

- **Mobile-first on every information surface — curate at phone width, then expand** (Eric,
2026-09-05, after reading Fidelity's mobile ticket and options chain against its desktop app: "we
will practice mobile first design here to curate that experience then expand out. The complexity
warrants taking this path, but it's also attractive because we can leverage what other
applications have built as inspiration"). Read it as *content priority*, not viewport
shrinking: what survives 390px is the curated set — the desktop layout *adds room* for what was
one swipe away (greeks beside prices instead of paged), never new concepts, and never a phone
column floating in a 1400px viewport. **Why it reaches past trading** (Eric, 2026-09-26: "a
direct parallel" to TDD — "that discipline forces us to identify the most critical pieces of
information for the task at hand upfront… This increases IA quality upfront"): 390px is a
*forcing constraint* — it makes the ranking decision that a wide canvas lets you skip, the way
test-first forces the decomposition. The phone layout is the byproduct; the ranking is the
product. AI removes the discipline tax (a phone frame costs nothing extra), so we take it by
default; what stays human is judging the ranking by eye. Held as a hypothesis — *expanding a
curated phone view is faster than retrofitting a desktop one* — confidence medium (one retrofit
on record: accounts, #2390 → a 323-line phone re-curation in #3701 sixteen days later); it is
wrong if, by 2026-10-31, the next three surfaces built phone-first each need a desktop *re-layout*
PR (a second IA pass, not added room) — then narrow back to trading. **Not** the spectacle
surfaces (the 3D scene, the `/login` canvas): their job is atmosphere, so they keep a desktop
origin and an honest phone fallback. Two mechanics make it real: a member-surface PR's first
screenshot is the phone frame (`docs/PICTURES.md` → *Screenshots*), and every plan issue for
these surfaces carries the constraint. Study the apps that already solved the density problem
before inventing — the reference lives with the plan issue (#1461, #1481), never in the repo
(a brokerage screenshot carries account data).
- **The top slot goes to whatever the surface's job values most, and "actionable at the top" is
one case of it** (Eric, 2026-11-09, settling the landing page's question box: "This was geared
towards singular-ish path oriented workflows. The view we're working on is very high level entry
point, with the ability to search and drill into more granular views. In general, the highest
impact/value (i.e. actionable items) want to be the most accessible, at the top. it is not a hard
rule.."). State the surface's job in its IA decision, then rank the content by that job:
  - A **path workflow** (a ticket, a walk, a guided fix) leads with the next action.
  - An **entry point** (the landing page, a section's front page) leads with the overview that
  shows a member where to go. Its search or question box sits right under the overview, as the
  way to drill in.
  - When an earlier note of his says "at the top" and a later one moves something down, first ask
  which kind of surface each note was about. It may not be a conflict at all (#7018 round 3, AT9).
  - Held as a hypothesis, confidence medium. It is wrong if, by 2026-12-15, members type in the
  landing page's question box before opening any sector or story on most visits, since that
  would make the ask the entry point's highest-value item after all.
