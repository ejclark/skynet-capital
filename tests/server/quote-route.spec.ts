import type { ServerResponse } from "node:http";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { serveQuote } from "../../src/server/quote-route.js";

/**
 * The quote header's data, degrading exactly as `serveChain` degrades: a bad symbol 400s, an
 * unlinked session gets an honest note instead of an error, a missing quote or a broker read
 * failure never surfaces as an error — only an honest `quoteNote`.
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

describe("serveQuote", () => {
  it("400s a symbol that fails the underlying pattern", async () => {
    const { res, out } = fakeRes();
    await serveQuote(res, "/x?symbol=!!", config(undefined), "human-ann");
    expect(out.status).toBe(400);
  });

  it("tells an unlinked session the honest note instead of erroring", async () => {
    const { res, out } = fakeRes();
    await serveQuote(res, "/x?symbol=NVDA", config(undefined), "human-ann");
    expect(JSON.parse(out.body ?? "{}").quoteNote).toContain("isn't linked to one yet");
  });

  it("gives an honest note when the client has no quote", async () => {
    const client = { getUnderlyingQuote: () => Promise.resolve(undefined) };
    const { res, out } = fakeRes();
    await serveQuote(res, "/x?symbol=NVDA", config(client), "human-ann");
    expect(JSON.parse(out.body ?? "{}").quoteNote).toContain("No quote for NVDA");
  });

  it("gives an honest note when the client throws", async () => {
    const client = { getUnderlyingQuote: () => Promise.reject(new Error("feed down")) };
    const { res, out } = fakeRes();
    await serveQuote(res, "/x?symbol=NVDA", config(client), "human-ann");
    const body = JSON.parse(out.body ?? "{}");
    expect(body.quoteNote).toBe("Couldn't load a quote right now.");
  });

  it("serves the full quote view, tone computed server-side", async () => {
    const client = {
      getUnderlyingQuote: () => Promise.resolve({ last: 181.32, prevClose: 179.18 }),
    };
    const { res, out } = fakeRes();
    await serveQuote(res, "/x?symbol=nvda", config(client), "human-ann");
    const body = JSON.parse(out.body ?? "{}");
    expect(body).toEqual({
      symbol: "NVDA",
      last: 181.32,
      change: 2.14,
      changePct: 1.19,
      tone: "pos",
    });
  });
});
