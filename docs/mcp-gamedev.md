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

- Serve the scene first: `npm run dev:tower` (rebuilds the bundle on save and serves
  `http://127.0.0.1:8931/tower.html`; `docs/RUNNING.md` → *Iterating on the `/tower` 3D scene*), then
  point the browser at that URL.

## The loop

1. Edit `src/three/`.
2. Serve it (`npm run dev:tower`); drive and screenshot with `playwright`.
3. Check API calls against `context7` (`/mrdoob/three.js`).
4. Iterate on the screenshots.

## No `babylon-mcp`

`.mcp.json` carries no `babylon-mcp` (`immersiveidea/babylon-mcp`, a local semantic-search index of
the Babylon.js docs and source at `http://localhost:4000/mcp`), and one does not belong there:

- **It documents an engine the scene does not use.** The scene is three.js (#3718); no `@babylonjs/*`
  package is in `package.json`.
- **A cloud session cannot reach a local server.** Tools load at session start and each cloud session
  gets a fresh container, so a server provisioned inside a session only serves the *next* one on that
  machine, and every cloud session start fails with `ECONNREFUSED`. The index is also ~1GB+.
- **No agent calls it.** None of the forge agents' `tools:` allowlists names it.

The setup scripts are in git history (`git log --diff-filter=D -- scripts/setup-babylon-mcp.sh`) if a
Babylon surface ever returns; even then, use context7's Babylon.js library before re-adding a local
server.
