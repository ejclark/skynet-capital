/**
 * THE ROUND'S ADDRESS (#3961) — the id a decision-cycle row carries, and the hash a fill's "why"
 * links to. Both halves of the join derive it from the round's own timestamp, so no extra key has
 * to be threaded through the payload; #3961's regression was that a traded round had nowhere to be
 * pointed at (`docs/IA.md` §8.1: a joint renders as a row or a link, never a second copy).
 *
 * Epoch ms rather than the raw ISO string: a URL fragment percent-encodes a colon, and the two
 * halves have to match character for character or the link lands on nothing.
 */

/** The anchor for one round. Absent for a timestamp that will not parse — a row that cannot be
 *  addressed honestly gets no id at all rather than a wrong one. */
export function cycleAnchor(at: string): string | undefined {
  const ms = Date.parse(at);
  return Number.isNaN(ms) ? undefined : `cycle-${ms}`;
}

/** The round the current URL is pointing at, if any — read when the trail mounts so a member who
 *  arrived from a fill's "why" gets the traded rounds included and that row already open. */
export function targetedCycle(): string | undefined {
  const raw = typeof window === "undefined" ? "" : window.location.hash;
  const hash = raw.startsWith("#") ? decodeURIComponent(raw.slice(1)) : "";
  return hash.startsWith("cycle-") ? hash : undefined;
}
