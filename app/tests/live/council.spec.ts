import { fetchCouncil, submitThesis } from "../../src/live/council";

/** `fetchCouncil`/`submitThesis` — the Council's client model (issue #2224 shape 1). */

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

describe("fetchCouncil", () => {
  it("returns the unwrapped week view, defaulting entries to empty", async () => {
    stubGet({ enabled: true, week: "2026-W37", entries: [{ id: "a", text: "bullish", at: "x" }] });
    const week = await fetchCouncil();
    expect(week).toEqual({
      enabled: true,
      week: "2026-W37",
      entries: [{ id: "a", text: "bullish", at: "x" }],
      mine: undefined,
    });
  });

  it("honestly reports unwired rather than fabricating a week", async () => {
    stubGet({ enabled: false });
    const week = await fetchCouncil();
    expect(week.enabled).toBe(false);
    expect(week.entries).toEqual([]);
  });

  it("throws on a non-ok response", async () => {
    stubGet({}, 500);
    await expect(fetchCouncil()).rejects.toThrow("council 500");
  });
});

describe("submitThesis", () => {
  it("POSTs the trimmed text as JSON to /api/council", async () => {
    const { calls } = stubPost({ ok: true });
    await submitThesis("NVDA runs");
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("/api/council");
    expect(calls[0]?.init?.method).toBe("POST");
    expect(JSON.parse(String(calls[0]?.init?.body))).toEqual({ text: "NVDA runs" });
  });

  it("surfaces the server's own refusal message on failure", async () => {
    stubPost({ error: "Sign in to speak at the Council." }, 403);
    await expect(submitThesis("NVDA runs")).rejects.toThrow("Sign in to speak at the Council.");
  });
});
