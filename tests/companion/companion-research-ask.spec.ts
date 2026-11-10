import {
  ASK_CARD_SHOWN,
  parseResearchAsk,
  RESEARCH_ASK_RULE,
  RESEARCH_ASK_TOOL_DEFS,
  type ResearchAskDraft,
  runResearchAskTool,
} from "../../src/companion/companion-research-ask.js";
import { COMPANION_SYSTEM_PROMPT } from "../../src/companion/companion-system-prompt.js";
import { runCompanionTool } from "../../src/companion/companion-tools.js";
import { LANE_READS_QUEUE } from "../../src/domain/discovery-lane.js";

/**
 * A QUESTION FOR THE RESEARCH DESK (the Moneypenny operator plan, research slice). She drafts an
 * open question about a company, sector or market as a card; only the member's tap puts it on the
 * research list. The tool writes nothing and promises no wait.
 */

const deps = (onResearchAskDraft?: (d: ResearchAskDraft) => void) => ({
  snapshotFor: () => undefined,
  ...(onResearchAskDraft ? { onResearchAskDraft } : {}),
});

describe("parseResearchAsk — the subject is one the research list takes", () => {
  it("reads a ticker, upper-cased, with the member's cleaned words", () => {
    expect(
      parseResearchAsk({ kind: "name", subject: " pltr ", question: "  Why\nis it   up?  " }),
    ).toEqual({ kind: "name", subject: "PLTR", label: "PLTR", question: "Why is it up?" });
  });

  it("reads a sector in any case and returns the catalog's spelling", () => {
    expect(parseResearchAsk({ kind: "sector", subject: "technology" })).toEqual({
      kind: "sector",
      subject: "Technology",
      label: "Technology",
    });
  });

  it("reads a market by its id and labels it by the name a person reads", () => {
    expect(parseResearchAsk({ kind: "market", subject: "gold", question: "Why now?" })).toEqual({
      kind: "market",
      subject: "gold",
      label: "Gold",
      question: "Why now?",
    });
  });

  it("caps the question at 200 characters and drops a blank one", () => {
    const long = parseResearchAsk({ kind: "name", subject: "NVDA", question: "q".repeat(900) });
    expect("question" in long && long.question).toHaveLength(200);
    expect(parseResearchAsk({ kind: "name", subject: "NVDA", question: "   " })).toEqual({
      kind: "name",
      subject: "NVDA",
      label: "NVDA",
    });
  });

  it("refuses a sector outside the catalog, naming the valid sectors", () => {
    const answer = parseResearchAsk({ kind: "sector", subject: "Crypto" });
    expect(answer).toEqual({
      error: expect.stringContaining("Technology, Communication Services"),
    });
    expect(answer).toEqual({ error: expect.stringContaining("Health") });
  });

  it("refuses a market outside the catalog, naming the ids with their names", () => {
    const answer = parseResearchAsk({ kind: "market", subject: "Gold bars" });
    expect(answer).toEqual({ error: expect.stringContaining("gold (Gold)") });
    expect(answer).toEqual({ error: expect.stringContaining("us-small-caps") });
  });

  it("refuses an option symbol or a sentence as a ticker", () => {
    expect(parseResearchAsk({ kind: "name", subject: "NVDA261218C00150000" })).toHaveProperty(
      "error",
    );
    expect(parseResearchAsk({ kind: "name", subject: "buy nvda" })).toHaveProperty("error");
    expect(parseResearchAsk({ kind: "name", subject: "" })).toHaveProperty("error");
  });

  it("refuses an unknown kind or no input at all", () => {
    expect(parseResearchAsk({ kind: "news", subject: "NVDA" })).toEqual({
      error: "kind must be one of name, sector or market",
    });
    expect(parseResearchAsk(undefined)).toHaveProperty("error");
  });
});

describe("draft_research_ask — a card the member's tap sends, never a write", () => {
  it("hands the draft to the rail once and says nothing is asked until the tap", async () => {
    const shown: ResearchAskDraft[] = [];
    const answer = await runCompanionTool(
      "draft_research_ask",
      deps((d) => shown.push(d)),
      undefined,
      { kind: "name", subject: "PLTR", question: "Why is it moving?" },
    );
    expect(shown).toEqual([
      { kind: "name", subject: "PLTR", label: "PLTR", question: "Why is it moving?" },
    ]);
    expect(answer).toEqual({
      ok: true,
      result: {
        shown: true,
        status: ASK_CARD_SHOWN,
        laneReadsQueue: LANE_READS_QUEUE,
        wait: expect.any(String),
      },
    });
    expect(ASK_CARD_SHOWN).toMatch(/nothing is asked yet/);
    expect(ASK_CARD_SHOWN).toMatch(/tap/);
  });

  it("refuses an invalid subject with the valid choices and calls no hook", async () => {
    const shown: ResearchAskDraft[] = [];
    const answer = await runCompanionTool(
      "draft_research_ask",
      deps((d) => shown.push(d)),
      "acct-1",
      { kind: "sector", subject: "Space" },
    );
    expect(answer).toEqual({ ok: false, error: expect.stringContaining("Energy") });
    expect(shown).toEqual([]);
  });

  it("works without a rail hook — a caller with no rail just drops the card", () => {
    expect(runResearchAskTool({ kind: "market", subject: "japan" }, undefined)).toMatchObject({
      ok: true,
      result: { shown: true },
    });
  });

  it("while research does not read the list, the wait line says so and promises no time", () => {
    const answer = runResearchAskTool({ kind: "name", subject: "NVDA" }, undefined);
    const result = (answer as { result: { laneReadsQueue: boolean; wait: string } }).result;
    expect(result.laneReadsQueue).toBe(LANE_READS_QUEUE);
    if (!LANE_READS_QUEUE) {
      expect(result.wait).toMatch(/does not read this list yet/);
      expect(result.wait).toMatch(/no wait to promise/);
    }
    expect(result.wait).not.toMatch(/\d+\s*(pass|day|hour|minute)/i);
  });

  it("takes exactly kind, subject and question — nothing that could carry an order", () => {
    const [def] = RESEARCH_ASK_TOOL_DEFS;
    expect(Object.keys(def.input_schema.properties).sort()).toEqual([
      "kind",
      "question",
      "subject",
    ]);
    expect(def.name).not.toMatch(/order|trade|place|submit|cancel|buy|sell/i);
    expect(def.description).toMatch(/Asks NOTHING/);
  });
});

describe("the system prompt carries the research desk rule", () => {
  it("includes the rule paragraph verbatim", () => {
    expect(COMPANION_SYSTEM_PROMPT).toContain(RESEARCH_ASK_RULE);
  });

  it("tells her to offer the research desk instead of stopping, and never to claim it is asked", () => {
    expect(RESEARCH_ASK_RULE).toMatch(/do not stop at "I don't have that"/);
    expect(RESEARCH_ASK_RULE).toMatch(/draft_research_ask/);
    expect(RESEARCH_ASK_RULE).toMatch(/only their tap on "Ask the research desk"/);
    expect(RESEARCH_ASK_RULE).toMatch(/never say it is asked, queued or being researched/);
    expect(RESEARCH_ASK_RULE).toMatch(/promise no time/);
    expect(RESEARCH_ASK_RULE).toMatch(/never tells anyone to buy or sell/);
  });
});
