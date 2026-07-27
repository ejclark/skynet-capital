#!/usr/bin/env bash
# Post-deploy smoke test — the harness that makes zero-human deploys safe (audit P1).
#
# Probes the running app's public surface and fails loudly if it isn't serving what a healthy
# release serves. Used by .github/workflows/deploy.yml right after `fly deploy` (a failure there
# triggers rollback to the previous image), and runnable locally against any base URL:
#
#   scripts/smoke.sh http://localhost:8787
#   scripts/smoke.sh https://skynet-capital.fly.dev
set -euo pipefail

BASE="${1:?usage: smoke.sh <base-url>}"
ATTEMPTS="${SMOKE_ATTEMPTS:-6}"   # boot can take a few seconds after a deploy
SLEEP="${SMOKE_SLEEP:-5}"

probe() { # probe <path> <required-substring>
  local path="$1" want="$2" body code
  body=$(curl -sS --max-time 15 -w '\n%{http_code}' "$BASE$path") || return 1
  code="${body##*$'\n'}"
  body="${body%$'\n'*}"
  [[ "$code" == "200" ]] || { echo "  $path -> HTTP $code (want 200)"; return 1; }
  grep -qF "$want" <<<"$body" || { echo "  $path -> 200 but missing marker '$want'"; return 1; }
  echo "  $path -> 200 + marker ok"
}

for ((i=1; i<=ATTEMPTS; i++)); do
  echo "[smoke] attempt $i/$ATTEMPTS against $BASE"
  if probe "/login" "SKYNET" && probe "/pulse" "{"; then
    echo "[smoke] PASS — release is serving."
    exit 0
  fi
  ((i < ATTEMPTS)) && sleep "$SLEEP"
done

echo "[smoke] FAIL — release is not serving a healthy surface." >&2
exit 1
