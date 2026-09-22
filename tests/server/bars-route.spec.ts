import type { ServerResponse } from "node:http";
import { serveBars } from "../../src/server/bars-route.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";

/**
 * The chart section's backfill data, degrading exactly as `serveQuote` degrades: a bad symbol
 * 400s, an unlinked session gets an honest note instead of an error, an unreachable feed never
 * surfaces as an error — only an honest `barsNote`. And the one distinction the chart depends on:
 * an EMPTY bar list from the feed is served as the real answer it is, never rewritten as a note.
 */

const NOW = new Date("2026-09-08T15:30:00Z");
const DAY_MS = 24 * 60 * 60 * 1000;

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

const config = (client: unknown): DashboardServerConfig =>
  ({ optionsClientFor: () => client, now: () => NOW }) as unknown as DashboardServerConfig;

/** A client that records the window it was asked for and answers with `bars`. */
function recordingClient(bars: unknown) {
  const calls: Array<{ symbol: string; start: string; end: string }> = [];
  const client = {
    getBars: (symbol: string, start: string, end: string) => {
      calls.push({ symbol, start, end });
      return Promise.resolve(bars);
    },
  };
  return { client, calls };
}

const daysBetween = (start: string, end: string): number =>
  Math.round((Date.parse(end) - Date.parse(start)) / DAY_MS);

describe("serveBars", () => {
  it("400s a symbol that fails the underlying pattern", async () => {
    const { res, out } = fakeRes();
    await serveBars(res, "/x?symbol=!!", config(undefined), "human-ann");
    expect(out.status).toBe(400);
  });

  it("tells an unlinked session the honest note instead of erroring", async () => {
    const { res, out } = fakeRes();
    await serveBars(res, "/x?symbol=NVDA", config(undefined), "human-ann");
    expect(out.status).toBe(200);
    expect(JSON.parse(out.body ?? "{}").barsNote).toContain("isn't linked to one yet");
  });

  it("tells a session with no requester id the same note — identity is the session's only", async () => {
    const { client, calls } = recordingClient([]);
    const { res, out } = fakeRes();
    await serveBars(res, "/x?symbol=NVDA", config(client), undefined);
    expect(JSON.parse(out.body ?? "{}").barsNote).toContain("isn't linked to one yet");
    expect(calls).toHaveLength(0);
  });

  it("serves { symbol, bars } verbatim, symbol upper-cased", async () => {
    const bars = [
      { t: "2026-09-04T04:00:00Z", o: 425.5, h: 431.2, l: 424.9, c: 430.0, v: 21_010_500 },
    ];
    const { client } = recordingClient(bars);
    const { res, out } = fakeRes();
    await serveBars(res, "/x?symbol=nvda", config(client), "human-ann");
    expect(out.status).toBe(200);
    expect(JSON.parse(out.body ?? "{}")).toEqual({ symbol: "NVDA", bars });
  });

  it("serves an EMPTY bar list as a real answer, never as a note", async () => {
    const { client } = recordingClient([]);
    const { res, out } = fakeRes();
    await serveBars(res, "/x?symbol=NVDA", config(client), "human-ann");
    const body = JSON.parse(out.body ?? "{}");
    expect(body).toEqual({ symbol: "NVDA", bars: [] });
    expect(body.barsNote).toBeUndefined();
  });

  it("gives an honest note when the feed couldn't be reached (getBars → undefined)", async () => {
    const { client } = recordingClient(undefined);
    const { res, out } = fakeRes();
    await serveBars(res, "/x?symbol=NVDA", config(client), "human-ann");
    expect(out.status).toBe(200);
    expect(JSON.parse(out.body ?? "{}").barsNote).toContain("price history for NVDA");
  });

  it("gives an honest note when the client throws", async () => {
    const client = { getBars: () => Promise.reject(new Error("feed down")) };
    const { res, out } = fakeRes();
    await serveBars(res, "/x?symbol=NVDA", config(client), "human-ann");
    expect(JSON.parse(out.body ?? "{}").barsNote).toBe("Couldn't load price history right now.");
  });

  describe("the ?days= lookback window", () => {
    it("defaults to 180 calendar days ending today", async () => {
      const { client, calls } = recordingClient([]);
      const { res } = fakeRes();
      await serveBars(res, "/x?symbol=NVDA", config(client), "human-ann");
      expect(calls[0]).toEqual({ symbol: "NVDA", start: "2026-03-12", end: "2026-09-08" });
      expect(daysBetween(calls[0]?.start ?? "", calls[0]?.end ?? "")).toBe(180);
    });

    it("honours a sane ?days=", async () => {
      const { client, calls } = recordingClient([]);
      const { res } = fakeRes();
      await serveBars(res, "/x?symbol=NVDA&days=30", config(client), "human-ann");
      expect(calls[0]).toEqual({ symbol: "NVDA", start: "2026-08-09", end: "2026-09-08" });
    });

    it("clamps ?days=99999 to 1825 — never blows past five years", async () => {
      const { client, calls } = recordingClient([]);
      const { res } = fakeRes();
      await serveBars(res, "/x?symbol=NVDA&days=99999", config(client), "human-ann");
      expect(calls[0]?.end).toBe("2026-09-08");
      expect(daysBetween(calls[0]?.start ?? "", calls[0]?.end ?? "")).toBe(1825);
    });

    it("falls back to the default on junk, zero, or negative days", async () => {
      for (const days of ["abc", "0", "-5", ""]) {
        const { client, calls } = recordingClient([]);
        const { res } = fakeRes();
        await serveBars(res, `/x?symbol=NVDA&days=${days}`, config(client), "human-ann");
        expect(daysBetween(calls[0]?.start ?? "", calls[0]?.end ?? "")).toBe(180);
      }
    });

    it("truncates a fractional days value rather than rounding it up", async () => {
      const { client, calls } = recordingClient([]);
      const { res } = fakeRes();
      await serveBars(res, "/x?symbol=NVDA&days=30.9", config(client), "human-ann");
      expect(daysBetween(calls[0]?.start ?? "", calls[0]?.end ?? "")).toBe(30);
    });
  });
});
