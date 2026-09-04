#!/usr/bin/env bash
set -euo pipefail

# Materialize Claude's SSH commit-signing key from the GIT_SIGNING_KEY environment
# secret and configure git so every commit this session is signed. The private key
# never lives in the repo — only in the GIT_SIGNING_KEY secret set in the Claude Code
# environment config. Wired to run at session start via the SessionStart hook in
# .claude/settings.json. Idempotent; safe to run repeatedly.
#
# If GIT_SIGNING_KEY is absent (e.g. a container started before the secret existed),
# the script no-ops so nothing breaks — commits are simply left unsigned that session.
#
# It also registers the repo's custom merge drivers first (#1324). That is not what the name
# says — the honest name is now "set up this session's git" — but the hook that runs this script
# lives in .claude/settings.json, an envelope-protected file, so renaming it costs Eric's
# attention for a cosmetic gain. The rename is filed in docs/IDEAS.md instead. Registration goes
# ABOVE the GIT_SIGNING_KEY early-exit deliberately: that variable is unset in every CI lane, and
# the lanes are exactly where the unregistered driver was costing merges.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "${SCRIPT_DIR}/register-merge-drivers.sh" || true

KEY_DIR="${HOME}/.ssh"
# The harness points user.signingkey at /home/claude/.ssh/commit_signing_key.pub; keep
# the key there when that home exists, else fall back to the running user's ~/.ssh.
[ -d /home/claude/.ssh ] && KEY_DIR="/home/claude/.ssh"
KEY_FILE="${KEY_DIR}/commit_signing_key"
SIGNERS="${KEY_DIR}/allowed_signers"

if [ -z "${GIT_SIGNING_KEY:-}" ]; then
  echo "setup-commit-signing: GIT_SIGNING_KEY not set — skipping (commits stay unsigned)."
  exit 0
fi

mkdir -p "${KEY_DIR}"
printf '%s\n' "${GIT_SIGNING_KEY}" > "${KEY_FILE}"   # trailing newline: OpenSSH keys require it
chmod 600 "${KEY_FILE}"
ssh-keygen -y -f "${KEY_FILE}" > "${KEY_FILE}.pub"   # derive public half for local verification
chmod 644 "${KEY_FILE}.pub"

git config --global gpg.format ssh
git config --global user.signingkey "${KEY_FILE}"
git config --global commit.gpgsign true
git config --global user.name  "Claude"
git config --global user.email "noreply@anthropic.com"

# allowed_signers → local `git log --show-signature` / %G? reads "Good" instead of erroring.
printf 'noreply@anthropic.com %s\n' "$(cat "${KEY_FILE}.pub")" > "${SIGNERS}"
git config --global gpg.ssh.allowedSignersFile "${SIGNERS}"

echo "setup-commit-signing: signing configured (${KEY_FILE})"
