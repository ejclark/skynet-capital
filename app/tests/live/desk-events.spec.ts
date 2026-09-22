import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { createElement } from "react";
import { connectDeskEvents, deskQueryKeys, useOrderFill } from "../../src/live/desk-events";

/**
 * The desk's event channel (#3407 P4 slice 1): a hello and every `order` frame invalidate the
 * three broker-backed queries for that desk; the disposer closes the source.
 */

class FakeEventSource {
  static instances: FakeEventSource[] = [];
  readonly url: string;
  readonly listeners = new Map<string, Array<(event: MessageEvent<string>) => void>>();
  closed = false;
  constructor(url: string) {
    this.url = url;
    FakeEventSource.instances.push(this);
  }
  addEventListener(type: string, listener: (event: MessageEvent<string>) => void) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }
  emit(type: string, data: string) {
    for (const l of this.listeners.get(type) ?? []) l({ data } as MessageEvent<string>);
  }
  close() {
    this.closed = true;
  }
}

describe("connectDeskEvents", () => {
  beforeEach(() => {
    FakeEventSource.instances.length = 0;
    (globalThis as { EventSource?: unknown }).EventSource = FakeEventSource;
  });
  afterEach(() => {
    (globalThis as { EventSource?: unknown }).EventSource = undefined;
  });

  it("opens the desk's stream and invalidates the desk queries on hello and on each order", () => {
    const client = new QueryClient();
    const invalidated: unknown[] = [];
    client.invalidateQueries = ((filters: { queryKey: unknown }) => {
      invalidated.push(filters.queryKey);
      return Promise.resolve();
    }) as typeof client.invalidateQueries;
    const seen: unknown[] = [];
    const dispose = connectDeskEvents(client, "human-eric", (e) => seen.push(e));
    const source = FakeEventSource.instances[0];
    expect(source?.url).toBe("/api/trade/events?participantId=human-eric");

    source?.emit("hello", JSON.stringify({ participantId: "human-eric", at: "t" }));
    expect(invalidated).toEqual(deskQueryKeys("human-eric").map((k) => [...k]));
    source?.emit(
      "order",
      JSON.stringify({
        id: "e1",
        eventType: "order.filled",
        orderId: "o-1",
        at: "t",
        outcome: "success",
        payload: {},
      }),
    );
    expect(invalidated).toHaveLength(6);
    expect(seen).toEqual([
      {
        id: "e1",
        eventType: "order.filled",
        orderId: "o-1",
        at: "t",
        outcome: "success",
        payload: {},
      },
    ]);

    dispose();
    expect(source?.closed).toBe(true);
  });

  it("useOrderFill keeps only the frame for the ticket's own order, and forgets it for a new order", () => {
    const client = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client }, children);
    const { result, rerender } = renderHook(
      ({ orderId }: { orderId: string | undefined }) => useOrderFill("human-eric", orderId),
      { wrapper, initialProps: { orderId: "o-1" } },
    );
    const source = FakeEventSource.instances[0];
    const frame = (orderId: string) =>
      JSON.stringify({
        id: orderId,
        eventType: "order.filled",
        orderId,
        at: "t",
        outcome: "success",
        payload: {},
      });
    act(() => source?.emit("order", frame("o-2")));
    expect(result.current).toBeUndefined();
    act(() => source?.emit("order", frame("o-1")));
    expect(result.current?.orderId).toBe("o-1");
    rerender({ orderId: "o-3" });
    expect(result.current).toBeUndefined();
    // The listener reads the LATEST order id: the source was opened once, the id changed since.
    act(() => source?.emit("order", frame("o-3")));
    expect(result.current?.orderId).toBe("o-3");
    expect(FakeEventSource.instances).toHaveLength(1);
  });

  it("is a no-op where EventSource does not exist", () => {
    (globalThis as { EventSource?: unknown }).EventSource = undefined;
    const dispose = connectDeskEvents(new QueryClient(), "human-eric");
    expect(FakeEventSource.instances).toHaveLength(0);
    dispose();
  });
});
