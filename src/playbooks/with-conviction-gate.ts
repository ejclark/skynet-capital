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
  netPl,
  type PairLedger,
  putStrategyTag,
} from "./conviction-check.js";
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
 * With no ledger (the decision store is dark) a due check cannot be read, and an unread check is
 * not a failed one: entries continue, said once, and nothing is latched.
 */
export interface ConvictionGateDeps {
  /** The bot's own subscriptions — the convictions ride on them. */
  readonly subscriptions: readonly PlaybookSubscription[];
  /** One pair's history on this bot, or absent when the decision store is dark. */
  readonly ledgerOf?: (playbookId: string, putStrategy: string | undefined) => PairLedger;
  readonly log?: (line: string) => void;
}

export function withConvictionGate(inner: Persona, deps: ConvictionGateDeps): Persona {
  const convictions = deps.subscriptions.filter((sub) => sub.enabled && sub.conviction);
  if (convictions.length === 0) return inner;
  const log = deps.log ?? (() => undefined);
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
    const verdict = checkConviction(
      pair,
      checkOn,
      ledger,
      netPl(pair, ledger, portfolio, context.quotes),
    );
    latched.set(key, verdict);
    log(
      verdict.pass
        ? `conviction check passed for ${sub.playbookId} (${checkOn}): net P/L ${verdict.netPl}`
        : `conviction check FAILED — ${verdict.reason}; no new entries until its owner sets a new date, exits still run`,
    );
    return verdict;
  };

  return {
    ...inner,
    decide(context: MarketContext, portfolio: Portfolio): OrderIntent[] {
      const intents = inner.decide(context, portfolio);
      const today = marketDayKey(context.asOf);
      const stopped = new Set<string>();
      for (const sub of convictions) {
        const checkOn = sub.conviction?.checkOn;
        if (!checkOn || today < checkOn) continue;
        if (read(sub, checkOn, context, portfolio)?.pass === false) stopped.add(sub.playbookId);
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
