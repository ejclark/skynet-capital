import { type EarningsPrint, etTimeOf, optionPrintBlackout } from "../domain/earnings-calendar.js";
import { sessionsBefore, sessionsBetween } from "../domain/market-calendar.js";
import { marketDayKey } from "../domain/market-day.js";
import { type HeldContract, heldContracts, quoteBand } from "../domain/option-book.js";
import type {
  MarketContext,
  OptionContractQuote,
  OptionDemand,
  OptionOrderIntent,
  OrderIntent,
  Portfolio,
} from "../domain/types.js";
import { closeAggression, priceInside, singleLegTick } from "../options/contract-picker.js";
import { humanizeOptionSymbol, OPTION_MULTIPLIER } from "../trading/option-symbols.js";
import { type OptionLegSpec, optionCloseIntent } from "./option-intent.js";
import type { EnabledPlaybook } from "./playbook.js";

/**
 * EXPIRY HYGIENE — the safety closes every bot account gets, whoever opened the contract. PURE.
 *
 * A bot never carries a contract into its last two sessions: an exercised long buys 100 shares, an
 * assigned short sells or buys them, and expiration-day liquidity is the worst of the contract's
 * life. So from T-2 (two sessions before expiry) every held contract is closed — longs always;
 * shorts too, unless an ENABLED playbook owning that underlying declares it holds that short into
 * assignment on purpose (the wheel). A paused wheel is unattended, so its shorts are closed.
 *
 * A short whose expiry now spans a print is closed two sessions before the print's blackout starts,
 * whatever its owner declares — which also catches a print that moved earlier.
 *
 * A due close starts at mid and walks toward the natural side as the sessions pass
 * (`closeAggression`); a close must never starve. With no quote it waits at T-2, and from T-1 it is
 * emitted at its mark with no band, so the guards refuse it as `no-quote` — a stuck contract is
 * loud, never silent.
 */

/** Sessions before expiry that a contract falls due (T-2). */
const EXPIRY_CLOSE_SESSIONS = 2;
/** Sessions before a print blackout that a short spanning it falls due. */
const PRINT_CLOSE_SESSIONS = 2;

type HygieneKind = "expiry-hygiene" | "print-span-close";

interface DueClose {
  readonly contract: HeldContract;
  /** The date it fell due — aggression counts sessions from here. */
  readonly due: string;
  readonly kind: HygieneKind;
}

/** The enabled option playbook that trades `underlying`, if any. */
function ownerOf(
  enabled: readonly EnabledPlaybook[],
  underlying: string,
): EnabledPlaybook | undefined {
  return enabled.find((e) => e.playbook.options?.underlyings.includes(underlying));
}

/** Every held contract due to close by `asOfIso`, each with the earliest rule that made it due. */
function dueCloses(
  asOfIso: string,
  portfolio: Portfolio,
  enabled: readonly EnabledPlaybook[],
  calendar: readonly EarningsPrint[],
): DueClose[] {
  const today = marketDayKey(asOfIso);
  const due: DueClose[] = [];
  for (const contract of heldContracts(portfolio)) {
    const short = contract.quantity < 0;
    const holds = ownerOf(enabled, contract.underlying)?.playbook.options?.holdsShortToExpiry;
    const rules: { readonly due: string; readonly kind: HygieneKind }[] = [];
    if (!(short && holds?.includes(contract.type))) {
      rules.push({
        due: sessionsBefore(contract.expiration, EXPIRY_CLOSE_SESSIONS),
        kind: "expiry-hygiene",
      });
    }
    const blackout = short
      ? optionPrintBlackout(contract.underlying, asOfIso, calendar)
      : undefined;
    if (blackout && contract.expiration >= blackout.start) {
      rules.push({
        due: sessionsBefore(blackout.start, PRINT_CLOSE_SESSIONS),
        kind: "print-span-close",
      });
    }
    const first = rules
      .filter((r) => r.due <= today)
      .sort((a, b) => a.due.localeCompare(b.due) || a.kind.localeCompare(b.kind))[0];
    if (first) due.push({ contract, ...first });
  }
  return due;
}

/** Due closes in one (underlying, type, expiry) group, as orders: exactly one long and one short of
 *  equal size close together as one vertical; anything else closes leg by leg. */
function closings(group: readonly DueClose[]): (readonly DueClose[])[] {
  const [a, b] = group;
  const vertical =
    group.length === 2 &&
    a !== undefined &&
    b !== undefined &&
    Math.sign(a.contract.quantity) !== Math.sign(b.contract.quantity) &&
    Math.abs(a.contract.quantity) === Math.abs(b.contract.quantity);
  if (!vertical) return group.map((d) => [d]);
  // The closing-long leg first, as every vertical in this codebase is written.
  return [a.contract.quantity > 0 ? [a, b] : [b, a]];
}

const cents = (x: number): number => Math.round(x * 100) / 100;

/** A contract's per-share mark without a quote: the broker's own mark, else its average price. */
function markOf(contract: HeldContract): number {
  const fromMarket =
    contract.marketValue !== undefined
      ? Math.abs(contract.marketValue) / (Math.abs(contract.quantity) * OPTION_MULTIPLIER)
      : undefined;
  return Math.max(0.01, cents(fromMarket ?? contract.avgPrice));
}

/** The band a close prices inside, from the snapshot: `[bid, ask]` for one leg (the tick read off
 *  those quotes), the signed net for a vertical (in cents). */
function quotedClose(
  option: OptionOrderIntent,
  quotes: Readonly<Record<string, OptionContractQuote>>,
):
  | { readonly low: number; readonly high: number; readonly at: string; readonly tick: number }
  | undefined {
  const band = quoteBand(option, quotes);
  if (!band) return undefined;
  const legQuotes = option.legs.map((l) => quotes[l.occSymbol]);
  const stamps = legQuotes.map((q) => q?.quotedAt ?? q?.fetchedAt ?? "");
  const at = band.at ?? [...stamps].sort()[0] ?? "";
  const only = option.legs.length === 1 ? legQuotes[0] : undefined;
  const tick =
    only?.bid !== undefined && only.ask !== undefined ? singleLegTick(only.bid, only.ask) : 0.01;
  return { low: band.low, high: band.high, at, tick };
}

/** The limit for a close: inside the quoted band at this session's aggression, or — from T-1 with
 *  no quote — at the mark with no band. A vertical whose net rounds to 0 moves one tick toward
 *  natural, or stays unpriced. */
function closePrice(
  legs: readonly OptionLegSpec[],
  closing: readonly DueClose[],
  context: MarketContext,
  sessionsLate: number,
): { readonly limitPrice: number; readonly band?: OptionOrderIntent["band"] } | undefined {
  const draft: OptionOrderIntent = {
    effect: "close",
    structure: "close",
    legs: legs.map((l) => ({ ...l, ratio: 1 })),
    limitPrice: 1,
  };
  const quoted = quotedClose(draft, context.options?.contracts ?? {});
  if (!quoted) {
    if (sessionsLate < 1) return undefined;
    const net = closing.reduce(
      (sum, d) => sum + (d.contract.quantity < 0 ? 1 : -1) * markOf(d.contract),
      0,
    );
    const [only] = closing;
    const limitPrice = closing.length === 1 && only ? markOf(only.contract) : cents(net) || 0.01;
    return { limitPrice };
  }
  const aggression = closeAggression(sessionsLate, etTimeOf(context.asOf));
  const [leg] = legs;
  const side = legs.length === 1 && leg ? leg.side : "buy";
  let price = priceInside(quoted, side, aggression, quoted.tick);
  if (price === 0 && legs.length === 2) price = 0.01 <= quoted.high ? 0.01 : undefined;
  if (price === undefined) return undefined;
  return { limitPrice: price, band: { low: quoted.low, high: quoted.high, at: quoted.at } };
}

/** One close order for a set of due contracts, tagged to the owner playbook when one exists. */
function closeIntent(
  closing: readonly DueClose[],
  context: MarketContext,
  enabled: readonly EnabledPlaybook[],
): OrderIntent | undefined {
  const [first] = closing;
  if (!first) return undefined;
  const earliest = [...closing].sort((a, b) => a.due.localeCompare(b.due))[0] ?? first;
  const sessionsLate = sessionsBetween(earliest.due, marketDayKey(context.asOf));
  const legs: OptionLegSpec[] = closing.map((d) => ({
    occSymbol: d.contract.occSymbol,
    side: d.contract.quantity > 0 ? "sell" : "buy",
  }));
  const priced = closePrice(legs, closing, context, sessionsLate);
  if (!priced) return undefined;
  const owner = ownerOf(enabled, first.contract.underlying);
  const names = closing.map((d) => humanizeOptionSymbol(d.contract.occSymbol)).join(" / ");
  const aggression = closeAggression(sessionsLate, etTimeOf(context.asOf));
  return optionCloseIntent({
    underlying: first.contract.underlying,
    legs,
    quantity: Math.abs(first.contract.quantity),
    limitPrice: priced.limitPrice,
    ...(priced.band ? { band: priced.band } : {}),
    reason:
      earliest.kind === "print-span-close"
        ? `Closing ${names}: it would still be open across ${first.contract.underlying}'s earnings.`
        : `Closing ${names} two sessions before it expires — a bot never carries a contract into expiry.`,
    expectation: priced.band
      ? `${aggression === 0 ? "Priced at mid" : `Priced ${Math.round(aggression * 100)}% of the way from mid to the natural side`}; each session past due moves it closer to natural.`
      : "No live quote for this contract, so it is priced at its mark and will be refused until one arrives.",
    strategy: earliest.kind,
    urgent: true,
    selection: { rule: earliest.kind, ...(priced.band ? { towardNatural: aggression } : {}) },
    ...(owner ? { playbookId: owner.playbook.id, playbookMode: owner.mode } : {}),
  });
}

/**
 * The safety closes due this cycle, skipping contracts the playbooks' own intents already close
 * (`claimedOccs`). One order per closing group, in position order.
 */
export function hygieneIntents(
  context: MarketContext,
  portfolio: Portfolio,
  enabled: readonly EnabledPlaybook[],
  calendar: readonly EarningsPrint[],
  claimedOccs: ReadonlySet<string> = new Set(),
): OrderIntent[] {
  const groups = new Map<string, DueClose[]>();
  for (const due of dueCloses(context.asOf, portfolio, enabled, calendar)) {
    if (claimedOccs.has(due.contract.occSymbol)) continue;
    const c = due.contract;
    const key = `${c.underlying}|${c.type}|${c.expiration}`;
    groups.set(key, [...(groups.get(key) ?? []), due]);
  }
  const intents: OrderIntent[] = [];
  for (const group of groups.values()) {
    for (const closing of closings(group)) {
      const intent = closeIntent(closing, context, enabled);
      if (intent) intents.push(intent);
    }
  }
  return intents;
}

/** The quotes hygiene needs this cycle: every held contract already due. Nothing due, no network. */
export function hygieneDemand(
  asOfIso: string,
  portfolio: Portfolio,
  enabled: readonly EnabledPlaybook[],
  calendar: readonly EarningsPrint[],
): OptionDemand {
  return {
    chains: [],
    contracts: dueCloses(asOfIso, portfolio, enabled, calendar).map((d) => d.contract.occSymbol),
  };
}
