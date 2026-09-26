# Interactive session toolkit

**Technology:** Claude Code harness (local or cloud), .claude/ config, Markdown skill and agent contracts, Workflow-tool JS

**Responsibility:** What a human-steered Claude session loads: Orient output style, SessionStart hooks (mise Node 24 provisioning, commit signing), 16 skills (/ship /governor /secretary /grind /issue /retro ...), 13 agents (sonnet athletes, fable reviewers), and the grind.js / symbol-sweep.js fan-out workflows

**Code roots:** `.claude/settings.json` · `.claude/output-styles/orient.md` · `.claude/hooks/session-start.sh` · `.claude/skills/` · `.claude/agents/` · `.claude/workflows/` · `scripts/setup-commit-signing.sh` · `scripts/duel-log.mjs` · `scripts/worktree-setup.sh`

**Entrypoints:** `.claude/settings.json` · `.claude/hooks/session-start.sh` · `.claude/workflows/grind.js` · `.claude/workflows/symbol-sweep.js`

**Grounding:** .claude/settings.json sets outputStyle Orient and wires SessionStart/PreToolUse/PostToolUse/UserPromptSubmit hooks to scripts/duel-log.mjs; docs/COMPUTE.md documents model/effort frontmatter; docs/grind/README.md documents grind.js step kinds

**Refuter's verdict:** grounded — Relabel the agents as "13 agents (7 sonnet athletes, 3 opus art/artifact/linguist, 3 fable xhigh red-team/reviewer/render-alchemist)". Mark the mise Node 24 SessionStart step as cloud-only: it is gated on CLAUDE_CODE_REM

## Where it sits

| From | To | What | How | Refuter |
|---|---|---|---|---|
| eric | session | Directs in chat | Claude Code | grounded — Optionally relabel it "Dumps raw ideas / directives in chat (session routes: act/park/fan/ME/Q)" so it is clear the session classifies and questions input rather than just executing it. |
| session | ship | Lands branches | /ship skill → scripts/ship.sh | grounded — Optional: a more precise label would be "Lands branches (verify → push → REST PR → arm auto-merge; no polling)", with ship noted as a skill that wraps scripts/ship.sh. Carve-outs get the PR opened but are merged by Eric. |
| session | gates | Runs scans and governor cycles | npm run verify, --candidate | grounded — Relabel the edge to "Runs gate scans (node scripts/*-scan.mjs [--candidate]) for local verification and governor target selection". Optionally add a separate edge, session → athletes, labelled "governor cycle dispatch".  |
| session | graphify | Refreshes the structural map | npm run graph:refresh | grounded — Suggest the label "Refreshes structural map manually (npm run graph:refresh → graphify extract/cluster-only, AST-only, writes docs/STRUCTURE-graph.md)". Do not draw an automated or CI edge. No auto-refresh workflow exist |
