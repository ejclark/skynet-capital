import {
  deletePositionRequest,
  fetchSavedPositions,
  savePositionRequest,
  updatePositionRequest,
} from "../../src/live/saved-positions";

/** The saved-positions client model (#3968 slice 2) — mirrors `playbook-store.ts`'s shape, but with
 *  no `id`/account param anywhere: a saved position is scoped to the signed-in member alone. */

function stubGet(body: unknown, status = 200): { calls: string[] } {
  const calls: string[] = [];
  globalThis.fetch = ((url: string) => {
    calls.push(url);
    return Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      }),
    );
  }) as typeof globalThis.fetch;
  return { calls };
}

function stubPost(body: unknown, status = 200): { calls: { url: string; init?: RequestInit }[] } {
  const calls: { url: string; init?: RequestInit }[] = [];
  globalThis.fetch = ((url: string, init?: RequestInit) => {
    calls.push({ url, init });
    return Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      }),
    );
  }) as typeof globalThis.fetch;
  return { calls };
}

const POSITION = {
  id: "pos-1",
  symbol: "CRWV",
  name: "My Fidelity calls",
  stake: { shares: 400, costBasis: 70 },
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
};

describe("fetchSavedPositions", () => {
  it("hits the one no-param route and unwraps the list", async () => {
    const { calls } = stubGet({ positions: [POSITION] });
    expect(await fetchSavedPositions()).toEqual([POSITION]);
    expect(calls).toEqual(["/api/saved-positions"]);
  });

  it("throws on a non-2xx, carrying the status", async () => {
    stubGet({}, 401);
    await expect(fetchSavedPositions()).rejects.toThrow("401");
  });
});

describe("savePositionRequest", () => {
  it("POSTs symbol/name/stake and returns the server's saved row", async () => {
    const { calls } = stubPost({ ok: true, position: POSITION });
    const result = await savePositionRequest({
      symbol: "CRWV",
      name: "My Fidelity calls",
      stake: { shares: 400, costBasis: 70 },
    });
    expect(result).toEqual({ ok: true, position: POSITION });
    expect(calls[0]?.url).toBe("/api/saved-positions/save");
    expect(JSON.parse(String(calls[0]?.init?.body))).toEqual({
      symbol: "CRWV",
      name: "My Fidelity calls",
      stake: { shares: 400, costBasis: 70 },
    });
  });

  it("surfaces an in-band refusal without throwing — the caller reads ok:false", async () => {
    stubPost({ ok: false, error: "Name too long." });
    expect(await savePositionRequest({ symbol: "CRWV", name: "x", stake: {} })).toEqual({
      ok: false,
      error: "Name too long.",
    });
  });
});

describe("updatePositionRequest", () => {
  it("POSTs only the id plus whichever fields changed", async () => {
    const { calls } = stubPost({ ok: true });
    await updatePositionRequest({ id: "pos-1", name: "Renamed" });
    expect(JSON.parse(String(calls[0]?.init?.body))).toEqual({ id: "pos-1", name: "Renamed" });
  });
});

describe("deletePositionRequest", () => {
  it("POSTs just the id", async () => {
    const { calls } = stubPost({ ok: true });
    await deletePositionRequest("pos-1");
    expect(calls[0]?.url).toBe("/api/saved-positions/delete");
    expect(JSON.parse(String(calls[0]?.init?.body))).toEqual({ id: "pos-1" });
  });
});
