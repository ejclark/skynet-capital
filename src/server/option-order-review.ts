import type { ServerResponse } from "node:http";
import type { AlpacaOptionsClient, OptionChainRow } from "../alpaca/alpaca-options-client.js";
import { rowPremium } from "../alpaca/alpaca-options-client.js";
import { type TradeType, tradeTypeByCode } from "../domain/trade-types.js";
import { ticketContext } from "../observatory/desk-data.js";
import { deskHref } from "../observatory/desk-tabs.js";
import type { ParticipantSnapshot } from "../observatory/participant-snapshot.js";
import { ticketHref } from "../observatory/ticket-picker.js";
import { renderOptionReviewBody } from "../observatory/trade-review-view.js";
import { isOccSymbol } from "../trading/option-symbols.js";
import {
  type OptionPlayCode,
  type OptionTicketPreview,
  previewOptionClose,
  previewOptionOrder,
} from "../trading/option-ticket.js";
import type { DeskOptionRequest } from "./option-trade-service.js";
import { refusalPage, resultRedirect } from "./trade-response-pages.js";
import { html, posNumber, type TradeRouteDeps } from "./trade-ticket-route.js";

/**
 * The desk's option order pipeline: turn a posted `/trade` form into a preview against the
 * snapshot (OPEN or CLOSE), then render the review screen or execute on confirm. Split out of
 * trade-routes.ts (2026-08-26, keeping that file under the line-count budget) — the dispatch and
 * the equity-order path it sits beside stay there; `refusalPage`/`resultRedirect` are imported
 * back from there since both order paths share the same refusal/redirect shells.
 */

/** Trade-type codes that ride the OPTION preview/review pipeline rather than the share desk. */
export const OPTION_CODES = new Set(["201", "202", "301", "302"]);

/** Best-effort premium/spot for the option REVIEW screen (the service refetches on confirm).
 *  Exported for the shell's JSON review (`option-api-routes.ts`), which shares the estimate. */
export async function reviewEstimates(
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

type ReviewedOption = { preview: OptionTicketPreview; request: DeskOptionRequest };

/** A CLOSE posted from the blotter (or a review's confirm): direction resolves server-side. */
function closePreviewFromForm(
  form: URLSearchParams,
  snapshot: ParticipantSnapshot,
  base: ReturnType<typeof ticketContext>,
): ReviewedOption | undefined {
  const close = form.get("close") ?? "";
  const postedSymbol = (form.get("symbol") ?? "").trim().toUpperCase();
  if (!(close || isOccSymbol(postedSymbol))) return undefined;
  const occSymbol = (close || postedSymbol).trim().toUpperCase();
  const contracts = posNumber(form.get("contracts") ?? form.get("quantity"));
  return {
    preview: previewOptionClose(occSymbol, base, contracts),
    request: {
      kind: "close",
      participantId: snapshot.id,
      occSymbol,
      ...(contracts !== undefined ? { contracts } : {}),
    },
  };
}

/** An OPEN posted from the ticket: parse, estimate best-effort, preview against the snapshot. */
async function openPreviewFromForm(
  form: URLSearchParams,
  snapshot: ParticipantSnapshot,
  deps: TradeRouteDeps,
  base: ReturnType<typeof ticketContext>,
): Promise<ReviewedOption | undefined> {
  const play = tradeTypeByCode(form.get("play"));
  if (!(play && OPTION_CODES.has(play.code))) return undefined;
  const client =
    deps.requesterId && deps.optionsClientFor ? deps.optionsClientFor(deps.requesterId) : undefined;
  const postedSymbol = (form.get("symbol") ?? "").trim().toUpperCase();
  const contracts = posNumber(form.get("contracts")) ?? Number.NaN;
  const strike = posNumber(form.get("strike")) ?? Number.NaN;
  const expiration = form.get("exp") ?? "";
  const limit = posNumber(form.get("limit"));
  const orderType: "limit" | "market" =
    limit !== undefined && form.get("ordertype") !== "market" ? "limit" : "market";
  const estimates = Number.isFinite(strike)
    ? await reviewEstimates(client, postedSymbol, expiration, play.optionType ?? "call", strike)
    : {};
  const request: Extract<DeskOptionRequest, { kind: "open" }> = {
    kind: "open",
    participantId: snapshot.id,
    code: play.code as OptionPlayCode,
    underlying: postedSymbol,
    contracts,
    strike,
    expiration,
    orderType,
    ...(orderType === "limit" && limit !== undefined ? { limitPrice: limit } : {}),
  };
  const preview = previewOptionOrder(request, {
    ...base,
    ...(estimates.premium !== undefined ? { premium: estimates.premium } : {}),
    ...(estimates.spot !== undefined ? { underlyingPrice: estimates.spot } : {}),
  });
  return { preview, request };
}

/** Preview an option order from a posted `/trade` form — CLOSE first, then OPEN; undefined when the form isn't option-shaped. */
export async function optionPreviewFromForm(
  form: URLSearchParams,
  snapshot: ParticipantSnapshot,
  deps: TradeRouteDeps,
): Promise<ReviewedOption | undefined> {
  const base = ticketContext(snapshot, { tradingEnabled: deps.tradingEnabled, isSelf: true });
  return (
    closePreviewFromForm(form, snapshot, base) ??
    (await openPreviewFromForm(form, snapshot, deps, base))
  );
}

/** Render the option review screen, or execute and redirect once confirmed on an OK preview. */
export async function handleOptionPost(
  res: ServerResponse,
  form: URLSearchParams,
  snapshot: ParticipantSnapshot,
  deps: TradeRouteDeps,
  reviewed: { preview: OptionTicketPreview; request: DeskOptionRequest },
): Promise<void> {
  const { preview, request } = reviewed;
  const backHref =
    request.kind === "open"
      ? ticketHref({
          mode: "guided",
          play: tradeTypeByCode(request.code) as TradeType,
          symbol: request.underlying,
          qty: request.contracts,
          expiration: request.expiration,
          strike: request.strike,
          orderType: request.orderType,
          ...(request.limitPrice !== undefined ? { limitPrice: request.limitPrice } : {}),
          view: "chart",
        })
      : deskHref(snapshot.id, "positions");
  const renderReview = (p: OptionTicketPreview): string =>
    deps.document(
      p.ok ? "Review order — Skynet Capital" : "Order refused — Skynet Capital",
      renderOptionReviewBody(snapshot, p, { nav: deps.nav, isSelf: true, backHref }),
    );

  const confirmed = form.get("confirm") === "1";
  if (!(confirmed && preview.ok)) {
    html(res, 200, renderReview(preview));
    return;
  }
  if (!deps.submitOptionTrade) {
    refusalPage(deps, res, 503, "No options execution path is wired up on this deployment.");
    return;
  }
  const result = await deps.submitOptionTrade(request, deps.requesterId);
  if (!result.ok) {
    html(res, 200, renderReview({ ...preview, ok: false, refusals: result.refusals }));
    return;
  }
  resultRedirect(res, snapshot.id, true);
}
