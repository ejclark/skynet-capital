# Routine registry — every scheduled session, in one reviewable table

**Event-driven first — no crons** (Eric, 2026-08-19: *"cron jobs are generally terrible … focus on
event driven architecture"*, and: *"we can do so much more than basic bitch cron jobs"*). A polling
clock is the last resort, argued in its row, never the default: the tick is a repository event, and
the north star for time-indexed work is wake-ups derived from the domain calendar itself
(issue #431).

Automation runs on two substrates, and the default flipped on 2026-08-19:

1. **Repo-resident, event-driven (the default).** The event-router workflow, triggered by pushes,
   issue labels, and dispatch buttons. Trigger, prompt, and permissions are version-controlled and
   PR-reviewed, and the substrate is physically incapable of the failure that killed the first
   generation of Routines (firing into a session with no repo checkout — see *Retired*, below):
   checkout is an explicit step. This repo is public, so runs cost nothing in GHA minutes.
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

| Automation | Substrate · tick | Contract | May do | May NOT do | Kill switch |
|---|---|---|---|---|---|
| **Moneypenny Events** (formerly Postmaster) | GHA `moneypenny-events.yml` · **every push to main** (+ issue labels, dispatch buttons — no cron) | sweep (receipt issues for never-assessed events, deduped) → stall audit → feedback lane: a `feedback` label claims (lease `claim/feedback-<n>`) and builds per the lane envelope → event-research lane: due events filtered against open `research/<id>` PRs (`dueForResearch`, specced) → one PR per event per docs/process/EVENT-RESEARCH.md — *(handoff lanes retired 2026-08-21: design handoffs are `[handoff]` issues, docs/HANDOFFS.md)* | open receipt issues; build `feedback`-labeled issues (small/safe auto-merge, else `needs-eric`); write/append `docs/research/events/<id>.md`; propose `estimate` events from the adjacency sweep; auto-merge research-ledger PRs | trade; edit playbooks, guards, or earnings-calendar entries; flip any `estimate`→`confirmed` without a primary source (IR:/BLS:/FED:); start work from issue creation alone (a label from someone with triage/write is the authorization); touch credentials/spend | disable the workflow in Actions, or revert the PR that armed it; everything stays runnable by hand (`workflow_dispatch` → `scan`, `npm run event:scan`) |
| **Secretary digest** | claude.ai Routine · daily 12:00 (`trig_01KaMC2uR3cFW5XTUL6rzPuS`, repo-wired 2026-08-19) | `node scripts/digest-scan.mjs --due` → `due:false` = reply "no digest due", stop; else follow `.claude/skills/secretary`; **also runs `node scripts/config-audit.mjs`** and folds any non-empty section into the digest's Needs-you tier (see docs/COACHES.md, special teams); **also runs `node scripts/comment-bloat-scan.mjs`** (2026-08-30) — same ride-along shape, escalates only when the narration-comment count grows past its committed budget (volume-gated, not calendar-gated: a quiet cycle costs nothing) | write `docs/digests/<date>.md` from its TEMPLATE, ship via /ship, push-notify the Needs-you count + top headline | act on findings; deploy verification teams beyond the skill's stakes rules; rewrite a shipped digest; create or modify schedules | disable the trigger; digests remain manual via `/secretary`, the audits via `node scripts/config-audit.mjs` / `node scripts/comment-bloat-scan.mjs` |

**Known residual, accepted on the record:** a completely quiet repo checks nothing — time-based
due-ness (a pulse check whose interval lapses, an event date passing) waits for the next merge or a
manual `scan` dispatch. The real fix is not a cron but calendar-derived one-shots — due times are
deterministic in-repo data, so the calendar itself can emit the wake-ups (issue #431; needs one
Eric-gated credential). The digest's daily clock is the one surviving exception: its deliverable is
the push notification, which only a claude.ai Routine can send, and it is Eric's own arming.

## Retired (2026-08-19 — the no-checkout generation)

The review that retired these found that every fresh-session Routine had been firing into cloud
sessions with **no repository checkout** — each one's first `cd`/scan failed, so they produced
nothing, silently, while looking armed. Push notifications made them look alive; the repo's own
git history proved otherwise (zero digests in 3 due fires, zero event ledger rows at any fire
time, ~115 empty hourly fires). Their jobs moved into the repo, where the failure mode cannot exist.

| Routine | Fate |
|---|---|
| Handoff build (hourly, `trig_01D95znC5tuGNCxDawHqyaaj`) | deleted — its job was already the postmaster's push trigger (docs/HANDOFFS.md, "one hop, no polling"); the daily schedule is now the net under it. The 2026-08-17 lesson (a poller masking a severed chain while producing nothing) stands as the epitaph. |
| Event scan (daily 11:00, `trig_01RZ8gs2qC1Fk78v1qCjE8Qb`) | deleted — replaced by the event router's `build-events` lane: same EVENT-RESEARCH protocol, now ticked by merges instead of a clock, prompt version-controlled in `moneypenny-events.yml` (formerly `postmaster.yml`). |
| Config audit digest (daily 14:00, `trig_01GrqFFLqYSCbm9BZWKWaKjF`) | deleted — the audit now rides the secretary digest Routine (still claude.ai-side, preserving the duel-log rationale in docs/COACHES.md) instead of holding its own clock. |
| Design handoff poke (poke-only, `trig_017zC6G25nbJNcCzFMFz957F`) | deleted — never fired once, was never registered here (a house-rule violation this review caught), and the handoff inbox (zip on a labeled issue → postmaster import) superseded it on 2026-08-16. |
