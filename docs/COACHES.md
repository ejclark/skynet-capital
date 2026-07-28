# The Coach system — detect-and-correct loops against slop

AI builds fast; unregulated speed compounds into slop. A **Coach** is the anti-slop unit: one quality
dimension, watched and corrected as a loop —

- **Eye (fitness function):** an executable eval that measures the dimension and enforces a committed,
  **ratchet-down-only budget** in CI. Prose audits drift; evals don't.
- **Drill (skill):** the repeatable corrective procedure, invokable as a slash command by a human or
  loaded by an agent. One safe, behavior-preserving move per PR.
- **Athlete (agent):** a scoped background worker that runs eye → drill → small green PR, off the
  critical path.

Slop accumulates precisely in the dimensions no Coach watches. Growing this roster *is* the quality
strategy (audit: `docs/ENGINEERING-AUDIT-2026-07.md`).

## Sourcing rule

**Adopt what's generic; craft what's bound to our gates.** Generic craftsmanship (code review, security
review, simplification) is solved — use the bundled skills. Anything that leans on our mechanics
(arch-budget, dupe-budget, Graphify, the design system) must be crafted here. Community skills are a
supply-chain decision: read them fully before adopting.

## Roster

| Coach | Eye (eval + budget) | Drill (skill) | Athlete (agent) | Status |
|---|---|---|---|---|
| **Size/cohesion** (god files) | `scripts/arch-scan.mjs` + `arch-budget.json` + `tests/arch/budget.spec.ts` | `/decompose` | `decomposer` | ✅ live |
| **Duplication** (pasted helpers) | `scripts/dupe-scan.mjs` + `dupe-budget.json` + `tests/arch/dupe.spec.ts` | `/dedupe` | `ui-librarian` | ✅ live |
| **Coverage** (untested files) | rstest coverage ratchet — *not built* | — | `test-backfiller` | ⬜ next |
| **Inline-JS defects** (`<script>` syntax) | extract + `node --check` per page — *not built* | — | — | ⬜ queued |
| Code review | *(adopted)* | `/code-review` | — | ✅ bundled |
| Security review | *(adopted)* | `/security-review` | — | ✅ bundled |
| Simplification | *(adopted)* | `/simplify` | — | ✅ bundled |

## How the loop runs (and stays orderly)

- Every eye enforces in CI through the ordinary test job — a Coach's dimension cannot silently regress.
- Budgets **only ratchet down** (`--update` after a correction lands), so every win is permanent.
- `--candidate` makes each eye name its own highest-leverage target, machine-readable — no human picks.
- **WIP limit: one open structural PR per Coach.** The athlete doesn't start pass N+1 until pass N merges;
  the next target is recomputed from fresh `main`, which serializes work for free.
- Adding a Coach = one eval + one budget + one CI spec + one skill (+ optionally one agent). Use
  `skill-creator` and mirror an existing pair so the roster stays uniform.
