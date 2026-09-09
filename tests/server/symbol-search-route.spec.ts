import type { ServerResponse } from "node:http";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { serveSymbolSearch } from "../../src/server/symbol-search-route.js";

/**
 * The Symbol field's tier-2 fallback route (Phase 0.8b), degrading exactly as `serveQuote`/
 * `serveBars` degrade: no client, a malformed query, or a broker-side throw all land on an
 * honest empty `{hits:[]}` — never an error status. This is speculative autocomplete
 * infrastructure, never the order path.
 *
 * `assetSearch`'s cache (`alpaca-asset-cache.ts`) is a genuine module-scoped singleton with a
 * 6-hour TTL, so any two tests in this file that reach a real client would otherwise share one
 * cache entry across the whole suite. The happy-path and throwing-client cases below reset the
 * module registry and re-import the route fresh, so each gets a cold cache and genuinely
 * exercises its own client — no `spyOn`/timer mocking needed.
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

describe("serveSymbolSearch", () => {
  it("gives an empty hit list with no client", async () => {
    const { res, out } = fakeRes();
    await serveSymbolSearch(res, "/x?q=GATO", config(undefined), "human-ann");
    expect(out.status).toBe(200);
    expect(JSON.parse(out.body ?? "{}")).toEqual({ hits: [] });
  });

  it("gives an empty hit list for a malformed query, without ever resolving a client", async () => {
    let resolved = false;
    const cfg = {
      optionsClientFor: () => {
        resolved = true;
        return { getAssets: async () => [] };
      },
    } as unknown as DashboardServerConfig;
    const { res, out } = fakeRes();
    await serveSymbolSearch(res, "/x?q=!!not-letters!!", cfg, "human-ann");
    expect(JSON.parse(out.body ?? "{}")).toEqual({ hits: [] });
    expect(resolved).toBe(false);
  });

  it("gives an empty hit list for an empty query, without ever resolving a client", async () => {
    let resolved = false;
    const cfg = {
      optionsClientFor: () => {
        resolved = true;
        return { getAssets: async () => [] };
      },
    } as unknown as DashboardServerConfig;
    const { res, out } = fakeRes();
    await serveSymbolSearch(res, "/x?q=", cfg, "human-ann");
    expect(JSON.parse(out.body ?? "{}")).toEqual({ hits: [] });
    expect(resolved).toBe(false);
  });

  it("returns real hits on the happy path", async () => {
    rstest.resetModules();
    const { serveSymbolSearch: freshServe } = await import(
      "../../src/server/symbol-search-route.js"
    );
    const client = {
      getAssets: async () => [{ symbol: "GATO", name: "Gatos Silver" }],
    };
    const { res, out } = fakeRes();
    await freshServe(res, "/x?q=GATO", config(client), "human-ann");
    const body = JSON.parse(out.body ?? "{}");
    expect(body.hits).toEqual([{ symbol: "GATO", name: "Gatos Silver" }]);
  });

  it("degrades to an empty hit list when the client throws", async () => {
    rstest.resetModules();
    const { serveSymbolSearch: freshServe } = await import(
      "../../src/server/symbol-search-route.js"
    );
    const client = {
      getAssets: () => Promise.reject(new Error("broker down")),
    };
    const { res, out } = fakeRes();
    await freshServe(res, "/x?q=GATO", config(client), "human-ann");
    expect(JSON.parse(out.body ?? "{}")).toEqual({ hits: [] });
  });
});
