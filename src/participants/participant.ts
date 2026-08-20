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
}

/**
 * First occurrence wins when the env roster and the self-service store both name an id — the env
 * (listed first by every caller) is the owner-configured truth, the store the runtime addition.
 */
export function dedupeById(participants: readonly Participant[]): Participant[] {
  const byId = new Map<string, Participant>();
  for (const participant of participants) {
    if (!byId.has(participant.id)) byId.set(participant.id, participant);
  }
  return [...byId.values()];
}
