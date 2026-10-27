#!/usr/bin/env bash
set -euo pipefail

# Put an isolated worktree agent on its branch, ready to edit, in ONE call.
#
#   bash scripts/wt-start.sh <branch> [--fresh] [--issue N]
#
# WHY (#5192). Every build agent opened with the same ritual — fetch, checkout -B, worktree-setup,
# `ls node_modules…`, `git status`, `git log` — 530 setup calls across 129 agents in three days,
# 59 of them failed, a median 106 s before the first edit. The failures were the harness's
# worktree guard refusing CHAINED commands (`git fetch … && git checkout …`) and the rtk hook
# rewriting plain `git` (#5055). A plain `bash scripts/…` call passed the guard 51 of 51 times,
# and `git` inside a script runs untouched — so the ritual lives here, by construction.
#
# What it does, in order (a failed step stops the script, exits non-zero and names the step):
#   fresh     with --fresh, refuse when <branch> already exists, locally or on origin, and name the
#             first free <branch>-N to re-run with (below)
#   fetch     origin/main, and origin/<branch> when it exists
#   checkout  the local <branch> if there is one (fast-forwarded when it can be, never reset);
#             else origin/<branch> as a tracking branch; else a new branch off origin/main
#   setup     scripts/worktree-setup.sh (node_modules cloned; its chatter shown only on failure)
#   issue     with --issue N, the one line `node scripts/issues.mjs show N` prints
#   status    one closing line: branch · base sha · ahead/behind origin/main · node_modules ·
#             uncommitted files
#
# NEVER DISCARDS WORK: no `git stash` (banned here, CLAUDE.md), no `reset --hard`, no `checkout -B`
# over an existing branch. A checkout that would clobber uncommitted changes is git's refusal to
# make, and this script passes it through as a failed step. Refuses in the primary checkout — it
# is for worktrees.
#
# --fresh (#6272) is for a dispatch that must start on today's main — a governor athlete, whose
# slug is the target's basename and so repeats across cycles. Athlete branches stay on origin after
# their cycle PR lands (only governed-cycle-<n> merges), so without it a reused slug RESUMES a stale
# branch: refactor/decompose-steer-page-client sat 102 commits behind, carrying an extraction main
# had already squashed (#6192). The old `checkout -B` failed loudly on that push; resuming fails
# quietly, on a stale base. --fresh restores the loud failure before anything is checked out, and
# names the next free name rather than taking it silently — the branch an agent pushes is always
# the one it typed.

usage() { echo "usage: bash scripts/wt-start.sh <branch> [--fresh] [--issue N]" >&2; exit 2; }

BRANCH=""
ISSUE=""
FRESH=0
while [ $# -gt 0 ]; do
  case "$1" in
    --issue) [ $# -ge 2 ] || usage; ISSUE="$2"; shift 2 ;;
    --fresh) FRESH=1; shift ;;
    -h|--help) usage ;;
    -*) usage ;;
    *) [ -z "$BRANCH" ] || usage; BRANCH="$1"; shift ;;
  esac
done
[ -n "$BRANCH" ] || usage
[ -z "$ISSUE" ] || [[ "$ISSUE" =~ ^[0-9]+$ ]] || usage

STEP=""
# Run a step quietly; on failure print what it said and name the step.
run() {
  local out
  if ! out="$("$@" 2>&1)"; then
    [ -z "$out" ] || echo "$out" >&2
    echo "wt-start: failed at step '$STEP' — nothing was discarded." >&2
    exit 1
  fi
}

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

PRIMARY="$(cd "$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")" && pwd)"
if [ "$PRIMARY" = "$PWD" ]; then
  echo "wt-start: this is the primary checkout ($PWD) — it is for worktrees; refusing." >&2
  exit 1
fi

STEP=fetch
# --exit-code: 2 means the branch is not on origin, anything else non-zero is a real failure.
REMOTE_BRANCH=0
if git ls-remote --exit-code --heads origin "refs/heads/$BRANCH" >/dev/null 2>&1; then
  REMOTE_BRANCH=1
else
  rc=$?
  [ "$rc" -eq 2 ] || run git ls-remote --heads origin "refs/heads/$BRANCH"
fi

if [ "$FRESH" -eq 1 ]; then
  STEP=fresh
  where=""
  ! git show-ref --verify --quiet "refs/heads/$BRANCH" || where="locally"
  [ "$REMOTE_BRANCH" -eq 0 ] || where="${where:+$where and }on origin"
  if [ -n "$where" ]; then
    if ! heads="$(git ls-remote --heads origin 2>&1)"; then
      echo "$heads" >&2
      echo "wt-start: failed at step 'fresh' — nothing was checked out." >&2
      exit 1
    fi
    # Matched in-shell, never `… | grep -q`: grep quits at the first hit, the writer takes SIGPIPE
    # on a real origin's ~600 heads, and pipefail turns "taken" into "free".
    heads=$'\n'"$(cut -f2 <<<"$heads")"$'\n'
    n=2
    while git show-ref --verify --quiet "refs/heads/$BRANCH-$n" ||
      [[ "$heads" == *$'\n'"refs/heads/$BRANCH-$n"$'\n'* ]]; do
      n=$((n + 1))
    done
    echo "wt-start: $BRANCH already exists $where — --fresh never resumes a branch, and nothing was checked out." >&2
    echo "wt-start: re-run as: bash scripts/wt-start.sh $BRANCH-$n --fresh" >&2
    exit 1
  fi
fi

run git fetch -q origin "+refs/heads/main:refs/remotes/origin/main"
[ "$REMOTE_BRANCH" -eq 0 ] ||
  run git fetch -q origin "+refs/heads/$BRANCH:refs/remotes/origin/$BRANCH"

STEP=checkout
if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  [ "$(git symbolic-ref --quiet --short HEAD || true)" = "$BRANCH" ] || run git checkout -q "$BRANCH"
  # Catch up with the remote only when that loses nothing; a diverged branch is left as it is.
  if [ "$REMOTE_BRANCH" -eq 1 ] && git merge-base --is-ancestor HEAD "origin/$BRANCH"; then
    run git merge -q --ff-only "origin/$BRANCH"
  fi
elif [ "$REMOTE_BRANCH" -eq 1 ]; then
  run git checkout -q -b "$BRANCH" --track "origin/$BRANCH"
else
  # --no-track: an upstream of origin/main would aim a bare `git push` at main.
  run git checkout -q --no-track -b "$BRANCH" origin/main
fi

STEP=setup
run bash "$ROOT/scripts/worktree-setup.sh"

if [ -n "$ISSUE" ]; then
  STEP=issue
  if ! line="$(node "$ROOT/scripts/issues.mjs" show "$ISSUE" 2>&1)"; then
    echo "$line" >&2
    echo "wt-start: failed at step 'issue' — the branch is ready; only the issue lookup failed." >&2
    exit 1
  fi
  echo "$line"
fi

base="$(git merge-base HEAD origin/main | cut -c1-8)"
behind="$(git rev-list --count HEAD..origin/main)"
ahead="$(git rev-list --count origin/main..HEAD)"
if [ -x node_modules/.bin/biome ] && [ -x node_modules/.bin/rstest ]; then mods=ok; else mods=MISSING; fi
dirty="$(git status --porcelain | wc -l | tr -d ' ')"
echo "wt-start: $BRANCH · base $base · $ahead ahead, $behind behind origin/main · node_modules $mods · $dirty uncommitted"
