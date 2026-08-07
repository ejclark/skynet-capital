# Autonomy deploy runbook (Phase 3 of `docs/AUTONOMY-PLAN.md`)

How the bots run **always-on, without Eric's laptop** — and the exact credentialed steps that are
Eric's to run. The mechanism is built; the secrets, the spend, and the go-live flip are governance.

## What ships in the image

`fly.toml` now defines **two processes** sharing one image:

- **`app`** — `npm run serve:dashboard` — the SSE dashboard + Alpaca streams (serves HTTP on 8787).
- **`bots`** — `npm run run:autonomous` — the autonomous trader loop, so bots trade 24/7 without a
  laptop. **Safe by default:** it runs in **observe** mode (decides + logs, places nothing) until
  `SKYNET_AUTONOMOUS_MODE=live`. With no bot credentials it **idles quietly** (no crash-loop) until
  secrets are set.

Market-hours gating already lives in the runner (it only assesses when Alpaca reports the market open),
and the readiness gate pins any un-vetted persona to observe regardless of the mode flag.

## Eric's steps (the credentialed / irreversible class)

Everything below is Eric's — never self-authorized. Nothing places a real order until the go-live flip.

**No volume needed for `bots`.** The persistent volume mentioned in `fly.toml` is for the dashboard
process's self-service participant store only — a Fly volume attaches to a single machine, so `bots`
deliberately runs without one. Nothing to create here.

**Deploy is already automatic.** Every merge to `main` already runs `flyctl deploy` in the release
pipeline (`.github/workflows/pipeline.yml`) — `fly.toml`'s two processes (`app`, `bots`) come up
together on that same push. There is no separate manual deploy step for the bots process.

### The no-terminal path — `.github/workflows/autonomy-ops.yml`

A manually-triggered GitHub Actions workflow does the remaining steps from a browser, reusing the same
`FLY_API_TOKEN` the release pipeline already deploys with. **One-time setup, both parts required before
this actually gates anything:**

1. **Restrict who can run it.** GitHub Actions `workflow_dispatch` alone only requires repo *write*
   access — for a real allowlist, create a GitHub **Environment**: repo Settings → Environments → New
   environment → name it exactly `autonomy-ops` → **Required reviewers** → add the allowlisted
   accounts. Until this exists, referencing `environment: autonomy-ops` in the workflow auto-creates an
   *unprotected* one — the file alone does not enforce an allowlist, this UI step does.
2. **Add the bot's paper credentials as repository secrets** (Settings → Secrets and variables →
   Actions → New repository secret) — `BOT_DAY_TRADER_ALPACA_KEY` and `BOT_DAY_TRADER_ALPACA_SECRET`,
   a **paper** Alpaca key/secret pair. These are read by the workflow and written on to Fly as
   `SKYNET_BOT_DAY_TRADER_KEY/SECRET`; they're never typed into a dispatch form or shown in logs.

Then, from the **Actions** tab → **Autonomy ops** → **Run workflow**:

- **`status`** — read-only, lists Fly secret *names* only (never values). Safe to run any time.
- **`set-day-trader-credentials`** — writes the bot's Alpaca credentials to Fly from the repo secrets
  above, and sets `SKYNET_AUTONOMOUS_BOTS=day-trader`.
- **`flip-mode`**, with `mode: observe` — deploy comes up in **observe**: it decides and logs every
  cycle but places nothing. Watch `fly logs -a skynet-capital` for `[autonomous] mode=observe` and a
  `[gate]` line per persona; confirm it reads `READY` before going further.
- **`flip-mode`**, with `mode: live` — **the one genuinely irreversible step. Run it during a market
  open, watching the logs.** Bots begin placing real (paper) orders; fills show on the board.

Flip back with `flip-mode` / `mode: observe` any time — same button, same allowlist.

### The terminal path (unchanged, if you'd rather run it locally)

```
fly secrets set SKYNET_BOT_DAY_TRADER_KEY=PK... SKYNET_BOT_DAY_TRADER_SECRET=...
fly secrets set SKYNET_AUTONOMOUS_BOTS=day-trader
fly secrets set SKYNET_AUTONOMOUS_MODE=live   # the irreversible flip — during a market open, watching
fly logs -a skynet-capital
```

## The kill switch (hosted)

Flip back to observe — the bots process restarts and stops placing immediately:
```
fly secrets set SKYNET_AUTONOMOUS_MODE=observe
```
(Locally, `touch $SKYNET_HALT_FILE` halts instantly; the circuit breakers — daily-loss, order-rate,
errors, data-gap — auto-halt in both.)

## Known follow-up

A Fly volume attaches to a single machine, so the **bots** process doesn't share `/data` with the
**dashboard**. Always-on trading and the board's fill reflection work fine across the split (both read
Alpaca). The **decision-audit panel** (`/u/:id`) only shows a bot's reasoning when the audit JSONL is
readable by the dashboard — i.e. when the runner is co-located or writes to shared storage. Wiring that
(a shared store, or co-locating the loop) is P2.2 / a hosting follow-up; it doesn't block go-live.
