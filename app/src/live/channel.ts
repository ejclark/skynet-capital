import type { QueryClient } from "@tanstack/react-query";
import {
  applyPatch,
  type BoardMetric,
  type BoardPatch,
  type BoardSnapshot,
  type ComparePick,
  fetchBoard,
  isOtherRun,
} from "./board";
import { useConnection } from "./connection";
import { openReconnectingSource } from "./reconnecting-source";

/**
 * The SSE → Query seam (#738 phase 0; per-metric since phase 2).
 *
 * ONE EventSource per visible metric, wired outside React's render cycle: the server formats every
 * op for the connection's `?by=`, so the stream and the snapshot always speak the same metric and
 * the cache key carries it (`["board", metric]`). Switching metric closes one channel and opens
 * the next — the old metric's cache stays warm and re-anchors through the hello handshake when
 * revisited. The three server events map onto the recovery ladder:
 *   hello  → the channel's head; a cache that is behind it re-anchors with a fresh snapshot.
 *   patch  → applied when it is exactly `seq + 1`; anything else is a gap → resnapshot.
 *   resync → the server's own admission that replay fell out of its buffer; same recovery.
 * The browser's native reconnect carries `Last-Event-ID` (each patch's `boot:seq` is its SSE id),
 * so a dropped socket replays exactly what was missed — or resyncs, honestly. A server restart
 * renumbers its seqs from 1, so every frame also names the server's `boot`: a hello or patch from
 * a different boot than the cached snapshot re-anchors it, instead of reading as "already applied"
 * forever. A reconnect the edge refuses (502 mid-restart) closes the EventSource for good, so the
 * source is opened through `openReconnectingSource`, which reopens it (#4620).
 */

export const boardQueryKey = (metric: BoardMetric, pick: ComparePick = {}) =>
  ["board", metric, pick.a ?? null, pick.b ?? null] as const;

export function boardQueryOptions(metric: BoardMetric, pick: ComparePick = {}) {
  return {
    queryKey: boardQueryKey(metric, pick),
    queryFn: async (): Promise<BoardSnapshot> => {
      const snapshot = await fetchBoard(metric, pick);
      useConnection.getState().setSeq(snapshot.seq);
      return snapshot;
    },
    // The patch channel owns freshness; polling would be a re-render wearing a fetch's clothes.
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
  } as const;
}

/** Open the live channel for one metric. Returns the disposer the caller owns (React effect). */
export function connectBoardChannel(
  queryClient: QueryClient,
  metric: BoardMetric,
  pick: ComparePick = {},
): () => void {
  const key = boardQueryKey(metric, pick);
  useConnection.getState().setStatus("connecting");

  const recover = () => {
    useConnection.getState().setStatus("resyncing");
    void queryClient
      .invalidateQueries({ queryKey: key })
      .then(() => useConnection.getState().setStatus("live"));
  };

  return openReconnectingSource(`/events?by=${metric}`, (source) => {
    source.addEventListener("hello", (event) => {
      const hello = JSON.parse((event as MessageEvent<string>).data) as {
        seq: number;
        boot?: string;
      };
      const cached = queryClient.getQueryData<BoardSnapshot>(key);
      // A warm cache from an earlier visit may be behind the channel's head — or from before a
      // server restart — so re-anchor it rather than letting the first patch read as a gap (or as
      // already applied).
      if (cached && (cached.seq < hello.seq || isOtherRun(cached.boot, hello.boot))) recover();
      else useConnection.getState().setStatus("live");
    });

    source.addEventListener("resync", recover);

    source.addEventListener("patch", (event) => {
      const patch = JSON.parse((event as MessageEvent<string>).data) as BoardPatch;
      const current = queryClient.getQueryData<BoardSnapshot>(key);
      if (!current) return; // first snapshot still in flight; it will land at or past this seq
      const next = applyPatch(current, patch);
      if (next === null) {
        recover();
        return;
      }
      if (next !== current) {
        queryClient.setQueryData(key, next);
        useConnection.getState().setSeq(next.seq);
      }
    });

    source.onerror = () => {
      // The browser is reconnecting with Last-Event-ID (or the wrapper is reopening); say so.
      useConnection.getState().setStatus("connecting");
    };
  });
}
