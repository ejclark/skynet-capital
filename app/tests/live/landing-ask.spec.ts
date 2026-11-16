import { readFileSync } from "node:fs";

import type { EditionStory } from "../../src/live/edition";
import {
  askedByLine,
  askForResearch,
  askTarget,
  chatQuestion,
  filedLine,
  HOLDER,
  holderLine,
  NO_RECORD,
  type PartyQuestion,
  QUESTION_MAX,
  QUICK_QUESTIONS,
  questionState,
  RECORD_CODA,
  recordAnswer,
  replyLine,
  storyQuestions,
} from "../../src/live/landing-ask";

// The landing page's asks (#7077 slice 2): the member's own question first with at most two quick
// questions, and beside each story the record's answer to "Is this a chance to buy?", their own
// question, and what other members asked about the story's names.

const story = (patch: Partial<EditionStory> = {}): EditionStory => ({
  id: "chip-drop",
  headline: "Chip stocks had their worst day since March 2020.",
  line: "Chips' worst day since March 2020",
  symbols: ["SMH", "NVDA"],
  facts: [{ label: "NVDA", value: "−9.3%", move: "down" }],
  reports: [],
  more: [
    { text: "Press tied the drop to the midterms.", mark: "reported", source: "CNBC" },
    {
      text: "A +5% sell made money 52% of the time, against 53% on any day.",
      mark: "measured",
      source: "study",
      n: 65,
    },
    { text: "The house holds nothing through these reports.", mark: "call", source: "ledger" },
  ],
  ...patch,
});

const question = (patch: Partial<PartyQuestion> = {}): PartyQuestion => ({
  kind: "name",
  subject: "NVDA",
  askedBy: ["Ana"],
  askedAt: "2026-11-08T10:00:00Z",
  state: "waiting",
  ahead: 2,
  found: [],
  ...patch,
});

describe("the ask box", () => {
  it("offers at most two quick questions under the member's own (criterion 2)", () => {
    expect(QUICK_QUESTIONS.length).toBeLessThanOrEqual(2);
    expect(QUICK_QUESTIONS).toContain("What's coming up that I should watch?");
  });
});

describe("the record's answer to the member's hunch", () => {
  it("answers with the base rates and the house's call only, never the rest", () => {
    const lines = recordAnswer(story());
    expect(lines.map((l) => l.mark)).toEqual(["measured", "call"]);
    expect(lines[0]?.n).toBe(65);
  });

  it("carries a key fact that states a base rate, with its sample size", () => {
    const lines = recordAnswer(
      story({
        facts: [{ label: "Fill rate", value: "38%", move: "up", note: "of 65 drops", n: 65 }],
        more: [],
      }),
    );
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ text: "Fill rate: 38% · of 65 drops", n: 65 });
  });

  it("says plainly when the record holds nothing, and never calls it a buy (criterion 7)", () => {
    expect(recordAnswer(story({ more: [] }))).toEqual([]);
    expect(NO_RECORD).toMatch(/can't answer/);
    const buy = /good (?:time|chance) to buy|buy the dip|buying opportunity/i;
    for (const text of [RECORD_CODA, NO_RECORD]) expect(text).not.toMatch(buy);
    expect(RECORD_CODA).toMatch(/never whether this one will/);
  });
});

describe("where a story's own question goes", () => {
  it("asks in the edition's campaign when the story names a stock", () => {
    expect(askTarget(story(), "ai-buildout")).toEqual({
      kind: "campaign",
      campaign: "ai-buildout",
      names: ["SMH", "NVDA"],
    });
  });

  it("goes to the chat when the story has no names or the edition no campaign", () => {
    expect(askTarget(story({ symbols: [] }), "ai-buildout")).toEqual({ kind: "chat" });
    expect(askTarget(story(), undefined)).toEqual({ kind: "chat" });
    expect(chatQuestion(story(), " why? ")).toBe(
      'About "Chip stocks had their worst day since March 2020.": why?',
    );
  });
});

describe("what other members asked", () => {
  it("lists only the questions about the story's names, newest first", () => {
    const list = storyQuestions(
      [
        question({ askedAt: "2026-11-07T10:00:00Z" }),
        question({ subject: "AAPL" }),
        question({ kind: "sector", subject: "NVDA" }),
        question({ subject: "SMH", askedAt: "2026-11-08T12:00:00Z" }),
      ],
      story(),
    );
    expect(list.map((q) => q.subject)).toEqual(["SMH", "NVDA"]);
  });

  it("names who asked by display name, folding a long list", () => {
    expect(askedByLine(["Ana"])).toBe("Ana");
    expect(askedByLine(["Ana", "Ben"])).toBe("Ana and Ben");
    expect(askedByLine(["Ana", "Ben", "Cy"])).toBe("Ana and 2 others");
  });

  it("says where a question stands in words, never a finding that isn't there", () => {
    expect(questionState(question(), true)).toBe("In line, 2 ahead");
    expect(questionState(question({ ahead: 0 }), true)).toBe("Next in line for research");
    // No lane reads the queue yet, so a waiting question promises no turn (#7034 slice 3b).
    expect(questionState(question())).toBe("In line, 2 ahead");
    // If the lane is ever switched off, a waiting question promises no turn (#7034 slice 3b).
    expect(questionState(question(), false)).toBe("Kept; research doesn't read the list yet");
    expect(questionState(question({ state: "no-finding-yet" }))).toBe("No finding yet");
    const found = { idea: "x", on: "2026-11-08", source: "s" };
    expect(questionState(question({ state: "found", found: [found] }))).toBe("Answered");
  });

  it("names the job of whoever holds a question, and promises no wait (criterion 9)", () => {
    expect(holderLine(question())).toBe("The research desk holds this question about NVDA.");
    expect(holderLine(question({ state: "found", found: [] }))).toBe(
      "The research desk answered this question about NVDA.",
    );
    expect(holderLine(question({ state: "no-finding-yet" }))).toBe(
      "The research desk looked at NVDA and has nothing yet.",
    );
    expect(holderLine(question({ state: "on-the-shelf" }))).toBe(
      "The research desk wrote up NVDA on the research shelf.",
    );
    expect(questionState(question({ state: "on-the-shelf" }))).toBe(
      "Written up on the research shelf",
    );
    // Only the job is named: never a time, a lane or a build seat.
    for (const state of ["waiting", "found", "on-the-shelf", "no-finding-yet"] as const) {
      expect(holderLine(question({ state }))).not.toMatch(
        /\d|minute|pass|soon|next|ahead|lane|builder|issue/i,
      );
    }
  });

  it("words the holder from a station the crew page really lists", () => {
    const seats = JSON.parse(readFileSync("../docs/agents/seats.json", "utf8")) as {
      seats: { station?: string }[];
    };
    const stations = seats.seats.flatMap((s) => (s.station ? [s.station.toLowerCase()] : []));
    expect(stations.some((st) => st.startsWith(HOLDER.toLowerCase()))).toBe(true);
  });

  it("leaves the server's own sentence under the form", () => {
    expect(replyLine({ ok: true, tell: "Queued." })).toBe("Queued.");
    expect(replyLine({ ok: false, error: "That campaign isn't one you can ask in." })).toMatch(
      /can't|isn't/,
    );
  });
});

describe("filing a research ask from the fast track (#7034 slice 3c)", () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it("posts a name ask with its question and no campaign, to the route the campaigns use", async () => {
    const seen: { url: string; body: unknown }[] = [];
    globalThis.fetch = ((url: string, init?: RequestInit) => {
      seen.push({ url, body: JSON.parse(String(init?.body)) });
      return Promise.resolve(Response.json({ ok: true, tell: "Queued." }));
    }) as typeof globalThis.fetch;
    await askForResearch({ subject: "NVDA", question: "  What do we know about NVDA earnings?  " });
    expect(seen).toEqual([
      {
        url: "/api/campaigns/ask",
        body: { kind: "name", subject: "NVDA", question: "What do we know about NVDA earnings?" },
      },
    ]);
  });

  it("caps the question at the server's length", async () => {
    let sent = "";
    globalThis.fetch = ((_url: string, init?: RequestInit) => {
      sent = (JSON.parse(String(init?.body)) as { question: string }).question;
      return Promise.resolve(Response.json({ ok: true }));
    }) as typeof globalThis.fetch;
    await askForResearch({ subject: "NVDA", question: "x".repeat(QUESTION_MAX + 50) });
    expect(sent).toHaveLength(QUESTION_MAX);
  });

  it("shows the queue's own sentence for the wait, and its refusal in the server's words", () => {
    expect(filedLine({ ok: true, tell: "Queued. It is next in line." })).toBe(
      "Queued. It is next in line.",
    );
    expect(filedLine({ ok: false, error: "You already have 3 questions waiting." })).toMatch(
      /already have/,
    );
  });

  it("never invents a time when the server sent no sentence", () => {
    expect(filedLine({ ok: true })).toBe("Kept on the research list.");
    expect(filedLine({ ok: true })).not.toMatch(/\d|pass|day/);
  });
});
