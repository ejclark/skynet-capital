import type { IncomingMessage, ServerResponse } from "node:http";
import { LADDER_GATE_NOTE, ladderNeighbor } from "../domain/progression.js";
import { previewOrder, type TicketOrderType } from "../trading/order-ticket.js";
import type { Session } from "./auth/session.js";
import { resolveCurrentId } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { opaqueMemberId } from "./feedback-issue.js";
import { parseJsonRecord, readJsonPost, sendJson } from "./page-shell.js";
import { playLocked } from "./progression-service.js";

/**
 * THE TRADE API — the React shell's pre-trade gate, as two POST endpoints.
 *
 *   POST /api/trade/review  → the pure ticket rules against the hub snapshot (same inputs the
 *                             server-rendered `/trade` review uses). A refused order is a rendered
 *                             explanation, never an error — the gate SHOWS why.
 *   POST /api/trade/submit  → `config.submitTrade`, i.e. the desk execution seam, which re-reads
 *                             the LIVE account and re-runs the same rules before anything reaches
 *                             the broker. The review response is a courtesy; the service is the
 *                             gate (trade-service.ts's own doctrine, unchanged).
 *
 * Identity comes from the session and nowhere else, resolved exactly as `/trade` resolves it; a
 * request body can claim any account and the service still refuses anything that isn't the
 * requester's own. Bodies must be `application/json` — an HTML form cannot produce that
 * content-type cross-origin without a CORS preflight, which closes the classic cookie-carried
 * cross-site POST. Unknown fields are dropped; malformed values are refused with a 400, never
 * coerced into an order.
 */

interface TradeApiBody {
  readonly participantId: string;
  readonly symbol: string;
  readonly quantity: number;
  readonly action: "buy" | "sell";
  readonly orderType?: TicketOrderType;
  readonly limitPrice?: number;
  readonly stopPrice?: number;
}

const TRADE_BODY_CAP_BYTES = 8_192;

/**
 * Course 101 hasn't been unlocked yet — cannot happen in practice (rung 0 is always open per
 * `unlockedCodes`), but a locked rung earns a real sentence rather than a silent fallback either
 * way.
 */
function stockLockedSentence(code: "101" | "102"): string {
  const prev = ladderNeighbor(code, -1);
  return `Training wheels are on, and course ${code} hasn't been unlocked yet${
    prev ? ` — it opens after your first filled ${prev.code} (${prev.name})` : ""
  }. Nothing was sent.`;
}

function parsePositivePrice(raw: unknown): number | undefined {
  const value = typeof raw === "number" ? raw : Number.NaN;
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

/** Strict shape gate: exactly the fields an order needs, verified, everything else dropped. */
function parseTradeBody(raw: string): TradeApiBody | undefined {
  const body = parseJsonRecord(raw);
  if (!body) return undefined;
  const participantId = body.participantId;
  const symbol = body.symbol;
  const quantity = body.quantity;
  const action = body.action;
  if (typeof participantId !== "string" || participantId.length === 0 || participantId.length > 100)
    return undefined;
  if (typeof symbol !== "string" || symbol.length === 0 || symbol.length > 12) return undefined;
  if (typeof quantity !== "number" || !Number.isFinite(quantity)) return undefined;
  if (action !== "buy" && action !== "sell") return undefined;
  const orderType =
    body.orderType === "limit" || body.orderType === "stop" || body.orderType === "market"
      ? body.orderType
      : undefined;
  const limitPrice = parsePositivePrice(body.limitPrice);
  const stopPrice = parsePositivePrice(body.stopPrice);
  return {
    participantId,
    symbol,
    quantity,
    action,
    ...(orderType ? { orderType } : {}),
    ...(limitPrice !== undefined ? { limitPrice } : {}),
    ...(stopPrice !== undefined ? { stopPrice } : {}),
  };
}

/** Read + gate one POST body. Returns undefined after answering the response itself. */
async function readTradeBody(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<TradeApiBody | undefined> {
  const raw = await readJsonPost(req, res, TRADE_BODY_CAP_BYTES);
  if (raw === undefined) return undefined;
  const body = parseTradeBody(raw);
  if (!body) {
    sendJson(res, 400, { error: "malformed order body" });
    return undefined;
  }
  return body;
}

/**
 * The two ladder-level refusals a stock ticket can hit, resolved together since both need the
 * same progression view. The feedback gate (#1119) is buy-only and wins when both hold, so the
 * per-rung lock below is skipped then — never two refusal sentences for one order.
 *
 *   - **Feedback gate**: training wheels on, no feedback filed yet — every BUY refused, a sell
 *     stays an exit and is never gated (restricting how someone leaves a position would be a
 *     safety bug).
 *   - **Per-rung ladder lock** (2026-09-06 fix, #1671): buy = 101, sell = 102, same doctrine as
 *     the options ticket. 102 was exempt from the feedback gate above only; it was never meant to
 *     be exempt from THIS lock, and wasn't in the domain rules (`unlockedCodes`) either — only the
 *     client and this route forgot to ask.
 */
async function resolveStockRefusal(
  action: "buy" | "sell",
  requesterId: string | undefined,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<string | undefined> {
  const progression =
    requesterId && config.progression
      ? await config.progression.view(
          requesterId,
          session ? opaqueMemberId(session.email) : undefined,
        )
      : undefined;
  if (action === "buy" && progression?.ladderGate) {
    return `Training wheels are on. ${LADDER_GATE_NOTE} Nothing was sent.`;
  }
  const code: "101" | "102" = action === "buy" ? "101" : "102";
  return playLocked(code, progression) ? stockLockedSentence(code) : undefined;
}

/** Handle `/api/trade/*`. Returns true when the request was answered. */
export async function serveTradeApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<boolean> {
  if (path !== "/api/trade/review" && path !== "/api/trade/submit") return false;
  const body = await readTradeBody(req, res);
  if (!body) return true;

  // Identity: the session and nowhere else — exactly `/trade`'s resolution.
  const requesterId = config.auth ? resolveCurrentId(session, config.resolveOwnerId) : undefined;
  const refusal = await resolveStockRefusal(body.action, requesterId, config, session);

  if (path === "/api/trade/review") {
    const snapshot = config.hub.getState().participants.find((p) => p.id === body.participantId);
    if (!snapshot) {
      sendJson(res, 404, { error: "no such desk" });
      return true;
    }
    const preview = previewOrder(body, {
      cash: snapshot.cash,
      positions: snapshot.positions,
      tradingEnabled: Boolean(config.tradingEnabled),
      isSelf: requesterId !== undefined && requesterId === body.participantId,
    });
    sendJson(res, 200, {
      preview: refusal
        ? { ...preview, ok: false, refusals: [refusal, ...preview.refusals] }
        : preview,
    });
    return true;
  }

  if (refusal) {
    sendJson(res, 200, { ok: false, refusals: [refusal] });
    return true;
  }
  if (!config.submitTrade) {
    sendJson(res, 200, {
      ok: false,
      refusals: ["Trading isn't wired in this deployment — the ticket reviews and refuses."],
    });
    return true;
  }
  sendJson(res, 200, await config.submitTrade(body, requesterId));
  return true;
}
