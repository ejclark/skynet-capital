import { optionOrderProblems } from "../domain/option-order.js";
import type {
  OptionOrderIntent,
  OptionQuoteBand,
  OptionSelection,
  OrderForecast,
  OrderIntent,
  PlaybookMode,
  Side,
} from "../domain/types.js";

/**
 * The only way a playbook (or expiry hygiene) builds an option order. Both builders return
 * `undefined` whenever the result would fail `optionOrderProblems` — the same rule the guards and
 * the wire parser apply — so no play can emit a malformed option order; at worst it emits nothing.
 */

/** The non-option fields every option intent carries. */
interface IntentFrame {
  /** The ticker — every leg's OCC root. */
  readonly underlying: string;
  readonly reason: string;
  readonly strategy?: string;
  readonly expectation?: string;
  readonly forecast?: OrderForecast;
  readonly urgent?: boolean;
  /** Hygiene stamps its owner's id; a playbook's own `decide` output is stamped centrally. */
  readonly playbookId?: string;
  readonly playbookMode?: PlaybookMode;
  readonly selection?: OptionSelection;
}

export interface OptionLegSpec {
  readonly occSymbol: string;
  readonly side: Side;
}

export interface OptionOpenSpec extends IntentFrame {
  readonly structure: "cash-secured-put" | "covered-call" | "call-debit-spread";
  /** One leg, or a debit spread's [long, short]. */
  readonly legs: readonly OptionLegSpec[];
  /** Per share: a single leg's premium, or a vertical's signed net. */
  readonly limitPrice: number;
  /** The quote the limit was priced inside. An open always has one. */
  readonly band: OptionQuoteBand;
  readonly assignment?: "intended";
}

export interface OptionCloseSpec extends IntentFrame {
  /** One leg, or a vertical's [closing-long, closing-short]. */
  readonly legs: readonly OptionLegSpec[];
  /** Contracts (one leg) or whole verticals (two legs). */
  readonly quantity: number;
  readonly limitPrice: number;
  /** Absent only on a close priced at its mark for lack of a quote — the guards refuse it,
   *  loudly (`no-quote`). */
  readonly band?: OptionQuoteBand;
}

function build(
  frame: IntentFrame,
  option: OptionOrderIntent,
  quantity: number,
): OrderIntent | undefined {
  const [first, second] = option.legs;
  // One leg trades that leg's side; a vertical is a "buy" when it pays a net debit.
  const side: Side = second ? (option.limitPrice > 0 ? "buy" : "sell") : (first?.side ?? "buy");
  const intent: OrderIntent = {
    symbol: frame.underlying,
    side,
    quantity,
    type: "limit",
    reason: frame.reason,
    ...(frame.playbookId !== undefined ? { playbookId: frame.playbookId } : {}),
    ...(frame.playbookMode !== undefined ? { playbookMode: frame.playbookMode } : {}),
    ...(frame.urgent ? { urgent: true } : {}),
    ...(frame.strategy !== undefined ? { strategy: frame.strategy } : {}),
    ...(frame.expectation !== undefined ? { expectation: frame.expectation } : {}),
    ...(frame.forecast !== undefined ? { forecast: frame.forecast } : {}),
    option,
  };
  return optionOrderProblems(intent).length === 0 ? intent : undefined;
}

const legsOf = (legs: readonly OptionLegSpec[]) =>
  legs.map((leg) => ({ occSymbol: leg.occSymbol, side: leg.side, ratio: 1 }));

/** One unit of an opening structure — every open is one contract or one spread. */
export function optionOpenIntent(spec: OptionOpenSpec): OrderIntent | undefined {
  return build(
    spec,
    {
      effect: "open",
      structure: spec.structure,
      legs: legsOf(spec.legs),
      limitPrice: spec.limitPrice,
      band: spec.band,
      ...(spec.assignment ? { assignment: spec.assignment } : {}),
      ...(spec.selection ? { selection: spec.selection } : {}),
    },
    1,
  );
}

/** A close of held contracts: one leg, or a vertical as one order. */
export function optionCloseIntent(spec: OptionCloseSpec): OrderIntent | undefined {
  return build(
    spec,
    {
      effect: "close",
      structure: "close",
      legs: legsOf(spec.legs),
      limitPrice: spec.limitPrice,
      ...(spec.band ? { band: spec.band } : {}),
      ...(spec.selection ? { selection: spec.selection } : {}),
    },
    spec.quantity,
  );
}
