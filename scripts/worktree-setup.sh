#!/usr/bin/env bash
set -euo pipefail

# Provision an isolated athlete worktree so the gate can actually run in it.
#
# A worktree created by `isolation: worktree` is a fresh checkout with no node_modules,
# so `node_modules/.bin` has none of the tool shims (biome, tsx, rstest). Husky's hooks
# and the two subprocess-path specs (app-version, dep-graph) then fail with exit 127 —
# a failure that reads like the athlete's own mistake and cost every athlete a detour
# to re-solve (docs/IDEAS.md, "Isolated-worktree node_modules/.bin is empty").
#
# Symlinking the primary checkout's node_modules is sound here because worktrees of one
# repo share a commit of package-lock.json: the resolved tree is the same tree. It is
# also ~200x faster than a per-worktree `npm ci`, which matters when a feast dispatches
# several athletes at once.
#
# No cleanup step: node_modules/ is gitignored, so the symlink is invisible to git and
# `git worktree remove` clears it with the rest.
#
# Idempotent; safe to run repeatedly, and a no-op in the primary checkout.

cd "$(git rev-parse --show-toplevel)"

# Belt for a lane whose SessionStart hook did not fire (#1324) — git shares one repository config
# across every worktree, so this is usually a no-op re-write of what setup-commit-signing.sh
# already registered. Above the early-exits below on purpose: a worktree that already has its
# shims still needs the driver.
bash ./scripts/register-merge-drivers.sh || true   # cwd is the worktree root, set just above

PRIMARY="$(cd "$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")" && pwd)"
HERE="$PWD"

have_shims() { [ -x node_modules/.bin/biome ] && [ -x node_modules/.bin/rstest ]; }

if have_shims; then
  echo "worktree-setup: node_modules already usable — nothing to do."
  exit 0
fi

if [ "$PRIMARY" = "$HERE" ]; then
  echo "worktree-setup: this IS the primary checkout and its node_modules is incomplete."
  echo "worktree-setup: run 'npm ci' here — a worktree cannot borrow from itself."
  exit 1
fi

if [ -e node_modules ] && [ ! -L node_modules ]; then
  echo "worktree-setup: a real node_modules exists but lacks shims; leaving it alone."
  echo "worktree-setup: run 'npm ci' in $HERE."
  exit 1
fi

if [ ! -d "$PRIMARY/node_modules" ]; then
  echo "worktree-setup: primary checkout ($PRIMARY) has no node_modules to borrow."
  echo "worktree-setup: run 'npm ci' there first, or 'npm ci' here."
  exit 1
fi

rm -f node_modules                                   # a stale symlink, if any
ln -s "$PRIMARY/node_modules" node_modules

if ! have_shims; then
  echo "worktree-setup: linked $PRIMARY/node_modules but the shims are still missing."
  echo "worktree-setup: the primary's install looks incomplete — run 'npm ci' there."
  exit 1
fi

echo "worktree-setup: linked node_modules → $PRIMARY/node_modules (shims verified)."
