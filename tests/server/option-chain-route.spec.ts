import type { ServerResponse } from "node:http";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { serveChain } from "../../src/server/option-chain-route.js";

/**
 * The options ticket's chain data, degrading exactly as the legacy `ticketData` degraded: a bad
 * param 400s, an unlinked session gets an honest note instead of an error, and a broker read
 * failure never blocks the ticket — only the premium estimate goes missing.
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

const config = (client: unknown): DashboardServerConfig =>
  ({ optionsClientFor: () => client }) as unknown as DashboardServerConfig;

describe("serveChain", () => {
  it("400s parameters that aren't a symbol and a side", async () => {
    const { res, out } = fakeRes();
    await serveChain(res, "/x?symbol=!!&type=put", config(undefined), "human-ann");
    expect(out.status).toBe(400);
  });

  it("400s a malformed expiration rather than passing it to the broker", async () => {
    const { res, out } = fakeRes();
    await serveChain(res, "/x?symbol=NVDA&type=put&exp=not-a-date", config(undefined), "human-ann");
    expect(out.status).toBe(400);
  });

  it("tells an unlinked session the honest note instead of erroring", async () => {
    const { res, out } = fakeRes();
    await serveChain(res, "/x?symbol=NVDA&type=put", config(undefined), "human-ann");
    expect(JSON.parse(out.body ?? "{}").chainNote).toContain("isn't linked to one yet");
  });

  it("serves expirations, the requested expiration's rows, and the premium precomputed", async () => {
    const client = {
      getExpirations: () => Promise.resolve(["2026-09-18", "2026-10-16"]),
      getChain: () =>
        Promise.resolve([{ occSymbol: "NVDA261016P00100000", strike: 100, bid: 2, ask: 3 }]),
      getUnderlyingPrice: () => Promise.resolve(105),
    };
    const { res, out } = fakeRes();
    await serveChain(res, "/x?symbol=NVDA&type=put&exp=2026-10-16", config(client), "human-ann");
    const body = JSON.parse(out.body ?? "{}");
    expect(body.expiration).toBe("2026-10-16");
    expect(body.spot).toBe(105);
    expect(body.rows[0].premium).toBe(2.5); // the bid/ask mid, computed server-side
  });

  it("falls back to the first expiration when the requested one isn't listed", async () => {
    const client = {
      getExpirations: () => Promise.resolve(["2026-09-18"]),
      getChain: () => Promise.resolve([]),
      getUnderlyingPrice: () => Promise.resolve(105),
    };
    const { res, out } = fakeRes();
    await serveChain(res, "/x?symbol=NVDA&type=put&exp=2026-12-18", config(client), "human-ann");
    expect(JSON.parse(out.body ?? "{}").expiration).toBe("2026-09-18");
  });

  it("gives up gracefully when the underlying has no listed options", async () => {
    const client = {
      getExpirations: () => Promise.resolve([]),
      getChain: () => Promise.resolve([]),
      getUnderlyingPrice: () => Promise.resolve(105),
    };
    const { res, out } = fakeRes();
    await serveChain(res, "/x?symbol=ZZZZ&type=call", config(client), "human-ann");
    expect(JSON.parse(out.body ?? "{}").chainNote).toContain("No listed options found for ZZZZ");
  });

  it("degrades a chain failure to the honest can't-estimate note", async () => {
    const client = { getExpirations: () => Promise.reject(new Error("feed down")) };
    const { res, out } = fakeRes();
    await serveChain(res, "/x?symbol=NVDA&type=call", config(client), "human-ann");
    expect(JSON.parse(out.body ?? "{}").chainNote).toContain("premiums just can't be estimated");
  });
});
