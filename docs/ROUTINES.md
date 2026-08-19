# Routine registry — every scheduled session, in one reviewable table

Scheduled automation runs on two substrates, and the default flipped on 2026-08-19:

1. **Repo-resident schedules (the default).** A `schedule:` trigger in `.github/workflows/` —
   today the postmaster's daily run. The clock, prompt, and permissions are version-controlled and
   PR-reviewed, and the substrate is physically incapable of the failure that killed the first
   generation of Routines (firing into a session with no repo checkout — see *Retired*, below):
   checkout is an explicit step. This repo is public, so scheduled runs cost nothing in GHA minutes.
2. **claude.ai Routines (the exception).** Server-side scheduled Claude sessions, account-level,
   invisible to the repo. Reserved for what a workflow genuinely cannot do: deliverables that live
   on the claude.ai side — a push notification to Eric's phone, a conversational session he can
   open and steer from anywhere. A Routine must be **wired to this repository** (repo source
   configured on the trigger) or it is worthless by construction — that is the lesson the first
   generation taught, at a cost of ~130 empty firings.

**House rules.**

- **No scheduled automation exists that is not in this table** — workflow schedules and claude.ai
  Routines alike. Adding the row is part of arming; retiring one moves its row to *Retired* in the
  same change.
- **Arming is Eric's, always.** A repo-resident schedule arms when he merges the PR that adds it
  (workflow files are his carve-out — they never auto-merge); a claude.ai Routine arms when he
  creates the trigger. Scheduling is an autonomy rung that is earned, not defaulted
  (docs/DELEGATION.md, trust ladder).
- **Ceiling is notification + PR.** No scheduled session trades, touches credentials, edits its own
  or any other schedule, or escalates its findings past a notification and an ordinary reviewable PR.
- **No-op must be free.** Every schedule's first act is a cheap scan whose empty result ends the
  run immediately — the scan is the contract, the schedule is just the clock.

## Active

| Schedule | Substrate · clock (UTC) | Contract | May do | May NOT do | Kill switch |
|---|---|---|---|---|---|
| **Postmaster daily run** | GHA `postmaster.yml` · `7 11 * * *` (≈06/07 ET across DST) | sweep (receipt issues for ready handoffs + never-assessed events, deduped) → stall audit → claim-and-build any ready handoff → event-research lane: `node scripts/event-scan.mjs --due` → `[]` = done; else one PR per due event per docs/process/EVENT-RESEARCH.md | open receipt issues; build claimed handoffs (PRs held for Eric); write/append `docs/research/events/<id>.md`; propose `estimate` events from the adjacency sweep; auto-merge research-ledger PRs | trade; edit playbooks, guards, or earnings-calendar entries; flip any `estimate`→`confirmed` without a primary source (IR:/BLS:/FED:); flip a handoff to `ready`; touch credentials/spend | disable the workflow in Actions, or revert the PR that armed it; everything stays runnable by hand (`workflow_dispatch` → `scan`, `npm run event:scan`) |
| **Secretary digest** | claude.ai Routine · daily 12:00 (`trig_01KaMC2uR3cFW5XTUL6rzPuS`, repo-wired 2026-08-19) | `node scripts/digest-scan.mjs --due` → `due:false` = reply "no digest due", stop; else follow `.claude/skills/secretary`; **also runs `node scripts/config-audit.mjs`** and folds any non-empty section into the digest's Needs-you tier (see docs/COACHES.md, special teams) | write `docs/digests/<date>.md` from its TEMPLATE, ship via /ship, push-notify the Needs-you count + top headline | act on findings; deploy verification teams beyond the skill's stakes rules; rewrite a shipped digest; create or modify schedules | disable the trigger; digests remain manual via `/secretary`, the audit via `node scripts/config-audit.mjs` |

Why the digest stays a claude.ai Routine: its deliverable **is** the push notification, which a
workflow cannot send. If a repo-side run ever needs to reach Eric's phone, the bridge is a poke-only
Routine a workflow fires via the API — parked in docs/IDEAS.md, not built.

## Retired (2026-08-19 — the no-checkout generation)

The review that retired these found that every fresh-session Routine had been firing into cloud
sessions with **no repository checkout** — each one's first `cd`/scan failed, so they produced
nothing, silently, while looking armed. Push notifications made them look alive; the repo's own
git history proved otherwise (zero digests in 3 due fires, zero event ledger rows at any fire
time, ~115 empty hourly fires). Their jobs moved into the repo, where the failure mode cannot exist.

| Routine | Fate |
|---|---|
| Handoff build (hourly, `trig_01D95znC5tuGNCxDawHqyaaj`) | deleted — its job was already the postmaster's push trigger (docs/HANDOFFS.md, "one hop, no polling"); the daily schedule is now the net under it. The 2026-08-17 lesson (a poller masking a severed chain while producing nothing) stands as the epitaph. |
| Event scan (daily 11:00, `trig_01RZ8gs2qC1Fk78v1qCjE8Qb`) | deleted — replaced by the postmaster's `build-events` lane: same clock, same EVENT-RESEARCH protocol, prompt now version-controlled in `postmaster.yml`. |
| Config audit digest (daily 14:00, `trig_01GrqFFLqYSCbm9BZWKWaKjF`) | deleted — the audit now rides the secretary digest Routine (still claude.ai-side, preserving the duel-log rationale in docs/COACHES.md) instead of holding its own clock. |
| Design handoff poke (poke-only, `trig_017zC6G25nbJNcCzFMFz957F`) | deleted — never fired once, was never registered here (a house-rule violation this review caught), and the handoff inbox (zip on a labeled issue → postmaster import) superseded it on 2026-08-16. |
