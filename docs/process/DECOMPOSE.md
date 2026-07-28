# DECOMPOSE

The split playbook is now a first-class, invocable **skill** — the single source of truth lives at
[`.claude/skills/decompose/SKILL.md`](../../.claude/skills/decompose/SKILL.md).

Invoke it interactively with `/decompose`, or let the `decomposer` agent
([`.claude/agents/decomposer.md`](../../.claude/agents/decomposer.md)) run it in the background.

**In one breath:** the fitness gate (`scripts/arch-scan.mjs --candidate`) names the highest-leverage
target; you split along a cohesive seam (extract → import back, behavior unchanged), verify green by exit
status, and ratchet `arch-budget.json` down — one safe split per PR, recursing on the next PR if the new
module is still too big.
