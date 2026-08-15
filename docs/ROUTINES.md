# Routine registry — every scheduled session, in one reviewable table

Routines are server-side scheduled Claude sessions (the Claude Code trigger mechanism). They are
**not** checked-in artifacts — which is exactly why this registry exists: before it, the repo's
Routines lived only in prose (a line in HANDOFFS.md, a paragraph in COACHES.md), and nothing
answered "what runs on a clock, and what may it do?" in one place.

**House rules.**

- **No Routine exists that is not in this table.** Adding the row is part of arming; removing a
  Routine removes its row in the same change.
- **Arming is Eric's, always.** A Routine proposal ships as a `proposed` row (prompt and limits
  fully written); Eric creates the trigger and the row flips to `armed` with his date. Scheduling
  is an autonomy rung that is earned, not defaulted (docs/DELEGATION.md, trust ladder).
- **Ceiling is notification + PR.** No Routine trades, touches credentials, edits its own or any
  other Routine, or escalates its findings past a notification and an ordinary reviewable PR.
- **No-op must be free.** Every Routine's first act is a cheap scan whose empty result ends the
  session immediately — the scan is the contract, the Routine is just the clock.

| Routine | Schedule (UTC) | Fires into | Contract | May do | May NOT do | Status | Kill switch |
|---|---|---|---|---|---|---|---|
| Handoff build | hourly | fresh session | `node scripts/handoff-scan.mjs --ready` → `[]` = stop; else build per docs/HANDOFFS.md | flip ready→executing, build, open PRs via /ship | touch a non-`ready` handoff; widen scope past the bundle | **armed** (see HANDOFFS.md, layer 2) | disable the trigger; handoffs still picked up by the detect workflow + @claude layer |
| Config audit digest | daily | fresh session | `node scripts/config-audit.mjs` → empty = stop; else push-notify Eric | notify | open PRs, "fix" findings, escalate past notification | **armed** (see COACHES.md, special teams) | disable the trigger; audit still runnable by hand |
| Event scan | daily 11:00 (`0 11 * * *`, ≈06:00/07:00 ET across DST) | fresh session | `node scripts/event-scan.mjs --due` → `[]` = reply "no events due", stop; else per event follow docs/process/EVENT-RESEARCH.md by `reason` | write/append `docs/research/events/<id>.md`; propose `estimate` events found by the adjacency sweep; one PR per event via /ship | trade; edit playbooks, guards, or earnings-calendar entries; flip any `estimate`→`confirmed` without a primary source (IR:/BLS:/FED:); create or modify Routines | **armed** 2026-08-15 (Eric — "execute to enable"; `trig_01RZ8gs2qC1Fk78v1qCjE8Qb`, first fire 2026-08-16 ~11:03 UTC) | disable the trigger; the calendar keeps working via the detect workflow + manual `npm run event:scan` |
| Secretary digest | daily 12:00 (`0 12 * * *`) | fresh session | `node scripts/digest-scan.mjs --due` → `due:false` = reply "no digest due", stop; else follow `.claude/skills/secretary` | write `docs/digests/<date>.md` from its TEMPLATE, ship via /ship, push-notify the Needs-you count + top headline | act on findings; deploy verification teams beyond the skill's stakes rules; rewrite a shipped digest; create or modify Routines | **armed** 2026-08-15 (Eric — "execute to enable"; `trig_01KaMC2uR3cFW5XTUL6rzPuS`, first fire 2026-08-16 ~12:07 UTC, push notify on) | disable the trigger; digests remain manual via `/secretary` |

## Event-scan Routine — the verbatim prompt (for arming)

> You are in the skynet-capital repo. Run `node scripts/event-scan.mjs --due`. If the output is
> `[]`, reply "no events due" and STOP — do not investigate anything else. Otherwise, for each due
> event, follow the matching mode in `docs/process/EVENT-RESEARCH.md`: `never-assessed` → initial
> research producing `docs/research/events/<id>.md` from its TEMPLATE; `interval-elapsed` → pulse
> check appending ONE ledger row, including the mandatory adjacency sweep (peer prints, CPI/FOMC
> surprises, VIX regime moves, geopolitics touching the event's symbols) — any dated adjacent
> event you discover is PROPOSED as an `estimate` entry in `src/domain/market-events.ts` in the
> same PR, never `confirmed`; `event-passed-unscored` → closing outcome assessment, scoring
> registered forward tests from re-run instrument data (bust the instrument cache first: `rm -rf
> node_modules/.cache/earnings-cycle node_modules/.cache/intraday-edges`), never from memory.
> Ship one PR per event via /ship. HARD LIMITS: no trades; no edits to playbooks, guards, or
> earnings-calendar entries; no flipping any `estimate` to `confirmed` without a primary source
> (IR:/BLS:/FED:); no creating or modifying Routines; escalation ceiling is notification + PR.
> Every trading-adjacent statement you write must carry the event's confirmed/estimate label
> honestly — estimates widen caution, never trigger action.
