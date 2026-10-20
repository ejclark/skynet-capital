# Routine registry — every scheduled session, in one reviewable table

**Event-driven first — no crons** (Eric, 2026-08-19: *"cron jobs are generally terrible … focus on
event driven architecture"*, and: *"we can do so much more than basic bitch cron jobs"*). A polling
clock is the last resort, argued in its row, never the default: the tick is a repository event, and
the north star for time-indexed work is wake-ups derived from the domain calendar itself
(issue #431).

Automation runs on two substrates:

1. **Repo-resident, event-driven (the default).** The event-router workflow, triggered by pushes,
   issue events and comments, dependabot PRs, and dispatch buttons. Trigger, prompt, and permissions are version-controlled and
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
| **Moneypenny Events** (formerly Postmaster) | GHA `moneypenny-events.yml` · **every push to main** (+ issue labels and state changes, new issue comments, dependabot PRs opening, dispatch buttons — no cron) | sweep (receipt issues for never-assessed events, deduped) → stall audit → feedback lane: a `ready` label on a `feedback` issue claims it (lease `claim/feedback-<n>`; docs/ISSUES.md → *Ready*) and builds per the lane envelope → plan lane: a ready-flip on a `plan` issue (the `ready` label, or a ready comment per docs/ISSUES.md → *Who may flip it*) claims it (lease `claim/plan-<n>`) and builds the slice its state block names → event-research lane: due events filtered against open `research/<id>` PRs (`dueForResearch`, specced) → one PR per event per docs/process/EVENT-RESEARCH.md → dep-warden lane: a dependabot PR opening is reviewed per `.claude/agents/dep-warden.md` (`dep-warden` job) → project sync: every issue label or state change updates the Orchestration board's Status column (`sync-project` job; it reacts to state, never decides whether to build) — *(the design canvas lane runs as a claude.ai routine, not here; a design filed as a `plan` issue is built by the plan lane above — docs/HANDOFFS.md)* | open receipt issues; build `feedback`-labeled issues and `plan`-issue slices (small/safe auto-merge, else `needs-eric`); write/append `docs/research/events/<id>.md`; propose `estimate` events from the adjacency sweep; auto-merge research-ledger PRs; arm auto-merge on a dependabot patch/minor bump that passes dep-warden's review and full verify | trade; edit playbooks, guards, or earnings-calendar entries; flip any `estimate`→`confirmed` without a primary source (IR:/BLS:/FED:); start work from issue creation alone (a label from someone with triage/write is the authorization); touch credentials/spend | disable the workflow in Actions, or revert the PR that armed it; everything stays runnable by hand (`workflow_dispatch` → `scan`, `npm run event:scan`) |
| **Secretary digest** | claude.ai Routine · daily 12:00 (`trig_01KaMC2uR3cFW5XTUL6rzPuS`, repo-wired 2026-08-19) | `node scripts/digest-scan.mjs --due` → `due:false` = reply "no digest due", stop; else follow `.claude/skills/secretary`; **also runs `node scripts/config-audit.mjs`** and folds any non-empty section into the digest's Needs-you tier, except ⑤ (product/UX loop freshness — lane work, into Noise absorbed) (see docs/COACHES.md, special teams); **also runs `node scripts/comment-bloat-scan.mjs`** — same ride-along shape, escalates only when the narration-comment count grows past its committed budget (volume-gated, not calendar-gated: a quiet cycle costs nothing); **also runs `node scripts/incident-scan.mjs`** — same ride-along shape, escalates only when an unlearned incident exists (a failed `main` workflow run with no docs/LESSONS.md entry naming its commit), prompting a `/retro` pass; **also runs `node scripts/doctrine-scan.mjs --due`** (issue #2287) — same ride-along shape, escalates only when a bot's `docs/BOTS-<PERSONA>.md` doctrine ledger has a `Next check` date past due with no row appended to resolve it, folded into the digest's Needs-you tier, and (#4060) any row of `docs/process/LEARNING-LOOP.md`'s *Loops running now* list whose `Next check` date has arrived while the loop is still live — each `--due` entry carries `source: "dossier"` or `"loop-list"` | write `docs/digests/<date>.md` from its TEMPLATE, ship via /ship, push-notify the Needs-you count + top headline | act on findings; deploy verification teams beyond the skill's stakes rules; rewrite a shipped digest; create or modify schedules | disable the trigger; digests remain manual via `/secretary`, the audits via `node scripts/config-audit.mjs` / `node scripts/comment-bloat-scan.mjs` / `node scripts/incident-scan.mjs` / `node scripts/doctrine-scan.mjs` |
| **Bots deploy catch-up** (#5006) | GHA `bots-catchup.yml` · **cron, every 15 minutes** (`7,22,37,52 * * * *`) + dispatch button — the one repo-resident clock, argued here: `pipeline.yml`'s bots preflight debounces a redeploy to "the next preflight", and a preflight runs only on a push, so with no further merge a bot fix sits merged-but-not-live and no repository event wakes it | run the same decision script the pipeline uses (`scripts/bots-deploy-preflight.mjs` — baseline diff, debounce, bot-relevance; never forced); skip when any `pipeline.yml` run is queued or in flight, or when `main`'s HEAD has no successful dashboard deploy (the lever reuses the dashboard's image); a `deploy` verdict pulls the pipeline's own recovery lever (`gh workflow run pipeline.yml -f force_bots_deploy=true`) | dispatch `pipeline.yml`'s `force_bots_deploy` | deploy anything itself (every deploy stays on `pipeline.yml`'s one audited path); force the preflight; touch credentials | disable the workflow in Actions, or revert the platter commit that armed it (`a05539db`, #5007); the lever stays runnable by hand (`pipeline.yml` → `workflow_dispatch` → `force_bots_deploy`) |

**Known residual, accepted on the record:** a completely quiet repo checks nothing — time-based
due-ness (a pulse check whose interval lapses, an event date passing) waits for the next merge or a
manual `scan` dispatch. The real fix is not a cron but calendar-derived one-shots — due times are
deterministic in-repo data, so the calendar itself can emit the wake-ups (issue #431; needs one
Eric-gated credential). Two clocks survive, each argued in its row and each Eric's own arming: the
digest's daily Routine, whose deliverable is the push notification only a claude.ai Routine can
send, and the bots deploy catch-up, whose debounced redeploy has no repository event to wake it.

**A freed build slot is a tick too** (#5056 slice 2). `in-progress` coming off an issue — a build
ending with or without a merge — re-checks the build queue and re-dispatches `scan` when work is
admissible (`scripts/moneypenny/wake.mjs`), so a red or held PR does not idle the lanes until the
next merge. Still time-based, and still waiting on a merge: a finished build's own 2h claim lease
lapsing, and a failed build's retry (kept at the merge pace on purpose, so it cannot loop).

## Retired (2026-08-19 — the no-checkout generation)

The review that retired these found that every fresh-session Routine had been firing into cloud
sessions with **no repository checkout** — each one's first `cd`/scan failed, so they produced
nothing, silently, while looking armed. Push notifications made them look alive; the repo's own
git history proved otherwise (zero digests in 3 due fires, zero event ledger rows at any fire
time, ~115 empty hourly fires). Their jobs moved into the repo, where the failure mode cannot exist.

| Routine | Fate |
|---|---|
| Handoff build (hourly, `trig_01D95znC5tuGNCxDawHqyaaj`) | deleted — its job was already the postmaster's push trigger (docs/HANDOFFS.md, "one hop, no polling"); the daily schedule is now the net under it. The 2026-08-17 lesson (a poller masking a severed chain while producing nothing) stands as the epitaph. |
| Event scan (daily 11:00, `trig_01RZ8gs2qC1Fk78v1qCjE8Qb`) | deleted — replaced by the event router's `build-events` lane: same EVENT-RESEARCH protocol, now ticked by merges instead of a clock, prompt version-controlled in `moneypenny-events.yml` (formerly postmaster.yml). |
| Config audit digest (daily 14:00, `trig_01GrqFFLqYSCbm9BZWKWaKjF`) | deleted — the audit now rides the secretary digest Routine (still claude.ai-side, preserving the duel-log rationale in docs/COACHES.md) instead of holding its own clock. |
| Design handoff poke (poke-only, `trig_017zC6G25nbJNcCzFMFz957F`) | deleted — never fired once, was never registered here (a house-rule violation this review caught), and the handoff inbox (zip on a labeled issue → postmaster import) superseded it on 2026-08-16. |
