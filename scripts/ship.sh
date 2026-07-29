#!/usr/bin/env bash
set -euo pipefail

# ship.sh — land a branch as a PR the cheap way. The resource doctrine, in code.
#
# Every step runs either on THIS machine (git) or on the plentiful REST *core* bucket
# (15k/hr) — never the scarce GraphQL bucket (5k/hr) that the GitHub MCP spends by the
# thousands, and NEVER by polling. The completion signal is the merge webhook, not a
# status loop. A script is a one-time build cost, then ~free per run forever; that is the
# self-healing flywheel (docs/COACHES.md → "Resource cost is a fitness dimension").
#
#   scripts/ship.sh open "<pr title>" [--body-file F] [--base B] [--no-verify]
#       verify locally (fail fast) → push → open a PR over REST (core bucket). Prints the
#       PR number + URL. THEN, per .claude/skills/ship/SKILL.md: make ONE
#       `enable_pr_auto_merge` MCP call (the only GraphQL-only step — 1 call/PR, trivial)
#       for walk-away merge-on-green, and STOP. Do not poll.
#
#   scripts/ship.sh merge <pr-number> [--method squash|merge|rebase]
#       squash-merge over REST (core bucket). Branch protection still enforces the `verify`
#       check, so this only succeeds once CI is green — call it when the green webhook
#       arrives (no polling). Use instead of auto-merge when you want zero GraphQL and the
#       session is present to react to the webhook.
#
# Carve-outs — NEVER auto-land (open a PR and hand to Eric): workflow files
# (.github/workflows/**), and the credentials/spend/outward-facing irreversible class.

TOKEN="${GH_TOKEN:-${GITHUB_TOKEN:-}}"
[ -n "$TOKEN" ] || { echo "ship: no GH_TOKEN/GITHUB_TOKEN in env" >&2; exit 1; }
API="https://api.github.com"

# owner/repo from origin, handling both the proxy URL (.../git/OWNER/REPO) and normal remotes.
repo() {
  local u; u="$(git remote get-url origin)"; u="${u%.git}"
  case "$u" in
    */git/*) printf '%s\n' "${u##*/git/}" ;;
    *) printf '%s\n' "$u" | sed -E 's#^[a-z]+://[^/]+/##; s#^git@[^:]+:##' ;;
  esac
}

# api METHOD PATH [JSON] → prints body; sets global HTTP to the status code.
HTTP=""
api() {
  local out; out="$(curl -sS -X "$1" -w $'\n%{http_code}' \
    -H "Authorization: Bearer $TOKEN" \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    -H "User-Agent: skynet-ship" \
    ${3:+-d "$3"} "$API/repos/$(repo)$2")"
  HTTP="${out##*$'\n'}"; printf '%s' "${out%$'\n'*}"
}

json_field() { python3 -c "import sys,json; print(json.load(sys.stdin).get('$1',''))"; }

cmd_open() {
  local title="${1:-}"; shift || true
  [ -n "$title" ] || { echo "ship open: PR title required" >&2; exit 1; }
  local base="main" bodyfile="" verify=1
  while [ $# -gt 0 ]; do case "$1" in
    --base) base="$2"; shift 2 ;;
    --body-file) bodyfile="$2"; shift 2 ;;
    --no-verify) verify=0; shift ;;
    *) echo "ship open: unknown arg $1" >&2; exit 1 ;;
  esac; done

  local branch; branch="$(git rev-parse --abbrev-ref HEAD)"
  [ "$branch" != "$base" ] || { echo "ship: refusing to open a PR from $base into itself" >&2; exit 1; }
  git diff --quiet && git diff --cached --quiet || { echo "ship: uncommitted changes — commit first" >&2; exit 1; }

  if [ "$verify" = 1 ]; then
    echo "ship: local verify (parity with CI — fail fast before spending a runner)…"
    npm run verify >/tmp/ship-verify.log 2>&1 || { echo "ship: LOCAL VERIFY FAILED — not pushing."; tail -20 /tmp/ship-verify.log; exit 1; }
    echo "ship: verify green."
  fi

  echo "ship: pushing $branch…"
  local n=0; until git push -u origin "$branch" 2>/dev/null; do
    n=$((n+1)); [ "$n" -le 4 ] || { echo "ship: push failed after retries" >&2; exit 1; }
    sleep $((2**n)); done

  local body="{}"; [ -n "$bodyfile" ] && body="$(cat "$bodyfile")"
  local payload; payload="$(python3 -c "import json,sys; print(json.dumps({'title':sys.argv[1],'head':sys.argv[2],'base':sys.argv[3],'body':sys.argv[4]}))" \
    "$title" "$branch" "$base" "$body")"
  echo "ship: opening PR over REST (core bucket)…"
  local resp; resp="$(api POST "/pulls" "$payload")"
  if [ "$HTTP" = 201 ]; then
    local num url; num="$(printf '%s' "$resp" | json_field number)"; url="$(printf '%s' "$resp" | json_field html_url)"
    echo "ship: opened PR #$num  $url"
    echo "$num"
    echo "ship: NEXT (per .claude/skills/ship) — one enable_pr_auto_merge MCP call, then STOP. No polling."
  else
    echo "ship: REST open returned HTTP $HTTP (proxy may block writes). Body:" >&2
    printf '%s\n' "$resp" | head -5 >&2
    echo "ship: FALL BACK to the MCP create_pull_request tool for this one call (still ~1 call, not thousands)." >&2
    exit 2
  fi
}

cmd_merge() {
  local num="${1:-}"; shift || true
  [ -n "$num" ] || { echo "ship merge: PR number required" >&2; exit 1; }
  local method="squash"
  while [ $# -gt 0 ]; do case "$1" in --method) method="$2"; shift 2 ;; *) shift ;; esac; done
  echo "ship: squash-merging #$num over REST (core bucket; branch protection still enforces verify)…"
  local resp; resp="$(api PUT "/pulls/$num/merge" "{\"merge_method\":\"$method\"}")"
  case "$HTTP" in
    200) echo "ship: merged #$num." ;;
    405|409) echo "ship: not mergeable yet (HTTP $HTTP) — checks not green or conflict. Retry on the green webhook." >&2; exit 3 ;;
    *) echo "ship: merge returned HTTP $HTTP:" >&2; printf '%s\n' "$resp" | head -5 >&2; exit 2 ;;
  esac
}

case "${1:-}" in
  open) shift; cmd_open "$@" ;;
  merge) shift; cmd_merge "$@" ;;
  *) echo "usage: scripts/ship.sh {open \"<title>\" [--body-file F] [--base B] [--no-verify] | merge <n> [--method squash]}" >&2; exit 1 ;;
esac
