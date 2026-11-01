# Performance lens

**Fires on:** `src/server/`, `src/observatory/`, `src/autonomous/decision-db`, `src/storage/`,
`src/scripts/serve-dashboard.ts`, `src/scripts/dashboard-insights-bridge.ts`. 221 of 650 code PRs
since 2026-10-01 touched one.

**Kill rule:** under 0.1 confirmed findings per reviewed PR, or fewer than one in three surviving
the refuters, after 40 PRs: delete this file and leave the facet to the budget run.

**Size:** 3,564 characters.

A finding needs a concrete cost: the route or boot step, the store it reads, why the read grows with
history, and the budget row it moves. "This looks slow" is not a finding. Zero findings is a normal
answer: a reviewer told to find gaps manufactures them.

The number this serves is `npm run stability:budget` (`scripts/stability/budget-run.mjs`): 180 days x
12 accounts in 512 MB, every common GET at p50 under 150 ms, peak memory under 300 MB. It is not in
CI. This lens reads for the mechanism; the budget run is the oracle.

## Smells

**Whole-ledger read on a request path.** Spot it: a route or view reaching `history(`, `readAll`,
`entries()` or a sort over a whole growing JSONL store, with no cursor and no fold kept between
requests. Fix: a fold per participant that reads only appended lines
(`src/observatory/pulse-history-fold.ts` is the house shape). Not when: the store is bounded by
construction, or the path runs once per boot and the boot budget is met. Real: #2355 read each bot's
whole history per Wire request; #6232 moved it to the fold, 516 to 262 ms.

**One store ask per row.** Spot it: a loop over fills, orders or positions holding an `await
store.`, or a `Map.get` whose miss falls through to a read. Fix: batch the ask, or hold misses until
the thing can exist. Not when: a page size the route enforces bounds the loop. Real: #6503 stopped
asking about ~5,300 fills per Wire request, 166 to 122 ms.

**Rows derived for nobody.** Spot it: a derivation run for every participant, with the output
filtered to members afterwards. Fix: filter first. Not when: the cost is flat and small; this is a
finding only when a budget row shows it. Real: #6503's second half, where bots' rows were built and
then dropped.

**Cache with no invalidation key.** Spot it: a fixed TTL on a read whose source has an append event
this process already sees. Fix: key the fold on the ledger's length or the broker window. Not when:
staleness is the stated contract. Real: #6391 held stats until the ledger or broker window moved,
129 to 5 ms; #4862's 30 s memo said it was stale on purpose.

## Worth solving, or taste

Worth solving: anything that moves a budget row, and any path whose cost grows with history, since
every day makes it worse. The dashboard's out-of-memory death on 2026-10-04 was this class. Taste: a
constant-factor rewrite on a bounded path, micro-allocations, "could be a Map". A finding with no
budget row it would move is advisory.

## How to run it

1. List the diff's files on the paths above. None: say so and stop.
2. From each touched route or view, trace to the first store read. Name the store and whether it
   grows: `/data/*.jsonl` stores do; seed files and config do not.
3. A read that grows with no fold or cursor is a finding, with the budget row.
4. If the PR body carries a budget table, a row still over 150 ms after the PR is a correct finding:
   "still over budget, because X".

Refuters: trace (does a real request reach it?) and the budget run where a 512 MB runner exists.
Otherwise the refuter reads the fold and says unknown, which is not a refutation.
