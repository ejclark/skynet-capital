import type { Participant } from "../participants/participant.js";

/**
 * THE BOT-CREDENTIALS GATE — the ONLY code in this repo allowed to hand a live Alpaca
 * credential to the internal cross-app bridge. Modeled directly on `account-identity-gate.ts`'s
 * pattern: the sensitive capability (resolving a bot's real key/secret for transit) lives in one
 * small, fully-reviewable file, so a caller that wants an unverified credential has nowhere to get
 * one without visibly widening this file first.
 *
 * This is the first place a real broker secret ever crosses the internal 6PN bridge — every other
 * thing that bridge carries (`/controls`, `/insights`) is documented as non-sensitive
 * (`insight-record.ts`). Treat any change here with the same weight `account-identity-gate.ts`
 * gets: small diffs, reviewed in full, never widened to serve a second purpose.
 */

export interface BotCredentialsGateDeps {
  /** Resolve a participant (with credentials) by id — the same resolver every other credential
   *  seam in this app already uses (`account-identity-gate.ts`'s `findParticipant`). */
  readonly findParticipant: (id: string) => Participant | undefined;
}

export interface BotCredentials {
  readonly apiKey: string;
  readonly apiSecret: string;
  readonly baseUrl?: string;
}

/**
 * Resolves a bot's current credentials for the `/bot-credentials` endpoint. Refuses anything that
 * isn't a `kind: "bot"` participant — this endpoint exists to hand a bot process its OWN key, never
 * a human's, even if a caller who cleared the bridge's auth somehow asked for one by a human's id.
 */
export function resolveBotCredentials(
  deps: BotCredentialsGateDeps,
  personaId: string,
): BotCredentials | undefined {
  const participant = deps.findParticipant(personaId);
  if (participant?.kind !== "bot") return undefined;
  const { apiKey, apiSecret, baseUrl } = participant.credentials;
  return { apiKey, apiSecret, ...(baseUrl ? { baseUrl } : {}) };
}
