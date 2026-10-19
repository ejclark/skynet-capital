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
# SHARE THE FILES, NEVER THE DIRECTORY (#5548). Each worktree used to get a full copy of both
# installs — ~1.2GB on a filesystem with no copy-on-write — so ten agents filled a cloud session's
# disk (a worktree without them is ~130MB). Now the install is reused when it is the right one:
#
#   same lockfile    the primary's install is cloned by the cheapest means the filesystem has:
#                    a reflink (copy-on-write: APFS `cp -c`, btrfs/xfs `--reflink=always`), else a
#                    HARD-LINK copy (`cp -al`: every file shares an inode, ~0 extra bytes), else a
#                    plain copy. The directories are the worktree's own.
#   lockfile differs the primary's install is not what this worktree's lock describes, so there is
#   or no install   nothing safe to share: a real `npm ci` runs here (CI=1, so husky leaves the
#                    shared git config alone).
#
# "Same" is decided by scripts/worktree-lock-match.mjs against npm's hidden lockfile, i.e. what is
# really on disk — not by comparing package-lock.json files, which says nothing about a primary
# sitting on a stale branch.
#
# NEVER A SYMLINK. This script once symlinked the primary's node_modules. On 2026-10-09 an athlete
# ran `npm ci` inside its worktree; npm deleted the install THROUGH the link and emptied the
# primary's node_modules — breaking the primary and every other worktree linked to it for about an
# hour (#4943's fix track; docs/LESSONS.md). Hard links keep that property: `npm ci` unlinks a
# worktree's names and cannot reach the primary's. Verified against local tarballs (#5548): `npm
# install` swapping a package, and `npm ci`, left the primary's files untouched, because npm writes
# new files and removes old names rather than editing in place. The one in-place writer is `npm
# rebuild` — a package's own lifecycle script may append to its files — so don't run it in a
# worktree. Two paths are deliberately NOT shared: `.cache` (tool caches are rewritten in place)
# and `.package-lock.json` (npm truncates and rewrites it on every install); each worktree gets a
# real copy of the second and none of the first.
#
# The copy is built beside its destination and moved into place only when complete and its `.bin`
# links resolve, so an interrupted run never leaves a half-populated node_modules (an earlier
# agent hit a missing node_modules/.bin/esbuild after a partial copy).
#
# No cleanup step: node_modules/ is gitignored, so the copy is invisible to git and
# `git worktree remove` (scripts/worktree-sweep.mjs) clears it with the rest.
#
# Idempotent; safe to run repeatedly, and a no-op in the primary checkout. A worktree still
# carrying an old symlink is converted to its own install.

cd "$(git rev-parse --show-toplevel)"

PRIMARY="$(cd "$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")" && pwd)"
HERE="$PWD"

have_shims() { [ -x node_modules/.bin/biome ] && [ -x node_modules/.bin/rstest ] && [ ! -L node_modules ]; }
have_app_modules() { [ -d app/node_modules/@testing-library ] && [ ! -L app/node_modules ]; }

# Copy `src` to the new path `dst`, cheapest honest means first; prints the means used.
# (GNU `cp -c` means --preserve=context, so the APFS clone flag is only tried on macOS.)
clone_dir() {
  local src="$1" dst="$2"
  if [ "$(uname -s)" = "Darwin" ] && cp -cR "$src" "$dst" 2>/dev/null; then echo "reflink"; return 0; fi
  rm -rf "$dst"
  if cp -a --reflink=always "$src" "$dst" 2>/dev/null; then echo "reflink"; return 0; fi
  rm -rf "$dst"
  if cp -al "$src" "$dst" 2>/dev/null; then echo "hard-link"; return 0; fi
  rm -rf "$dst"
  cp -a "$src" "$dst" && echo "copy"
}

# A tool shim whose target is missing makes the install look fine and fail at the first call.
bin_links_resolve() {
  [ -d "$1/.bin" ] || return 1
  [ -z "$(find -L "$1/.bin" -maxdepth 1 -type l 2>/dev/null | head -1)" ]
}

# Give `dir` (node_modules or app/node_modules) an install: the primary's when it is the right
# one, else a real `npm ci` of this worktree's lock. A symlink — the old arrangement — is removed
# (the link only, never its target); a directory holding nothing but a tool-created `.cache` is not
# an install and is replaced; any other real install is left alone.
provide() {
  local dir="$1" lock="$2" prefix="$3"
  if [ -L "$dir" ]; then
    rm "$dir"
  elif [ -d "$dir" ]; then
    if [ -n "$(ls -A "$dir" | grep -vx '.cache')" ]; then
      echo "worktree-setup: a real $dir exists; leaving it alone."
      return 0
    fi
    rm -rf "$dir"
  fi

  local why="" drift="" tmp how
  if [ ! -d "$PRIMARY/$dir" ] || [ -z "$(ls -A "$PRIMARY/$dir")" ]; then
    why="the primary checkout ($PRIMARY) has no $dir"
  elif ! drift="$(node "$HERE/scripts/worktree-lock-match.mjs" "$lock" "$PRIMARY/$dir")"; then
    why="$lock differs from the primary's install (${drift//$'\n'/; })"
  else
    tmp="$dir.setup-$$"
    rm -rf "$tmp"
    if how="$(clone_dir "$PRIMARY/$dir" "$tmp")"; then
      rm -rf "$tmp/.cache"
      # npm rewrites its hidden lockfile in place on every install: never a shared inode.
      if [ -f "$PRIMARY/$dir/.package-lock.json" ]; then
        rm -f "$tmp/.package-lock.json"
        cp -p "$PRIMARY/$dir/.package-lock.json" "$tmp/.package-lock.json"
      fi
      if bin_links_resolve "$tmp"; then
        mv "$tmp" "$dir"
        echo "worktree-setup: $dir from $PRIMARY ($how; lockfile matches; npm ci here cannot touch the primary)."
        return 0
      fi
      why="the copy of $dir came out with dangling .bin links"
    else
      why="copying $dir from the primary failed"
    fi
    rm -rf "$tmp"
  fi

  echo "worktree-setup: $why — running npm ci in $HERE${prefix:+ ($prefix)}."
  # Belt: npm ci through a link is the 2026-10-09 incident.
  [ ! -L "$dir" ] || { echo "worktree-setup: $dir is a symlink; refusing to run npm ci through it."; return 1; }
  # shellcheck disable=SC2086  # $prefix is "" or the two words "--prefix app"
  CI=1 npm ci --no-audit --no-fund $prefix
  echo "worktree-setup: $dir installed here with npm ci."
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

have_shims || provide node_modules package-lock.json ""
if ! have_shims; then
  echo "worktree-setup: node_modules still lacks the tool shims — run 'npm ci' in $HERE."
  exit 1
fi
have_app_modules || provide app/node_modules app/package-lock.json "--prefix app"

echo "worktree-setup: node_modules ready (shims verified)."
