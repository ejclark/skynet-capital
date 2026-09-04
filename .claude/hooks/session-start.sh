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
#
# mise (2026-09-04, "lean into mise") provisions the pinned Node version from `mise.toml` before
# either install runs — this container ships Node 22 while `mise.toml`/`package.json#engines` say
# 24, and nothing previously corrected that (docs/IDEAS.md had it filed as "needs Eric to change an
# environment setting," which was the wrong framing — nothing about a container's base Node needs
# fixing at the platform level when the repo's own tool manager can just install the right one).
# Installed from a GitHub release tarball, NOT `curl https://mise.run | sh` — verified live in this
# exact environment that mise.run itself is blocked by this session's own egress proxy (a 403 at
# the CONNECT level) while a direct `github.com/.../releases/download/...` fetch succeeds; mise
# ONCE OBTAINED also degrades its own auxiliary endpoints (mise.jdx.dev, mise-versions.jdx.dev) and
# still installs Node correctly — confirmed by an actual `mise install` run against this repo's own
# `mise.toml`, which produced a working `node -v` → v24.20.0. `mise activate bash --shims` (mise's
# documented pattern for non-interactive scripts, not the interactive prompt-hook form) is written
# to `$CLAUDE_ENV_FILE` so every LATER Bash call in this session also resolves `node`/`npm` through
# mise's shims, not just this hook's own subshell. Every mise step degrades gracefully — a failure
# here (a differently-configured proxy elsewhere, a version bump making the pinned mise release
# stale) falls back to whatever Node the container already has, exactly the posture the rest of
# this hook already uses; this is a real improvement attempt, not a guarantee for every network.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
cd "$ROOT"

MISE_VERSION="2026.9.0"
export PATH="$HOME/.local/bin:$PATH"
if ! command -v mise >/dev/null 2>&1; then
  echo "session-start: installing mise ${MISE_VERSION}…"
  arch="$(uname -m)"; case "$arch" in x86_64) arch=x64 ;; aarch64|arm64) arch=arm64 ;; esac
  mkdir -p "$HOME/.local/bin"
  if curl -sSL "https://github.com/jdx/mise/releases/download/v${MISE_VERSION}/mise-v${MISE_VERSION}-linux-${arch}.tar.gz" \
       | tar xz -C /tmp 2>/dev/null && cp /tmp/mise/bin/mise "$HOME/.local/bin/mise"; then
    :
  else
    echo "session-start: mise install failed — continuing under whatever Node is already present"
  fi
fi

if command -v mise >/dev/null 2>&1; then
  if mise install --quiet 2>/dev/null; then
    eval "$(mise activate bash --shims)"
    if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
      echo 'export PATH="'"$HOME"'/.local/bin:'"$HOME"'/.local/share/mise/shims:$PATH"' >> "$CLAUDE_ENV_FILE"
    fi
    echo "session-start: node $(node -v) via mise (mise.toml)"
  else
    echo "session-start: mise install (tools) failed — continuing under whatever Node is already present"
  fi
fi

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
