---
name: charter
description: >-
  Research and specify a new subagent (or significantly revise an existing one's scope) with the same
  rigor a second engineer would apply: check for an existing owner first, apply a bounded-trigger test,
  research how credible practitioners scope this kind of work, then draft in this repo's house format —
  or conclude, explicitly and on the record, that it shouldn't be built. Use before creating any
  `.claude/agents/*.md` file, when someone proposes "we need an agent for X", or when an existing agent's
  mandate has drifted and needs re-scoping. A REJECT verdict is a first-class, expected output, not a
  failure of the process — the filtering is usually the highest-value part of the work.
---

# Charter — the process for deciding whether an agent should exist, before writing what it is

This is a meta-skill: it doesn't touch application code, it produces (or explicitly declines to produce)
`.claude/agents/*.md` files. It exists because building the wrong agent is cheap to do and expensive to
notice — `render-alchemist` sat with a clear mandate and, by one measure, fired zero times; a later audit
in the same repo found it had actually fired repeatedly, just never in the exact output mode its own spec
described. Both the false negative and the real gap it pointed at are why this process exists: it is easy
to be wrong about whether an agent is earning its place in either direction.

## The process

### 1. State the candidate's job in one sentence

What work would this agent do that currently has no owner? If you can't state it in one sentence without
a job title doing the work ("a TypeScript engineer" is a title; "reviews diffs for type-safety violations
the compiler's strictness settings don't catch" is a job), the candidate isn't specified enough to
evaluate yet — sharpen it before continuing.

### 2. Check for an existing owner FIRST — this step kills most candidates and should

Before researching anything external, check, in order:

- **An existing agent**, even one whose name doesn't obviously match. (`dep-warden` was requested as
  "dependency management engineer" — it already existed, fully specified, in `docs/COACHES.md`, just
  unbuilt.)
- **An existing skill.** Judgment-heavy, occasional, taste-laden work usually belongs here, not in an
  agent — `/vision` and `/telestrator` are both this shape: a repeatable *procedure* invoked at a decision
  point, not a standing background worker.
- **A line in `CLAUDE.md` or a doc.** A rule that already exists just needs enforcing, not an agent to
  enforce it.
- **A gate that already names a target.** `arch-scan`, `dupe-scan`, the spec-gap scan, `knip` — if the
  candidate's job is "act on what a gate already flags," it may be a coach (see step 3), but the gate
  itself, if missing, is the thing to build, not the agent.

If any of these already cover the job, the answer is "extend or fix that," on the record, and the process
stops here. This is not a failure — a proposed thread-puller agent became one rule inside `/telestrator`
instead of a fourteenth roster entry, and that was the better outcome, not a consolation prize.

### 3. Apply the bounded-trigger test

A candidate that survives step 2 still needs to pass all three:

1. **Bounded and summarizable.** The work has a clear input, a clear output shape, and doesn't require
   an open-ended amount of context to do well.
2. **Has a trigger the base model and existing agents don't already own.** Not "this domain sounds
   important" — an actual gate, a recurring event (a dependabot PR opening), or a request shape common
   enough to name ("write a new agent spec," "attack this diff before merge").
3. **You can name what work you don't need to see in the main thread.** Subagents exist to isolate work,
   not to role-play expertise the base model already has. If the honest answer is "this needs the whole
   operating model in view to do well" — the existing roster, what's been tried, Eric's stated
   preferences — that's a sign the work belongs *in* the main thread as a skill, not isolated away from
   it. (This is why `charter` itself is a skill, not an agent: deciding whether a new agent is worth its
   cost is exactly this kind of judgment.)

**If the candidate has no objective gate that can name its target** (nothing structurally like
`arch-scan --candidate`), it cannot be an autonomous background coach regardless of how well-scoped its
job is — it needs a human or foreground trigger every time, which points at a skill or an Eric-initiated
agent, not a `/governor` rung.

### 4. Research externally — but against THIS repo's constraints, not a green-field

Use WebSearch/WebFetch for how credible practitioners (published `.claude/agents/` collections, teams
who've iterated on subagent design, not generic listicles) scope work like the candidate's. Specifically
look for:

- **Named anti-patterns that match the candidate.** "Expert persona" agents (a title with no distinct
  capability the base model lacks) are a documented failure mode — a "linguistics professor" agent adds
  nothing a linguist skill grounded in this repo's real communication channels doesn't already do better.
- **Roster-size cautionary evidence.** One practitioner's account of reaching 42 agents and calling it
  "disastrous" — overlapping mandates create routing ambiguity, and the model stops auto-delegating
  reliably. If the candidate's mandate overlaps an existing agent's by more than a little, that's a
  reason to merge scope, not add a roster entry.
- **What "context isolation" actually is.** It is a property every subagent already gets from its own
  fresh context window — never a role. A candidate whose entire job is "provide isolation" is a category
  error, not an agent.
- **The real trigger vs. the plausible-sounding domain.** A domain that sounds important is not the same
  as evidence it's an active need — check whether the gap has actually cost something yet, or is purely
  architectural. Flag architectural-but-unevidenced gaps explicitly (candidate, not yet triggered) rather
  than silently building or silently dropping them.

### 5. Draft in house format — only for what survives

Match the existing roster's shape exactly. Two canonical templates, pick the nearer fit:

- **Gate-triggered debt agent** (`decomposer.md`, `mortician.md`) — frontmatter + a numbered Loop that
  starts by pulling a target from a named script, ends in "verify by exit status, report, stop," plus
  Hard Rules that name what it must never touch.
- **Research-only agent** (`render-alchemist.md`) — no edits, cites real mechanisms not vibes, writes a
  brief for another agent to build from, explicit about what it will NOT fabricate.

Frontmatter fields: `name` (lowercase-hyphenated, matching the existing roster's naming register —
plain-functional for debt/process agents, forge-lore-adjacent only where the existing 3D roster already
uses that register), `description` (states the trigger and scope precisely enough that routing doesn't
collide with an existing agent — name the adjacent agent and the boundary explicitly if there's any risk
of overlap, the way `red-team`/`reviewer` and `red-team`/`/security-review` each state their boundary),
`tools` (minimum needed — a research-only agent gets no `Edit`/`Write`), `model` (`sonnet` for mechanical
debt work, `opus` for research/judgment-heavy work).

### 6. Report a BUILD list and a REJECT list — both, every time

A proposal with only accepted candidates is a sign the filter wasn't applied. For every rejected
candidate, one line: what it was, why it doesn't survive (which step killed it), and what — if anything —
it should become instead (a rule inside an existing skill, a line in `CLAUDE.md`, nothing). For every
accepted candidate, the one sentence from step 1 plus the specific evidence from step 2-4 that justified
building it, not just that it seemed useful.

## Hard rules

- **A REJECT verdict is success, not a shortfall.** The filtering is the value; don't pad a report with
  marginal builds to make the pass look productive.
- **Never skip step 2.** Researching external patterns before checking for an existing owner produces a
  well-researched agent for a job the repo already has covered.
- **Never trust a claim about an existing agent's usage without checking it.** "This agent has never
  fired" needs a real check (grep its expected output paths, check whether it's been invoked via
  `Workflow`'s `agentType` even if not via a direct top-level call) — an agent can be in active, valuable
  use in a mode its own spec didn't anticipate.
- **The candidate's proposer's own later clarification outranks your first guess.** If the request is
  ambiguous, ask rather than build against a guessed interpretation — a linguistics agent built as
  "voice/tone checking" is a materially different (and worse) thing than one built as "communication
  comprehension across human/bot channels," and only the person asking can settle which was meant.
