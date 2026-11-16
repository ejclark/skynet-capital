import type {
  CompanionFixture,
  CompanionFixtureCategory,
} from "../../../src/evals/companion/fixture.js";
import { COMPANION_FIXTURES } from "../../../src/evals/companion/fixtures.js";

/**
 * The replay fixtures are the eval's ground truth — if one is malformed (a duplicate id, an empty
 * rubric, a context that drifted from the real prompt shape) the eval silently judges nothing.
 * These specs pin the shape the runner and judge depend on, not the prose of any one rubric.
 */
const byId = (id: string): CompanionFixture => {
  const found = COMPANION_FIXTURES.find((f) => f.id === id);
  if (!found) throw new Error(`fixture ${id} is missing`);
  return found;
};

const countIn = (category: CompanionFixtureCategory) =>
  COMPANION_FIXTURES.filter((f) => f.category === category).length;

describe("COMPANION_FIXTURES", () => {
  describe("when read as a suite", () => {
    it("holds the twenty-one scripted conversations", () => {
      expect(COMPANION_FIXTURES).toHaveLength(21);
    });

    it("gives every fixture a unique id", () => {
      const ids = COMPANION_FIXTURES.map((f) => f.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("spreads them across grounding, pushback, unknown, size, filing, assess, research, delegate and evolve", () => {
      expect({
        grounding: countIn("grounding"),
        pushback: countIn("pushback"),
        unknown: countIn("unknown"),
        size: countIn("size"),
        filing: countIn("filing"),
        assess: countIn("assess"),
        research: countIn("research"),
        delegate: countIn("delegate"),
        evolve: countIn("evolve"),
      }).toEqual({
        grounding: 7,
        pushback: 3,
        unknown: 3,
        size: 2,
        filing: 2,
        assess: 1,
        research: 1,
        delegate: 1,
        evolve: 1,
      });
    });

    it("prefixes each id with its own category so a report line names what failed", () => {
      for (const f of COMPANION_FIXTURES) {
        expect(f.id.startsWith(`${f.category}-`)).toBe(true);
      }
    });
  });

  describe("when a fixture is handed to the runner and judge", () => {
    it("scripts at least one non-blank member message per fixture", () => {
      for (const f of COMPANION_FIXTURES) {
        expect(f.rounds.length).toBeGreaterThan(0);
        for (const round of f.rounds) expect(round.trim()).not.toBe("");
      }
    });

    it("gives the judge a non-blank description and rubric for every fixture", () => {
      for (const f of COMPANION_FIXTURES) {
        expect(f.description.trim()).not.toBe("");
        expect(f.rubric.trim()).not.toBe("");
      }
    });

    it("builds every context through the real member-context shape", () => {
      for (const f of COMPANION_FIXTURES) {
        expect(f.context).toContain("MEMBER CONTEXT");
        expect(f.context).toContain("Jordan");
      }
    });

    it("freezes the clock so the 'Now:' line is identical across runs", () => {
      for (const f of COMPANION_FIXTURES) {
        expect(f.context).toContain("Now: Thursday, September 10");
        expect(f.context).toContain("2026-09-10 19:00 UTC");
      }
    });
  });

  describe("when the member has a connected, mid-ladder account", () => {
    it("states the account is connected with its real equity and buying power", () => {
      const { context } = byId("grounding-connected-account");
      expect(context).toContain("is connected");
      expect(context).toContain("equity $1012340.50");
      expect(context).toContain("buying power $940210.00");
    });

    it("states two of six rungs earned and the next rung up", () => {
      const { context } = byId("grounding-trade-count");
      expect(context).toContain("ladder rungs earned 2 of 6");
      expect(context).toContain("next up 201 Sell a cash-secured put");
    });
  });

  describe("when a fixture asks about a held position (#7167)", () => {
    it("hands her each row's address, built by the real holding line", () => {
      const { context } = byId("grounding-position-row-link");
      expect(context).toContain("its row /accounts#pos-NVDA;");
      expect(context).toContain("its row /accounts#pos-NVDA261218P00100000");
      expect(context).toContain("the trade ticket for NVDA");
    });
  });

  describe("when a fixture asks from the landing page (#7167)", () => {
    it("hands her each row's link, built by the real on-screen line", () => {
      const { context } = byId("grounding-landing-row-link");
      expect(context).toContain("Page: they sent this from the landing page");
      expect(context).toContain("On screen: the edition of the 2026-09-09 close.");
      expect(context).toContain("→ /#story-ai-capex");
      expect(context).toContain("→ /#event-2026-09-16-fomc-decision");
    });
  });

  describe("when a fixture carries filings", () => {
    it("names the filed feedback in the two-round milestone case", () => {
      const { context } = byId("pushback-two-round-milestone");
      expect(context).toContain("They have filed feedback 6 times");
      expect(context).toContain("#1204");
    });

    it("tells the model nothing has been filed when the list is empty", () => {
      const { context } = byId("grounding-market-hours");
      expect(context).toContain("They have filed no feedback yet");
    });

    it("shares the same six filings between the incident and its two-round variant", () => {
      const incident = byId("grounding-milestone-done").context;
      const twoRound = byId("pushback-two-round-milestone").context;
      expect(twoRound).toBe(incident);
    });
  });

  describe("when the incident is replayed", () => {
    it("pushes the false premise across three member messages in the two-round pushback fixture", () => {
      const { rounds } = byId("pushback-two-round-milestone");
      expect(rounds).toHaveLength(3);
      expect(rounds[0]).toBe(byId("grounding-milestone-done").rounds[0]);
    });

    it("asks the judge to grade the final round only", () => {
      expect(byId("pushback-two-round-milestone").rubric).toMatch(/round-3/);
    });

    it("keeps the single-push balance fixture at two rounds", () => {
      expect(byId("pushback-single-round-balance").rounds).toHaveLength(2);
    });
  });

  describe("when the market is open", () => {
    it("tells every fixture the regular session is open, so the market-hours claim is checkable", () => {
      for (const f of COMPANION_FIXTURES) {
        expect(f.context).toContain("the regular session is OPEN right now");
      }
    });
  });

  describe("when the member has not placed a first trade", () => {
    it("shows the how-to fixture zero rungs earned, unlike the rest of the suite", () => {
      const { context } = byId("size-howto-question");
      expect(context).toContain("ladder rungs earned 0 of 6");
      const others = COMPANION_FIXTURES.filter((f) => f.id !== "size-howto-question");
      for (const f of others) expect(f.context).toContain("ladder rungs earned 2 of 6");
    });
  });

  describe("when a fixture covers the filing category", () => {
    it("pairs a concrete bug report with a vague one that must draw a clarifying question", () => {
      const concrete = byId("filing-agent-actionable");
      const vague = byId("filing-clarify-when-vague");
      expect(concrete.rounds[0]?.length).toBeGreaterThan(vague.rounds[0]?.length ?? 0);
      expect(vague.rubric).toMatch(/clarifying question/);
    });
  });

  describe("when a fixture covers one of her four jobs (the Moneypenny operator plan)", () => {
    const jobs = [
      "assess-size-up-my-situation",
      "research-open-question-offers-handoff",
      "delegate-build-request-brief",
      "evolve-outgrown-goal-proposal",
    ];

    it("scripts one single-message fixture per job", () => {
      for (const id of jobs) expect(byId(id).rounds).toHaveLength(1);
    });

    it("never requires a tool call, since the eval runs with no tools", () => {
      for (const id of jobs) expect(byId(id).rubric).not.toMatch(/must call/i);
    });

    it("fails a reply that claims a hand-off already happened", () => {
      for (const id of jobs.slice(1)) expect(byId(id).rubric).toMatch(/Fails if it claims/);
    });

    it("asks a change proposal for the four labelled lines", () => {
      const { rubric } = byId("evolve-outgrown-goal-proposal");
      expect(rubric).toContain("the outcome members are after");
      expect(rubric).toContain("what the app does today");
      expect(rubric).toContain("the proposed change");
      expect(rubric).toContain("how we would know it worked");
    });

    it("forbids a recommendation when she sizes up where a member stands", () => {
      expect(byId("assess-size-up-my-situation").rubric).toMatch(/no recommendation/i);
    });
  });

  describe("when the question is a real-world fact she does not hold", () => {
    it("still forbids a rate stated as fact, and accepts only an offer to hand it on", () => {
      const { rubric } = byId("unknown-outside-app-fact");
      expect(rubric).toMatch(/must not state a specific rate as fact/i);
      expect(rubric).toContain("offer to hand the question on as a draft");
      expect(rubric).toContain("must not claim anything was asked or queued");
    });
  });
});
