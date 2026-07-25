# ADR-0003: Self-service account onboarding via an encrypted store

- **Status:** Accepted
- **Date:** 2026-07-25

## Context

Originally every account was read once from `process.env` at boot, so adding a participant meant
editing `.env` and restarting. That doesn't scale to a family/friends group who each want to plug
in their own Alpaca paper account. The board's hub/reducer/SSE core is already event-driven, so a
participant can in principle be appended at runtime.

## Decision

We will let people self-register through a `/add` web form. The server validates the submitted
Alpaca **paper** key by reading the account, persists it to a file store encrypted at rest
(AES-256-GCM, keyed by `SKYNET_STORE_SECRET`), then appends it live via a new additive
`participant_added` event and opens its fill stream — no restart. On Fly the store lives on a
persistent volume at `/data`. The roster becomes `env + store`, de-duplicated by id.

## Alternatives considered

- **Guided CLI script** — safer custody, but needs Node + a clone; a barrier for non-technical
  family. Rejected as the primary path.
- **GitHub form → manual approval** — keeps the operator in the loop but isn't self-service or
  instant. Rejected.
- **Full state-replacement `snapshot` on add** — works but resets every row's identity and forces a
  full re-render. Rejected in favor of an additive event.

## Consequences

- Anyone with access can onboard themselves; accounts survive redeploys via the volume.
- The host now custodies other people's paper credentials — hence encryption at rest and the
  requirement to set `SKYNET_STORE_SECRET` before exposing `/add`.
- Submitted keys are only ever read for display (no orders placed on anyone's behalf).
- Dynamic market-data symbol subscription for newly added accounts is a known gap (pre-existing
  fixed-symbol limitation), left out of scope.
