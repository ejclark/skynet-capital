# Lo-fi shapes — greybox HTML for structural decisions

**The convention** (`docs/PATTERNS.md` → *Lo-fi shapes*): a structural decision — what the *home* of
a journey is, what sits on one page versus a sheet or a drawer, the order of steps — arrives as
3–5 greybox shapes with real values, one artifact, three switchers (shape × journey step ×
viewport, 390 first). A prior call in Eric's own words is drawn as an A/B on the frame and flagged
with its date; never silently replaced.

**How to open:** double-click the `.html` file, or `open docs/design/lofi/trading-journeys.html`.
Vanilla HTML/CSS/JS, no build step, no network. The URL hash is the state
(`#arcade/4/390` = shape / step / viewport), so a link lands on a frame. The switchers are
keyboard-operable (Tab to a group, ← → to move, Enter/Space to pick).

**Published as** the private artifact **"Trading Journeys — Lo-fi"** (linked from the owning plan
issue, #3407). The committed file is the source of truth; republish from it. A lo-fi carries no
account data, so the teardown ban on frames does not apply.

| File | Decision it serves | Study |
|---|---|---|
| `trading-journeys.html` | the home of trading (#3407): Arcade · Outlook · Workbench · Register × ten journeys | `docs/research/trading-parity-2026-09.md` |
| `trade-chain-composition.html` | inside the (already-picked) Workbench: where the chain and chart compose with the ticket at the docked width (#3407 follow-up) — Workbench-as-shipped · Ticket Accordion · Collapsible Dock · Chain Sheet | Eric, 2026-09-22, live-reviewing the shipped Workbench |
| `sector-coverage.html` | the shape of R&D's Coverage section (#3811 slice 2, sub-issue #4314) — Calendar twin grid · Coverage rows · Coverage matrix · Sector treemap · GICS ring, plus **H · Ring over matrix**, drawn from Eric's 2026-10-07 reaction | #3811's own brief; real values from `coverageBySector()` (`src/domain/sector-coverage.ts`, slice 1), re-read 2026-10-07 |

Published: https://claude.ai/artifact/H8zbzDxvn2Nw4HW1nPt1C3 (private; republish from `trading-journeys.html` with the document wrapper stripped).

`trade-chain-composition.html` published: https://claude.ai/artifact/PXipgaX4vEekQaqUM94Knr (private; republish from the committed file).

`sector-coverage.html` — not published as an artifact; the committed file is what the plan issue links.
Its middle switcher is **account** (`no linked account` · `linked`) rather than a journey step: on a
coverage map the thing that changes what you see is not where you are in a flow, it is whether the viewer
has a broker read — which decides whether the held marks render and whether any sector-fund number may be
shown at all (#3811 criterion 5). Hash shape: `#hybrid/none/390` = shape / account / viewport, with `/vs`
appended to draw the frame beside its nearest single shape (H beside C; any other shape beside H).
