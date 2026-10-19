import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import type { AuthoredPlaySpec } from "../../src/playbooks/authored-play.js";
import type { ShadowOrder } from "../../src/playbooks/authored-play-draft.js";

/** A member's pre-print play on AMD, run on the bot `futurist`: long 20 days ahead, out 5 before. */
export const aSpec = (over: Partial<AuthoredPlaySpec> = {}): AuthoredPlaySpec => ({
  slug: "amd-run-up",
  authorAccountId: "futurist",
  authorDisplayName: "Ada",
  symbols: ["AMD"],
  thesis: "long the pre-print drift, out before the dead final week",
  trigger: { kind: "pre-print-window", enterDaysBefore: 20, exitDaysBefore: 5 },
  size: { conservative: 0.01, standard: 0.02, aggressive: 0.03 },
  ...over,
});

export const anOrder = (over: Partial<ShadowOrder> = {}): ShadowOrder => ({
  id: "U-futurist-amd-run-up",
  since: "2026-10-16T22:00:00.000Z",
  spec: aSpec(),
  ...over,
});

/** AMD reports 2026-11-03 (confirmed): the play is long from 10-14, flat from 10-29. */
export const CALENDAR: readonly EarningsPrint[] = [
  { symbol: "AMD", date: "2026-11-03", status: "confirmed", source: "IR: test fixture" },
];

/** An asOf on a given day, mid-session (14:30 UTC = 10:30 ET). */
export const at = (day: string): string => `${day}T14:30:00Z`;
