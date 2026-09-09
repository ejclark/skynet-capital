import type { ServerResponse } from "node:http";

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
});
