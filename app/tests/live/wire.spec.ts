import { fetchWireForSymbol, type WireFeed } from "../../src/live/wire";

/**
 * `fetchWireForSymbol` (#2017 Phase 1 slice 12) — the who-else-traded row's fetch, a thin sibling
 * to `fetchWire` that hits the SAME endpoint scoped by `?symbol=`. Covers only the URL
 * construction/encoding here — the server-side filtering itself is `wire-data.spec.ts` and
 * `wire-routes.spec.ts`'s job.
 */

const emptyFeed: WireFeed = { trades: [], pnl: [], feedbackEnabled: false, feedback: [] };

function stubFetch(): { calls: string[] } {
  const calls: string[] = [];
  globalThis.fetch = ((url: string) => {
    calls.push(url);
    return Promise.resolve(
      new Response(JSON.stringify({ wire: emptyFeed }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
  }) as typeof globalThis.fetch;
  return { calls };
}

describe("fetchWireForSymbol", () => {
  it("hits /api/wire with the symbol as an encoded ?symbol= query param", async () => {
    const { calls } = stubFetch();
    await fetchWireForSymbol("NVDA");
    expect(calls).toEqual(["/api/wire?symbol=NVDA"]);
  });

  it("encodes a symbol with characters that aren't URL-safe as-is (e.g. a crypto pair's slash)", async () => {
    const { calls } = stubFetch();
    await fetchWireForSymbol("BTC/USD");
    expect(calls).toEqual(["/api/wire?symbol=BTC%2FUSD"]);
  });

  it("returns the unwrapped wire feed", async () => {
    stubFetch();
    const feed = await fetchWireForSymbol("NVDA");
    expect(feed).toEqual(emptyFeed);
  });

  it("throws when the response isn't ok", async () => {
    globalThis.fetch = (() =>
      Promise.resolve(new Response("", { status: 500 }))) as typeof globalThis.fetch;
    await expect(fetchWireForSymbol("NVDA")).rejects.toThrow("wire 500");
  });
});
