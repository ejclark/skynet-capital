import type { AlpacaOrder, AlpacaTradingClient } from "../alpaca/alpaca-trading-client.js";
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
 * `submit()` treats a successfully-accepted order as "filled" (paper markets fill near-instantly)
 * and surfaces a rejection only when the API rejects the submission, but it now POLLS
 * `getOrder(id)` a few times (`pollFill`) to learn the real `filled_avg_price`/`filled_qty`
 * before returning — the "later increment" this module's docblock used to defer. A poll that
 * never resolves (or throws) falls back to exactly today's behavior: the requested quantity,
 * no price — never worse than before this existed, and never turns a real fill into a rejection.
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
   * until Alpaca reports a real `filled_avg_price`. Never throws: a poll failure (network blip,
   * an id the API briefly can't find yet) is swallowed and treated as "not filled yet" — the
   * caller's fallback to the requested quantity with no price is always safe.
   */
  private async pollFill(orderId: string): Promise<AlpacaOrder | undefined> {
    for (let attempt = 0; attempt < this.fillPollAttempts; attempt++) {
      if (attempt > 0) await this.sleep(this.fillPollDelayMs);
      try {
        const order = await this.client.getOrder(orderId);
        if (order.filled_avg_price != null) return order;
      } catch {
        // Treated as "not filled yet" — the loop just tries again (or falls through on the last
        // attempt), never surfaced as a submission failure for an order the broker already has.
      }
    }
    return undefined;
  }

  async getPortfolio(): Promise<Portfolio> {
    const [account, positions] = await Promise.all([
      this.client.getAccount(),
      this.client.getPositions(),
    ]);
    return {
      cash: Number(account.cash),
      positions: positions.map((position) => ({
        symbol: position.symbol,
        quantity: Number(position.qty),
        avgPrice: Number(position.avg_entry_price),
      })),
    };
  }

  async submit(order: OrderIntent): Promise<OrderResult> {
    try {
      const placed = await this.client.placeOrder({
        symbol: order.symbol,
        qty: order.quantity,
        side: order.side,
      });
      if (placed.status === "rejected" || placed.status === "canceled") {
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
          // and never allowed to turn a real fill into a reported rejection.
        }
      }
      const filled = await this.pollFill(placed.id);
      return {
        intent: order,
        status: "filled",
        filledQuantity: filled?.filled_qty ? Number(filled.filled_qty) : order.quantity,
        ...(filled?.filled_avg_price ? { filledPrice: Number(filled.filled_avg_price) } : {}),
        orderId: placed.id,
      };
    } catch (error) {
      // The broker never created an order here (the request itself failed), so there is no id to
      // report — `orderId` stays absent, same as any submission that never reached the broker.
      return { intent: order, status: "rejected", reason: String(error) };
    }
  }
}
