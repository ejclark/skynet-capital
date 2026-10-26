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
#   3. both still hold SMOKE_HOLD seconds later, on the SAME process — no restart, no new machine
#      event (see "the hold" below; #6004's boot armed, then OOM'd ~5s later and still passed).
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

# ── the hold — a boot that dies seconds later is not a pass (#6004, #5955) ──────────────────────
# The loop above used to exit 0 the first moment both checks held, and never looked again. On
# 2026-10-25 (run 40152435829) that passed a boot that OOM'd ~5s later ("FATAL ERROR: Reached heap
# limit", #6004), and the false green fed the wrong erosion on #5955 (#6076). So a pass is now two
# reads HOLD seconds apart, and the second must show the SAME process still running:
#   - still `started`, same primary id, still stamped with the expected GIT_SHA;
#   - no new machine event across the hold (Fly appends exit/start events on a process restart);
#   - when the pass came from the stamp: same `pid` and `bootedAt` (no restart inside the machine),
#     and — only if a controls poll was due inside the hold — `updatedAt`/`lastControlsPollAt` moved.
# Two `started` reads alone prove nothing: a crash-looping machine reads `started` on every pass.
# The log-search fallback goes through the same hold; with no stamp to compare it rests on the
# machine-level checks (id, sha, events), which are what catch a restart from outside the process.
HOLD="${SMOKE_HOLD:-25}"           # > the ~5s boot-to-OOM seen in #6004, < one 30s poll
POLL="${SMOKE_POLL_SECONDS:-30}"   # = POLL_MS in src/autonomous/bot-controls-client.ts

# One read of the started primary: {id, state, sha, lastEvent, health}. health is null when the
# stamp is unreadable (machine gone, exec refused, not JSON) — which the hold reads as a breach
# only when the first read HAD a stamp.
snapshot() {
  local machines id health
  machines=$(flyctl machine list -a "$APP" --json 2>/dev/null) || machines='[]'
  id=$(jq -r "$PRIMARY_FILTER"' | map(select(.state == "started"))[0].id // empty' <<<"$machines" 2>/dev/null) || id=""
  health=""
  if [[ -n "$id" ]]; then
    health=$(flyctl machine exec "$id" "cat $HEALTH_PATH" -a "$APP" 2>/dev/null | jq -c '.' 2>/dev/null) || health=""
  fi
  [[ -n "$health" ]] || health='null'
  jq -c --arg id "$id" --argjson health "$health" "$PRIMARY_FILTER"' | (map(select(.id == $id))[0] // {}) | {
      id: $id, state: (.state // null), sha: (.config.env.GIT_SHA // null),
      lastEvent: ((.events // []) | map(.timestamp) | max), health: $health }' <<<"$machines" 2>/dev/null \
    || jq -nc --arg id "$id" '{id: $id, state: null, sha: null, lastEvent: null, health: null}'
}

# Why the boot did not hold between reads $1 and $2; prints nothing when it held.
hold_breach() {
  local poll_due=false
  ((POLL < HOLD)) && poll_due=true
  jq -nr --argjson a "$1" --argjson b "$2" --arg sha "$WANT_SHA" --argjson poll_due "$poll_due" '
    if $a.id == "" then "the primary was not started when the hold began"
    elif $b.id == "" or $b.state != "started" then "the primary is no longer started"
    elif $b.id != $a.id then "the started primary changed (\($a.id) -> \($b.id))"
    elif $b.sha != $sha then "the primary no longer carries GIT_SHA=\($sha)"
    elif $b.lastEvent != $a.lastEvent then "the machine logged a new event during the hold (exit/restart)"
    elif $a.health == null then empty
    elif $b.health == null then "the health stamp went unreadable"
    elif $b.health.gitSha != $sha then "the health stamp no longer names \($sha)"
    elif $b.health.pid != $a.health.pid or $b.health.bootedAt != $a.health.bootedAt
      then "the process restarted (pid \($a.health.pid) -> \($b.health.pid), bootedAt \($a.health.bootedAt) -> \($b.health.bootedAt))"
    elif $poll_due and ($b.health.updatedAt == $a.health.updatedAt or $b.health.lastControlsPollAt == $a.health.lastControlsPollAt)
      then "no controls poll landed across a hold longer than the poll interval"
    else empty end'
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
    # Both checks hold once — the stamp path or the log fallback alike. Now the hold (above).
    echo "[smoke-bots] both checks hold — holding ${HOLD}s to prove the boot stays up"
    first=$(snapshot)
    sleep "$HOLD"
    second=$(snapshot)
    breach=$(hold_breach "$first" "$second")
    if [[ -n "$breach" ]]; then
      echo "[smoke-bots] FAIL — the boot passed both checks, then did not hold for ${HOLD}s: $breach" >&2
      echo "[smoke-bots] (a boot that dies seconds after arming — #6004's heap OOM — is not a pass)" >&2
      echo "[smoke-bots] first read:  $first" >&2
      echo "[smoke-bots] second read: $second" >&2
      exit 1
    fi
    echo "[smoke-bots] PASS — machine started on the expected commit, controls bridge reachable, and the same process held for ${HOLD}s."
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
