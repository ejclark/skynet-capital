import { promotionVerdict } from "../autonomous/authored-promotion.js";
import type { ShadowReport } from "../autonomous/authored-shadow-wire.js";
import type { AuthoredPlayRecord } from "../playbooks/authored-play-draft.js";
import type { AuthoredPlayStore } from "./authored-play-store.js";
import type { PlayMilestoneKind, PlayMilestoneLedger } from "./play-milestone-ledger.js";

/**
 * WHEN A PLAY'S MILESTONES GET WRITTEN (#5457 slice 5) — one door per milestone, each idempotent on
 * the key it builds, so the same event can never post twice.
 *
 *   started / promoted / paused   called by `authored-plays-api-routes.ts` at the moment the member's
 *                                 own tap changes the play.
 *   passed                        no tap says it: the bots report, and the verdict is read off the
 *                                 report. `recordPasses` runs wherever the report is read (the
 *                                 member's list, the feed) and posts each pass once per test.
 *
 * Nothing here can place an order, change a play or reach a bot — it only writes the ledger.
 */

function keyFor(kind: PlayMilestoneKind, playId: string, stamp?: string): string {
  return stamp ? `${playId}:${kind}:${stamp}` : `${playId}:${kind}`;
}

/** The key stamp of one shadow test — a new test of the same play is a new start and a new pass. */
export const shadowStamp = (record: AuthoredPlayRecord): string =>
  record.shadowSince ?? record.updatedAt;

/** Post one milestone for a play. Returns whether it was new. */
export function recordPlayMilestone(
  ledger: PlayMilestoneLedger | undefined,
  kind: PlayMilestoneKind,
  record: AuthoredPlayRecord,
  at: Date,
  options: { readonly stamp?: string; readonly sessions?: number } = {},
): boolean {
  if (!ledger) return false;
  return ledger.record({
    key: keyFor(kind, record.id, options.stamp),
    kind,
    at: at.toISOString(),
    accountId: record.spec.authorAccountId,
    playName: record.name,
    symbol: record.spec.symbols[0] ?? "",
    ...(options.sessions !== undefined ? { sessions: options.sessions } : {}),
  });
}

/**
 * Post "passed" for every play whose CURRENT test meets the bar on the report in hand. A report for
 * an earlier start of the same play is not this test's (the `since` join, as the member's row does),
 * and no report is never a pass. The instant is the report's own, not the wall clock.
 */
export function recordPasses(
  store: AuthoredPlayStore | undefined,
  ledger: PlayMilestoneLedger | undefined,
  report: ShadowReport | undefined,
): void {
  if (!(store && ledger && report)) return;
  for (const record of Object.values(store.load()).flat()) {
    if (record.status !== "shadow") continue;
    const stamp = shadowStamp(record);
    const entry = report.plays.find((p) => p.id === record.id && p.since === stamp);
    if (!(entry && promotionVerdict(entry).passes)) continue;
    recordPlayMilestone(ledger, "passed", record, new Date(report.at), {
      stamp,
      sessions: entry.sessions,
    });
  }
}
