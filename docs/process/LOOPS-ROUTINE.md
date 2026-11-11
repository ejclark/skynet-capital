# The loops Routine — what one daily session does, and when it does nothing

Plan #7311, slice 5. The Routine's prompt on claude.ai is one line: *"Follow
`docs/process/LOOPS-ROUTINE.md` in this repo."* The steps live here, in a reviewable file, so the
claude.ai side cannot drift from them. The Routine is **not armed until Eric creates it** and its row
is in [`docs/ROUTINES.md`](../ROUTINES.md) (house rule: arming is his, and the row is part of arming).

## Why a clock at all

Both loops are event-driven by design: the audit starts at 6 merged code PRs, the flip starts when the
lanes' pullable queue is below the work dial's cap. What no repository event does is *notice* either
condition: a merge is not a tick for the flip, and a queue draining is not a tick for the audit. One
daily read of both due-checks is the cheapest honest notice: a quiet day costs two REST reads and ends
there (ROUTINES.md → *No-op must be free*).

**Predicted run time: daily, after the morning steer** (the open question on #7311; medium
confidence). The next surge measures whether a weekday-only schedule would have missed a loop.

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
4. **Report in one line.** `loops: audit <due|not due>[, filed N bugs, M proposals] · flip <due|not
   due>[, readied N of M]`. A day with both `due: false` ends here: that line is the whole run.
   The Routine writes no digest of its own.

## What it may not do

- Edit a schedule (its own or another), the work dial, `envelope.json`, or `flip/refusals.jsonl` or the
  audit marker by hand (the scripts own them).
- Flip an issue the scripts did not list, or flip past the clear-path workflow's own refusals.
- Use `fast-track` beyond what `audit-file.mjs` applies (member, money and state findings, five a run,
  #6319).
- Run on a `due: false` day beyond the two cheap reads.

## Kill switch

Pause the Routine in claude.ai → Routines. Both loops stay runnable by hand: the same two scripts and
the same two workflows, in a session.

## Falsifiers (copied from #7311, checked on the dated rows of [`LEARNING-LOOP.md`](LEARNING-LOOP.md))

- Audit: under 0.3 confirmed defects per audited PR across the next 30 audited PRs (check 2026-12-01).
- Flip: any hour on 2026-11-11..17 with admissible lane capacity and 0 pullable items.
- If the Routine runs a week and every run was `due: false` on both, the clock costs more than it
  notices: retire its row to *Retired* in the same change.
