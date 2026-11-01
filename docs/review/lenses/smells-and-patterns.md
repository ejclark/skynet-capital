# Smells and patterns lens

**Fires on:** `src/`, `app/src/`, `scripts/moneypenny/`, when the diff adds a file, adds an import
across a layer, or grows a file by 80 code lines.

**Kill rule:** under 0.1 confirmed findings per reviewed PR, or fewer than one in three surviving
the refuters, after 40 PRs: delete this file and leave the facet to the scripts below.

**Size:** 3,986 characters.

Name the smell, the pattern that answers it and what it costs: a concrete failure or a concrete cost
the next change pays. Read `docs/PATTERNS.md` → *The ledger — code smells* first: a recognised
pattern has one row there, and a new one gets a row in the same finding. Zero findings is a normal
answer: a reviewer told to find gaps manufactures them.

Scripts own size, cycles, clones, dead code and pasted helpers (`scripts/arch-scan.mjs`,
`scripts/dep-graph-scan.mjs`, `scripts/dupe-scan.mjs`). Do not restate them.

## Smells

**Second rule beside the predicate.** Spot it: a new `labels.includes(` or `cash <` in a file that
does not import the owner (`pullable` in `scripts/moneypenny/labels.mjs`, `src/engine/guards.ts`).
Fix: import the predicate; widen it if it lacks the case. Not when: the check means something else
and says so. Real: #6063 taught `--check` a rule `--queue` never learned; #6209 and #6089 are the
same shape.

**Hand-synced copy.** Spot it: a comment or habit that says "keep this in step with", or a port of
logic into a second runtime. Fix: one module both import, or a spec that compares the two. Not when:
a build boundary forbids the import and the spec exists. Real: #6053 fixed `scripts/deploy-lag.mjs`
and never reached `src/server/ops-status-deploy-lag.ts`, behind the group's fleet page.

**Helper with no named home.** Spot it: a new helper in a route or component named for a domain word
(`dollars`, `isoDay`), not the file's job. Fix: name the concept and give it a module, as
`docs/ENGINEERING.md` asks. Not when: it is private, used once, and names the file's own job. Real:
#6034 settled `DAY_MS` in `src/domain/time.ts`.

**Dependency pointing up.** Spot it: a new import from a lower layer in ENGINEERING's folder map to a
higher one; the graph gate catches only a cycle. Fix: move the function down, or pass the value in.
Not when: it is type-only and the type belongs to the lower layer's contract. Real:
`src/personas/registry.ts:6` reaches `src/autonomous/bot-controls.ts`, though personas are meant to
be pure strategies.

**God file in the making.** Spot it: a PR growing a file by 80 code lines when it already has two
jobs. Fix: name the split now, with its seam. Not when: `arch-grandfather.json` declares it. Real:
`scripts/shoot/trade.mjs` reached 1,834 lines, then took three athlete sessions (#6040, #6114, #6207).

**Port bypassed.** Spot it: a new `fetch(` or `curl` to an outside host away from its port, so it
skips the shared token and rate-limit handling. Fix: go through the port. Not when: the port cannot
serve the call and the PR says so. Real: `scripts/clear-path-post.mjs:124` has its own REST call
beside `scripts/moneypenny/gh.mjs`.

## Worth solving, or taste

The test: name what breaks, or what the next change pays. No name, no finding.

Worth solving now: two rules that can disagree, a hand-synced copy, an upward dependency, a port
bypass. Worth a note for the clean-up athletes: a helper with
no home, a file nearing the cap. Taste: folder aesthetics, "this could be a class", renaming for
symmetry, one more layer for a single caller, a pattern that would fit better with no failure to
show.

## How to run it

1. Skip unless the fires-on condition holds. Say so.
2. Read `docs/ENGINEERING.md`'s folder map and the container's page in `docs/architecture/`.
3. One finding per rule broken, naming the smell's row. Never a list of preferences.
4. A shape you recognise with no row: propose the row, its cost and one real instance.

Refuter: trace only. Does the rule exist in writing, and does the diff break it?
