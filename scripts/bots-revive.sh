#!/usr/bin/env bash
# Revive the bots app's primary machine — Eric's ONE paste for #5955 (the machine sits `stopped`,
# every deploy and rollback leaves it there, smoke fails "never reached started").
#
#   bash <(git show origin/main:scripts/bots-revive.sh)
#
# Independent of his checkout (read from origin/main, never the working tree). Uses only his local
# `fly` login — it never reads, sets or prints a token. Three steps:
#
#   1. Diagnose, read-only: `fly machine status` + the last ~80 log lines + the machine's own exit
#      events, classified as a crash/OOM signature, a deliberate halt, or a host problem.
#   2. If the primary is `stopped` and carries no deliberate-halt marker: `fly machine start`, then a
#      HOLD check, not a one-shot: still `started` after ~30s, the same bootedAt/pid in
#      /data/health.json across two reads (a crash loop changes them), no exit/start event in Fly's
#      own record since the first read (a restarted process that has not stamped yet leaves the
#      dead one's stamp on the volume, so the stamp alone misses it, #6281), and the controls bridge
#      armed per that fresh stamp. Never the boot-log marker here: inside one process the marker and
#      the stamp always agree, so the log can only add an OLD boot's "armed" line — a false OK (#6281).
#   3. One paste-back line, last on stdout:
#        BOTS-REVIVE: OK <sha> started <bootedAt>         — up, holding, bridge armed
#        BOTS-REVIVE: CRASH <signature>                   — + the 10 most telling log lines
#        BOTS-REVIVE: HALTED-DELIBERATELY <reason>        — marker found; nothing started
#        BOTS-REVIVE: UNARMED <sha> started <bootedAt>    — up and holding, bridge NOT armed
#        BOTS-REVIVE: HOST <signature>                    — Fly refused/failed the start itself
#        BOTS-REVIVE: NO-AUTH                             — run `fly auth login`, paste again
#
# What counts as a deliberate halt. Nothing in this repo halts the bots by stopping the machine:
# the halts are the halt file (SKYNET_HALT_FILE), the circuit breakers (src/autonomous/safety.ts),
# the owner's suspend over the controls bridge (src/autonomous/bot-controls.ts) and flipping
# SKYNET_AUTONOMOUS_MODE back to observe (docs/AUTONOMY-DEPLOY.md → "The kill switch") — every one
# keeps the process running. So a stopped primary is a crash, a host event or a hand stop. A hand
# stop meant to SURVIVE this script is marked on the machine, and this script respects it:
#   fly machine update <id> -a skynet-capital-bots --metadata skynet-halt=<reason>
#
# Env knobs (tests drive these; Eric never sets them): BOTS_APP, BOTS_HOLD_SECS (30),
# BOTS_START_WAIT_SECS (90), BOTS_POLL_SECS (5), BOTS_HEALTH_PATH, FLY_BIN.
# Spec: tests/scripts/bots-revive.spec.ts (a stub `fly` on PATH).
set -uo pipefail

APP="${BOTS_APP:-skynet-capital-bots}"
HOLD="${BOTS_HOLD_SECS:-30}"
START_WAIT="${BOTS_START_WAIT_SECS:-90}"
POLL="${BOTS_POLL_SECS:-5}"
HEALTH_PATH="${BOTS_HEALTH_PATH:-/data/health.json}"   # = SKYNET_BOTS_HEALTH_PATH in fly.bots.toml
PRIMARY_FILTER='[.[] | select((.config.standbys // []) | length == 0)]'   # = smoke-bots.sh
CRASH_RE='heap out of memory|Reached heap limit|Out of memory: Killed|oom_killed=true|max restart count|Autonomous trading failed|exited( normally)? with code: [1-9]|exit_code=[1-9]|Error: |FATAL'
HOST_RE='insufficient (memory|resources|capacity)|out of capacity|no capacity|host (is )?(unavailable|unreachable|down)|could not reserve|failed to (start|launch) (vm|machine)|volume .*(not found|unavailable|failed)'

FLY="${FLY_BIN:-$(command -v fly || command -v flyctl || true)}"
say() { echo "[bots-revive] $*"; }
finish() { echo "BOTS-REVIVE: $1"; exit "${2:-1}"; }

[[ -n "$FLY" ]] || { say "no fly CLI on PATH — install flyctl first"; finish "NO-AUTH" 4; }
command -v jq >/dev/null || { say "jq is required (brew install jq)"; exit 4; }
"$FLY" auth whoami >/dev/null 2>&1 || { say "fly is not logged in — run: fly auth login"; finish "NO-AUTH" 4; }

primary_json() { "$FLY" machine list -a "$APP" --json 2>/dev/null | jq -c "$PRIMARY_FILTER | .[0] // empty"; }
logs_tail() { "$FLY" logs -a "$APP" -n 2>/dev/null | tail -n 80; }
signature_of() {   # $1 = text → the first crash signature it names, or empty
  local t="$1"
  if grep -qE 'heap out of memory|Reached heap limit' <<<"$t"; then echo "heap-oom"
  elif grep -qE 'Out of memory: Killed|oom_killed=true' <<<"$t"; then echo "oom-killed"
  elif grep -qE 'Autonomous trading failed' <<<"$t"; then echo "boot-error"
  elif grep -qE 'max restart count' <<<"$t"; then echo "max-restarts"
  elif code=$(grep -oE 'exited( normally)? with code: [1-9][0-9]*|exit_code=[1-9][0-9]*' <<<"$t" | tail -1 | grep -oE '[0-9]+$'); then
    echo "exit-$code"
  fi
}
telling_lines() {   # the 10 log lines most worth reading: crash lines first, else the tail
  local hits
  hits=$(grep -E "$CRASH_RE|$HOST_RE" <<<"$1" | tail -n 10)
  if [[ -n "$hits" ]]; then echo "$hits"; else tail -n 10 <<<"$1"; fi
}
health_read() {   # $1 = machine id → the health stamp JSON, or nothing
  "$FLY" machine exec "$1" "cat $HEALTH_PATH" -a "$APP" 2>/dev/null | jq -c 'select(.pid and .bootedAt)' 2>/dev/null
}
last_restart_at() {   # the primary's newest exit/start event timestamp (Fly's clock, so no skew), or 0
  primary_json | jq -r '[(.events // [])[] | select(.type == "exit" or .type == "start" or .type == "restart")
    | .timestamp // 0] | max // 0' 2>/dev/null || echo 0
}

# ── 1. Diagnose (read-only) ───────────────────────────────────────────────────────────────────────
M=$(primary_json)
[[ -n "$M" ]] || { say "no primary machine in $APP — nothing to start"; finish "HOST no-primary-machine" 2; }
ID=$(jq -r '.id' <<<"$M")
STATE=$(jq -r '.state' <<<"$M")
HALT=$(jq -r '.config.metadata["skynet-halt"] // empty' <<<"$M")
LAST_EXIT=$(jq -r '[(.events // [])[] | select(.type == "exit")] | max_by(.timestamp // 0)
  | if . == null then empty else .request.exit_event
  | "exit_code=\(.exit_code // "?") oom_killed=\(.oom_killed // false) requested_stop=\(.requested_stop // false)" end' <<<"$M" 2>/dev/null)
say "machine $ID is $STATE (app $APP)"
"$FLY" machine status "$ID" -a "$APP" 2>/dev/null | sed 's/^/  │ /'
LOGS=$(logs_tail)
SIG=$(signature_of "$LOGS"$'\n'"$LAST_EXIT")
if [[ -n "$HALT" ]]; then VERDICT="deliberate halt — machine marked skynet-halt=$HALT"
elif [[ -n "$SIG" ]]; then VERDICT="crash — $SIG (last exit: ${LAST_EXIT:-none recorded})"
elif grep -qE "$HOST_RE" <<<"$LOGS"; then VERDICT="host problem — $(grep -oE "$HOST_RE" <<<"$LOGS" | tail -1)"
elif grep -q 'requested_stop=true' <<<"$LAST_EXIT"; then VERDICT="stopped on request (a deploy or a hand stop) with no crash in view"
else VERDICT="no cause in the last 80 lines (${LAST_EXIT:-no exit event recorded})"
fi
say "verdict: $VERDICT"

if [[ -n "$HALT" ]]; then
  say "left stopped: the halt marker says this stop is meant to stick. Clear it with"
  say "  fly machine update $ID -a $APP --metadata skynet-halt="
  finish "HALTED-DELIBERATELY $HALT" 3
fi

# ── 2. Start, then hold ───────────────────────────────────────────────────────────────────────────
T0=$(date -u +%s)
if [[ "$STATE" != "started" ]]; then
  say "starting $ID…"
  if ! OUT=$("$FLY" machine start "$ID" -a "$APP" 2>&1); then
    echo "$OUT" | sed 's/^/  │ /'
    HS=$(grep -oE "$HOST_RE" <<<"$OUT" | tail -1)
    finish "HOST ${HS:-start-refused}" 2
  fi
  waited=0
  until [[ "$(primary_json | jq -r '.state')" == "started" ]]; do
    if (( waited >= START_WAIT )); then
      LOGS=$(logs_tail); SIG=$(signature_of "$LOGS")
      telling_lines "$LOGS" | sed 's/^/  │ /'
      finish "CRASH ${SIG:-never-reached-started}" 1
    fi
    sleep "$POLL"; waited=$((waited + POLL))
  done
else
  say "already started — skipping the start, still running the hold check"
fi

# First health read: retry until the NEW process has stamped (a stale stamp from the last boot sits
# on the volume, so a started-from-stopped machine must show a bootedAt at or after this start).
H1=""; waited=0
while :; do
  R1=$(last_restart_at)   # read BEFORE the stamp, so a restart racing the H1 read still counts
  H1=$(health_read "$ID")
  if [[ -n "$H1" ]]; then
    if [[ "$STATE" == "started" ]] \
      || jq -e --argjson t0 "$((T0 - 60))" '(.bootedAt | sub("\\.[0-9]+Z$"; "Z") | fromdate) >= $t0' <<<"$H1" >/dev/null 2>&1; then
      break
    fi
  fi
  if (( waited >= START_WAIT )); then
    LOGS=$(logs_tail); SIG=$(signature_of "$LOGS")
    say "no fresh $HEALTH_PATH within ${START_WAIT}s — the process never got as far as stamping"
    telling_lines "$LOGS" | sed 's/^/  │ /'
    finish "CRASH ${SIG:-no-health-stamp}" 1
  fi
  sleep "$POLL"; waited=$((waited + POLL))
done
say "first stamp: pid $(jq -r .pid <<<"$H1") booted $(jq -r .bootedAt <<<"$H1") — holding ${HOLD}s…"
sleep "$HOLD"

STATE2=$(primary_json | jq -r '.state')
H2=$(health_read "$ID")
same=$(jq -n --argjson a "$H1" --argjson b "${H2:-null}" '$b != null and $a.pid == $b.pid and $a.bootedAt == $b.bootedAt')
R2=$(last_restart_at)
if [[ "$STATE2" != "started" || "$same" != "true" || "$R2" != "$R1" ]]; then
  LOGS=$(logs_tail); SIG=$(signature_of "$LOGS")
  say "did not hold: state=$STATE2, stamp $( [[ "$same" == true ]] && echo steady || echo 'changed or unreadable (restart)')$( [[ "$R2" != "$R1" ]] && echo ', Fly recorded a restart during the hold')"
  telling_lines "$LOGS" | sed 's/^/  │ /'
  finish "CRASH ${SIG:-restart-loop}" 1
fi

SHA=$(jq -r '.gitSha // empty' <<<"$H2"); [[ -n "$SHA" ]] || SHA=$(jq -r '.config.env.GIT_SHA // "unknown"' <<<"$(primary_json)")
BOOTED=$(jq -r '.bootedAt' <<<"$H2")
if jq -e '.bridge == "armed"' <<<"$H2" >/dev/null; then
  finish "OK ${SHA:0:12} started $BOOTED" 0
fi
say "process is up and steady, but the controls bridge is $(jq -r '.bridge' <<<"$H2") — Mission Control toggles are NOT reaching the fleet"
finish "UNARMED ${SHA:0:12} started $BOOTED" 5
