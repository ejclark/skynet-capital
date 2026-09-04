#!/usr/bin/env bash
# Post-deploy smoke test for the BOTS app (skynet-capital-bots) — the sibling of smoke.sh, which
# probes the dashboard's public surface. The bots app has NO public surface, so this one asks Fly:
#
#   1. the primary (non-standby) machine is `started` and stamped with the expected GIT_SHA
#      (proves the deploy actually replaced the running code, not just concluded green), and
#   2. the process's own health stamp (/data/health.json, written by src/autonomous/bots-health-file
#      .ts) says it is running <expected-git-sha> AND the cross-app 6PN controls bridge REACHED the
#      dashboard (`bridge: "armed"` — stamped only when the boot fetch returned a parsed state; the
#      silent env-only-controls failure this smoke exists to catch stamps `unreachable`). Read over
#      `flyctl machine exec … cat` — the file is readable the instant it lands. The older check,
#      grepping `flyctl logs -n` for "[controls] bridge armed", stays as a FALLBACK only: that
#      one-shot log read lags Fly's log pipeline (2026-08-27: widened to 150s; 2026-09-04: still
#      rolled back a healthy boot, which dropped GIT_SHA and forced a second deploy). A fallback can
#      only add ways to pass, never to fail.
#
#   scripts/smoke-bots.sh <app-name> <expected-git-sha>
#
# Requires FLY_API_TOKEN scoped to the app (CI passes FLY_API_TOKEN_BOTS). Fails loudly for the
# rollback step in pipeline.yml, exactly like smoke.sh does for the dashboard.
set -euo pipefail

APP="${1:?usage: smoke-bots.sh <app-name> <expected-git-sha>}"
WANT_SHA="${2:?usage: smoke-bots.sh <app-name> <expected-git-sha>}"
ATTEMPTS="${SMOKE_ATTEMPTS:-30}"   # widened 2026-08-27: 8x5s=40s failed 3/3 live runs even though
                                    # the app's own boot logs "armed" within ~2-9s of container
                                    # start (confirmed against real timestamps) — `flyctl logs -n`
                                    # (no-tail, one-shot) appears to lag Fly's log-shipping pipeline
                                    # well past that, not a boot-speed problem. 30x5s=150s is the
                                    # mitigation; root Fly-side delivery lag is not otherwise
                                    # confirmed, so this stays a generous budget, not a fixed claim.
SLEEP="${SMOKE_SLEEP:-5}"
ARMED_MARKER="[controls] bridge armed — controls fetched"
HEALTH_PATH="${SMOKE_HEALTH_PATH:-/data/health.json}"   # = SKYNET_BOTS_HEALTH_PATH in fly.bots.toml

# Primary = the machine that is NOT a standby (standbys carry a non-empty config.standbys list).
PRIMARY_FILTER='[.[] | select((.config.standbys // []) | length == 0)]'

machine_ok() {
  flyctl machine list -a "$APP" --json \
    | jq -e --arg sha "$WANT_SHA" \
        "$PRIMARY_FILTER"' | any(.state == "started" and .config.env.GIT_SHA == $sha)' >/dev/null
}

health_stamped() {
  # The process's own word: the started primary's /data/health.json names THIS commit and says the
  # bridge armed. A stale stamp from the previous release fails the sha check until the new process
  # overwrites it (atomic rename — never a half-written file).
  local id
  id=$(flyctl machine list -a "$APP" --json 2>/dev/null \
    | jq -r "$PRIMARY_FILTER"' | map(select(.state == "started"))[0].id // empty') || return 1
  [[ -n "$id" ]] || return 1
  flyctl machine exec "$id" "cat $HEALTH_PATH" -a "$APP" 2>/dev/null \
    | jq -e --arg sha "$WANT_SHA" '.gitSha == $sha and .bridge == "armed"' >/dev/null
}

bridge_armed() {
  # Stamp first; the bounded log read (never a stream) is the fallback — see the header.
  health_stamped || flyctl logs -a "$APP" -n 2>/dev/null | grep -qF "$ARMED_MARKER"
}

machine_status=1
bridge_status=1
for ((i=1; i<=ATTEMPTS; i++)); do
  echo "[smoke-bots] attempt $i/$ATTEMPTS against $APP (want GIT_SHA=$WANT_SHA)"
  # Evaluated separately (not short-circuited by &&) so a final-attempt failure can name which
  # check actually failed — the ORed message this replaces cost 6 unreadable CI failures in one
  # day (#821). `cmd || var=$?` is the set -e-safe idiom: the || makes the failure non-fatal.
  machine_status=0; machine_ok || machine_status=$?
  bridge_status=0; bridge_armed || bridge_status=$?
  if [[ $machine_status -eq 0 && $bridge_status -eq 0 ]]; then
    echo "[smoke-bots] PASS — machine started on the expected commit, controls bridge reachable."
    exit 0
  fi
  ((i < ATTEMPTS)) && sleep "$SLEEP"
done

if [[ $machine_status -ne 0 && $bridge_status -ne 0 ]]; then
  echo "[smoke-bots] FAIL — machine never reached started on $WANT_SHA, AND the controls bridge never armed" >&2
elif [[ $machine_status -ne 0 ]]; then
  echo "[smoke-bots] FAIL — machine never reached started on $WANT_SHA (controls bridge WAS armed)" >&2
else
  echo "[smoke-bots] FAIL — controls bridge never armed (machine IS started on $WANT_SHA)" >&2
fi
# Only relevant when the bridge itself is the failing check — printing it for a machine-only
# failure would misleadingly imply env-only controls when the bridge was actually reachable.
if [[ $bridge_status -ne 0 ]]; then
  echo "[smoke-bots] (bridge silence = env-only controls: Mission Control toggles are NOT reaching the fleet)" >&2
fi
exit 1
