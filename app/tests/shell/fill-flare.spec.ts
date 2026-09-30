import { renderHook } from "@testing-library/react";
import type { DeskOrderEvent } from "../../src/live/desk-events";
import { isCompletedFill, useFillFlare } from "../../src/shell/fill-flare";
import {
  DEFAULT_MOOD,
  setVantageFrame,
  type TowerMessage,
  useTowerBus,
} from "../../src/shell/tower-bus";

/**
 * The fill flare (#3977 slice 3): the ticket's own order fills and the tower answers it once —
 * never for a submit, a partial, a cancel or a failure, and never twice for one order.
 */
function runningCrest() {
  const sent: TowerMessage[] = [];
  const frame = document.createElement("iframe");
  Object.defineProperty(frame, "contentWindow", {
    value: { postMessage: (message: TowerMessage) => sent.push(message) },
  });
  setVantageFrame(frame);
  useTowerBus.setState({ on: true });
  return sent;
}

const event = (over: Partial<DeskOrderEvent> = {}): DeskOrderEvent => ({
  id: "o-1:order.filled:2026-09-30T14:00:00Z:10",
  eventType: "order.filled",
  orderId: "o-1",
  at: "2026-09-30T14:00:00Z",
  outcome: "success",
  payload: { symbol: "AAPL", filledQuantity: 10, price: 187.2, status: "filled" },
  ...over,
});

afterEach(() => {
  setVantageFrame(null);
  useTowerBus.setState({ on: false, mood: DEFAULT_MOOD });
});

describe("isCompletedFill", () => {
  it("is a completed fill only for a successful order.filled", () => {
    expect(isCompletedFill(event())).toBe(true);
    expect(isCompletedFill(undefined)).toBe(false);
    expect(isCompletedFill(event({ eventType: "order.updated" }))).toBe(false);
    expect(isCompletedFill(event({ eventType: "order.submitted" }))).toBe(false);
    expect(isCompletedFill(event({ outcome: "failure" }))).toBe(false);
  });
});

describe("useFillFlare", () => {
  it("flares the tower once when the ticket's order fills", () => {
    const sent = runningCrest();
    renderHook(({ fill }) => useFillFlare(fill), { initialProps: { fill: event() } });
    expect(sent).toEqual([{ type: "tower:flare", kind: "fill" }]);
  });

  it("stays quiet before the fill: nothing, an accepted order, a partial fill", () => {
    const sent = runningCrest();
    const hook = renderHook(({ fill }) => useFillFlare(fill), {
      initialProps: { fill: undefined as DeskOrderEvent | undefined },
    });
    hook.rerender({ fill: event({ eventType: "order.updated", payload: { status: "new" } }) });
    hook.rerender({
      fill: event({ eventType: "order.updated", payload: { status: "partially_filled" } }),
    });
    expect(sent).toEqual([]);
    hook.rerender({ fill: event() });
    expect(sent).toEqual([{ type: "tower:flare", kind: "fill" }]);
  });

  it("answers one order once, however often the same fill comes back", () => {
    const sent = runningCrest();
    const hook = renderHook(({ fill }) => useFillFlare(fill), { initialProps: { fill: event() } });
    hook.rerender({ fill: { ...event(), id: "a reconnect re-reads it" } });
    hook.rerender({ fill: undefined as unknown as DeskOrderEvent });
    hook.rerender({ fill: event() });
    expect(sent).toHaveLength(1);
    hook.rerender({ fill: event({ orderId: "o-2", id: "o-2:order.filled" }) });
    expect(sent).toHaveLength(2);
  });
});
