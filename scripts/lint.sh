#!/usr/bin/env sh
# `npm run lint`: Biome over the whole tree, with the failing errors printed last.
#
# Why this is a script and not a bare `biome check .` (#7113): Biome prints at most 20 diagnostics
# by default, in path order, and the tree carries ~130 standing warnings (cognitive complexity is a
# warning on purpose, docs/COACHES.md: "visible in every lint run, never red"). A PR that added ONE
# error, a JSON file the formatter would rewrite, failed lint with a log showing 20 untouched
# files' warnings and never the error itself, so it read as "lint fails on code this PR never
# touched". The first pass keeps the warnings visible; only on failure, a second errors-only pass
# with no cap prints exactly what turned it red. Exit status is the first pass's: warnings never
# fail, errors always do.
set -u
biome check . && exit 0
echo
echo "✗ lint failed. The errors below are what failed it; the warnings above are advisory:"
biome check . --diagnostic-level=error --max-diagnostics=none
exit 1
