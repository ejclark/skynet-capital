import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import {
  type FastTrackInput,
  NOT_RESEARCHED,
  nextStep,
  startFastTrack,
} from "../../src/domain/fast-track.js";
import type { MarketEvent } from "../../src/domain/market-events.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import {
  FAST_TRACK_PATH,
  type FastTrackDeps,
  fortnightEvents,
  serveFastTrackApi,
} from "../../src/server/fast-track-route.js";

/**
 * GET /api/fast-track (#7034 slice 2): the landing page's first fast track reads the fortnight with
 * every ledger's stance and live kill switches, and the session's own book — its positions, then its
 * watchlist — so the card walk runs in the browser with no request per card.
 */

const NOW = "2026-11-09T15:00:00Z";

const event = (over: Partial<MarketEvent> & Pick<MarketEvent, "id">): MarketEvent => ({
  kind: "earnings",
  title: `${over.id} title`,
  date: "2026-11-17",
  status: "confirmed",
  source: "IR: fixture",
  impact: "medium",
  symbols: [],
  ...over,
});

const LEDGER = `# NVDA print

## Stance & kill switches

**Kill switches:**

- A guide below consensus by 2026-11-19
- An old switch that could fire only by 2026-10-01
- Implied move over 12%
- A fourth switch
- A fifth switch
`;

let root: string;

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), "fast-track-route-"));
  mkdirSync(join(root, "events"));
  writeFileSync(join(root, "events", "nvda-print.md"), LEDGER);
});

afterAll(() => rmSync(root, { recursive: true, force: true }));

const nvda = event({ id: "nvda-print", title: "NVDA earnings print", symbols: ["NVDA"] });
const aapl = event({ id: "aapl-day", title: "AAPL event", symbols: ["AAPL"], impact: "high" });
const cpi = event({ id: "cpi", kind: "macro-print", title: "CPI", impact: "critical" });
const far = event({ id: "far", date: "2026-12-30", symbols: ["NVDA"] });

const deps = (): FastTrackDeps => ({ events: [nvda, aapl, cpi, far], prints: [], root });

function fakeRes() {
  const out: { status?: number; body?: string } = {};
  const res = {
    writeHead(status: number) {
      out.status = status;
      return res;
    },
    end(body?: string) {
      out.body = body ?? "";
    },
  } as unknown as ServerResponse;
  return { res, out };
}

function request(method = "GET"): IncomingMessage {
  const req = Readable.from([]) as unknown as IncomingMessage;
  req.method = method;
  req.url = FAST_TRACK_PATH;
  req.headers = {};
  return req;
}

function config(over: Partial<Record<string, unknown>> = {}): DashboardServerConfig {
  return {
    hub: {
      getState: () => ({
        participants: [
          {
            id: "ann-1",
            kind: "human",
            cash: 0,
            positions: [{ symbol: "NVDA261120C00150000", quantity: 1 }],
          },
          { id: "ben-1", kind: "human", cash: 0, positions: [{ symbol: "AAPL", quantity: 5 }] },
        ],
      }),
    },
    auth: {},
    resolveOwnerId: (email: string) => (email === "ann@x.com" ? "ann-1" : undefined),
    now: () => new Date(NOW),
    watchlist: {
      load: (member: string) =>
        Promise.resolve(member === "ann-1" ? [{ symbol: "AAPL", at: NOW }] : []),
    },
    ...over,
  } as unknown as DashboardServerConfig;
}

async function call(cfg: DashboardServerConfig, session: unknown, method = "GET") {
  const { res, out } = fakeRes();
  const answered = await serveFastTrackApi(
    request(method),
    res,
    FAST_TRACK_PATH,
    cfg,
    session as never,
    deps(),
  );
  const body = (out.body?.startsWith("{") ? JSON.parse(out.body) : {}) as FastTrackInput;
  return { answered, status: out.status, body };
}

describe("GET /api/fast-track", () => {
  it("answers only its own path", async () => {
    const { res } = fakeRes();
    expect(await serveFastTrackApi(request(), res, "/api/quests", config(), undefined)).toBe(false);
  });

  it("refuses anything but GET", async () => {
    const { status } = await call(config(), { email: "ann@x.com" }, "POST");
    expect(status).toBe(405);
  });

  it("returns the fortnight on New York's market day, past and far events left out", async () => {
    const { status, body } = await call(config(), { email: "ann@x.com" });
    expect(status).toBe(200);
    expect(body.asOf).toBe("2026-11-09");
    expect(body.events.map((e) => e.event.id).sort()).toEqual(["aapl-day", "cpi", "nvda-print"]);
  });

  it("reads each ledger's stance and its live kill switches, capped at the three a card offers", async () => {
    const { body } = await call(config(), { email: "ann@x.com" });
    const item = body.events.find((e) => e.event.id === "nvda-print");
    expect(item?.killSwitches).toEqual([
      "A guide below consensus by 2026-11-19",
      "Implied move over 12%",
      "A fourth switch",
    ]);
    const bare = body.events.find((e) => e.event.id === "cpi");
    expect(bare?.killSwitches).toEqual([]);
    expect(bare?.stance).toBeUndefined();
  });

  it("builds the book from the session's own positions (a contract as its underlying), then its watchlist", async () => {
    const { body } = await call(config(), { email: "ann@x.com" });
    expect(body.book).toEqual({ held: ["NVDA"], watched: ["AAPL"] });
  });

  it("never reads another member's book: an unlinked session gets the calendar with an empty book", async () => {
    const { status, body } = await call(config(), { email: "stranger@x.com" });
    expect(status).toBe(200);
    expect(body.book).toEqual({ held: [], watched: [] });
    expect(body.events.length).toBe(3);
  });

  it("keeps the list when the watchlist can't be read", async () => {
    const cfg = config({ watchlist: { load: () => Promise.reject(new Error("down")) } });
    const { body } = await call(cfg, { email: "ann@x.com" });
    expect(body.book).toEqual({ held: ["NVDA"], watched: [] });
  });

  it("feeds the engine: the first card puts the held name's event first and says when a stance is missing", async () => {
    const { body } = await call(config(), { email: "ann@x.com" });
    const step = nextStep(startFastTrack(), body);
    if (!("card" in step) || step.card.field !== "event")
      throw new Error("expected the event card");
    expect(step.card.rows.map((r) => r.id)).toEqual(["nvda-print", "aapl-day", "cpi"]);
    expect(step.card.rows[2]?.stance).toBe(NOT_RESEARCHED);
  });
});

describe("fortnightEvents", () => {
  it("returns a superseded event as the calendar has it; the engine is what leaves it out", () => {
    const moved = event({ id: "moved", symbols: ["MSFT"], supersededBy: "nvda-print" });
    const events = fortnightEvents("2026-11-09", { events: [moved], prints: [], root });
    expect(events).toHaveLength(1);
    expect(events[0]?.killSwitches).toEqual([]);
  });
});
