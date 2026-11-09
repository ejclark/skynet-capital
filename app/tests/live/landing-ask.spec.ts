import type { EditionStory } from "../../src/live/edition";
import {
  askedByLine,
  askTarget,
  chatQuestion,
  NO_RECORD,
  type PartyQuestion,
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
    expect(questionState(question())).toBe("Kept; research doesn't read the list yet");
    expect(questionState(question({ state: "no-finding-yet" }))).toBe("No finding yet");
    const found = { idea: "x", on: "2026-11-08", source: "s" };
    expect(questionState(question({ state: "found", found: [found] }))).toBe("Answered");
  });

  it("leaves the server's own sentence under the form", () => {
    expect(replyLine({ ok: true, tell: "Queued." })).toBe("Queued.");
    expect(replyLine({ ok: false, error: "That campaign isn't one you can ask in." })).toMatch(
      /can't|isn't/,
    );
  });
});
