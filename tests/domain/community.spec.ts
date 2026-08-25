import { deriveContributions, type Filing, filingCount } from "../../src/domain/community.js";
import { ALL_COURSES, COURSES, FEEDBACK_MILESTONE_ID } from "../../src/domain/curriculum.js";

const filing = (over: Partial<Filing> = {}): Filing => ({
  issueNumber: 567,
  filedAt: "2026-08-25T14:00:00.000Z",
  ...over,
});

describe("deriveContributions — the community milestone comes from a FILED issue, never a checkbox", () => {
  it("earns nothing from an empty ledger", () => {
    expect(deriveContributions([])).toEqual([]);
  });

  it("earns the feedback milestone from one real filing, citing the issue number as evidence", () => {
    expect(deriveContributions([filing()])).toEqual([
      {
        milestoneId: FEEDBACK_MILESTONE_ID,
        issueNumber: 567,
        at: "2026-08-25T14:00:00.000Z",
      },
    ]);
  });

  it("ignores a filing GitHub never numbered — a submission that never landed proves nothing", () => {
    expect(deriveContributions([filing({ issueNumber: 0 })])).toEqual([]);
    expect(deriveContributions([filing({ issueNumber: -1 })])).toEqual([]);
    expect(deriveContributions([filing({ filedAt: "" })])).toEqual([]);
  });

  it("is idempotent, keeping the EARLIEST filing as the evidence", () => {
    const earned = deriveContributions([
      filing({ issueNumber: 900, filedAt: "2026-08-26T09:00:00.000Z" }),
      filing({ issueNumber: 100, filedAt: "2026-08-20T09:00:00.000Z" }),
    ]);
    expect(earned).toHaveLength(1);
    expect(earned[0]).toMatchObject({ issueNumber: 100, at: "2026-08-20T09:00:00.000Z" });
  });
});

describe("filingCount — the counter surfaced on /feedback reads the same ledger", () => {
  it("counts only filings that actually produced an issue", () => {
    expect(filingCount([])).toBe(0);
    expect(filingCount([filing(), filing({ issueNumber: 568 })])).toBe(2);
    expect(filingCount([filing(), filing({ issueNumber: 0 })])).toBe(1);
  });
});

describe("the community track sits BESIDE the trade ladder, never inside it", () => {
  it("is not one of the courses whose completion unlocks the next level", () => {
    expect(COURSES.map((c) => c.id)).not.toContain("community");
    expect(ALL_COURSES.map((c) => c.id)).toContain("community");
  });

  it("claims no trade-type code — nothing here can masquerade as a filled trade", () => {
    const community = ALL_COURSES.find((c) => c.id === "community");
    expect(community?.milestones.every((m) => m.tradeType === undefined)).toBe(true);
  });

  it("stacks by level, so the 100-level community card lands beside the 100-level trade course", () => {
    const levels = ALL_COURSES.map((c) => c.level);
    expect(levels).toEqual([...levels].sort((a, b) => a - b));
    expect(ALL_COURSES[1]?.id).toBe("community");
  });
});
