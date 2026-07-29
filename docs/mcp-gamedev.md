# Game-dev MCP tooling (Babylon.js)

Three MCP servers wired in [`.mcp.json`](../.mcp.json) for 3D/game-dev work on the Babylon scene
(`src/three/scene.html`). They load at **session start** and each needs your one-time approval —
adding a third-party MCP server runs its code, so it's a supply-chain decision that stays yours.

## Enable them (your step, once)

Project MCP servers are **opt-in**. In a session, run `/mcp` and approve `context7` + `playwright`
(and `babylon-mcp` only if you're running the bridge — see caveat). Or set in
`.claude/settings.local.json`:

```json
{ "enabledMcpjsonServers": ["context7", "playwright"] }
```

They activate on the **next** session (MCP servers are loaded at startup, not mid-session).

## The three servers

### 1. `context7` — version-pinned docs (adopt: high value here)
`@upstash/context7-mcp`, launched via `npx`. Injects precise, version-matched Babylon.js / WebGL /
WebGPU API docs so generated code doesn't drift to stale syntax. No live scene needed — pure win for
API accuracy on a large, fast-moving engine.
- **Optional API key** for higher rate limits: set `CONTEXT7_API_KEY` as an environment secret (same
  pattern as the signing key). Works without one at lower limits. `.mcp.json` references
  `${CONTEXT7_API_KEY}`; leave it unset to run keyless.

### 2. `playwright` — drive headless Chromium (adopt: our visual iterate loop)
`@playwright/mcp` (Microsoft), launched via `npx` against the **pre-installed** Chromium at
`/opt/pw-browsers/chromium` (`--executable-path` pins it so it never tries to download — the env sets
`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`). Lets Claude navigate the served scene, screenshot the canvas,
and inspect the page as MCP calls instead of bespoke scripts.
- Serve the scene first: `npx tsx src/three/serve-scene.ts` (then point the browser at the local URL).

### 3. `babylon-mcp` — real-time scene control (⚠️ deferred / experimental here)
`http://localhost:4000/mcp` (immersiveidea server; setup in `scripts/setup-babylon-mcp.sh`).
**Honest caveat:** these scene-control MCPs are built for a **live browser you have open locally**,
bridged over WebSocket — Claude pokes meshes/lights and *sees* them react. This environment is
**headless and remote**: there's no live scene to poke and no live view, so in practice the
inspect-and-iterate loop is **`playwright` (drive + screenshot headless Chromium) + `context7` (API
accuracy)**, which deliver the same outcomes here. Leave `babylon-mcp` disabled unless/until we build
a headless-scene + WS bridge and prove it beats the screenshot loop.

## The practical loop (what actually works headless)

1. Edit `src/three/scene.html`.
2. Serve it (`serve-scene.ts`), drive + screenshot via the `playwright` MCP.
3. Use `context7` to keep Babylon API calls version-correct.
4. Iterate on the screenshots. (No real-time scene poking — that's the local-desktop paradigm we don't have.)
