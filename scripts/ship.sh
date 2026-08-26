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
#       verify locally (fail fast) → incident preflight → push → open a PR over REST (core
#       bucket). Prints the
#       PR number + URL. THEN, per .claude/skills/ship/SKILL.md: make ONE
#       `enable_pr_auto_merge` MCP call (the only GraphQL-only step — 1 call/PR, trivial)
#       for walk-away merge-on-green, and STOP. Do not poll.
#
#   scripts/ship.sh merge <pr-number> [--method squash|merge|rebase]
#       squash-merge over REST (core bucket) — ONLY for an UNPROTECTED base branch. Merging into
#       a protected branch (i.e. `main` here) is refused for this session type (403), so on `main`
#       use native auto-merge (the enable_pr_auto_merge call) instead; when GraphQL is exhausted,
#       Eric web-merges. This subcommand is rarely used here.
#
# Carve-outs — NEVER auto-land (open a PR and hand to Eric): workflow files
# (.github/workflows/**), and the credentials/spend/outward-facing-AND-HARD-TO-REVERSE class.
# The authoritative list is envelope.json; `node scripts/envelope-scan.mjs --check <paths>` answers
# it mechanically rather than from a prose copy, several of which had drifted. `ship automerge`
# now ENFORCES that answer rather than trusting the reader to act on it — see `checkarm` below.

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

# api METHOD PATH [JSON] → prints "<body>\n__SHIP_HTTP__<code>". Parse in the CALLER, never via a
# global — this function runs inside $(...), a subshell, so any var it set would be lost on return.
api() {
  curl -sS -X "$1" -w '\n__SHIP_HTTP__%{http_code}' \
    -H "Authorization: Bearer $TOKEN" \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    -H "User-Agent: skynet-ship" \
    ${3:+-d "$3"} "$API/repos/$(repo)$2"
}
http_of() { printf '%s' "${1##*__SHIP_HTTP__}"; }              # code from an api() result
body_of() { printf '%s' "${1%$'\n'__SHIP_HTTP__*}"; }         # body from an api() result
json_field() { python3 -c "import sys,json; print(json.load(sys.stdin).get('$1',''))"; }

# checkbody — the picture/format contract as a pure, testable linter (no network, no git writes).
# The 2026-08-20 hat-team research finding this encodes: format compliance tracks enforcement,
# never willingness (fridge rule adopted by 4/126 bodies while comment-only; every machine-gated
# format in the repo thrives). Existence and honesty are gated; TASTE is not — that lives in
# docs/PICTURES.md. The waiver line keeps trivial PRs cheap and skips visible:
#   Picture: waived — <reason>
cmd_checkbody() {
  local f="${1:-}"
  [ -n "$f" ] && [ -s "$f" ] || { echo "ship checkbody: a non-empty body file is required" >&2; exit 1; }
  local fails=0
  fail() { echo "ship checkbody: $1" >&2; fails=$((fails+1)); }

  # 1. The picture — section present, holding media OR an explicit waiver (never presence-only:
  #    a decorative mermaid on a typo fix is worse than an honest skip).
  if ! grep -q '^## The picture' "$f"; then
    fail "missing '## The picture' — the fridge rule is section one. Trivial PR? Waive it explicitly: 'Picture: waived — <reason>' (docs/PICTURES.md)."
  else
    local pic; pic="$(awk '/^## The picture/{flag=1;next}/^## /{flag=0}flag' "$f")"
    # A GFM table counts as media: docs/PICTURES.md prescribes exactly that for a config or
    # constants change ("table: key · before · after · why"), and the gate rejecting one pushed two
    # PRs on 2026-08-22 toward a decorative diagram — the opposite of the waiver doctrine.
    # HERE-STRINGS, never `printf | grep -q`. `grep -q` exits the instant it matches, which can
    # SIGPIPE the writer; under `set -o pipefail` (line 2) the pipeline then reports 141 even though
    # the match SUCCEEDED, and a passing body gets failed. That raced on body size and CI load — it
    # went red once on PR #505's verify and survived 7+ local reruns, which is what a race looks
    # like. A here-string is not a pipeline, so there is nothing to signal.
    if grep -qE '!\[|<img |^```mermaid|^\|.*\|' <<<"$pic"; then
      # media present → a FILLED caption is required (the template placeholder '_Caption —_' fails)
      grep -qE '^_?Caption( —|:) .{3,}' <<<"$pic" \
        || fail "picture has no filled caption — one plain-language line: what it shows + where it came from (docs/PICTURES.md → honesty rules)."
    elif ! grep -qE '^Picture: waived — .+' <<<"$pic"; then
      fail "'## The picture' has neither media nor a waiver — add a screenshot/mermaid, or the line 'Picture: waived — <reason>'."
    fi
  fi

  # 2. Screenshot URLs must be SHA-pinned — branch-form raw URLs 404 the moment squash-merge
  #    deletes the branch (PR #446's fridge screenshots were dead within a day — empirical).
  if grep -E 'raw\.githubusercontent\.com/[^/)]+/[^/)]+/[^/)]+/' "$f" \
     | grep -vE 'raw\.githubusercontent\.com/[^/)]+/[^/)]+/[0-9a-f]{40}/' >/dev/null; then
    fail "raw.githubusercontent.com URL is not SHA-pinned — branch URLs rot at merge. 'ship open' pins docs/shots/ URLs automatically; pin others to a 40-hex commit SHA."
  fi

  # 3. Summary bullets ≤120 chars — 'ONE SHORT LINE EACH' (Eric, 2026-08-19) had 0% compliance
  #    as a comment; as a check it is unmissable.
  if grep -q '^## Summary' "$f"; then
    local over; over="$(awk '/^## Summary/{flag=1;next}/^## |^<details>/{flag=0}flag' "$f" | grep -E '^- ' | awk 'length($0) > 120' | head -3 || true)"
    [ -z "$over" ] || fail "Summary bullet over 120 chars — one short line each; the detail belongs below the fold:
$over"
  fi

  # 4. Mermaid stable-types allowlist — GitHub's deployed mermaid lags releases, and a syntax
  #    error renders as the PR's OPENING FRAME. Beta types are fine in comments/discussion, never
  #    as the fridge picture. (This checks the diagram TYPE, not full syntax — the honest limit.)
  local t bad=""
  while IFS= read -r t; do
    case "$t" in
      flowchart|graph|sequenceDiagram|stateDiagram-v2|erDiagram|classDiagram|pie|gantt|timeline|"") ;;
      *) bad="$bad $t" ;;
    esac
  done <<EOF_TYPES
$(awk '/^```mermaid/{want=1;next} want && /^[[:space:]]*$/{next} want && /^%%/{next} want{print $1; want=0}' "$f")
EOF_TYPES
  [ -z "$bad" ] || fail "mermaid type(s) not in the stable allowlist:$bad — use flowchart/sequenceDiagram/stateDiagram-v2/erDiagram/classDiagram/pie/gantt/timeline (docs/PICTURES.md; 'journey' is a UX chart, wrong shape for reasoning)."

  if [ "$fails" -gt 0 ]; then
    echo "ship checkbody: $fails problem(s) — the PR body is the durable record; see docs/PICTURES.md." >&2
    exit 1
  fi
  echo "ship checkbody: ✓ body passes the picture/format contract."
}

cmd_open() {
  local title="${1:-}"; shift || true
  [ -n "$title" ] || { echo "ship open: PR title required" >&2; exit 1; }
  local base="main" bodyfile="" verify=1 draft=0
  while [ $# -gt 0 ]; do case "$1" in
    --base) base="$2"; shift 2 ;;
    --body-file) bodyfile="$2"; shift 2 ;;
    --no-verify) verify=0; shift ;;
    --draft) draft=1; shift ;;   # hold-for-Eric PRs (carve-outs, open questions) — no auto-merge arm
    *) echo "ship open: unknown arg $1" >&2; exit 1 ;;
  esac; done

  # A PR description is the durable context cache (docs/LESSONS.md 2026-08-15: three PRs shipped
  # as a literal "{}" because this default was silent). No body, no PR — the drift is impossible.
  [ -n "$bodyfile" ] && [ -s "$bodyfile" ] || {
    echo "ship open: --body-file is required and must be non-empty — a PR is a document" >&2
    echo "  (human summary up top, hybrid details below the fold, optional machine context;" >&2
    echo "   see .github/pull_request_template.md)." >&2
    exit 1
  }

  local branch; branch="$(git rev-parse --abbrev-ref HEAD)"
  [ "$branch" != "$base" ] || { echo "ship: refusing to open a PR from $base into itself" >&2; exit 1; }
  git diff --quiet && git diff --cached --quiet || { echo "ship: uncommitted changes — commit first" >&2; exit 1; }

  # SHA-pin docs/shots/ raw URLs to HEAD (the commit about to be pushed — tree is clean, so HEAD
  # is exactly what ships). Branch-form URLs 404 at squash-merge; already-pinned SHAs pass through.
  local sha pinned; sha="$(git rev-parse HEAD)"; pinned="/tmp/ship-body-pinned.md"
  python3 - "$bodyfile" "$sha" > "$pinned" <<'PY'
import re, sys
body = open(sys.argv[1]).read()
sha = sys.argv[2]
def pin(m):
    return m.group(0) if re.fullmatch(r"[0-9a-f]{40}", m.group(3)) else \
        f"raw.githubusercontent.com/{m.group(1)}/{m.group(2)}/{sha}/docs/shots/"
sys.stdout.write(re.sub(r"raw\.githubusercontent\.com/([^/\s)]+)/([^/\s)]+)/([^/\s)]+)/docs/shots/", pin, body))
PY
  bodyfile="$pinned"

  # The picture/format contract — fail fast, before spending verify or a push.
  cmd_checkbody "$bodyfile"

  # Screenshot weight is permanent git history (the one irreversible cost) — budget by construction.
  if git rev-parse --verify -q "origin/$base" >/dev/null; then
    local big=""
    while IFS= read -r p; do
      if [ -n "$p" ] && [ -f "$p" ] && [ "$(wc -c <"$p")" -gt 102400 ]; then
        big="$big
  $p ($(wc -c <"$p") bytes)"
      fi
    done <<EOF_SHOTS
$(git diff --name-only "origin/$base...HEAD" -- 'docs/shots/')
EOF_SHOTS
    [ -z "$big" ] || { echo "ship: docs/shots file(s) exceed the 100KB budget (recompress via the shoot scripts):$big" >&2; exit 1; }
  fi

  if [ "$verify" = 1 ]; then
    echo "ship: local verify (parity with CI — fail fast before spending a runner)…"
    npm run verify >/tmp/ship-verify.log 2>&1 || { echo "ship: LOCAL VERIFY FAILED — not pushing."; tail -20 /tmp/ship-verify.log; exit 1; }
    echo "ship: verify green."
  fi

  # Learning-Coach preflight (docs/COACHES.md → detection lag). The incident eye rides the path we
  # already traverse — every change ships through here — so a red `main` surfaces without a cron, a
  # scheduled workflow, or a single polled request. One REST call on the core bucket, at the exact
  # moment it matters: never stack a change on a broken `main`. Advisory, not a hard stop; the point
  # is that the gap becomes IMPOSSIBLE to not see, not that shipping gets blocked.
  node scripts/incident-scan.mjs || {
    echo "ship: ^^ an unlearned incident on $base is above. Run /retro before stacking more on it."
  }

  # Digest advisory (same rides-the-path doctrine): the altitude instrument going quiet is drift
  # nobody sees — surface DUE-ness at the moment every change already passes through. Advisory only.
  node scripts/digest-scan.mjs 2>/dev/null || true

  echo "ship: pushing $branch…"
  local n=0; until git push -u origin "$branch" 2>/dev/null; do
    n=$((n+1)); [ "$n" -le 4 ] || { echo "ship: push failed after retries" >&2; exit 1; }
    sleep $((2**n)); done

  local body; body="$(cat "$bodyfile")"
  local payload; payload="$(python3 -c "import json,sys; print(json.dumps({'title':sys.argv[1],'head':sys.argv[2],'base':sys.argv[3],'body':sys.argv[4],'draft':sys.argv[5]=='1'}))" \
    "$title" "$branch" "$base" "$body" "$draft")"
  echo "ship: opening PR over REST (core bucket)…"
  local resp http body opened_hits=""; resp="$(api POST "/pulls" "$payload")"
  http="$(http_of "$resp")"; body="$(body_of "$resp")"
  if [ "$http" = 201 ]; then
    local num url; num="$(printf '%s' "$body" | json_field number)"; url="$(printf '%s' "$body" | json_field html_url)"
    echo "ship: opened PR #$num  $url"
    echo "$num"
    if [ "$draft" = 1 ]; then
      echo "ship: draft PR — hold for Eric; do NOT arm auto-merge. STOP. No polling."
    # The arming usually happens through the MCP tool, which never runs this script — so the
    # instruction printed here is the last place the envelope answer can reach the session that
    # arms. Print the REFUSAL as the next step when the diff is in the irreversible class.
    elif ! opened_hits="$(git diff --name-only "origin/$base...HEAD" | xargs -r node "$(dirname "$0")/envelope-scan.mjs" --check | python3 -c '
import sys, json
rows = json.load(sys.stdin)
hits = [r for r in rows if r.get("protected")]
for r in hits:
    print("  " + r["path"] + " — " + r.get("why", "protected"))
sys.exit(1 if hits else 0)
')"; then
      echo "ship: this diff touches the irreversible class — do NOT arm auto-merge, by ANY route."
      printf '%s\n' "$opened_hits"
      echo "ship: NEXT — say on the PR what the protected touch is, and hand #$num to Eric. STOP."
    else
      echo "ship: NEXT (per .claude/skills/ship) — one enable_pr_auto_merge MCP call (or \`scripts/ship.sh automerge $num\` when the MCP tool is unavailable), then STOP. No polling."
    fi
  else
    echo "ship: REST open returned HTTP $http (proxy may block writes). Body:" >&2
    printf '%s\n' "$body" | head -5 >&2
    echo "ship: FALL BACK to the MCP create_pull_request tool for this one call (still ~1 call, not thousands)." >&2
    exit 2
  fi
}

# checkarm — MAY auto-merge be armed on a diff touching these paths?
#
# The carve-out at the top of this file was already correct and already pointed here, and a session
# on 2026-08-26 read it, ran `envelope-scan --check`, saw `option-ticket.ts` come back protected,
# and armed anyway by reasoning from the prose class names instead of the answer it had just been
# given (docs/LESSONS.md). A rule you have to remember at the moment of arming is a rule that gets
# talked past; this is the same rule as an exit code.
# Prints one indented line per protected path; returns 1 when any was found. Never exits, so a
# caller can ASK the question without being killed by the answer.
envelope_hits() {
  node "$(dirname "$0")/envelope-scan.mjs" --check "$@" | python3 -c '
import sys, json
rows = json.load(sys.stdin)
hits = [r for r in rows if r.get("protected")]
for r in hits:
    print("  " + r["path"] + " — " + r.get("why", "protected"))
sys.exit(1 if hits else 0)
'
}

cmd_checkarm() {
  [ $# -gt 0 ] || { echo "ship checkarm: at least one changed path is required" >&2; exit 1; }
  local hits status=0
  hits="$(envelope_hits "$@")" || status=$?
  if [ "$status" -ne 0 ]; then
    echo "ship checkarm: REFUSED — this diff touches the irreversible class, which never auto-merges" >&2
    echo "  (.claude/skills/governor → merge-policy table; the list is envelope.json):" >&2
    printf '%s\n' "$hits" >&2
    echo "Open the PR, say on it what the protected touch is, and hand it to Eric." >&2
    exit 5
  fi
  echo "ship checkarm: ✓ nothing in the irreversible class — auto-merge may arm."
}

cmd_automerge() {
  local num="${1:-}"
  [ -n "$num" ] || { echo "ship automerge: PR number required" >&2; exit 1; }
  # Native auto-merge via ONE GraphQL call — the documented per-PR exception to the REST-only rule.
  # Exists so sessions WITHOUT the GitHub MCP tools (Routine-fired sessions carry no connectors)
  # can still arm walk-away merge-on-green instead of leaving PRs stalled open.
  local resp http body node
  resp="$(api GET "/pulls/$num")"; http="$(http_of "$resp")"; body="$(body_of "$resp")"
  [ "$http" = 200 ] || { echo "ship automerge: GET pull returned HTTP $http" >&2; exit 2; }
  node="$(printf '%s' "$body" | json_field node_id)"
  [ -n "$node" ] || { echo "ship automerge: no node_id on PR #$num" >&2; exit 2; }

  # Guard on the PR's OWN file list, not the local tree: this is the thing being armed, and a
  # session can be on a different branch by the time it arms.
  local fresp fhttp fbody
  fresp="$(api GET "/pulls/$num/files?per_page=100")"
  fhttp="$(http_of "$fresp")"; fbody="$(body_of "$fresp")"
  [ "$fhttp" = 200 ] || { echo "ship automerge: GET files returned HTTP $fhttp" >&2; exit 2; }
  local -a paths=()
  while IFS= read -r f; do [ -n "$f" ] && paths+=("$f"); done <<<"$(
    printf '%s' "$fbody" | python3 -c 'import sys, json; [print(f["filename"]) for f in json.load(sys.stdin)]'
  )"
  # 100 is the page size: a longer diff was truncated, so "nothing protected" would be unproven.
  # Refusing an unprovable arm is the honest failure, not a silent pass.
  if [ "${#paths[@]}" -ge 100 ]; then
    echo "ship automerge: PR #$num changes 100+ files — the envelope check cannot see them all." >&2
    echo "Split the PR, or arm it by hand after checking envelope-scan yourself." >&2
    exit 5
  fi
  cmd_checkarm "${paths[@]}"
  local q payload gql
  q='mutation($id: ID!) { enablePullRequestAutoMerge(input: {pullRequestId: $id, mergeMethod: SQUASH}) { pullRequest { number } } }'
  payload="$(python3 -c "import json,sys; print(json.dumps({'query': sys.argv[1], 'variables': {'id': sys.argv[2]}}))" "$q" "$node")"
  gql="$(curl -sS -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -H "User-Agent: skynet-ship" -d "$payload" "https://api.github.com/graphql")"
  # TWO FAILURE SHAPES, NOT ONE (2026-08-26). A GraphQL-level failure comes back as an `errors`
  # array; an HTTP-level one — a rate limit, a bad token, an abuse block — comes back as a bare
  # `{"message": ...}` with no `errors` key at all. Checking only for `errors` passed the second
  # shape straight through, so this printed "armed" over a PR that was never armed. That is the
  # same defect class as the rest of today: a check that validates the wrong artefact reports
  # success forever. Confirmed live on #659, which read `auto_merge: null` right after this said
  # it had armed it.
  if grep -q '"errors"' <<<"$gql" || grep -q '"message"' <<<"$gql"; then  # here-string: same SIGPIPE-under-pipefail trap as checkbody
    # ALREADY CLEAN IS NOT A FAILURE — it is a race we lose, and losing it silently stalled 16
    # research PRs on 2026-08-26. GitHub refuses `enablePullRequestAutoMerge` once every check has
    # passed ("Pull request is in clean status"), and `verify` on a docs-only PR finishes in ~45s.
    # Any session slower than that between opening and arming — an agent mid-turn, a lane shipping
    # a batch — arms too late, gets this error, and leaves a green PR with nothing to merge it.
    # Auto-merge means "merge it when it goes green"; already-green is that condition, met early.
    #
    # SAFE BY CONSTRUCTION: `cmd_checkarm` ran above, so a PR touching the never-auto-merge
    # carve-out has already exited 6 and never reaches this line. The fall-through can only ever
    # merge something arming was permitted for.
    if grep -qiE 'clean status|already in clean' <<<"$gql"; then
      echo "ship automerge: #$num is already green — auto-merge only takes while checks are pending, so merging directly." >&2
      cmd_merge "$num"
      return
    fi
    # THE PROXY CASE, and the reason this whole check existed to be wrong (2026-08-26). Some
    # Claude Code session types serve only a pinned set of PR-review GraphQL operations;
    # `enablePullRequestAutoMerge` is not among them, so arming from here has NEVER worked in
    # those sessions — it just said it had. Name it, so the next session reaches for the MCP tool
    # or a direct merge instead of believing this one.
    if grep -qi 'not enabled for this session\|pinned set of PR-review' <<<"$gql"; then
      echo "ship automerge: this session's GraphQL proxy does not serve enablePullRequestAutoMerge." >&2
      echo "ship automerge: #$num is NOT armed. Use the enable_pr_auto_merge MCP tool, or merge it when green (scripts/ship.sh merge $num)." >&2
      exit 3
    fi
    if grep -qi 'rate limit' <<<"$gql"; then
      echo "ship automerge: the GraphQL budget is exhausted — arming is impossible until it resets." >&2
      echo "ship automerge: #$num is NOT armed. Merge it when green (scripts/ship.sh merge $num)." >&2
      exit 3
    fi
    echo "ship automerge: arm refused (Eric web-merges):" >&2
    printf '%s\n' "$gql" | head -3 >&2
    exit 3
  fi
  # Trust the state, not the absence of an error: read the PR back and confirm GitHub actually
  # queued it. An arm that silently did nothing is how a green PR ends up with nobody to merge it.
  local check; check="$(body_of "$(api GET "/pulls/$num")" | python3 -c 'import json,sys; print("yes" if json.load(sys.stdin).get("auto_merge") else "no")')"
  if [ "$check" != "yes" ]; then
    echo "ship automerge: GitHub accepted the mutation but #$num reads back unarmed — not claiming otherwise." >&2
    echo "ship automerge: merge it when green (scripts/ship.sh merge $num)." >&2
    exit 3
  fi
  echo "ship: auto-merge (SQUASH) armed on #$num."
}

cmd_merge() {
  local num="${1:-}"; shift || true
  [ -n "$num" ] || { echo "ship merge: PR number required" >&2; exit 1; }
  local method="squash"
  while [ $# -gt 0 ]; do case "$1" in --method) method="$2"; shift 2 ;; *) shift ;; esac; done
  echo "ship: squash-merging #$num over REST (core bucket; branch protection still enforces verify)…"
  local resp http body; resp="$(api PUT "/pulls/$num/merge" "{\"merge_method\":\"$method\"}")"
  http="$(http_of "$resp")"; body="$(body_of "$resp")"
  case "$http" in
    200) echo "ship: merged #$num." ;;
    403) echo "ship: 403 — REST merge into a protected branch is refused for this session type." >&2
         echo "ship: on 'main', use native auto-merge (enable_pr_auto_merge); if GraphQL is exhausted, have Eric web-merge." >&2
         exit 4 ;;
    405|409) echo "ship: not mergeable yet (HTTP $http) — checks not green or conflict. Retry on the green webhook." >&2; exit 3 ;;
    *) echo "ship: merge returned HTTP $http:" >&2; printf '%s\n' "$body" | head -5 >&2; exit 2 ;;
  esac
}

case "${1:-}" in
  open) shift; cmd_open "$@" ;;
  merge) shift; cmd_merge "$@" ;;
  automerge) shift; cmd_automerge "$@" ;;
  checkbody) shift; cmd_checkbody "$@" ;;
  checkarm) shift; cmd_checkarm "$@" ;;
  *) echo "usage: scripts/ship.sh {open \"<title>\" [--body-file F] [--base B] [--no-verify] | merge <n> [--method squash] | automerge <n> | checkbody <body-file> | checkarm <path...>}" >&2; exit 1 ;;
esac
