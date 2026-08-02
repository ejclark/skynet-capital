# ADR-0009: Adopt the central harness gates, and delete the vendored copies

- **Status:** Proposed
- **Date:** 2026-08-02

## Context

Six of this repository's seven fitness scanners were copies of code that also lives in
[`dungeon-crawler`](https://github.com/ejclark/dungeon-crawler). Two copies of one behaviour do not
stay equal; they stay equal until the first change, and then one of them is wrong and nobody knows
which. A gate is the worst place for that, because a scanner measuring the wrong thing still reports a
confident number.

`harness.json` was added in `12f31bd` to make this possible. Its commit body set the condition
explicitly: *"the central dungeon-crawler gates produce byte-identical verdicts to the vendored
scanners on all five measurable dimensions — the precondition for deleting the vendored copies.
Nothing reads this file inside this repo yet; it is inert here and load-bearing for the harness."*

That claim was **confirmed rather than trusted**. Every scanner was run twice against this working
tree — once vendored, once central — and the outputs diffed:

| Gate | Vendored vs central | What it actually measured |
|---|---|---|
| `arch` | identical | 91 source files, largest 2781 lines, real budgets |
| `dupe` | identical | duplication debt 0 |
| `clone` | identical | real clone pairs in `personas/` |
| `dead` | identical | knip ran; 0 unused |
| `spec-gap` | identical | 0 untested of 91 |
| `incident` | identical | degraded honestly offline (GitHub 401) |

The last column matters as much as the middle one. Two scanners that both look at nothing also
produce identical output, and that would be a false green dressed as a proof — so each run was checked
for having measured something real.

## Decision

**We will delete the six vendored scanners and run the central ones from `node_modules/.bin`.**

- `tests/arch/*.spec.ts` invoke `./node_modules/.bin/harness-*` instead of `node scripts/*-scan.mjs`.
  The gates still run inside `npm test`, so they cost no extra CI minutes and cannot be skipped
  independently of the suite.
- The npm scripts (`arch:scan`, `dupe:scan`, …) point at the same binaries.
- **Budgets stay here.** `arch-budget.json` and its siblings are this repository's state, and the
  ratchet history is ours. The harness carries the procedure; the repo carries its own history.

**`scripts/dep-graph-scan.mjs` is NOT deleted.** dungeon-crawler has no dep-graph gate, so removing it
along with the others would have silently dropped a dimension — the hexagonal layering rules in
`.dependency-cruiser.cjs` that keep `src/domain` from reaching adapters. Those rules are specific to
this repository's architecture and belong here, not upstream. It was the one scanner with no central
equivalent, and deleting all seven because six were safe is exactly the class of mistake the gates
exist to catch.

## Alternatives considered

- **Keep the vendored copies and sync by hand** — the status quo, and the reason this ADR exists. It
  had already drifted once: `spec-gap-scan` ignored the `exclude` key that `arch-scan` and `dupe-scan`
  both honoured, and that was invisible for months.
- **Delete all seven scanners** — would have removed dep-graph coverage with no replacement.
- **Wait for the harness to be published before migrating** — the migration is what finds the defects.
  Every cold-start defect in the harness's history came from running it against a repository shaped
  differently, and none was findable by reading.

## Consequences

**This branch cannot merge until `@ejclark/dungeon-crawler` is published.** The dependency currently
resolves as `file:../dungeon-crawler` — a relative path outside this repository — so `npm ci` on a CI
runner, which clones only this repo, will fail. That is deliberate and temporary: the local link
proves the whole migration end to end now, and swapping it for a published version is a one-line
change. It is recorded here because a branch that is green locally and red on a runner is exactly the
kind of thing that gets discovered at the worst moment.

**What was verified after the change:** `typecheck`, `lint` and `test` all green (565 passing), and
every gate verdict byte-identical to the baseline captured before the migration. **No budget moved** —
a budget that shifts during a migration is a defect, not a result.

**What becomes easier.** A fix to a scanner reaches every repository at once instead of being
hand-carried. The harness gets a second real codebase to be proven against, which is the only thing
that turns its portability claim into a fact.

**What we now live with.** This repository's gates are a dependency it does not control. That is the
trade being made deliberately: the alternative was six copies that drift silently, and drift in a gate
is worse than coupling to a version we choose when to take.
