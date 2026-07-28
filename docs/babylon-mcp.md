# Babylon MCP — always-on Babylon.js knowledge for scene work

[`immersiveidea/babylon-mcp`](https://github.com/immersiveidea/babylon-mcp) serves semantic search
over Babylon.js **docs, API, and source** at `http://localhost:4000/mcp`. With it running, scene
work (the `/tower` Eye, future `src/scene/` lego + hero pieces) is written against accurate Babylon
knowledge instead of guesses. No API key — it uses local embeddings (`@xenova/transformers` + LanceDB).

The repo is already wired for it:

- **`.mcp.json`** points Claude at `http://localhost:4000/mcp`. Claude loads MCP tools **at session
  start**, so the server must be up *before* a session begins for its tools to appear.
- **`scripts/setup-babylon-mcp.sh`** clones + builds + indexes + starts the server (idempotent).
- **`scripts/babylon-mcp-ensure.sh`** — a non-blocking guard: if `:4000` isn't up, it provisions in
  the background (and skips if disk is tight). Intended for a `SessionStart` hook.

## Two facts that decide *where* it runs

1. **Tools load at session start.** Provisioning inside a session makes the tools available the
   **next** session, not the current one.
2. **`localhost` is per-environment.** A server on your Mac is not reachable from a remote
   Claude-Code-on-the-web container, and vice-versa. Run it wherever you want the tools.

## Recommended: the environment setup script (reliable, pre-session)

For "always on when building in this project" in the web environment, add this to the environment's
**setup-script** field (Claude Code on the web → environment settings — the one credentialed/owner
step; the setup script runs to completion *before* the session, so the server is up when `.mcp.json`
connects, and it provisions in a phase that doesn't compete with the working session's disk):

```bash
bash scripts/setup-babylon-mcp.sh
```

Heads-up: first cold-container run downloads Babylon repos + an embedding model and builds a vector
index (~1GB+, a few minutes). Subsequent sessions in the same container reuse it.

## Optional: a repo-level SessionStart hook (best-effort)

If you'd rather keep it purely in repo config, add this to `.claude/settings.json` under `hooks`
(I left this for you to add — the safety classifier gates a model from adding a hook that auto-runs an
external repo, which is the correct default):

```json
"SessionStart": [
  { "hooks": [ { "type": "command", "command": "bash scripts/babylon-mcp-ensure.sh", "async": true } ] }
]
```

Because the guard backgrounds provisioning, its tools become available a few minutes in / the next
session — the environment setup script above is the reliable path.

## Local (Claude Desktop on your Mac)

Per the upstream README, to use it in the Desktop app instead: run the setup script locally, then add
to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{ "mcpServers": { "babylon-mcp": { "url": "http://localhost:4000/mcp" } } }
```
