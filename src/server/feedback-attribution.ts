/**
 * Who filed this — split out of feedback-issue.ts (2026-08-25) when the attribution amendment
 * pushed that file over its architecture budget, the same way feedback-issue.ts itself split out
 * of feedback-service.ts when provenance first arrived. One concern, one file.
 *
 * The opaque id is the stable correlator (Eric's 2026-08-19 ruling: the repo is public, so an
 * issue body must never carry an email — a truncated salted sha256 lets a member's items
 * correlate, including across a future display-name change). The 2026-08-25 amendment adds two
 * things on top, neither replacing it: the member's OAuth profile name in the issue footer (may or
 * may not be their real name, and is never their email), and a per-member label so "everything
 * from one member" is filterable in GitHub's own issue search the way `author:` would be — every
 * issue here is filed by the same bot token, so `author:` can't do that; `label:member-<id>` can.
 */
import { createHash } from "node:crypto";

/** Truncated salted sha256, stable per member, pseudonymous to readers. Not cryptographically
 *  unlinkable for a tiny guest list — treated as pseudonymity, not secrecy. */
export function opaqueMemberId(email: string): string {
  return createHash("sha256")
    .update(`skynet-feedback:${email.trim().toLowerCase()}`)
    .digest("hex")
    .slice(0, 10);
}

/** The searchable per-member label — GitHub auto-creates it on first use, no repo setup needed.
 *  Keyed by the opaque id, not the name, so it survives a future rename. */
export function memberLabelFor(email: string): string {
  return `member-${opaqueMemberId(email)}`;
}

/** The issue footer's who-filed-this clause: name + id when both are known, id alone for a
 *  signed-in member with no OAuth profile name, and the old anonymous copy with no session. */
export function submitterFor(input: {
  readonly submitterEmail?: string;
  readonly submitterName?: string;
}): string {
  if (!input.submitterEmail?.trim()) return "a league member";
  const id = `member \`${opaqueMemberId(input.submitterEmail)}\``;
  const name = input.submitterName?.trim();
  return name ? `**${name}** (${id})` : id;
}
