import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import {
  LIFECYCLE_ROW_LIMIT,
  serveOptionLifecycleApi,
} from "../../src/server/option-lifecycle-route.js";

/**
 * The lifecycle route (#3407 slice 4). Three things are pinned, each of which could otherwise tell
 * a member something false:
 *
 * - **Three answers, never two.** An unlinked session, a broker that did not answer, and an account
 *   with nothing to show are different facts. Collapsing the middle into `rows: []` would say
 *   "nothing happened to your contracts" on the strength of a timeout.
 * - **One broker read per load.** The deep history has its own owner (the backfill sweep); this
 *   route must never page.
 * - **Own account only**, from the session and never from the query string.
 */

function fakeRes() {
  const out: { status?: number; body?: string } = {};
  const res = {
    writeHead: (status: number) => {
      out.status = status;
      return res;
    },
    end: (body?: string) => {
      out.body = body;
    },
  } as unknown as ServerResponse;
  return { res, out };
}

function get(url: string): IncomingMessage {
  const req = Readable.from([]) as unknown as IncomingMessage;
  req.method = "GET";
  req.url = url;
  req.headers = {};
  return req;
}

const EXPIRED = {
  id: "act-1",
  activity_type: "OPEXP",
  symbol: "MSFT260918P00420000",
  qty: "2",
  date: "2026-09-18",
};
const ASSIGNED = {
  id: "act-2",
  activity_type: "OPASN",
  symbol: "MSFT260918P00420000",
  qty: "2",
  date: "2026-09-18",
};

function config(over: Record<string, unknown> = {}): DashboardServerConfig {
  return {
    auth: {},
    resolveOwnerId: (email: string) => (email === "ann@x.com" ? "human-ann" : undefined),
    now: () => new Date("2026-09-19T14:00:00Z"),
    ...over,
  } as unknown as DashboardServerConfig;
}

const ann = { email: "ann@x.com" } as never;

/** A client that records its reads, so "one call per load" can be counted rather than asserted. */
function recordingClient(answer: { ok: true; rows: unknown[] } | { ok: false }) {
  const calls: (string | undefined)[] = [];
  return {
    calls,
    client: {
      readOptionLifecycleActivities: (after?: string) => {
        calls.push(after);
        return Promise.resolve(answer);
      },
    },
  };
}

const body = (out: { body?: string }) => JSON.parse(out.body ?? "{}");

describe("GET /api/trade/option-lifecycle", () => {
  it("answers the account's events, newest first, with what each one did to the P/L", async () => {
    const { res, out } = fakeRes();
    const { client, calls } = recordingClient({ ok: true, rows: [ASSIGNED, EXPIRED] });
    const answered = await serveOptionLifecycleApi(
      get("/api/trade/option-lifecycle?participantId=human-ann"),
      res,
      "/api/trade/option-lifecycle",
      config({ optionsClientFor: () => client }),
      ann,
    );
    expect(answered).toBe(true);
    expect(out.status).toBe(200);
    const payload = body(out);
    expect(payload.available).toBe(true);
    expect(payload.asOf).toBe("2026-09-19T14:00:00.000Z");
    expect(payload.rows).toHaveLength(2);
    expect(payload.rows[0].headline).toBeTruthy();
    expect(payload.more).toBe(false);
    // ONE read. A second entry here would mean the pane had started paging the broker.
    expect(calls).toEqual([undefined]);
  });

  it("says the broker did not answer, rather than showing an empty list that reads as 'nothing happened'", async () => {
    const { res, out } = fakeRes();
    const { client } = recordingClient({ ok: false });
    await serveOptionLifecycleApi(
      get("/api/trade/option-lifecycle?participantId=human-ann"),
      res,
      "/api/trade/option-lifecycle",
      config({ optionsClientFor: () => client }),
      ann,
    );
    expect(body(out)).toEqual({ available: false, reason: "unreachable", rows: [] });
  });

  it("says the session is unlinked when it holds no options client", async () => {
    const { res, out } = fakeRes();
    await serveOptionLifecycleApi(
      get("/api/trade/option-lifecycle?participantId=human-ann"),
      res,
      "/api/trade/option-lifecycle",
      config({ optionsClientFor: () => undefined }),
      ann,
    );
    expect(body(out)).toEqual({ available: false, reason: "unlinked", rows: [] });
  });

  it("answers an available, empty list when the account simply has no lifecycle events", async () => {
    const { res, out } = fakeRes();
    const { client } = recordingClient({ ok: true, rows: [] });
    await serveOptionLifecycleApi(
      get("/api/trade/option-lifecycle?participantId=human-ann"),
      res,
      "/api/trade/option-lifecycle",
      config({ optionsClientFor: () => client }),
      ann,
    );
    expect(body(out)).toMatchObject({ available: true, rows: [], more: false });
  });

  it("drops a row the normalizer refuses instead of rendering a partial event", async () => {
    const { res, out } = fakeRes();
    const { client } = recordingClient({
      ok: true,
      // A FILL is not a lifecycle type; the third row has no quantity to act on.
      rows: [
        EXPIRED,
        { ...EXPIRED, id: "x", activity_type: "FILL" },
        { ...EXPIRED, id: "y", qty: "0" },
      ],
    });
    await serveOptionLifecycleApi(
      get("/api/trade/option-lifecycle?participantId=human-ann"),
      res,
      "/api/trade/option-lifecycle",
      config({ optionsClientFor: () => client }),
      ann,
    );
    expect(body(out).rows.map((r: { id: string }) => r.id)).toEqual(["act-1"]);
  });

  it("flags `more` only when rows the member could act on were held back", async () => {
    const { res, out } = fakeRes();
    const rows = Array.from({ length: LIFECYCLE_ROW_LIMIT + 3 }, (_, i) => ({
      ...EXPIRED,
      id: `act-${i}`,
      date: `2026-09-${String((i % 28) + 1).padStart(2, "0")}`,
    }));
    const { client } = recordingClient({ ok: true, rows });
    await serveOptionLifecycleApi(
      get("/api/trade/option-lifecycle?participantId=human-ann"),
      res,
      "/api/trade/option-lifecycle",
      config({ optionsClientFor: () => client }),
      ann,
    );
    const payload = body(out);
    expect(payload.rows).toHaveLength(LIFECYCLE_ROW_LIMIT);
    expect(payload.more).toBe(true);
  });

  it("refuses an account the session does not own, by 404 — identity is the session's", async () => {
    const { res, out } = fakeRes();
    const { client, calls } = recordingClient({ ok: true, rows: [EXPIRED] });
    await serveOptionLifecycleApi(
      get("/api/trade/option-lifecycle?participantId=bot-sauron"),
      res,
      "/api/trade/option-lifecycle",
      config({ optionsClientFor: () => client }),
      ann,
    );
    expect(out.status).toBe(404);
    // Never read at all: the refusal happens before any broker call on someone else's behalf.
    expect(calls).toEqual([]);
  });

  it("leaves another path alone", async () => {
    const { res } = fakeRes();
    expect(
      await serveOptionLifecycleApi(
        get("/api/trade/orders"),
        res,
        "/api/trade/orders",
        config(),
        ann,
      ),
    ).toBe(false);
  });
});
