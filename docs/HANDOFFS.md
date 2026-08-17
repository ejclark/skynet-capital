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

## The mailbox — drop a zip on an issue (no laptop)

The lowest-friction intake, and the only one that works from the GitHub **mobile app**:

1. Open a new issue. Title it with the handoff's name — that becomes the slug (`Trailer Debut` →
   `trailer-debut`).
2. **Drag the design zip into the issue description** (the body, not a comment). Cap: 25 MB.
3. Apply the **`handoff-inbox`** label.

`.github/workflows/handoff-inbox.yml` then downloads the attachment, runs the same
`handoff-import.mjs` as the zip path, opens the handoff PR, and **comments a receipt** on the issue —
sha256, byte count, and the extracted file list — so a human who dropped a zip from a phone can see
exactly what the machine received. A dirty contract still lands the branch and the receipt says so.

**Why this works:** the repo is public, so `github.com/user-attachments/files/…` redirects to a
short-lived pre-signed URL that needs no credentials. **If this repo ever goes private, this path
breaks** — private attachments are browser-session-only (no PAT, no App token, no `GITHUB_TOKEN`) and
the intake must switch to release assets, which stay token-downloadable. The extraction half is
shared, so only the fetch step would change.

The mailbox changes *who carries the zip*, never *who authorizes the build*: the bundle still lands
at `draft`, and the `ready` flip is still Eric's alone.

## The zip path — one command

When the design session hands back a **zip** (the common case), don't unpack it by hand:

```sh
node scripts/handoff-import.mjs ~/Downloads/desk-v2.zip
```

Type the command, then drag the zip from Finder onto the terminal to fill in the path. It runs from
anywhere — it locates the repo from its own position rather than trusting the current directory — and
it unpacks, strips Finder metadata, descends any wrapper folder, adds a `**Status:** draft` line if
the bundle's README lacks one, validates the contract, branches off the latest `main`, commits, and
pushes. `--slug <name>` overrides the name; `--no-push` stops before pushing.

To go further in the same breath — import, validate, PR, auto-merge armed, and (only if you type
the flag) the `ready` flip — use the wrapper:

```sh
npm run handoff:ship -- ~/Downloads/desk-v2.zip --slug desk-v2          # lands at draft
npm run handoff:ship -- ~/Downloads/desk-v2.zip --slug desk-v2 --ready # your one-word flip, as a flag
```

A dirty contract stops the chain before any flip or PR — the bundle still lands on its branch,
inert at `draft`. Prereq for the PR step on a laptop: `gh` CLI authenticated (falls back to
`scripts/ship.sh` when a `GH_TOKEN` is in the environment instead).

**It fails loudly rather than quietly doing nothing.** Every check in it corresponds to a step that
failed silently when this was done by hand (see `docs/LESSONS.md`, 2026-08-14): the wrong clone was
current, `git add` matched no files, `commit` refused an empty tree, and a branch was pushed carrying
zero commits — so the bundle *looked* handed off and wasn't. The script refuses to reach `push` unless
it has verified a non-empty staged diff.

A dirty contract is not a failure of the import: the bundle still lands on a branch, and it cannot
trigger anything while its status is `draft`. Exit status 1 just means authoring work remains.

## Getting a bundle out of Claude Design — use "Send to Claude Code Web"

Claude Design has a **Send to Claude Code Web** action that seeds the design project directly into a
Claude Code workspace. Prefer it over exporting a zip: it is instant, it is event-driven (a button in
Design, not a poll), and it skips the download → unzip → locate → commit chain where the bundle can
land in the wrong clone or pick up Finder metadata on the way. Nothing here needs to detect it — the
seeded session simply arrives already holding the files.

**If you are a session that was just seeded from Claude Design, this section is your instruction set.**
The design project is your input; a handoff folder is your output. Do this before anything else:

1. Pick a slug (kebab-case, the feature's name — `desk-v2`, not `redesign-final-2`).
2. Write the bundle to `docs/handoffs/<slug>/` — mocks, tokens, screenshots, exactly as seeded.
3. Author `docs/handoffs/<slug>/README.md` from [`docs/handoffs/TEMPLATE.md`](handoffs/TEMPLATE.md). Translate the
   design session's own contract rulings into the contract's shape — **reshape, don't rewrite**: its
   rulings are decisions already made, and re-deciding them silently is the one thing that makes a
   handoff worse than no handoff. The **Design bundle** table is the section that earns its keep;
   fill it honestly, naming which file wins on a conflict.
4. Leave the status at **`draft`**. You are not authorized to set `ready` — that flip is Eric's, and
   it is the build trigger.
5. `npm run handoff:scan` until it reports clean, then verify (`typecheck`, `lint`, `test`) and open
   a PR. Promote it out of draft and arm auto-merge — a docs-only bundle has no carve-out.
6. Tell Eric it is clean and waiting on the one word.

That is the whole bridge. A session that follows it turns "I finished a design" into "a PR is open"
with no terminal, no zip, and no file ever touching a local disk.

## Author a handoff

<!-- The manual path, for a bundle that arrives some other way. -->

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

## The flip — Eric's one word, as a button

The authorization is a status change from `draft` to `ready`. Do it the easy way:

**Actions → “Flip a handoff to ready” → Run workflow → type the slug.**

That opens a PR with a properly-formed commit message and arms auto-merge; on merge the watcher
fires and the build begins. It refuses any handoff that is not currently `draft`, and any whose
contract does not validate — a skeleton can never be marked buildable.

**Why a button and not just editing the file:** on 2026-08-17 the hand-edit path hit commitlint —
GitHub's web editor defaults to commit messages like `Update status from draft to ready in README`
(no type) and `Fix formatting…` (capitalized subject), and the gate rejects both. The single most
important human action in the pipeline was blocked by message formatting. Editing the file by hand
still works if you type a conventional subject (`docs(handoff): flip <slug> to ready`), but the
button exists so nobody has to remember that.

Dispatching needs repo write access — the same permission editing the file needs — and `github.actor`
is recorded in the commit, so the audit trail still names the human who authorized it.

### Repo settings the pipeline assumes

One capability is **off by default on every GitHub repo** and every PR-opening workflow here needs
it: **Settings → Actions → General → Workflow permissions → "Allow GitHub Actions to create and
approve pull requests."** Without it, a workflow can commit and push a branch and then fail at the
final `gh pr create` — work done, no PR, an error naming no next step (see `docs/LESSONS.md`,
2026-08-17). The postmaster degrades honestly if it is ever off again (it comments the compare URL
instead of dying), but the setting is the real fix.

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
