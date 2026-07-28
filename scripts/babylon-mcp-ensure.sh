#!/usr/bin/env bash
# SessionStart guard: make sure the Babylon MCP server is serving on :4000, provisioning it
# in the BACKGROUND if not. Non-blocking (never delays session start) and idempotent. The repo's
# .mcp.json points Claude at http://localhost:4000/mcp; its tools load at session start, so a
# cold-container provision becomes available in the NEXT session.
set -euo pipefail

# already up → nothing to do
if curl -sf http://localhost:4000/mcp >/dev/null 2>&1; then
  exit 0
fi

# don't risk the session's fixed disk allowance — the index is ~1GB+
avail=$(df -Pk "$HOME" 2>/dev/null | awk 'NR==2{print $4}')
if [ "${avail:-0}" -lt 2500000 ]; then
  echo '{"systemMessage":"babylon-mcp: skipped (low disk). Run scripts/setup-babylon-mcp.sh, or better, add it to the environment setup script."}'
  exit 0
fi

# provision + start in the background so session start is never blocked
nohup bash "$(dirname "$0")/setup-babylon-mcp.sh" >/tmp/babylon-mcp-setup.log 2>&1 &
echo '{"systemMessage":"babylon-mcp: provisioning on :4000 in the background — its tools load in your NEXT session (log: /tmp/babylon-mcp-setup.log)."}'
