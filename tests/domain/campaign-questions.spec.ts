import type { Lesson } from "../../src/domain/campaign-lessons.js";
import {
  type CampaignQuestion,
  displayName,
  isSuggestion,
  MAX_PER_CAMPAIGN,
  NEUTRAL_NAME,
  type QuestionLog,
  questionsIn,
  recordQuestion,
} from "../../src/domain/campaign-questions.js";
import { CAMPAIGNS, campaignById } from "../../src/domain/campaigns.js";
import {
  type CoveringCandidate,
  type DiscoveryAsk,
  MAX_ASKERS,
  queueAsk,
} from "../../src/domain/discovery-queue.js";

/**
 * Campaigns are communal (#6949 slice 6, criteria 10–11): WHEN a member asks a question in a
 * campaign, every member who can read that campaign sees the question, who asked it (display name,
 * never email) and what its research found; a question pointing outside the cast is a suggestion
 * to the author, never an edit.
 */

const AI = campaignById("ai-buildout");
if (!AI) throw new Error("fixture: the ai-buildout house campaign is missing");
const AT = new Date("2026-11-08T12:00:00Z");
const ask = (subject: string, campaign = "ai-buildout", question?: string): DiscoveryAsk => ({
  id: `${campaign}/name:${subject}`,
  kind: "name",
  subject,
  askedAt: AT.toISOString(),
  askers: ["k1"],
  campaign,
  ...(question ? { question } : {}),
});
const grace = { key: "k1", name: "Grace" };
const bob = { key: "k2", name: "Bob" };

describe("displayName", () => {
  it("shows the session's name, tidied and capped", () => {
    expect(displayName("  Ada\n Lovelace ")).toBe("Ada Lovelace");
    expect(displayName("x".repeat(90))).toHaveLength(60);
  });

  it("never shows an email, and names nobody as a neutral member", () => {
    expect(displayName("ada@example.com")).toBe(NEUTRAL_NAME);
    expect(displayName("")).toBe(NEUTRAL_NAME);
    expect(displayName(undefined)).toBe(NEUTRAL_NAME);
  });
});

describe("recordQuestion", () => {
  it("logs a question asked in a campaign, with the asker's name and words", () => {
    const log = recordQuestion([], ask("NVDA", "ai-buildout", "Power or chips?"), grace, AT);
    expect(log).toEqual([
      {
        id: "ai-buildout/name:NVDA",
        campaign: "ai-buildout",
        kind: "name",
        subject: "NVDA",
        question: "Power or chips?",
        askedAt: AT.toISOString(),
        askers: [grace],
      },
    ]);
  });

  it("ignores a bare ask: only a question asked inside a campaign is the party's", () => {
    const bare = { ...ask("NVDA"), id: "name:NVDA" };
    const { campaign: _c, ...noCampaign } = bare;
    expect(recordQuestion([], noCampaign, grace)).toEqual([]);
  });

  it("adds a second asker once, keeps the first words, and stops at the asker bound", () => {
    let log = recordQuestion([], ask("NVDA", "ai-buildout", "First"), grace, AT);
    log = recordQuestion(log, ask("NVDA", "ai-buildout", "Second"), bob, AT);
    const same = recordQuestion(log, ask("NVDA"), bob, AT);
    expect(same[0]?.askers).toEqual([grace, bob]);
    expect(log[0]).toMatchObject({ question: "First", askers: [grace, bob] });
    for (let i = 0; i < MAX_ASKERS + 5; i++)
      log = recordQuestion(log, ask("NVDA"), { key: `m${i}`, name: `M${i}` });
    expect(log[0]?.askers).toHaveLength(MAX_ASKERS);
  });

  it("dates every re-ask in lastAskedAt and keeps the first askedAt the campaign shows (#7445)", () => {
    const later = new Date("2026-11-18T12:00:00Z");
    const latest = new Date("2026-11-20T12:00:00Z");
    let log = recordQuestion([], ask("NVDA"), grace, AT);
    expect(log[0]?.lastAskedAt).toBeUndefined();
    log = recordQuestion(log, ask("NVDA"), bob, later);
    expect(log[0]).toMatchObject({ askedAt: AT.toISOString(), lastAskedAt: later.toISOString() });
    // The same member asking again adds no asker but is still a dated ask.
    log = recordQuestion(log, ask("NVDA"), grace, latest);
    expect(log[0]).toMatchObject({
      askedAt: AT.toISOString(),
      lastAskedAt: latest.toISOString(),
      askers: [grace, bob],
    });
  });

  it("drops a campaign's oldest question past the bound, and never another campaign's", () => {
    let log: QuestionLog = recordQuestion([], ask("OTHER", "oil-supply"), grace, AT);
    for (let i = 0; i < MAX_PER_CAMPAIGN + 1; i++)
      log = recordQuestion(log, ask(`Q${i}`), grace, AT);
    const ai = log.filter((q) => q.campaign === "ai-buildout");
    expect(ai).toHaveLength(MAX_PER_CAMPAIGN);
    expect(ai[0]?.subject).toBe("Q1");
    expect(log.some((q) => q.campaign === "oil-supply")).toBe(true);
  });
});

describe("isSuggestion", () => {
  it("is a name outside the cast, or a sector or market that is not the anchor", () => {
    expect(isSuggestion({ kind: "name", subject: "NVDA" }, AI)).toBe(false);
    expect(isSuggestion({ kind: "name", subject: "PLTR" }, AI)).toBe(true);
    expect(isSuggestion({ kind: "sector", subject: AI.sector ?? "none" }, AI)).toBe(
      AI.sector === undefined,
    );
    expect(isSuggestion({ kind: "sector", subject: "Utilities" }, AI)).toBe(true);
    expect(isSuggestion({ kind: "market", subject: "gold" }, AI)).toBe(true);
  });
});

describe("questionsIn", () => {
  const lesson: Lesson = {
    id: "pltr-data",
    kind: "on-watch",
    idea: "PLTR sells to the buyers, not the builders.",
    symbols: ["PLTR"],
    on: "2026-11-08",
    recheckOn: "2026-12-01",
    source: "docs/research/ai-dip-2026-10.md",
    answers: "ai-buildout/name:PLTR",
  };
  const entry = (subject: string, at: string): CampaignQuestion => ({
    id: `ai-buildout/name:${subject}`,
    campaign: "ai-buildout",
    kind: "name",
    subject,
    askedAt: at,
    askers: [grace, bob],
  });
  const log: QuestionLog = [
    entry("PLTR", "2026-11-08T10:00:00Z"),
    entry("AMD", "2026-11-08T11:00:00Z"),
    entry("NVDA", "2026-11-08T12:00:00Z"),
    { ...entry("XOM", "2026-11-08T13:00:00Z"), campaign: "oil-supply", id: "oil-supply/name:XOM" },
  ];
  const queue = queueAsk(
    [],
    { kind: "name", subject: "AMD", by: "k1", campaign: "ai-buildout" },
    CAMPAIGNS,
    () => false,
  ).queue;
  const found = (id: string): readonly Lesson[] => (id === lesson.answers ? [lesson] : []);

  it("lists only this campaign's questions, newest first, by display name", () => {
    const views = questionsIn(log, "ai-buildout", AI, queue, found);
    expect(views.map((v) => v.subject)).toEqual(["NVDA", "AMD", "PLTR"]);
    expect(views.every((v) => v.askedBy.join() === "Grace,Bob")).toBe(true);
    expect(JSON.stringify(views)).not.toMatch(/k1|k2/);
  });

  it("says plainly whether each one found something, waits in line, or has no finding yet", () => {
    const [nvda, amd, pltr] = questionsIn(log, "ai-buildout", AI, queue, found);
    expect(pltr).toMatchObject({
      state: "found",
      found: [
        { kind: "on-watch", idea: lesson.idea, recheckOn: "2026-12-01", source: lesson.source },
      ],
      suggestion: true,
    });
    expect(amd).toMatchObject({ state: "waiting", ahead: 0, found: [], suggestion: false });
    expect(nvda).toMatchObject({ state: "no-finding-yet", suggestion: false });
    expect(nvda).not.toHaveProperty("ahead");
  });

  it("says a write-up is on the research shelf when no lesson carries it (#7034 slice 3b)", () => {
    const shelved = (id: string): boolean => id === log.find((q) => q.subject === "NVDA")?.id;
    const views = questionsIn(log, "ai-buildout", AI, queue, found, shelved);
    expect(views.find((v) => v.subject === "NVDA")).toMatchObject({ state: "on-the-shelf" });
    // A finding in the record still wins, and a question still waiting in line is still waiting.
    expect(views.find((v) => v.subject === "PLTR")?.state).toBe("found");
    expect(views.find((v) => v.subject === "AMD")?.state).toBe("waiting");
  });
});

describe("coveringCampaign with the party's campaigns (#6949 slice 6)", () => {
  const party: CoveringCandidate = {
    ...AI,
    id: "ev-pumps",
    title: "EV pumps",
    cast: [{ role: "names", symbols: ["RIVN"], source: "member form" }],
    scope: "k9~ev-pumps",
    party: true,
  };

  it("points a bare ask about a party campaign's name at that campaign", () => {
    const out = queueAsk(
      [],
      { kind: "name", subject: "RIVN", by: "k1" },
      [...CAMPAIGNS, party],
      () => false,
    );
    expect(out).toMatchObject({
      status: "covered",
      campaign: "ev-pumps",
      party: { title: "EV pumps" },
    });
  });

  it("keeps a question inside the campaign that holds the name, even when another holds it too", () => {
    // NVDA is in ai-buildout's cast; a party campaign holding NVDA keeps a question asked in it.
    const holder = {
      ...party,
      cast: [{ role: "names", symbols: ["NVDA"], source: "member form" }],
    };
    const out = queueAsk(
      [],
      { kind: "name", subject: "NVDA", by: "k1", campaign: "k9~ev-pumps" },
      [...CAMPAIGNS, holder],
      () => false,
    );
    expect(out.status).toBe("queued");
    // A name the asked-in campaign lacks still points at the one that holds it.
    const away = queueAsk(
      [],
      { kind: "name", subject: "AMD", by: "k1", campaign: "k9~ev-pumps" },
      [...CAMPAIGNS, holder],
      () => false,
    );
    expect(away).toMatchObject({ status: "covered", campaign: "ai-buildout" });
  });
});
