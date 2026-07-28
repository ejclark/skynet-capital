/**
 * Guest-list check: true when the OAuth identity's email or login is on the configured
 * allowlist. Case-insensitive on both sides (the sets are expected to already be lowercased,
 * but this stays defensive since config is human-edited).
 */
export function isAllowedIdentity(
  allowedEmails: ReadonlySet<string>,
  allowedLogins: ReadonlySet<string>,
  email?: string,
  login?: string,
): boolean {
  if (email && allowedEmails.has(email.toLowerCase())) {
    return true;
  }
  return Boolean(login && allowedLogins.has(login.toLowerCase()));
}
