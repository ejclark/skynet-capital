# Autonomy deploy runbook (Phase 3 of `docs/AUTONOMY-PLAN.md`)

How the bots run **always-on, without Eric's laptop** — and the exact credentialed steps that are
Eric's to run. The mechanism is built; the secrets, the spend, and the go-live flip are governance.

## The deploy split — one image, two apps

The trading fleet is **stateful** (in-memory momentum/sentiment windows, cooldown clocks, the
daily-loss baseline) and the dashboard is not, so they deploy separately (2026-08-26: 41 merges in
one day restarted the shared bots machine ~every 15 minutes and Sauron never accumulated enough
signal to trade once):

- **`skynet-capital`** — the dashboard app (`app` process, HTTP 8787, owns the `/data` volume, and
  the 6PN-only insight/controls bridge listener on 8788). Deploys on **every** merge — its state is
  volume-backed and docs merges need it (the `/research` shelf is read from the image).
- **`skynet-capital-bots`** (`fly.bots.toml`) — the trader loop, alone. Deploys **only** when
  `scripts/bot-relevant.mjs` classifies the push as touching the bots runtime, reusing the image
  the dashboard deploy just built (one build per push). **Safe by default:** boots in **observe**
  mode (decides + logs, places nothing) until the autonomy-ops `flip-mode` action sets
  `SKYNET_AUTONOMOUS_MODE=live` on it. With no credentials it idles quietly.

The bots app reaches the dashboard's Mission Control bridge over the org's private 6PN network
(`app.process.skynet-capital.internal:8788`) — org-wide DNS, so the split changes nothing on the
wire. The one silent failure mode is that bridge going dark (the runner fails open to env-only
controls); `scripts/smoke-bots.sh` greps the boot log's `[controls] bridge armed — controls
fetched` line on every bots deploy as the tripwire.

Market-hours gating already lives in the runner (it only assesses when Alpaca reports the market
open), and the readiness gate pins any un-vetted persona to observe regardless of the mode flag.

## Eric's provisioning procedure (the credentialed / irreversible class)

Everything below is Eric's — never self-authorized. Nothing places a real order until the go-live
flip. One laptop command; every other step is a button (the cutover PR that removes the `bots`
group from `fly.toml` merged 2026-08-26 — post-cutover, this is the whole list):

1. `fly tokens create deploy -o personal` (laptop, once, ~30s) — the org-scoped deploy token.
   Copy the whole `FlyV1 fm2_...` string. **The only step that ever needs a terminal**: app
   creation is an org-level action no app-scoped token can perform.
2. Add it as repo secret **`FLY_ORG_TOKEN`** (Settings → Secrets and variables → Actions — works
   from a phone browser). Every bots-side workflow prefers `FLY_API_TOKEN_BOTS` when present and
   falls back to this, so you can narrow to an app-scoped token later without touching any file.
3. Click **Actions → Autonomy ops → Run workflow → `bootstrap-bots-app`** — creates
   `skynet-capital-bots` on the default org network (idempotent; refuses loudly if the secret is
   missing).
4. Click **Autonomy ops → `set-sauron-credentials`** (target `skynet-capital-bots`, the default) —
   writes the Alpaca paper creds from the existing repo secrets and sets the roster. Add
   **`set-hardcore`** with `sauron` if research mode is wanted. **Unset nothing on
   `skynet-capital`** — the dashboard reads the same `SKYNET_BOT_*` creds for the roster and
   leaderboard; they live on both apps permanently.
5. Click **Actions → Pipeline → Run workflow → check `force_bots_deploy`** — stands the machine up
   in **observe** mode; the bots smoke verifies boot + the controls bridge automatically.
6. Click **Autonomy ops → `flip-mode`, mode `live`** — during a market open, watching the logs.
   The workflow refuses mechanically if any old shared-app bots machine somehow survives; that
   check, not vigilance, is what prevents double-trading.

**Gist:** one terminal command mints the org token (the genuinely credentialed part); everything
after — app creation, credentials, deploy, go-live — is reviewer-gated buttons runnable from a
phone. End state: the dashboard deploys on every merge exactly as before; the bots machine
restarts only when bot code actually changes.

**Token trade-off, on the record:** `FLY_ORG_TOKEN` is org-wide deploy power sitting in repo
secrets — usable by any workflow that names it, gated by workflow-file review (the envelope) and
the autonomy-ops Environment. Accepted deliberately (2026-08-26) to make ops phone-operable; to
narrow later, mint `fly tokens create deploy --app skynet-capital-bots` as `FLY_API_TOKEN_BOTS`
(it takes precedence) and delete `FLY_ORG_TOKEN`.

**No volume for `bots`, still.** Durable writes relay to the dashboard's volume over the bridge;
the bots app deliberately has no `[mounts]`.

### The no-terminal path — `.github/workflows/autonomy-ops.yml`

A manually-triggered GitHub Actions workflow does the remaining steps from a browser, using the
app-scoped token that matches its `target_app` input (default: `skynet-capital-bots` →
`FLY_API_TOKEN_BOTS`; `skynet-capital` remains selectable for the transition window). **One-time
setup, both parts required before this actually gates anything:**

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
  cycle but places nothing. Watch `fly logs -a skynet-capital-bots` for `[autonomous] mode=observe`
  and a `[gate]` line per persona; confirm it reads `READY` before going further.
- **`flip-mode`**, with `mode: live` — **the one genuinely irreversible step. Run it during a market
  open, watching the logs.** Bots begin placing real (paper) orders; fills show on the board.

Flip back with `flip-mode` / `mode: observe` any time — same button, same allowlist.

### The terminal path (if you'd rather run it locally)

```
fly secrets set -a skynet-capital-bots SKYNET_BOT_DAY_TRADER_KEY=PK... SKYNET_BOT_DAY_TRADER_SECRET=...
fly secrets set -a skynet-capital-bots SKYNET_AUTONOMOUS_BOTS=day-trader
fly secrets set -a skynet-capital-bots SKYNET_AUTONOMOUS_MODE=live   # the irreversible flip — during a market open, watching
fly logs -a skynet-capital-bots
```

## The kill switch (hosted)

Flip back to observe — the bots machine restarts and stops placing immediately (and, post-split,
a secrets change on the bots app never touches the dashboard, and vice versa):
```
fly secrets set -a skynet-capital-bots SKYNET_AUTONOMOUS_MODE=observe
```
(Locally, `touch $SKYNET_HALT_FILE` halts instantly; the circuit breakers — daily-loss, order-rate,
errors, data-gap — auto-halt in both.)

## Known follow-up

A Fly volume attaches to a single machine, so the **bots** process doesn't share `/data` with the
**dashboard**. Always-on trading and the board's fill reflection work fine across the split (both read
Alpaca). The **decision-audit panel** (`/u/:id`) only shows a bot's reasoning when the audit JSONL is
readable by the dashboard — i.e. when the runner is co-located or writes to shared storage. Wiring that
(a shared store, or co-locating the loop) is P2.2 / a hosting follow-up; it doesn't block go-live.
