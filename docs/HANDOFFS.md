# Design → code handoff — the automated pickup

**What this buys:** Eric finishes a Claude Design session, commits the bundle, flips one word to
`ready`, and a Claude Code session builds it and opens a PR. No message, no prompt, no copy-paste of
the spec. The one manual hop that remains is getting the bundle out of the design session and into
the repo — everything after the commit is automatic.

## A handoff is a plan authored elsewhere

`docs/plans/` is already this repo's unit of alignment (intent, EARS criteria, pre-settled forks, an
autonomy envelope) with the lifecycle `draft → ready → executing → review → done` and the rule that
**only Eric flips draft→ready**. A design handoff is that same object, authored in a Claude Design
session instead of a plan file, with a bundle of mocks attached. So it reuses the lifecycle whole
rather than inventing a parallel one:

| Plan | Handoff |
|---|---|
| `docs/plans/<slug>.md` | `docs/handoffs/<slug>/README.md` + the bundle beside it |
| `**Status:** ready` = Eric's go | same — and it is what the watcher polls for |
| Q&A queue, decision log | same sections, same discipline |

The payoff is a safety property, not just tidiness: **committing a bundle triggers nothing.** A
`draft` handoff can sit in the repo indefinitely. The `ready` flip is a deliberate, one-word
authorization, and it is the same gate the irreversible class already runs through.

## Author a handoff

1. Copy [`docs/handoffs/TEMPLATE.md`](handoffs/TEMPLATE.md) to `docs/handoffs/<slug>/README.md`.
2. Drop the bundle beside it — mock HTML, tokens, screenshots.
3. Fill the contract. The **Design bundle** table is the section that does the most work: it says
   which file is authoritative for what, so the build never has to guess whether the HTML or the
   prose wins.
4. Commit at `draft`. Flip to `ready` when it should build.

```sh
npm run handoff:scan               # every handoff and its status
npm run handoff:scan -- --validate # enforce the contract — this also runs in CI
```

`--validate` is a real gate, not a formality: a handoff missing its EARS criteria, or still carrying
`<trigger>` placeholders, fails `npm test` before any session can build the wrong thing from it.

## The three pickup layers

All three read the same eye — `scripts/handoff-scan.mjs --ready` — so they can never disagree about
what is live.

| Layer | Latency | Needs | Status |
|---|---|---|---|
| **1. Watcher** — `.github/workflows/handoff-detect.yml` opens a `handoff`-labelled issue on push | seconds | nothing | **on** |
| **2. Routine** — an hourly Claude Code session that scans, no-ops if idle, builds if not | ≤ 1 hour | nothing | **on** |
| **3. GitHub App** — `@claude` on the issue starts a session immediately | seconds | Eric installs the Claude Code app + adds `CLAUDE_CODE_OAUTH_TOKEN` | **inert until then** |

Layers 2 and 3 are redundant on purpose and safe together: whichever gets there first flips the
handoff to `executing` in the same PR, and the other sees a non-`ready` status and stands down.

**Layer 3 is the only genuinely event-driven path** (push → session, no polling), and it is the one
step that needs Eric's credentials. Setup, once:

1. Install the Claude Code GitHub App on `ejclark/skynet-capital` — <https://github.com/apps/claude>.
2. Add repository secret `CLAUDE_CODE_OAUTH_TOKEN` (from `claude setup-token`).

`.github/workflows/claude.yml` gates on that secret, so until it exists the workflow costs nothing
and layer 2 carries the load.

## Execution discipline (what a picked-up handoff does)

A session that takes a handoff follows the plan execution rules
([`docs/plans/README.md`](plans/README.md)) with three handoff-specific additions:

1. **Flip `ready` → `executing` in the first commit.** That is the lock. Two sessions cannot both
   claim a handoff, and a stalled build is visible in `git log` rather than silently pending.
2. **Reconcile the bundle against [`docs/BRAND.md`](BRAND.md) before writing code.** The bundle is a
   mock produced outside this repo; where its tokens disagree with the brand, **the brand wins** and
   the divergence gets a line in the decision log. A handoff cannot fork the design system by
   accident.
3. **Reuse before you add.** Check `src/ui` for an existing component; new shared atoms land there,
   not inline. The duplication gate will catch the alternative anyway — cheaper to not create it.

Then the normal loop: branch off latest `origin/main`, small green PRs via `/ship`, verify by exit
status. **Visual work waits for Eric's taste** — the handoff's autonomy envelope may narrow that,
never widen it past the irreversible class.

When every criterion is checked, flip the status to `review` and close the watcher's issue with the
PR link.

## When it does not fire

Deliberate dead-ends, all of them loud rather than silent:

- Status is not `ready` → nothing happens. This is the common case and it is correct.
- The contract fails `--validate` → the handoff is skipped by `--ready` **and** CI goes red on the
  commit that introduced it.
- No `docs/handoffs/` folder at all → the scanner reports zero and exits clean.
