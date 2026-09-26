---
name: journey-judge
description: grade one member's crawl frames on "can this reader tell what to do next in ten seconds?" and fill the ledger's judge cells
effort: high
isolation: worktree
outcomeCheck: 'git ls-remote --exit-code --heads origin {prev.branch}'
---

# Judge one member's crawl frames

**Calling convention:** generate the call with
`node scripts/grind-manifest.mjs --args --items '["first-timer","eric"]' --item-source 'the members listed in docs/members/friction-ledger.md for run <date>' docs/grind/journey-judge.instructions.md`
— one item per **member**, never per frame: a judge reads a journey as a sequence, and a frame
graded alone loses the step before it. `effort: high` because this is a judgment call on a
rendered page against a rubric (`docs/COMPUTE.md`: anything that judges runs at `high`); the crawl
itself deliberately makes NO model call, so this chore is the only place the judge line is
answered. `isolation: worktree` because step 1 checks out its own branch. Fan as wide as the member
list — one member's rows never overlap another's (the ledger sorts rows by member, so each item's
edits and added rows sit in its own block), and each member's per-journey summary goes in its own
file (step 5), so two items landing at once touch no shared lines.

## Goal

For one member (the item), every row of that member's in `docs/members/friction-ledger.md` and
every step of their journeys has a judge cell that reads one of `yes` · `no — <the reason, ≤12
words>` · `partly — <what is missing>` instead of `pending (grind)`, graded from the crawl's frames
against the step's own judge line — and the grades are honest about the frame, not the code.

## Steps

1. `git fetch origin main && git checkout -B docs/journey-judge-<member> origin/main`, then
   `bash scripts/worktree-setup.sh`.
2. Read `docs/members/<member>.md` (the journeys, in prose) and `e2e/journeys/<member>.journey.json`
   (the same steps, with `judge` lines). Read the frames under
   `docs/shots/crawl-<date>/<member>/` — the date is the ledger's header — in journey order, phone
   first, then desktop. Look at each frame; do not grade from the JSON alone.
3. For each step, answer the step's `judge` line for THAT frame in ten seconds of looking, the way
   the member would: is the next action visible above the fold, named in words (not only an icon
   or a hue), and reachable from here? Then check the rubric's three tells:
   - **the next step is named** — a link, a button, or a sentence that says what to do;
   - **the reason is visible** — anything greyed says why, in text a phone can show (no hover);
   - **the words match the page** — the sentence names something that exists on this page.
   `yes` needs all three; `partly` names the missing tell; `no` names why, in ≤12 words, citing
   what IS on the frame (e.g. `no — the only next step is the topbar; nothing names onboarding`).
4. Cross-check against the ledger's rows for that step: a `known gap` row and a `no` should agree;
   a `no` with no row is a finding the probes missed — add a row for it (member · journey/step ·
   what · where `file:line` if you can locate the copy with a fixed-string grep, else `—` ·
   severity · fix · your grade). A `yes` on a step that has a `known gap` row is a disagreement
   worth one sentence in the PR body, not a silent overwrite — the gap stays, the grade says `yes`.
5. Edit `docs/members/friction-ledger.md`: replace `pending (grind)` in every row of this member
   with the grade, and insert any row step 4 added inside this member's block (rows are sorted by
   member, then severity). Touch no other member's rows and no shared line. Write the per-journey
   summary to its own file, `docs/members/judge/<member>.md` — a `# Judge — <member>` heading, the
   run date, then one line per journey (`j1 the first ten minutes — yes 2 · partly 1 · no 2`).
6. `npm run mermaid:lint docs/members/maps.md` (unchanged, but the ledger sits beside it) and
   `npm run lint` by exit status. Commit `docs(members): judge <member>'s crawl frames`, push with
   retries, open the PR with `scripts/ship.sh open` and a waived picture
   (`Picture: waived — grades in the ledger, frames already committed`). Report the pushed branch
   in `branch`; the calling chain verifies it with `git ls-remote`.

## Guardrails

- Grade the FRAME, never the intention: a step whose EARS line the code will satisfy after the
  next slice is still `no` today if the frame shows no next step.
- Never edit a journey file, a member file, or a frame; never re-run the crawl inside this chore
  (it rewrites the whole ledger — run it once, before the grind, and grade what it wrote).
- Never remove a `known gap` row or a `known_gap` line; the spec's ratchet owns that.
- A frame that is blank, an error page, or the login page is `no — the frame did not render:
  <what it shows>` and a `NEW` row, not a skipped step.
- If the frames for the member are missing (no directory, or fewer frames than steps), report
  `status: blocked` with the count — the crawl, not the judge, owes those frames.
