# The coaching staff — detect-and-correct loops against slop

AI builds fast; unregulated speed compounds into slop. We run quality like a football staff — three
seats with distinct jobs:

- **Head coach (orchestrator).** Decides what runs when: WIP limits, dispatch, merge tempo, and the
  don't-collide-with-feature-work rule. **Today this seat is Eric + Claude in-session**; the mechanized
  version (WIP-limited dispatcher + auto-merge on trusted green) is the least-built piece and is earned
  by gate trust, not assumed.
- **Defensive coordinator.** Protects the standard: breaks down complexity and organizes the pieces.
  Owns the detect-and-correct units below (gates, ratchets, drills, athletes). Defense keeps entropy
  from scoring.
- **Offensive coordinator.** Scales up systems where a **constraint** binds (Theory of Constraints:
  *elevate*). Owns capability plays: the single-runner pipeline (GHA-minutes constraint), the local
  verify gate (review-trust constraint), Babylon MCP (domain-knowledge constraint), the local dev loop
  (iteration-speed constraint). Offense moves the ceiling; each play is triggered by a *measured*
  constraint, never speculation — same discipline as run-scale infra.

## The defensive unit — one quality dimension per loop

- **Eye (fitness function):** an executable eval that measures the dimension and enforces a committed,
  **ratchet-down-only budget** in CI. Prose audits drift; evals don't.
- **Drill (skill):** the repeatable corrective procedure, invokable as a slash command by a human or
  loaded by an agent. One safe, behavior-preserving move per PR.
- **Athlete (agent):** a scoped background worker that runs eye → drill → small green PR, off the
  critical path.

Slop accumulates precisely in the dimensions no defensive loop watches. Growing this roster *is* the
quality strategy (audit: `docs/ENGINEERING-AUDIT-2026-07.md`).

## Sourcing rule

**Adopt what's generic; craft what's bound to our gates.** Generic craftsmanship (code review, security
review, simplification) is solved — use the bundled skills. Anything that leans on our mechanics
(arch-budget, dupe-budget, Graphify, the design system) must be crafted here. Community skills are a
supply-chain decision: read them fully before adopting.

## Defensive roster

| Coach | Eye (eval + budget) | Drill (skill) | Athlete (agent) | Status |
|---|---|---|---|---|
| **Size/cohesion** (god files) | `scripts/arch-scan.mjs` + `arch-budget.json` + `tests/arch/budget.spec.ts` | `/decompose` | `decomposer` | ✅ live |
| **Duplication** (pasted helpers) | `scripts/dupe-scan.mjs` + `dupe-budget.json` + `tests/arch/dupe.spec.ts` | `/dedupe` | `ui-librarian` | ✅ live |
| **Coverage** (untested files) | rstest coverage ratchet — *not built* | — | `test-backfiller` | ⬜ next |
| **Inline-JS defects** (`<script>` syntax) | extract + `node --check` per page — *not built* | — | — | ⬜ queued |
| Code review | *(adopted)* | `/code-review` | — | ✅ bundled |
| Security review | *(adopted)* | `/security-review` | — | ✅ bundled |
| Simplification | *(adopted)* | `/simplify` | — | ✅ bundled |

## The scaling test — two axes, opposite defaults

Every decision gets asked *"does this scale?"* — but the answer depends on which axis, and the two run
**opposite** directions:

- **Build-scale (code · architecture · process): design as if thousands contribute.** Solo-with-agents
  effectively *is* a large team — many parallel hands, high commit velocity, no shared memory between
  sessions. So the eval question "would 10,000 engineers trip over this?" applies today: cohesion, no
  junk drawers, single-sourced helpers, machine-checkable conventions. Organized, high-quality code is
  what scales the *ability to build*.
- **Run-scale (infrastructure · platform): design for the real load — 5–10 people.** Here the enterprise
  reflex is the smell: microservices, k8s, caching tiers, queues for ten friends is slop wearing a suit.
  One Fly app + smoke + rollback is *correct* at this load. Infra earns complexity only when **measured**
  load demands it — never speculatively.

One line: **scale the ability to build, not the machinery to serve.** Confusing the axes is the classic
failure in both directions (spaghetti that can't grow ↔ a cluster for ten users).

## Smell catalog — what the eyes look for (and what stays judgment)

Every smell is either **mechanizable** (→ becomes/extends an eval) or **judgment** (→ lives in a drill's
checklist). Route new smells accordingly; a smell that stays prose in someone's head protects nothing.

| Smell | Kind | Where it's handled |
|---|---|---|
| God file (size × many exports) | mechanized | `arch-scan` |
| Exact duplication (same symbol, N files) | mechanized | `dupe-scan` |
| **Junk drawer** (`utils.ts`/`helpers.ts`/`common.ts`/`misc.ts` — cohesion by what it *isn't*) | mechanized | `arch-scan` (junk-drawer check) |
| Near-duplication ("something similar exists") | judgment | `/dedupe` drill — **rule of three:** abstract on the third occurrence, not the second; premature abstraction couples things that merely look alike |
| Sanity checks bleeding downstream (re-validating what a boundary should guarantee) | judgment | review checklist — fix the *boundary* (zod at the edges, audit C3), don't scatter guards |
| Design-system drift (pasted tokens/styles) | mechanized (coarse) | `dupe-scan` today; richer token-diff eval later |

## Atomic design — the decompose grammar

Decomposition needs a *target shape*, not just "smaller." We use atomic design:

- **Atoms** — one job, no siblings' knowledge: `escapeHtml`, `chip()`, a shader, a payoff function.
- **Molecules** — a few atoms with one purpose: a card, a nav, the Eye (shader + lids + gaze).
- **Organisms** — molecules composing a surface: a dashboard view, the tower scene, the login stage.

**Atoms are the default floor.** Go sub-atomic only when a concrete need calls (a second consumer wants
half the atom) — never speculatively. Over-splitting is the mirror-image slop: a thousand two-line files
with the complexity moved into the wiring.

## How the loop runs (and stays orderly)

- Every eye enforces in CI through the ordinary test job — a Coach's dimension cannot silently regress.
- Budgets **only ratchet down** (`--update` after a correction lands), so every win is permanent.
- `--candidate` makes each eye name its own highest-leverage target, machine-readable — no human picks.
- **WIP limit: one open structural PR per Coach.** The athlete doesn't start pass N+1 until pass N merges;
  the next target is recomputed from fresh `main`, which serializes work for free.
- Adding a Coach = one eval + one budget + one CI spec + one skill (+ optionally one agent). Use
  `skill-creator` and mirror an existing pair so the roster stays uniform.
