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
fly launch --no-deploy --copy-config --name skynet-capital

# 3. Create the persistent volume — self-service accounts AND equity history (see fly.toml [mounts])
fly volumes create skynet_data --region ord --size 1

# 4. Set secrets — the same values as your .env, plus a dashboard password and a store secret
fly secrets set \
  SKYNET_DASHBOARD_PASSWORD='choose-a-shared-passphrase' \
  SKYNET_STORE_SECRET='choose-a-long-random-string' \
  SKYNET_BOT_DAY_TRADER_KEY='...'    SKYNET_BOT_DAY_TRADER_SECRET='...' \
  SKYNET_BOT_RUMOR_TRADER_KEY='...'  SKYNET_BOT_RUMOR_TRADER_SECRET='...' \
  SKYNET_HUMAN_ERIC_KEY='...'        SKYNET_HUMAN_ERIC_SECRET='...'

# 5. Deploy
fly deploy
```

`SKYNET_STORE_SECRET` encrypts the self-service credential store at rest — set it before anyone
uses `/add`. The volume (`/data`) keeps those accounts across redeploys.

**What the volume holds, and how it's protected.** Two things live on `/data`: the self-service
account store, and the append-only equity history (`SKYNET_HISTORY_DIR=/data/history`, set in
`fly.toml` — a 5-minute sample per participant, ~13 MB per participant per year). History is the one
asset here that **cannot be reconstructed** if lost: accounts can be re-added, but a deleted history
file is gone. The current backup posture is **Fly's platform-default daily volume snapshots** (~5-day
retention) and nothing else — no off-machine export, no rotation, no restore drill. That is an
accepted, documented posture rather than an oversight; an explicit export is queued as an Eric-gated
decision (it touches credentials/spend). A Fly volume is also host-pinned, so a host loss is a
restore-from-snapshot event, not an automatic failover.

Fly gives you `https://skynet-capital.fly.dev`. Share it as:

```
https://skynet-capital.fly.dev/?key=choose-a-shared-passphrase
```

Redeploy any time with `fly deploy` — or wire up continuous deployment below so merging a
green PR ships automatically.

## Continuous deployment (merge → deploy)

The `release · deploy` job in `.github/workflows/pipeline.yml` deploys to Fly automatically **after CI passes on `main`**:
merge a green PR and the exact commit CI validated is shipped. A failed CI run never deploys.

The only thing GitHub needs is a Fly **deploy token** — your app secrets
(`SKYNET_DASHBOARD_PASSWORD`, `SKYNET_STORE_SECRET`, any Alpaca keys) stay on Fly and are
**never** added to GitHub.

```sh
# 1. Create a deploy-scoped Fly token (locally, one time)
fly tokens create deploy --app skynet-capital
# → prints "FlyV1 fm2_..." — copy the whole string
```

```
# 2. Add it to the repo as a secret named FLY_API_TOKEN:
#    GitHub → repo → Settings → Secrets and variables → Actions →
#    New repository secret → Name: FLY_API_TOKEN, Value: <paste the token>
```

That's it. From now on: open a PR → CI runs → merge when green → the Deploy workflow fires and
runs `flyctl deploy`. Watch it under the repo's **Actions** tab. The first manual `fly deploy`
above is still needed once (to create the app, volume, and secrets); CD handles every deploy after.

### The bots app (the deploy split)

The autonomous trader runs in its own sibling app, **`skynet-capital-bots`**, so frontend/docs
merges stop restarting it and wiping its in-memory signal state (see `docs/AUTONOMY-DEPLOY.md` for
the full runbook and Eric's provisioning steps). Pipeline's `release · deploy bots` job redeploys
it **only** when `scripts/bot-relevant.mjs` says the push touched the bots runtime, reusing the
image the dashboard deploy just built. It needs its own token — Fly deploy tokens are app-scoped,
so `FLY_API_TOKEN` (scoped to `skynet-capital`) cannot deploy the sibling:

```sh
fly tokens create deploy --app skynet-capital-bots
# → add as repo secret FLY_API_TOKEN_BOTS
```

**Token-scoping note.** The two deploy tokens are the crown jewels here, not the `autonomy-ops`
Environment: that Environment's required-reviewer gate governs the ops *workflow* only, while the
tokens are plain repo secrets usable by any workflow that names them — and a Fly deploy token can
set secrets, which is mode-flip-equivalent power. Any future workflow edit that touches these
secrets deserves the same scrutiny as a `fly.toml` change (both are envelope-protected). One
pre-verification before trusting CI with it: an app-scoped token must be able to deploy the
*other* app's registry image (`flyctl deploy --config fly.bots.toml --image
registry.fly.io/skynet-capital@<digest>`). If Fly refuses cross-app registry pulls under an
app-scoped token, mint an org-scoped deploy token for `FLY_API_TOKEN_BOTS` instead — the runbook's
provisioning step includes this check.

If the bots app was wrongly skipped or its deploy failed, the recovery lever is
**Actions → Pipeline → Run workflow → `force_bots_deploy`**; `node scripts/deploy-lag.mjs` now
reports both apps' lag separately.

## Self-service onboarding (`/add`)

Once deployed, anyone with the dashboard link can add their own Alpaca **paper** account —
no `.env` edit, no redeploy:

1. They open `https://<app>.fly.dev/add?key=<password>` (the "+ Add your account" link on the
   board carries the key through).
2. They paste their Alpaca paper API key/secret and a display name, and submit.
3. The server validates the key by reading the account, stores it **encrypted** on the `/data`
   volume, and the account appears on the board live via SSE — no restart.

Security model: the store is encrypted at rest with `SKYNET_STORE_SECRET`; submitted keys are
only ever read to display balances/positions (nothing is placed on anyone's behalf); the whole
`/add` route sits behind the same login as the rest of the dashboard (OAuth below, or the legacy
password).

## Per-user login (Google + GitHub OAuth)

When OAuth is configured the dashboard drops the `?key=` param entirely: visitors hit `/login`,
sign in with Google or GitHub, and get a signed session cookie. Only people on the allowlist are
let in. It turns on automatically once `SKYNET_SESSION_SECRET` **and** at least one provider are
set; otherwise the server falls back to the shared password (fine for localhost).

**1. Create the OAuth apps** (callback URLs must match exactly):

- **Google** — [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services →
  Credentials → Create OAuth client ID → Web application. Authorized redirect URI:
  `https://skynet-capital.fly.dev/auth/google/callback`. (Configure the OAuth consent screen as
  "External"; add your guests as test users while it's in testing.)
- **GitHub** — [github.com/settings/developers](https://github.com/settings/developers) → New
  OAuth App. Authorization callback URL: `https://skynet-capital.fly.dev/auth/github/callback`.

**2. Set the secrets on Fly:**

```sh
fly secrets set -a skynet-capital \
  SKYNET_SESSION_SECRET="$(openssl rand -hex 32)" \
  SKYNET_GOOGLE_CLIENT_ID='...'  SKYNET_GOOGLE_CLIENT_SECRET='...' \
  SKYNET_GITHUB_CLIENT_ID='...'  SKYNET_GITHUB_CLIENT_SECRET='...' \
  SKYNET_ALLOWED_EMAILS='you@gmail.com,brother@gmail.com,dad@gmail.com'
```

That's it — `fly deploy` (or the next merge) picks it up. The URL is now clean:
`https://skynet-capital.fly.dev/`. Set only one provider's vars if you only want that button.
`/logout` clears the session.

**Adding people: use `/invite`, not the secret.** `SKYNET_ALLOWED_EMAILS` is the **owner** tier —
the identities that may sign in *and* invite others. Everyone else is added from the app itself:

1. Sign in as an owner and open **`/invite`**.
2. Type the email, submit. They can sign in immediately — no redeploy, no restart.

The guest list lives at `/data/allowlist.json` on the mounted volume, encrypted at rest with
`SKYNET_STORE_SECRET` (invites are refused, loudly, if that isn't set). Editing the secret still
works as break-glass, but remember it **replaces** the whole value — which is exactly why `/invite`
exists. For a GitHub user whose email is private, their login still goes in
`SKYNET_ALLOWED_GITHUB_LOGINS`. Full rationale: [`adr/0005`](adr/0005-in-app-oauth-authentication.md).

**Why `/data` and not `data`.** Every store in `src/` defaults to a *relative* path
(`env.SKYNET_ALLOWLIST_STORE ?? "data/allowlist.json"`), which on Fly resolves inside the container
image at `/app/data` — wiped by every deploy, and silently, since an absent store file reads as an
empty one. `fly.toml`'s `[env]` block is what pins each store to the mounted volume, and
`tests/arch/volume-persistence.spec.ts` fails CI if a newly added store is missing a line there. A
guest list that lost its members on every merge to `main` is the reason that gate exists.

**A second net runs at boot, not just at merge.** `src/runtime/volume-guard.ts` re-checks the same
list against the live environment on every start and warns in `fly logs`
(`⚠️  SKYNET_ALLOWLIST_STORE resolves to "data/allowlist.json" — not on the mounted volume…`) the
moment a pinned store drifts off the volume by any route CI can't see — a hand-edited `[env]`
block, an override set outside git, a var unset after the fact. If you ever see that warning after
a deploy, fix `fly.toml`'s `[env]` block and redeploy before anyone invites a new member.

## Render / Railway (same Docker image)

The `Dockerfile` is host-agnostic. On Render: New → Web Service → point at this repo →
Docker → set the same env vars (Render injects `PORT`, which the server honors). Enable
"always on" (no idle sleep) so streams stay connected.

## After deploying

- Visit the URL with `?key=...` — you should see the three cards and live updates.
- The queued/real fills and price ticks push exactly as they do locally.
- To rotate the shared password: `fly secrets set SKYNET_DASHBOARD_PASSWORD='...'` (redeploys).
