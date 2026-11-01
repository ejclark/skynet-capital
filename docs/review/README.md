# Reviewing a merged change, many ways

Eric, 2026-11-01: "reviews can involve many facets… Agents should be well versed to sniff out
code/architecture smells, capable of recognizing patterns, which problems to solve, solutions to
implement."

**The call:** one conductor, `.claude/workflows/post-merge-audit.js`, with lenses it loads by path,
one reference per reviewer, the same two refuters, each lens kept or killed by its own number. Not
one agent told to look for six things, which is the "find gaps" prompt restated. Not six standing
agents: the two review agents on the roster ran 4 times in 45 days, because nothing calls them.
Confidence medium: no lens below has run on any PR. Wrong if, by 2026-12-15, the first two added each
ran on 40 PRs and either trips its kill rule.

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

A recognised pattern has one home: `docs/PATTERNS.md` → *The ledger — code smells*. Each lens also
says which problems are worth solving and which are taste, because a finding with no failure or cost
to name is taste, however confident it sounds.

**Where this stands.** The audit's lens table holds one row, correctness, and it does not read these
files yet. A lens joins as one row, after its replay: performance, then smells and patterns, then
context and loop, then security. The replay in #6555 scores a lens over labelled PRs before it joins, and its set opens with
how that score could flatter a lens.

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

## Not known yet

No replay has run, so recall and manufacture are unmeasured for every lens. Each lens's real examples
were checked against this repo's history; what a reviewer does with the lens has not been checked at
all. The path counts come from one census of 650 code PRs since 2026-10-01, and they will drift.
