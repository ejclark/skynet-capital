import type { ServerResponse } from "node:http";

import type { TradeActivityRecord } from "../../src/observatory/activity-store.js";
import type { DashboardData } from "../../src/observatory/dashboard-data.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import type { FeedbackLogEntry } from "../../src/server/feedback-log.js";
import type { ObservatoryHub } from "../../src/server/observatory-hub.js";
import { serveWireRoute, type WireRouteDeps } from "../../src/server/wire-routes.js";

// /wire's dispatch: every dep is optional, so the honest empty state renders with nothing wired,
// and each wired dep's data actually reaches the page. Rendering detail lives in wire-view.spec.ts.

const capture = (): { res: ServerResponse; out: { status: number; body: string } } => {
  const out = { status: 0, body: "" };
  const res = {
    writeHead(status: number) {
      out.status = status;
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

const navFor = (active: string) => ({ active: active as never, canAdd: false, authed: true });

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

describe("serveWireRoute", () => {
  it("renders the honest empty state when no deps are wired", async () => {
    const { res, out } = capture();
    const deps: WireRouteDeps = { hub: hubWith([snapshot()]) };

    await serveWireRoute(res, deps, false, navFor);

    expect(out.status).toBe(200);
    expect(out.body).toContain("No trades on the wire yet");
    expect(out.body).toContain("isn't switched on yet");
  });

  it("renders trades read from the wired activity store, joined to the hub's participants", async () => {
    const { res, out } = capture();
    const deps: WireRouteDeps = {
      hub: hubWith([snapshot()]),
      readAllTradeActivity: () => Promise.resolve([record()]),
    };

    await serveWireRoute(res, deps, true, navFor);

    expect(out.body).toContain("NVDA");
    expect(out.body).toContain("Sauron");
  });

  it("renders every member's filed feedback, not just one member's own", async () => {
    const { res, out } = capture();
    const deps: WireRouteDeps = {
      hub: hubWith([]),
      readAllFeedback: () => Promise.resolve([entry({ title: "Shared idea" })]),
    };

    await serveWireRoute(res, deps, true, navFor);

    expect(out.body).toContain("Shared idea");
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

    await serveWireRoute(res, deps, true, navFor);

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

    await serveWireRoute(res, deps, true, navFor);

    expect(called).toBe(false);
  });
});
