import type { AlpacaCredentials } from "../alpaca/credentials.js";

/** Everyone whose account the dashboard observes is a participant. */
export type ParticipantKind = "bot" | "human";

/**
 * A participant is any account we read into the centralized dashboard — an autonomous
 * bot or a human who linked their account. Both are just an Alpaca account we observe;
 * the only difference is a bot carries a `personaId` (its strategy).
 */
export interface Participant {
  readonly id: string;
  readonly displayName: string;
  readonly kind: ParticipantKind;
  readonly credentials: AlpacaCredentials;
  /** Present for bots — the persona driving the account. */
  readonly personaId?: string;
  /** IANA timezone (e.g. "America/Chicago") for showing this account's times locally. */
  readonly timezone?: string;
  /**
   * The signed-in member who owns this account, stamped from the session at `/add` — the ONLY
   * link a session may trade through. Absent (legacy roster/store rows, or bots) means no owner
   * until one is linked from `/invite`, and the account can't be traded until then.
   */
  readonly ownerEmail?: string;
}

/**
 * The live roster: env rows + store rows, with ONE precedence exception. Identity (displayName,
 * kind, personaId, owner link) stays env-truth on a collision — but the STORE's credentials win,
 * because the only sanctioned writer of a store row under an env id is `/rotate`, which verifies
 * the new key against Alpaca first. Env credentials go stale the moment someone regenerates a key
 * in Alpaca (regeneration REVOKES the old pair — that is what bricked an env account on
 * 2026-08-25); the store row is the newer, proven pair, and without this override a rotation
 * would silently lose to the dead env value on every boot.
 */
export function mergeRoster(
  envRoster: readonly Participant[],
  stored: readonly Participant[],
): Participant[] {
  const overrides = new Map(stored.map((p) => [p.id, p]));
  const envIds = new Set(envRoster.map((p) => p.id));
  return [
    ...envRoster.map((p) => {
      const override = overrides.get(p.id);
      return override ? { ...p, credentials: override.credentials } : p;
    }),
    ...stored.filter((p) => !envIds.has(p.id)),
  ];
}
