import { assetSearch } from "../../src/alpaca/alpaca-asset-cache";
import type { AlpacaAssetRow } from "../../src/alpaca/alpaca-options-client";

/**
 * The tier-2 symbol-search fallback's cache (Phase 0.8b). Same shape as `live-allow-set.ts`'s own
 * TTL-refresh-on-stale-read test doctrine, but the cache here is genuinely module-scoped (not a
 * per-call closure), so these tests tell ONE continuous story in declared order rather than
 * isolated cases — each `it` picks up exactly where the previous one left the cache. `now` is
 * driven explicitly throughout so the narrative never depends on wall-clock timing.
 */

const TTL_MS = 21_600_000;

describe("assetSearch", () => {
  it("empty/whitespace query short-circuits with no fetch at all", async () => {
    let calls = 0;
    const fetchAssets = (): Promise<AlpacaAssetRow[]> => {
      calls++;
      return Promise.resolve([]);
    };
    const hits = await assetSearch(fetchAssets, "   ", 8, () => 0);
    expect(hits).toEqual([]);
    expect(calls).toBe(0);
  });

  it("a cold first-ever failed fetch returns [] rather than throwing", async () => {
    let calls = 0;
    const fetchAssets = (): Promise<AlpacaAssetRow[] | undefined> => {
      calls++;
      return Promise.reject(new Error("feed down"));
    };
    const hits = await assetSearch(fetchAssets, "GATO", 8, () => 0);
    expect(hits).toEqual([]);
    expect(calls).toBe(1);
  });

  const T1 = TTL_MS + 1; // stale relative to the cold-failure read at t=0 above.

  it("ranks a fresh fetch the same tiers as searchTickers: exact/prefix/word-prefix/contains", async () => {
    const rows: AlpacaAssetRow[] = [
      { symbol: "NOPE", name: "Nothing Here" },
      { symbol: "ALGR", name: "Alligator Corp" }, // contains "gato"
      { symbol: "ZZZZ", name: "Gato Ventures" }, // name word starts with "gato"
      { symbol: "GATOX", name: "Gatox Materials" }, // symbol prefix
      { symbol: "GATO", name: "Gatos Silver" }, // exact symbol
    ];
    const fetchAssets = async (): Promise<AlpacaAssetRow[]> => rows;
    const hits = await assetSearch(fetchAssets, "GATO", 8, () => T1);
    expect(hits.map((h) => h.symbol)).toEqual(["GATO", "GATOX", "ZZZZ", "ALGR"]);
    expect(hits.find((h) => h.symbol === "GATO")?.name).toBe("Gatos Silver");
  });

  it("a fresh read (within the TTL) does not trigger a new fetch", async () => {
    let calls = 0;
    const fetchAssets = (): Promise<AlpacaAssetRow[]> => {
      calls++;
      return Promise.resolve([{ symbol: "SHOULDNT", name: "Not Called" }]);
    };
    const hits = await assetSearch(fetchAssets, "GATO", 8, () => T1 + 1_000);
    expect(calls).toBe(0);
    expect(hits.map((h) => h.symbol)).toEqual(["GATO", "GATOX", "ZZZZ", "ALGR"]);
  });

  const T2 = T1 + TTL_MS + 1; // stale relative to T1's successful fetch.

  it("a stale read (past the TTL) triggers a new fetch and replaces the cache", async () => {
    let calls = 0;
    const rows: AlpacaAssetRow[] = [{ symbol: "NEWCO", name: "New Company" }];
    const fetchAssets = (): Promise<AlpacaAssetRow[]> => {
      calls++;
      return Promise.resolve(rows);
    };
    const hits = await assetSearch(fetchAssets, "NEW", 8, () => T2);
    expect(calls).toBe(1);
    expect(hits.map((h) => h.symbol)).toEqual(["NEWCO"]);
  });

  const T3 = T2 + TTL_MS + 1;

  it("a failing refresh after a successful one keeps the old data (stale-on-failure)", async () => {
    let calls = 0;
    const fetchAssets = (): Promise<AlpacaAssetRow[] | undefined> => {
      calls++;
      return Promise.reject(new Error("feed down again"));
    };
    const hits = await assetSearch(fetchAssets, "NEW", 8, () => T3);
    expect(calls).toBe(1);
    // Still finds NEWCO from the previous successful fetch — the failure never nulled it out.
    expect(hits.map((h) => h.symbol)).toEqual(["NEWCO"]);
  });

  it("a name-less row falls back to the symbol itself as its display name", async () => {
    const rows: AlpacaAssetRow[] = [{ symbol: "BARE" }];
    const fetchAssets = async (): Promise<AlpacaAssetRow[]> => rows;
    const T4 = T3 + TTL_MS + 1;
    const hits = await assetSearch(fetchAssets, "BARE", 8, () => T4);
    expect(hits).toEqual([{ symbol: "BARE", name: "BARE" }]);
  });
});
