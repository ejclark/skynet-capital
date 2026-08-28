import { create } from "zustand";

/**
 * Client-side connection state for the live patch channel — deliberately OUTSIDE the Query cache.
 * The board's data belongs to the server (TanStack Query owns that copy); whether this browser is
 * connected, and at what seq, is client state and lives here (the server/client split the stack
 * doc commits to — docs/ENGINEERING.md, state layer).
 */

export type ChannelStatus = "connecting" | "live" | "resyncing";

interface ConnectionState {
  readonly status: ChannelStatus;
  /** Last seq this client has either fetched past or applied. 0 until the first hello/snapshot. */
  readonly seq: number;
  readonly setStatus: (status: ChannelStatus) => void;
  readonly setSeq: (seq: number) => void;
}

export const useConnection = create<ConnectionState>((set) => ({
  status: "connecting",
  seq: 0,
  setStatus: (status) => set({ status }),
  setSeq: (seq) => set({ seq }),
}));
