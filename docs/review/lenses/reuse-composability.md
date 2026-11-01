# Reuse and composability lens

**Fires on:** `src/`, `app/src/`, and only when `node scripts/dupe-scan.mjs --diff <base> --names`
prints a row. 46 of 456 code commits since 2026-10-01 had a same-body copy; 257 same-named rows
needed a reader.

**Kill rule:** under 0.1 confirmed findings per reviewed PR, or fewer than one in three surviving
the refuters, after 40 PRs: delete this file and leave the facet to the script.

**Size:** 3,429 characters.

The script is the detector; this lens judges only the rows it prints, never the whole diff, and never
the standing debt the dedupe athlete owns. A finding names a concrete cost: the new symbol, its
existing definition, whether they are one concept, and the import that replaces the copy. Zero
findings is a normal answer: a reviewer told to find gaps manufactures them.

## Smells

**Pasted helper.** Spot it: the script prints "is a copy". The bodies already match. Fix: import from
the existing home, or move it to the named module `docs/ENGINEERING.md` asks for
(`src/domain/time.ts`, `src/domain/percent.ts`, `src/ui/plural.ts`) in the same PR. Not when: the
import would point the wrong way; root `src/` must not import `app/src/`. Real: #5766 pasted `MAX_ID`
into two files when another had it; #6114 cleaned it up.

**Same name, different units.** Spot it: a same-name row whose bodies differ in what they take or
return. This is the one a script cannot judge. Fix: rename the new one to say what it takes, or unify
and convert at the call site. Not when: they are plain homonyms with no shared concept; drop those
without a word. Real: #4443's `pct(fraction)` beside `pct(value)` in the same folder; #6052 settled
it in `src/domain/percent.ts`.

**Same idea, one edit apart.** Spot it: a same-name row whose bodies differ by a case one of them
missed. Fix: one function, with the wider contract. Not when: the difference is stated as deliberate.
Real: #5601's `blank` tolerates a missing value where #5511's does not; #6207 joined them in
`src/playbooks/claim-blank.ts`.

**Parser pasted beside its twin.** Spot it: a new `*-api-routes.ts` whose body parsing and `MAX_*`
caps match another route's. Fix: one bodies module per API surface
(`src/server/subscriptions-api-bodies.ts` is the shape). Not when: the caps differ and the PR says
why. Real: #5766's `MAX_ID` was 64 where `src/options/saved-position.ts` had 40, with no reason given.

**Composable piece built inline.** Spot it: a new `.tsx` with a local formatter, glyph table or row
spec that `app/src/ui/CATALOG.md` already lists. Fix: import the primitive; add to the catalog on a
second use. Not when: it would widen the primitive for one caller. Real: #5377 folded one chip look,
drawn four ways, into `app/src/ui/filter-chip.tsx`.

## Worth solving, or taste

Worth solving in the same PR: a pasted helper or parser. It is one import now and a whole athlete
session later. Worth one line, not a block: same name, different units, when this PR's own path is
right. Taste: style-only restructuring, "extract a hook", a rewrite that changes no call site.

## How to run it

1. Run the script. No rows: say so and stop.
2. For each copy, name the import. For each same-name row, read both definitions: one concept is a
   finding naming both contracts; a homonym is dropped silently.
3. Never report the standing debt.

Refuter: trace is enough. Can this file import the existing definition? No reproduction.
