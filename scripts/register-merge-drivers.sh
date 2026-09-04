#!/usr/bin/env bash
set -euo pipefail

# Register this repo's custom git merge drivers in the local .git/config.
#
# WHY (#1324): .gitattributes already says `src/domain/market-events-data.ts merge=market-events`
# and scripts/merge-market-events.mjs already implements that driver — but git looks the driver's
# COMMAND up in .git/config, which is not a tracked file, so a fresh clone or a CI checkout has the
# attribute pointing at a driver that does not exist and silently falls back to the default
# line-based merge. Measured cost of that gap on 2026-09-04: of 70 research PRs merged since 09-03,
# 47 touched that one file, 22 were flagged conflicted, 12 escalated to Eric — and the flagged ones
# took a median 13.4h from flag to merge against a median 1 min for the rest. Every one of those
# conflicts was two independent appends git's line merge could not tell apart.
#
# Registration is deliberately per-clone and per-lane rather than a one-time manual step: it is
# called from scripts/setup-commit-signing.sh (the SessionStart hook every Claude session runs, in
# this checkout and in CI lanes alike) and from scripts/worktree-setup.sh, so the driver is live
# wherever a `git merge` might actually happen. This is the same pattern npm-merge-driver used —
# install from something every clone already runs, because .git/config can never be committed.
#
# Local, never `--global`: a global write would leak into unrelated repos on a shared runner, and
# git shares one repository config across all worktrees anyway, so local covers every athlete
# worktree from a single registration. Idempotent — `git config` overwrites in place.
#
# Degrades quietly: outside a git work tree (or with no .git to write to) this is a no-op rather
# than an error, because a SessionStart hook failing is far more expensive than an unregistered
# driver.

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "register-merge-drivers: not inside a git work tree — skipping."
  exit 0
fi

ROOT="$(git rev-parse --show-toplevel)"
DRIVER="${ROOT}/scripts/merge-market-events.mjs"

if [ ! -f "${DRIVER}" ]; then
  echo "register-merge-drivers: ${DRIVER} missing — skipping."
  exit 0
fi

# %O/%A/%B are git's placeholders for the ancestor, ours (also the output path) and theirs.
if git config merge.market-events.driver "node '${DRIVER}' %O %A %B" 2>/dev/null &&
  git config merge.market-events.name "market-events array merge (object-level, not line-level)" 2>/dev/null; then
  echo "register-merge-drivers: merge.market-events registered."
else
  echo "register-merge-drivers: could not write git config — skipping (merges use the default driver)."
fi
