#!/usr/bin/env bash
set -euo pipefail

# ship.sh — land a branch as a PR the cheap way. The resource doctrine, in code.
#
# Every step runs either on THIS machine (git) or on the plentiful REST *core* bucket
# (15k/hr) — never the scarce GraphQL bucket (5k/hr) that the GitHub MCP spends by the
# thousands, and NEVER by polling. The completion signal is the merge webhook — the
# `pull_request.closed` event (`outcome: merged`) that subscribe_pr_activity pushes into the
# session — not a status loop. The spirit kept (#5193): no scarce-bucket calls and no model
# turns spent waiting. Where no event path exists, the one fallback is a single backgrounded
# REST `until` loop on `pulls/<n>` (CONTRIBUTING.md), never a subcommand here. A script is a one-time build cost, then ~free per run forever; that is the
# self-healing flywheel (docs/COACHES.md → "Resource cost is a fitness dimension").
#
#   scripts/ship.sh open "<pr title>" [--body-file F] [--base B] [--no-verify] [--no-merge]
#       merge origin/B in if the branch is behind (--no-merge refuses instead) → verify locally
#       (fail fast) → incident preflight → push → open a PR over REST (core bucket). Prints the
#       PR number + URL, then STOP. Do NOT arm auto-merge by hand: pipeline.yml's `arm auto-merge`
#       job arms it once verify AND integration tests pass (#4094). `ship automerge` is only the
#       fallback for a PR that job can't reach, and it refuses until integration tests passed.
#
#   scripts/ship.sh platter {open|board|ledger|landed|revert} …
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

# gh-keyring fallback last, so a session never needs to wrap every call in
# `GH_TOKEN="$(gh auth token)" …` — that env-assignment prefix makes the whole command unparsable
# to the permission matcher, which cost a human approval tap per ship (Eric, 2026-09-10: "stop
# asking for permission of trivial tasks like this").
TOKEN="${GH_TOKEN:-${GITHUB_TOKEN:-$(gh auth token 2>/dev/null || true)}}"
# Asked for by the commands that call GitHub, never at load: a check up here stopped the pure ones
# too, so a spec shelling out to `checkbody` passed on a laptop with a gh login and failed on CI
# (#6440, red for 39h). In the dispatch, not in api(): api() runs inside $(...), where exit only
# leaves the subshell.
need_token() {
  [ -n "$TOKEN" ] || { echo "ship: no GH_TOKEN/GITHUB_TOKEN in env and no gh login" >&2; exit 1; }
}
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
# The JSON goes to curl on stdin, never as an argument: Linux caps one argv string at 128 KiB, and
# a platter ledger (~122 KB on #5852) died at curl's `-d` argument with "Argument list too long"
# (#6212). The same cap is why every payload builder below reads its body from stdin, not sys.argv.
api() {
  local args=(-sS -X "$1" -w '\n__SHIP_HTTP__%{http_code}'
    -H "Authorization: Bearer $TOKEN"
    -H "Accept: application/vnd.github+json"
    -H "X-GitHub-Api-Version: 2022-11-28"
    -H "User-Agent: skynet-ship")
  if [ -n "${3:-}" ]; then
    printf '%s' "$3" | curl "${args[@]}" -H "Content-Type: application/json" --data-binary @- \
      "$API/repos/$(repo)$2"
  else
    curl "${args[@]}" "$API/repos/$(repo)$2"
  fi
}
http_of() { printf '%s' "${1##*__SHIP_HTTP__}"; }              # code from an api() result
body_of() { printf '%s' "${1%$'\n'__SHIP_HTTP__*}"; }         # body from an api() result
json_field() { python3 -c "import sys,json; print(json.load(sys.stdin).get('$1',''))"; }

# Draft → ready for PR $1 (GraphQL node id $2); 0 only when GitHub confirms it is no longer a draft.
# REST has no ready-for-review endpoint, so GraphQL goes first — but a Claude Code cloud session's
# proxy refuses GraphQL outright and serves the same transition at a session-only REST route. The
# first live `--hold` (the 2026-09-25 platter, #3738) labelled its PR and then stranded it as a
# draft because only GraphQL was tried (docs/LESSONS.md). Each path is judged by its own answer.
promote_ready() {
  local rq rpayload rgql rresp
  rq='mutation($id: ID!) { markPullRequestReadyForReview(input: {pullRequestId: $id}) { pullRequest { number isDraft } } }'
  rpayload="$(python3 -c "import json,sys; print(json.dumps({'query': sys.argv[1], 'variables': {'id': sys.argv[2]}}))" "$rq" "$2")"
  rgql="$(curl -sS -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -H "User-Agent: skynet-ship" -d "$rpayload" "https://api.github.com/graphql")"
  grep -q '"isDraft":false' <<<"$rgql" && return 0
  rresp="$(api POST "/pulls/$1/ccr/ready_for_review")"
  [ "$(http_of "$rresp")" = 200 ] && grep -q '"draft":false' <<<"$(body_of "$rresp")"
}

# push — `git push -u origin <branch>` with retries for a network blip, and the remote's own words
# when it fails. The loop used to send stderr to /dev/null, so a lane push GitHub refused for want
# of the `workflows` permission printed only "push failed after retries" — and the cause took a
# second, manual push to read (#4495, ~5 min per failure). Now the last attempt's stderr is
# printed with any `x-access-token:<token>@` masked (a lane's origin URL carries the App token,
# and git echoes it on some errors). A rejection the remote actually answered (`[rejected]` /
# `[remote rejected]`) is final: retrying cannot change the answer, so it stops at once. So is a
# `pre-push:` line, our own hook saying no (a red or unfinished verify, a merged branch): to git it is
# a failure like a dropped connection, and each retry ran the hook again, a whole verify each time
# on a red tree (#6668). Its exit 75 (no verify result) passes through for the caller.
cmd_push() {
  local branch="${1:?usage: scripts/ship.sh push <branch>}" n=0 err refusal
  # stderr is captured for the diagnosis; stdout (fd 3) still reaches the terminal as before.
  until { err="$(git push -u origin "$branch" 2>&1 >&3)"; } 3>&1; do
    n=$((n+1))
    if refusal="$(grep -m1 '^pre-push: ' <<<"$err")"; then
      echo "ship: push stopped — the pre-push hook refused, and pushing again would only run it again:" >&2
      tail -25 <<<"$err" | sed 's#^#  #' >&2
      case "$refusal" in *"exit 75"*) exit 75 ;; *) exit 1 ;; esac
    fi
    if grep -q '\[\(remote \)\{0,1\}rejected\]' <<<"$err" || [ "$n" -gt 4 ]; then
      echo "ship: push failed — the remote said:" >&2
      sed -E 's#x-access-token:[^@[:space:]]*@#x-access-token:***@#g; s#^#  #' <<<"$err" >&2
      if grep -q 'without `\{0,1\}workflows`\{0,1\} permission' <<<"$err"; then
        echo "ship: this credential lacks the \`workflows\` permission, which pushing a .github/workflows/** change needs." >&2
        echo "  Push with a token that has it (a lane's App token does — the #5594 checkout); retrying will not help." >&2
      fi
      exit 1
    fi
    sleep $((2**n))
  done
}

# checkverify — is the head's latest `verify` check a REAL run? A pure verdict over a check-runs
# JSON document on stdin (GET /commits/<sha>/check-runs), so the spec pins it with no network.
# Prints one word: real (success/failure/…), pending (queued/in progress), stale (latest is
# skipped or cancelled), none (no verify check yet). "Latest" is the highest id — the order GitHub
# created them in, which is the order branch protection reads.
# The failed step and the failing check of a verify log, as two JSON string fields for the row
# scripts/agent-meter.mjs reads (#6470). The step is run-p's `ERROR: "<name>" exited with` line.
# The error is read only from a tool's own failure report, never from the first `Error:` anywhere:
# a passing spec prints `Warning: … Error: disk full` on purpose, and that line once stood in for
# a stale-pages failure (#6677). Three readers, the failed step's own first:
#   rstest — ` FAIL  <spec> > <test>` (its failing-tests summary) or `### [F01] <spec> :: <test>`
#            (the report it prints under an agent), both as `FAIL <spec> > <test>`;
#   tsc    — `<file>(l,c): error TS<n>: …`, which it prints only when it fails;
#   biome  — a diagnostic header whose next mark is `×` (an error), not `!` (a warning).
# No reader matching leaves the field empty — an honest blank, not a guess. Quotes, backslashes and
# control characters are dropped so the row stays one JSON line.
verify_fail_rstest() {
  sed 's/\x1b\[[0-9;]*m//g' "$1" 2>/dev/null | awk '
    /^ FAIL  [^ ]/ { sub(/^ FAIL +/, ""); sub(/ +$/, ""); print "FAIL " $0; exit }
    /^### \[F[0-9]+\] [^ ]/ { sub(/^### \[F[0-9]+\] /, ""); sub(/ :: /, " > "); print "FAIL " $0; exit }'
}
verify_fail_tsc() {
  grep -m1 -E '^([^ ]+\([0-9]+,[0-9]+\): |[^ ]+:[0-9]+:[0-9]+ - )?error TS[0-9]+:' "$1" 2>/dev/null || true
}
verify_fail_biome() {
  sed 's/\x1b\[[0-9;]*m//g' "$1" 2>/dev/null | awk '
    /^[^ ]+ [a-z][^ ]*.*━/ { head = $0; sub(/ +(FIXABLE +)?━.*$/, "", head); next }
    /^  × / && head != "" { print head; exit }
    /^  ! / { head = "" }'
}
verify_row_fields() {
  local log="$1" step err="" kind
  # Under set -e, a grep with no match would abort the ship; an empty field is the honest answer.
  step=$(grep -m1 -o 'ERROR: "[^"]*" exited with' "$log" 2>/dev/null | sed 's/ERROR: "\([^"]*\)".*/\1/' || true)
  case "$step" in
    typecheck*) set -- tsc rstest biome ;;
    lint*) set -- biome tsc rstest ;;
    *) set -- rstest tsc biome ;;
  esac
  for kind in "$@"; do
    [ -n "$err" ] || err=$("verify_fail_$kind" "$log")
  done
  err=$(printf '%s' "$err" | sed 's/\x1b\[[0-9;]*m//g' | tr -d '"\\' | tr -d '\000-\037' | cut -c1-160)
  printf '"step":"%s","error":"%s"' "$step" "$err"
}

cmd_checkverify() {
  python3 -c '
import sys, json
runs = [r for r in json.load(sys.stdin).get("check_runs", []) if r.get("name") == "verify"]
if not runs:
    print("none"); sys.exit(0)
latest = max(runs, key=lambda r: r.get("id", 0))
if latest.get("status") != "completed":
    print("pending")
elif latest.get("conclusion") in ("skipped", "cancelled"):
    print("stale")
else:
    print("real")
'
}

# A held PR's verify can end as a skipped check read as a PASS (#4168). `open --hold` fires
# `opened` (draft) and `ready_for_review` about a second apart, both in one cancel-in-progress
# concurrency group; on #4166 the draft run was created second and cancelled the real verify,
# leaving its own skipped verify as the latest word — the #322 hole, on every held PR. The root
# fix is a per-draft concurrency group in pipeline.yml (Eric's to merge); this is the in-envelope
# net: ONE delayed read (not a poll) once both runs have registered, and if the latest verify is
# skipped/cancelled/absent, an `edited` event (a body marker — an unchanged PATCH fires nothing)
# starts a real run. The event carries hold-merge, so the arm job still skips it.
reverify_held() {
  local num="$1" sha="$2" body="$3" wait="${SHIP_REVERIFY_WAIT:-20}" cresp verdict
  sleep "$wait"
  cresp="$(api GET "/commits/$sha/check-runs?check_name=verify&filter=all&per_page=100")"
  if [ "$(http_of "$cresp")" != 200 ]; then
    echo "ship: could not read #$num's verify check (HTTP $(http_of "$cresp")) — check it is a real run, not skipped (#4168)." >&2
    return 0
  fi
  verdict="$(body_of "$cresp" | cmd_checkverify)"
  case "$verdict" in
    real|pending) echo "ship: #$num's latest verify is a real run ($verdict)." ;;
    *)
      local marker='<!-- ship: re-verify, the draft run left verify skipped (#4168) -->' patch presp
      patch="$(printf '%s' "$body" | python3 -c "import json,sys; print(json.dumps({'body': sys.stdin.read() + '\n\n' + sys.argv[1]}))" "$marker")"
      presp="$(api PATCH "/pulls/$num" "$patch")"
      if [ "$(http_of "$presp")" = 200 ]; then
        echo "ship: #$num's latest verify was $verdict (a late draft run cancelled it) — fired an edited event so a real verify runs (#4168)."
      else
        echo "ship: #$num's latest verify is $verdict and the re-trigger PATCH failed (HTTP $(http_of "$presp")) — edit the PR body by hand to re-run verify; skipped reads as a PASS (#4168)." >&2
      fi ;;
  esac
}

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

  # 4. Every mermaid block must PARSE under the Mermaid version github.com renders (11.17.2 on
  #    2026-09-25) — a syntax error renders as the PR's OPENING FRAME. scripts/mermaid-lint.mjs is
  #    the one parser, pinned to GitHub's version; it replaced a type-only allowlist that admitted
  #    "this checks the diagram TYPE, not full syntax" and kept out every richer type GitHub has
  #    drawn for years (gitGraph, quadrantChart, C4…). Notes (advisory) print to stdout and are
  #    ignored here; problems come back on stderr and fail the body.
  local mm
  if ! mm="$(node scripts/mermaid-lint.mjs "$f" 2>&1 >/dev/null)"; then
    fail "a mermaid block will not render on GitHub (docs/PICTURES.md):
$mm"
  fi

  # 5. A closing keyword closes its issue on merge WHEREVER it sits (#4509): #4496's Follow-ups
  #    bullet "#4315 — … Closes #3811." described a LATER PR and closed live plan #3811 mid-flight.
  #    The house format already says where intent lives — `Closes #N` / `Part of #N` in a Summary
  #    bullet — so a keyword anywhere else, or one contradicting a `Part of`, fails. Fenced blocks
  #    and inline code are skipped (GitHub links neither), so a body can still quote the syntax.
  local kw='\b(close[sd]?|fix(e[sd])?|resolve[sd]?):?[[:space:]]+([[:alnum:]_.-]+/[[:alnum:]_.-]+)?#[0-9]+'
  local prose; prose="$(awk '
    /^[[:space:]]*```/ { fence = !fence; next }
    fence { next }
    /^## Summary/ { sum = 1; next }
    /^## |^<details>/ { sum = 0 }
    { gsub(/`[^`]*`/, ""); print (sum ? "S" : "O") NR ": " $0 }' "$f")"
  local stray; stray="$(grep -iE "^O[0-9]+: .*$kw" <<<"$prose" | head -3 | sed -E 's/^O/line /' || true)"
  [ -z "$stray" ] || fail "closing keyword outside the Summary — GitHub closes that issue on merge wherever it sits. Move it to a Summary bullet if this PR finishes it; otherwise reword (\"finishes\", \"will close\"):
$stray"
  local closed partof both=""
  closed="$(grep -E '^S' <<<"$prose" | grep -oiE "$kw" | grep -oE '#[0-9]+' | sort -u || true)"
  partof="$(grep -oiE 'part of:?[[:space:]]+#[0-9]+' <<<"$prose" | grep -oE '#[0-9]+' | sort -u || true)"
  [ -z "$closed" ] || [ -z "$partof" ] || both="$(comm -12 <(echo "$closed") <(echo "$partof") || true)"
  [ -z "$both" ] || fail "an issue is both 'Part of' and closed by this PR — the closing keyword wins on merge. Keep one: $(echo $both)"

  if [ "$fails" -gt 0 ]; then
    echo "ship checkbody: $fails problem(s) — the PR body is the durable record; see docs/PICTURES.md." >&2
    exit 1
  fi
  echo "ship checkbody: ✓ body passes the picture/format contract."
}

# pinshots <bodyfile> <sha> — print the body with every docs/shots/ raw URL pinned to <sha>.
# The ref is everything between owner/repo/ and /docs/shots/ (non-greedy, no whitespace/quotes),
# so slashed branches (feat/x) pin too — a one-segment ref group missed them (#4193). Refs that
# are already a 40-hex SHA pass through untouched. Pure (no git), so the spec drives it directly.
cmd_pinshots() {
  python3 - "$1" "$2" <<'PY'
import re, sys
body = open(sys.argv[1]).read()
sha = sys.argv[2]
def pin(m):
    return m.group(0) if re.fullmatch(r"[0-9a-f]{40}", m.group(3)) else \
        f"raw.githubusercontent.com/{m.group(1)}/{m.group(2)}/{sha}/docs/shots/"
sys.stdout.write(re.sub(
    r"raw\.githubusercontent\.com/([^/\s)]+)/([^/\s)]+)/([^\s)\"'<>]+?)/docs/shots/", pin, body))
PY
}

# visual_hint <pr> <base> — the way back from a red first run, said before it happens
# (2026-10-10, docs/LESSONS.md: #5079 and #5080 both went red on their first CI run). Baselines are
# Linux-only, so the local e2e above is skipped off Linux and a visual PR meets its new pictures
# first in CI; the re-baseline is one command, not six manual steps. Here-string, not a pipe: the
# SIGPIPE-under-pipefail trap (see checkbody) would silently swallow the line.
visual_hint() {
  [ "$(uname -s)" != "Linux" ] || return 0
  grep -qE '^(app/src|e2e)/' <<<"$(git diff --name-only "origin/$2...HEAD" 2>/dev/null)" || return 0
  echo "ship: visual change: CI's first run may fail on Linux-only screenshots — after it does, run \`node scripts/rebaseline-from-ci.mjs $1\`, read each diff, then \`--apply --commit\`"
}

cmd_open() {
  local title="${1:-}"; shift || true
  [ -n "$title" ] || { echo "ship open: PR title required" >&2; exit 1; }
  # PR-title lint, locally: CI's verify job runs commitlint over the PR TITLE (it becomes the
  # squash subject), and the commit lint further down never sees it — #3774 went red on a 106-char
  # title after local verify passed (2026-09-26). Same check, before anything is pushed.
  echo "$title" | npx commitlint >/dev/null 2>&1 || {
    echo "ship open: PR TITLE fails commitlint (Conventional Commit, lowercase-led, ≤100 chars):" >&2
    echo "$title" | npx commitlint --verbose >&2 || true
    exit 1
  }
  local base="main" bodyfile="" verify=1 hold=0 catchup=1
  while [ $# -gt 0 ]; do case "$1" in
    --base) base="$2"; shift 2 ;;
    --body-file) bodyfile="$2"; shift 2 ;;
    --no-verify) verify=0; shift ;;
    --no-merge) catchup=0; shift ;;
    # hold-for-Eric PRs (carve-outs, a `Needs from you` block, a PR awaiting its review): they END
    # ready for review with auto-merge unarmed — never LEFT as a draft. A lingering draft skips
    # `verify` and reads as "Claude still has work to do" (Eric, 2026-09-04, on #1304). They do
    # START as a draft for about a second: see the ORDER note in cmd_open.
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
  local pinned; pinned="$(mktemp /tmp/ship-body-pinned.XXXXXX)"
  cmd_pinshots "$bodyfile" "$(git rev-parse HEAD)" > "$pinned"
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
    #
    # The remedy is a command, so the script runs it (#5195: 22 refusals in 3 days, each costing two
    # turns to run the printed merge by hand and re-run ship open). The decision above is kept —
    # verify still never tests a stale base — only the hand step is gone. A conflict is aborted
    # back to the untouched branch and the refusal stands; `--no-merge` keeps the refusal outright.
    if [ -n "$merge_base" ] && ! git merge-base --is-ancestor "origin/$base" HEAD 2>/dev/null; then
      local behind; behind="$(git rev-list --count "$merge_base..origin/$base")"
      if [ "$catchup" = 1 ] && git merge "origin/$base" --no-edit >/tmp/ship-merge.log 2>&1; then
        echo "ship: merged origin/$base ($behind commits)"
        merge_base="$(git merge-base "origin/$base" HEAD)"
      else
        if [ "$catchup" = 1 ]; then
          local conflicts; conflicts="$(git diff --name-only --diff-filter=U)"
          git rev-parse -q --verify MERGE_HEAD >/dev/null && git merge --abort
          echo "ship: merging origin/$base did not complete cleanly — aborted, the branch is as it was." >&2
          if [ -n "$conflicts" ]; then
            echo "  conflicting paths:" >&2
            sed 's/^/    /' <<<"$conflicts" >&2
          else
            tail -5 /tmp/ship-merge.log >&2
          fi
        fi
        echo "ship: this branch is $behind commit(s) behind origin/$base — local verify would test a" >&2
        echo "  stale merge state that CI won't see. Merge it in first, THEN re-run ship open:" >&2
        echo "    git merge origin/$base --no-edit" >&2
        echo "  (--no-edit is load-bearing: commitlint requires Conventional-Commit format and only" >&2
        echo "   exempts git's own auto-generated 'Merge branch' message — a hand-written one fails" >&2
        echo "   the commit-msg hook. Never rebase onto \$base here; merge keeps a reviewer's existing" >&2
        echo "   checkout of this branch valid.)" >&2
        exit 1
      fi
    fi

    if [ -n "$merge_base" ]; then
      npx commitlint --from "$merge_base" --to HEAD --verbose || {
        echo "ship: COMMIT MESSAGE LINT FAILED — not pushing. Fix with 'git commit --amend' (last commit) or 'git rebase -i' (earlier one), then retry." >&2
        exit 1
      }
    fi
    echo "ship: local verify (parity with CI — fail fast before spending a runner)…"
    # Through verify-locked.sh (#5548): queued behind any other worktree's verify in this checkout,
    # and a green run stamps the tree so the pre-push hook below skips a second verify of it. Logs
    # are per-process — a fixed /tmp name let two ships at once overwrite each other's tail.
    local verify_log="/tmp/ship-verify.$$.log"
    # Every outcome goes to scripts/agent-meter.mjs's log: a mistake caught here never reaches CI, so
    # without this line the first-pass rate only sees what got past local verify (#6470).
    local verify_ok=true verify_rc=0
    bash scripts/verify-locked.sh --log "$verify_log" || { verify_rc=$?; verify_ok=false; }
    # 75 is no result: the queue's wait ran out, the lid was closed, or the machine slept through a
    # run that then failed (#6668). There is no mistake for the meter to count, and telling it from
    # a red verify stops an agent hunting for a failure that is not there.
    if [ "$verify_rc" = 75 ]; then
      echo "ship: no verify result — the queue wait ran out, the lid was closed, or the machine slept mid-run (the verify: line above says which). Nothing was pushed or counted. Run this again."
      exit 75
    fi
    # A failed row also says which step failed and the first error line: a row that only said
    # ok=false left the meter unable to name what agents get wrong first (#6470).
    local verify_why=""
    "$verify_ok" || verify_why=",$(verify_row_fields "$verify_log")"
    # Only for this repo: ship's own specs run it in throwaway repos, and those must not count.
    grep -q 'skynet-capital' <<<"$(git remote get-url origin 2>/dev/null)" \
      && mkdir -p "${AGENT_RUNS_DIR:-$HOME/.claude/runs}" 2>/dev/null \
      && printf '{"at":"%s","ok":%s,"branch":"%s"%s}\n' "$(date -u +%FT%TZ)" "$verify_ok" "$(git branch --show-current)" "$verify_why" \
        >> "${AGENT_RUNS_DIR:-$HOME/.claude/runs}/ship-verify.jsonl" 2>/dev/null || true
    "$verify_ok" || { echo "ship: LOCAL VERIFY FAILED — not pushing."; tail -20 "$verify_log"; exit 1; }
    echo "ship: verify green."
    # INTEGRATION TESTS TOO (2026-09-30, #4094). `verify` is unit/DOM-level; the Playwright suite is
    # CI's `integration tests` job, and #4151/#4155 merged while it was still running and later went
    # red. Same classification as CI's "Detect non-docs changes": a docs-only diff skips it there,
    # so it skips here. Chromium is preinstalled in cloud sessions (PLAYWRIGHT_BROWSERS_PATH).
    # Only when the PINNED browser build is on disk: screenshots are baselined on CI's exact Chromium,
    # and a cloud session ships a different build (2026-09-30: 1194 on disk vs 1234 pinned) that it
    # must not re-download — a mismatched run is false-red, not signal. Then the pipeline's arm job
    # is the gate (it waits for `integration tests`), and this says so rather than passing silently.
    # Same reasoning for the PLATFORM (2026-10-02, PR #4519): screenshot baselines are
    # `*-chromium-linux.png` only, so on macOS Playwright writes fresh `-darwin` files and fails
    # every `matches the known-good page screenshot` spec — false-red. Local e2e runs on Linux only.
    # Not piped: a kill by SIGPIPE on a match would read as a docs-only diff and skip these tests. An
    # empty diff must stay false, and a here-string would hand `grep -v` one blank line to match. A
    # diff that fails says nothing about what changed, so it runs the tests rather than skipping them.
    local changed; changed="$(git diff --name-only "origin/$base...HEAD")" || changed="the diff failed"
    if [ -n "$changed" ] && grep -qvE '(\.md$|^docs/)' <<<"$changed"; then
      if [ "$(uname -s)" != "Linux" ]; then
        echo "ship: ⚠ local integration tests NOT run — screenshot baselines are Linux-only and this is $(uname -s). CI's \`integration tests\` is the gate: the pipeline arms only after it passes. Do not arm by hand."
      elif node -e 'const {chromium}=require("playwright-core");process.exit(require("fs").existsSync(chromium.executablePath())?0:1)' 2>/dev/null; then
        echo "ship: local integration tests (npm run test:e2e)…"
        npm run test:e2e >"/tmp/ship-e2e.$$.log" 2>&1 || { echo "ship: LOCAL INTEGRATION TESTS FAILED — not pushing."; tail -30 "/tmp/ship-e2e.$$.log"; exit 1; }
        echo "ship: integration tests green."
      else
        echo "ship: ⚠ local integration tests NOT run — the pinned Chromium build isn't installed here. CI's \`integration tests\` is the gate: the pipeline arms only after it passes. Do not arm by hand."
      fi
    fi
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

  # Stalled-PR advisory (docs/LESSONS.md, 2026-10-16): every net above fires on RED, and a PR that is
  # green, armed and "blocked" (#5221, 5 days) or green and never armed (#4449, 29 hours) raises
  # nothing. Same rides-the-path doctrine: REST core only, a no-op without a token, advisory.
  node scripts/stuck-pr-scan.mjs || {
    echo "ship: ^^ a green PR above is not merging. Each line names its one-command fix; do not stack on it."
  }

  # Digest advisory (same rides-the-path doctrine): the altitude instrument going quiet is drift
  # nobody sees — surface DUE-ness at the moment every change already passes through. Advisory only.
  node scripts/digest-scan.mjs 2>/dev/null || true

  # Plan-closure advisory (docs/LESSONS.md, 2026-08-30): catches a final slice shipping without
  # `Closes #N`, which left #928 and #885 open long after they were done. Advisory only — most
  # slices of a multi-slice plan should NOT close the issue yet.
  node scripts/plan-closure-scan.mjs "$branch" "$bodyfile" 2>/dev/null || true

  # PR-provenance advisory (#4393 criterion 8): a PR that names no issue is invisible to the
  # Orchestration board, so the in-flight cap cannot count it. Lane branches are exempt by class.
  node scripts/pr-provenance-scan.mjs --pr "$branch" "$title" "$bodyfile" 2>/dev/null || true

  # Test-quality advisory (Eric, 2026-08-30: tests as acceptance criteria): flags a new spec
  # asserting on call counts or spying on internals — docs/ENGINEERING.md's BDD rule already
  # forbids it, this just makes drift back into it visible. Advisory only — a real system boundary
  # can be a legitimate exception a script can't judge.
  node scripts/test-quality-scan.mjs "$branch" --base "$base" 2>/dev/null || true

  # Reuse advisory: a helper this change pasted, named while the fix is still one import. No REST
  # call, silent when there is no copy. Only a body match prints; scripts/dupe-delta.mjs holds the
  # measured precision and the number that removes this line.
  node scripts/dupe-scan.mjs --diff "origin/$base" 2>/dev/null || true

  # Braces are load-bearing: stock macOS bash (3.2) reads the ellipsis bytes as identifier
  # characters, so a bare $branch… is the undefined variable "branch…" and set -u kills the run
  # right before the push. Brace any variable followed by a non-ASCII character in this file.
  echo "ship: pushing ${branch}…"
  cmd_push "$branch"

  local body; body="$(cat "$bodyfile")"
  # ORDER, for a held PR: open as a DRAFT → label `hold-merge` → promote to ready. pipeline.yml's
  # arm job decides from the labels in the triggering EVENT's payload. Opened ready, the `opened`
  # event carried no label (it is applied a moment later), so the job armed anyway and a held PR
  # merged the moment it went green — #3735, 2026-09-25, merged before its correctness review
  # landed (docs/LESSONS.md). Opened as a draft, the arm job skips the `opened` event; the
  # `ready_for_review` event that follows the label carries it, so the job skips that one too, and
  # `verify` runs on it. The draft lives for about a second, inside this function — never lingers.
  # An unheld PR is opened ready, as always: a draft skips `verify` (docs/LESSONS.md 2026-08-14).
  local payload; payload="$(printf '%s' "$body" | python3 -c "import json,sys; print(json.dumps({'title':sys.argv[1],'head':sys.argv[2],'base':sys.argv[3],'body':sys.stdin.read(),'draft':sys.argv[4]=='1'}))" \
    "$title" "$branch" "$base" "$hold")"
  echo "ship: opening PR over REST (core bucket)…"
  local resp http body opened_hits=""; resp="$(api POST "/pulls" "$payload")"
  http="$(http_of "$resp")"; body="$(body_of "$resp")"
  if [ "$http" = 201 ]; then
    local num url; num="$(printf '%s' "$body" | json_field number)"; url="$(printf '%s' "$body" | json_field html_url)"
    echo "ship: opened PR #$num  $url"
    echo "$num"
    visual_hint "$num" "$base"
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
        # Promoting an UNLABELLED draft would hand the arm job exactly the event it arms on. Leave
        # it a draft: a stuck draft is visible and safe; an unlabelled ready PR merges on green.
        echo "ship: could NOT label #$num hold-merge (HTTP $lhttp) — left as a DRAFT so it cannot auto-merge. Label it, then mark it ready by hand." >&2
        return
      fi
      if promote_ready "$num" "$(printf '%s' "$body" | json_field node_id)"; then
        echo "ship: promoted #$num to ready — the ready_for_review event carries hold-merge, so nothing arms it."
        reverify_held "$num" "$(printf '%s' "$body" | python3 -c "import sys,json; print(json.load(sys.stdin)['head']['sha'])")" "$(printf '%s' "$payload" | json_field body)"
        echo "ship: held for Eric (ready for review, auto-merge unarmed) — do NOT arm. STOP. No polling."
      else
        echo "ship: labelled #$num but could NOT promote it from draft — mark it ready by hand (verify won't run on a draft)." >&2
        echo "ship: held for Eric (still a DRAFT, auto-merge unarmed) — do NOT arm. STOP. No polling."
      fi
    # The arming usually happens through the MCP tool, which never runs this script — so the
    # instruction printed here is the last place the envelope answer can reach the session that
    # arms. Print the REFUSAL as the next step when the diff is in the irreversible class.
    elif ! opened_hits="$(git diff -z --name-only --no-renames "origin/$base...HEAD" | xargs -0 -r node "$(dirname "$0")/envelope-scan.mjs" --check -- | python3 -c '
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
      echo "ship: NEXT — nothing. Do NOT arm auto-merge by hand: pipeline.yml's \`arm auto-merge\` job arms #$num itself once verify AND integration tests pass (#4094). STOP. No polling."
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
# Filters on `blocking`, not `protected`, the field the arm job reads. The paths go after `--`
# because `ship automerge` passes the PR's own file names, and a name must never read as a flag.
envelope_hits() {
  node "$(dirname "$0")/envelope-scan.mjs" --check -- "$@" | python3 -c '
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

# The state of the newest run in a check-runs response on stdin: its conclusion, its status while it
# runs, or "not reported yet" when there is none.
latest_check_state() {
  python3 -c '
import sys, json
runs = json.load(sys.stdin).get("check_runs", [])
if not runs: print("not reported yet")
else:
    r = max(runs, key=lambda r: r.get("started_at") or "")
    print(r.get("conclusion") or r.get("status"))
'
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
  cmd_checkarm "${paths[@]}"

  # NEVER ARM PAST INTEGRATION TESTS (2026-09-30, #4094). Native auto-merge waits only on REQUIRED
  # checks, and only `verify` was required then — so arming here the moment a PR opened let #4151, #4155
  # and #4158 merge while `integration tests` was still running (two went red). pipeline.yml's own
  # `arm auto-merge` job already waits for it; this is the fallback for a PR that job can't arm
  # (e.g. a re-push, where `opened` won't fire again), so it must hold the same line. Skipped counts
  # as passed: CI skips the job on a docs-only diff.
  local head_sha cresp chttp cbody e2e_state
  head_sha="$(printf '%s' "$body" | python3 -c 'import sys,json; print(json.load(sys.stdin)["head"]["sha"])')"
  cresp="$(api GET "/commits/$head_sha/check-runs?check_name=integration%20tests&per_page=10")"
  chttp="$(http_of "$cresp")"; cbody="$(body_of "$cresp")"
  [ "$chttp" = 200 ] || { echo "ship automerge: GET check-runs returned HTTP $chttp — refusing to arm unproven." >&2; exit 6; }
  e2e_state="$(printf '%s' "$cbody" | latest_check_state)"
  case "$e2e_state" in
    success|skipped) ;;
    *) echo "ship automerge: integration tests on #$num are '$e2e_state' — refusing to arm. Only a passed (or skipped) run may merge (#4094)." >&2; exit 6 ;;
  esac

  # THE SAME LINE FOR THE STABILITY BUDGET. The arm job waits on it, and it is not a required check,
  # so native auto-merge would not. Unlike integration tests a head may never have run it: a job added
  # later has no run on an older head, and that reads as passing, as it does in stuck-pr-decide.mjs.
  # A cancelled one is refused here and is not red there: this is an arm, and only a pass may arm.
  local stability_state
  cresp="$(api GET "/commits/$head_sha/check-runs?check_name=stability%20budget&per_page=10")"
  chttp="$(http_of "$cresp")"; cbody="$(body_of "$cresp")"
  [ "$chttp" = 200 ] || { echo "ship automerge: GET check-runs returned HTTP $chttp — refusing to arm unproven." >&2; exit 6; }
  stability_state="$(printf '%s' "$cbody" | latest_check_state)"
  case "$stability_state" in
    success|skipped|"not reported yet") ;;
    *) echo "ship automerge: stability budget on #$num is '$stability_state' — refusing to arm. Read that job, then re-run it or fix what it found." >&2; exit 6 ;;
  esac

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
    # THE SESSION ROUTE (2026-09-26). A Claude Code cloud session refuses GraphQL outright and
    # serves auto-merge at a REST route instead — the same proxy that made #3739 add a REST
    # fallback for draft→ready. Try it before refusing; the read-back below judges it, as it
    # judges the mutation, so a route that answers 2xx without arming still says so.
    local rresp; rresp="$(api PUT "/pulls/$num/ccr/auto_merge" '{"merge_method":"squash"}')"
    if [[ "$(http_of "$rresp")" == 2* ]]; then
      echo "ship automerge: GraphQL refused; armed through the session's REST route." >&2
    else
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
#                                [--closes N[,M]] [--part-of N[,M]]
#   scripts/ship.sh platter board <item-branch> [--subject S] [--no-verify] [--closes …] [--part-of …]
#                                 [--no-merge]
#   scripts/ship.sh platter amend <item-branch> [--closes N[,M]] [--part-of N[,M]]
#   scripts/ship.sh platter ledger [--base <ref>] [--body]
#   scripts/ship.sh platter sync
#   scripts/ship.sh platter revert <pr> <sha>   # one item out of a landed platter, squashed or not
#
# `--closes` / `--part-of` name the issues the item finishes or advances; with neither, the item's
# own PR's keywords are read, and a branch number alone is only ever `Part of` (#4562). They ride as
# `Platter-Closes:` / `Platter-Refs:` trailers, and the body turns them into Summary bullets, so the
# platter's one merge closes the issues behind its items — under either button.
#
# Four rules that are load-bearing, not preferences:
#   - NOTHING RED BOARDS. `board` runs `npm run verify`, through the verify queue, on the POST-board
#     tree — the union so far, which is strictly stronger than "green alone on its own branch", and
#     is the only proof that can exist here: pipeline.yml's `verify` triggers on `pull_request:
#     branches: [main]`, so a PR based on a platter branch runs no CI at all. The platter PR (base `main`) is the union's
#     first CI run. A failed verify un-boards the item and leaves the platter exactly as it was.
#   - THE PLATTER IS NEVER A PLACE TO DEVELOP. A conflicting item catches up to `main` on its OWN
#     branch and re-boards; nothing is ever fixed here (Rust's rollup procedure, same reasoning).
#     `board` does merge `main` into a platter that is behind before it squashes (#5390) — a
#     catch-up that changes no item, never a fix; if it conflicts, the platter is re-opened.
#   - IT IS NEVER ARMED. `--hold` applies `hold-merge` (which pipeline.yml's arm job skips) and the
#     diff is protected by construction (which `checkarm` refuses) — unarmed by two mechanisms.
#   - NO SAME-FILE FENCE. Feast mode's "two items must not touch the same file" comes from PARALLEL
#     athletes; the platter boards sequentially onto one integration branch, so same-file items are
#     fine in order — a conflict is just an item that needs to catch up first.
#
# The one rule this script CANNOT enforce is the merge method: a PR does not choose how it is merged,
# and by 2026-11-01 twenty of twenty-seven landed platters had arrived as squashes despite a
# top-level WARNING in the body (#3754) — a sentence cannot force a button. What holds either way:
# GitHub keeps `refs/pull/<n>/head` after the branch is deleted, so every item commit stays
# fetchable, and `git revert <sha>` needs a commit's parent and tree, never its ancestry in `main`.
# `platter revert <pr> <sha>` (below) is that path, and `node scripts/platter-merge-scan.mjs` reads
# `main` afterwards and reports only whether each landed item's commit is still fetchable.

# Protected paths among the file names on stdin, space-separated (empty when none). The path-level
# answer on purpose: envelope-scan's --base mode diffs the CHECKED-OUT HEAD, and the ledger column
# is describing the ITEM, not the platter it landed on.
platter_protected() {
  local names; names="$(cat)"
  [ -n "$names" ] || return 0
  printf '%s\n' "$names" | xargs -r node "$(dirname "$0")/envelope-scan.mjs" --check -- | python3 -c '
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

# The boarded items: commits in the range that carry the Platter-Item trailer `board` writes, and
# nothing else. The ledger, the picture's count and the Summary refs all read this one list, so an
# item's row number is the same in all three. A bare `<base>..HEAD` is not enough on its own: from a
# shallow or stale origin/main, the platter's catch-up merges drag main's history into the range —
# #5852's ledger grew to 986 rows over 20 real items (#6252). Merges and main's commits carry no
# trailer, so they never become rows; the range itself is checked against GitHub's own count before
# a body is posted (platter_sync_body).
# An optional argument names more trailer keys to keep: the Summary also reads `ship platter amend`'s
# notes (Platter-Amends:), which add refs to a row and are never rows themselves.
platter_items_log() {
  git log --reverse --no-merges --format="%H%x00%s%x00%b%x1e" "$PLATTER_BASE..HEAD" |
    PLATTER_KEYS="Platter-Item: ${1-}" python3 -c '
import os, sys
keys = tuple(os.environ["PLATTER_KEYS"].split())
for record in sys.stdin.read().split("\x1e"):
    body = record.split("\x00")[-1]
    if any(line.strip().startswith(keys) for line in body.splitlines()):
        sys.stdout.write(record + "\x1e")
'
}

platter_item_count() { platter_items_log | tr -cd '\036' | wc -c | tr -d ' '; }

platter_ledger_table() {
  # Non-merge commits with no trailer are platter-side fixes (#5852's two hand reverts) — or, from a
  # stale range, main's own. Either way they are not items, so they are counted, not given rows.
  local others; others=$(( $(git rev-list --count --no-merges "$PLATTER_BASE..HEAD") - $(platter_item_count) ))
  platter_items_log | python3 -c '
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
  if [ "$others" -gt 0 ]; then
    printf '\n_Also on the branch, not items: %s commit(s) with no `Platter-Item:` trailer — `git log --no-merges %s..%s` lists them._\n' \
      "$others" "$PLATTER_BASE" "$(git rev-parse --abbrev-ref HEAD)"
  fi
}

# The PR body: ledger as the picture (docs/PICTURES.md prescribes a table for exactly this shape),
# then the three things Eric needs to know to land it. Regenerated from git on every board.
# The open-time picture (plan #3786 slice 4, docs/PICTURES.md → the held-PR starter): the choice Eric
# holds and what each button does to the undo, with the real count of boarded commits. Generated by
# scripts/platter-picture.mjs so it never names a count the ledger does not hold; the after-landing
# picture is `ship platter landed <pr>`, read from the log, in whichever ending is true.
platter_picture() {
  local count; count="$(platter_item_count)"
  [ "$count" -ge 1 ] || count=1
  node "$(dirname "$0")/platter-picture.mjs" open --count "$count"
}

# The issues the boarded items close or are part of, one Summary bullet each (#4562). Read from the
# same commits as the ledger, so dropping an item (re-opening without it) drops its close too —
# plus any `ship platter amend` note, which platter-refs folds onto the rows of the item it names.
platter_summary_refs() {
  platter_items_log "Platter-Amends:" | node "$(dirname "$0")/platter-refs.mjs" summary
}

platter_body() {
  cat <<EOF
## The picture

\`\`\`mermaid
$(platter_picture)
\`\`\`

_Caption — the held PR at open time, drawn from the boarded commits: the button decides whether the ledger's revert column keeps its promise. The ledger itself is below._

$(platter_ledger_table)

_Caption — the platter ledger, read from the boarded commits: each item, the evidence it was green, and the sha that reverts it alone._

> [!WARNING]
> **Either button lands this.** "Create a merge commit" keeps every item in \`main\`'s history, so \`git revert <sha>\` from the table works at once;
> "Squash and merge" collapses them into one commit, and one item then reverts through \`scripts/ship.sh platter revert <pr> <sha>\`.
> The shas above stay fetchable either way: GitHub keeps \`refs/pull/<pr>/head\` after it deletes \`$(git rev-parse --abbrev-ref HEAD)\`.
> By 2026-11-01, 20 of 27 landed platters were squashes; \`node scripts/platter-merge-scan.mjs\` reports whether each landed item's commit is still fetchable.

## Summary

- One merge clears every protected-path change below; the boundary does not move, only its cost.
- **Either button lands it** — a merge commit keeps items in \`main\`; a squash reverts one through \`platter revert\`.
- Each item was verified green on the union as it boarded; this PR is that union's first CI run.
$(platter_summary_refs)

<details>
<summary><strong>How to land this, and how to drop one bad item</strong></summary>

**Landing.** Either button. **Create a merge commit** keeps one commit per item in \`main\`'s
history, so \`git log main\` reads as items and a plain \`git revert\` drops one. **Squash and merge**
lands the same tree as one commit; the items then live on \`refs/pull/<pr>/head\`, which GitHub keeps
after it deletes the branch. The repo's settings put this PR's title and body (this ledger) on the
merge commit either way, so \`main\`'s first-parent history reads as PRs.

**The revert path that actually exists, by how this lands.** Before the merge, every revert sha in
the table is reachable on \`$(git rev-parse --abbrev-ref HEAD)\`. Merged as a merge commit, they are
in \`main\` and \`git revert <revert sha>\` drops one item. Squashed, they are not in \`main\`'s history,
but \`scripts/ship.sh platter revert <pr> <sha>\` fetches \`refs/pull/<pr>/head\` and reverts the one
commit onto a fresh branch off \`main\` — a revert needs the commit's parent and tree, never its
ancestry. The ledger's revert column holds under both buttons; only the command differs.

**Dropping one item after the merge.** After a merge commit, \`git revert <revert sha>\` from the
table — no \`-m\`, because each item is an ordinary single-parent commit. After a squash,
\`scripts/ship.sh platter revert <pr> <revert sha>\`, then ship the branch it leaves you on. An item
a later item builds on may conflict; that is the honest limit of any ordered batch, not a defect
of this one.

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
  local item="$1" subject="$2" verify="$3" closes="${4-}" partof="${5-}" closes_set="${6:-0}" partof_set="${7:-0}"
  git diff --quiet && git diff --cached --quiet || {
    echo "ship platter: uncommitted changes — commit or drop them before boarding" >&2; exit 1; }
  # An item cut from a NEWER main than the platter's would squash every main commit in between into
  # this one item — and its revert sha would then revert all of them (2026-10-26, #5852: a two-file
  # item boarded as 504 files). `board` catches the platter up first (platter_catch_up), so this
  # fires only under --no-merge or when main moves mid-board. Main is fetched first because the
  # item fetch below owns FETCH_HEAD.
  git fetch --quiet origin main || {
    echo "ship platter: cannot fetch origin/main to check the item's base" >&2; exit 1; }
  git fetch --quiet origin "$item" || {
    echo "ship platter: cannot fetch origin/$item — push the item branch first" >&2; exit 1; }
  git merge-base --is-ancestor "$(git merge-base FETCH_HEAD origin/main)" HEAD || {
    echo "ship platter: $item is based on a newer main than the platter — boarding it would fold" >&2
    echo "  those main commits into this one item. Catch the platter up first, then re-board:" >&2
    echo "  git merge origin/main --no-edit" >&2
    exit 1; }

  local before item_sha; before="$(git rev-parse HEAD)"; item_sha="$(git rev-parse FETCH_HEAD)"
  # Default to the item's newest subject; --subject overrides, which is what a multi-commit item
  # branch wants (a squash has no subject of its own, and the newest one can under-describe it).
  [ -n "$subject" ] || subject="$(git log -1 --format=%s FETCH_HEAD)"
  printf '%s\n' "$subject" | npx commitlint || {
    echo "ship platter: the item subject above is not a valid Conventional Commit — pass --subject." >&2
    exit 1; }
  # Resolved before the squash, so a bad --closes refuses with the platter untouched and unverified.
  local refs; refs="$(platter_item_refs "$item" "$subject" "$closes" "$partof" "$closes_set" "$partof_set")" || {
    echo "ship platter: the item's issue refs did not resolve (platter-refs says why, above) — the platter is unchanged." >&2
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
    # Through verify-locked.sh (#5548), as `ship open` does: queued behind any other verify in this
    # checkout, so boarding no longer skips the queue (#6470). The log is per-process for the same
    # reason as open's. 75 is no result (the queue's wait ran out, the lid was closed, or the machine
    # slept mid-run, #6668), so the item is un-boarded without calling it red.
    local verify_log="/tmp/ship-platter-verify.$$.log" verify_rc=0
    bash "$(dirname "$0")/verify-locked.sh" --log "$verify_log" || verify_rc=$?
    if [ "$verify_rc" = 75 ]; then
      git reset --hard --quiet "$before"
      echo "ship platter: no verify result — the queue wait ran out, the lid was closed, or the machine slept mid-run (the verify: line above says which). $item is not boarded; the platter is unchanged. Run this again." >&2
      exit 75
    fi
    [ "$verify_rc" = 0 ] || {
      git reset --hard --quiet "$before"
      echo "ship platter: VERIFY FAILED with $item boarded — un-boarded it; the platter is unchanged." >&2
      tail -20 "$verify_log" >&2
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
    [ -z "$refs" ] || printf '%s\n' "$refs"
  } > "$msg"
  git commit --quiet -F "$msg"
  echo "ship platter: boarded $item as $(git rev-parse --short HEAD) — $subject"
  [ -z "$refs" ] || echo "ship platter: carries $(printf '%s' "$refs" | tr '\n' ' ')"
}

# The item's Platter-Closes / Platter-Refs trailer lines (#4562; scripts/platter-refs.mjs owns the
# rules). With neither flag passed, the item's own PR is read — newest first, any state, since a
# superseded item PR is closed once its content boards (platter_close_item) — best-effort: no PR, or no answer, leaves
# only what the branch and subject name, and those are only ever `Part of`.
platter_item_refs() {
  local item="$1" subject="$2" closes="$3" partof="$4" closes_set="$5" partof_set="$6"
  local args=(trailers --item "$item" --subject "$subject")
  [ "$closes_set" = 1 ] && args+=(--closes "$closes")
  [ "$partof_set" = 1 ] && args+=(--part-of "$partof")
  if [ "$closes_set" != 1 ] && [ "$partof_set" != 1 ]; then
    local owner resp http bodyfile="/tmp/ship-platter-item-pr.md"
    owner="$(repo)"; owner="${owner%%/*}"
    resp="$(api GET "/pulls?state=all&head=$owner:$item&per_page=1" 2>/dev/null || true)"
    http="$(http_of "$resp")"
    if [ "$http" = 200 ]; then
      body_of "$resp" | python3 -c 'import sys,json; r=json.load(sys.stdin); print((r[0].get("body") or "") if r else "")' \
        > "$bodyfile" && args+=(--pr-body-file "$bodyfile")
    else
      echo "ship platter: could not read $item's PR (HTTP ${http:-none}) — only its branch/subject refs board; pass --closes to close." >&2
    fi
  fi
  node "$(dirname "$0")/platter-refs.mjs" "${args[@]}"
}

# The ledger's range must be the PR's own commits before a body is posted (#6252). A cloud session
# clones 50 commits deep, so first deepen a shallow clone — otherwise main's history past the cut-off
# reads as platter commits. Then wait for GitHub to see the pushed head, and compare its commit count
# with the UNFILTERED range: the item rows are fewer by design (merges, hand reverts), so comparing
# rows would refuse every real platter. A disagreement posts nothing — the old body stays up.
PLATTER_SYNC_WAIT="${PLATTER_SYNC_WAIT:-5}"
platter_range_check() {
  local branch="$1" num="$2" resp http head want local_count gh_count tries=0
  if [ "$(git rev-parse --is-shallow-repository)" = true ]; then
    git fetch --quiet --unshallow origin main "$branch" ||
      echo "ship platter: could not unshallow this clone — the range check below decides." >&2
  fi
  want="$(git rev-parse HEAD)"
  while :; do
    resp="$(api GET "/pulls/$num")" || true
    http="$(http_of "$resp")"
    if [ "$http" != 200 ]; then
      echo "ship platter: GET pulls/$num returned HTTP ${http:-none} — the ledger was not refreshed." >&2; return 1
    fi
    read -r head gh_count < <(body_of "$resp" | python3 -c 'import sys,json; r=json.load(sys.stdin); print(r["head"]["sha"], r["commits"])')
    [ "$head" = "$want" ] && break
    tries=$((tries + 1))
    if [ "$tries" -ge 6 ]; then
      echo "ship platter: #$num's head is still ${head:0:7}, not the pushed ${want:0:7} — the ledger was not refreshed." >&2
      echo "  Once GitHub catches up: scripts/ship.sh platter sync" >&2
      return 1
    fi
    sleep "$PLATTER_SYNC_WAIT"
  done
  local_count="$(git rev-list --count "$PLATTER_BASE..HEAD")"
  if [ "$local_count" != "$gh_count" ]; then
    echo "ship platter: the ledger's range $PLATTER_BASE..HEAD holds $local_count commits, but GitHub says #$num has $gh_count —" >&2
    echo "  $PLATTER_BASE is stale or shallow here, so the ledger would list commits that are not the platter's." >&2
    echo "  Fix the clone, then re-sync: git fetch --unshallow origin main || git fetch origin main; scripts/ship.sh platter sync" >&2
    return 1
  fi
}

# Close the boarded item's own PR with a pointer to the platter (#6253). Left open it stays held, so
# assignments.mjs criterion 4 keeps it on Eric's list beside the platter — two of his four held-PR
# assignments on 2026-10-26 were items already boarded, one click read as three. Closed, criterion 2
# unassigns it on the next sweep. Runs after the push, so the pointer names a sha that exists on the
# remote; its `Closes #N` refs already rode the commit as Platter-Closes trailers. Best-effort per
# step, but a failure returns non-zero with the PR named, so the board ends red on a stated cause.
# The comment carries the Claude Code footer: claude.yml wakes on any member comment without it.
platter_close_item() {
  local item="$1" branch="$2" sha="$3" owner resp http platter num payload
  owner="$(repo)"; owner="${owner%%/*}"
  resp="$(api GET "/pulls?state=open&head=$owner:$branch")" || true
  http="$(http_of "$resp")"
  [ "$http" = 200 ] && platter="$(body_of "$resp" | python3 -c 'import sys,json; r=json.load(sys.stdin); print(r[0]["number"] if r else "")')"
  resp="$(api GET "/pulls?state=open&head=$owner:$item")" || true
  http="$(http_of "$resp")"
  if [ "$http" != 200 ]; then
    echo "ship platter: GET $item's PR returned HTTP ${http:-none} — close it by hand if one is open." >&2; return 1
  fi
  num="$(body_of "$resp" | python3 -c 'import sys,json; r=json.load(sys.stdin); print(r[0]["number"] if r else "")')"
  [ -n "$num" ] || { echo "ship platter: $item has no open PR — nothing to close."; return 0; }
  local where="\`$branch\`"; [ -z "$platter" ] || where="#$platter"
  payload="$(printf 'Boarded onto %s as `%s`; lands with it. Closing this PR so the platter'"'"'s merge is the one click — its content and any `Closes #N` travel on the platter.\n\n---\n_Generated by [Claude Code](https://claude.ai/code)_' \
    "$where" "$sha" \
    | python3 -c "import json,sys; print(json.dumps({'body': sys.stdin.read()}))")"
  resp="$(api POST "/issues/$num/comments" "$payload")" || true
  [ "$(http_of "$resp")" = 201 ] || echo "ship platter: the pointer comment on #$num did not post — closing anyway." >&2
  resp="$(api PATCH "/pulls/$num" '{"state":"closed"}')" || true
  http="$(http_of "$resp")"
  if [ "$http" = 200 ]; then
    echo "ship platter: closed #$num — its content rides the platter."
  else
    echo "ship platter: PATCH state returned HTTP ${http:-none} — close #$num by hand; it is boarded." >&2
    return 1
  fi
}

# Refresh the open platter PR's ledger. The commit is already made and pushed, so a failure here is
# a stale body to fix by hand, never a lost item — but it returns non-zero with that said plainly,
# so the board ends red on a named cause rather than on a bare curl error (#6212).
platter_sync_body() {
  local branch="$1" owner resp http body num newbody payload
  owner="$(repo)"; owner="${owner%%/*}"
  resp="$(api GET "/pulls?state=open&head=$owner:$branch")" || true
  http="$(http_of "$resp")"; body="$(body_of "$resp")"
  if [ "$http" != 200 ]; then
    echo "ship platter: GET pulls returned HTTP ${http:-none} — refresh the ledger by hand." >&2; return 1
  fi
  num="$(printf '%s' "$body" | python3 -c 'import sys,json; r=json.load(sys.stdin); print(r[0]["number"] if r else "")')"
  if [ -z "$num" ]; then
    echo "ship platter: no open PR for $branch — open one with 'ship platter open'." >&2; return 1
  fi
  platter_range_check "$branch" "$num" || return 1
  newbody="$(platter_body)"
  payload="$(printf '%s' "$newbody" | python3 -c "import json,sys; print(json.dumps({'body': sys.stdin.read()}))")"
  resp="$(api PATCH "/pulls/$num" "$payload")" || true
  http="$(http_of "$resp")"
  if [ "$http" = 200 ]; then
    echo "ship platter: ledger refreshed on #$num."
  else
    echo "ship platter: PATCH body returned HTTP ${http:-none} — refresh #$num's ledger by hand." >&2
    return 1
  fi
}

cmd_platter_open() {
  local item="${1:-}"; shift || true
  [ -n "$item" ] || {
    echo "ship platter open: an item branch is required — a PR cannot open on an empty diff" >&2; exit 1; }
  local name="" subject="" verify=1 closes="" partof="" closes_set=0 partof_set=0
  while [ $# -gt 0 ]; do case "$1" in
    --name) name="$2"; shift 2 ;;
    --subject) subject="$2"; shift 2 ;;
    --no-verify) verify=0; shift ;;
    --closes) closes="$2"; closes_set=1; shift 2 ;;
    --part-of) partof="$2"; partof_set=1; shift 2 ;;
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
  platter_board_item "$item" "$subject" "$verify" "$closes" "$partof" "$closes_set" "$partof_set"

  local bodyfile="/tmp/ship-platter-body.md"
  platter_body > "$bodyfile"
  # --no-verify here is not a skipped check: platter_board_item already ran the same `npm run
  # verify` on this exact tree and linted the subject, and cmd_open's stale-base guard is satisfied
  # by construction (this branch was cut from a freshly fetched origin/main seconds ago).
  cmd_open "chore(platter): protected-path changes — ${name#platter/}" \
    --body-file "$bodyfile" --hold --no-verify
  platter_close_item "$item" "$name" "$(git rev-parse --short HEAD)" || exit 1
}

# The board guards live in the copy of this file being run, and that copy is the PLATTER's
# checkout — a main up to a week old. A guard merged since is simply absent: #6032's stale-base
# refusal merged at 10:57 on 2026-10-26, and at 11:52 a platter still on the older ship.sh boarded
# a 3-file item as 95 files (#5852). Refuse until the platter runs main's copy.
platter_require_current_script() {
  git fetch --quiet origin main || {
    echo "ship platter: cannot fetch origin/main to check this script is current" >&2; exit 1; }
  local main_ship; main_ship="$(git rev-parse --verify --quiet origin/main:scripts/ship.sh || true)"
  if [ -n "$main_ship" ] && [ "$main_ship" != "$(git hash-object "$0")" ]; then
    echo "ship platter: this scripts/ship.sh is not origin/main's — the platter's copy is stale and" >&2
    echo "  may lack board guards merged since. Catch the platter up first, then re-board:" >&2
    echo "  git merge origin/main --no-edit" >&2
    exit 1
  fi
}

# A platter behind main catches up before anything boards (#5390). The squash below stages
# everything since the platter last shared a commit with the item, so an item cut from today's main
# onto a week-old platter carried the whole week (#5382 staged 681 files for a one-line change), and
# the two refusals that replaced that each printed `git merge origin/main --no-edit` for a hand to
# run — twelve times on three platters by 2026-11-02. The remedy is a command, so the script runs it,
# as `ship open` does (#5195). This is a catch-up, not development: a conflict means main and an item
# already boarded disagree, which no merge here may settle, so it aborts and the platter is
# re-opened. Returns 0 when it merged, 1 when the platter was already current.
platter_catch_up() {
  git diff --quiet && git diff --cached --quiet || {
    echo "ship platter: uncommitted changes — commit or drop them before boarding" >&2; exit 1; }
  git fetch --quiet origin main || {
    echo "ship platter: cannot fetch origin/main to catch the platter up" >&2; exit 1; }
  git merge-base --is-ancestor origin/main HEAD && return 1
  local before behind conflicts
  before="$(git rev-parse HEAD)"; behind="$(git rev-list --count HEAD..origin/main)"
  if git merge origin/main --no-edit >"/tmp/ship-platter-merge.$$.log" 2>&1; then
    echo "ship platter: merged origin/main into the platter ($behind commit(s)) — a catch-up, not an item."
    return 0
  fi
  conflicts="$(git diff --name-only --diff-filter=U)"
  git rev-parse -q --verify MERGE_HEAD >/dev/null && git merge --abort
  git reset --hard --quiet "$before"
  echo "ship platter: merging origin/main into the platter did not complete cleanly — aborted, the platter is unchanged." >&2
  if [ -n "$conflicts" ]; then
    echo "  conflicting paths (main disagrees with an item already boarded):" >&2
    sed 's/^/    /' <<<"$conflicts" >&2
  else
    tail -5 "/tmp/ship-platter-merge.$$.log" >&2
  fi
  echo "  Nothing is fixed on a platter: re-open it from main (ship platter open <item> --name platter/<date>)" >&2
  echo "  and re-board the survivors, each caught up to main on its own branch first." >&2
  exit 1
}

# The catch-up rewrote this file on disk, but bash is still running the copy it read before. When
# main's copy differs, hand the board to it — once — so main's guards are the ones that run (the gap
# #6067 closed by refusing, which left the hand step in place every time main's ship.sh moved).
platter_rerun_current() {
  local running="$1"; shift
  local main_ship top
  main_ship="$(git rev-parse --verify --quiet origin/main:scripts/ship.sh || true)"
  [ -n "$main_ship" ] && [ "$main_ship" != "$running" ] && [ -z "${SHIP_PLATTER_RERUN:-}" ] || return 0
  top="$(git rev-parse --show-toplevel)/scripts/ship.sh"
  # A platter whose own items changed ship.sh holds a third copy; platter_require_current_script refuses it.
  [ -f "$top" ] && [ "$(git hash-object "$top")" = "$main_ship" ] || return 0
  echo "ship platter: the catch-up brought main's ship.sh — boarding with that copy."
  SHIP_PLATTER_RERUN=1 exec bash "$top" "$@"
}

cmd_platter_board() {
  local item="${1:-}"; shift || true
  [ -n "$item" ] || { echo "ship platter board: an item branch is required" >&2; exit 1; }
  local argv=("$@") subject="" verify=1 closes="" partof="" closes_set=0 partof_set=0 catchup=1
  while [ $# -gt 0 ]; do case "$1" in
    --subject) subject="$2"; shift 2 ;;
    --no-verify) verify=0; shift ;;
    --closes) closes="$2"; closes_set=1; shift 2 ;;
    --part-of) partof="$2"; partof_set=1; shift 2 ;;
    # refuse a stale platter instead of merging main in — the pre-#5390 behaviour, kept on request.
    --no-merge) catchup=0; shift ;;
    *) echo "ship platter board: unknown arg $1" >&2; exit 1 ;;
  esac; done

  local branch; branch="$(git rev-parse --abbrev-ref HEAD)"
  case "$branch" in platter/*) ;; *)
    echo "ship platter board: HEAD is '$branch', not a platter branch — check out the open platter first." >&2
    exit 1 ;;
  esac
  # The catch-up runs before the stale-script check, which it also satisfies: the same merge brings
  # main's ship.sh, and the board then re-runs as that copy.
  if [ "$catchup" = 1 ]; then
    local running; running="$(git hash-object "$0")"
    if platter_catch_up; then
      platter_rerun_current "$running" platter board "$item" "${argv[@]}"
    fi
  fi
  platter_require_current_script
  platter_board_item "$item" "$subject" "$verify" "$closes" "$partof" "$closes_set" "$partof_set"
  local sha; sha="$(git rev-parse --short HEAD)"
  echo "ship platter: pushing ${branch}…"
  cmd_push "$branch"
  local failed=0
  platter_sync_body "$branch" || {
    echo "ship platter: $item boarded and pushed, but the PR body sync FAILED — the ledger is stale (see above)." >&2
    failed=1
  }
  platter_close_item "$item" "$branch" "$sha" || failed=1
  [ "$failed" = 0 ] || exit 1
}

# Add issue refs to an item already boarded without them (#4616). The body is rebuilt from the
# commits on every board, so a `Closes #N` typed into it by hand lasts only until the next board —
# #5852 lost #4616's four times, and each loss let the retry sweep wake a session to re-type it.
# Re-boarding refuses (the item adds nothing) and amending the item commit means a force-push, so
# the refs ride an EMPTY commit instead: `Platter-Amends: <item>` plus the usual trailers. It is
# never a ledger row and touches no file; platter-refs folds its refs onto the item's own rows.
cmd_platter_amend() {
  local item="${1:-}"; shift || true
  [ -n "$item" ] || { echo "ship platter amend: an item branch is required" >&2; exit 1; }
  local closes="" partof="" closes_set=0 partof_set=0
  while [ $# -gt 0 ]; do case "$1" in
    --closes) closes="$2"; closes_set=1; shift 2 ;;
    --part-of) partof="$2"; partof_set=1; shift 2 ;;
    *) echo "ship platter amend: unknown arg $1" >&2; exit 1 ;;
  esac; done
  [ "$closes_set" = 1 ] || [ "$partof_set" = 1 ] || {
    echo "ship platter amend: pass --closes N and/or --part-of N — an amendment that names no issue changes nothing" >&2
    exit 1; }

  local branch; branch="$(git rev-parse --abbrev-ref HEAD)"
  case "$branch" in platter/*) ;; *)
    echo "ship platter amend: HEAD is '$branch', not a platter branch — check out the open platter first." >&2
    exit 1 ;;
  esac
  git diff --quiet && git diff --cached --quiet || {
    echo "ship platter: uncommitted changes — commit or drop them before amending" >&2; exit 1; }
  platter_require_current_script
  # A here-string, for the reason at checkbody: a piped `grep -q` kills git on a match, and pipefail
  # then reports the match as a miss, most often for the items boarded most recently.
  local boarded; boarded="$(git log --no-merges --format=%b "$PLATTER_BASE..HEAD")"
  grep -qxF "Platter-Item: $item" <<<"$boarded" || {
    echo "ship platter amend: no item '$item' is boarded in $PLATTER_BASE..HEAD — \`ship platter ledger\` lists the items." >&2
    exit 1; }

  local args=(trailers --item "$item" --subject "chore(platter): amend")
  [ "$closes_set" = 1 ] && args+=(--closes "$closes")
  [ "$partof_set" = 1 ] && args+=(--part-of "$partof")
  local refs; refs="$(node "$(dirname "$0")/platter-refs.mjs" "${args[@]}")" || exit 1
  local msg="/tmp/ship-platter-amend-msg.txt"
  { printf "chore(platter): amend the issue refs of a boarded item\n\n"
    printf 'Platter-Amends: %s\n' "$item"
    printf '%s\n' "$refs"; } > "$msg"
  git commit --quiet --allow-empty -F "$msg"
  echo "ship platter: amended $item with $(printf '%s' "$refs" | tr '\n' ' ')"
  echo "ship platter: pushing ${branch}…"
  cmd_push "$branch"
  platter_sync_body "$branch" || {
    echo "ship platter: the amendment is pushed, but the PR body sync FAILED — run \`scripts/ship.sh platter sync\`." >&2
    exit 1; }
}

cmd_platter_sync() {
  local branch; branch="$(git rev-parse --abbrev-ref HEAD)"
  case "$branch" in platter/*) ;; *)
    echo "ship platter sync: HEAD is '$branch', not a platter branch — check out the open platter first." >&2
    exit 1 ;;
  esac
  git fetch --quiet origin main || {
    echo "ship platter: cannot fetch origin/main to read the ledger's range" >&2; exit 1; }
  platter_sync_body "$branch" || exit 1
}

# One item out of a LANDED platter, squashed or not (2026-11-01). GitHub keeps `refs/pull/<n>/head`
# after it deletes the merged branch, so the item commits a squash left out of `main`'s history are
# still fetchable, and `git revert <sha>` needs only the commit's parent and tree. This fetches that
# ref, checks the sha really is one of the PR's commits (the ledger's revert column), cuts
# `revert/platter-<pr>-<sha7>` off a fresh origin/main, and reverts the one commit onto it. Git's
# own revert message (`Revert "<subject>"`) passes commitlint. Pure git, no token: ship the branch
# it leaves you on with `scripts/ship.sh open`. Proven on #5852's item 21 (squashed 2026-11-01):
# one revert onto a scratch branch, committed nowhere, then the branch deleted.
cmd_platter_revert() {
  local pr="${1:-}" sha="${2:-}"
  case "$pr" in ''|*[!0-9]*)
    echo "usage: scripts/ship.sh platter revert <pr> <sha> — the PR number and a revert sha from its ledger" >&2; exit 1 ;;
  esac
  [ -n "$sha" ] || { echo "usage: scripts/ship.sh platter revert <pr> <sha> — the sha is the ledger's revert column" >&2; exit 1; }
  git diff --quiet && git diff --cached --quiet || {
    echo "ship platter revert: uncommitted changes — commit or drop them first" >&2; exit 1; }
  git fetch --quiet origin main || { echo "ship platter revert: cannot fetch origin/main" >&2; exit 1; }
  git fetch --quiet origin "refs/pull/$pr/head" || {
    echo "ship platter revert: refs/pull/$pr/head could not be fetched — is #$pr a pull request of this repo?" >&2; exit 1; }
  local head full; head="$(git rev-parse FETCH_HEAD)"
  full="$(git rev-parse --verify --quiet "${sha}^{commit}")" || {
    echo "ship platter revert: $sha is not a commit here, even after fetching refs/pull/$pr/head" >&2; exit 1; }
  git merge-base --is-ancestor "$full" "$head" || {
    echo "ship platter revert: $sha is not on #$pr's head ($head) — the ledger's revert column names the platter's own item commits" >&2; exit 1; }
  local branch="revert/platter-$pr-${full:0:7}"
  git checkout -q -B "$branch" origin/main
  git revert --no-edit "$full" || {
    echo "ship platter revert: git revert $full conflicts with today's main — resolve it on $branch, commit, then ship" >&2; exit 1; }
  echo "ship platter revert: reverted ${full:0:7} (#$pr) onto $branch, cut from origin/main — ship it with: scripts/ship.sh open '$(git log -1 --format=%s)'"
}

cmd_platter() {
  local sub="${1:-}"; shift || true
  case "$sub" in
    open) need_token; cmd_platter_open "$@" ;;
    board) need_token; cmd_platter_board "$@" ;;
    amend) need_token; cmd_platter_amend "$@" ;;
    ledger) cmd_platter_ledger "$@" ;;
    # re-post the checked-out platter's body without boarding — the recovery after a refused sync.
    sync) need_token; cmd_platter_sync ;;
    # the record after landing, from the first-parent log, in whichever ending is true (merge commit
    # or squash) — posted as a comment on the landed PR by whoever reports it (the digest, a session).
    landed) node "$(dirname "$0")/platter-picture.mjs" landed "$@" ;;
    # one item out of a landed platter, whichever button landed it — pure git, no token.
    revert) cmd_platter_revert "$@" ;;
    *) echo "usage: scripts/ship.sh platter {open <item-branch> [--name platter/<date>] [--subject S] [--no-verify] [--closes N,M] [--part-of N] | board <item-branch> [--subject S] [--no-verify] [--closes N,M] [--part-of N] [--no-merge] | amend <item-branch> [--closes N,M] [--part-of N] | ledger [--base <ref>] [--body] | sync | landed <pr> [--ref <ref>] | revert <pr> <sha>}" >&2; exit 1 ;;
  esac
}

# Sourced (a spec driving api() or platter_sync_body against a stub curl), stop at the definitions.
[ "${BASH_SOURCE[0]}" = "$0" ] || return 0

case "${1:-}" in
  open) shift; need_token; cmd_open "$@" ;;
  merge) shift; need_token; cmd_merge "$@" ;;
  automerge) shift; need_token; cmd_automerge "$@" ;;
  checkbody) shift; cmd_checkbody "$@" ;;
  pinshots) shift; cmd_pinshots "$@" ;;
  checkarm) shift; cmd_checkarm "$@" ;;
  checkverify) shift; cmd_checkverify "$@" ;;
  verifyrow) shift; verify_row_fields "$1"; echo ;;
  push) shift; cmd_push "$@" ;;
  platter) shift; cmd_platter "$@" ;;
  *) echo "usage: scripts/ship.sh {open \"<title>\" [--body-file F] [--base B] [--no-verify] | merge <n> [--method squash] | automerge <n> | checkbody <body-file> | pinshots <body-file> <sha> | checkarm <path...> | checkverify < check-runs.json | verifyrow <verify-log> | push <branch> | platter {open|board|ledger|landed|revert} ...}" >&2; exit 1 ;;
esac
