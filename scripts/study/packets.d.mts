// Type surface for packets.mjs — the scripts/ tree is plain ESM with `allowJs` off, so the spec that
// imports it needs this rather than a repo-wide loosening (same arrangement as crawl/ledger.d.mts).

/** A member file split by its numbered sections: { "1": body, "2": body, … }. */
export function sections(markdown: string): Record<string, string>;
/** Drop `- _hypothesis …_` bullets, including their continuation lines. */
export function dropHypotheses(text: string): string;
/** Remove repo references: repo parentheticals, code spans, link targets, issue numbers. */
export function stripRefs(text: string): string;
/** Drop any sentence carrying a date on or after `cutoff` (YYYY-MM-DD). */
export function dropLateSentences(text: string, cutoff: string): string;
/** One member's card (§1, §3, §4 only) and the sha256 of exactly that text. */
export function memberCard(
  markdown: string,
  opts: { cutoff: string; name: string },
): { text: string; sha256: string };
/** The area's roles, one `<member>: <role>` paragraph each, in `members` order; throws on a missing role. */
export function rolesPacket(
  roles: Record<string, string> | undefined,
  members: string[],
): { text: string; sha256: string };
/** The members whose card shares a five-word run with `rolesText`. */
export function cardEchoes(rolesText: string, cards: Record<string, string>): string[];
