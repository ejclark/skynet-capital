#!/usr/bin/env bash
set -euo pipefail

# Give Dependabot-triggered runs the two secrets the dependency reviewer needs — one command, run on
# Eric's own machine (never in a session: the values must not pass through a transcript).
#
# WHY (#4053, 2026-09-29): a Dependabot-triggered run can read ONLY the Dependabot secret store —
# never the Actions secrets — so moneypenny-events.yml's `dep-warden` job died with
# "private-key must be non-empty" and 10 dependency PRs were merged by hand that day. The fix is the
# same two values in a second store; this script makes that one step instead of five, and
# `--also-actions` writes the Actions store from the same input so a rotation can't leave the two
# stores out of sync.
#
#   scripts/setup-dependabot-secrets.sh [--pem PATH] [--also-actions] [--dry-run]
#
#   --pem PATH       the Skynet Envoy App private key. Default: the newest
#                    ~/Downloads/skynet-envoy*.private-key.pem (where GitHub's "Generate a private
#                    key" button saves it). An App can hold several keys at once, so generating a new
#                    one never breaks the key the Actions secret already holds.
#   --also-actions   write the Actions secrets too, from the same values (use when rotating).
#   --dry-run        print what would run; set nothing.
#
# Already-open Dependabot PRs are NOT re-triggered: dep-warden fires on `pull_request: opened` only,
# and `@dependabot recreate` rebuilds the same PR (a `synchronize`, not an `opened`), so it would not
# fire either. The secrets cover every PR Dependabot opens from here on; a session clears the backlog.
#
# Needs: `gh` logged in as a repo admin; `claude` on PATH for the token step (else paste one).

REPO="${GITHUB_REPOSITORY:-ejclark/skynet-capital}"
APP_KEYS_URL="https://github.com/settings/apps/skynet-envoy#private-key"
pem="" also_actions=0 dry=0

while [ $# -gt 0 ]; do case "$1" in
  --pem) pem="$2"; shift 2 ;;
  --also-actions) also_actions=1; shift ;;
  --dry-run) dry=1; shift ;;
  -h|--help) sed -n '4,27p' "$0"; exit 0 ;;
  *) echo "setup-dependabot-secrets: unknown arg $1" >&2; exit 1 ;;
esac; done

say() { printf '\n▸ %s\n' "$*"; }
die() { printf '✗ %s\n' "$*" >&2; exit 1; }
# set_secret NAME — value on stdin, written to the Dependabot store (and Actions with --also-actions).
set_secret() {
  local name="$1" value; value="$(cat)"
  local stores="dependabot"; [ "$also_actions" = 1 ] && stores="dependabot actions"
  for app in $stores; do
    if [ "$dry" = 1 ]; then echo "  (dry-run) gh secret set $name --app $app --repo $REPO  [${#value} chars]"
    else printf '%s' "$value" | gh secret set "$name" --app "$app" --repo "$REPO" >/dev/null
      echo "  ✓ $name → $app secrets"; fi
  done
}

# ── 0. preflight ────────────────────────────────────────────────────────────────────────────────────
command -v gh >/dev/null || die "gh is not installed — https://cli.github.com"
gh auth status >/dev/null 2>&1 || die "gh is not logged in — run: gh auth login"
[ "$(gh api "repos/$REPO" --jq .permissions.admin 2>/dev/null)" = "true" ] \
  || die "the gh login is not an admin of $REPO — secrets need admin"

# ── 1. APP_PRIVATE_KEY ──────────────────────────────────────────────────────────────────────────────
say "1/3  APP_PRIVATE_KEY (the Skynet Envoy App's private key)"
find_pem() { ls -t "$HOME"/Downloads/skynet-envoy*.private-key.pem 2>/dev/null | head -1 || true; }
[ -n "$pem" ] || pem="$(find_pem)"
if [ -z "$pem" ]; then
  echo "  No key file found in ~/Downloads. Opening the App's key page — click \"Generate a private key\"."
  echo "  $APP_KEYS_URL"
  (command -v open >/dev/null && open "$APP_KEYS_URL") || (command -v xdg-open >/dev/null && xdg-open "$APP_KEYS_URL") || true
  read -r -p "  Press Enter once the .pem has downloaded… " _
  pem="$(find_pem)"
fi
[ -f "$pem" ] || die "no key file (pass --pem PATH)"
grep -q -- "-----BEGIN .*PRIVATE KEY-----" "$pem" || die "$pem does not look like a PEM private key"
echo "  using $pem"
set_secret APP_PRIVATE_KEY < "$pem"

# ── 2. CLAUDE_CODE_OAUTH_TOKEN ──────────────────────────────────────────────────────────────────────
say "2/3  CLAUDE_CODE_OAUTH_TOKEN (your Claude login token for the reviewer)"
if command -v claude >/dev/null; then
  echo "  Running \`claude setup-token\` — finish the browser login, then copy the token it prints."
  [ "$dry" = 1 ] || claude setup-token || true
else
  echo "  \`claude\` not on PATH — run \`claude setup-token\` wherever it is installed and copy the token."
fi
read -r -s -p "  Paste the token (hidden) and press Enter: " token; echo
[ -n "$token" ] || die "empty token"
printf '%s' "$token" | set_secret CLAUDE_CODE_OAUTH_TOKEN
unset token

# ── 3. verify ───────────────────────────────────────────────────────────────────────────────────
say "3/3  verify"
if [ "$dry" = 0 ]; then
  have="$(gh secret list --app dependabot --repo "$REPO" --json name --jq '.[].name')"
  for n in APP_PRIVATE_KEY CLAUDE_CODE_OAUTH_TOKEN; do
    grep -qx "$n" <<<"$have" || die "$n is missing from the Dependabot secrets after setting it"
  done
  echo "  ✓ both present in the Dependabot secrets"
fi
say "Done. Every Dependabot PR opened from now on gets reviewed without you."
