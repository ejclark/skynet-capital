/**
 * Server-side JSON-field coercion shared by the OAuth providers (Google/GitHub login and
 * Alpaca account-linking): third-party token/userinfo responses are untyped JSON, so callers
 * narrow individual fields to non-empty strings before trusting them.
 */

/** Narrows an untrusted JSON field to a non-empty string, or `undefined` otherwise. */
export function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}
