# Adopting a capability — the anatomy of "learn everything about X and fold it in"

Eric, 2026-09-26, after the Mermaid program: *"is there any merit to an 'assimilate' skill? …
I just discovered the deeper capabilities of mermaid. Outcome: exhaustively integrate this into our
process to iteratively enhance our systems."* And an hour later, the second instance: *"interrogate
this repository to learn everything you have"* (zpratt/lousy-agents). This doc is the anatomy those
two runs shared — a **type**, in the sense [`LEARNING-LOOP.md`](LEARNING-LOOP.md) is a type, not a
description of either run. It is named by its job; nothing here is called "assimilate".

## Why an anatomy and not a mega-skill

The two runs used six pieces the repo already had — a brain-dump read as a planning session, the
interrogation pass, `/teardown`, the learning-loop type, `/charter`'s reject-by-default, and
"sequence the process ahead of the work" — in an order nobody had written down. A skill advertising
"a spectrum of skillsets" is the god-skill `/charter` exists to reject. What was missing was the
**order and the exit criteria**, and the evidence that skipping the last two steps is how a
capability rots: Graphify was adopted in July and drifted 170 commits (`docs/adr/0008`);
dependency-cruiser is a devDependency with one spec; Claude Design got a handoff loop and no shared
spec surface. Each skipped **an on-demand reference** and **a drift gate**.

## The shape

Seven steps, in this order. The first four are research and cost tokens, never Eric's attention;
the last three are builds and produce the artefacts that make the capability survive the session.

| # | Step | What it produces | Exit criterion |
|---|---|---|---|
| 1 | **Read the source exhaustively** — the tool's own docs, the repo's own files; primary sources over summaries. Fan out by domain (thesis · mechanics · operating system) and require a path for every claim. | One report per domain, in the scratchpad, never the tree | Every claim cites a path; contradictions inside the source are listed, not smoothed |
| 2 | **Census: what we already do** — every named mechanism mapped to our code by *opening* the file: present · partial · absent · we do the opposite (with the doctrine line that says why) | The census table | A row per mechanism; "ours today" is a path we read, never memory |
| 3 | **Map the surfaces it touches** — which of our routes, gates, skills, docs and lanes each borrow would land on, and who owns each | The gap table: element · theirs · ours · gap · size · lands on | Every borrow has an owner in our roster or is a new eye with a spec |
| 4 | **Ground-truth the runtime it runs in** — the fact the whole adoption turns on (GitHub renders Mermaid 11.17.2; a shallow clone makes doc-rot skip; the MCP validator runs an older version) | One dated fact per runtime, with the probe that proved it | The fact is reproducible by a command, not a belief |
| 5 | **Gate first** — the check that catches the failure the capability introduces, before any authored use of it (`mermaid-lint` before the grammar; the honest-degrade fix before any new picture generator) | A scanner with a fixture spec, wired where the failure would surface | The gate fails on a fixture and passes on the corpus |
| 6 | **On-demand reference, not a standing tax** — what a session needs when it uses the capability, loaded only then; what upstream already publishes is linked, not re-vendored | A skill card or a `docs/process` page, sized in tokens per load | Nothing is loaded by default; the per-load cost is stated; the config-cards lesson (173 KB re-vendored, cut to 7.6 KB, #3764) is the bound |
| 7 | **Slices as learning loops** — each adoption is a thin slice with a falsifier on a plan issue with a state block; the research residue lives as issue comments, never in the tree | The plan issue (`/issue` capsule, `docs/ISSUES.md` → *The state block*) | Every call carries its falsifier; the reports are comments; the tree holds only what tooling consumes (#3763) |

## Two instances, side by side

| Field | Mermaid (2026-09-25, #3748) | lousy-agents (2026-09-26, #3769) |
|---|---|---|
| Source | mermaid.js.org, GitHub's production render bundle | the repo at 3c6c732 and its wisdom submodule |
| Step 1 fan-out | 23 type cards + 5 config cards, 3 workflows | thesis · mechanics · operating system, 3 agents |
| Step 2 census | 40 merged PRs: one template for every change, 0 styled, 3 mangled frames | 39 mechanisms: ahead on process, behind on linting our agent surface |
| Step 4 runtime fact | GitHub renders 11.17.2; themes freeze a mode; ELK falls back; icons dead | doc-rot passes on an unknown sha; `config-audit` has no caller; 58 KB always loaded |
| Step 5 gate | `scripts/mermaid-lint.mjs` in `ship.sh checkbody` and `issue-lint` (#3747) | slice 1: honest degradation in doc-rot (S) |
| Step 6 reference | `/mermaid` + 23 cards + one config card (657 → 497 KB after #3764) | none needed: the borrows are gates and habits, the reports are issue comments |
| Step 7 slices | 9 slices; 1–6 merged; 7–9 open | 6 slices, two on the platter; awaiting the ready flip |
| Research spend | ≈11.4M subagent tokens, 124 agents | ≈0.86M subagent tokens, 4 agents |
| What the run taught the anatomy | on-demand means zero standing tax; a showcase for humans goes on the issue, not the tree | trust the teachings, verify the claims: three of the census's findings were re-checked in our code before filing |

The spend column is the honest cost: the first instance was 13× the second because it re-vendored
what upstream publishes. Step 6's bound exists because of it.

## Starting a new adoption

1. Name the capability and the outcome in one line each; if the outcome is "use it more", stop — that
   is not an outcome, it is the mechanism on trial (the interrogation pass, `CLAUDE.md`).
2. Run steps 1–4 as read-only fan-out into the scratchpad. No tree writes, no issue yet.
3. File the plan issue with `/issue`: the call sheet in the fold, the reports as comments, a state
   block as the next comment. Label it `plan`; the ready flip is Eric's unless the brief carried
   acceptance criteria.
4. Build step 5 first and let the first slice of step 7 be its test. Step 6 only if a session would
   otherwise re-derive the same facts; size it in tokens and say so on the card.
5. Every merged slice edits the state block; the plan closes on its named closing slice.
