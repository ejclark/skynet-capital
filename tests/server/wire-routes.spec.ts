import type { ServerResponse } from "node:http";

import {
  activityEventFromAuditRecord,
  activityEventFromFeedbackEntry,
  activityEventFromFeedbackStatus,
  activityEventFromTradeRecord,
} from "../../src/observatory/activity-event.js";
import type { TradeActivityRecord } from "../../src/observatory/activity-store.js";
import type { DashboardData } from "../../src/observatory/dashboard-data.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import type { FeedbackLogEntry } from "../../src/server/feedback-log.js";
import type { ObservatoryHub } from "../../src/server/observatory-hub.js";
import { serveWireJson, type WireRouteDeps } from "../../src/server/wire-routes.js";

// /wire's shared assembly: every dep is optional, so the honest empty state renders with nothing
// wired, and each wired dep's data actually reaches the shell's JSON. Rendering detail lives in
// wire-json-view.spec.ts.

const capture = (): {
  res: ServerResponse;
  out: { status: number; body: string; headers: Record<string, string> };
} => {
  const out = { status: 0, body: "", headers: {} as Record<string, string> };
  const res = {
    writeHead(status: number, headers?: Record<string, string>) {
      out.status = status;
      out.headers = headers ?? {};
      return res;
    },
    end(payload: string) {
      out.body = payload ?? "";
    },
  } as unknown as ServerResponse;
  return { res, out };
};

const snapshot = (overrides: Partial<ParticipantSnapshot> = {}): ParticipantSnapshot => ({
  id: "sauron",
  displayName: "Sauron",
  kind: "bot",
  cash: 1000,
  equity: 5000,
  positions: [],
  ...overrides,
});

const hubWith = (participants: ParticipantSnapshot[]): ObservatoryHub =>
  ({
    getState: (): DashboardData => ({
      generatedAt: "2026-08-25T00:00:00.000Z",
      participants,
      collisions: [],
    }),
  }) as unknown as ObservatoryHub;

const record = (overrides: Partial<TradeActivityRecord> = {}): TradeActivityRecord => ({
  orderId: "ord-1",
  participantId: "sauron",
  symbol: "NVDA",
  side: "buy",
  quantity: 10,
  filledQuantity: 10,
  price: 120,
  status: "filled",
  at: "2026-08-19T14:30:00.000Z",
  source: "stream",
  ...overrides,
});

const entry = (overrides: Partial<FeedbackLogEntry> = {}): FeedbackLogEntry => ({
  uuid: "u1",
  opaqueMemberId: "m1",
  issueNumber: 1,
  url: "https://github.com/x/y/issues/1",
  kind: "feature",
  title: "An idea",
  filedAt: "2026-08-20T00:00:00.000Z",
  ...overrides,
});

describe("serveWireJson", () => {
  it("renders the honest empty state when no deps are wired", async () => {
    const { res, out } = capture();
    const deps: WireRouteDeps = { hub: hubWith([snapshot()]) };

    await serveWireJson(res, "/api/wire", deps, false);

    expect(out.status).toBe(200);
    const wire = JSON.parse(out.body).wire;
    expect(wire.trades).toEqual([]);
    expect(wire.feedbackEnabled).toBe(false);
  });

  it("renders trades read from the wired activity store, joined to the hub's participants", async () => {
    const { res, out } = capture();
    const deps: WireRouteDeps = {
      hub: hubWith([snapshot()]),
      readAllTradeActivity: () => Promise.resolve([record()]),
    };

    await serveWireJson(res, "/api/wire", deps, true);

    const [trade] = JSON.parse(out.body).wire.trades;
    expect(trade.symbol).toBe("NVDA");
    expect(trade.who).toBe("Sauron");
  });

  // #784 slice 1 — the trade feed is built from the activity bus's own envelope. The ledger stays
  // wired alongside it because the event log only begins at #1211's deploy; these four hold the
  // bar that neither source loses a fill and the overlap is never counted twice.
  describe("the trade feed's source (#784 slice 1)", () => {
    const tradesFrom = (body: string): Array<{ symbol: string; who: string; when: string }> =>
      JSON.parse(body).wire.trades;

    it("renders a fill the bus published with no ledger wired at all", async () => {
      const { res, out } = capture();
      const deps: WireRouteDeps = {
        hub: hubWith([snapshot()]),
        readAllActivityEvents: () => Promise.resolve([activityEventFromTradeRecord(record())]),
      };

      await serveWireJson(res, "/api/wire", deps, true);

      expect(tradesFrom(out.body)).toHaveLength(1);
      expect(tradesFrom(out.body)[0]?.symbol).toBe("NVDA");
    });

    it("keeps a pre-bus ledger fill the event log never saw", async () => {
      const { res, out } = capture();
      const deps: WireRouteDeps = {
        hub: hubWith([snapshot()]),
        readAllActivityEvents: () =>
          Promise.resolve([activityEventFromTradeRecord(record({ orderId: "on-bus" }))]),
        readAllTradeActivity: () =>
          Promise.resolve([record({ orderId: "pre-bus", at: "2026-07-01T00:00:00.000Z" })]),
      };

      await serveWireJson(res, "/api/wire", deps, true);

      expect(tradesFrom(out.body)).toHaveLength(2);
    });

    it("counts a fill on BOTH the bus and the ledger exactly once", async () => {
      const { res, out } = capture();
      const both = record();
      const deps: WireRouteDeps = {
        hub: hubWith([snapshot()]),
        readAllActivityEvents: () => Promise.resolve([activityEventFromTradeRecord(both)]),
        readAllTradeActivity: () => Promise.resolve([both]),
      };

      await serveWireJson(res, "/api/wire", deps, true);

      expect(tradesFrom(out.body)).toHaveLength(1);
    });

    it("never puts an owner-only order.submitted line on the cross-member feed", async () => {
      const { res, out } = capture();
      const deps: WireRouteDeps = {
        hub: hubWith([snapshot()]),
        readAllActivityEvents: () =>
          Promise.resolve([
            activityEventFromAuditRecord({
              participantId: "sauron",
              orderId: "ord-1",
              at: "2026-08-19T14:29:00.000Z",
              ownerEmail: "member@example.com",
              symbol: "NVDA",
              side: "buy",
            }),
          ]),
      };

      await serveWireJson(res, "/api/wire", deps, true);

      expect(tradesFrom(out.body)).toEqual([]);
      expect(out.body).not.toContain("member@example.com");
    });
  });

  it("renders every member's filed feedback, not just one member's own", async () => {
    const { res, out } = capture();
    const deps: WireRouteDeps = {
      hub: hubWith([]),
      readAllFeedback: () => Promise.resolve([entry({ title: "Shared idea" })]),
    };

    await serveWireJson(res, "/api/wire", deps, true);

    const [feedback] = JSON.parse(out.body).wire.feedback;
    expect(feedback.title).toBe("Shared idea");
  });

  it("renders a filing that reached the bus but is not on the log — the pulse reads the envelope", async () => {
    const { res, out } = capture();
    const deps: WireRouteDeps = {
      hub: hubWith([]),
      readAllActivityEvents: () =>
        Promise.resolve([activityEventFromFeedbackEntry(entry({ title: "Bus-only idea" }))]),
    };

    await serveWireJson(res, "/api/wire", deps, true);

    expect(JSON.parse(out.body).wire.feedback[0].title).toBe("Bus-only idea");
  });

  it("shows a filing's open/shipped state off the bus with no status fetcher wired", async () => {
    const { res, out } = capture();
    const deps: WireRouteDeps = {
      hub: hubWith([]),
      readAllActivityEvents: () =>
        Promise.resolve([
          activityEventFromFeedbackEntry(entry()),
          activityEventFromFeedbackStatus(1, "shipped", "2026-08-21T00:00:00.000Z"),
        ]),
    };

    await serveWireJson(res, "/api/wire", deps, true);

    expect(JSON.parse(out.body).wire.feedback[0]).toMatchObject({ statusKey: "shipped" });
  });

  it("never double-counts a filing the bus and the log both hold", async () => {
    const { res, out } = capture();
    const deps: WireRouteDeps = {
      hub: hubWith([]),
      readAllActivityEvents: () => Promise.resolve([activityEventFromFeedbackEntry(entry())]),
      readAllFeedback: () => Promise.resolve([entry()]),
    };

    await serveWireJson(res, "/api/wire", deps, true);

    expect(JSON.parse(out.body).wire.feedback).toHaveLength(1);
  });

  it("a just-polled status reaches this render, not the next one", async () => {
    const { res, out } = capture();
    const deps: WireRouteDeps = {
      hub: hubWith([]),
      readAllFeedback: () => Promise.resolve([entry()]),
      fetchFeedbackStatus: () => Promise.resolve(new Map([[1, "needs-info" as const]])),
    };

    await serveWireJson(res, "/api/wire", deps, true);

    expect(JSON.parse(out.body).wire.feedback[0]).toMatchObject({ statusKey: "needs-info" });
  });

  it("fetches live status only for the feedback it actually renders", async () => {
    const { res } = capture();
    const requested: number[][] = [];
    const deps: WireRouteDeps = {
      hub: hubWith([]),
      readAllFeedback: () => Promise.resolve([entry({ issueNumber: 7 })]),
      fetchFeedbackStatus: (issueNumbers) => {
        requested.push([...issueNumbers]);
        return Promise.resolve(new Map());
      },
    };

    await serveWireJson(res, "/api/wire", deps, true);

    expect(requested).toEqual([[7]]);
  });

  it("never calls the status fetcher when there's no feedback to show", async () => {
    const { res } = capture();
    let called = false;
    const deps: WireRouteDeps = {
      hub: hubWith([]),
      readAllFeedback: () => Promise.resolve([]),
      fetchFeedbackStatus: () => {
        called = true;
        return Promise.resolve(new Map());
      },
    };

    await serveWireJson(res, "/api/wire", deps, true);

    expect(called).toBe(false);
  });

  // #2017 Phase 1 slice 12 — the who-else-traded row's server-side symbol scoping.
  describe("?symbol= filtering", () => {
    it("with no ?symbol= at all, behaves exactly as the plain Wire", async () => {
      const { res, out } = capture();
      const deps: WireRouteDeps = {
        hub: hubWith([snapshot()]),
        readAllTradeActivity: () =>
          Promise.resolve([
            record({ orderId: "a", symbol: "NVDA" }),
            record({ orderId: "b", symbol: "TSLA" }),
          ]),
      };

      await serveWireJson(res, "/api/wire", deps, false);

      const { trades } = JSON.parse(out.body).wire;
      expect(trades).toHaveLength(2);
    });

    it("with a valid ?symbol=, filters the trade feed to that underlying", async () => {
      const { res, out } = capture();
      const deps: WireRouteDeps = {
        hub: hubWith([snapshot()]),
        readAllTradeActivity: () =>
          Promise.resolve([
            record({ orderId: "a", symbol: "NVDA" }),
            record({ orderId: "b", symbol: "TSLA" }),
          ]),
      };

      await serveWireJson(res, "/api/wire?symbol=NVDA", deps, false);

      const { trades } = JSON.parse(out.body).wire;
      expect(trades).toHaveLength(1);
      expect(trades[0].symbol).toBe("NVDA");
    });

    it("silently ignores a malformed ?symbol= rather than 400ing the whole page", async () => {
      const { res, out } = capture();
      const deps: WireRouteDeps = {
        hub: hubWith([snapshot()]),
        readAllTradeActivity: () => Promise.resolve([record({ symbol: "NVDA" })]),
      };

      await serveWireJson(res, "/api/wire?symbol=!!not-valid!!", deps, false);

      expect(out.status).toBe(200);
      const { trades } = JSON.parse(out.body).wire;
      expect(trades).toHaveLength(1);
    });
  });

  describe("?per_page=/?before= pagination (PR 5, issue #2287)", () => {
    const many = Array.from({ length: 5 }, (_, i) =>
      record({ orderId: `ord-${i}`, at: `2026-08-2${i}T00:00:00.000Z` }),
    );

    it("defaults to 30 with no Link header when the page isn't full", async () => {
      const { res, out } = capture();
      const deps: WireRouteDeps = {
        hub: hubWith([snapshot()]),
        readAllTradeActivity: () => Promise.resolve(many),
      };

      await serveWireJson(res, "/api/wire", deps, false);

      expect(JSON.parse(out.body).wire.trades).toHaveLength(5);
      expect(out.headers.link).toBeUndefined();
    });

    it('clamps per_page, and a full page carries a Link: rel="next" header', async () => {
      const { res, out } = capture();
      const deps: WireRouteDeps = {
        hub: hubWith([snapshot()]),
        readAllTradeActivity: () => Promise.resolve(many),
      };

      await serveWireJson(res, "/api/wire?per_page=2", deps, false);

      const { trades } = JSON.parse(out.body).wire;
      expect(trades).toHaveLength(2);
      expect(trades[0].key.includes("2026-08-24T00:00:00.000Z")).toBe(true);
      expect(trades[1].key.includes("2026-08-23T00:00:00.000Z")).toBe(true);
      expect(out.headers.link).toBe(
        '</api/wire?per_page=2&before=2026-08-23T00%3A00%3A00.000Z>; rel="next"',
      );
    });

    it("follows the Link header's own before cursor to the next page", async () => {
      const deps: WireRouteDeps = {
        hub: hubWith([snapshot()]),
        readAllTradeActivity: () => Promise.resolve(many),
      };
      const first = capture();
      await serveWireJson(first.res, "/api/wire?per_page=2", deps, false);

      const second = capture();
      await serveWireJson(
        second.res,
        "/api/wire?per_page=2&before=2026-08-23T00:00:00.000Z",
        deps,
        false,
      );
      const { trades } = JSON.parse(second.out.body).wire;
      expect(trades[0].key.includes("2026-08-22T00:00:00.000Z")).toBe(true);
      expect(trades[1].key.includes("2026-08-21T00:00:00.000Z")).toBe(true);
    });
  });

  describe("reasoning + vitals (PR 6, issue #2287)", () => {
    const intent = {
      symbol: "NVDA",
      side: "buy" as const,
      quantity: 10,
      type: "market" as const,
      reason: "panic fade",
      strategy: "sauron-panic-claim",
    };
    const decision = {
      at: 1,
      personaId: "sauron",
      mode: "live" as const,
      rawIntents: [intent],
      guardedIntents: [intent],
      outcomes: [{ intent, action: "placed" as const }],
    };

    it("attaches reasoning to a bot row via the exact order-id join, none to a human row", async () => {
      const { res, out } = capture();
      const deps: WireRouteDeps = {
        hub: hubWith([snapshot(), snapshot({ id: "eric", kind: "human" })]),
        readAllTradeActivity: () =>
          Promise.resolve([
            record({ orderId: "ord-bot", participantId: "sauron" }),
            record({ orderId: "ord-human", participantId: "eric" }),
          ]),
        findByOrderId: (orderId) =>
          orderId === "ord-bot" ? { record: decision, intent } : undefined,
      };

      await serveWireJson(res, "/api/wire", deps, false);

      const { trades } = JSON.parse(out.body).wire;
      const bot = trades.find((t: { whoId: string }) => t.whoId === "sauron");
      const human = trades.find((t: { whoId: string }) => t.whoId === "eric");
      expect(bot.reasoning).toMatchObject({ reason: "panic fade", strategy: "sauron-panic-claim" });
      expect(human.reasoning).toBeUndefined();
    });

    it("attaches a live Loss headroom gauge when history is wired, nothing when it isn't", async () => {
      const withHistory = capture();
      const deps: WireRouteDeps = {
        hub: hubWith([snapshot()]),
        readAllTradeActivity: () => Promise.resolve([record({ orderId: "ord-bot" })]),
        findByOrderId: () => ({ record: decision, intent }),
        readHistory: () =>
          Promise.resolve([
            {
              at: "2026-08-19T00:00:00.000Z",
              participantId: "sauron",
              equity: 100_000,
              cash: 0,
              realizedPl: 0,
            },
            {
              at: "2026-08-19T14:30:00.000Z",
              participantId: "sauron",
              equity: 100_000,
              cash: 0,
              realizedPl: 0,
            },
          ]),
      };
      await serveWireJson(withHistory.res, "/api/wire", deps, false);
      const withHistoryTrades = JSON.parse(withHistory.out.body).wire.trades;
      expect(withHistoryTrades[0].vitals.lossHeadroom.measured).toBe(true);

      const withoutHistory = capture();
      await serveWireJson(
        withoutHistory.res,
        "/api/wire",
        { ...deps, readHistory: undefined },
        false,
      );
      const withoutHistoryTrades = JSON.parse(withoutHistory.out.body).wire.trades;
      expect(withoutHistoryTrades[0].vitals).toBeUndefined();
    });
  });
});
