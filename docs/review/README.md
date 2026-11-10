# Reviewing a merged change, many ways

Eric, 2026-11-01: "reviews can involve many facets… Agents should be well versed to sniff out
code/architecture smells, capable of recognizing patterns, which problems to solve, solutions to
implement."

**The call:** one conductor, `.claude/workflows/post-merge-audit.js`, with lenses it loads by path,
one reference per reviewer, the same two refuters, each lens kept or killed by its own number. Not
one agent told to look for six things, which is the "find gaps" prompt restated. Not six standing
agents: the two review agents on the roster ran 4 times in 45 days, because nothing calls them.
Confidence medium: of the lenses below, only performance has run on live PRs, in the audit. Wrong
if, by 2026-12-15, the first two added each ran on 40 PRs and either trips its kill rule.

**The warning every lens carries:** a reviewer told to find gaps manufactures them. So each lens asks
for a concrete failure or cost, and zero findings is a normal answer.

## The lenses

Each file loads on demand into one reviewer's prompt, so its size is what that reviewer pays. A
spec holds each under 4,000 characters (`tests/arch/review-lenses.spec.ts`).

| Lens | What it reads for | Fires on | Characters |
|---|---|---|---|
| [`lenses/adversarial.md`](lenses/adversarial.md) | The input that proves a PR wrong | every code path | 3,968 |
| [`lenses/performance.md`](lenses/performance.md) | A request or boot path whose cost grows with history | server, observatory, storage | 3,564 |
| [`lenses/context-loop.md`](lenses/context-loop.md) | What a change costs every session, and whether it can be judged | instructions, workflows, the loop registry | 3,961 |
| [`lenses/smells-and-patterns.md`](lenses/smells-and-patterns.md) | Code and architecture smells, and the pattern that answers each | `src/`, `app/src/`, when a file or an import is added | 3,986 |
| [`lenses/security.md`](lenses/security.md) | A step toward a real attacker's goal | the trust boundary | 3,792 |
| [`lenses/reuse-composability.md`](lenses/reuse-composability.md) | One concept written twice, judged from what the script prints | only when `scripts/dupe-scan.mjs --diff` prints a row | 3,429 |
| [`lenses/information-architecture.md`](lenses/information-architecture.md) | A page a member can no longer reach, data at the wrong key, a home that contradicts `docs/IA.md` | routes, the shell's nav, `docs/IA.md` (on trial, #6886) | 3,845 |

A recognised pattern has one home: `docs/PATTERNS.md` → *The ledger — code smells*. Each lens also
says which problems are worth solving and which are taste, because a finding with no failure or cost
to name is taste, however confident it sounds.

**Where this stands.** The audit's lens table holds two rows, correctness and performance. A lens
joins as one row, after its replay: smells and patterns next, then context and loop, then security.
The replay in #6555 scores a lens over labelled PRs before it joins, and its set opens with how that
score could flatter a lens.

| Lens | Replay, 2026-11-01 | Controls | Call |
|---|---|---|---|
| Performance | 8 of 8 on reading; 5 by file match, and the other 3 named the same defect at the calling file | 13 of 14 clean, the 14th on a trap | Joined |
| Smells and patterns | 1 of 3 on reading, 0 by file match; 2 of the 5 labelled PRs did not run | 8 of 8 clean | Not yet: it says little on the set, and every case in it was labelled for correctness |
| Pre-merge, 2026-11-05 | 7 of 20 at Important on reading (8 by file match, 2 of them another defect, plus 1 named at its caller); 12 of 20 at any severity, 5 of them filed as Nit | 4 Important stand after the refuter (7 before); each traces to code still on main, so they are filed as #6878 to #6881, not counted as noise | Fails the S1 bar of 9: the Nit line is the lever, and its own replay is next (#6870) |
| Pre-merge, iteration 2 (Nit means no wrong result) | 10 of 20 at Important on reading, 9 of them postable in the diff (12 by file match, 4 of them another defect, plus 2 named at their caller) | 5 Important stand on 3 controls: 2 repeat #6878 and #6881, 2 more check out on main (#6887, #6888), 1 is weak | Meets the bar on reading, at its floor. A run varies: 13 defects were found at Important in one run or the other |
| Information architecture, 2026-11-10 (#6886 slice 2) | 3 of 3 labelled defects on reading, 2 by file match (the third named the §5.9 contradiction in the file beside the label's); plus one defect nobody had labelled, a dead `/app/outpost` link left by #3343 and fixed by #3573, kept out of the recall | 5 of 5 clean | On trial: its seat in `docs/agents/seats.json` says so. Joins the audit only after 40 PRs with refuters; 4 defect PRs is too few to say more |

**The pre-merge reviewer** is a separate thing from these lenses: [`REVIEW.md`](REVIEW.md) is its whole
rulebook, read on every code PR before merge, and `review-replay.mjs`'s `pre-merge` lens replays it
with one trace refuter per PR. Its score passes only on hits the job could post, a finding in the
PR's diff: 5 of the 21 correctness cases sit in a file their PR never changed.

## Keep or kill

Written in each lens's header, and owed a row in `docs/process/LEARNING-LOOP.md` when it joins:

| Number | Keep | Kill |
|---|---|---|
| Confirmed findings per reviewed PR, after 40 PRs | 0.1 or more | under 0.1 |
| Findings surviving the two refuters, after 40 PRs | one in three or more | fewer than one in three: the lens manufactures |
| Escapes: a later defect in a PR the lens passed | none in a month | two in one facet: it is blind there, so widen it or kill it |

## Where a confirmed finding goes

| Finding | Goes to |
|---|---|
| Money, member copy, data loss, a broken gate or lane | `bug` + `fast-track`, with Found by and Introduced in |
| Lane machinery, low blast radius | `bug` + `feedback`, through the clear-path flip |
| A protected path | An item on the open platter, never its own PR |
| Reuse or a smell | The same PR if it has not merged; else `feedback` for the clean-up athletes, never fast-track |
| A context or loop finding | A rewrite by the instruction-drift chore, or a row in `docs/process/LEARNING-LOOP.md` |
| Low severity | One triage issue per batch, never dropped |

A cause seen twice becomes, cheapest first: a spec on the owning module, a gate line, a row in the
smell ledger, and a doctrine line only when a gate would cost more than the damage.

## Before merge: the plain-code core (#6870)

The pre-merge reviewer's model writes one `review.json`; everything else is plain code in
`scripts/pr-review/`, each file a pure core with fixture specs in `tests/scripts/pr-review/`:

| File | Decides |
|---|---|
| `triage.mjs` | Skip, light, standard or deep, scaled by the work dial and the day's token budget |
| `post.mjs` | Which findings reach the PR (in a changed hunk, deduplicated, capped 5 + 3, not suppressed), one `COMMENT` review, the `pr-review` status |
| `respond-route.mjs` | Whether an open Important finding gets a response session, red-session-pr's routing |
| `reeval.mjs` | Whether every Important thread is fixed by a commit or declined with a reason |
| `release.mjs` | Which holds nobody is answering after 2 hours |
| `markers.mjs` | The hidden receipt, finding, reply and respond markers that carry state between rounds |
| `ledger.mjs` | `review` / `outcome` / `escape` rows on the `data/pr-review` branch, `ledger/YYYY-MM-DD.jsonl` |

Triage routes by `scripts/review-roots.mjs`, the audit's `DEEP_ROOTS` and `DOCS_ONLY`; the audit
keeps its own copy because a workflow cannot import, and `tests/scripts/review-roots.spec.ts` fails
when the two differ. The audit's receipts ride the same branch at `audit/YYYY-MM-DD.jsonl` (#6683).
Nothing here runs in CI yet: the job that calls it is S3, on the platter.

## Not known yet

Adversarial, context and loop, security and reuse have not been replayed (information architecture has, once, over 9 PRs), so their recall and
manufacture are unmeasured. Reading a miss by hand is what moved performance from 5 of 8 to 8 of 8:
`score` matches on file, and a reviewer often names the route where the label names the view behind
it. A post-merge lens's replay has no refuters, so whether the lens survives them is the 40-PR keep
or kill above. The path counts come from one census of 650 code PRs since 2026-10-01, and they will
drift.
