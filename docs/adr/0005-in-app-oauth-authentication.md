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
- Onboarding a person is a `fly secrets set SKYNET_ALLOWED_EMAILS=…` (the full list, since it
  replaces) — no redeploy of code.
- We own the OAuth/session security surface (mitigated by signed cookies, a state-cookie CSRF
  guard, and unit tests).
- Google's consent screen in "testing" mode also requires each user be added as a Google **test
  user** — a second, provider-side gate to remember. GitHub has no such requirement.
- Authorization is coarse (allowed or not); there are no roles/per-user permissions yet.
