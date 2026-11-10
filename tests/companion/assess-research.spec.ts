import {
  parseResearchSubject,
  RESEARCH_READ_RULE,
  RESEARCH_READ_TOOL_DEF,
} from "../../src/companion/assess-research.js";
import { COMPANION_SYSTEM_PROMPT } from "../../src/companion/companion-system-prompt.js";
import {
  type CompanionDeskDeps,
  declaredToolNames,
  runCompanionTool,
} from "../../src/companion/companion-tools.js";
import { SYMBOL_RE } from "../../src/domain/campaigns.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import { HOUSE_RESEARCH_NOTE, type HouseResearch } from "../../src/server/house-research.js";

/**
 * `get_research_on` (the Moneypenny operator plan, ASSESS): Moneypenny reads what the house already
 * knows about one company, sector or market before she says it knows nothing. Read-only, offered
 * with a linked desk only, and every subject is checked against the app's own catalogs before any
 * read.
 */

const snapshot: ParticipantSnapshot = {
  id: "acct-1",
  displayName: "Test Account",
  kind: "human",
  cash: 500,
  equity: 1500,
  positions: [{ symbol: "NVDA", quantity: 10, avgPrice: 100, marketValue: 1000 }],
  activity: [],
};

const sample: HouseResearch = {
  kind: "name",
  subject: "NVDA",
  shelf: "has a research ledger",
  campaigns: [{ id: "ai-buildout", title: "The AI buildout", storyline: "Chips first." }],
  lessons: [
    {
      kind: "on-watch",
      idea: "AMD takes share.",
      on: "2026-09-01",
      recheckOn: "2026-10-15",
      falsifier: "Share flat for two quarters.",
      source: "research/amd.md",
      stale: true,
    },
  ],
  more: 0,
  onTheList: { waiting: true, ahead: 2, askedBy: 3 },
  wait: "The house's research does not read the list yet, so no wait can be promised.",
  onYourBook: true,
  notCovered: ["news", "lawsuits"],
  note: HOUSE_RESEARCH_NOTE,
};

const calls: { ask: unknown; held: readonly string[] }[] = [];
const deps: CompanionDeskDeps = {
  snapshotFor: (id) => (id === "acct-1" ? snapshot : undefined),
  readResearchOn: (ask, held) => {
    calls.push({ ask, held });
    return sample;
  },
};

beforeEach(() => {
  calls.length = 0;
});

describe("parseResearchSubject — the catalogs decide, before any read", () => {
  it("reads a ticker upper-cased, a sector by its name in any case, a market by its id", () => {
    expect(parseResearchSubject({ kind: "name", subject: " nvda " })).toEqual({
      kind: "name",
      subject: "NVDA",
    });
    expect(parseResearchSubject({ kind: "sector", subject: "energy" })).toEqual({
      kind: "sector",
      subject: "Energy",
    });
    expect(parseResearchSubject({ kind: "market", subject: "us-large-caps" })).toEqual({
      kind: "market",
      subject: "us-large-caps",
    });
  });

  it("refuses an unknown kind by naming the three kinds", () => {
    const out = parseResearchSubject({ kind: "fund", subject: "SPY" });
    expect(out).toEqual({ error: expect.stringContaining("name, sector, market") });
  });

  it("refuses a sector it doesn't know by naming the sectors", () => {
    const out = parseResearchSubject({ kind: "sector", subject: "Robots" });
    expect("error" in out && out.error).toContain("Technology");
    expect("error" in out && out.error).toContain("Energy");
  });

  it("refuses a market it doesn't know by naming the market ids", () => {
    const out = parseResearchSubject({ kind: "market", subject: "moon" });
    expect("error" in out && out.error).toContain("us-large-caps");
  });

  it("refuses an option symbol or order-shaped text as a ticker", () => {
    for (const subject of ["NVDA261218C00150000", "buy 10 NVDA", "", 42]) {
      const out = parseResearchSubject({ kind: "name", subject });
      expect("error" in out && out.error).toContain("ticker");
    }
  });

  it("takes a ticker exactly when the research list's ask route would (campaigns.ts's shape)", () => {
    // The check is a local copy so the prompt's import graph never loads the campaign files; this
    // holds the copy to the original.
    for (const subject of ["NVDA", "BRK.B", "X", "A1", "1NVDA", "ABCDEFGHIJK", "NV-DA", ".A"]) {
      const out = parseResearchSubject({ kind: "name", subject });
      expect("error" in out).toBe(!SYMBOL_RE.test(subject));
    }
  });
});

describe("get_research_on through the dispatcher", () => {
  it("is offered only with a linked desk", () => {
    expect(declaredToolNames(undefined)).not.toContain("get_research_on");
    expect(declaredToolNames("acct-1")).toContain("get_research_on");
  });

  it("refuses with no linked desk, and reads nothing", async () => {
    const out = await runCompanionTool("get_research_on", deps, undefined, {
      kind: "name",
      subject: "NVDA",
    });
    expect(out).toEqual({ ok: false, error: "no linked desk" });
    expect(calls).toEqual([]);
  });

  it("refuses a bad subject before any read", async () => {
    const out = await runCompanionTool("get_research_on", deps, "acct-1", {
      kind: "sector",
      subject: "Robots",
    });
    expect(out.ok).toBe(false);
    expect(calls).toEqual([]);
  });

  it("passes the checked subject and the member's own held names through, and the result back as-is", async () => {
    const out = await runCompanionTool("get_research_on", deps, "acct-1", {
      kind: "name",
      subject: "nvda",
    });
    expect(out).toEqual({ ok: true, result: sample });
    expect(calls).toEqual([{ ask: { kind: "name", subject: "NVDA" }, held: ["NVDA"] }]);
  });

  it("says it is not available when the deployment has no reader", async () => {
    const out = await runCompanionTool(
      "get_research_on",
      { snapshotFor: deps.snapshotFor },
      "acct-1",
      { kind: "name", subject: "NVDA" },
    );
    expect(out).toEqual({ ok: false, error: "house research isn't available on this deployment" });
  });
});

describe("the tool's contract with the model", () => {
  it("takes exactly kind and subject, both required", () => {
    expect(Object.keys(RESEARCH_READ_TOOL_DEF.input_schema.properties)).toEqual([
      "kind",
      "subject",
    ]);
    expect(RESEARCH_READ_TOOL_DEF.input_schema.required).toEqual(["kind", "subject"]);
    expect(RESEARCH_READ_TOOL_DEF.input_schema.properties.kind.enum).toEqual([
      "name",
      "sector",
      "market",
    ]);
  });

  it("names every field its result returns, and says it is read-only and leaves out news and lawsuits", () => {
    const keys = [
      ...Object.keys(sample),
      ...Object.keys(sample.campaigns[0] ?? {}),
      ...Object.keys(sample.lessons[0] ?? {}),
      ...Object.keys(sample.onTheList),
    ];
    for (const key of keys) expect(RESEARCH_READ_TOOL_DEF.description).toContain(key);
    expect(RESEARCH_READ_TOOL_DEF.description).toContain("Read-only");
    expect(RESEARCH_READ_TOOL_DEF.description).toContain("news");
    expect(RESEARCH_READ_TOOL_DEF.description).toContain("lawsuits");
  });

  it("the system prompt tells her to read it before saying the house has nothing", () => {
    expect(COMPANION_SYSTEM_PROMPT).toContain(RESEARCH_READ_RULE);
    expect(RESEARCH_READ_RULE).toContain("get_research_on");
    expect(RESEARCH_READ_RULE).toContain("before you say the house has nothing");
    expect(RESEARCH_READ_RULE).toContain("never turn a lesson into a reason to buy or sell");
    expect(RESEARCH_READ_RULE).toContain("re-check date has passed");
  });
});
