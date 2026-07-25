# ADR-0006: Publish the OAuth consent screen; the allowlist is the access gate

- **Status:** Accepted
- **Date:** 2026-07-25

## Context

ADR-0005 chose in-app Google/GitHub OAuth with an app-level allowlist. In practice the Google
consent screen defaults to **"Testing"** mode, which only admits accounts pre-added as Google
**Test users**. That created a bad operating model: every new participant appeared to require a
second, Google-side setup step, and it blurred who owns what — the app owner started to feel like
each *user* had to do developer-console work. They do not: end users only ever click "Sign in with
Google." The friction was entirely the Testing-mode test-user list.

The app requests only **non-sensitive** scopes (`openid email profile`) — no Gmail, Drive, or other
restricted data — so Google does not require app verification to publish it.

## Decision

We will **publish** the Google OAuth consent screen to production (out of Testing), and treat
`SKYNET_ALLOWED_EMAILS` (plus `SKYNET_ALLOWED_GITHUB_LOGINS`) as the **sole authorization gate**.
Google authenticates identity; our allowlist authorizes access. All OAuth provider/console setup is
a **one-time, owner-only** task; adding or removing a participant is only a `fly secrets set` on the
allowlist — nothing on Google's side.

## Alternatives considered

- **Stay in Testing and maintain the Google Test-user list** — forces a second per-user step in a
  developer console and confuses ownership. Rejected; it was the source of the friction.
- **GitHub-only** — no consent screen, no publish, no test users, so operationally simplest — but
  less-technical family (Bruce, Joe) may lack GitHub accounts. Kept as the secondary provider, not
  the primary.
- **A managed auth provider (Clerk/Auth0)** — hides the consent-screen mechanics, but reintroduces
  the vendor already rejected in ADR-0005. Rejected.

## Consequences

- End users get a normal login: click "Sign in with Google," done. No console, no setup.
- Publishing does **not** open the board to the world — the allowlist still decides who gets in;
  a signed-in but non-allowlisted account is refused (403).
- Because scopes are non-sensitive, publishing needs no Google verification; users may see a brief
  "unverified app" notice, acceptable for a private family app.
- The owner does the OAuth client + publish once; ongoing membership is allowlist-only, matching the
  intended "email arrives → append to allowlist → they sign in" flow.
- Trust now rests on the allowlist alone — a leaked/guessable allowlisted address is the whole
  boundary. Acceptable at this scale; revisit if the audience grows or roles are needed.
