import type { QueryClient } from "@tanstack/react-query";
import { applyPatch, type BoardPatch, type BoardSnapshot, fetchBoard } from "./board";
import { useConnection } from "./connection";

/**
 * The SSE → Query seam this phase exists to prove (#738 phase 0, EARS P0).
 *
 * ONE EventSource per app, wired outside React's render cycle. Each `/events` patch lands in the
 * Query cache through `setQueryData` — no refetch, no render-cycle subscription churn. The three
 * server events map exactly onto the recovery ladder:
 *   hello  → the channel's head; the snapshot fetch anchors at or past it.
 *   patch  → applied when it is exactly `seq + 1`; anything else is a gap and the cache is
 *            invalidated so the JSON snapshot (`/api/board`, the frame's JSON twin) re-anchors.
 *   resync → the server's own admission that replay fell out of its buffer; same recovery.
 * The browser's native reconnect carries `Last-Event-ID` (the server stamps each patch's seq as
 * the SSE id), so a dropped socket replays exactly what was missed — or resyncs, honestly.
 */

export const BOARD_QUERY_KEY = ["board"] as const;

export function startBoardChannel(queryClient: QueryClient): () => void {
  const source = new EventSource("/events", { withCredentials: true });
  const connection = useConnection.getState();

  const recover = () => {
    connection.setStatus("resyncing");
    void queryClient
      .invalidateQueries({ queryKey: BOARD_QUERY_KEY })
      .then(() => connection.setStatus("live"));
  };

  source.addEventListener("hello", () => {
    // A fresh (or replay-safe) connect: the page's snapshot fetch anchors the seq run.
    connection.setStatus("live");
  });

  source.addEventListener("resync", recover);

  source.addEventListener("patch", (event) => {
    const patch = JSON.parse((event as MessageEvent<string>).data) as BoardPatch;
    const current = queryClient.getQueryData<BoardSnapshot>(BOARD_QUERY_KEY);
    if (!current) return; // first snapshot still in flight; it will land at or past this seq
    const next = applyPatch(current, patch);
    if (next === null) {
      recover();
      return;
    }
    if (next !== current) {
      queryClient.setQueryData(BOARD_QUERY_KEY, next);
      useConnection.getState().setSeq(next.seq);
    }
  });

  source.onerror = () => {
    // The browser is already reconnecting with Last-Event-ID; just say so honestly.
    useConnection.getState().setStatus("connecting");
  };

  return () => source.close();
}

export const boardQueryOptions = {
  queryKey: BOARD_QUERY_KEY,
  queryFn: async (): Promise<BoardSnapshot> => {
    const snapshot = await fetchBoard();
    useConnection.getState().setSeq(snapshot.seq);
    return snapshot;
  },
  // The patch channel owns freshness; polling would be a re-render wearing a fetch's clothes.
  staleTime: Number.POSITIVE_INFINITY,
  refetchOnWindowFocus: false,
} as const;
