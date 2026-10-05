#!/usr/bin/env bash
set -euo pipefail

# Turn on alert delivery — the one credentialed step in #3407's last slice. Run on Eric's own
# machine, never in a session: the API key must not pass through a transcript.
#
#   bash <(git show origin/main:scripts/setup-alert-delivery.sh)
#
# WHY this is his and not a lane's: provisioning a delivery credential is the irreversible class
# (`envelope.json`). Everything else in the feature already shipped — the member's switch, the
# durable store, the two triggers, and the honest "delivery isn't configured on this deployment"
# sentence the Alerts panel prints until this runs.
#
# WHAT it sets, as Fly secrets on the dashboard app:
#   SKYNET_ALERT_EMAIL_API_KEY   the provider key (Resend by default — https://resend.com/api-keys)
#   SKYNET_ALERT_EMAIL_FROM      the verified sender, e.g. 'Skynet Capital <alerts@yourdomain>'
#
# It verifies the key by asking the provider to send ONE message to an address you name (your own),
# before it writes anything — a key that cannot send is never stored as if it could.
#
# Flags:
#   --key VALUE    the API key (default: prompted, hidden)
#   --from VALUE   the sender (default: prompted; 'Skynet Capital <onboarding@resend.dev>' works on
#                  Resend's free tier, which may only send to YOUR OWN verified address)
#   --to VALUE     where the one verification message goes (default: prompted — use your own inbox)
#   --app NAME     the Fly app (default: skynet-capital)
#   --dry-run      verify the key, print what would be set, write nothing
#
# Needs: `flyctl` logged in; network access to the provider.

APP="${SKYNET_FLY_APP:-skynet-capital}"
ENDPOINT="${SKYNET_ALERT_EMAIL_ENDPOINT:-https://api.resend.com/emails}"
key="" from="" to="" dry=0

while [ $# -gt 0 ]; do case "$1" in
  --key) key="$2"; shift 2 ;;
  --from) from="$2"; shift 2 ;;
  --to) to="$2"; shift 2 ;;
  --app) APP="$2"; shift 2 ;;
  --dry-run) dry=1; shift ;;
  -h|--help) sed -n '4,29p' "$0"; exit 0 ;;
  *) echo "setup-alert-delivery: unknown arg $1" >&2; exit 1 ;;
esac; done

say() { printf '\n▸ %s\n' "$*"; }
die() { printf '✗ %s\n' "$*" >&2; exit 1; }

# ── 0. preflight ────────────────────────────────────────────────────────────────────────────────
command -v flyctl >/dev/null || command -v fly >/dev/null || die "flyctl is not installed — https://fly.io/docs/flyctl/install"
FLY="$(command -v flyctl || command -v fly)"
command -v curl >/dev/null || die "curl is not installed"
"$FLY" auth whoami >/dev/null 2>&1 || die "flyctl is not logged in — run: flyctl auth login"

# ── 1. the three values ─────────────────────────────────────────────────────────────────────────
say "1/3  the credential"
if [ -z "$key" ]; then
  echo "  Create a key at https://resend.com/api-keys (sending permission is enough)."
  read -r -s -p "  Paste the API key (hidden) and press Enter: " key; echo
fi
[ -n "$key" ] || die "empty API key"
if [ -z "$from" ]; then
  read -r -p "  Sender [Skynet Capital <onboarding@resend.dev>]: " from
  from="${from:-Skynet Capital <onboarding@resend.dev>}"
fi
if [ -z "$to" ]; then
  read -r -p "  Send the one verification message to (your own address): " to
fi
[ -n "$to" ] || die "no verification recipient — the key is never stored unverified"

# ── 2. prove it can send, before storing anything ───────────────────────────────────────────────
say "2/3  verify the key by sending one message to $to"
body="$(printf '{"from":%s,"to":[%s],"subject":"Skynet Capital — alert delivery is ready","text":"This is the setup script proving the key works. Turn delivery on per account from the Alerts panel on your Trade page."}' \
  "$(printf '%s' "$from" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')" \
  "$(printf '%s' "$to" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')")"
out="$(curl -sS -w '\n%{http_code}' -X POST "$ENDPOINT" \
  -H "authorization: Bearer $key" -H 'content-type: application/json' --data "$body")"
code="$(printf '%s' "$out" | tail -1)"
[ "$code" = "200" ] || die "the provider refused it ($code): $(printf '%s' "$out" | head -n -1)
  A 422 usually means the sender isn't verified for that domain — try the free-tier sender, or verify yours."
echo "  ✓ accepted — check $to"

# ── 3. store it on the app ──────────────────────────────────────────────────────────────────────
say "3/3  set the secrets on $APP"
if [ "$dry" = 1 ]; then
  echo "  (dry-run) flyctl secrets set SKYNET_ALERT_EMAIL_API_KEY=*** SKYNET_ALERT_EMAIL_FROM='$from' --app $APP"
else
  "$FLY" secrets set "SKYNET_ALERT_EMAIL_API_KEY=$key" "SKYNET_ALERT_EMAIL_FROM=$from" --app "$APP" >/dev/null
  echo "  ✓ set (this restarts the app, which is how it picks them up)"
  have="$("$FLY" secrets list --app "$APP" 2>/dev/null || true)"
  for n in SKYNET_ALERT_EMAIL_API_KEY SKYNET_ALERT_EMAIL_FROM; do
    printf '%s' "$have" | grep -q "$n" || die "$n is missing from the app's secrets after setting it"
  done
  echo "  ✓ both present on $APP"
fi
unset key

say "Done. The Alerts panel on /app/trade now offers 'Send these to me' instead of saying delivery isn't configured — each member turns it on for themselves, and gets one test message when they do."
