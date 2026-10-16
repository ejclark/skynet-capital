import { marketDayKey } from "../domain/market-day.js";
import type {
  MarketContext,
  OrderIntent,
  PlaybookSubscription,
  Portfolio,
} from "../domain/types.js";
import type { Persona } from "../personas/persona.js";
import {
  type ConvictionVerdict,
  checkConviction,
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
 * is checked on the record's date, so one view gates every pair it steers on one day. Every other
 * subscription is checked on its own conviction's date, as before; a pointer the store cannot
 * resolve, or one at a record that does not steer the pair, is said once and falls back to that
 * (`statedCheck`).
 *
 * WHICH READING (#5482 criterion 5): a subscription checked on a RECORD is judged with the other
 * pairs that record steers on this bot, together — their net P/L added up (`checkRecord`). When it
 * fails, every pair the record steers stops new entries at once, and a pair that is paused still
 * counts toward the sum, so pausing a loser never hides it. A subscription checked on its own
 * conviction is read by itself, exactly as before. Exits are never filtered either way.
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
}

interface Checks {
  /** Subscriptions checked on their own conviction, each read alone. */
  readonly own: { readonly sub: PlaybookSubscription; readonly checkOn: string }[];
  /** Subscriptions checked on a record, grouped by record id and read together. */
  readonly records: Map<string, RecordGroup>;
}

/** Sort the bot's subscriptions into what each is checked on (`statedCheck`), saying a pointer the
 *  store cannot use. A paused pair is not checked on its own, but its book counts toward a record's
 *  sum; a record with every pair paused has nothing left to stop and is read again when one resumes. */
function checksOf(deps: ConvictionGateDeps, log: (line: string) => void): Checks {
  const own: Checks["own"][number][] = [];
  const records = new Map<string, RecordGroup>();
  for (const sub of deps.subscriptions) {
    const check = statedCheck(sub, deps.convictionOf ?? lookupConviction);
    if (sub.enabled && check.note) log(`${check.note} — checking its own conviction instead`);
    if (!check.checkOn) continue;
    if (check.from === "record" && check.convictionId !== undefined) {
      const group = records.get(check.convictionId);
      if (group) group.subs.push(sub);
      else records.set(check.convictionId, { checkOn: check.checkOn, subs: [sub] });
    } else if (sub.enabled) {
      own.push({ sub, checkOn: check.checkOn });
    }
  }
  for (const [id, group] of records) {
    if (!group.subs.some((s) => s.enabled)) records.delete(id);
  }
  return { own, records };
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

export function withConvictionGate(inner: Persona, deps: ConvictionGateDeps): Persona {
  const log = deps.log ?? (() => undefined);
  const { own: convictions, records } = checksOf(deps, log);
  if (convictions.length === 0 && records.size === 0) return inner;
  const latched = new Map<string, ConvictionVerdict>();
  const unread = new Set<string>();

  const read = (
    sub: PlaybookSubscription,
    checkOn: string,
    context: MarketContext,
    portfolio: Portfolio,
  ): ConvictionVerdict | undefined => {
    const key = `${sub.playbookId}|${checkOn}`;
    const kept = latched.get(key);
    if (kept) return kept;
    const pair = findPair(sub.playbookId);
    if (!pair) return undefined;
    if (!deps.ledgerOf) {
      if (!unread.has(key)) {
        unread.add(key);
        log(
          `conviction check due ${checkOn} for ${sub.playbookId} but no decision store to read it from — entries continue`,
        );
      }
      return undefined;
    }
    const ledger = deps.ledgerOf(sub.playbookId, putStrategyTag(pair));
    const net = netPl(pair, ledger, portfolio, context.quotes);
    if (net === undefined) {
      if (!unread.has(`${key}|marks`)) {
        unread.add(`${key}|marks`);
        log(
          `conviction check due ${checkOn} for ${sub.playbookId} but a held position has no mark yet — reading it next cycle`,
        );
      }
      return undefined;
    }
    const verdict = checkConviction(pair, checkOn, ledger, net);
    latched.set(key, verdict);
    log(
      verdict.pass
        ? `conviction check passed for ${sub.playbookId} (${checkOn}): net P/L ${verdict.netPl}`
        : `conviction check FAILED — ${verdict.reason}; no new entries until its owner sets a new date, exits still run`,
    );
    return verdict;
  };

  const latchedRecords = new Map<string, RecordVerdict>();

  const readRecord = (
    id: string,
    group: RecordGroup,
    context: MarketContext,
    portfolio: Portfolio,
  ): RecordVerdict | undefined => {
    const key = `${id}|${group.checkOn}`;
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
    const verdict = checkRecord(group.checkOn, steered.readings);
    latchedRecords.set(key, verdict);
    log(
      verdict.stopped.length === 0
        ? `conviction "${id}" check passed (${group.checkOn}): net P/L ${verdict.netPl} across ${steered.readings.length} pair(s)`
        : `conviction "${id}" check FAILED — ${verdict.reason}; no new entries on ${verdict.stopped.join(", ")} until its owner sets a new date, exits still run`,
    );
    return verdict;
  };

  return {
    ...inner,
    decide(context: MarketContext, portfolio: Portfolio): OrderIntent[] {
      const intents = inner.decide(context, portfolio);
      const today = marketDayKey(context.asOf);
      const stopped = new Set<string>();
      for (const { sub, checkOn } of convictions) {
        if (today < checkOn) continue;
        if (read(sub, checkOn, context, portfolio)?.pass === false) stopped.add(sub.playbookId);
      }
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
