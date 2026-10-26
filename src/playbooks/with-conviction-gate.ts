import { marketDayKey } from "../domain/market-day.js";
import type {
  MarketContext,
  OrderIntent,
  PlaybookSubscription,
  Portfolio,
} from "../domain/types.js";
import type { Persona } from "../personas/persona.js";
import {
  checkRecord,
  netPl,
  type PairLedger,
  putStrategyTag,
  type RecordVerdict,
  type SteeredReading,
} from "./conviction-check.js";
import { type ConvictionLookup, lookupConviction, statedCheck } from "./conviction-store.js";
import { findPair } from "./pair-table.js";
import { pausedMayPlace } from "./playbook.js";

/**
 * STOP NEW ENTRIES WHEN A CONVICTION'S CHECK FAILS (#4469 criterion 12; the check itself is
 * `conviction-check.ts`). A wrapper over the composed persona, in the same place and with the same
 * rule Pause has (`pausedMayPlace`, #4651): the pair's exits and its one risk-reducing open, a
 * covered call, still pass, so assigned shares are never stranded; every other open it placed is
 * dropped. Open positions keep being managed to exit — hygiene sits outside this wrapper
 * (`tradingRoster`), so it is never filtered.
 *
 * It is a wrapper rather than a roster change because the check day arrives while the process runs:
 * a roster is rebuilt only when a subscription changes, a decision runs every cycle.
 *
 * THE FIRST READING ON OR AFTER THE CHECK DAY DECIDES, and holds until the owner sets a new date.
 * Re-reading each cycle would let a recovered book resume the pair the day after it failed, which
 * is not "until its owner sets a new date". The latch lives in this process: a restart reads the
 * book again, which fails again unless its P/L recovered in between.
 *
 * With no ledger (the decision store is dark), or a held position the feed has no mark for, a due
 * check cannot be read, and an unread check is neither passed nor failed: entries continue, said
 * once, nothing is latched, and the next cycle reads it again.
 *
 * WHICH DATE (#5482 slice 2): a subscription that points at a conviction record steering its pair
 * is checked on the record's date, so one view gates every pair it steers on one day. Nothing else
 * is checked (the contract step's piece 4, pointers only): an inline conviction is never read. A
 * pointer the store cannot resolve, one at a record that does not steer the pair, or a ◆ pair with
 * no pointer is said once and gives no check day, and the roster
 * already runs that pair exits-only (`statedCheck`, `steeredBy`, `subscriptionRoster`). An owner's own reason and day are a
 * one-pair record since piece 3, so they are read here like any other.
 *
 * WHICH READING (#5482 criterion 5): a subscription is judged with the other pairs its record
 * steers on this bot, together — their net P/L added up (`checkRecord`); a one-pair record reads
 * its pair alone, exactly as the inline check did. When it fails, every pair the record steers
 * stops new entries at once, and a pair that is paused still counts toward the sum, so pausing a
 * loser never hides it. Exits are never filtered.
 */
export interface ConvictionGateDeps {
  /** The bot's own subscriptions — the convictions ride on them. */
  readonly subscriptions: readonly PlaybookSubscription[];
  /** One pair's history on this bot, or absent when the decision store is dark. */
  readonly ledgerOf?: (playbookId: string, putStrategy: string | undefined) => PairLedger;
  readonly log?: (line: string) => void;
  /** The conviction records a pointer resolves against; the build's store when absent. */
  readonly convictionOf?: ConvictionLookup;
}

/** The subscriptions on this bot that point at one record steering them, and the day it is checked. */
interface RecordGroup {
  readonly checkOn: string;
  readonly subs: PlaybookSubscription[];
  /** The record's owner accepts assignment, so only net P/L is read (`Conviction.acceptsAssignment`). */
  readonly acceptsAssignment: boolean;
}

/** Group the bot's subscriptions by the record each is checked on (`statedCheck`), saying one that
 *  has no usable check. A paused pair is not checked on its own, but its book counts toward a
 *  record's sum; a record with every pair paused has nothing left to stop and is read again when
 *  one resumes. */
function checksOf(deps: ConvictionGateDeps, log: (line: string) => void): Map<string, RecordGroup> {
  const records = new Map<string, RecordGroup>();
  for (const sub of deps.subscriptions) {
    const lookup = deps.convictionOf ?? lookupConviction;
    const check = statedCheck(sub, lookup);
    if (sub.enabled && check.note) {
      log(`${check.note} — no check day until it resolves; it opens nothing new meanwhile`);
    }
    if (!(check.checkOn && check.convictionId !== undefined)) continue;
    const group = records.get(check.convictionId);
    if (group) group.subs.push(sub);
    else {
      const acceptsAssignment = lookup(check.convictionId)?.acceptsAssignment === true;
      records.set(check.convictionId, { checkOn: check.checkOn, subs: [sub], acceptsAssignment });
    }
  }
  for (const [id, group] of records) {
    if (!group.subs.some((s) => s.enabled)) records.delete(id);
  }
  return records;
}

/** Every steered pair's history and net P/L now, or why they cannot all be read: a held position
 *  with no mark leaves the sum unreadable, which is neither a pass nor a fail. */
function readSteered(
  subs: readonly PlaybookSubscription[],
  ledgerOf: NonNullable<ConvictionGateDeps["ledgerOf"]>,
  context: MarketContext,
  portfolio: Portfolio,
): { readonly readings: readonly SteeredReading[] } | { readonly unmarked: string } {
  const readings: SteeredReading[] = [];
  for (const sub of subs) {
    const pair = findPair(sub.playbookId);
    if (!pair) continue;
    const ledger = ledgerOf(sub.playbookId, putStrategyTag(pair));
    const net = netPl(pair, ledger, portfolio, context.quotes);
    if (net === undefined) return { unmarked: sub.playbookId };
    readings.push({ pair, ledger, net });
  }
  return { readings };
}

/** What a record's reading said, in words: held, held but a strategy retired its own pair, or failed. */
function recordLine(id: string, checkOn: string, verdict: RecordVerdict, pairs: number): string {
  const view = `conviction "${id}" (${checkOn})`;
  if (verdict.stopped.length === 0) {
    return `${view} check passed: net P/L ${verdict.netPl} across ${pairs} pair(s)`;
  }
  const stopped = `no new entries on ${verdict.stopped.join(", ")}`;
  return verdict.pass
    ? `${view} check passed: net P/L ${verdict.netPl} across ${pairs} pair(s), but ${verdict.reason}; ${stopped} until its owner sets a new date, exits still run`
    : `${view} check FAILED — ${verdict.reason}; ${stopped} until its owner sets a new date, exits still run`;
}

export function withConvictionGate(inner: Persona, deps: ConvictionGateDeps): Persona {
  const log = deps.log ?? (() => undefined);
  const records = checksOf(deps, log);
  if (records.size === 0) return inner;
  const unread = new Set<string>();

  const latchedRecords = new Map<string, RecordVerdict>();

  const readRecord = (
    id: string,
    group: RecordGroup,
    context: MarketContext,
    portfolio: Portfolio,
  ): RecordVerdict | undefined => {
    const key = `record ${id}|${group.checkOn}`;
    const kept = latchedRecords.get(key);
    if (kept) return kept;
    const once = (note: string, line: string) => {
      if (unread.has(note)) return;
      unread.add(note);
      log(line);
    };
    if (!deps.ledgerOf) {
      once(
        key,
        `conviction "${id}" check due ${group.checkOn} but no decision store to read it from — entries continue`,
      );
      return undefined;
    }
    const steered = readSteered(group.subs, deps.ledgerOf, context, portfolio);
    if ("unmarked" in steered) {
      once(
        `${key}|marks`,
        `conviction "${id}" check due ${group.checkOn} but a held position of ${steered.unmarked} has no mark yet — reading it next cycle`,
      );
      return undefined;
    }
    if (steered.readings.length === 0) return undefined;
    const verdict = checkRecord(group.checkOn, steered.readings, {
      acceptsAssignment: group.acceptsAssignment,
    });
    latchedRecords.set(key, verdict);
    log(recordLine(id, group.checkOn, verdict, steered.readings.length));
    return verdict;
  };

  return {
    ...inner,
    decide(context: MarketContext, portfolio: Portfolio): OrderIntent[] {
      const intents = inner.decide(context, portfolio);
      const today = marketDayKey(context.asOf);
      const stopped = new Set<string>();
      for (const [id, group] of records) {
        if (today < group.checkOn) continue;
        for (const pairId of readRecord(id, group, context, portfolio)?.stopped ?? []) {
          stopped.add(pairId);
        }
      }
      if (stopped.size === 0) return intents;
      return intents.filter(
        (intent) =>
          !(intent.playbookId !== undefined && stopped.has(intent.playbookId)) ||
          pausedMayPlace(intent),
      );
    },
  };
}
