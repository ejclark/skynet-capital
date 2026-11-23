# The loops Routine — what one daily session does, and when it does nothing

Plan #7311, slice 5. The Routine's prompt on claude.ai says little more than *"Follow
`docs/process/LOOPS-ROUTINE.md` in this repo."* The steps live here, in a reviewable file, so the
claude.ai side cannot drift from them. **Armed 2026-11-11 on Eric's word in chat** ("Yes, daily"):
`daily-loops`, `trig_01LowrNbHyLV24CMCqcYSNm3`, no connectors, and its row is in
[`docs/ROUTINES.md`](../ROUTINES.md) (house rule: arming is his, and the row is part of arming).

## Why a clock at all

Both loops are event-driven by design: the audit starts at 6 merged code PRs, the flip starts when the
lanes' pullable queue is below the work dial's cap. What no repository event does is *notice* either
condition: a merge is not a tick for the flip, and a queue draining is not a tick for the audit. One
daily read of both due-checks is the cheapest honest notice: a quiet day costs two REST reads and ends
there (ROUTINES.md → *No-op must be free*). The platter sweep (step 4, #7939) rides the same clock
for the same reason: a held PR going green, or main moving under the platter, is no event either; a
quiet day costs one more read.

**Run time: daily at 10:00 America/Chicago, after the morning steer** (settled 2026-11-11, the
predicted answer to #7311's open question). The next surge measures whether a weekday-only schedule
would have missed a loop.

## The steps, in order

1. **Ask the dial.** `npm run -s work-gate`. Exit 3 (`halt`, or the spend breaker tripped) → reply
   "loops: halted, nothing run" and stop. Exit 1 → a control is unreadable: reply with the error and
   stop. `conserve` is not a stop (#7311: it halves the batch): `flip-due.mjs` halves its own list, and
   the audit run takes half of the printed `prs` (rounded up, `deep` ones first) and leaves `through`
   off, so the marker stays and the rest are listed again next run.
2. **Audit.** `node scripts/audit-due.mjs`.
   - `due: false` → note it, go to step 3.
   - `due: true` → run the `post-merge-audit` workflow with the `run:` args the script printed
     (`prs`, `through`, `file: true`). The filing and the marker move are the script's job
     (`scripts/audit-file.mjs`); the session files nothing by hand and edits no marker.
3. **Flip.** `node scripts/flip-due.mjs --json`.
   - `due: false` → note it, go to step 4.
   - `due: true` → run the `clear-path-flip` workflow with `{issues: [<the listed numbers>]}` (at most
     6), save its returned object as JSON, run `node scripts/clear-path-post.mjs <file> --dry-run`,
     and when that prints no refusal run it again without `--dry-run`. Exit 1 from the post script
     stops the flip and is reported, never retried in a loop.
4. **Platter** (#7939: every rubber-stamp merge reaches Eric as one platter PR, kept conflict-free).
   `node scripts/platter-sweep.mjs` prints `rebuild` (an open platter to re-open from main, or null)
   and `adoptable` (PRs held only because their paths are protected, and protected dependabot
   patch/minor bumps). Neither → note it, go to step 5. Otherwise, in this order:
   - `rebuild` set → `scripts/ship.sh platter rebuild <its number>`. Items that will not re-board
     are left off and named on the new PR and on their issues; nothing is fixed on the platter.
   - each `adoptable` PR, oldest first → `scripts/ship.sh platter adopt <number>`. A refusal (a
     red verify on the union, a conflict) is reported and the PR stays as it was; never retried in a
     loop. `refused` needs no action: those PRs keep their own path.
5. **Graduate** (#7939 slice 3, rule 3 of [`ALIGNMENT.md`](ALIGNMENT.md)). Run
   `node scripts/moneypenny/answer-readback.mjs --ledger --apply`, then
   `node scripts/alignment-graduation.mjs --json` (advisory: it always exits 0).
   - Rows added by the read-back → commit them on a `docs/` branch off `origin/main` and open a
     normal PR with `/ship`, or carry them in the graduation PR below when there is one.
   - `eligible` empty and `sendBack` empty → note it, go to step 6.
   - For each class in `eligible`: look for an open PR whose head is its `branch`
     (`gh api "repos/{owner}/{repo}/pulls?state=open&head=ejclark:<branch>"`). One is open → note
     it and skip. None → `git fetch origin main && git checkout -B <branch> origin/main`,
     `node scripts/alignment-graduation.mjs --body "<class>" > <scratch>/body.md` (first: once the
     row is written the class is no longer `eligible` and `--body` refuses),
     `node scripts/alignment-graduation.mjs --graduate "<class>"`, commit
     (`docs(alignment): graduate <class> to decide and report`), then
     `scripts/ship.sh open "<that subject>" --body-file <scratch>/body.md --hold`. One PR per class,
     never two classes in one.
   - For each class in `sendBack`: the same branch steps with `--send-back "<class>"` and a normal
     `/ship` PR (no `--hold`): sending a class back only returns asks to him, so it needs no tap.
6. **Report in one line.** `loops: audit <due|not due>[, filed N bugs, M proposals] · flip <due|not
   due>[, readied N of M] · platter <clean|rebuilt #N → #M>[, adopted N] · graduate <none|opened #N for
   <class>|PR open|sent back <class>>`. A day with nothing due ends here: that line is the whole run.
   The Routine writes no digest of its own.

## What it may not do

- Edit a schedule (its own or another), the work dial, `envelope.json`, or `flip/refusals.jsonl` or the
  audit marker by hand (the scripts own them).
- Flip an issue the scripts did not list, or flip past the clear-path workflow's own refusals.
- Use `fast-track` beyond what `audit-file.mjs` applies (member, money and state findings, five a run,
  #6319).
- Run on a `due: false` day beyond the cheap reads: the two due-checks, the platter sweep, and step
  5's ledger read and check.
- Merge, arm or un-hold the platter, or push any branch but the `platter/<date>` it rebuilds or
  boards onto and step 5's `alignment/graduate-*` or `docs/` branches. It never force-pushes and
  never resolves a conflict on a platter.
- Board a PR the sweep did not list as `adoptable` (a taste hold, a major bump, a red PR), or
  rebuild a platter it did not name.
- Merge, arm or label-strip a graduation PR, or open one for a class the check did not list as
  `eligible`. The graduation is his tap; `--graduate` refuses a class that is not eligible, and
  rule 4's classes (`CLASS_MAP` in `scripts/alignment-graduation.mjs`) never are.
- Edit `CLASS_MAP` to make a class eligible. Adding a class to it is its own reviewed PR.

## Kill switch

Pause the Routine in claude.ai → Routines. Both loops stay runnable by hand: the same two scripts and
the same two workflows, in a session.

## Falsifiers (copied from #7311, checked on the dated rows of [`LEARNING-LOOP.md`](LEARNING-LOOP.md))

- Audit: under 0.3 confirmed defects per audited PR across the next 30 audited PRs (check 2026-12-01).
- Flip: any hour on 2026-11-11..17 with admissible lane capacity and 0 pullable items.
- If the Routine runs a week and every run was `due: false` on both, the clock costs more than it
  notices: retire its row to *Retired* in the same change.
