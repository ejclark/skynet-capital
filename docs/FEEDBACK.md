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
bot rather than you. Not required — each issue carries a pseudonymous submitter footer
("Submitted from the app by member `<opaque id>`"). The repo is public, so the footer never
contains a member's name or email — only a stable opaque marker the app can correlate
(`opaqueMemberId` in `src/server/feedback-service.ts`; the privacy spec pins this).

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
   pseudonymous submitter footer (opaque id, never a name or email). The success page links each
   filed issue so the member can follow its progress.

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
