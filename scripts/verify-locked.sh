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
# 1800), then exits 75 with a line saying so. flock(1) is util-linux, so stock macOS takes the same
# lock through perl; only a box with neither runs unlocked, and says so. SKYNET_VERIFY_LOCKED=1 marks
# a run already inside the lock, so a nested call never deadlocks on its own parent.
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
#
# The laptop (#6668) — the queue held one verify at a time on 2026-11-01, and the third in a row
# still froze the 10-core, 24 GB laptop (on battery, a game in front) until a hard reboot. The same
# night a closed lid slept another verify for 13 minutes, and it went red on 5 s timeouts its specs
# passed in seconds afterwards. So where macOS's own tools are on PATH, a verify:
#   - runs under `taskpolicy -c utility`, a QoS clamp every process it starts inherits, so whatever
#     is in front wins the CPU. Not `-b`: background QoS runs on the efficiency cores alone, which
#     would stretch a verify on an idle machine far past the 78 s it takes there today;
#   - starts fewer test workers (SKYNET_TEST_WORKERS below; both rstest configs read it);
#   - refuses while a closed lid would sleep the machine (no display attached), before it queues
#     and again when its turn comes (exit 75); a docked laptop with its lid shut runs as normal;
#   - reads `sysctl kern.waketime` before and after, and calls a failure the machine slept through
#     no result (exit 75), which ship.sh counts as no mistake.
# Each step needs its own tool, so on Linux and in CI none of them runs and nothing changes. None of
# this has run on the laptop yet: tests/scripts/verify-locked-laptop.spec.ts stubs the three tools.
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

# SKYNET_TEST_WORKERS — the root test runner's worker limit; app/rstest.config.ts takes half, as its
# suite is about a third the size. Measured 2026-11-02 with one `npm run verify` on a 4-core, 16 GB
# cloud session, where rstest starts one worker per core but one in each runner (3 + 3):
#   302 s, 916 CPU-s (3.3 of 4 cores busy); peak 4.8 GiB summed RSS 28 s in, while both tsc runs
#   (1.2 + 0.9 GiB), biome (1.0 GiB) and both runners' builds overlap; each test worker ~0.4 GiB;
#   the root suite ~285 s, the app suite ~111 s.
# Scaled to the 10-core, 24 GB laptop, that default is 9 + 9 = 18 workers: about 3.6 + 18 × 0.42 ≈
# 11 GiB for one verify, and 18 busy workers on 10 cores before the app in front gets one. Capped at
# 3 (3 + 1 = 4 workers): about 3.6 + 4 × 0.42 ≈ 5.3 GiB, under a quarter of the laptop, and about 5
# busy cores, half of them. 78 s for those 916 CPU-s makes a laptop core worth ~1.2–1.5 of these, so
# the root suite's ~735 CPU-s on 3 workers is an estimated 2½–3½ minutes on an idle laptop: inside
# #6668's 5-minute falsifier, slower than today's 78 s. 4 (6 workers, ~6.1 GiB) is the next step if
# the first timed run says the cap costs too much. A value already set wins, so a run can try one.
mac_test_workers=3

# What actually runs: the command, under the utility clamp where taskpolicy exists (see above).
launch=("${cmd[@]}")

run() {
  if [ -n "$log" ]; then SKYNET_VERIFY_LOCKED=1 "${launch[@]}" >"$log" 2>&1 9>&-
  else SKYNET_VERIFY_LOCKED=1 "${launch[@]}" 9>&-; fi
}

# ioreg reports the lid as AppleClamshellState and, beside it, whether a closed lid sleeps the
# machine as AppleClamshellCausesSleep: Yes with no display attached (the laptop, lid open, on
# 2026-11-02), No when docked, where a shut lid runs at full speed. Only both Yes refuses; a docked
# run that sleeps anyway is caught by the waketime check below. The tree is read whole
# first: under pipefail, `ioreg | grep -q` reads a closed lid as open whenever grep stops at the
# line while ioreg is still writing, and ioreg dies of SIGPIPE.
refuse_if_lid_closed() {
  local tree
  command -v ioreg >/dev/null 2>&1 || return 0
  tree="$(ioreg -r -k AppleClamshellState -d 4 2>/dev/null)"
  grep -q '"AppleClamshellState" = Yes' <<<"$tree" || return 0
  grep -q '"AppleClamshellCausesSleep" = Yes' <<<"$tree" || return 0
  echo "verify: refused — the lid is closed with no display attached, so the machine can sleep mid-run and fail specs on timeouts that say nothing about the code (#6668). Open the lid or attach a display, then run it again." >&2
  exit 75
}

# The last wake as "sec.usec", from `kern.waketime: { sec = 1793627758, usec = 179693 } Mon Nov  2
# 07:55:58 2026`; nothing where sysctl has no such key (Linux) or there is no sysctl.
waketime() {
  command -v sysctl >/dev/null 2>&1 || return 0
  sysctl kern.waketime 2>/dev/null | sed -n 's/.*{ sec = \([0-9]*\), usec = \([0-9]*\) }.*/\1.\2/p'
}

# The lid once more (a queued verify's turn can come long after it asked), then the run, then
# whether the machine woke during it: a failure it slept through says nothing about the code.
guarded_run() {
  local woke rc
  refuse_if_lid_closed
  if [ "${launch[0]}" = taskpolicy ]; then
    echo "verify: low priority — taskpolicy -c utility, test workers capped at $SKYNET_TEST_WORKERS (root) and half that (app), so the app in front stays responsive (#6668)." >&2
  fi
  woke="$(waketime)"
  run; rc=$?
  if [ "$rc" != 0 ] && [ -n "$woke" ] && [ "$(waketime)" != "$woke" ]; then
    echo "verify: no result — the machine slept during this run (kern.waketime moved), so its failure (exit $rc) says nothing about the code (#6668). Run it again with the machine awake." >&2
    return 75
  fi
  return "$rc"
}

before=""
if [ "$default_cmd" = 1 ] && clean; then before="$(tree_of HEAD)"; fi

lock_tool=""
if command -v flock >/dev/null 2>&1; then lock_tool=flock
elif command -v perl >/dev/null 2>&1; then lock_tool=perl
fi

# take_lock NOW|<seconds> locks fd 9, which this shell keeps open, so the lock lasts until the shell
# closes it or dies: 0 held, 1 another verify has it, anything else the tool itself failed. macOS has
# no flock(1), and it is where the fan-outs run: this queue was off there from the day it landed, and
# on 2026-11-01 agents verifying at once took a 10-core laptop to load 85 while all 8 verifies ship.sh
# logged in two hours failed. perl's flock() is the same call on the same inherited descriptor, so it
# outlives perl, and a dead holder still frees it. A wait under 1s tries once, as flock -w 0 does:
# alarm 0 would turn the limit off.
take_lock() {
  if [ "$lock_tool" = flock ]; then
    if [ "$1" = NOW ]; then flock -n 9; else flock -w "$1" 9; fi
    return
  fi
  perl -MFcntl=:flock -e '
    open(my $fd, ">&=", 9) or exit 2;
    my $wait = shift;
    exit(flock($fd, LOCK_EX | LOCK_NB) ? 0 : 1) if $wait eq "NOW" or int($wait) < 1;
    $SIG{ALRM} = sub { exit 1 };
    alarm int($wait);
    exit(flock($fd, LOCK_EX) ? 0 : 1);
  ' "$1"
}

# The laptop guards (#6668), for a run not already inside its parent's: a nested run inherits the
# clamp and the cap, and its parent checks the lid and the sleep.
if [ "${SKYNET_VERIFY_LOCKED:-}" != 1 ]; then
  if command -v taskpolicy >/dev/null 2>&1; then
    launch=(taskpolicy -c utility "${cmd[@]}")
    export SKYNET_TEST_WORKERS="${SKYNET_TEST_WORKERS:-$mac_test_workers}"
  fi
  refuse_if_lid_closed
fi

if [ "${SKYNET_VERIFY_LOCKED:-}" = 1 ]; then
  run; status=$?
elif [ -z "$lock_tool" ]; then
  echo "verify: no flock or perl on this machine — running unlocked (parallel verifies are not queued)." >&2
  guarded_run; status=$?
else
  wait_s="${VERIFY_LOCK_WAIT:-1800}"
  exec 9>"$lock"
  take_lock NOW; held=$?
  if [ "$held" = 1 ]; then
    echo "verify: queued — another verify in this checkout holds $lock (waiting up to ${wait_s}s)…" >&2
    take_lock "$wait_s"; held=$?
    if [ "$held" = 1 ]; then
      echo "verify: gave up after ${wait_s}s waiting for $lock — another verify is still running (fuser $lock)." >&2
      exit 75
    fi
    [ "$held" != 0 ] || echo "verify: got the lock after ${SECONDS}s — running now." >&2
  fi
  # A broken lock tool must not stop every verify on the box, and must not read as a long wait.
  [ "$held" = 0 ] || echo "verify: $lock_tool could not take the lock (exit $held) — running unlocked (parallel verifies are not queued)." >&2
  guarded_run; status=$?
  exec 9>&-
fi

if [ "$status" = 0 ] && [ -n "$before" ] && clean && [ "$(tree_of HEAD)" = "$before" ]; then
  printf '%s\n' "$before" >"$stamp"
fi
exit "$status"
