import {
  fetchCouncilReplies,
  removeCouncilReply,
  submitCouncilReply,
} from "../../src/live/council-replies";

/** Replies under a weekly Council line (#5097) — the client model mirrors `/api/council/replies`. */

function stub(body: unknown, status = 200): { calls: { url: string; init?: RequestInit }[] } {
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

const reply = {
  id: "r1",
  text: "The ruling isn't until November",
  at: "2026-10-06T10:00:00.000Z",
  mine: false,
  byLineAuthor: false,
  earlierLine: false,
};

describe("fetchCouncilReplies", () => {
  it("returns the week's threads keyed by line", async () => {
    const { calls } = stub({ enabled: true, week: "2026-W41", replies: { amy: [reply] } });
    expect(await fetchCouncilReplies()).toEqual({
      enabled: true,
      week: "2026-W41",
      replies: { amy: [reply] },
    });
    expect(calls[0]?.url).toBe("/api/council/replies");
  });

  it("honestly reports unwired, with no threads", async () => {
    stub({ enabled: false });
    expect(await fetchCouncilReplies()).toEqual({ enabled: false, week: undefined, replies: {} });
  });

  it("throws on a non-ok response", async () => {
    stub({}, 500);
    await expect(fetchCouncilReplies()).rejects.toThrow("council replies 500");
  });
});

describe("submitCouncilReply / removeCouncilReply", () => {
  it("posts the line, the version read and the words — never an author", async () => {
    const { calls } = stub({ ok: true });
    await submitCouncilReply("amy", "2026-10-05T09:00:00.000Z", "Disagree");
    expect(calls[0]?.url).toBe("/api/council/replies");
    expect(JSON.parse(String(calls[0]?.init?.body))).toEqual({
      lineId: "amy",
      lineAt: "2026-10-05T09:00:00.000Z",
      text: "Disagree",
    });
  });

  it("names only the line and the reply to delete — the server matches the writer", async () => {
    const { calls } = stub({ ok: true });
    expect(await removeCouncilReply("amy", "r1")).toEqual({ ok: true });
    expect(JSON.parse(String(calls[0]?.init?.body))).toEqual({ lineId: "amy", remove: "r1" });
  });
});
