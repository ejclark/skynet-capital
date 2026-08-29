# In-App Feedback → GitHub Issues

Signed-in league members can file bugs, feature requests, and ideas from inside the app at
**`/feedback`** — no GitHub account or repo access required. A single server-side bot token files a
labelled issue on `ejclark/skynet-capital`, so friends and family never need collaborator access to
the private repo.

**The feature is token-gated.** Until `SKYNET_FEEDBACK_GITHUB_TOKEN` is set the form still renders,
but a submission returns a friendly "feedback isn't switched on yet" message instead of filing an
issue. The instant the token is present, submissions go live — no code change, no redeploy beyond
picking up the new secret.

## One-time setup

### 1. Create a scoped bot token (fine-grained PAT)

Least privilege: a token that can only write issues on this one repo.

1. Go to **Settings → Developer settings → Personal access tokens → Fine-grained tokens →
   Generate new token** (<https://github.com/settings/personal-access-tokens/new>).
2. **Token name:** `skynet-capital-feedback-bot`.
3. **Expiration:** pick a horizon you'll rotate on (90 days or a custom year) and note it.
4. **Resource owner:** `ejclark`.
5. **Repository access:** *Only select repositories* → **`ejclark/skynet-capital`**.
6. **Permissions → Repository permissions → Issues:** *Read and write*. Leave everything else at
   *No access* (Metadata → Read-only selects automatically; that's expected).
7. **Generate token** and copy it — GitHub shows it once. It looks like `github_pat_…`.

Optional: generate the token from a dedicated bot GitHub account so issues are attributed to the
bot rather than you. Not required — each issue carries a submitter footer
("Submitted from the app by **Tony** (member `<opaque id>`)"). The repo is public, so the footer
never contains a member's email — only their OAuth profile name (may or may not be their real
name) alongside a stable opaque marker the app can correlate even across a future rename
(`opaqueMemberId` in `src/server/feedback-attribution.ts`; the privacy spec pins the email half).

### 2. Give the token to the app

The server reads `SKYNET_FEEDBACK_GITHUB_TOKEN` at startup (`resolveFeedback` in
`src/server/feedback-service.ts`).

```sh
fly secrets set SKYNET_FEEDBACK_GITHUB_TOKEN='github_pat_…'
```

Fly stores it encrypted and rolls the machine to pick it up. The token never lives in the repo or
in code — only as a host secret, exactly like the Alpaca keys.

- **Different target repo?** Also set `SKYNET_FEEDBACK_REPO='owner/repo'` (defaults to
  `ejclark/skynet-capital`).

## Verify it's live

1. Watch the startup log: with the token set the `Observatory live …` line ends with
   `feedback: on`; without it you'll see the `ℹ️  In-app feedback is off …` warning instead.
2. Sign in, open `/feedback`, and submit one **Bug**, one **Feature**, and one **Idea**.
3. Confirm three issues appear on `ejclark/skynet-capital` — each with the right labels
   (`bug`/`enhancement`/`idea` + `feedback`), a `[bug]`/`[enhancement]`/`[idea]` title tag, and the
   submitter footer (profile name + opaque id — the id alone if the OAuth profile has no name, and
   never an email). The success page links each filed issue so the member can follow its progress.
4. Every issue also carries a `member-<opaque id>` label (`memberLabelFor` in
   `src/server/feedback-attribution.ts`) — every issue here is filed by the same bot token, so
   GitHub's own `author:` search can't isolate one member's items; `label:member-<id>` (or clicking
   the label) can, the same way `author:` would on a normal repo.
5. Back on `/feedback`, "Your recent feedback" shows a live status badge per filing (In the queue ·
   Needs your input · Needs Eric's call · First slice shipped · Shipped) once
   `SKYNET_FEEDBACK_GITHUB_TOKEN` is set — `resolveFeedbackStatus` in `src/server/feedback-status.ts`
   reads it straight off the issue's current state and triage label, so there's nothing local to
   keep in sync across a deploy.
6. Each row also offers a **Follow up** disclosure — a member can add more detail to something
   they already filed without leaving the app. It posts a GitHub comment (never edits the original
   issue body, which the build lane parses) and re-triggers a build by cycling the `feedback`
   label, the same retry path already documented in `scripts/moneypenny.mjs` (formerly
   `postmaster.mjs`). Deliberately routed
   through this structured, envelope-bound lane rather than the free-form `claude.yml`
   comment-steering lane — see `src/server/feedback-followup.ts` for why. Ownership is checked
   against the member's own logged filings before anything posts.

## What the lane will build

A `feedback`-labelled issue is picked up by `postmaster.yml` and built end to end in a fresh Claude
session. **The default is build.** The triage rules live in `.github/prompts/feedback-build.md`;
what the lane may not touch lives in [`envelope.json`](../envelope.json) and is enforced as a red CI
check (`scripts/envelope-scan.mjs`) on every `feedback/*` branch — not as prompt text a session can
reason its way past.

Protected: workflow files and the lanes' own prompts, auth and the invite gate, credentials, the
brokerage clients, order placement/sizing, the risk guards, playbook definitions, hosting config,
and new **runtime** dependencies. Everything else — including anything that merely *renders* trades,
P/L, leaderboards, or bot cards — is ordinary buildable work.

Run `node scripts/envelope-scan.mjs --list` for the live table with reasons.

### The four ways a build session ends

Three of the four cost Eric nothing. That split is the point: `needs-eric` used to be the only
non-PR exit, so "too big", "unclear what the member meant", and "genuinely his call" all landed in
one queue — and the third got buried under the first two.

| Outcome | Marker | Waits on |
| --- | --- | --- |
| Shipped — PR opened, auto-merge armed | — | nobody |
| Sliced — first slice shipped, remainder on the issue | `next-slice` | nobody |
| Needs the member to clarify | `needs-info` | **the member** |
| A decision only Eric can make | `needs-eric` | **Eric — and only this one** |

### Is it working? — `npm run feedback:scan`

The lane's record is measured, not recalled: `scripts/feedback-scan.mjs` joins every `feedback`
issue to its PR, its labels and its comment timeline, and prints how many members got an answer and
how fast. **The metric is "a member got a real answer, fast"** (Eric, 2026-08-22) — a merged PR
counts, a shipped slice counts, and so does an honest question back; the lane's own "a build session
has started" receipt does *not*, because it is a promise rather than an answer.

First measurement, the day the instrument was built: **0 of 7** issues had gone filed → built →
merged → closed untouched, and **3 of 7 produced no output at all**. Silence — not over-escalation —
was the lane's largest failure mode. It also reads `rounds` out of each curated issue's spec block,
so the coach's question ceiling can be set from the observed distribution.

### The coach is what makes the wide envelope safe

Members who go through the guided path at `/feedback` are interrogated against a per-kind
completeness bar before anything is filed, and the issue carries a `curated` label plus a fenced
` ```skynet-spec ` block: acceptance criteria, assumptions, explicit out-of-scope, readiness. The
build session treats that spec as the specification instead of re-litigating what the member meant.
An ask that needs Eric is recognized **at the form**, so it costs a sentence rather than a whole
build session discovering it later.

Two things shape a filed issue and they compose rather than compete: the **capsule**
([`docs/ISSUES.md`](ISSUES.md)) is how the body *reads* — talking points above one fold; the
**build spec** is what it *commits to*.

The coach needs `ANTHROPIC_API_KEY`; without it members fall through to the plain form and file
uncurated issues, which the lane still builds — just more cautiously.

## Guardrails

The bot token can write issues, so the endpoint is protected in depth:

- **Auth-gated** — behind the session gate, so only invite-only, signed-in members reach it.
- **Per-email throttle** — max ~5 submissions per 10 minutes, returning a friendly slow-down
  message.
- **1 MB body cap** — the same `readBody` guard used by `/add`.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| "isn't switched on yet" still shows | The env var didn't reach the running process — check the secret name is exactly `SKYNET_FEEDBACK_GITHUB_TOKEN` and the machine rolled. |
| Result page: `GitHub responded 404` | Token can't see the repo — wrong resource owner, or the repo wasn't selected. |
| `GitHub responded 403` | Token is missing **Issues: write** permission. |
| `GitHub responded 401` | Token is invalid, revoked, or expired — regenerate and re-set the secret. |

## Rotation

When the PAT expires, repeat [Create a scoped bot token](#1-create-a-scoped-bot-token-fine-grained-pat)
and re-run the `fly secrets set` command. Nothing else changes.
