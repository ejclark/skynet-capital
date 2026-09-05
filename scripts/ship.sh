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
#   scripts/ship.sh platter {open|board|ledger} …
#       batch every change that needs Eric's merge onto ONE held PR per cadence, one commit per
#       item (#1343). Full doctrine at the section header near the bottom of this file.
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
  local base="main" bodyfile="" verify=1 hold=0
  while [ $# -gt 0 ]; do case "$1" in
    --base) base="$2"; shift 2 ;;
    --body-file) bodyfile="$2"; shift 2 ;;
    --no-verify) verify=0; shift ;;
    # hold-for-Eric PRs (carve-outs, a `Needs from you` block): opened READY FOR REVIEW with
    # auto-merge left unarmed — never as a draft. A draft skips `verify` and reads as "Claude still
    # has work to do" (Eric, 2026-09-04, on #1304); the hold is the unarmed merge, not the draft bit.
    --hold) hold=1; shift ;;
    --draft) echo "ship open: --draft is gone — use --hold (ready for review, auto-merge unarmed)" >&2; exit 1 ;;
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
    # Commit-message lint, locally, before a push — not just in CI (docs/LESSONS.md, 2026-09-04:
    # eight open PRs sat red on commitlint at once, none of them caught before push, because
    # nothing in the local path ever runs the same check CI's `verify` job does). Fetch first
    # (same lesson, same day: a stale local `origin/$base` makes this check compare against the
    # wrong base and either miss a real violation or false-flag a fixed one).
    git fetch --quiet origin "$base" 2>/dev/null || true
    local merge_base=""
    git rev-parse --verify -q "origin/$base" >/dev/null && merge_base="$(git merge-base "origin/$base" HEAD)"

    # Stale-base hard stop (docs/LESSONS.md, 2026-09-04): the fetch above refreshes the REMOTE-
    # TRACKING ref, but nothing merges it into the working tree — so `npm run verify` below still
    # tests THIS branch in isolation. CI evaluates the actual PR-merge state (this branch + whatever
    # landed on $base since it was cut), which can differ: PR #1219 verified green locally while
    # main had independently grown a file the branch also touched past a line-count cap, and only
    # the merged state broke it. Catch that here, for free, before spending a push or a runner —
    # never after, in a red CI run.
    if [ -n "$merge_base" ] && ! git merge-base --is-ancestor "origin/$base" HEAD 2>/dev/null; then
      local behind; behind="$(git rev-list --count "$merge_base..origin/$base")"
      echo "ship: this branch is $behind commit(s) behind origin/$base — local verify would test a" >&2
      echo "  stale merge state that CI won't see. Merge it in first, THEN re-run ship open:" >&2
      echo "    git merge origin/$base --no-edit" >&2
      echo "  (--no-edit is load-bearing: commitlint requires Conventional-Commit format and only" >&2
      echo "   exempts git's own auto-generated 'Merge branch' message — a hand-written one fails" >&2
      echo "   the commit-msg hook. Never rebase onto \$base here; merge keeps a reviewer's existing" >&2
      echo "   checkout of this branch valid.)" >&2
      exit 1
    fi

    if [ -n "$merge_base" ]; then
      npx commitlint --from "$merge_base" --to HEAD --verbose || {
        echo "ship: COMMIT MESSAGE LINT FAILED — not pushing. Fix with 'git commit --amend' (last commit) or 'git rebase -i' (earlier one), then retry." >&2
        exit 1
      }
    fi
    echo "ship: local verify (parity with CI — fail fast before spending a runner)…"
    npm run verify >/tmp/ship-verify.log 2>&1 || { echo "ship: LOCAL VERIFY FAILED — not pushing."; tail -20 /tmp/ship-verify.log; exit 1; }
    echo "ship: verify green."
  fi

  # Worktree-freshness advisory (docs/LESSONS.md, 2026-08-30): the scans below read LIVE GitHub
  # state through LOCAL code — a worktree branched from a stale main can re-flag a false positive a
  # newer commit already fixed (found live: this session's incident-scan.mjs was missing #925's
  # phantom-run filter because the worktree's base predated it, and re-reported the fixed run as
  # UNLEARNED). One REST call, no `git fetch` — SSH is broken on Eric's machine (docs/LESSONS.md /
  # the git-push-https-workaround memory), so this checks whether the LOCAL object database already
  # has origin/main's current tip, which needs no network write and degrades silently on any error.
  local head_resp head_http head_body remote_sha
  head_resp="$(api GET "/commits/main" 2>/dev/null)" && {
    head_http="$(http_of "$head_resp")"; head_body="$(body_of "$head_resp")"
    if [ "$head_http" = 200 ]; then
      remote_sha="$(printf '%s' "$head_body" | json_field sha)"
      if [ -n "$remote_sha" ] && ! git cat-file -e "$remote_sha" 2>/dev/null; then
        echo "ship: this worktree doesn't have origin/main's current tip ($remote_sha) — it's stale."
        echo "  the advisories below run LOCAL script code against LIVE GitHub data; a detection fix"
        echo "  merged since this worktree's base won't apply here and can re-surface old false positives."
      fi
    fi
  }

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

  # Plan-closure advisory (docs/LESSONS.md, 2026-08-30): catches a final slice shipping without
  # `Closes #N`, which left #928 and #885 open long after they were done. Advisory only — most
  # slices of a multi-slice plan should NOT close the issue yet.
  node scripts/plan-closure-scan.mjs "$branch" "$bodyfile" 2>/dev/null || true

  # Test-quality advisory (Eric, 2026-08-30: tests as acceptance criteria): flags a new spec
  # asserting on call counts or spying on internals — docs/ENGINEERING.md's BDD rule already
  # forbids it, this just makes drift back into it visible. Advisory only — a real system boundary
  # can be a legitimate exception a script can't judge.
  node scripts/test-quality-scan.mjs "$branch" --base "$base" 2>/dev/null || true

  # Braces are load-bearing: stock macOS bash (3.2) reads the ellipsis bytes as identifier
  # characters, so a bare $branch… is the undefined variable "branch…" and set -u kills the run
  # right before the push. Brace any variable followed by a non-ASCII character in this file.
  echo "ship: pushing ${branch}…"
  local n=0; until git push -u origin "$branch" 2>/dev/null; do
    n=$((n+1)); [ "$n" -le 4 ] || { echo "ship: push failed after retries" >&2; exit 1; }
    sleep $((2**n)); done

  local body; body="$(cat "$bodyfile")"
  # draft is always false: a draft PR skips `verify` and can't auto-merge (docs/LESSONS.md 2026-08-14).
  local payload; payload="$(python3 -c "import json,sys; print(json.dumps({'title':sys.argv[1],'head':sys.argv[2],'base':sys.argv[3],'body':sys.argv[4],'draft':False}))" \
    "$title" "$branch" "$base" "$body")"
  echo "ship: opening PR over REST (core bucket)…"
  local resp http body opened_hits=""; resp="$(api POST "/pulls" "$payload")"
  http="$(http_of "$resp")"; body="$(body_of "$resp")"
  if [ "$http" = 201 ]; then
    local num url; num="$(printf '%s' "$body" | json_field number)"; url="$(printf '%s' "$body" | json_field html_url)"
    echo "ship: opened PR #$num  $url"
    echo "$num"
    if [ "$hold" = 1 ]; then
      # A hold has to be ENUMERABLE, not merely true. `--hold` used to set a local flag and print a
      # line, so nothing recorded WHICH PRs were waiting on Eric: on 2026-09-04 the `hold-merge`
      # label sat on two closed diagnostic PRs and on none of the seven real held changes that
      # landed that day (#1343). You cannot batch what you cannot list. The label is also the one
      # hold signal pipeline.yml's arm job can act on, so applying it here closes both gaps at once.
      local lresp lhttp
      lresp="$(api POST "/issues/$num/labels" '{"labels":["hold-merge"]}')"
      lhttp="$(http_of "$lresp")"
      if [ "$lhttp" = 200 ]; then
        echo "ship: labelled #$num hold-merge — it now enumerates as waiting on Eric."
      else
        echo "ship: could NOT label #$num hold-merge (HTTP $lhttp) — apply it by hand or the hold is invisible." >&2
      fi
      echo "ship: held for Eric (ready for review, auto-merge unarmed) — do NOT arm. STOP. No polling."
    # The arming usually happens through the MCP tool, which never runs this script — so the
    # instruction printed here is the last place the envelope answer can reach the session that
    # arms. Print the REFUSAL as the next step when the diff is in the irreversible class.
    elif ! opened_hits="$(git diff --name-only "origin/$base...HEAD" | xargs -r node "$(dirname "$0")/envelope-scan.mjs" --check --base "origin/$base" | python3 -c '
import sys, json
rows = json.load(sys.stdin)
hits = [r for r in rows if r.get("blocking")]
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
#
# Filters on `blocking`, not `protected`: a diffAware rule (envelope.json $diffAwareComment) whose
# real diff is a provably safe pure insertion comes back protected=true but blocking=false, and
# should arm. Pass --base <ref> (paths before it) to get that real-diff answer; without --base,
# `blocking` just mirrors `protected` (today's behavior — used by the bare `checkarm <paths>` CLI
# form, which has no base to diff against).
envelope_hits() {
  node "$(dirname "$0")/envelope-scan.mjs" --check "$@" | python3 -c '
import sys, json
rows = json.load(sys.stdin)
hits = [r for r in rows if r.get("blocking")]
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
  local base_ref; base_ref="$(printf '%s' "$body" | python3 -c 'import sys,json; print(json.load(sys.stdin)["base"]["ref"])')"
  git fetch origin "$base_ref" >/dev/null 2>&1 || true

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
  cmd_checkarm "${paths[@]}" --base "origin/$base_ref"
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

# ── the platter — one held PR per cadence, not one per protected change (#1343) ────────────────
#
# The irreversible class never auto-merges and that boundary does not move; what moves is the cost
# of clearing it. On 2026-09-04 seven protected-path changes landed as seven separate hand-merges
# in one day — a cost that scales with lane throughput, not with risk. The platter batches them:
# one branch, one held PR, ONE COMMIT PER ITEM, merged with a merge commit so `git revert <item
# sha>` still drops a single item alone. Eric reads the ledger, not N diffs (Eric, 2026-09-04:
# "10 PRs consolidated into 1 or a few PRs result in fewer touch points... the items are details").
#
#   scripts/ship.sh platter open <item-branch> [--name platter/<date>] [--subject S] [--no-verify]
#   scripts/ship.sh platter board <item-branch> [--subject S] [--no-verify]
#   scripts/ship.sh platter ledger [--base <ref>] [--body]
#
# Four rules that are load-bearing, not preferences:
#   - NOTHING RED BOARDS. `board` runs `npm run verify` on the POST-board tree — the union so far,
#     which is strictly stronger than "green alone on its own branch", and is the only proof that
#     can exist here: pipeline.yml's `verify` triggers on `pull_request: branches: [main]`, so a PR
#     based on a platter branch runs no CI at all. The platter PR (base `main`) is the union's
#     first CI run. A failed verify un-boards the item and leaves the platter exactly as it was.
#   - THE PLATTER IS NEVER A PLACE TO DEVELOP. A conflicting item catches up to `main` on its OWN
#     branch and re-boards; nothing is ever fixed here (Rust's rollup procedure, same reasoning).
#   - IT IS NEVER ARMED. `--hold` applies `hold-merge` (which pipeline.yml's arm job skips) and the
#     diff is protected by construction (which `checkarm` refuses) — unarmed by two mechanisms.
#   - NO SAME-FILE FENCE. Feast mode's "two items must not touch the same file" comes from PARALLEL
#     athletes; the platter boards sequentially onto one integration branch, so same-file items are
#     fine in order — a conflict is just an item that needs to catch up first.

# Protected paths among the file names on stdin, space-separated (empty when none). The path-level
# answer on purpose: envelope-scan's --base mode diffs the CHECKED-OUT HEAD, and the ledger column
# is describing the ITEM, not the platter it landed on.
platter_protected() {
  local names; names="$(cat)"
  [ -n "$names" ] || return 0
  printf '%s\n' "$names" | xargs -r node "$(dirname "$0")/envelope-scan.mjs" --check | python3 -c '
import sys, json
print(" ".join(r["path"] for r in json.load(sys.stdin) if r.get("protected")))
'
}

# The ledger is a PURE FUNCTION of `git log <base>..HEAD` — never a file anyone edits, so it cannot
# drift from what is actually boarded. Each item commit carries its own row as trailers.
PLATTER_BASE="origin/main"

cmd_platter_ledger() {
  local body=0
  while [ $# -gt 0 ]; do case "$1" in
    --base) PLATTER_BASE="$2"; shift 2 ;;
    # --body prints the whole PR body the platter posts, not just the table — so the format contract
    # can be exercised end to end (`ship platter ledger --body … | ship checkbody -`) instead of a
    # spec re-typing the template and drifting from it.
    --body) body=1; shift ;;
    *) echo "ship platter ledger: unknown arg $1" >&2; exit 1 ;;
  esac; done
  if [ "$body" = 1 ]; then platter_body; else platter_ledger_table; fi
}

platter_ledger_table() {
  git log --reverse --format="%H%x00%s%x00%b%x1e" "$PLATTER_BASE..HEAD" | python3 -c '
import sys

def cell(text):
    return text.replace("|", "\\|").strip()

rows = []
for record in sys.stdin.read().split("\x1e"):
    if not record.strip():
        continue
    parts = (record.strip("\n").split("\x00") + ["", ""])[:3]
    sha, subject, body = parts
    trailers, paths = {}, []
    for line in body.splitlines():
        key, _, value = line.partition(":")
        key, value = key.strip(), value.strip()
        if key == "Platter-Paths":
            paths.append(value)
        elif key.startswith("Platter-"):
            trailers[key] = value
    touched = [p for p in paths if p and p != "none"]
    evidence = trailers.get("Platter-Verify", "—")
    if touched:
        evidence += " · " + " ".join("`%s`" % p for p in touched)
    rows.append("| %d | `%s` | %s | %s | `%s` |" % (
        len(rows) + 1, cell(trailers.get("Platter-Item", "—")),
        cell(subject), cell(evidence), sha[:7]))

print("| # | item | why | verify evidence | revert |")
print("|---|---|---|---|---|")
print("\n".join(rows) if rows else "| — | _nothing boarded yet_ | — | — | — |")
'
}

# The PR body: ledger as the picture (docs/PICTURES.md prescribes a table for exactly this shape),
# then the three things Eric needs to know to land it. Regenerated from git on every board.
platter_body() {
  cat <<EOF
## The picture

$(platter_ledger_table)

_Caption — the platter ledger, read from the boarded commits: each item, the evidence it was green, and the sha that reverts it alone._

## Summary

- One merge clears every protected-path change below; the boundary does not move, only its cost.
- **Merge with "Create a merge commit", never squash** — one commit per item is what keeps revert granular.
- Each item was verified green on the union as it boarded; this PR is that union's first CI run.

<details>
<summary><strong>How to land this, and how to drop one bad item</strong></summary>

**Landing.** Use GitHub's **Create a merge commit** button. Squashing still lands the same tree, but
it collapses the items into one commit and the per-item revert below is lost — the platter would
then only revert as a whole. The repo's settings already put this PR's title and body (this ledger)
on the merge commit, so \`main\`'s first-parent history reads as PRs and \`git log main\` reads as items.

**Dropping one item after the merge.** \`git revert <revert sha>\` from the table — no \`-m\`, because
each item is an ordinary single-parent commit. An item a later item builds on may conflict; that is
the honest limit of any ordered batch, not a defect of this one.

**Dropping one item before the merge.** Re-open the platter without it (\`ship platter open\` on a new
name, then \`board\` the survivors in order). Nothing is ever fixed on the platter itself.

**What boards.** Any change to an \`envelope.json\`-protected path that is already green. An item
ships alone instead — today's one-held-PR-per-change path — only when it is *hot*: \`scripts/incident-scan.mjs\`
names an unlearned incident it fixes, or a deploy is blocked on it. Otherwise it waits for the cadence.

**Cadence.** The platter ships when \`node scripts/digest-scan.mjs --due\` says a digest is due (5
landed commits or the 7-day heartbeat) — the count Eric cannot predict, the time he can.

</details>
EOF
}

# board one item onto the checked-out platter. Shared by `open` (the first item) and `board`.
platter_board_item() {
  local item="$1" subject="$2" verify="$3"
  git diff --quiet && git diff --cached --quiet || {
    echo "ship platter: uncommitted changes — commit or drop them before boarding" >&2; exit 1; }
  git fetch --quiet origin "$item" || {
    echo "ship platter: cannot fetch origin/$item — push the item branch first" >&2; exit 1; }

  local before item_sha; before="$(git rev-parse HEAD)"; item_sha="$(git rev-parse FETCH_HEAD)"
  # Default to the item's newest subject; --subject overrides, which is what a multi-commit item
  # branch wants (a squash has no subject of its own, and the newest one can under-describe it).
  [ -n "$subject" ] || subject="$(git log -1 --format=%s FETCH_HEAD)"
  printf '%s\n' "$subject" | npx commitlint || {
    echo "ship platter: the item subject above is not a valid Conventional Commit — pass --subject." >&2
    exit 1; }

  git merge --squash FETCH_HEAD || {
    git merge --abort >/dev/null 2>&1 || git reset --hard --quiet "$before"
    echo "ship platter: $item conflicts with the platter — the platter is unchanged." >&2
    echo "  Catch the item up on ITS OWN branch (git merge origin/main --no-edit), then re-board." >&2
    exit 1; }
  git diff --cached --quiet && {
    git reset --hard --quiet "$before"
    echo "ship platter: $item adds nothing — already boarded, or already on main." >&2; exit 1; }

  local evidence
  if [ "$verify" = 1 ]; then
    echo "ship platter: verifying the union with $item boarded…"
    npm run verify >/tmp/ship-platter-verify.log 2>&1 || {
      git reset --hard --quiet "$before"
      echo "ship platter: VERIFY FAILED with $item boarded — un-boarded it; the platter is unchanged." >&2
      tail -20 /tmp/ship-platter-verify.log >&2
      exit 1; }
    evidence="verify green $(date -u +%Y-%m-%dT%H:%MZ)"
  else
    evidence="verify skipped (--no-verify)"
  fi

  local touched msg p; touched="$(git diff --cached --name-only | platter_protected)"
  msg="/tmp/ship-platter-msg.txt"
  # One trailer line per path: commitlint's body/footer line cap is 100 chars, and a single joined
  # list of touched paths blows through it on any real platter.
  {
    printf '%s\n\n' "$subject"
    printf 'Platter-Item: %s\n' "$item"
    printf 'Platter-Sha: %s\n' "$(printf '%s' "$item_sha" | cut -c1-12)"
    printf 'Platter-Verify: %s\n' "$evidence"
    if [ -n "$touched" ]; then
      for p in $touched; do printf 'Platter-Paths: %s\n' "$p"; done
    else
      printf 'Platter-Paths: none\n'
    fi
  } > "$msg"
  git commit --quiet -F "$msg"
  echo "ship platter: boarded $item as $(git rev-parse --short HEAD) — $subject"
}

# Refresh the open platter PR's ledger. Best-effort by design: the commit is already made and
# pushed, so a failed PATCH is a stale body to fix by hand, never a lost item.
platter_sync_body() {
  local branch="$1" owner resp http body num newbody payload
  owner="$(repo)"; owner="${owner%%/*}"
  resp="$(api GET "/pulls?state=open&head=$owner:$branch")"
  http="$(http_of "$resp")"; body="$(body_of "$resp")"
  if [ "$http" != 200 ]; then
    echo "ship platter: GET pulls returned HTTP $http — refresh the ledger by hand." >&2; return 0
  fi
  num="$(printf '%s' "$body" | python3 -c 'import sys,json; r=json.load(sys.stdin); print(r[0]["number"] if r else "")')"
  if [ -z "$num" ]; then
    echo "ship platter: no open PR for $branch — open one with 'ship platter open'." >&2; return 0
  fi
  newbody="$(platter_body)"
  payload="$(python3 -c "import json,sys; print(json.dumps({'body': sys.argv[1]}))" "$newbody")"
  resp="$(api PATCH "/pulls/$num" "$payload")"; http="$(http_of "$resp")"
  if [ "$http" = 200 ]; then
    echo "ship platter: ledger refreshed on #$num."
  else
    echo "ship platter: PATCH body returned HTTP $http — refresh #$num's ledger by hand." >&2
  fi
}

cmd_platter_open() {
  local item="${1:-}"; shift || true
  [ -n "$item" ] || {
    echo "ship platter open: an item branch is required — a PR cannot open on an empty diff" >&2; exit 1; }
  local name="" subject="" verify=1
  while [ $# -gt 0 ]; do case "$1" in
    --name) name="$2"; shift 2 ;;
    --subject) subject="$2"; shift 2 ;;
    --no-verify) verify=0; shift ;;
    *) echo "ship platter open: unknown arg $1" >&2; exit 1 ;;
  esac; done
  [ -n "$name" ] || name="platter/$(date -u +%Y-%m-%d)"
  case "$name" in platter/*) ;; *)
    echo "ship platter open: --name must start with 'platter/' — the branch name is how the platter is found" >&2
    exit 1 ;;
  esac

  git diff --quiet && git diff --cached --quiet || { echo "ship platter: uncommitted changes — commit first" >&2; exit 1; }
  git fetch --quiet origin main
  git checkout -q -B "$name" origin/main
  platter_board_item "$item" "$subject" "$verify"

  local bodyfile="/tmp/ship-platter-body.md"
  platter_body > "$bodyfile"
  # --no-verify here is not a skipped check: platter_board_item already ran the same `npm run
  # verify` on this exact tree and linted the subject, and cmd_open's stale-base guard is satisfied
  # by construction (this branch was cut from a freshly fetched origin/main seconds ago).
  cmd_open "chore(platter): protected-path changes — ${name#platter/}" \
    --body-file "$bodyfile" --hold --no-verify
}

cmd_platter_board() {
  local item="${1:-}"; shift || true
  [ -n "$item" ] || { echo "ship platter board: an item branch is required" >&2; exit 1; }
  local subject="" verify=1
  while [ $# -gt 0 ]; do case "$1" in
    --subject) subject="$2"; shift 2 ;;
    --no-verify) verify=0; shift ;;
    *) echo "ship platter board: unknown arg $1" >&2; exit 1 ;;
  esac; done

  local branch; branch="$(git rev-parse --abbrev-ref HEAD)"
  case "$branch" in platter/*) ;; *)
    echo "ship platter board: HEAD is '$branch', not a platter branch — check out the open platter first." >&2
    exit 1 ;;
  esac
  platter_board_item "$item" "$subject" "$verify"
  echo "ship platter: pushing ${branch}…"
  git push -u origin "$branch"
  platter_sync_body "$branch"
}

cmd_platter() {
  local sub="${1:-}"; shift || true
  case "$sub" in
    open) cmd_platter_open "$@" ;;
    board) cmd_platter_board "$@" ;;
    ledger) cmd_platter_ledger "$@" ;;
    *) echo "usage: scripts/ship.sh platter {open <item-branch> [--name platter/<date>] [--subject S] [--no-verify] | board <item-branch> [--subject S] [--no-verify] | ledger [--base <ref>] [--body]}" >&2; exit 1 ;;
  esac
}

case "${1:-}" in
  open) shift; cmd_open "$@" ;;
  merge) shift; cmd_merge "$@" ;;
  automerge) shift; cmd_automerge "$@" ;;
  checkbody) shift; cmd_checkbody "$@" ;;
  checkarm) shift; cmd_checkarm "$@" ;;
  platter) shift; cmd_platter "$@" ;;
  *) echo "usage: scripts/ship.sh {open \"<title>\" [--body-file F] [--base B] [--no-verify] | merge <n> [--method squash] | automerge <n> | checkbody <body-file> | checkarm <path...> | platter {open|board|ledger} ...}" >&2; exit 1 ;;
esac
