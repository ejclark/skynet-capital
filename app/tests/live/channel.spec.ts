import { QueryClient } from "@tanstack/react-query";
import type { BoardSnapshot } from "../../src/live/board";
import { applyPatch } from "../../src/live/board";
import { boardQueryKey, connectBoardChannel } from "../../src/live/channel";
import { useConnection } from "../../src/live/connection";

/**
 * #4620 — the board channel across a server restart. The restarted server numbers its patches
 * from 1 again; without a boot id the client reads every one of them as "already applied" and the
 * board freezes under a live pill. With it, the hello (or the first patch) re-anchors the cache.
 */

class FakeEventSource {
  static instances: FakeEventSource[] = [];
  readonly listeners = new Map<string, Array<(event: MessageEvent<string>) => void>>();
  onerror: (() => void) | null = null;
  readyState = 0;
  closed = false;
  constructor(readonly url: string) {
    FakeEventSource.instances.push(this);
  }
  addEventListener(type: string, listener: (event: MessageEvent<string>) => void) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }
  emit(type: string, data: object = {}) {
    for (const l of this.listeners.get(type) ?? [])
      l({ data: JSON.stringify(data) } as MessageEvent<string>);
  }
  close() {
    this.closed = true;
  }
}

const snapshot = (boot: string | undefined, seq: number): BoardSnapshot => ({
  ...(boot ? { boot } : {}),
  seq,
  generatedAt: "t",
  metric: "equity",
  rows: [],
  blocks: {},
  opsApplied: 0,
});

describe("connectBoardChannel across a restart", () => {
  beforeEach(() => {
    FakeEventSource.instances.length = 0;
    (globalThis as { EventSource?: unknown }).EventSource = FakeEventSource;
    useConnection.setState({ status: "connecting", seq: 0 });
  });
  afterEach(() => {
    (globalThis as { EventSource?: unknown }).EventSource = undefined;
  });

  function setup(cached: BoardSnapshot) {
    const client = new QueryClient();
    client.setQueryData(boardQueryKey("equity"), cached);
    const refetched: unknown[] = [];
    client.invalidateQueries = ((filters: { queryKey: unknown }) => {
      refetched.push(filters.queryKey);
      return Promise.resolve();
    }) as typeof client.invalidateQueries;
    connectBoardChannel(client, "equity");
    return { client, refetched, source: FakeEventSource.instances[0] as FakeEventSource };
  }

  it("re-anchors on a hello from another boot even though the new head is behind the cache", () => {
    const { refetched, source } = setup(snapshot("old", 500));
    source.emit("hello", { boot: "new", seq: 3 });
    expect(refetched).toHaveLength(1);
  });

  it("goes live on a hello from the same boot at the same head", () => {
    const { refetched, source } = setup(snapshot("same", 7));
    source.emit("hello", { boot: "same", seq: 7 });
    expect(refetched).toHaveLength(0);
    expect(useConnection.getState().status).toBe("live");
  });

  it("re-anchors on a patch from another boot instead of swallowing it as already applied", () => {
    const { refetched, source } = setup(snapshot("old", 500));
    source.emit("patch", { boot: "new", seq: 1, at: "t", ops: [] });
    expect(refetched).toHaveLength(1);
  });

  it("treats a side that predates boot ids as the same run (no spurious resnapshot on deploy)", () => {
    const { refetched, source } = setup(snapshot(undefined, 7));
    source.emit("hello", { boot: "new", seq: 7 });
    expect(refetched).toHaveLength(0);
  });
});

describe("applyPatch", () => {
  it("refuses a patch from another boot, so the caller re-fetches", () => {
    expect(applyPatch(snapshot("a", 5), { boot: "b", seq: 6, at: "t", ops: [] })).toBeNull();
  });
  it("applies the next patch of the same boot", () => {
    expect(applyPatch(snapshot("a", 5), { boot: "a", seq: 6, at: "t", ops: [] })?.seq).toBe(6);
  });
});
