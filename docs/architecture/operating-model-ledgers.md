# Repo ledgers and budgets (git)

**Technology:** git-tracked Markdown and JSON

**Responsibility:** The durable operating state every lane reads and writes through PRs: research ledgers (docs/research/events, ~688 files), the market-event calendar (src/domain/market-events/<id>.json), forward-test fragments, digests, docs/LESSONS.md, docs/IDEAS.md, ratchet budgets, assessment cadence

**Code roots:** `docs/research/events/` · `docs/research/forward-tests/` · `src/domain/market-events/` · `docs/digests/` · `docs/LESSONS.md` · `docs/IDEAS.md` · `*-budget.json` · `assessment-cadence.json`

**Entrypoints:** `git`

**Grounding:** docs/DELEGATION.md rail 5 'Durable state = no record SPOF'; docs/process/EVENT-RESEARCH.md 'One file per event'; scripts/event-scan.mjs header ('Last assessed' machine contract)

**Refuter's verdict:** grounded — Change the code_roots entries to '/*-budget.json' and '/assessment-cadence.json' so they point at the repo root. Change 'every lane reads and writes through PRs' to 'externalized state that lanes change through PRs'. Dro

## Where it sits

| From | To | What | How | Refuter |
|---|---|---|---|---|
| secretary | ledgers | Writes docs/digests/<date>.md and ships it | /ship | grounded — Optional: label it "Writes docs/digests/<YYYY-MM-DD>.md (from TEMPLATE.md) and ships it via /ship (auto-merged docs PR)", and add a separate secretary → Eric edge for the push notification (Needs-you count + top headline |
| mp_events | ledgers | Research write-ups and screen rows land via PRs | docs/research/events/<id>.md, src/domain/market-events/<id>.json | grounded — Change the label to name what actually does the writing and where it goes: "Research session (research/<event-id> branch) and deterministic screen (moneypenny/screen-* branch) → PR with auto-merge → docs/research/events/ |
| gates | ledgers | Ratchets budgets down after a correction lands | --update | grounded — Label the edge "--update (manual, after a correction lands): writes min(prev, debt) to *-budget.json", and add a separate read edge ledgers -> gates: "CI compares debt to budget; fails if it grew". Note that arch-scan us |
