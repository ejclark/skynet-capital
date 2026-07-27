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

Everything below is Eric's — never self-authorized. Nothing places a real order until step 4.

1. **Volume (one-time, if not already created):**
   ```
   fly volumes create skynet_data --region ord --size 1
   ```
2. **Bot paper credentials** — a paper Alpaca key/secret per persona you want to run
   (env names derive from the id, e.g. `day-trader` → `SKYNET_BOT_DAY_TRADER_KEY/SECRET`):
   ```
   fly secrets set SKYNET_BOT_DAY_TRADER_KEY=PK... SKYNET_BOT_DAY_TRADER_SECRET=...
   fly secrets set SKYNET_AUTONOMOUS_BOTS=day-trader   # which personas the bots process runs
   ```
3. **Deploy** (both processes come up; bots is in **observe** — watching, placing nothing):
   ```
   fly deploy
   fly logs -a skynet-capital   # watch the [autonomous] mode=observe line + [gate] verdicts
   ```
   Confirm the readiness gate passed the persona (`[gate] The Day Trader: READY … → live` would show
   only once mode is live; in observe you'll see it decide but not place).
4. **Go live (the one irreversible flip — do it during a market open, watching):**
   ```
   fly secrets set SKYNET_AUTONOMOUS_MODE=live
   ```
   The bots process restarts in live and begins placing **paper** orders; fills show on the board.

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
