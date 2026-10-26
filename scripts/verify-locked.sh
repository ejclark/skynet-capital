#!/usr/bin/env bash
# verify-locked.sh — run the full verify one at a time per checkout, and only once per tree (#5548).
#
# Why: one `npm run verify` alone puts ~15 CPU-bound processes on a 4-core cloud session (load 10.4,
# measured 2026-10-26). Five worktree agents verifying at once drove load to 30–100, and specs failed
# on 5 s timeouts unrelated to their diff (one PR needed 6 verify attempts). And every ship ran the
# verify twice: once in `ship.sh open`, again in the pre-push hook on the same tree.
#
#   bash scripts/verify-locked.sh [--log FILE] [--skip-if-stamped [SHA…]] [-- CMD…]
#
# The lock — every worktree of one checkout shares `git rev-parse --git-common-dir`, so one
# `verify.lock` there queues every agent in the session. The kernel drops a flock when its holder
# dies, so there is never a stale lock to clean up. Waits up to VERIFY_LOCK_WAIT seconds (default
# 1800), then exits 75 with a line saying so. No `flock` on the box (stock macOS) → runs unlocked,
# as before. SKYNET_VERIFY_LOCKED=1 marks a run already inside the lock, so a nested call never
# deadlocks on its own parent.
#
# The stamp — after the default command (`npm run verify`) passes on a tree with no uncommitted or
# untracked files that is unchanged once it ends, `HEAD^{tree}` is written to this worktree's own
# `verify-ok` (`git rev-parse --git-dir`, so sibling worktrees never overwrite each other's).
# `--skip-if-stamped` (the pre-push hook) skips the run when every SHA given (the commits being
# pushed; HEAD if none) has exactly that tree. The tree hash changes on any edit, so a skip never
# covers unverified content, and CI's own `verify` still runs on every push.
#
# CMD defaults to `npm run verify`. --log sends CMD's output to FILE; this script's own lines go to
# stderr either way, so a caller that logs the run still shows "queued behind another verify".
set -uo pipefail

log=""
skip_if_stamped=0
shas=()
cmd=()
while [ $# -gt 0 ]; do
  case "$1" in
    --log) log="$2"; shift 2 ;;
    --skip-if-stamped)
      skip_if_stamped=1; shift
      while [ $# -gt 0 ] && [ "${1#-}" = "$1" ]; do shas+=("$1"); shift; done ;;
    --) shift; cmd=("$@"); break ;;
    *) echo "verify-locked: unknown argument $1" >&2; exit 2 ;;
  esac
done
default_cmd=0
if [ ${#cmd[@]} -eq 0 ]; then cmd=(npm run verify); default_cmd=1; fi

stamp="$(git rev-parse --path-format=absolute --git-dir)/verify-ok"
lock="$(git rev-parse --path-format=absolute --git-common-dir)/verify.lock"

tree_of() { git rev-parse -q --verify "$1^{tree}" 2>/dev/null; }
clean() { [ -z "$(git status --porcelain --untracked-files=normal 2>/dev/null)" ]; }

if [ "$skip_if_stamped" = 1 ] && [ -s "$stamp" ]; then
  [ ${#shas[@]} -eq 0 ] && shas=(HEAD)
  want="$(cat "$stamp")"
  match=1
  for sha in "${shas[@]}"; do [ "$(tree_of "$sha")" = "$want" ] || { match=0; break; }; done
  if [ "$match" = 1 ]; then
    echo "verify: skipped — this exact tree (${want:0:12}) already passed npm run verify here; CI re-runs it." >&2
    exit 0
  fi
fi

run() {
  if [ -n "$log" ]; then SKYNET_VERIFY_LOCKED=1 "${cmd[@]}" >"$log" 2>&1 9>&-
  else SKYNET_VERIFY_LOCKED=1 "${cmd[@]}" 9>&-; fi
}

before=""
if [ "$default_cmd" = 1 ] && clean; then before="$(tree_of HEAD)"; fi

if [ "${SKYNET_VERIFY_LOCKED:-}" = 1 ]; then
  run; status=$?
elif ! command -v flock >/dev/null 2>&1; then
  echo "verify: no flock on this machine — running unlocked (parallel verifies are not queued)." >&2
  run; status=$?
else
  wait_s="${VERIFY_LOCK_WAIT:-1800}"
  exec 9>"$lock"
  if ! flock -n 9; then
    echo "verify: queued — another verify in this checkout holds $lock (waiting up to ${wait_s}s)…" >&2
    if ! flock -w "$wait_s" 9; then
      echo "verify: gave up after ${wait_s}s waiting for $lock — another verify is still running (fuser $lock)." >&2
      exit 75
    fi
  fi
  run; status=$?
  exec 9>&-
fi

if [ "$status" = 0 ] && [ -n "$before" ] && clean && [ "$(tree_of HEAD)" = "$before" ]; then
  printf '%s\n' "$before" >"$stamp"
fi
exit "$status"
