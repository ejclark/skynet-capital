import {
  AlpacaOptionOrderFlow,
  type OptionFlowOptionsClient,
  type OptionFlowTradingClient,
  type OptionLegSubmission,
} from "../../src/adapters/alpaca-option-order-flow.js";
import { PendingOptionOrders } from "../../src/adapters/pending-option-orders.js";
import type {
  ContractSnapshot,
  PlaceMultiLegOrderParams,
  PlaceOptionOrderParams,
} from "../../src/alpaca/alpaca-options-client.js";
import {
  type AlpacaAccount,
  AlpacaApiError,
  type AlpacaOrder,
  type AlpacaPosition,
} from "../../src/alpaca/alpaca-trading-client.js";
import { clientOrderIdPrefix } from "../../src/autonomous/client-order-id.js";
import type { OrderSettlement } from "../../src/domain/order-settlement.js";

/**
 * A scriptable Alpaca for the bots' option order flow (#4642 slice 5): both client slices the flow
 * reads, every call logged in order, and each order's reads scripted as a sequence (the last read
 * repeats). No timers — the flow it builds waits on a sleep that resolves at once.
 */

export const NOW = Date.parse("2026-10-07T15:00:00.000Z");
export const PERSONA = "sauron";
export const PREFIX = clientOrderIdPrefix(PERSONA);
export const PUT = "CRWV261106P00085000";
export const LONG_CALL = "NVDA261113C00180000";
export const SHORT_CALL = "NVDA261113C00190000";

export const anOrder = (over: Partial<AlpacaOrder> = {}): AlpacaOrder => ({
  id: "o1",
  symbol: PUT,
  qty: "1",
  side: "sell",
  status: "new",
  filled_qty: "0",
  filled_avg_price: null,
  ...over,
});

export class FakeOptionBroker implements OptionFlowTradingClient, OptionFlowOptionsClient {
  readonly calls: string[] = [];
  readonly placedSingle: PlaceOptionOrderParams[] = [];
  readonly placedMulti: PlaceMultiLegOrderParams[] = [];
  account: AlpacaAccount = {
    id: "acct",
    cash: "50000",
    portfolio_value: "50000",
    status: "ACTIVE",
    options_trading_level: "3",
  };
  positions: AlpacaPosition[] = [];
  /** What `getPositions` answers AFTER the first call — a close re-reads once it cancels ours. */
  positionsAfterCancel?: AlpacaPosition[];
  open: AlpacaOrder[] = [];
  snapshots = new Map<string, ContractSnapshot>([
    [PUT, { bid: 2, ask: 2.2, quotedAt: "2026-10-07T14:59:30Z" }],
  ]);
  /** Orders Alpaca knows by client order id; `afterPost` lands one only once a POST was tried. */
  readonly byClientId = new Map<string, AlpacaOrder>();
  afterPost?: AlpacaOrder;
  /** Scripted answers for the next `getOrderByClientOrderId` calls, in order — an Error throws (a
   *  503, a dropped socket), `undefined` is Alpaca's 404. Once spent, the lookup answers as above. */
  readonly lookups: (AlpacaOrder | undefined | Error)[] = [];
  placeAnswer: AlpacaOrder | Error = anOrder();
  /** Per order id, what successive `getOrder` reads return (the last repeats). */
  readonly reads = new Map<string, (AlpacaOrder | Error)[]>();
  accountError?: Error;
  listError?: Error;
  private positionReads = 0;
  private posted = false;

  getAccount(): Promise<AlpacaAccount> {
    this.calls.push("getAccount");
    return this.accountError ? Promise.reject(this.accountError) : Promise.resolve(this.account);
  }

  getPositions(): Promise<AlpacaPosition[]> {
    this.calls.push("getPositions");
    this.positionReads += 1;
    const after = this.positionReads > 1 ? this.positionsAfterCancel : undefined;
    return Promise.resolve(after ?? this.positions);
  }

  listOrders(params: {
    status?: string;
    nested?: boolean;
    limit?: number;
  }): Promise<AlpacaOrder[]> {
    this.calls.push(`listOrders ${params.status} nested=${params.nested}`);
    return this.listError ? Promise.reject(this.listError) : Promise.resolve(this.open);
  }

  getOrder(id: string, params?: { nested?: boolean }): Promise<AlpacaOrder> {
    this.calls.push(`getOrder ${id} nested=${params?.nested}`);
    const sequence = this.reads.get(id);
    const next = sequence && sequence.length > 1 ? sequence.shift() : sequence?.[0];
    if (next === undefined)
      return Promise.reject(new AlpacaApiError(404, { message: "not found" }));
    return next instanceof Error ? Promise.reject(next) : Promise.resolve(next);
  }

  cancelOrder(id: string): Promise<void> {
    this.calls.push(`cancel ${id}`);
    return Promise.resolve();
  }

  getOrderByClientOrderId(cid: string): Promise<AlpacaOrder | undefined> {
    this.calls.push(`byClientId ${cid}`);
    if (this.lookups.length > 0) {
      const scripted = this.lookups.shift();
      return scripted instanceof Error ? Promise.reject(scripted) : Promise.resolve(scripted);
    }
    const landed = this.posted && this.afterPost ? this.afterPost : undefined;
    return Promise.resolve(this.byClientId.get(cid) ?? landed);
  }

  placeOptionOrder(params: PlaceOptionOrderParams): Promise<AlpacaOrder> {
    this.calls.push("placeOptionOrder");
    this.placedSingle.push(params);
    return this.answerPost();
  }

  placeMultiLegOrder(params: PlaceMultiLegOrderParams): Promise<AlpacaOrder> {
    this.calls.push("placeMultiLegOrder");
    this.placedMulti.push(params);
    return this.answerPost();
  }

  getContractSnapshots(occSymbols: readonly string[]): Promise<Map<string, ContractSnapshot>> {
    this.calls.push(`snapshots ${occSymbols.join(",")}`);
    return Promise.resolve(
      new Map([...this.snapshots].filter(([occ]) => occSymbols.includes(occ))),
    );
  }

  private answerPost(): Promise<AlpacaOrder> {
    this.posted = true;
    const answer = this.placeAnswer;
    return answer instanceof Error ? Promise.reject(answer) : Promise.resolve(answer);
  }
}

/** A flow over `broker` that never really waits: 3 polls, 2 settle re-reads. Every settlement it
 *  reports lands in `settled`, unless `onSettled` replaces that listener. */
export function flowOver(
  broker: FakeOptionBroker,
  pending = new PendingOptionOrders(),
  onSettled?: (settlement: OrderSettlement) => void,
): {
  flow: AlpacaOptionOrderFlow;
  pending: PendingOptionOrders;
  submitted: OptionLegSubmission[];
  settled: OrderSettlement[];
} {
  const submitted: OptionLegSubmission[] = [];
  const settled: OrderSettlement[] = [];
  const flow = new AlpacaOptionOrderFlow({
    trading: broker,
    options: broker,
    pending,
    clientOrderIdPrefix: PREFIX,
    onSubmitted: (info) => submitted.push(info),
    onSettled: onSettled ?? ((s) => settled.push(s)),
    now: () => NOW,
    sleep: () => Promise.resolve(),
    timing: { waitMs: 3_000, pollMs: 1_000, settleAttempts: 2, settleDelayMs: 500 },
  });
  return { flow, pending, submitted, settled };
}
