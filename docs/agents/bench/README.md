# The bench

Agent files that do real work with no ask today. They sit here because Claude Code loads
`.claude/agents/` recursively (`docs/vendor/claude-code/sub-agents.md`), and every loaded description
costs each context that carries the Agent tool. This folder is outside it, and inside the instruction
scope (`scripts/instructions/scope.mjs`), so `node scripts/doc-rot-scan.mjs` keeps checking their
cites while they wait.

## Bring one back

```bash
git mv docs/agents/bench/piece-wright.md .claude/agents/
```

That one move restores the agent: Claude Code picks up a new file within seconds, with no restart. In
the same PR, add its row below to the `FLOOR-TABLE` block in `docs/COMPUTE.md`, or
`node scripts/config-audit.mjs` flags it as missing a floor. A scene ask needs all four, so move them
together (`docs/3D-STRATEGY.md` → *The forge roster* has the relay).

| agent | class | model floor | effort floor |
|---|---|---|---|
| render-alchemist | genuinely hard / unfamiliar | fable | xhigh |
| art-director | complex/judgment | opus | high |
| piece-wright | mechanical code change | sonnet | high |
| set-dresser | mechanical code change | sonnet | high |

## Why these four

Benched 2026-11-01 ([`docs/COACHES.md`](../../COACHES.md) → *Roster pass, 2026-11-01*): 0 invocations
in 1,048 retained transcripts (2026-08-21 to 2026-11-01), `docs/art/` holds only `EYE.md` and no build
sheet was ever written, no `art/*` branch exists on origin, and the last `src/three/pieces` commit is
from 2026-09-29. `/vision`, `/teardown`, `docs/art/EYE.md` and `docs/mcp-gamedev.md` still name them,
because those are the routes that apply when they come back.

A `/charter` sunset pass on 2026-12-31 decides whether each stays here or goes. Eric naming a 3D piece
before then brings them back.
