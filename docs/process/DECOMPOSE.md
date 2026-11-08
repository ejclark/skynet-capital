# DECOMPOSE

The split playbook is a first-class, invocable **skill** — the single source of truth lives at
[`.claude/skills/decompose/SKILL.md`](../../.claude/skills/decompose/SKILL.md).

Invoke it interactively with `/decompose`, or let the governor chore
([`docs/grind/governor.instructions.md`](../grind/governor.instructions.md)) run it.

**In one breath:** the fitness gate (`scripts/arch-scan.mjs --candidate`) names the file furthest over
its code-line cap that is not in `arch-grandfather.json`; you split along a cohesive seam (extract →
import back, behavior unchanged), verify green by exit status, and shrink `arch-grandfather.json` if the
file was on it — one safe split per PR, recursing on the next PR if the new module is still too big.
