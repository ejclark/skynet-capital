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
# One stop, one thread (#6470): the issue is the same `[fitness] bots-running` that scripts/fitness.mjs
# keeps, whichever of the two writes first. That report closes it on the pass this start earns, so
# the budget must outlive a close, or crash, start, pass, close would restart for ever: a thread
# closed in the last 14 days is reopened and its marked comments still count. Neither reopening nor
# filing assigns anyone, and the report assigns the owner only once this budget is spent.
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
ISSUE_TITLE="[fitness] bots-running"
START_MARKER='<!-- bots-start-stopped:start -->'
OWNER=ejclark
REOPEN_DAYS=14
# = REOPEN_LINE and REOPENED_MARKER in scripts/fitness-rungs.mjs; the report ages a failure from this.
REOPENED="The fix did not hold: this check failed again within $REOPEN_DAYS days of closing, so it reopened here and the attempts stay on one thread. What failed: machine is stopped.

<!-- fitness:reopened -->"
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
  # Open first, else the newest closed inside the window. Search is fuzzy, so the title is checked
  # here. A failed read files a new issue below: a second thread beats saying nothing.
  CUTOFF=$(date -u -d "-$REOPEN_DAYS days" +%FT%TZ 2>/dev/null || date -u -v-"$REOPEN_DAYS"d +%FT%TZ)
  THREAD=$("$GH" issue list --state all --search "\"$ISSUE_TITLE\" in:title" --limit 20 --json number,title,state,closedAt 2>/dev/null \
    | jq -c --arg title "$ISSUE_TITLE" --arg cutoff "$CUTOFF" \
      '[.[] | select(.title == $title)] | (map(select(.state == "OPEN"))[0]) // (map(select(.state == "CLOSED" and (.closedAt // "") >= $cutoff)) | max_by(.closedAt)) // empty' 2>/dev/null)
  ISSUE=$(jq -r '.number // empty' <<<"$THREAD" 2>/dev/null)
  if [[ "$(jq -r '.state // empty' <<<"$THREAD" 2>/dev/null)" == "CLOSED" ]]; then
    # He comes off first: reopening mails an assignee, and he has not been asked about this one yet.
    "$GH" api --method DELETE "repos/{owner}/{repo}/issues/$ISSUE/assignees" -f "assignees[]=$OWNER" >/dev/null 2>&1 || say "could not unassign #$ISSUE"
    "$GH" issue reopen "$ISSUE" --comment "$REOPENED" >/dev/null 2>&1 || say "could not reopen #$ISSUE"
  fi
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
  BODY=$(printf 'Found `%s` stopped and starting it.\n\n**What failed:** machine is stopped.\n\n- Last exit: `%s`\n- Cause named in the logs: `%s`\n\nDetail: run the Fly logs workflow. Starts stop after %s in %s hours.\n\n%s\n' \
    "$ID" "${EXIT:-none recorded}" "${CAUSE:-none}" "$MAX_STARTS" "$WINDOW_HOURS" "$START_MARKER")
  # One issue frames the fault; every start, the first included, is one marked comment on it — the
  # comments are the budget, so filing the issue must not be a start that goes uncounted.
  if [[ -z "$ISSUE" ]]; then
    # Written in the report's own shape, so the report reads this cause as already said.
    FRAME=$(printf '**This must stay true:** The bots machine is running, unless a person deliberately halted it.\n**What failed:** machine is stopped.\n**What fixes it:** scripts/bots-start-stopped.sh (budget: %s starts in %s hours, then stop).\n**What happens next:** Each start below is one comment with the exit record and the cause named in the logs. The owner is assigned only once those are spent, or if this still fails after 2 hours.\n\nThis issue closes itself once the check passes, and reopens if it fails again within %s days. Contract: `scripts/fitness.mjs`.\n' \
      "$MAX_STARTS" "$WINDOW_HOURS" "$REOPEN_DAYS")
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
