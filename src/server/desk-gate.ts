import type { AlpacaTradingClient } from "../alpaca/alpaca-trading-client.js";
import type { TradingClientFactory } from "../observatory/dashboard-data.js";
import type { Participant } from "../participants/participant.js";
import type { OrderAuditRecord } from "./order-audit-log.js";

/**
 * THE SHARED DESK MACHINERY — what the share desk (`trade-service.ts`) and the options desk
 * (`option-trade-service.ts`) both stand on, in its own module so neither imports the other.
 * Everything here encodes one principle: the browser's review screen is a courtesy, the
 * service re-check is the gate — and both desks must run the SAME gate, or they drift.
 */

export type DeskSubmitResult =
  | {
      readonly ok: true;
      readonly orderId: string;
      readonly status: string;
      readonly symbol: string;
    }
  | { readonly ok: false; readonly refusals: string[] };

/** An unknown clock makes no claim in either direction — the preview omits the hours line. */
export async function marketOpen(client: AlpacaTradingClient): Promise<boolean | undefined> {
  try {
    return await client.isMarketOpen();
  } catch {
    return undefined;
  }
}

/**
 * The structural gate every desk order passes first, shares and options alike: trading is
 * switched on, the requester IS the target account, and the account exists — answered with
 * that account's live client.
 */
export function openDesk(
  deps: {
    tradingEnabled: boolean;
    findParticipant: (id: string) => Participant | undefined;
    clientFactory: TradingClientFactory;
  },
  participantId: string,
  requesterId: string | undefined,
): { participant: Participant; client: AlpacaTradingClient } | { ok: false; refusals: string[] } {
  if (!deps.tradingEnabled) {
    return { ok: false, refusals: ["Trading from the desk is switched off for this deployment."] };
  }
  if (!requesterId || requesterId !== participantId) {
    return { ok: false, refusals: ["You can only trade your own account."] };
  }
  const participant = deps.findParticipant(participantId);
  if (!participant) {
    return { ok: false, refusals: ["That account isn't on the board."] };
  }
  return { participant, client: deps.clientFactory(participant) };
}

/** Wrap the live re-read: an unreachable account is a refusal, never an exception. */
export async function readReview<T>(
  read: () => Promise<T>,
): Promise<{ preview: T } | { refusals: string[] }> {
  try {
    return { preview: await read() };
  } catch (error) {
    return { refusals: [`Couldn't read the account to check this order: ${error}`] };
  }
}

/** Shared submit wrapper: a broker throw becomes a refusal string, never an exception. */
async function submitToBroker(
  place: () => Promise<{ id: string; status: string; symbol: string }>,
): Promise<DeskSubmitResult> {
  try {
    const order = await place();
    return { ok: true, orderId: order.id, status: order.status, symbol: order.symbol };
  } catch (error) {
    return { ok: false, refusals: [`The broker rejected the order: ${error}`] };
  }
}

/**
 * Submit through the broker, then append the per-order audit line (#466) on success only — the
 * one step both desks must do identically, so it lives here rather than copied into each.
 */
export async function submitAndAudit(
  place: () => Promise<{ id: string; status: string; symbol: string }>,
  participant: Participant,
  deps: {
    recordAudit?: (entry: OrderAuditRecord) => Promise<void>;
    now?: () => Date;
  },
): Promise<DeskSubmitResult> {
  const result = await submitToBroker(place);
  if (result.ok) {
    await deps.recordAudit?.({
      participantId: participant.id,
      ...(participant.ownerEmail ? { ownerEmail: participant.ownerEmail } : {}),
      orderId: result.orderId,
      at: (deps.now ?? (() => new Date()))().toISOString(),
    });
  }
  return result;
}
