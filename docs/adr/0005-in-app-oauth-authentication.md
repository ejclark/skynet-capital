# ADR-0005: In-app Google/GitHub OAuth with an allowlist

- **Status:** Accepted
- **Date:** 2026-07-25

## Context

The dashboard was gated by a single shared password carried in the URL (`?key=`). That is ugly,
leaks into history/logs/bookmarks, and gives no per-person identity. With a public URL and a
group of family/friends of mixed technical ability, we need real per-user sign-in and control over
exactly who can view the board.

## Decision

We will implement OAuth 2.0 sign-in **directly in the server** (no auth vendor) for **Google and
GitHub**, with an **allowlist** by email (`SKYNET_ALLOWED_EMAILS`) or GitHub login. Identity is
carried in a stateless, HMAC-signed HttpOnly session cookie (keyed by `SKYNET_SESSION_SECRET`,
7-day expiry); the OAuth callback is CSRF-protected with a state cookie. Auth activates only when a
session secret and at least one provider are configured — otherwise the server keeps its legacy
password/open behavior for localhost, offline, and CI.

## Alternatives considered

- **Managed provider (Clerk/Auth0)** — less security code to own, but adds a vendor, keys, and an
  SDK awkward against a raw `node:http` server. Rejected for a small private app.
- **Clean-URL shared-password cookie login** — removes the URL wart but keeps one shared secret and
  no identity. Rejected; the ask was per-user.
- **Cloudflare Access / edge auth** — no app code, but adds an edge dependency in front of Fly.
  Rejected to keep the stack self-contained.
- **GitHub-only** — clean for developers, but non-technical family lack GitHub accounts. Google is
  the universal path; GitHub is offered alongside it.

## Consequences

- Clean URLs; per-user identity; only allowlisted people get in (fail-closed — an empty allowlist
  admits no one and warns at startup).
- ~~Onboarding a person is a `fly secrets set SKYNET_ALLOWED_EMAILS=…` (the full list, since it
  replaces) — no redeploy of code.~~ **Superseded (2026-08-14):** onboarding is now `/invite`, an
  owner-only page backed by an encrypted allowlist on the mounted volume. The env var remains, is
  unioned with the store, and is now the **owner tier** — the identities that may invite. See
  _Amendment_ below.
- We own the OAuth/session security surface (mitigated by signed cookies, a state-cookie CSRF
  guard, and unit tests).
- Google's consent screen in "testing" mode also requires each user be added as a Google **test
  user** — a second, provider-side gate to remember. GitHub has no such requirement.
- Authorization is coarse (allowed or not); there are no roles/per-user permissions yet.

## Amendment (2026-08-14) — the guest list moves to the volume

**Context.** Onboarding via `fly secrets set SKYNET_ALLOWED_EMAILS=…` had a sharp edge: the
secret *replaces* on write and is unreadable afterwards, so adding one person meant retyping the
whole list from memory, with "silently lock everyone out, including yourself" as the failure mode.
Eric hit it directly while adding a member.

**Decision.** The allowlist becomes a two-tier union:

| Tier | Where | May sign in | May invite |
|---|---|---|---|
| **Owner** | `SKYNET_ALLOWED_EMAILS` / `SKYNET_ALLOWED_GITHUB_LOGINS` (host env) | yes | **yes** |
| **Member** | `/data/allowlist.json` on the mounted volume, AES-256-GCM at rest | yes | no |

`resolveAuth` reads a live union of both, so an invite takes effect on the guest's next sign-in
with no redeploy and no restart. `/invite` serves the owner-only guest list.

**Why the volume rather than the repo.** The repo would make the list durable and reviewable, but
would put real people's addresses in git history permanently and unrevocably. The volume is where
this app already keeps member data — including Alpaca credentials, which are strictly more
sensitive than an email — so the guest list was the odd one out, not the risky one. It is
encrypted with the same `SKYNET_STORE_SECRET`, via the shared `secure-envelope` module extracted
from the participant store.

**Consequences.**

- Adding a member is a page, not a command, and cannot truncate the list.
- The env tier is deliberately the harder one to change (host access), which is what stops an
  invited friend widening the gate — the privilege split *is* the security model here.
- Every entry records who invited it, an audit trail for a gate that admits people to other
  members' trade data.
- Break-glass survives: a lost, corrupt, or unreadable volume degrades to the env list rather than
  locking the owner out. An unreadable store admits **nobody** from that source and reports why.
- Invites are off (loudly, in the page) when `SKYNET_STORE_SECRET` is unset — the same fail-closed
  rule the participant store already applies to credentials.
- Authorization is still coarse beyond these two tiers; there are no per-member roles.
