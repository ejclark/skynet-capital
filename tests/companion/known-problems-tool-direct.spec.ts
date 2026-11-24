/**
 * The known-problems tool's own two halves, called directly (#8005 slice 7): the ledger answer
 * Moneypenny reads before she drafts, and the check on the row and plan a draft says it matches.
 * `known-problems-tool.spec.ts` drives the same code through `runCompanionTool` and the routing
 * rule; this spec pins the module's edges by itself: how each ledger state is worded, what a
 * missing evidence count means, and every way a named row or plan can fail to check out.
 *
 * EARS lines this spec pins:
 *   - WHEN the evidence cannot be read, the answer SHALL say counted: false and carry no counts.
 *   - A row that waits SHALL read "no plan yet" only when no plan owns it.
 *   - WHEN a row or plan named by a draft does not check out, it SHALL be left off with the
 *     reason, and what did check out SHALL stand.
 *   - A plan alone SHALL stand only when the roadmap lists it, and never when the roadmap cannot
 *     be read.
 */
import {
  checkDraftMatch,
  KNOWN_PROBLEMS_NOTE,
  KNOWN_PROBLEMS_TOOL_DEF,
  KNOWN_PROBLEMS_TOOL_NAME,
  knownProblemsResult,
} from "../../src/companion/known-problems-tool.js";
import { KNOWN_PROBLEMS } from "../../src/domain/known-problems.js";
import type { ReadRoadmap, Roadmap } from "../../src/server/roadmap.js";

type Row = Record<string, unknown> & { row: string };

async function problems(
  readEvidence?: Parameters<typeof knownProblemsResult>[0],
): Promise<{ rows: Row[]; counted: unknown; note: unknown }> {
  const out = await knownProblemsResult(readEvidence);
  if (!out.ok) throw new Error(out.error);
  const r = out.result as { problems: Row[]; counted: unknown; note: unknown };
  return { rows: r.problems, counted: r.counted, note: r.note };
}

const item = (number: number, title: string) => ({
  number,
  title,
  horizon: "Next" as const,
  status: "Up next",
  labels: [],
  url: "",
});

function roadmapOf(...groups: { number: number; title: string }[][]): ReadRoadmap {
  const roadmap: Roadmap = {
    available: true,
    note: "",
    openPlans: groups.flat().length,
    groups: groups.map((g) => ({
      horizon: "Next" as const,
      meaning: "",
      total: g.length,
      items: g.map((i) => item(i.number, i.title)),
    })),
  };
  return () => Promise.resolve(roadmap);
}

const waitingWithPlan = KNOWN_PROBLEMS.find((r) => r.state === "waiting" && r.plans.length > 0);
const waitingBare = KNOWN_PROBLEMS.find((r) => r.state === "waiting" && r.plans.length === 0);
const planFiled = KNOWN_PROBLEMS.find((r) => r.state === "plan filed" && r.plans.length === 1);
const fixed = KNOWN_PROBLEMS.find((r) => r.state === "fixed");

describe("the tool's definition", () => {
  it("is named get_known_problems and takes no input", () => {
    expect(KNOWN_PROBLEMS_TOOL_NAME).toBe("get_known_problems");
    expect(KNOWN_PROBLEMS_TOOL_DEF.name).toBe(KNOWN_PROBLEMS_TOOL_NAME);
    expect(KNOWN_PROBLEMS_TOOL_DEF.input_schema).toEqual({ type: "object", properties: {} });
  });

  it("tells her to say the match in plain words, never a code, and never promise a fix", () => {
    expect(KNOWN_PROBLEMS_NOTE).toContain("Never say the row code to the member");
    expect(KNOWN_PROBLEMS_NOTE).toContain("never a promise of a fix or a date");
  });
});

describe("when she asks for the known problems", () => {
  it("answers with one entry per ledger row, carrying the note", async () => {
    const { rows, note } = await problems();
    expect(rows.map((r) => r.row)).toEqual(KNOWN_PROBLEMS.map((r) => r.id));
    expect(note).toBe(KNOWN_PROBLEMS_NOTE);
  });

  it("gives each row its title, its screens by name and how many screens cite it", async () => {
    const { rows } = await problems();
    for (const source of KNOWN_PROBLEMS) {
      const entry = rows.find((r) => r.row === source.id);
      expect(entry).toMatchObject({
        problem: source.problem,
        whatItIs: source.detail,
        screens: source.screens.map((s) => s.name),
        screensCited: source.screensCited,
        plans: source.plans,
        state: source.state,
      });
    }
  });

  describe("and the evidence reads fine", () => {
    it("counts members and filings on the rows that have some, and only those", async () => {
      const first = KNOWN_PROBLEMS[0];
      if (!first) throw new Error("the ledger holds no rows");
      const { rows, counted } = await problems(() =>
        Promise.resolve(new Map([[first.id, { members: 4, filings: 9 }]])),
      );
      expect(counted).toBe(true);
      expect(rows.find((r) => r.row === first.id)).toMatchObject({ askedBy: 4, filings: 9 });
      for (const r of rows.filter((x) => x.row !== first.id)) {
        expect(r).not.toHaveProperty("askedBy");
        expect(r).not.toHaveProperty("filings");
      }
    });

    it("counts an empty evidence map as read, with nobody having asked yet", async () => {
      const { rows, counted } = await problems(() => Promise.resolve(new Map()));
      expect(counted).toBe(true);
      expect(rows.some((r) => "askedBy" in r)).toBe(false);
    });
  });

  describe("and the evidence cannot be read", () => {
    it("says not counted, and carries no counts, when the read rejects", async () => {
      const { rows, counted } = await problems(() => Promise.reject(new Error("volume down")));
      expect(counted).toBe(false);
      expect(rows.some((r) => "askedBy" in r || "filings" in r)).toBe(false);
    });

    it("says not counted when no reader was wired at all", async () => {
      expect((await problems(undefined)).counted).toBe(false);
    });
  });

  describe("and a row's state is worded for the member", () => {
    it("says a fixed row is fixed and the member can try it on the screens listed", async () => {
      if (!fixed) return;
      const { rows } = await problems();
      expect(rows.find((r) => r.row === fixed.id)?.stateWords).toBe(
        "fixed: say so, and that the member can try it on the screens listed",
      );
    });

    it("says a row with a plan filed has a plan filed", async () => {
      if (!planFiled) return;
      const { rows } = await problems();
      expect(rows.find((r) => r.row === planFiled.id)?.stateWords).toBe(
        "a plan to fix it is filed",
      );
    });

    it("says a waiting row with no owner plan has no plan to fix it yet", async () => {
      if (!waitingBare) return;
      const { rows } = await problems();
      expect(rows.find((r) => r.row === waitingBare.id)?.stateWords).toBe(
        "recorded; no plan to fix it yet",
      );
    });

    it("does not say there is no plan on a waiting row that owner plans own", async () => {
      if (!waitingWithPlan) return;
      const { rows } = await problems();
      const words = rows.find((r) => r.row === waitingWithPlan.id)?.stateWords;
      expect(words).toBe("recorded; the plans listed own it");
      expect(words).not.toContain("no plan");
    });
  });
});

describe("when a draft names nothing", () => {
  it("has no match and drops nothing for an empty input", async () => {
    expect(await checkDraftMatch({}, undefined)).toEqual({});
  });

  it("has no match and drops nothing when the input is missing or not an object", async () => {
    expect(await checkDraftMatch(undefined, undefined)).toEqual({});
    expect(await checkDraftMatch(null, undefined)).toEqual({});
  });

  it("treats a blank or non-text known_problem as nothing named", async () => {
    expect(await checkDraftMatch({ known_problem: "   " }, undefined)).toEqual({});
    expect(await checkDraftMatch({ known_problem: 42 }, undefined)).toEqual({});
  });

  it("treats a null plan as nothing named", async () => {
    expect(await checkDraftMatch({ plan: null }, undefined)).toEqual({});
  });
});

describe("when a draft names a known problem", () => {
  const row = planFiled ?? KNOWN_PROBLEMS[0];
  if (!row) throw new Error("the ledger holds no rows");
  const ownPlan = row.plans[0];

  it("matches the row however the member's words cased or padded it", async () => {
    const checked = await checkDraftMatch(
      { known_problem: `  ${row.id.toLowerCase()} ` },
      undefined,
    );
    expect(checked.match?.row).toBe(row.id);
    expect(checked.dropped).toBeUndefined();
  });

  it("says the problem's title in the words, never the row code", async () => {
    const checked = await checkDraftMatch({ known_problem: row.id }, undefined);
    expect(checked.match?.words).toContain(`a known problem: ${row.problem}`);
    expect(checked.match?.words).not.toContain(row.id);
  });

  it("carries the row's one plan into the words when it has exactly one", async () => {
    if (row.plans.length !== 1) return;
    const checked = await checkDraftMatch({ known_problem: row.id }, undefined);
    expect(checked.match?.words).toBe(`a known problem: ${row.problem} · plan #${ownPlan}`);
  });

  it("keeps the row's own plan when the draft names it, as a number or as #N text", async () => {
    if (!ownPlan) return;
    for (const plan of [ownPlan, `#${ownPlan}`, String(ownPlan)]) {
      const checked = await checkDraftMatch({ known_problem: row.id, plan }, undefined);
      expect(checked.match).toMatchObject({ row: row.id, plan: ownPlan });
      expect(checked.dropped).toBeUndefined();
    }
  });

  it("leaves a plan the row does not list off, names why, and keeps the row", async () => {
    const checked = await checkDraftMatch({ known_problem: row.id, plan: 9999998 }, undefined);
    expect(checked.match?.row).toBe(row.id);
    expect(checked.match).not.toHaveProperty("plan");
    expect(checked.dropped).toBe(
      "#9999998 is not a plan that known problem lists: left off the draft",
    );
  });

  it("leaves a plan that is not an issue number off, and keeps the row", async () => {
    for (const plan of ["soon", 0, -3, 1.5, {}]) {
      const checked = await checkDraftMatch({ known_problem: row.id, plan }, undefined);
      expect(checked.match?.row).toBe(row.id);
      expect(checked.match).not.toHaveProperty("plan");
      expect(checked.dropped).toBe("plan must be an issue number: left off the draft");
    }
  });
});

describe("when a draft names a row the ledger does not hold", () => {
  it("drops it with the name she gave, and has no match", async () => {
    const checked = await checkDraftMatch({ known_problem: "U999" }, undefined);
    expect(checked.match).toBeUndefined();
    expect(checked.dropped).toBe("U999 is not a row get_known_problems lists: left off the draft");
  });

  it("still keeps a plan the roadmap lists, and says both things", async () => {
    const checked = await checkDraftMatch(
      { known_problem: "nope", plan: 7031 },
      roadmapOf([{ number: 7031, title: '"Quest rewards"' }]),
    );
    expect(checked.match).toEqual({ plan: 7031, words: 'an open plan: #7031 "Quest rewards"' });
    expect(checked.dropped).toBe("nope is not a row get_known_problems lists: left off the draft");
  });

  it("joins both reasons when the plan fails too", async () => {
    const checked = await checkDraftMatch({ known_problem: "nope", plan: "x" }, undefined);
    expect(checked.match).toBeUndefined();
    expect(checked.dropped).toBe(
      "nope is not a row get_known_problems lists; plan must be an issue number: left off the draft",
    );
  });
});

describe("when a draft names a plan alone", () => {
  it("keeps it, named by the roadmap's own quoted title", async () => {
    const checked = await checkDraftMatch(
      { plan: 7031 },
      roadmapOf([{ number: 7031, title: '"Quest rewards"' }]),
    );
    expect(checked).toEqual({
      match: { plan: 7031, words: 'an open plan: #7031 "Quest rewards"' },
    });
  });

  it("finds the plan in any horizon group, and accepts #N text", async () => {
    const checked = await checkDraftMatch(
      { plan: "#8000" },
      roadmapOf([{ number: 1, title: '"a"' }], [{ number: 8000, title: '"b"' }]),
    );
    expect(checked.match).toEqual({ plan: 8000, words: 'an open plan: #8000 "b"' });
  });

  it("drops a plan the roadmap does not list, and has no match", async () => {
    const checked = await checkDraftMatch({ plan: 4242 }, roadmapOf([{ number: 1, title: '"a"' }]));
    expect(checked).toEqual({
      dropped: "#4242 is not a plan get_roadmap lists: left off the draft",
    });
  });

  it("drops it when no roadmap reader was wired", async () => {
    const checked = await checkDraftMatch({ plan: 4242 }, undefined);
    expect(checked.dropped).toContain("#4242 is not a plan get_roadmap lists");
    expect(checked.match).toBeUndefined();
  });

  it("drops it when the roadmap is unavailable", async () => {
    const checked = await checkDraftMatch({ plan: 4242 }, () =>
      Promise.resolve({ available: false }),
    );
    expect(checked.dropped).toContain("#4242 is not a plan get_roadmap lists");
  });

  it("drops it, rather than failing the draft, when the roadmap read rejects", async () => {
    const checked = await checkDraftMatch({ plan: 4242 }, () => Promise.reject(new Error("rate")));
    expect(checked.match).toBeUndefined();
    expect(checked.dropped).toContain("#4242 is not a plan get_roadmap lists");
  });

  it("drops a plan that is not an issue number, even on a roadmap that lists plans", async () => {
    const checked = await checkDraftMatch(
      { plan: "soon" },
      roadmapOf([{ number: 1, title: '"a"' }]),
    );
    expect(checked).toEqual({ dropped: "plan must be an issue number: left off the draft" });
  });
});
