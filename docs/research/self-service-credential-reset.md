# Self-service credential reset — participant vs. bot-persona

**Date:** 2026-08-13 · **Trigger:** Eric's "day 2" ask — "resetting api keys to an account so
these updates are fully self service." Ambiguous between two different credential systems; this
doc traces both so the right one gets built and the wrong one doesn't.

## TL;DR — decisions needed

| # | Item | Recommendation | Your call |
|---|------|-----------------|-----------|
| 1 | Add a "Rotate your key" link to the "Account unreachable" error state | **Build it** — small, safe, closes a real gap | ✅ / ❌ |
| 2 | Make bot-persona credentials (`autonomy-ops`) self-service | **Do not build** — stays gated, see below | (no action — confirming, not proposing) |
| 3 | Smoother-for-Eric tweaks to the *existing* approval flow | Optional, separate, smaller | pick 0–1 or skip |

---

## 1. Participant-level Alpaca connection

### Correction to the framing: OAuth "Connect with Alpaca" isn't live yet

`src/server/auth/alpaca-connect.ts` (OAuth exchange) and `oauth-callback.ts` (generic OAuth
finisher) exist, but `alpaca-connect.ts` is **not wired to any HTTP route** —
`Authenticator.handleAuthRoute` only matches `/auth/(google|github)`. It's scaffolding for a
planned future round (`AlpacaCredentials.accessToken`, `docs/IDEAS.md`'s note that `bot-broker`
"drops `accessToken`" for when OAuth bots exist, `tests/bots/bot-broker.spec.ts`'s `it.todo` for
the same). Google/GitHub OAuth today is **login identity only** — it doesn't connect a
participant's Alpaca account.

The actual live connection mechanism is **pasted API key/secret**: a participant fills in their
Alpaca **paper** key/secret at `/add` (`src/server/self-service-forms.ts`,
`src/server/dashboard-server.ts`), which is verified live against Alpaca before being stored
encrypted (`participant-service.ts`, gated on `SKYNET_STORE_SECRET`).

### Self-service rotation already exists

`/rotate` (`ParticipantService.rotateCredentials` + `self-service-forms.ts` `handleRotate`) shipped
2026-08-11 for exactly this ask, per `docs/LESSONS.md`'s "regenerated Alpaca key" incident: it
verifies the *new* key against Alpaca before touching anything stored, and enforces
`requesterId === id` for human targets so one authed member can't redirect another named member's
account to credentials of their own choosing (self-caught in `/security-review` on the same PR).
**This already is self-service key rotation for participants.**

### The real gap: the error state doesn't point at the fix

Traced the actual failure mode — a participant's key gets revoked/regenerated/expired:

1. `buildParticipantSnapshot` fails against Alpaca → `snapshot.error` is set.
2. Both the board card (`src/observatory/participant-card.ts`) and that participant's own
   profile page (`src/observatory/render-dashboard.ts` → `renderIndividualBody`, reached even
   when `isSelf` is true) render the **same inert string**:
   `"Account unreachable — check this participant's API keys."` — no link, no next step.
3. `/rotate` exists, but the only place it's *mentioned* in the UI is a footnote on the `/add`
   page ("Already on the board and just regenerated your key? Rotate your credentials"). A
   participant who lands on their own broken profile never sees that footnote.

So today: a broken connection surfaces as a dead-end message that, in practice, gets *noticed by
Eric watching the board* rather than self-served by the affected participant — the exact pattern
`docs/LESSONS.md` (2026-08-11) already paid tuition for once (JARVIS showed "Account unreachable"
and nobody had anywhere sanctioned to point at until `/rotate` was built). The fix landed the
mechanism but not its own discoverability.

### Smallest safe slice (single small PR)

- On the error branch in `participant-card.ts` **and** `renderIndividualBody` in
  `render-dashboard.ts`: when `isSelf` is true, add a link to `/rotate` (optionally
  `?id=<own id>` prefilled — safe, since ids are already public per the 2026-08-11 lesson, and
  `rotateCredentials` still re-verifies both the caller's identity and the new key regardless of
  what the form was prefilled with).
- When `isSelf` is false (e.g. Eric looking at someone else's or a bot's broken card), leave the
  message as-is — no reason to invite id-guessing on an account that isn't the viewer's.
- Scope: two render functions, no new routes, no new dependencies, no security-surface change
  (the verification/identity checks `/rotate` already does are unchanged). Estimate: comfortably
  a single small PR.

---

## 2. Bot-persona credentials (day-trader / prospector / sauron)

### Confirmed: stays gated. Not a self-service candidate.

Bot credentials are set via `.github/workflows/autonomy-ops.yml`'s `set-*-credentials` actions,
gated by the `autonomy-ops` GitHub Environment's required-reviewer protection — confirmed live in
production (`docs/GAPS-2026-08.md`: a real `workflow_dispatch` run sat in `Waiting` pending
approval).

This is a direct instance of CLAUDE.md's hard boundary: *"Governance & credentials are Eric's.
Build the mechanism; never self-authorize the sensitive step... anything outward-facing and hard
to reverse."* Concretely:

- **Outward-facing & hard to reverse.** A bot-persona credential set determines *which Alpaca
  account an autonomous trading persona acts through*. Get it wrong and the persona is silently
  trading against the wrong account with no loud failure — this is not hypothetical: it's what
  actually happened in the 2026-08-11 incident (a regenerated key landed in Sauron's GitHub secret
  by hand, and nothing caught it because a merely-*wrong* key authenticates fine).
- **Severity, not probability, sets the bar** (CLAUDE.md's safety-scaling clause). Even in paper
  mode, "practice like we play" (the shared-universe boundary) means this stays reviewed as if
  real cash flowed.
- **This is the textbook "always gate" case** from CLAUDE.md's interrupt economics: irreversible /
  outward-facing → always gate, no exception for convenience.

Removing or bypassing the reviewer step would re-open the exact failure class the 2026-08-11
lesson closed. **Recommendation: do not build this as self-service, for anyone.** Recording this
plainly so it doesn't get re-proposed without re-deriving the reasoning above.

### A genuinely safer middle ground — smoother for Eric, not self-service for anyone

If "day 2 self-service" partly meant *"I'm tired of the friction of approving my own workflow
runs,"* that's a different, smaller, and legitimate ask — as long as Eric is still the one
clicking approve. Candidates, kept deliberately separate from anything above:

- **Notify Eric when a run is `Waiting`** — a Routine/webhook so he doesn't have to poll GitHub's
  Actions tab to notice a pending review exists.
- **Point the failure message at the approval UI** — the workflow's own `::error::` messages
  already explain missing secrets clearly; confirm `docs/AUTONOMY-DEPLOY.md` also spells out
  exactly where to click "Review deployments" so Eric never has to hunt for it.
- **Collapse the three near-identical `set-<persona>-credentials` steps** into one
  parameterized action once GitHub Actions supports computing a secret name from an input
  (currently blocked — the workflow's own comment notes `secrets[format(...)]` isn't
  expression-evaluable today). Pure DX cleanup, no security change, low priority.

None of these remove the required-reviewer step. Keep this bucket labeled *"faster for Eric to
approve,"* never *"fewer approvals needed"* — that framing boundary is the whole point of keeping
this section separate from §1.

---

## Bottom line

Participant-level credential rotation is **already built and shipped** (`/rotate`,
2026-08-11) — the only real gap is that the error state doesn't link to it, which is a small,
safe, single-PR fix (§1). Bot-persona credentials are correctly gated behind human review per an
explicit CLAUDE.md hard boundary and a lesson already paid for in production; that gate should
not move, though the *approval experience* for Eric specifically has a few small, separate,
non-security-affecting improvements available if he wants them (§2).
