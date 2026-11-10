import type { ResearchAskDraft } from "../../src/live/companion";
import {
  createResearchAskLane,
  RESEARCH_ASK_CHIPS,
  researchAnswerFor,
  researchAskCardText,
} from "../../src/live/moneypenny-research";

// The Moneypenny operator plan, research slice: the card's exits, its text, and the one lane that
// puts a question on the research list — only on the member's exact answer.

const DRAFT: ResearchAskDraft = {
  kind: "sector",
  subject: "Healthcare",
  label: "Healthcare",
  question: "What should I know before the drug-pricing vote?",
};

describe("researchAnswerFor — exact words only", () => {
  it("reads the two chips, typed in any case with a trailing stop", () => {
    expect(researchAnswerFor("Ask the research desk")).toBe("ask");
    expect(researchAnswerFor("  ask the research desk. ")).toBe("ask");
    expect(researchAnswerFor("Not now!")).toBe("not-now");
  });

  it("reads anything else as a normal message", () => {
    expect(researchAnswerFor("yes")).toBeUndefined();
    expect(researchAnswerFor("ask the research desk about NVDA too")).toBeUndefined();
    expect(researchAnswerFor("send")).toBeUndefined();
  });

  it("offers the same two exits as chips", () => {
    expect(RESEARCH_ASK_CHIPS.map((c) => c.label)).toEqual(["Ask the research desk", "Not now"]);
  });
});

describe("researchAskCardText", () => {
  it("names the subject, quotes the question and says nothing is asked until the tap", () => {
    const text = researchAskCardText(DRAFT);
    expect(text).toContain("Research question · Healthcare");
    expect(text).toContain("“What should I know before the drug-pricing vote?”");
    expect(text).toContain("nothing is asked until you tap");
  });

  it("says so when there is no question text", () => {
    expect(researchAskCardText({ kind: "name", subject: "NVDA", label: "NVDA" })).toContain(
      "no question text",
    );
  });
});

describe("createResearchAskLane", () => {
  let realFetch: typeof globalThis.fetch;
  beforeEach(() => {
    realFetch = globalThis.fetch;
  });
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  function stub(answer: () => Promise<Response>) {
    const sent: { url: string; body: unknown }[] = [];
    globalThis.fetch = ((url: string, init?: RequestInit) => {
      sent.push({ url, body: init?.body ? JSON.parse(String(init.body)) : undefined });
      return answer();
    }) as typeof globalThis.fetch;
    return sent;
  }
  const reply = (body: unknown, status = 200) =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      }),
    );

  it("posts kind, subject and question and says the server's tell", async () => {
    const sent = stub(() => reply({ ok: true, status: "queued", tell: "Kept." }));
    const said: string[] = [];
    const lane = createResearchAskLane({ say: async (l) => void said.push(...l) });
    expect(await lane.act("ask", DRAFT)).toBe(true);
    expect(sent).toEqual([
      {
        url: "/api/campaigns/ask",
        body: { kind: "sector", subject: "Healthcare", question: DRAFT.question },
      },
    ]);
    expect(said).toEqual(["Moneypenny · Kept."]);
  });

  it("leaves the question out when there is none", async () => {
    const sent = stub(() => reply({ ok: true, status: "queued", tell: "Kept." }));
    const lane = createResearchAskLane({ say: async () => undefined });
    await lane.act("ask", { kind: "market", subject: "gold", label: "Gold" });
    expect(sent[0]?.body).toEqual({ kind: "market", subject: "gold" });
  });

  it("says the server's refusal and keeps the card (false)", async () => {
    stub(() => reply({ ok: false, error: "Questions aren't wired in this deployment." }));
    const said: string[] = [];
    const lane = createResearchAskLane({ say: async (l) => void said.push(...l) });
    expect(await lane.act("ask", DRAFT)).toBe(false);
    expect(said).toEqual([
      "Moneypenny · Questions aren't wired in this deployment. nothing was asked.",
    ]);
  });

  it("says a failed post could not be asked and the card is still there (false)", async () => {
    stub(() => reply({ error: "malformed ask body" }, 400));
    const said: string[] = [];
    const lane = createResearchAskLane({ say: async (l) => void said.push(...l) });
    expect(await lane.act("ask", DRAFT)).toBe(false);
    expect(said[0]).toMatch(/nothing was asked\. the card is still there/);
  });

  it("'Not now' posts nothing and says nothing was asked", async () => {
    const sent = stub(() => reply({ ok: true }));
    const said: string[] = [];
    const lane = createResearchAskLane({ say: async (l) => void said.push(...l) });
    expect(await lane.act("not-now", DRAFT)).toBe(true);
    expect(sent).toEqual([]);
    expect(said).toEqual(["Moneypenny · set aside — nothing was asked."]);
  });
});
