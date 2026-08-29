#!/usr/bin/env bash
# Post-deploy smoke test for the BOTS app (skynet-capital-bots) — the sibling of smoke.sh, which
# probes the dashboard's public surface. The bots app has NO public surface, so this one asks Fly:
#
#   1. the primary (non-standby) machine is `started` and stamped with the expected GIT_SHA
#      (proves the deploy actually replaced the running code, not just concluded green), and
#   2. the boot log shows "[controls] bridge armed — controls fetched" — the one line that proves
#      the cross-app 6PN controls bridge REACHED the dashboard (src/scripts/autonomous-live-wiring
#      .ts logs it only when the boot fetch returned a parsed state; the old wording fired on the
#      env var merely being SET, which is exactly the silent env-only-controls failure this smoke
#      exists to catch).
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

machine_ok() {
  # Primary = the machine that is NOT a standby (standbys carry a non-empty config.standbys list).
  flyctl machine list -a "$APP" --json \
    | jq -e --arg sha "$WANT_SHA" \
        '[.[] | select((.config.standbys // []) | length == 0)]
         | any(.state == "started" and .config.env.GIT_SHA == $sha)' >/dev/null
}

bridge_armed() {
  # Bounded scrollback read (never a stream); the marker only prints when the boot fetch SUCCEEDED.
  flyctl logs -a "$APP" -n 2>/dev/null | grep -qF "$ARMED_MARKER"
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
