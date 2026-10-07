import { type EarningsPrint, UPCOMING_PRINTS } from "../domain/earnings-calendar.js";
import { regularSessionOpen } from "../domain/market-session.js";
import { marginalNeeds, premiumOut } from "../domain/option-book.js";
import {
  type MarketContext,
  NO_OPTION_DEMAND,
  type OptionMarket,
  type OrderIntent,
  type PlaybookMode,
} from "../domain/types.js";
import { liquid } from "../options/contract-picker.js";
import { findPair, type Pair, pairName } from "../playbooks/pair-table.js";
import type { Playbook } from "../playbooks/playbook.js";
import { findPlaybook } from "../playbooks/registry.js";
import type { OptionMarketPort } from "../ports/option-market.js";

/**
 * WHAT A NEW SUBSCRIPTION NEEDS FROM THE LIVE MARKET AND THE ACCOUNT (#4469 slice 3a part 2,
 * criterion 9) — the half of "what a pair needs" that `subscribe-eligibility.ts` cannot say from the
 * code and the calendar. Same contract: NEW subscriptions only, a sentence a member can act on, and
 * a read that could not be made is "unknown", never a refusal — Edit, Pause and Unsubscribe never
 * come here, and neither does a pair the account already holds. THE ONE EXCEPTION IS THE PRICE: the
 * client's read is fail-soft, so a ticker the feed does not know and a feed that is down both come
 * back as no price. A subscription to a ticker with no price trades nothing, so it is refused, in
 * words that say to try again — never saved as a pair that sits idle. A server with no market-data
 * client at all (offline, a test) has no price read and skips the check.
 *
 * In order an owner can act on it:
 *   1. the feed has a price for the ticker (a symbol the data host does not know prices nothing, and
 *      the bots stream what a playbook trades, #4777);
 *   2. the account's options level reaches what the playbook's opens need (`options.requiredLevel`,
 *      the guards' own `options-level` rule);
 *   3. while the regular session is open, the chain the playbook would read RIGHT NOW has a liquid
 *      contract, judged by the picker's own `liquid` — and one contract's cash (the guards'
 *      `marginalNeeds` plus the premium paid) fits the budget being asked for.
 *
 * (3) asks the playbook itself, so it cannot drift from what the bots do: the playbook's own
 * `optionDemand` says which chains, the shared `OptionMarketPort` reads them, and `decide` against a
 * flat book says what it would open and at which strike. Outside the session no quote clears
 * `liquid`'s freshness bar, and a playbook outside its window (the spread before D-20, the wheel in
 * a blackout) demands no chain and decides nothing — both read as "not judged now", and the guards
 * still refuse an unfit open on the cycle that makes it. A refusal here is the early, readable
 * version of that, not a second rule.
 *
 * Baskets (HC-SAURON, SAURON) have no single ticker to read and are not judged.
 */

/** What the live reads give; each absent read skips its check. */
export interface LiveNeedsReads {
  /** The feed's last price for a ticker; `undefined` when it has none (fail-soft). */
  readonly price?: (symbol: string) => Promise<number | undefined>;
  /** The account's Alpaca options approval level; `undefined` when it cannot be read. */
  readonly optionsLevel?: () => Promise<number | undefined>;
  /** The option quotes, as the bots read them (`AlpacaOptionMarket`). */
  readonly optionMarket?: OptionMarketPort;
}

export interface LiveNeedsInput {
  readonly playbookId: string;
  readonly mode: PlaybookMode;
  /** The budget the member is asking for. */
  readonly capitalAllocated: number;
  readonly asOfIso: string;
  readonly calendar?: readonly EarningsPrint[];
  /** Test seams, as on `newSubscriptionRefusal`. */
  readonly lookup?: (id: string) => Pair | undefined;
  readonly resolve?: (id: string) => Playbook | undefined;
  readonly sessionOpen?: boolean;
}

const dollars = (amount: number): string => `$${Math.round(amount).toLocaleString("en-US")}`;
const capitalized = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

/** The cash one open of the playbook ties up: what the guards would reserve for it, plus premium. */
function oneContractCash(intent: OrderIntent): number {
  const { option } = intent;
  if (!option) return 0;
  return Math.max(
    0,
    marginalNeeds({ cash: 0, positions: [] }, option, 1).cash + premiumOut(option),
  );
}

const flatContext = (asOf: string, symbol: string, spot: number, options: OptionMarket) =>
  ({
    asOf,
    quotes: { [symbol]: { symbol, bid: spot, ask: spot, last: spot, asOf } },
    options,
  }) satisfies MarketContext;

/** One chain read as the playbook would ask for it right now, then what it would open there. */
async function chainRefusal(
  input: LiveNeedsInput,
  market: OptionMarketPort,
  playbook: Playbook,
  symbol: string,
  spot: number,
  name: string,
): Promise<string | undefined> {
  const { asOfIso, mode, calendar = UPCOMING_PRINTS, capitalAllocated } = input;
  const flat = { cash: capitalAllocated, positions: [] };
  let chains = 0;
  const read = await market.readOptionMarket({
    asOf: asOfIso,
    underlyings: [symbol],
    skip: new Set(),
    demand: (listed) => {
      const demand = playbook.optionDemand?.(asOfIso, flat, listed, calendar, mode);
      chains = demand?.chains.length ?? 0;
      return demand ?? NO_OPTION_DEMAND;
    },
  });
  if (!read || chains === 0) return undefined;
  const quotes = Object.values(read.contracts);
  if (quotes.length > 0 && !quotes.some((quote) => liquid(quote, asOfIso))) {
    return `${capitalized(name)} can't be taken yet: ${symbol}'s options have no liquid contract right now (a real bid, a tight spread, a fresh quote).`;
  }
  const intent = playbook
    .decide?.(flatContext(asOfIso, symbol, spot, read), flat, calendar, mode)
    .find((candidate) => candidate.option?.effect === "open");
  const cash = intent ? oneContractCash(intent) : 0;
  return cash > capitalAllocated
    ? `One contract of ${name} ties up about ${dollars(cash)} right now, and the budget is ${dollars(capitalAllocated)}. Raise the budget to at least that.`
    : undefined;
}

/** The sentence a NEW subscription is refused with for what the live market or the account says,
 *  or undefined to take it (including when nothing could be read). */
export async function liveNeedsRefusal(
  input: LiveNeedsInput,
  reads: LiveNeedsReads,
): Promise<string | undefined> {
  const { lookup = findPair, resolve = findPlaybook } = input;
  const pair = lookup(input.playbookId);
  const playbook = resolve(input.playbookId);
  const symbol = pair?.symbols.length === 1 ? pair.symbols[0] : undefined;
  if (!(pair && playbook && symbol)) return undefined;
  const name = pairName(pair);
  const spot = await reads.price?.(symbol);
  if (reads.price && spot === undefined) {
    return `The market-data feed gave no price for ${symbol} just now, so ${name} can't be taken yet. Try again in a minute.`;
  }
  const traits = playbook.options;
  if (!traits) return undefined;
  const level = await reads.optionsLevel?.();
  if (level !== undefined && level < traits.requiredLevel) {
    return `${capitalized(name)} needs options level ${traits.requiredLevel} on this account, and it is at level ${level}.`;
  }
  const open = input.sessionOpen ?? regularSessionOpen(new Date(input.asOfIso));
  return open && reads.optionMarket && spot !== undefined
    ? chainRefusal(input, reads.optionMarket, playbook, symbol, spot, name)
    : undefined;
}
