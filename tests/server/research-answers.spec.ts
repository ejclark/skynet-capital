import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Lesson } from "../../src/domain/campaign-lessons.js";
import type { QuestionLog } from "../../src/domain/campaign-questions.js";
import { shelfFileFor } from "../../src/domain/discovery-pass.js";
import type { DiscoveryAsk, DiscoveryQueue } from "../../src/domain/discovery-queue.js";
import {
  DAILY_PASS_UTC,
  MAX_RETURNED,
  myResearchQuestions,
  OPENING_MAX,
  openingLine,
  type ResearchAnswersSources,
  researchQuestionsResult,
  shelfOpening,
  waitSentence,
} from "../../src/server/research-answers.js";

/**
 * Research answers come back to the chat (#7286, named next slice 2). EARS:
 *   1. WHEN a member's tool call reads their research questions, the read SHALL return only the
 *      questions whose askers include that member's own key, and nothing for no key.
 *   2. WHEN a write-up on the shelf or a house campaign lesson answers one, it SHALL be `answered`
 *      and carry its source (the write-up's path, the lesson's source).
 *   3. WHILE one waits on the list, it SHALL be `waiting` with asks ahead and passes until taken, and
 *      the wait SHALL name the daily pass's time; WHILE no lane reads the list, no time is promised.
 *   4. The read SHALL NOT return another member's key, name or words: the wording only when this
 *      member asked first, others as a count, a member campaign never by its author's key.
 *   5. The pass time SHALL match the discovery workflow's cron.
 */

const ME = "m-me";
const OTHER = "m-other";

const ask = (over: Partial<DiscoveryAsk> & Pick<DiscoveryAsk, "subject">): DiscoveryAsk => ({
  id: over.campaign ? `${over.campaign}/name:${over.subject}` : `name:${over.subject}`,
  kind: "name",
  askedAt: "2026-11-08T10:00:00.000Z",
  askers: [ME],
  ...over,
});

const lesson = (answers: string): Lesson => ({
  id: "l1",
  kind: "on-watch",
  idea: "Grid queue lengths decide who gets power first.",
  symbols: ["VST"],
  on: "2026-11-09",
  recheckOn: "2026-12-09",
  source: "docs/research/discovery/name-vst-in-energy-for-ai.md",
  answers,
});

function sources(over: Partial<ResearchAnswersSources> = {}): ResearchAnswersSources {
  return {
    queue: () => [],
    log: () => [],
    answered: () => false,
    opening: () => undefined,
    findings: () => [],
    perPass: () => 2,
    laneReads: true,
    ...over,
  };
}

describe("myResearchQuestions — only the requester's own questions (criteria 1, 4)", () => {
  it("returns nothing without a member key, even when the list is full of asks", () => {
    const queue: DiscoveryQueue = [ask({ subject: "PLTR" })];
    const read = myResearchQuestions(sources({ queue: () => queue }), undefined);
    expect(read.questions).toEqual([]);
  });

  it("returns only questions this member is among the askers of", () => {
    const queue: DiscoveryQueue = [
      ask({ subject: "PLTR" }),
      ask({ subject: "SNOW", askers: [OTHER] }),
    ];
    const read = myResearchQuestions(sources({ queue: () => queue }), ME);
    expect(read.questions.map((q) => q.subject)).toEqual(["PLTR"]);
  });

  it("gives the wording only when this member asked first, and others only as a count", () => {
    const queue: DiscoveryQueue = [
      ask({ subject: "PLTR", askers: [ME, OTHER], question: "my own words" }),
      ask({ subject: "SNOW", askers: [OTHER, ME], question: "someone else's words" }),
    ];
    const read = myResearchQuestions(sources({ queue: () => queue }), ME);
    const bySubject = new Map(read.questions.map((q) => [q.subject, q]));
    expect(bySubject.get("PLTR")?.question).toBe("my own words");
    expect(bySubject.get("PLTR")?.othersAsking).toBe(1);
    expect(bySubject.get("SNOW")?.question).toBeUndefined();
    expect(bySubject.get("SNOW")?.othersAsking).toBe(1);
    const text = JSON.stringify(read);
    expect(text).not.toContain(OTHER);
    expect(text).not.toContain("someone else's words");
  });

  it("names a member campaign only as yours or a party one, never by its author's key", () => {
    const log: QuestionLog = [
      {
        id: `${OTHER}~shipping/name:ZIM`,
        campaign: `${OTHER}~shipping`,
        kind: "name",
        subject: "ZIM",
        askedAt: "2026-11-07T10:00:00.000Z",
        askers: [
          { key: OTHER, name: "Pat" },
          { key: ME, name: "Me" },
        ],
      },
      {
        id: `${ME}~mine/name:ASTS`,
        campaign: `${ME}~mine`,
        kind: "name",
        subject: "ASTS",
        askedAt: "2026-11-06T10:00:00.000Z",
        askers: [{ key: ME, name: "Me" }],
      },
    ];
    const read = myResearchQuestions(sources({ log: () => log }), ME);
    expect(read.questions.map((q) => q.askedIn)).toEqual(["a party campaign", "your campaign"]);
    const text = JSON.stringify(read);
    expect(text).not.toContain(OTHER);
    expect(text).not.toContain("Pat");
  });

  it("caps the list newest first and counts the rest", () => {
    const queue: DiscoveryQueue = Array.from({ length: MAX_RETURNED + 2 }, (_, i) =>
      ask({ subject: `T${i}`, askedAt: `2026-11-0${(i % 9) + 1}T10:00:00.000Z` }),
    );
    const read = myResearchQuestions(sources({ queue: () => queue }), ME);
    expect(read.questions).toHaveLength(MAX_RETURNED);
    expect(read.more).toBe(2);
    const dates = read.questions.map((q) => q.askedAt);
    expect([...dates].sort().reverse()).toEqual(dates);
  });
});

describe("myResearchQuestions — what came back (criteria 2, 3)", () => {
  it("marks a question with a write-up answered, with the write-up's path and opening line", () => {
    const pltr = ask({ subject: "PLTR" });
    const read = myResearchQuestions(
      sources({
        queue: () => [pltr],
        answered: (a) => a.subject === "PLTR",
        opening: () => "Stand aside until the contract backlog prints.",
      }),
      ME,
    );
    expect(read.questions[0]).toMatchObject({
      state: "answered",
      writeUp: shelfFileFor(pltr),
      opening: "Stand aside until the contract backlog prints.",
    });
    expect(read.questions[0]?.ahead).toBeUndefined();
  });

  it("carries a house campaign's lesson that answers the ask, with its source, after the list dropped it", () => {
    const id = "energy-for-ai/name:VST";
    const log: QuestionLog = [
      {
        id,
        campaign: "energy-for-ai",
        kind: "name",
        subject: "VST",
        question: "how fast can they add capacity?",
        askedAt: "2026-11-08T10:00:00.000Z",
        askers: [{ key: ME, name: "Me" }],
      },
    ];
    const read = myResearchQuestions(
      sources({
        log: () => log,
        findings: (campaign, askId) =>
          campaign === "energy-for-ai" && askId === id ? [lesson(id)] : [],
      }),
      ME,
    );
    expect(read.questions[0]).toMatchObject({
      state: "answered",
      askedIn: "Energy for AI",
      question: "how fast can they add capacity?",
      findings: [
        {
          kind: "on-watch",
          on: "2026-11-09",
          source: "docs/research/discovery/name-vst-in-energy-for-ai.md",
        },
      ],
    });
  });

  it("says where a waiting question stands and about how many daily passes until it is taken", () => {
    const queue: DiscoveryQueue = [
      ask({ subject: "AAA", askers: [OTHER] }),
      ask({ subject: "BBB", askers: [OTHER] }),
      ask({ subject: "DONE", askers: [OTHER] }),
      ask({ subject: "PLTR" }),
    ];
    const read = myResearchQuestions(
      sources({ queue: () => queue, answered: (a) => a.subject === "DONE", perPass: () => 2 }),
      ME,
    );
    // An answered ask ahead of it no longer counts: two ahead, two a pass, so the second pass.
    expect(read.questions[0]).toMatchObject({ state: "waiting", ahead: 2, passes: 2 });
    expect(read.wait).toContain(`${DAILY_PASS_UTC} UTC`);
  });

  it("promises no time while no lane reads the list", () => {
    const read = myResearchQuestions(
      sources({ queue: () => [ask({ subject: "PLTR" })], laneReads: false }),
      ME,
    );
    expect(read.questions[0]?.state).toBe("waiting");
    expect(read.questions[0]?.passes).toBeUndefined();
    expect(read.wait).toBe(waitSentence(false));
    expect(read.wait).not.toMatch(/\d/);
  });

  it("says a question that left the list with nothing on the shelf has no finding yet", () => {
    const log: QuestionLog = [
      {
        id: "oil-supply/name:XOM",
        campaign: "oil-supply",
        kind: "name",
        subject: "XOM",
        askedAt: "2026-11-08T10:00:00.000Z",
        askers: [{ key: ME, name: "Me" }],
      },
    ];
    const read = myResearchQuestions(sources({ log: () => log }), ME);
    expect(read.questions[0]?.state).toBe("no-finding-yet");
  });
});

describe("the write-up's opening line", () => {
  it("skips front matter and headings and strips list and bold markers", () => {
    const md = "---\ntitle: x\n---\n# PLTR\n\n## The call\n\n- **Stand aside** until it prints.\n";
    expect(openingLine(md)).toBe("Stand aside until it prints.");
  });

  it("caps a long line and answers undefined for a file with no text", () => {
    expect(openingLine(`${"a".repeat(OPENING_MAX + 50)}`)?.length).toBe(OPENING_MAX);
    expect(openingLine("# only a heading\n")).toBeUndefined();
  });

  it("reads the line off the shelf and answers undefined when no write-up exists", () => {
    const root = mkdtempSync(join(tmpdir(), "answers-"));
    const pltr = { kind: "name", subject: "PLTR" } as const;
    const read = shelfOpening(root);
    expect(read(pltr)).toBeUndefined();
    mkdirSync(join(root, "docs/research/discovery"), { recursive: true });
    writeFileSync(join(root, shelfFileFor(pltr)), "# PLTR\n\nThe call: stand aside.\n");
    expect(read(pltr)).toBe("The call: stand aside.");
  });
});

describe("the dispatcher's answer", () => {
  it("refuses without a linked desk and says plainly when the read isn't wired", () => {
    expect(researchQuestionsResult(() => myResearchQuestions(sources(), ME), undefined)).toEqual({
      ok: false,
      error: "no linked desk",
    });
    expect(researchQuestionsResult(undefined, "acct-1").ok).toBe(false);
  });
});

describe("the daily pass time (criterion 5)", () => {
  it("matches the discovery workflow's cron, so a schedule change there turns this red", () => {
    const yml = readFileSync(
      join(import.meta.dirname, "..", "..", ".github/workflows/moneypenny-discovery.yml"),
      "utf8",
    );
    const cron = yml.match(/cron:\s*"(\d+) (\d+) \* \* \*"/);
    expect(cron).not.toBeNull();
    const [, minute, hour] = cron as RegExpMatchArray;
    expect(DAILY_PASS_UTC).toBe(
      `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    );
  });
});
