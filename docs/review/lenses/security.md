# Security lens

**Fires on:** `src/server/auth/`, `src/server/feedback`, `-api-routes.ts` files, `.github/`, `scripts/moneypenny/`,
`scripts/ship.sh`, `envelope.json`, `src/scripts/dashboard-insights-bridge.ts`, and any file naming a
token, secret or key. 96 code PRs since 2026-10-01.

**Kill rule:** under 0.1 confirmed findings per reviewed PR, or fewer than one in three surviving
the refuters, after 40 PRs: delete this file and leave the facet to `/security-review` and
`.claude/agents/red-team.md`.

**Size:** 3,834 characters.

Start from a goal: read another member's account, move the dial, run a build on a stranger's text,
reach a token. Ask whether the diff adds a step toward it. A finding names a concrete failure: the
actor, the file:line hops, what they gain, the smallest check that stops it. Without a reproduction
it is a hypothesis, labelled so. Zero findings is a normal answer: a reviewer told to find gaps
manufactures them.

`scripts/envelope-scan.mjs --check` says what is protected. It does not read the change.

## Smells

**Public input read without an author check.** Spot it: a `comments`, `events` or `issue.body` read
in `scripts/moneypenny/` that changes state and never asks who wrote it. Fix: `trustedComment`
(`scripts/moneypenny/gh.mjs:17`), and only events since the last trusted label. Not when: GitHub's
own permission already limits the surface (a label takes a writer). Real: #4155's dial reader took an
end date from any comment on the public tracking issue; #6505 closed it.

**Secret as a literal.** Spot it: a `*_SECRET`, `*_PASSWORD` or header value that is not read from
the environment, "safe because the network is private". Fix: the environment, with a provisioned
value. Not when: a fallback is named and dated in the PR as a transition. Real: #317 put the bots
bridge password in a public repo; #6256 moved it, keeping a documented fallback until the redeploy.

**Token wider than the job.** Spot it: a lane token or `permissions:` block granting `workflows` or
`contents: write` to steps that only comment (`.github/actions/app-token/action.yml`). Fix: scopes
per lane. Not when: the lane uses it, as the plan lane does. Boards the platter; protected. Real:
`.github/actions/app-token/action.yml:10` inherits all the App's permissions when a caller passes no
`permission-` input, and only `bots-catchup.yml` passes one.

**Open code before a secret.** Spot it: `npm ci` or a repo script above a `FLY_API_TOKEN` step in one
job. Fix: secret steps in a job with no install. Not when: every script the job calls is on a
protected path. Eric's call. Real: `.github/workflows/pipeline.yml:565` installs in the job that
holds the token at `:609`.

**Member data on a public surface.** Spot it: an issue body, comment or artifact built from app logs,
member emails or a brokerage screenshot. Fix: aggregate or redact first, failing closed. Not when: it
goes to a member-only route. Real: #4958's leak check fails a study card closed.

## Worth solving, or taste

Worth solving now, as `bug` + `fast-track`: an author gap on a public reader that changes state, a
literal secret, member data in public. Worth a platter item: token scope and job order, both on
protected paths. Taste: hardening a member-only form field the app owns, rate limits on internal
routes, "could be constant-time".

## How to run it

1. List the diff's files on the paths above. None: say so and stop.
2. For each, name who can reach the input and what the code does with it.
3. Walk one goal end to end before writing. One finding with a path beats five hypotheses.
4. Sort credentials, spend and anything outward-facing first, flagged as Eric's.

Refuters: trace (does a real actor reach it?) and, where a spec can hold it, reproduce. For YAML the
reproduce refuter says it cannot run, never that it refuted.
