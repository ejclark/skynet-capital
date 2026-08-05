# Running the Live Server (and keeping the laptop awake)

The realtime dashboard only receives pushes while the server process is running **and** the
machine is awake. Streams are in-the-moment — if the laptop sleeps, you miss the propagation
(the data isn't lost in Alpaca; you just won't see it push live). Here's how to keep both up.

## Node version

This project targets **Node 24 (LTS)**. With nvm:

```sh
nvm install 24 && nvm use    # .nvmrc pins 24
node --version               # v24.x
```

## Start the server

```sh
cd skynet-capital
set -a && source .env && set +a
npm run serve:dashboard
# → http://localhost:8787   (append ?key=<password> if SKYNET_DASHBOARD_PASSWORD is set)
```

## Offline mode — run without Alpaca (no keys, no network)

For local development, CI stability, and triaging the UI without touching a live account, the
server and the autonomous loop can run against **committed fixtures** instead of Alpaca. Set
`SKYNET_DATA_SOURCE=offline` (or use the `:offline` scripts) — no credentials required:

```sh
npm run serve:dashboard:offline    # dashboard from fixtures/offline, replayed price/fill stream
npm run run:autonomous:offline     # personas trade against in-memory brokers off replayed ticks
```

## Iterating on the `/tower` 3D scene — no server, no credentials, no deploy

The Babylon scene (`src/three/`) is fully client-side, so it doesn't need `serve:dashboard` or any
env vars at all. For fast local iteration on shader/piece work — instead of a PR → verify → deploy
cycle to see a change:

```sh
npm run dev:tower                  # rebuilds public/three/scene.js on every save, serves it locally
# → http://127.0.0.1:8931/tower.html
```

Edit a file under `src/three/`, save, refresh the browser tab — no manual rebuild step. Drag to orbit,
scroll to zoom; check every angle a change might affect, not just the default framing (this is the
loop that caught the "empty from behind" and "spike clutter" regressions in `docs/art/EYE.md`).
`npm run shoot:tower` remains the automated, deterministic screenshot harness for the PR record —
`dev:tower` is for the interactive loop that comes before that.

- **Where the data lives:** `fixtures/offline/participants.json` (each account's cash, positions,
  orders) and `fixtures/offline/events.jsonl` (the price/fill script replayed on a timer). Point
  `SKYNET_OFFLINE_FIXTURES` at another directory to use a different capture.
- **Same code path as live.** Offline only swaps the transport and the stream
  (`FixtureTradingTransport` + `ReplayEventStream`) behind `resolveDataSource`; the hub, reducer,
  renderer, and SSE are identical — so what you see offline is what you get live.
- **Tests never hit the network.** The suite already runs fully offline; the fixtures above are
  for running the *server* offline, not for the tests.

### Record a real session to replay later

To triage against realistic data, capture a live session once and replay it offline:

```sh
set -a && source .env && set +a
npm run record:session -- fixtures/offline/events.jsonl   # Ctrl-C to stop
npm run serve:dashboard:offline                            # replays what you captured
```

`record:session` runs the real wiring and writes every price tick and fill (plus a leading
snapshot of the initial board) to the JSONL file.

## Keep the laptop awake with the server running

### macOS — `caffeinate` (simplest)

`caffeinate` ships with macOS. This keeps the system (and display) awake for exactly as long
as the server runs, and stops when the server does:

```sh
set -a && source .env && set +a
caffeinate -dimsu npm run serve:dashboard
```

- `-d` display, `-i` idle sleep, `-m` disk, `-s` system, `-u` declares user activity.
- Closing the lid can still sleep some Macs. To allow **lid-closed** operation while on power:
  `sudo pmset -c disablesleep 1` (re-enable later with `sudo pmset -c disablesleep 0`).

### Linux — systemd-inhibit

```sh
set -a && source .env && set +a
systemd-inhibit --what=idle:sleep --why="Skynet dashboard" npm run serve:dashboard
```

Or disable sleep at the OS level while testing:
`sudo systemctl mask sleep.target suspend.target` (unmask to restore).

### Windows — PowerShell

Prevent sleep for the shell running the server:

```powershell
powercfg /change standby-timeout-ac 0
powercfg /change monitor-timeout-ac 0
$env:SKYNET_BOT_DAY_TRADER_KEY="..."   # or load your .env
npm run serve:dashboard
```

Restore later: `powercfg /change standby-timeout-ac 30`.

## Keep it running across restarts (optional)

For an always-on setup, run it as a background service instead of a terminal:

- **macOS:** a `launchd` user agent (`~/Library/LaunchAgents/…plist`) with `KeepAlive`.
- **Linux:** a `systemd --user` service with `Restart=always`.
- **Anywhere:** a process manager like `pm2` (`pm2 start "npm run serve:dashboard" --name skynet`).

For sharing beyond your machine, deploy it to a small always-on host (Fly.io / Render / a VPS)
behind `SKYNET_DASHBOARD_PASSWORD` + HTTPS — then no laptop needs to stay awake at all. That's
the recommended path once you're past local shakeout.
