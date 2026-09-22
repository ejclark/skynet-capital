import { ORDER_WATCH_SOURCE, orderAlerts } from "../../src/alerts/order-watch.js";
import type { ActivityEvent } from "../../src/observatory/activity-event.js";

/**
 * Order watch (#3407 P4 slice 2): the ledger's lifecycle lines a member would want to be TOLD
 * about — fills, partial fills, cancels, rejections, expiries, replaces — as alerts in the
 * ledger's own numbers; working states and submissions are not news; one alert per order per
 * state, inside a day.
 */

const NOW = Date.parse("2026-09-21T15:00:00Z");

const event = (
  over: Partial<ActivityEvent> & { payload?: Record<string, unknown> },
): ActivityEvent => ({
  id: "o-1:order.filled:t:5",
  eventType: "order.filled",
  actor: { participantId: "human-ann" },
  target: { kind: "order", id: "o-1" },
  at: "2026-09-21T14:30:00Z",
  correlationId: "o-1",
  source: "stream",
  outcome: "success",
  visibility: "public",
  ...over,
  payload: {
    symbol: "NVDA",
    side: "buy",
    quantity: 5,
    filledQuantity: 5,
    price: 181.32,
    status: "filled",
    ...(over.payload ?? {}),
  },
});

describe("orderAlerts", () => {
  it("tells a fill in the ledger's numbers, an info alert keyed to the order and its state", () => {
    const [alert] = orderAlerts([event({})], NOW);
    expect(alert).toMatchObject({
      source: ORDER_WATCH_SOURCE,
      priority: "info",
      symbol: "NVDA",
      title: "Order o-1 filled — 5 NVDA @ $181.32",
      dedupeKey: "filled:o-1",
    });
  });

  it("reads a partial fill as n of m, a rejection as a warning with a why, an option by its human name", () => {
    const partial = orderAlerts(
      [
        event({
          eventType: "order.updated",
          payload: { status: "partially_filled", filledQuantity: 2, quantity: 10 },
        }),
      ],
      NOW,
    )[0];
    expect(partial?.title).toBe("Order o-1 partly filled — 2 of 10 NVDA @ $181.32");
    const rejected = orderAlerts(
      [
        event({
          eventType: "order.updated",
          payload: { status: "rejected", symbol: "MSFT260918P00420000" },
        }),
      ],
      NOW,
    )[0];
    expect(rejected).toMatchObject({ priority: "warning", symbol: "MSFT" });
    expect(rejected?.title).toMatch(/^Order o-1 rejected — MSFT \$420 PUT/);
    expect(rejected?.body).toContain("refused");
  });

  it("says nothing about working states, submissions, non-order targets, or a line older than a day", () => {
    expect(
      orderAlerts(
        [
          event({ eventType: "order.updated", payload: { status: "accepted" } }),
          event({ eventType: "order.updated", payload: { status: "new" } }),
          event({ eventType: "order.submitted", payload: { status: undefined, intent: "open" } }),
          event({ target: { kind: "position", id: "NVDA" } }),
          event({ at: "2026-09-19T14:30:00Z" }),
        ],
        NOW,
      ),
    ).toEqual([]);
  });

  it("keeps one alert per order per state — the newest — so a re-read never duplicates", () => {
    const alerts = orderAlerts(
      [
        event({
          id: "a",
          eventType: "order.updated",
          at: "2026-09-21T14:00:00Z",
          payload: { status: "partially_filled", filledQuantity: 2, quantity: 5 },
        }),
        event({
          id: "b",
          eventType: "order.updated",
          at: "2026-09-21T14:10:00Z",
          payload: { status: "partially_filled", filledQuantity: 4, quantity: 5 },
        }),
        event({ id: "c", at: "2026-09-21T14:30:00Z" }),
      ],
      NOW,
    );
    expect(alerts.map((a) => [a.dedupeKey, a.title])).toEqual([
      ["partially_filled:o-1", "Order o-1 partly filled — 4 of 5 NVDA @ $181.32"],
      ["filled:o-1", "Order o-1 filled — 5 NVDA @ $181.32"],
    ]);
  });
});
