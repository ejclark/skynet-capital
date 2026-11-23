import { createFilingLane, type FilingPatch } from "../../src/live/moneypenny-filing";

/**
 * A chat draft matched to a known problem (#8005 slice 7) keeps its match all the way to the
 * filing: the coach may rewrite the words on the way out, never what the ask is evidence on, and
 * only the row and plan go up (the server rebuilds the words from the ledger).
 */

function lane() {
  const saved: FilingPatch[] = [];
  return createFilingLane({
    kind: () => "idea",
    coach: () => [],
    note: () => "",
    save: (patch) => saved.push(patch),
    say: async () => undefined,
    system: () => undefined,
    filed: () => undefined,
    beat: async () => undefined,
  });
}

function stub(coachEnabled: boolean) {
  const posts: { url: string; body: Record<string, unknown> }[] = [];
  globalThis.fetch = ((url: string, init?: RequestInit) => {
    const body = init?.body
      ? (JSON.parse(String(init.body)) as Record<string, unknown>)
      : undefined;
    if (body) posts.push({ url, body });
    const json =
      url === "/api/feedback" && !body
        ? { enabled: true, coachEnabled, followupEnabled: false, recent: [] }
        : url === "/feedback/coach"
          ? { ok: true, done: true, title: "Coached title", details: "Coached details", spec: {} }
          : { ok: true, url: "https://github.com/x/y/issues/9001", number: 9001 };
    return Promise.resolve(
      new Response(JSON.stringify(json), { headers: { "content-type": "application/json" } }),
    );
  }) as typeof fetch;
  return posts;
}

describe("sending a draft matched to a known problem", () => {
  let realFetch: typeof globalThis.fetch;
  beforeEach(() => {
    realFetch = globalThis.fetch;
  });
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  const draft = {
    kind: "idea" as const,
    title: "One list of orders",
    details: "d",
    match: { row: "U1", plan: 7000, words: "One history, three homes · plan #7000" },
  };

  it("files the row and plan, after the coach rewrote the words", async () => {
    const posts = stub(true);
    await lane().sendDraft(draft);
    const filed = posts.find((p) => p.url === "/api/feedback");
    expect(filed?.body).toMatchObject({ title: "Coached title", match: { row: "U1", plan: 7000 } });
    expect(filed?.body.match).not.toHaveProperty("words");
  });

  it("files the match without the coach too, and nothing when the draft had none", async () => {
    const posts = stub(false);
    await lane().sendDraft(draft);
    await lane().sendDraft({ kind: "bug", title: "t", details: "d" });
    const filed = posts.filter((p) => p.url === "/api/feedback");
    expect(filed[0]?.body.match).toEqual({ row: "U1", plan: 7000 });
    expect(filed[1]?.body).not.toHaveProperty("match");
  });
});
