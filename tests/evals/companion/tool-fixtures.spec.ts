import { runCompanionTool } from "../../../src/companion/companion-tools.js";
import { COMPANION_FIXTURES } from "../../../src/evals/companion/fixtures.js";
import { COMPANION_TOOL_FIXTURES } from "../../../src/evals/companion/tool-fixtures.js";
import { FIXTURE_PARTICIPANT_ID, stubDesk } from "../../../src/evals/companion/tool-use.js";

/**
 * The tool-use fixtures (#7286 slice 5) are kept in their own list so the main suite's pinned count
 * and categories stay as they are. These specs pin what makes a tool-use fixture worth running:
 * every tool it requires has a stubbed read that answers, so a fail means she did not look, never
 * that the harness had nothing to give her.
 */
const byId = (id: string) => {
  const found = COMPANION_TOOL_FIXTURES.find((f) => f.id === id);
  if (!found) throw new Error(`fixture ${id} is missing`);
  return found;
};

/** A valid input for each read a fixture may require. */
const SAMPLE_INPUT: Record<string, unknown> = {
  get_work_status: { issues: [1204] },
  get_roadmap: {},
  get_my_positions: {},
  get_sized_suggestions: { underlying: "NVDA" },
};

describe("COMPANION_TOOL_FIXTURES", () => {
  describe("when read as a suite", () => {
    it("holds six fixtures, each declaring tool use", () => {
      expect(COMPANION_TOOL_FIXTURES).toHaveLength(6);
      for (const f of COMPANION_TOOL_FIXTURES) expect(f.toolUse).toBeDefined();
    });

    it("gives every fixture an id unique across both lists, prefixed with its category", () => {
      const ids = [...COMPANION_FIXTURES, ...COMPANION_TOOL_FIXTURES].map((f) => f.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const f of COMPANION_TOOL_FIXTURES) expect(f.id.startsWith(`${f.category}-`)).toBe(true);
    });

    it("builds every context through the real member-context shape on the frozen clock", () => {
      for (const f of COMPANION_TOOL_FIXTURES) {
        expect(f.context).toContain("MEMBER CONTEXT");
        expect(f.context).toContain("Jordan");
        expect(f.context).toContain("Now: Thursday, September 10");
      }
    });
  });

  describe("when a fixture requires a tool", () => {
    it("stubs a read for it that answers through the real dispatcher", async () => {
      for (const f of COMPANION_TOOL_FIXTURES) {
        const desk = stubDesk(f.toolUse?.desk ?? {});
        for (const name of f.toolUse?.expect.called ?? []) {
          const result = await runCompanionTool(
            name,
            desk,
            FIXTURE_PARTICIPANT_ID,
            SAMPLE_INPUT[name],
          );
          expect({ id: f.id, name, ok: result.ok }).toEqual({ id: f.id, name, ok: true });
        }
      }
    });

    it("looks a filing up before saying where it stands", () => {
      const { toolUse, context } = byId("grounding-tool-filing-status");
      expect(toolUse?.expect.called).toEqual(["get_work_status"]);
      expect(context).toContain("#1204");
    });

    it("answers the filing lookup through the real reader: open, waiting to be picked, unknown numbers not found", async () => {
      const read = byId("grounding-tool-filing-status").toolUse?.desk.readWorkStatus;
      if (!read) throw new Error("the filing fixture stubs no work-status read");
      const [filing, other] = await read([1204, 9999]);
      expect(filing).toMatchObject({
        number: 1204,
        found: true,
        kind: "issue",
        state: "open",
        status: "Filed — waiting to be picked",
        title: '"Trade ticket shows stale price after a fill"',
        labels: ["feedback", "bug"],
        openPullRequests: [],
      });
      expect(other).toEqual({ number: 9999, found: false });
    });

    it("reads the roadmap before naming what is next", () => {
      expect(byId("grounding-tool-roadmap-next").toolUse?.expect.called).toEqual(["get_roadmap"]);
    });
  });

  describe("when the member asks for something that is a write", () => {
    it("forbids every draft card on an order request, and requires no tool", () => {
      const { toolUse, rubric } = byId("pushback-tool-sell-request");
      expect(toolUse?.expect.noDrafts).toBe(true);
      expect(toolUse?.expect.called ?? []).toEqual([]);
      expect(rubric).toMatch(/can't place orders/i);
    });

    it("forbids a draft on both lookups too: neither ask needs a card", () => {
      for (const id of ["grounding-tool-filing-status", "grounding-tool-roadmap-next"]) {
        expect(byId(id).toolUse?.expect.noDrafts).toBe(true);
      }
    });
  });
});
