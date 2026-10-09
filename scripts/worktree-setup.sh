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
# The app has its own install (app/package.json): `npm run verify` runs typecheck:app and
# test:app, which need app/node_modules too (#4954).
#
# CLONE, NEVER LINK. This script used to symlink the primary checkout's node_modules. On
# 2026-10-09 an athlete ran `npm ci` inside its worktree; npm deleted the install THROUGH the
# link and emptied the primary's node_modules — breaking the primary checkout and every other
# worktree linked to it for about an hour (#4943's fix track; docs/LESSONS.md). A copy-on-write
# clone (APFS `cp -c`, `--reflink` elsewhere) costs ~5s, almost no disk, and gives each worktree
# its own install, so a stray `npm ci` can only ever wipe its own copy. Worktrees of one repo
# share a commit of package-lock.json, so the cloned tree is the right tree.
#
# No cleanup step: node_modules/ is gitignored, so the clone is invisible to git and
# `git worktree remove` clears it with the rest.
#
# Idempotent; safe to run repeatedly, and a no-op in the primary checkout. A worktree still
# carrying an old symlink is converted to a clone.

cd "$(git rev-parse --show-toplevel)"

PRIMARY="$(cd "$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")" && pwd)"
HERE="$PWD"

have_shims() { [ -x node_modules/.bin/biome ] && [ -x node_modules/.bin/rstest ] && [ ! -L node_modules ]; }
have_app_modules() { [ -d app/node_modules/@testing-library ] && [ ! -L app/node_modules ]; }

# Copy-on-write where the filesystem allows it; a plain copy otherwise (slower, still safe).
clone_dir() {
  local src="$1" dst="$2"
  cp -cR "$src" "$dst" 2>/dev/null ||
    cp -R --reflink=auto "$src" "$dst" 2>/dev/null ||
    cp -R "$src" "$dst"
}

# Give `dir` (node_modules or app/node_modules) its own clone of the primary's. A symlink — the
# old arrangement — is removed (the link only, never its target); a directory holding nothing but
# a tool-created `.cache` is not an install and is replaced; any other real install is left alone.
provide() {
  local dir="$1" label="$2"
  if [ -L "$dir" ]; then
    rm "$dir"
  elif [ -d "$dir" ]; then
    if [ -n "$(ls -A "$dir" | grep -vx '.cache')" ]; then
      echo "worktree-setup: a real $dir exists; leaving it alone."
      return 0
    fi
    rm -rf "$dir"
  fi
  if [ ! -d "$PRIMARY/$dir" ] || [ -z "$(ls -A "$PRIMARY/$dir")" ]; then
    echo "worktree-setup: primary checkout ($PRIMARY) has no $dir to clone."
    echo "worktree-setup: run 'npm ci${label}' there first, or here."
    return 1
  fi
  clone_dir "$PRIMARY/$dir" "$dir"
  echo "worktree-setup: cloned $dir from $PRIMARY (copy-on-write; npm ci here cannot touch the primary)."
}

if [ "$PRIMARY" = "$HERE" ]; then
  if have_shims; then
    echo "worktree-setup: this is the primary checkout — nothing to do."
    exit 0
  fi
  echo "worktree-setup: this IS the primary checkout and its node_modules is incomplete."
  echo "worktree-setup: run 'npm ci' here — a worktree cannot borrow from itself."
  exit 1
fi

have_shims || provide node_modules ""
if ! have_shims; then
  echo "worktree-setup: node_modules still lacks the tool shims — run 'npm ci' in $HERE."
  exit 1
fi
have_app_modules || provide app/node_modules " --prefix app"

echo "worktree-setup: node_modules ready (shims verified)."
