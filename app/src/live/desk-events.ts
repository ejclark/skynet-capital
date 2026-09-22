import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

/**
 * THE DESK'S EVENT CHANNEL (#3407 P4 slice 1) — the SSE → Query seam for one account's order
 * lifecycle, the same idea as `channel.ts` for the board: the server pushes an `order` frame
 * the moment the bus sees a fill, a submit or a cancel, and this side invalidates the queries
 * that read the broker (working orders, the desk snapshot, the option positions statement) so
 * they re-read now instead of on their next poll. Frames carry no state the client applies
 * locally — every number still comes from a read the server answers — so a missed frame costs
 * a delay, never a wrong row. The hello re-anchors on every (re)connect for the same reason.
 *
 * One EventSource per mounted desk surface; the browser reconnects on its own. Where the
 * server answers JSON (`available: false` — no bus wired) the EventSource errors once and the
 * caller's polling fallback carries the desk, in words on the surface that polls.
 */

export interface DeskOrderEvent {
  readonly id: string;
  readonly eventType: string;
  readonly orderId: string;
  readonly at: string;
  readonly outcome: "success" | "failure" | "error";
  readonly payload: Readonly<Record<string, unknown>>;
}

/** The queries a desk's order lifecycle can change. */
export const deskQueryKeys = (deskId: string) =>
  [
    ["desk-orders", deskId],
    ["desk", deskId],
    ["option-positions", deskId],
  ] as const;

export function invalidateDesk(queryClient: QueryClient, deskId: string): void {
  for (const queryKey of deskQueryKeys(deskId)) {
    void queryClient.invalidateQueries({ queryKey: [...queryKey] });
  }
}

/** Open the channel for one desk. Returns the disposer the caller owns (a React effect). */
export function connectDeskEvents(
  queryClient: QueryClient,
  deskId: string,
  onEvent?: (event: DeskOrderEvent) => void,
): () => void {
  if (typeof EventSource === "undefined") return () => undefined;
  const source = new EventSource(`/api/trade/events?participantId=${encodeURIComponent(deskId)}`, {
    withCredentials: true,
  });
  // A (re)connect may have missed frames — the bus keeps no replay — so re-read everything once.
  source.addEventListener("hello", () => invalidateDesk(queryClient, deskId));
  source.addEventListener("order", (raw) => {
    const event = JSON.parse((raw as MessageEvent<string>).data) as DeskOrderEvent;
    invalidateDesk(queryClient, deskId);
    onEvent?.(event);
  });
  return () => source.close();
}

/** Mount the channel for the desk a surface shows; nothing for an empty desk id. */
export function useDeskEvents(deskId: string, onEvent?: (event: DeskOrderEvent) => void): void {
  const queryClient = useQueryClient();
  // biome-ignore lint/correctness/useExhaustiveDependencies: onEvent is read at fire time
  useEffect(() => {
    if (deskId === "") return undefined;
    return connectDeskEvents(queryClient, deskId, onEvent);
  }, [queryClient, deskId]);
}
