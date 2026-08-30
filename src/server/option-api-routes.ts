import type { IncomingMessage, ServerResponse } from "node:http";
import type { AlpacaOptionsClient, OptionChainRow } from "../alpaca/alpaca-options-client.js";
import { rowPremium } from "../alpaca/alpaca-options-client.js";
import { ladderNeighbor } from "../domain/progression.js";
import { tradeTypeByCode } from "../domain/trade-types.js";
import { ticketContext } from "../observatory/desk-data.js";
import type { ParticipantSnapshot } from "../observatory/participant-snapshot.js";
import {
  type OptionPlayCode,
  previewOptionClose,
  previewOptionOrder,
} from "../trading/option-ticket.js";
import type { Session } from "./auth/session.js";
import { resolveCurrentId } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { serveChain } from "./option-chain-route.js";
import type { DeskOptionRequest } from "./option-trade-service.js";
import {
  boundedString,
  parseJsonRecord,
  readJsonPost,
  requireGet,
  sendJson,
} from "./page-shell.js";
import { type ParticipantProgression, playLocked } from "./progression-service.js";

/** Trade-type codes that ride the OPTION preview/review pipeline. */
const OPTION_CODES = new Set(["201", "202", "301", "302"]);

/** Best-effort premium/spot for the option review — a refused order never depends on this. */
async function reviewEstimates(
  client: AlpacaOptionsClient | undefined,
  underlying: string,
  expiration: string,
  type: "call" | "put",
  strike: number,
): Promise<{ premium?: number; spot?: number }> {
  if (!client) return {};
  try {
    const [chain, spot] = await Promise.all([
      client.getChain(underlying, expiration, type),
      client.getUnderlyingPrice(underlying),
    ]);
    const row = chain.find((r: OptionChainRow) => r.strike === strike);
    const premium = row ? rowPremium(row) : undefined;
    return {
      ...(premium !== undefined ? { premium } : {}),
      ...(spot !== undefined ? { spot } : {}),
    };
  } catch {
    return {};
  }
}

/**
 * THE OPTIONS TICKET AS DATA — the shell's twin of the legacy `/trade` option
 * pipeline (`option-order-review.ts`), three endpoints:
 *
 *   GET  /api/trade/chain          → expirations + one expiration's chain + spot, through the
 *                                    REQUESTER'S OWN options client only — exactly the legacy
 *                                    ticket's `ticketData`, with every failure degrading to an
 *                                    honest `chainNote` instead of an error.
 *   POST /api/trade/option/review  → the pure `option-ticket.ts` rules against the desk snapshot
 *                                    plus best-effort premium/spot estimates. A refused order is
 *                                    a rendered explanation, never an error.
 *   POST /api/trade/option/submit  → `config.submitOptionTrade`, the options execution seam,
 *                                    which re-reads the live account, re-resolves the CONTRACT,
 *                                    and re-runs the same rules — the review is a courtesy, the
 *                                    service is the gate (`option-trade-service.ts`, unchanged).
 *
 * The legacy POST's ladder rule ports whole: with training wheels on, a locked play refuses
 * BEFORE any estimate or broker read, and a close is exempt by construction (restricting how
 * someone leaves a position would be a safety bug). Identity is the session's and nowhere else;
 * a body can claim any desk and the service still refuses anything that isn't the requester's
 * own. Same strict-JSON posture as `trade-api-routes.ts`: 405/415/413 preamble, shape gate that
 * 400s rather than coerces, unknown fields dropped.
 */

const OPTION_BODY_CAP_BYTES = 8_192;

const posFinite = (raw: unknown): number | undefined =>
  typeof raw === "number" && Number.isFinite(raw) && raw > 0 ? raw : undefined;

/** Strict shape gate for an OPEN: the fields `DeskOptionRequest` needs, verified, nothing else.
 *  Semantics (whole contracts, listed strikes, real dates) stay with the pure ticket rules —
 *  they refuse with sentences; this gate only guards types and bounds. */
function parseOpenBody(
  body: Record<string, unknown>,
): Extract<DeskOptionRequest, { kind: "open" }> | undefined {
  const participantId = boundedString(body.participantId, 100);
  const underlying = boundedString(body.underlying, 12);
  const code = boundedString(body.code, 3);
  const expiration = boundedString(body.expiration, 10);
  const contracts = body.contracts;
  const strike = body.strike;
  const orderType = body.orderType;
  if (!(participantId && underlying && expiration)) return undefined;
  if (!(code && OPTION_CODES.has(code))) return undefined;
  if (typeof contracts !== "number" || !Number.isFinite(contracts)) return undefined;
  if (typeof strike !== "number" || !Number.isFinite(strike)) return undefined;
  if (orderType !== "limit" && orderType !== "market") return undefined;
  const limitPrice = posFinite(body.limitPrice);
  return {
    kind: "open",
    participantId,
    code: code as OptionPlayCode,
    underlying,
    contracts,
    strike,
    expiration,
    orderType,
    ...(limitPrice !== undefined ? { limitPrice } : {}),
  };
}

/** Strict shape gate for a CLOSE — direction and size resolve server-side from the live holding. */
function parseCloseBody(
  body: Record<string, unknown>,
): Extract<DeskOptionRequest, { kind: "close" }> | undefined {
  const participantId = boundedString(body.participantId, 100);
  const occSymbol = boundedString(body.occSymbol, 24);
  if (!(participantId && occSymbol)) return undefined;
  const contracts = body.contracts;
  if (contracts !== undefined && !(typeof contracts === "number" && Number.isFinite(contracts)))
    return undefined;
  return {
    kind: "close",
    participantId,
    occSymbol: occSymbol.trim().toUpperCase(),
    ...(contracts !== undefined ? { contracts } : {}),
  };
}

function parseOptionBody(raw: string): DeskOptionRequest | undefined {
  const body = parseJsonRecord(raw);
  if (!body) return undefined;
  if (body.kind === "open") return parseOpenBody(body);
  if (body.kind === "close") return parseCloseBody(body);
  return undefined;
}

/** The legacy `lockedRefusal` sentence, minus its HTML shell — names the rung to fill. */
function lockedSentence(code: OptionPlayCode): string {
  const prev = ladderNeighbor(code, -1);
  return `Training wheels are on, and course ${code} hasn't been unlocked yet${
    prev ? ` — it opens after your first filled ${prev.code} (${prev.name})` : ""
  }. Nothing was sent. Turn the wheels off to open the full catalog.`;
}

async function reviewOption(
  res: ServerResponse,
  request: DeskOptionRequest,
  snapshot: ParticipantSnapshot,
  config: DashboardServerConfig,
  requesterId: string | undefined,
  progression: ParticipantProgression | undefined,
): Promise<void> {
  const isSelf = requesterId !== undefined && requesterId === request.participantId;
  const base = ticketContext(snapshot, { tradingEnabled: Boolean(config.tradingEnabled), isSelf });
  if (request.kind === "close") {
    // The 10a security review's one finding: a close preview has no legitimate use on a desk
    // that isn't yours, so off your own desk it runs against an empty book — the refusal still
    // explains itself, but the desk's held count, direction, and mark are never echoed. The OPEN
    // branch below deliberately keeps the stock API's shared-universe posture: the same
    // cash/position figures already sit on every desk's positions tab behind the invite gate.
    const closeContext = isSelf ? base : { ...base, positions: [] };
    sendJson(res, 200, {
      preview: previewOptionClose(request.occSymbol, closeContext, request.contracts),
    });
    return;
  }
  if (playLocked(request.code, progression)) {
    // The pure preview costs no broker read, so the gate can still SHOW the whole ticket — with
    // the ladder refusal in front, exactly where the legacy review put it.
    const pure = previewOptionOrder(request, base);
    sendJson(res, 200, {
      preview: { ...pure, ok: false, refusals: [lockedSentence(request.code), ...pure.refusals] },
    });
    return;
  }
  const client =
    requesterId && config.optionsClientFor ? config.optionsClientFor(requesterId) : undefined;
  const play = tradeTypeByCode(request.code);
  const estimates = await reviewEstimates(
    client,
    request.underlying.trim().toUpperCase(),
    request.expiration,
    play?.optionType ?? "call",
    request.strike,
  );
  sendJson(res, 200, {
    preview: previewOptionOrder(request, {
      ...base,
      ...(estimates.premium !== undefined ? { premium: estimates.premium } : {}),
      ...(estimates.spot !== undefined ? { underlyingPrice: estimates.spot } : {}),
    }),
  });
}

async function submitOption(
  res: ServerResponse,
  request: DeskOptionRequest,
  config: DashboardServerConfig,
  requesterId: string | undefined,
  progression: ParticipantProgression | undefined,
): Promise<void> {
  if (request.kind === "open" && playLocked(request.code, progression)) {
    sendJson(res, 200, { ok: false, refusals: [lockedSentence(request.code)] });
    return;
  }
  if (!config.submitOptionTrade) {
    sendJson(res, 200, {
      ok: false,
      refusals: ["No options execution path is wired up on this deployment."],
    });
    return;
  }
  sendJson(res, 200, await config.submitOptionTrade(request, requesterId));
}

/** Handle `/api/trade/chain` and `/api/trade/option/*`. Returns true when answered. */
export async function serveOptionApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<boolean> {
  const isOrder = path === "/api/trade/option/review" || path === "/api/trade/option/submit";
  if (path !== "/api/trade/chain" && !isOrder) return false;
  // Identity: the session and nowhere else — exactly the legacy ticket's resolution.
  const requesterId = config.auth ? resolveCurrentId(session, config.resolveOwnerId) : undefined;
  if (path === "/api/trade/chain") {
    if (requireGet(req, res)) await serveChain(res, req.url ?? "/", config, requesterId);
    return true;
  }
  const raw = await readJsonPost(req, res, OPTION_BODY_CAP_BYTES);
  if (raw === undefined) return true;
  const request = parseOptionBody(raw);
  if (!request) {
    sendJson(res, 400, { error: "malformed option order body" });
    return true;
  }
  const progression =
    requesterId && config.progression ? await config.progression.view(requesterId) : undefined;
  if (path === "/api/trade/option/review") {
    const snapshot = config.hub.getState().participants.find((p) => p.id === request.participantId);
    if (!snapshot) {
      sendJson(res, 404, { error: "no such desk" });
      return true;
    }
    await reviewOption(res, request, snapshot, config, requesterId, progression);
    return true;
  }
  await submitOption(res, request, config, requesterId, progression);
  return true;
}
