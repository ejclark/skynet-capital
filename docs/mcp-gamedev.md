# Game-dev MCP tooling (three.js)

Two MCP servers wired in [`.mcp.json`](../.mcp.json) for 3D work on the hero scene (`src/three/`,
three.js since #3718). Both launch over `npx`, so they start the same way on Eric's Mac and in a
Claude Code cloud session — no local server, no pre-session provisioning. They load at **session
start** and each needs a one-time approval (`/mcp`, or `enabledMcpjsonServers` in
`.claude/settings.local.json`) — adding a third-party MCP server runs its code, so that stays Eric's.

## 1. `context7` — version-matched library docs (the 3D docs tool)

`@upstash/context7-mcp`. Answers API questions from current docs instead of training-data memory.
For the scene, resolve `Three.js` → library `/mrdoob/three.js`, then query one concept at a time
(`ShaderMaterial` uniforms, `EffectComposer` passes, `InstancedMesh`). The `render-alchemist` agent
has both context7 tools in its allowlist; other agents reach it only if their `tools:` line names
`mcp__context7__resolve-library-id` and `mcp__context7__query-docs`.

- **The API key is optional.** `.mcp.json` passes `${CONTEXT7_API_KEY:-}`: unset, it expands to an
  empty string and the server runs keyless at the lower rate limit. The `:-` matters — a bare
  `${CONTEXT7_API_KEY}` with the variable unset is passed through as that literal text, which
  context7 rejects with "Invalid API key" on every call (`docs/vendor/claude-code/mcp.md` →
  *Environment variable expansion*). To raise the limit, set a real `ctx7sk-…` key as an
  environment secret.

## 2. `playwright` — drive headless Chromium (the visual iterate loop)

`@playwright/mcp` (Microsoft), pinned to the **pre-installed** Chromium at `/opt/pw-browsers/chromium`
(`--executable-path` stops it downloading; the env sets `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`). Lets
Claude navigate the served scene, screenshot the canvas, and inspect the page as MCP calls.

- Serve the scene first: `npx tsx src/three/serve-scene.ts`, then point the browser at the local URL.

## The loop

1. Edit `src/three/`.
2. Serve it (`serve-scene.ts`); drive and screenshot with `playwright`.
3. Check API calls against `context7` (`/mrdoob/three.js`).
4. Iterate on the screenshots.

## Removed: `babylon-mcp` (2026-10-13)

`.mcp.json` used to point at `http://localhost:4000/mcp`, a local semantic-search index of the
Babylon.js docs and source (`immersiveidea/babylon-mcp`). It was removed because:

- **The engine it documents is gone.** The scene moved to three.js in #3718; no `@babylonjs/*`
  package remains in `package.json`.
- **Cloud sessions could never reach it.** Every session start failed with `ECONNREFUSED`. Its
  background provisioner (`scripts/babylon-mcp-ensure.sh`) was never registered as a hook, and could
  not have helped anyway: tools load at session start, so a provision made inside a session only
  serves the *next* one, and each cloud session gets a fresh container. The index was also ~1GB+.
- **No agent could call it.** None of the forge agents' `tools:` allowlists named it.

The setup scripts are in git history (`git log --diff-filter=D -- scripts/setup-babylon-mcp.sh`) if a
Babylon surface ever returns; in that case use context7's Babylon.js library before re-adding a
local server.
