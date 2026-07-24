# Deploying the Live Dashboard (public, always-on)

The observatory server holds SSE connections and Alpaca websockets, so it must run
continuously — that's why we deploy it as an always-on service rather than an artifact.
Once deployed, everyone with the URL + password gets the exact realtime behavior you have
on localhost, and no laptop has to stay awake.

**Keys stay server-side.** Alpaca credentials live as host secrets; browsers only ever
receive computed numbers. Always set a dashboard password before going public.

## Fly.io (recommended)

Fly runs a persistent machine well and has a region near Iowa (`ord`). One-time:

```sh
# 1. Install flyctl and sign in
brew install flyctl        # or: curl -L https://fly.io/install.sh | sh
fly auth login

# 2. Create the app (uses the committed fly.toml; don't deploy yet)
fly launch --no-deploy --copy-config --name skynet-capital-observatory

# 3. Set secrets — the same values as your .env, plus a dashboard password
fly secrets set \
  SKYNET_DASHBOARD_PASSWORD='choose-a-shared-passphrase' \
  SKYNET_BOT_DAY_TRADER_KEY='...'    SKYNET_BOT_DAY_TRADER_SECRET='...' \
  SKYNET_BOT_RUMOR_TRADER_KEY='...'  SKYNET_BOT_RUMOR_TRADER_SECRET='...' \
  SKYNET_HUMAN_ERIC_KEY='...'        SKYNET_HUMAN_ERIC_SECRET='...'

# 4. Deploy
fly deploy
```

Fly gives you `https://skynet-capital-observatory.fly.dev`. Share it as:

```
https://skynet-capital-observatory.fly.dev/?key=choose-a-shared-passphrase
```

Redeploy any time with `fly deploy` (CI could do this on merge to `main` later).

## Render / Railway (same Docker image)

The `Dockerfile` is host-agnostic. On Render: New → Web Service → point at this repo →
Docker → set the same env vars (Render injects `PORT`, which the server honors). Enable
"always on" (no idle sleep) so streams stay connected.

## After deploying

- Visit the URL with `?key=...` — you should see the three cards and live updates.
- The queued/real fills and price ticks push exactly as they do locally.
- To rotate the shared password: `fly secrets set SKYNET_DASHBOARD_PASSWORD='...'` (redeploys).
