# Context and loop lens

**Fires on:** `CLAUDE.md`, `.claude/`, `.github/prompts/`, `.github/workflows/`, `docs/grind/`,
`docs/process/LEARNING-LOOP.md`, `docs/process/PILLARS.md`, `docs/COMPUTE.md`, `docs/DELEGATION.md`,
`scripts/fitness.mjs`, `scripts/loop-check.mjs`. 99 of 650 code PRs since 2026-10-01.

**Kill rule:** under 0.1 confirmed findings per reviewed PR, or fewer than one in three surviving
the refuters, after 40 PRs: delete this file and leave the facet to the scans below.

**Size:** 3,961 characters.

A change to memory, instructions, a hook, a workflow or the loop registry costs every session, and
may never be judged. A finding needs a concrete cost: the file:line, the reader or number that is
missing, the one-line change. Zero findings is a normal
answer: a reviewer told to find gaps manufactures them.

Already read weekly, so do not repeat them: `scripts/config-audit.mjs`, `scripts/doc-rot-scan.mjs`,
`scripts/agent-surface-scan.mjs`, `scripts/instruction-drift-scan.mjs`.

## Smells

**Startup cost.** Spot it: bytes added to a file every session loads, `CLAUDE.md` over its 47,500
budget (`scripts/config-audit.mjs:240`), a paragraph where the house rule is one line and a link.
Fix: one line here, the story in `docs/process/WORKING-AGREEMENTS.md`. Not when: it is a decision
Eric made and the budget has room. Real: #5325 and #6228 were two of nine October commits growing
it, to 60,794 bytes, while nothing measured it.

**Stale at birth.** Spot it: a step that says what a script does, or copies a number from a rule,
and the code at head differs. Fix: cite the code's constant, or say "run X and read it". Not when:
the claim is about the file's own behaviour and a spec pins it. Real: #6012's decomposer step said
`wt-start.sh` branches off `origin/main`, and on a reused slug it resumed stale work; #6223's surge
skill tied the reset to midnight Central where the plan resets at a fixed UTC time.

**Rule with no reader.** Spot it: a hook, doc section or claim about a mechanism that nothing on the
path executes. Fix: name the reader in the PR, or do not land the rule. Not when: the reader lands in
a linked PR that is already open. Real: `.claude/hooks/session-start.sh:39` exits unless the session
is remote, so its rule never reaches a local one; #6218's flip posted `ready` without the `feedback`
label the lane's pull rule reads, and two flips sat unbuilt.

**Loop with no number.** Spot it: a new workflow, contract or registry row with no number that
decides whether it runs again. Fix: a row in
`docs/process/LEARNING-LOOP.md`, with its baseline and command, in the same PR. Not when: it is a
one-off run, stated as one. Real: #6472's memory review landed with no row; #5726's rows carried
dated checks with no command.

**Unknown read as a verdict.** Spot it: a verifier that returns pass or fail when it could not test:
`refuted: true` on "could not build a repro", a skipped job read as green, `|| 0` on a failed read.
Fix: a third state, reported and counted. Not when: the caller already treats both answers as
"look by hand". Real: #6221's reproduce refuter refuted anything it could not spec; #6507 gave it
`cannotRun`.

## Worth solving, or taste

Worth solving in the PR: a stale claim about a named script, bytes over budget, a rule with no
reader, a verifier that cannot say unknown. Worth a row, not a block: a loop with no number. Taste:
tone, section order, whether a skill "feels long".

## How to run it

1. Run the scans above on the tree at head and report what changed against base, never the totals.
2. For each touched instruction file, list what it names (script, label, number, time). Read each at
   head. One finding per mismatch.
3. For each new hook, workflow, contract or claim, name its reader with a grep. None: a finding.
4. For each new loop, find its row and number. None: a finding.
5. For each verifier, find its unknown path.

Refuter: trace only; prose has no reproduction.
