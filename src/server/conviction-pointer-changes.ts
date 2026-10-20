import { CONVICTIONS } from "../playbooks/conviction-store.js";
import type { PointerMove } from "../subscriptions/conviction-pointer.js";
import type { MemberConvictionStore } from "./member-conviction-store.js";
import {
  MAX_SETTING_TEXT,
  type SettingsChange,
  type SettingsChangeLog,
} from "./settings-change-log.js";

/**
 * A CONVICTION POINTER THAT MOVES IS A LINE IN THE SETTINGS CHANGE LOG (#5482, the contract step's
 * first piece; #4535 criterion 4: every change to what a bot does is recorded). Which view steers a
 * pair narrows what it may open and sets the day it is checked, so a pointer moving is a change to
 * what the bot does — and until now the log's subscription line left it out on purpose
 * (`subscription-changes.ts`, "an internal field never makes a line").
 *
 * One `conviction:<playbookId>` line per move, on the bot's own log: the view that steered the pair
 * before and the one that steers it now, by title, `null` for none (the pair checked on its own
 * conviction, or on none). The pointer moves in three places, and each says who moved it:
 *
 *  - a member's own act — a hand-over, take-back, edit or delete (`member-convictions-api-routes.ts`)
 *    — is theirs on the bots they own;
 *  - a subscribe or conviction edit that restates the pointer is the owner's, in the same line set
 *    as the subscription it rewrote (`recordSubscriptionWrite`, both or neither);
 *  - the controls poll applying the pointer rule on its own (the seeded match, a heal after a write
 *    that failed halfway, a view the store's rules refuse today) is `POINTER_RULE_AUTHOR`'s.
 *
 * Outside a subscription write the pointer is an invariant re-applied each poll, so a log that
 * cannot be written leaves the pointer where the rule put it and says so, the posture the shadow
 * scout's seed line takes (`subscription-seed-store.ts`): undoing it would only see the next poll
 * redo it.
 */

/** Who moved a pointer when no person did: the controls poll applying the pointer rule. */
export const POINTER_RULE_AUTHOR = "conviction-pointer-rule";

/** The log's setting key for which view steers one pair. */
export const pointerSetting = (playbookId: string): string => `conviction:${playbookId}`;

/** A view's title by id — the seeded records, then every member's view, held or not. */
export type ConvictionNames = (id: string) => string | undefined;

export function convictionNames(members?: MemberConvictionStore): ConvictionNames {
  let memberTitles: ReadonlyMap<string, string> | undefined;
  return (id) => {
    const seeded = CONVICTIONS.get(id);
    if (seeded) return seeded.title ?? seeded.id;
    memberTitles ??= new Map(
      Object.values(members?.load() ?? {}).flatMap((records) =>
        records.map((r) => [r.conviction.id, r.conviction.title ?? r.conviction.id] as const),
      ),
    );
    return memberTitles.get(id);
  };
}

const bounded = (text: string): string =>
  text.length > MAX_SETTING_TEXT ? `${text.slice(0, MAX_SETTING_TEXT - 1)}…` : text;

/** One move as a log line. A view no longer stored reads by its id; two views sharing a title read
 *  by id, so the line never looks like no change. */
export function pointerChange(
  move: PointerMove,
  names: ConvictionNames,
  author: string,
  at: Date,
): SettingsChange {
  // Bounded before comparing: two long titles alike up to the cut would otherwise read the same.
  const name = (id: string | undefined) => (id === undefined ? null : bounded(names(id) ?? id));
  let before = name(move.from);
  let after = name(move.to);
  if (before !== null && before === after) {
    before = move.from ?? null;
    after = move.to ?? null;
  }
  return {
    at: at.toISOString(),
    setting: pointerSetting(move.playbookId),
    before,
    after,
    proposedBy: author,
    approvedBy: author,
  };
}

/** Each move's line on its own bot's log; a log that will not write is reported, the move kept. */
export function recordPointerMoves(
  log: SettingsChangeLog | undefined,
  moves: readonly PointerMove[],
  names: ConvictionNames,
  authorOf: (accountId: string) => string,
  at: Date,
  onError: (message: string) => void = (message) => process.emitWarning(message),
): void {
  if (!log) return;
  const byAccount = new Map<string, SettingsChange[]>();
  for (const move of moves) {
    const lines = byAccount.get(move.accountId) ?? [];
    lines.push(pointerChange(move, names, authorOf(move.accountId), at));
    byAccount.set(move.accountId, lines);
  }
  for (const [accountId, lines] of byAccount) {
    try {
      log.record(accountId, lines);
    } catch (err) {
      onError(
        `[subscriptions] conviction pointer moved on ${accountId} but the change log would not write: ${String(err)}`,
      );
    }
  }
}
