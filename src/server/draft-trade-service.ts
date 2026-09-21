import type { AlpacaOptionsClient, MultiLegOrderLeg } from "../alpaca/alpaca-options-client.js";
import type { AlpacaTradingClient } from "../alpaca/alpaca-trading-client.js";
import { positionsFrom } from "../observatory/broker-positions.js";
import type { DraftLeg, DraftOrder } from "../trading/draft-order.js";
import { draftSymbols } from "../trading/draft-order.js";
import { validateDraftAccount } from "../trading/draft-order-account.js";
import type { OptionTimeInForce } from "../trading/option-economics.js";
import type { VerifyAccess } from "./account-identity-gate.js";
import { type DeskSubmitResult, readReview, submitAndAudit } from "./desk-gate.js";
import type { OrderAuditRecord } from "./order-audit-log.js";

/**
 * THE MULTI-LEG EXECUTION SEAM (#3407 P3 slice 1) — a reviewed draft reaches the broker only
 * through here, the way `trade-service.ts` and `option-trade-service.ts` carry the single-leg
 * desks. Open, for the same reason they are: this file never holds a raw broker-client factory,
 * only a `VerifyAccess` closure bound in `account-identity-gate.ts` (protected).
 *
 * The draft's state machine (`draft-order.ts`) already guarantees the review screen is the only
 * path to a submit. This layer is the re-check on FRESH numbers: the account and positions are
 * re-read, the same collateral rules re-run (`validateDraftAccount`), the account's options
 * level must admit a spread, every leg must carry a limit — a spread goes to the broker as ONE
 * net limit (`mleg`), so an "at market" leg has nothing to contribute — and only then does the
 * structure get sent, filled together or not at all.
 */

export interface DeskDraftRequest {
  readonly participantId: string;
  /** The reviewed draft exactly as the browser echoed it — re-checked here, never trusted. */
  readonly draft: DraftOrder;
  readonly timeInForce?: OptionTimeInForce;
}

export interface DraftTradeServiceDeps {
  /** The bound identity gate — the only way this service can reach a broker client. */
  readonly verifyAccess: VerifyAccess;
  readonly recordAudit?: (entry: OrderAuditRecord) => Promise<void>;
  readonly now?: () => Date;
}

export type SubmitDraftOrder = (
  request: DeskDraftRequest,
  requesterId: string | undefined,
) => Promise<DeskSubmitResult>;

/** The play code a spread is logged under — the ladder rung that opens the builder (#1671). */
export const MULTI_LEG_PLAY_CODE = "401";

/** Alpaca's tier for spreads; a paper account below it gets the refusal here, not from the wire. */
const SPREAD_OPTIONS_LEVEL = 3;

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/**
 * The structure's smallest unit: contracts per leg reduced by their common divisor, so a
 * "2 short / 2 long" spread is quantity 2 of a 1:1 unit and the net limit is per unit. Alpaca
 * prices the whole unit — a 1:2 ratio spread carries both ratios on the legs.
 */
export function multiLegStructure(legs: readonly DraftLeg[]): {
  readonly quantity: number;
  readonly ratios: readonly number[];
  /** Net premium per share per unit; positive is a debit, negative a credit (Alpaca's sign). */
  readonly netLimitPrice: number;
} {
  const quantity = legs.map((leg) => leg.contracts).reduce(gcd);
  const ratios = legs.map((leg) => leg.contracts / quantity);
  const net = legs.reduce(
    (sum, leg, i) =>
      sum + (leg.action === "buy" ? 1 : -1) * (leg.limitPrice ?? 0) * (ratios[i] ?? 0),
    0,
  );
  // The wire takes cents; float noise on a sum of two-decimal premiums must not reach it.
  return { quantity, ratios, netLimitPrice: Math.round(net * 100) / 100 };
}

/** Opening unless the account already holds the opposite side of that contract. */
function positionIntent(
  leg: DraftLeg,
  occSymbol: string,
  held: ReadonlyMap<string, number>,
): MultiLegOrderLeg["positionIntent"] {
  const quantity = held.get(occSymbol) ?? 0;
  if (leg.action === "buy") return quantity < 0 ? "buy_to_close" : "buy_to_open";
  return quantity > 0 ? "sell_to_close" : "sell_to_open";
}

/** Parsed defensively; absent means "unknown here", which skips the check rather than fabricating a 0. */
function optionsLevel(account: { options_trading_level?: string | number }): number | undefined {
  const level = Number(account.options_trading_level);
  return Number.isFinite(level) ? level : undefined;
}

/** Everything the draft must still pass on live numbers, as the refusals a member can act on. */
async function recheck(
  draft: DraftOrder,
  client: AlpacaTradingClient,
): Promise<{ refusals: string[]; held: Map<string, number> }> {
  const [account, positions] = await Promise.all([client.getAccount(), client.getPositions()]);
  const views = positionsFrom(positions);
  const refusals: string[] = [];
  const level = optionsLevel(account);
  if (level !== undefined && level < SPREAD_OPTIONS_LEVEL) {
    refusals.push(
      `Spreads need options level ${SPREAD_OPTIONS_LEVEL} on this account — it's at level ${level}.`,
    );
  }
  const verdict = validateDraftAccount(draft, { cash: Number(account.cash), positions: views });
  refusals.push(...verdict.refusals);
  return { refusals, held: new Map(views.map((view) => [view.symbol, view.quantity])) };
}

export function createDraftTradeService(deps: DraftTradeServiceDeps): SubmitDraftOrder {
  return async (request, requesterId) => {
    const access = deps.verifyAccess(request.participantId, requesterId);
    if (!("participant" in access)) return access;

    const { draft } = request;
    if (draft.phase !== "reviewed") {
      return { ok: false, refusals: ["Orders are only sent from the review screen."] };
    }
    if (draft.legs.length < 2) {
      return { ok: false, refusals: ["A multi-leg order needs at least two legs."] };
    }
    if (draft.legs.some((leg) => leg.limitPrice === undefined)) {
      return {
        ok: false,
        refusals: [
          "Every leg needs a limit price — a spread goes to the broker as one net limit, filled together or not at all.",
        ],
      };
    }

    const live = await readReview(() => recheck(draft, access.client));
    if ("refusals" in live) return { ok: false, refusals: live.refusals };
    if (live.preview.refusals.length > 0) return { ok: false, refusals: live.preview.refusals };

    const symbols = draftSymbols(draft);
    const structure = multiLegStructure(draft.legs);
    const legs: MultiLegOrderLeg[] = draft.legs.map((leg, i) => {
      const occSymbol = symbols[i] ?? "";
      return {
        occSymbol,
        ratioQty: structure.ratios[i] ?? 1,
        side: leg.action,
        positionIntent: positionIntent(leg, occSymbol, live.preview.held),
      };
    });

    return submitAndAudit(
      () => placeStructure(access.optionsClient, legs, structure, request.timeInForce, symbols),
      access.participant,
      deps,
      {
        code: MULTI_LEG_PLAY_CODE,
        intent: "open",
        // A debit is bought, a credit is sold — the one side word a whole structure has.
        side: structure.netLimitPrice >= 0 ? "buy" : "sell",
      },
    );
  };
}

/** The broker's parent order for an `mleg` carries no single symbol; the audit line names the legs. */
async function placeStructure(
  options: AlpacaOptionsClient,
  legs: readonly MultiLegOrderLeg[],
  structure: ReturnType<typeof multiLegStructure>,
  timeInForce: OptionTimeInForce | undefined,
  symbols: readonly string[],
) {
  const order = await options.placeMultiLegOrder({
    legs,
    quantity: structure.quantity,
    netLimitPrice: structure.netLimitPrice,
    ...(timeInForce ? { timeInForce } : {}),
  });
  return { ...order, symbol: order.symbol || symbols.join(",") };
}
