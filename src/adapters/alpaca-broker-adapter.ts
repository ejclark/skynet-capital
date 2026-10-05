import type { AlpacaOrder, AlpacaTradingClient } from "../alpaca/alpaca-trading-client.js";
import { isBareContractOrder } from "../domain/option-order.js";
import type { OrderIntent, OrderResult, Portfolio, Side } from "../domain/types.js";
import type { BrokerPort } from "../ports/broker.js";

/** Attempts × delay for the post-fill poll below — Alpaca paper orders "usually" fill near-
 *  instantly but not on the `placeOrder` response itself (this module's own prior doc comment).
 *  ~3 tries at 300ms is a sub-second worst case per order, cheap against a 30s+ trading cycle. */
const DEFAULT_FILL_POLL_ATTEMPTS = 3;
const DEFAULT_FILL_POLL_DELAY_MS = 300;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Broker statuses that mean the order is over. With nothing filled, it never traded. */
const ENDED_UNFILLED: ReadonlySet<string> = new Set(["canceled", "expired", "rejected"]);

/**
 * What the last read of a placed order honestly says (#4655). Only a filled quantity the broker
 * reported is a fill — a partial fill reports what filled. An order that ended with nothing filled
 * is a rejection; anything else (accepted, new, held, pending_new, or no read at all) is still live
 * at the broker and may yet fill, so it is `working` — never `filled` at the asked quantity, which
 * is what a queued after-hours order used to be logged as.
 */
function resultFromLastRead(
  order: OrderIntent,
  placed: AlpacaOrder,
  last: AlpacaOrder | undefined,
): OrderResult {
  const filledQuantity = Number(last?.filled_qty ?? 0);
  if (filledQuantity > 0) {
    return {
      intent: order,
      status: "filled",
      filledQuantity,
      ...(last?.filled_avg_price ? { filledPrice: Number(last.filled_avg_price) } : {}),
      orderId: placed.id,
    };
  }
  const brokerStatus = last?.status ?? placed.status;
  return {
    intent: order,
    status: ENDED_UNFILLED.has(brokerStatus) ? "rejected" : "working",
    reason: `order ${brokerStatus}`,
    orderId: placed.id,
  };
}

/**
 * One order this adapter's own submit path got the broker to accept — everything a caller
 * needs to translate into an audit line or a bus event, without this module knowing either
 * concept exists (#1211 slice 2: `AlpacaBrokerAdapter.submit` writes no audit line at all today,
 * the one path — bot autonomous orders — that bypasses `desk-gate.ts`'s `submitAndAudit`).
 */
export interface BotOrderSubmission {
  readonly orderId: string;
  readonly symbol: string;
  readonly side: Side;
  readonly quantity: number;
  readonly at: string;
}

/**
 * Adapts the Alpaca paper Trading API to the engine's `BrokerPort`. Because the engine
 * depends only on the port, swapping the in-memory paper broker for this live adapter
 * changes no engine, persona, or guard code — that's the whole point of the port.
 *
 * Fill semantics differ from the in-memory broker: a market order posts asynchronously
 * and Alpaca fills it shortly after — the initial "accepted" response carries no fill price.
 * `submit()` POLLS `getOrder(id)` a few times (`pollFill`) and reports what the LAST read of the
 * order actually showed: `filled` only on a broker-confirmed filled quantity, `rejected` when the
 * broker canceled, expired or rejected it with nothing filled, and `working` for everything else —
 * a queued after-hours order, or a fill slower than the poll (#4655). It used to call any accepted
 * order "filled" at the asked quantity with no price, which logged orders that never traded.
 */
export class AlpacaBrokerAdapter implements BrokerPort {
  private readonly client: AlpacaTradingClient;
  private readonly onSubmitted?: (info: BotOrderSubmission) => void;
  private readonly now: () => Date;
  private readonly fillPollAttempts: number;
  private readonly fillPollDelayMs: number;
  private readonly sleep: (ms: number) => Promise<void>;

  /**
   * `deps.onSubmitted` fires once the broker has actually accepted an order — never on a
   * rejection — mirroring `submitAndAudit`'s "append the audit line on success only". A
   * throwing listener can never break `submit()`'s own result: this is a notification, not a
   * gate, so the caller wraps its own bus-publish failure handling (`activity-publishing.ts`'s
   * `logBusFailure` pattern) rather than this adapter swallowing anything silently.
   *
   * `deps.sleep`/`fillPollAttempts`/`fillPollDelayMs` exist so tests can poll instantly and
   * deterministically rather than waiting on real timers or retry counts.
   */
  constructor(
    client: AlpacaTradingClient,
    deps?: {
      onSubmitted?: (info: BotOrderSubmission) => void;
      now?: () => Date;
      sleep?: (ms: number) => Promise<void>;
      fillPollAttempts?: number;
      fillPollDelayMs?: number;
    },
  ) {
    this.client = client;
    this.onSubmitted = deps?.onSubmitted;
    this.now = deps?.now ?? (() => new Date());
    this.sleep = deps?.sleep ?? sleep;
    this.fillPollAttempts = deps?.fillPollAttempts ?? DEFAULT_FILL_POLL_ATTEMPTS;
    this.fillPollDelayMs = deps?.fillPollDelayMs ?? DEFAULT_FILL_POLL_DELAY_MS;
  }

  /**
   * Polls `getOrder(id)` up to `fillPollAttempts` times, waiting `fillPollDelayMs` between tries,
   * until Alpaca reports a real `filled_avg_price` or the order has ended. Returns the last read
   * that succeeded (undefined when none did). Never throws: a poll failure (network blip, an id the
   * API briefly can't find yet) is swallowed and the loop just tries again — the caller reads a
   * missing answer as "still working", never as a fill or a rejection.
   */
  private async pollFill(orderId: string): Promise<AlpacaOrder | undefined> {
    let last: AlpacaOrder | undefined;
    for (let attempt = 0; attempt < this.fillPollAttempts; attempt++) {
      if (attempt > 0) await this.sleep(this.fillPollDelayMs);
      try {
        last = await this.client.getOrder(orderId);
        if (last.filled_avg_price != null || ENDED_UNFILLED.has(last.status)) return last;
      } catch {
        // Treated as "not filled yet" — never surfaced as a submission failure for an order the
        // broker already has.
      }
    }
    return last;
  }

  async getPortfolio(): Promise<Portfolio> {
    const [account, positions] = await Promise.all([
      this.client.getAccount(),
      this.client.getPositions(),
    ]);
    return {
      cash: Number(account.cash),
      positions: positions.map((position) => {
        // `market_value` is the broker's own dollar mark, already contract-scaled for options —
        // the one mark for a holding the price stream never quotes (#4643). Absent or unparseable
        // leaves it off, so valuation falls back to cost rather than to a false $0.
        const raw: unknown = position.market_value;
        const marketValue = typeof raw === "string" && raw.trim() !== "" ? Number(raw) : Number.NaN;
        return {
          symbol: position.symbol,
          quantity: Number(position.qty),
          avgPrice: Number(position.avg_entry_price),
          ...(Number.isFinite(marketValue) ? { marketValue } : {}),
        };
      }),
    };
  }

  async submit(order: OrderIntent): Promise<OrderResult> {
    // Option orders are not wired to the broker yet — refused here so nothing can ever reach the
    // share path below as a market order on the underlying or on a contract.
    if (order.option || isBareContractOrder(order)) {
      return {
        intent: order,
        status: "rejected",
        reason: "option orders are not wired to the broker yet",
      };
    }
    try {
      const placed = await this.client.placeOrder({
        symbol: order.symbol,
        qty: order.quantity,
        side: order.side,
      });
      if (ENDED_UNFILLED.has(placed.status)) {
        return {
          intent: order,
          status: "rejected",
          reason: `order ${placed.status}`,
          orderId: placed.id,
        };
      }
      if (this.onSubmitted) {
        try {
          this.onSubmitted({
            orderId: placed.id,
            symbol: order.symbol,
            side: order.side,
            quantity: order.quantity,
            at: this.now().toISOString(),
          });
        } catch {
          // A listener's own failure is its caller's to log — never this adapter's problem,
          // and never allowed to turn a live order into a reported rejection.
        }
      }
      return resultFromLastRead(order, placed, await this.pollFill(placed.id));
    } catch (error) {
      // The broker never created an order here (the request itself failed), so there is no id to
      // report — `orderId` stays absent, same as any submission that never reached the broker.
      return { intent: order, status: "rejected", reason: String(error) };
    }
  }
}
