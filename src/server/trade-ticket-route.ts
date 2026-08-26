import type { ServerResponse } from "node:http";
import type { AlpacaOptionsClient } from "../alpaca/alpaca-options-client.js";
import { lockedOnLadder } from "../domain/progression.js";
import { starterPlayById } from "../domain/starter-plays.js";
import {
  defaultTradeType,
  type TradeType,
  type TradeTypeCode,
  tradeTypeByCode,
} from "../domain/trade-types.js";
import type { NavContext } from "../observatory/dashboard-shell.js";
import type { ParticipantSnapshot } from "../observatory/participant-snapshot.js";
import type { TicketState } from "../observatory/ticket-picker.js";
import { renderTicketBody, type TicketViewModel } from "../observatory/ticket-view.js";
import type { SubmitOptionTrade } from "./option-trade-service.js";
import type { ParticipantProgression, ProgressionService } from "./progression-service.js";
import type { SubmitDeskTrade } from "./trade-service.js";

/**
 * `GET /trade` — the ticket VIEW half of the trade route (`trade-routes.ts` keeps the POST half:
 * review, confirm, the ladder gate, execution dispatch). Split along the read/write line the
 * route's own contract draws: everything here renders and never touches an account.
 */

export interface TradeRouteDeps {
  /** The board snapshot for a participant id, from the live hub. */
  readonly snapshotFor: (id: string) => ParticipantSnapshot | undefined;
  /** Who the caller's session resolves to. Undefined = no identity = no trading. */
  readonly requesterId: string | undefined;
  readonly tradingEnabled: boolean;
  /**
   * The viewer's ladder state + wheels preference (`progression-service.ts`). Absent = the desk
   * behaves as wheels-off: nothing restricted (offline/test wiring).
   */
  readonly progression?: ProgressionService;
  /** Absent when the deployment wires no execution path at all (offline/export builds). */
  readonly submitTrade?: SubmitDeskTrade;
  readonly submitOptionTrade?: SubmitOptionTrade;
  /** Options data (chains/expirations/spot) for a participant's own credentials. */
  readonly optionsClientFor?: (participantId: string) => AlpacaOptionsClient | undefined;
  readonly nav: NavContext;
  readonly document: (title: string, body: string) => string;
}

export function html(res: ServerResponse, status: number, body: string): void {
  res.writeHead(status, { "content-type": "text/html; charset=utf-8" });
  res.end(body);
}

export const posNumber = (raw: string | null): number | undefined => {
  if (raw === null || raw.trim() === "") return undefined;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : undefined;
};

export function stateFromParams(params: URLSearchParams): TicketState {
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

/** The viewer's ladder state, or undefined when no identity/service is wired (= wheels off). */
export async function viewerProgression(
  deps: TradeRouteDeps,
): Promise<ParticipantProgression | undefined> {
  return deps.requesterId && deps.progression
    ? await deps.progression.view(deps.requesterId)
    : undefined;
}

/** Locked = training wheels on and the ladder hasn't opened this code yet. */
export function playLocked(
  code: TradeTypeCode,
  progression: ParticipantProgression | undefined,
): boolean {
  return lockedOnLadder(code, progression);
}

export async function serveTicket(
  res: ServerResponse,
  url: string,
  deps: TradeRouteDeps,
): Promise<void> {
  const params = new URL(url, "http://localhost").searchParams;
  const parsed = stateFromParams(params);
  const snapshot = deps.requesterId ? deps.snapshotFor(deps.requesterId) : undefined;
  const progression = await viewerProgression(deps);
  const client =
    deps.requesterId && deps.optionsClientFor ? deps.optionsClientFor(deps.requesterId) : undefined;
  // A locked play renders its locked panel — no point fetching a chain it won't show.
  const data = playLocked(parsed.play.code, progression) ? {} : await ticketData(parsed, client);
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
        ...(progression
          ? {
              progression: {
                wheels: progression.wheels,
                unlocked: progression.unlocked,
                earned: progression.earnedByCode,
                ...(progression.nextUp ? { nextUp: progression.nextUp } : {}),
                celebrating: progression.celebrating,
                pendingChecks: progression.pendingChecks,
              },
            }
          : {}),
        ...(data.expirations ? { expirations: data.expirations } : {}),
        ...(data.chain ? { chain: data.chain } : {}),
        ...(data.spot !== undefined ? { spot: data.spot } : {}),
        ...(data.chainNote ? { chainNote: data.chainNote } : {}),
      }),
    ),
  );
}
