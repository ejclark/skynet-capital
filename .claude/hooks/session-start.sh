#!/usr/bin/env bash
# SessionStart hook (Claude Code on the web) — make a fresh container ready to verify BEFORE the
# first turn, so no session spends its own minutes on setup.
#
# Why (docs/LESSONS.md, 2026-09-04): a remote session lost several minutes to a dependency-install
# detour, separate from (and originally confused with) a CI caching bug fixed elsewhere. This
# session's `origin/main` was a snapshot that had genuinely diverged from the real tip — not simply
# old, but pointing at history the real branch no longer contains — so the first install ran against
# stale lockfiles, several dev-only packages were missing, and multiple verify rounds went red before
# the mismatch was diagnosed.
#
# Two moves fix it: refresh the ref before the session's own ship-loop branches off it (belt), and
# install both trees against the lockfiles at that refreshed tip before the first turn (suspenders).
# Deliberately NO custom caching layer here: `npm install` (not `npm ci`) is already a fast no-op
# when nothing changed — the session-start-hook skill's own guidance — so there is nothing to
# reinvent. Remote-only, idempotent by npm's own behavior, non-interactive, synchronous (the
# session starts once deps are ready). The harness caches the container after this hook completes,
# so a later session in the same container starts with node_modules already present.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
cd "$ROOT"

if git fetch --quiet origin main 2>/dev/null; then
  echo "session-start: origin/main → $(git rev-parse --short origin/main)"
else
  echo "session-start: git fetch origin main failed — branch off origin/main only after a manual fetch"
fi

echo "session-start: installing root deps…"
npm install --no-audit --no-fund --include=dev --loglevel=error

if [ -f app/package-lock.json ]; then
  echo "session-start: installing app/ deps…"
  (cd app && npm install --no-audit --no-fund --include=dev --loglevel=error)
fi

echo "session-start: ready"
