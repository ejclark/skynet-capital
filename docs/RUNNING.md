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
