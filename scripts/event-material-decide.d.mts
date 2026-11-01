// Type surface for the part of event-material-decide.mjs worth testing directly — same arrangement
// as open-screen-pr.d.mts/plan-closure-scan.d.mts: the scripts/ tree is plain ESM with `allowJs`
// off, so a spec that imports from it needs this rather than a repo-wide loosening.

/** `**Last assessed:**` + an optional `<!-- probe-ref: {...} -->` line, reading the LAST occurrence
 *  of each in the file (2026-09-19 — applyScreen appends rather than rewrites in place). */
export function parseLedgerHeader(text: string): {
  lastAssessed: string | null;
  probeRef: Record<string, unknown> | null;
};

/** Sessions that may land uncited before an intent stops making its event's pulses material. */
export const INTENT_TRIP_CAP: number;

/** Which active intents naming this event still trip (`pending`) and which hit the cap (`capped`). */
export function splitIntents(
  intents: { slug: string; stated: string }[],
  ledgerText: string,
): { pending: string[]; capped: string[] };
