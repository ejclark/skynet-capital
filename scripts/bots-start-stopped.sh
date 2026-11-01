#!/usr/bin/env bash
# Start the bots app's primary machine if it is stopped — the deploy path's missing step (#5955).
#
# flyctl leaves a stopped machine stopped and reports "a good state", so from 2026-10-22 every
# deploy and rollback landed on a dead fleet: a crash fix merged on 10-25 and did not run until
# 11-01, when one start brought the bots back. So the deploy job starts a stopped machine before
# smoke judges it, and the rollback restores a running bot rather than a stopped one.
#
#   scripts/bots-start-stopped.sh <app>            start if stopped; deploy and rollback use this
#   scripts/bots-start-stopped.sh <app> --report   also keep the evidence, for the catch-up job
#
# --report exists for a crash between merges, when no deploy will come. Before starting it records
# the machine's exit event and a named cause as one comment on one open issue, so the failure names
# its own cause, and it spends a budget: MAX_STARTS starts in WINDOW_HOURS, then it stops and says
# so, because a machine that keeps dying needs a person or a fix, not a fourth restart. A start is
# counted by its own comment — bot-authored and carrying START_MARKER — and nothing else: the first
# start used to file the issue without a comment (so four starts fit a budget of three), and any
# comment at all counted, a stranger's included, on this public repo (study 2026-11-01).
#
# Nothing in this repo halts the bots by stopping the machine (see scripts/bots-revive.sh), so a
# stopped primary is a crash, a host event or a hand stop. A hand stop meant to survive this carries
# the skynet-halt marker, which is always respected.
#
# Exit codes: 0 running, nothing to do, or deliberately left stopped · 1 start refused or never
# reached started · 3 budget spent, left stopped. Env for specs: FLY_BIN, GH_BIN, BOTS_START_WAIT_SECS,
# BOTS_POLL_SECS.
set -uo pipefail

APP="${1:?usage: bots-start-stopped.sh <app> [--report]}"
REPORT="${2:-}"
FLY="${FLY_BIN:-flyctl}"
GH="${GH_BIN:-gh}"
START_WAIT="${BOTS_START_WAIT_SECS:-90}"
POLL="${BOTS_POLL_SECS:-5}"
MAX_STARTS=3
WINDOW_HOURS=6
ISSUE_TITLE="[bots] machine found stopped"
START_MARKER='<!-- bots-start-stopped:start -->'
PRIMARY_FILTER='[.[] | select((.config.standbys // []) | length == 0)]' # = smoke-bots.sh

say() { echo "[bots-start] $*"; }
crash_type() {
  if grep -qE 'heap out of memory|Reached heap limit' <<<"$1"; then echo heap-oom
  elif grep -qE 'Out of memory: Killed|oom_killed=true' <<<"$1"; then echo oom-killed
  elif grep -qE 'Autonomous trading failed' <<<"$1"; then echo boot-error
  elif grep -qE 'max restart count' <<<"$1"; then echo max-restarts
  fi
}
primary() { "$FLY" machine list -a "$APP" --json 2>/dev/null | jq -c "$PRIMARY_FILTER | .[0] // empty"; }

M=$(primary)
[[ -n "$M" ]] || { say "no primary machine in $APP"; exit 1; }
ID=$(jq -r '.id' <<<"$M")
STATE=$(jq -r '.state' <<<"$M")
HALT=$(jq -r '.config.metadata["skynet-halt"] // empty' <<<"$M")

if [[ "$STATE" != "stopped" ]]; then
  say "machine $ID is $STATE, nothing to do"
  exit 0
fi
if [[ -n "$HALT" ]]; then
  say "machine $ID is deliberately halted ($HALT), leaving it stopped"
  exit 0
fi

if [[ "$REPORT" == "--report" ]]; then
  ISSUE=$("$GH" issue list --state open --search "\"$ISSUE_TITLE\" in:title" --json number --jq '.[0].number // empty' 2>/dev/null)
  if [[ -n "$ISSUE" ]]; then
    SINCE=$(date -u -d "-$WINDOW_HOURS hours" +%FT%TZ 2>/dev/null || date -u -v-"$WINDOW_HOURS"H +%FT%TZ)
    # The REST comments route, not `issue view`: it carries the author's type, and only a bot's
    # comment with this script's own marker is a start. `gh issue view` shows a login alone.
    # `since` keeps the read to the window on the server side — the route pages oldest first, so
    # on a long-lived issue the starts that matter would otherwise sit past the first page.
    RECENT=$("$GH" api "repos/{owner}/{repo}/issues/$ISSUE/comments?per_page=100&since=$SINCE" \
      --jq "[.[] | select(.user.type == \"Bot\" and ((.body // \"\") | contains(\"$START_MARKER\")) and .created_at >= \"$SINCE\")] | length" 2>/dev/null || echo 0)
    if ((RECENT >= MAX_STARTS)); then
      say "$RECENT starts in ${WINDOW_HOURS}h, budget spent: leaving $ID stopped. See issue #$ISSUE."
      echo "::error::bots machine keeps stopping: $RECENT starts in ${WINDOW_HOURS}h, left stopped. See issue #$ISSUE."
      exit 3
    fi
  fi
  EXIT=$(jq -c '[(.events // [])[] | select(.type == "exit")] | max_by(.timestamp // 0) | .request.exit_event // "none recorded"' <<<"$M" 2>/dev/null)
  # This repo is public and app logs can carry member emails, so the issue gets only a named cause
  # and the exit record, never a log line. .github/workflows/fly-logs.yml pulls the detail on demand.
  LOGS=$("$FLY" logs -a "$APP" -n 2>/dev/null | tail -n 80)
  CAUSE=$(crash_type "$LOGS")
  BODY=$(printf 'Found `%s` stopped and starting it.\n\n- Last exit: `%s`\n- Cause named in the logs: `%s`\n\nDetail: run the Fly logs workflow. Starts stop after %s in %s hours.\n\n%s\n' \
    "$ID" "${EXIT:-none recorded}" "${CAUSE:-none}" "$MAX_STARTS" "$WINDOW_HOURS" "$START_MARKER")
  # One issue frames the fault; every start, the first included, is one marked comment on it — the
  # comments are the budget, so filing the issue must not be a start that goes uncounted.
  if [[ -z "$ISSUE" ]]; then
    FRAME=$(printf 'The bots app'"'"'s primary machine was found stopped between deploys and this script is starting it. Each start below is one comment with the exit record and the cause named in the logs; after %s starts in %s hours it stops and leaves the machine down for a person or a fix.\n' \
      "$MAX_STARTS" "$WINDOW_HOURS")
    ISSUE=$("$GH" issue create --title "$ISSUE_TITLE" --label bug --body "$FRAME" 2>/dev/null | sed -E 's#.*/##')
    [[ -n "$ISSUE" ]] || say "could not file the issue"
  fi
  if [[ -n "$ISSUE" ]]; then
    "$GH" issue comment "$ISSUE" --body "$BODY" >/dev/null 2>&1 || say "could not comment on #$ISSUE"
  fi
fi

say "machine $ID is stopped, starting it"
if ! "$FLY" machine start "$ID" -a "$APP"; then
  say "fly refused the start"
  exit 1
fi
waited=0
until [[ "$(primary | jq -r '.state')" == "started" ]]; do
  if ((waited >= START_WAIT)); then
    say "never reached started within ${START_WAIT}s"
    exit 1
  fi
  sleep "$POLL"
  waited=$((waited + POLL))
done
say "machine $ID started"
