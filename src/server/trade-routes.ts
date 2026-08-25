import type { IncomingMessage, ServerResponse } from "node:http";
import type { AlpacaOptionsClient, OptionChainRow } from "../alpaca/alpaca-options-client.js";
import { rowPremium } from "../alpaca/alpaca-options-client.js";
import { starterPlayById } from "../domain/starter-plays.js";
import { defaultTradeType, type TradeType, tradeTypeByCode } from "../domain/trade-types.js";
import type { NavContext } from "../observatory/dashboard-shell.js";
import { ticketContext } from "../observatory/desk-data.js";
import { deskHref } from "../observatory/desk-tabs.js";
import type { ParticipantSnapshot } from "../observatory/participant-snapshot.js";
import {
  renderTicketBody,
  type TicketState,
  type TicketViewModel,
  ticketHref,
} from "../observatory/ticket-view.js";
import { renderOptionReviewBody, renderTradeReviewBody } from "../observatory/trade-review-view.js";
import { isOccSymbol } from "../trading/option-symbols.js";
import {
  type OptionPlayCode,
  type OptionTicketPreview,
  previewOptionClose,
  previewOptionOrder,
} from "../trading/option-ticket.js";
import { previewOrder, type TicketAction } from "../trading/order-ticket.js";
import type { DeskOptionRequest, SubmitOptionTrade } from "./option-trade-service.js";
import { readBody } from "./page-shell.js";
import type { DeskTradeResult, SubmitDeskTrade } from "./trade-service.js";

/**
 * `/trade` — the desk's trade view and its one write route.
 *
 * GET renders the TICKET (guided/raw, chain, payoff) and never touches an account: reads only.
 * POST keeps the two-step contract the share desk established: the first POST renders the
 * review screen, the second (carrying `confirm=1`) executes. An order must never be a link
 * someone can be tricked into following, and must never replay on a refresh or a back button —
 * which is exactly why the review/confirm split lives on POST while everything explorable
 * lives on GET.
 *
 * The route stays a thin shell: it parses forms, asks the pure ticket rules what it may do,
 * and hands anything real to `trade-service.ts` / `option-trade-service.ts`, which re-validate
 * everything server-side against fresh account reads. Nothing the browser posts is trusted
 * here beyond being *shown back*.
 */

export interface TradeRouteDeps {
  /** The board snapshot for a participant id, from the live hub. */
  readonly snapshotFor: (id: string) => ParticipantSnapshot | undefined;
  /** Who the caller's session resolves to. Undefined = no identity = no trading. */
  readonly requesterId: string | undefined;
  readonly tradingEnabled: boolean;
  /** Absent when the deployment wires no execution path at all (offline/export builds). */
  readonly submitTrade?: SubmitDeskTrade;
  readonly submitOptionTrade?: SubmitOptionTrade;
  /** Options data (chains/expirations/spot) for a participant's own credentials. */
  readonly optionsClientFor?: (participantId: string) => AlpacaOptionsClient | undefined;
  readonly nav: NavContext;
  readonly document: (title: string, body: string) => string;
}

function html(res: ServerResponse, status: number, body: string): void {
  res.writeHead(status, { "content-type": "text/html; charset=utf-8" });
  res.end(body);
}

function parseAction(raw: string | null): TicketAction {
  return raw === "sell" ? "sell" : "buy";
}

const posNumber = (raw: string | null): number | undefined => {
  if (raw === null || raw.trim() === "") return undefined;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : undefined;
};

/** A refusal with no account to render it against — kept plain rather than half-rendering a desk. */
function refusalPage(deps: TradeRouteDeps, res: ServerResponse, status: number, why: string): void {
  html(
    res,
    status,
    deps.document(
      "Order refused — Skynet Capital",
      `<section style="max-width:560px;margin:0 auto;padding:48px 20px;font-family:system-ui,sans-serif;color:#E6EDF3">
      <h1 style="font-size:20px;margin-bottom:12px">Order refused</h1>
      <p style="color:#8B9AAB;line-height:1.6">${why}</p>
      <p style="margin-top:20px"><a style="color:#35D0BA" href="/">← Back to the board</a></p>
    </section>`,
    ),
  );
}

function resultRedirect(res: ServerResponse, snapshotId: string, ok: boolean): void {
  const target = `${deskHref(snapshotId, "positions")}&n=${ok ? "submitted" : "refused"}`;
  res.writeHead(303, { location: target });
  res.end();
}

// --- GET: the ticket view ---------------------------------------------------

function stateFromParams(params: URLSearchParams): TicketState {
  // `?starter=` pre-fills the stock-buy ticket; explicit params always win over the preset,
  // and an unknown token is simply ignored. Disjoint from `?play=` by design (2026-08-25).
  const starter = starterPlayById(params.get("starter"));
  const play: TradeType = tradeTypeByCode(params.get("play")) ?? defaultTradeType();
  const qty = posNumber(params.get("qty"));
  const strike = posNumber(params.get("strike"));
  const limit = posNumber(params.get("limit"));
  const exp = params.get("exp");
  const symbol = params.get("symbol")?.trim().toUpperCase() ?? starter?.symbol;
  return {
    mode: params.get("mode") === "raw" ? "raw" : "guided",
    play,
    ...(symbol ? { symbol } : {}),
    ...(starter ? { starter: starter.id } : {}),
    qty: qty && Number.isInteger(qty) ? qty : (starter?.qty ?? 1),
    ...(exp && /^\d{4}-\d{2}-\d{2}$/.test(exp) ? { expiration: exp } : {}),
    ...(strike !== undefined ? { strike } : {}),
    orderType: params.get("ordertype") === "market" ? "market" : "limit",
    ...(limit !== undefined ? { limitPrice: limit } : {}),
    view: params.get("view") === "table" ? "table" : "chart",
  };
}

/** Chain/expiration/spot data for the ticket — every failure degrades to an honest note. */
async function ticketData(
  state: TicketState,
  client: AlpacaOptionsClient | undefined,
): Promise<
  Pick<TicketViewModel, "expirations" | "chain" | "spot" | "chainNote"> & {
    expiration?: string;
  }
> {
  if (state.play.kind !== "option" || !state.symbol) return {};
  if (!client) {
    return {
      chainNote:
        "Live option chains load through your own connected account, and your session isn't linked to one yet.",
    };
  }
  try {
    const today = new Date().toISOString().slice(0, 10);
    const expirations = await client.getExpirations(state.symbol, today);
    if (expirations.length === 0) {
      return { chainNote: `No listed options found for ${state.symbol}. Check the symbol.` };
    }
    const expiration =
      state.expiration && expirations.includes(state.expiration)
        ? state.expiration
        : (expirations[0] as string);
    const [chain, spot] = await Promise.all([
      client.getChain(state.symbol, expiration, state.play.optionType ?? "call"),
      client.getUnderlyingPrice(state.symbol),
    ]);
    return {
      expirations,
      expiration,
      chain,
      ...(spot !== undefined ? { spot } : {}),
    };
  } catch (error) {
    return {
      chainNote: `Couldn't load the option chain right now — ${String(error)}. The ticket still works; premiums just can't be estimated.`,
    };
  }
}

async function serveTicket(res: ServerResponse, url: string, deps: TradeRouteDeps): Promise<void> {
  const params = new URL(url, "http://localhost").searchParams;
  const parsed = stateFromParams(params);
  const snapshot = deps.requesterId ? deps.snapshotFor(deps.requesterId) : undefined;
  const client =
    deps.requesterId && deps.optionsClientFor ? deps.optionsClientFor(deps.requesterId) : undefined;
  const data = await ticketData(parsed, client);
  const state: TicketState = {
    ...parsed,
    ...(data.expiration ? { expiration: data.expiration } : {}),
  };
  html(
    res,
    200,
    deps.document(
      "Trade — Skynet Capital",
      renderTicketBody({
        state,
        nav: deps.nav,
        ...(snapshot ? { snapshot } : {}),
        tradingEnabled: deps.tradingEnabled,
        ...(data.expirations ? { expirations: data.expirations } : {}),
        ...(data.chain ? { chain: data.chain } : {}),
        ...(data.spot !== undefined ? { spot: data.spot } : {}),
        ...(data.chainNote ? { chainNote: data.chainNote } : {}),
      }),
    ),
  );
}

// --- POST: review + execute -------------------------------------------------

const OPTION_CODES = new Set(["201", "202", "301", "302"]);

/** Best-effort premium/spot for the option REVIEW screen (the service refetches on confirm). */
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

async function optionPreviewFromForm(
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

async function handleOptionPost(
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

// --- dispatch ---------------------------------------------------------------

/** Handle `/trade` — GET renders the ticket, POST reviews/executes. */
export async function handleTrade(
  req: IncomingMessage,
  res: ServerResponse,
  url: string,
  deps: TradeRouteDeps,
): Promise<void> {
  const method = (req.method ?? "GET").toUpperCase();
  if (method === "GET") {
    await serveTicket(res, url, deps);
    return;
  }
  if (method !== "POST") {
    res.writeHead(405, { allow: "GET, POST", "content-type": "text/plain" });
    res.end("orders are submitted by POST only");
    return;
  }
  if (!deps.requesterId) {
    refusalPage(
      deps,
      res,
      403,
      "This desk can only place orders for the account you're signed in as, and your session isn't linked to one.",
    );
    return;
  }
  const snapshot = deps.snapshotFor(deps.requesterId);
  if (!snapshot) {
    refusalPage(deps, res, 404, "Your account isn't on the board right now.");
    return;
  }

  const form = new URLSearchParams(await readBody(req));

  // Options ride their own preview/confirm pair; everything else is the share desk unchanged.
  const optionReview = await optionPreviewFromForm(form, snapshot, deps);
  if (optionReview) {
    await handleOptionPost(res, form, snapshot, deps, optionReview);
    return;
  }

  const preview = previewOrder(
    {
      symbol: form.get("symbol") ?? "",
      quantity: Number(form.get("quantity") ?? Number.NaN),
      action: parseAction(form.get("action")),
    },
    ticketContext(snapshot, { tradingEnabled: deps.tradingEnabled, isSelf: true }),
  );

  const confirmed = form.get("confirm") === "1";
  if (!(confirmed && preview.ok)) {
    html(
      res,
      200,
      deps.document(
        "Review order — Skynet Capital",
        renderTradeReviewBody(snapshot, preview, { nav: deps.nav, isSelf: true }),
      ),
    );
    return;
  }

  if (!deps.submitTrade) {
    refusalPage(deps, res, 503, "No execution path is wired up on this deployment.");
    return;
  }
  const result: DeskTradeResult = await deps.submitTrade(
    {
      participantId: snapshot.id,
      symbol: preview.symbol,
      quantity: preview.quantity,
      action: preview.action,
    },
    deps.requesterId,
  );
  if (!result.ok) {
    // The service refused on fresh numbers the browser never saw — show its reasons, not ours.
    html(
      res,
      200,
      deps.document(
        "Order refused — Skynet Capital",
        renderTradeReviewBody(
          snapshot,
          { ...preview, ok: false, refusals: result.refusals },
          { nav: deps.nav, isSelf: true },
        ),
      ),
    );
    return;
  }
  resultRedirect(res, snapshot.id, true);
}
