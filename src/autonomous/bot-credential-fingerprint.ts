import { createHmac } from "node:crypto";

/**
 * A non-secret stand-in for a credential pair, carried on the routine `/controls` poll so a bot
 * can tell "my credential changed" without the credential itself ever riding that payload. Keyed
 * with a server-side salt (reuse `SKYNET_STORE_SECRET`, already this repo's credential-handling
 * secret) rather than a bare hash, so the fingerprint isn't dictionary-attackable even though it's
 * repo-adjacent, cross-app, and observable on every poll.
 */
export function credentialFingerprint(
  credentials: { readonly apiKey: string; readonly apiSecret: string },
  salt: string,
): string {
  return createHmac("sha256", salt)
    .update(`${credentials.apiKey}\0${credentials.apiSecret}`)
    .digest("hex")
    .slice(0, 16);
}
