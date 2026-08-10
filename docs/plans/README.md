# Plans — PM-mode: Eric authors direction, Claude executes autonomously

The experiment this scaffolding serves (Eric's framing, banked verbatim in intent): *"I focus a
majority of my time crafting plans where we align on direction… systems autonomously iterate on
evaluating and executing the plan when I am offline. The more plans require no guidance from me, the
more throughput."* Eric transitions toward PM — building a backlog of aligned plans — and Claude owns
the engineering execution. Throughput of the constraint (Eric's attention) is the measure.

This is the missing layer between `docs/IDEAS.md` (capture — one-liners, not executable) and the ship
loop (execution — assumes direction already settled). A **plan** is the unit of alignment: rich enough
that execution needs no live guidance, explicit about what was pre-decided, and honest about what wasn't.

## Lifecycle

```
draft → ready → executing → review → done
```

- **draft** — authored (by Eric, or by Claude *proposing*). Alignment happens here: Claude reads a
  draft, asks its questions **in one batch** (front-loaded, while Eric is present), and probes
  blindspots — surfacing the forks a non-expert doesn't know they're leaving open.
- **ready** — **Eric's explicit go.** Only Eric flips a plan to ready; that flip is the authorization
  to execute unattended within the plan's envelope. (Claude never self-promotes a draft — same gate as
  the irreversible class.)
- **executing** — Claude works it in ship-loop slices (small green PRs; merge policy applies). The plan
  file is the **living record**: criteria check off as they ship, questions queue in the Q&A block.
- **review** — all criteria shipped or execution is blocked; the plan ends with a synthesis for Eric
  (what shipped, what was decided under the envelope, what's queued for him).
- **done** — Eric accepts. Move the entry to Shipped in `IDEAS.md` if it lived there.

## What a plan must contain (the contract)

The test for every section: *could a fresh session execute this with zero live guidance?* See
`TEMPLATE.md` for the skeleton.

1. **Intent & end-state** — commander's intent, not orders. What's true when this is done, and why it
   matters. The executor adapts tactics to this, not to a step list.
2. **Acceptance criteria (EARS)** — verifiable `shall` statements (the `/ears` skill). Each criterion
   names its **verification**: a test, a gate, a screenshot, an exit status. Unverifiable criteria are
   alignment debt — sharpen them at draft time.
3. **Constraints & non-goals** — the fence. What must not change, what's explicitly out of scope.
4. **Pre-settled forks** — the taste/direction calls made *in advance*, each with its decision. This is
   the section that buys autonomy: every fork settled here is a question Claude doesn't ask at 2am.
5. **Autonomy envelope** — what merges without Eric (per the governor merge-policy table: structural,
   tests, docs auto-merge; features/visual wait) **plus any plan-specific widening or narrowing** Eric
   grants. The irreversible class (credentials, spend, outward-facing) is never widenable by a plan.
6. **Open questions (Q&A queue)** — forks discovered mid-execution that the envelope doesn't cover.
   Protocol: **bank the question in the plan file, continue on unblocked threads, never guess on taste
   or the irreversible class.** Eric answers in batch when he returns; execution resumes. A blocked-on-
   all-threads plan flips to review with the queue as its synthesis.

## Execution discipline

- One plan per branch-family; each slice its own small green PR (`/ship`), auto-merge per policy.
- The plan file updates in the same PR as the work it records (checklist + decision log co-located).
- Verify every criterion by its named verification — exit status, not tailed output.
- **Decision log:** calls Claude makes under the envelope get a one-line entry (what + why) in the plan
  file — the audit surface for "would Eric have decided the same?", which is the experiment's real test.
- Compute per `docs/COMPUTE.md` floors; delegate heavy slices to agents at their floor.

## Measuring the experiment

The theory: throughput(Eric) rises when his time goes to plan-crafting instead of in-loop guidance.
The observable: **interventions per shipped slice** — corrections + mid-execution questions Eric had to
answer (the duel-log already records intents; the config-audit clusters corrections). A plan that ships
its criteria with zero interventions is the target; a plan that generates a long Q&A queue teaches us
what the *next* plan's pre-settled-forks section should have contained. Either way the system learns —
gaps found in execution are fed back as sharper contract sections, not just answered.

## Boundaries (unchanged by this doc)

Plans operate inside CLAUDE.md's hard boundaries: the irreversible class stays Eric's regardless of any
envelope; financial honesty invariants hold; visual/taste work always waits for his eyes unless a
pre-settled fork explicitly decided the taste question in advance.
