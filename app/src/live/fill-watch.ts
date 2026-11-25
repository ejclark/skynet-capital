import { queryOptions } from "@tanstack/react-query";
import { postJson } from "./post";

/**
 * "EMAIL ME WHEN IT FILLS" (#8251) — the receipt's one-order watch, over
 * `/api/trade/alerts/fill-watch` (`src/server/fill-watch-route.ts`). The address is the session's
 * and the link is built by the server; the browser only names the account and the order.
 */

export interface FillWatchState {
  readonly available: boolean;
  /** The route's own sentence when it can't email this member — shown instead of the button. */
  readonly reason?: string;
  readonly watching: boolean;
  /** The session's own address, for "We'll email … when it fills". */
  readonly destination?: string;
}

export type FillWatchAnswer =
  | { readonly ok: true; readonly watching: boolean; readonly destination?: string }
  | { readonly ok: false; readonly refusals: readonly string[] };

const PATH = "/api/trade/alerts/fill-watch";

export async function fetchFillWatch(
  participantId: string,
  orderId: string,
): Promise<FillWatchState> {
  const query = new URLSearchParams({ participantId, orderId });
  const res = await fetch(`${PATH}?${query.toString()}`, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`GET ${PATH} → ${res.status}`);
  return (await res.json()) as FillWatchState;
}

export const fillWatchQuery = (participantId: string, orderId: string) =>
  queryOptions({
    queryKey: ["fill-watch", participantId, orderId],
    queryFn: () => fetchFillWatch(participantId, orderId),
    enabled: participantId !== "" && orderId !== "",
    staleTime: 60_000,
  });

export const armFillWatch = (participantId: string, orderId: string): Promise<FillWatchAnswer> =>
  postJson(PATH, { participantId, orderId });

/** A modify answered with a new order id: move a watch on the old one to it (a no-op without one). */
export const followFillWatch = (
  participantId: string,
  orderId: string,
  replaces: string,
): Promise<FillWatchAnswer> => postJson(PATH, { participantId, orderId, replaces });
