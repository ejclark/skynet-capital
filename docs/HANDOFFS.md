# Design → code handoffs — retired to GitHub issues (2026-08-21)

**The repo-baked handoff system is retired** (Eric, 2026-08-21: *"temporary documents like this
should be managed in github issues, not baked into the sourcecode"*). A design handoff is queue
state, not source: it now lives its whole life as a **GitHub issue** — the same front door as every
other piece of ephemeral work (see
[`docs/plans/issue-centric-orchestration.md`](plans/issue-centric-orchestration.md)).

## The current path

1. **Finish a Claude Design session** and get the bundle out (zip, or files).
2. **Open an issue** titled `[handoff] <name>` carrying the contract — intent, EARS criteria,
   autonomy envelope — as a self-contained story capsule a fresh session can build from. Attach
   the zip to the issue (drag-drop works from the GitHub mobile app), or reference bundle files
   at a pinned commit SHA if they ever touched the repo.
3. **The go signal is explicit and Eric's**: a comment from him (any member comment starts a
   session per `claude.yml`) or a lane label. Filing an issue triggers nothing — the same safety
   property the old `draft`→`ready` flip carried.
4. The build session works from the issue, ships small green PRs, and closes the issue with the
   PR links. Visual work still opens PRs **without auto-merge** — Eric reviews the live route.

## Where the old handoffs went

| Handoff | Disposition |
|---|---|
| `brief-horizon` (the pipeline canary) | **shipped** — the morning brief reads the full event horizon (`eventsWithin`), spec-verified; issue #367 closed 2026-08-17 |
| `desk-v2` (Desk Chassis v2 + Trade Ticket) | migrated → issue **#461**, contract + SHA-pinned bundle links intact; awaiting Eric's go |
| `trailer-debut` (Season One Trailer + Field Guide) | migrated → issue **#462**, same treatment; first deliverable is the ruled flame-vs-teal comparison |

The bundles themselves remain permanently readable at commit `9792fcb` (the last `main` commit that
carried `docs/handoffs/`); the issues link every file.

## What remains to tear down

The watcher machinery (`scripts/handoff-*.mjs`, the postmaster's handoff lanes, their specs) is
removed in a follow-up PR — workflow files are a hold-for-Eric carve-out. Until that lands, the
machinery scans an empty directory and finds nothing, which is a no-op by construction.

_History: the original system (bundle in `docs/handoffs/<slug>/`, `draft`→`ready` flip, postmaster
claim-and-build) and its design rationale live in this file's git history and in
`docs/ROUTINES.md`'s retired rows. The lifecycle idea — a handoff is a plan authored elsewhere —
survives in the issue capsule format._
