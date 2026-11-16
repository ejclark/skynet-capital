import { LABELS, PRIORITY_LABELS } from "../../../scripts/moneypenny/labels.mjs";
import { applyPriorityLabels, labelPatches } from "../../../scripts/moneypenny/priority-labels.mjs";
import { PRIORITY_OPTIONS } from "../../../scripts/moneypenny/projects.mjs";

// THE P LABELS CARRY THE LANE MEANINGS (#6871 §4, PR-A). They are unmanaged, so a one-time PATCH
// moves the repo's four labels onto the registry's text; a second run finds nothing to do.

const OLD = PRIORITY_LABELS.map((name) => ({ name, description: `old ${name}` }));

describe("the P labels", () => {
  it("are the board's Priority options, name for name", () => {
    expect(PRIORITY_LABELS).toEqual(PRIORITY_OPTIONS);
  });

  it("each description fits GitHub's 100-character cap and names a lane", () => {
    for (const name of PRIORITY_LABELS) {
      const { description } = Object.values(LABELS).find((l) => l.name === name) as {
        description: string;
      };
      expect(description.length, name).toBeLessThanOrEqual(100);
      expect(description.length, name).toBeGreaterThan(0);
    }
    expect(LABELS.p0?.description).toMatch(/^Fix first/);
  });
});

describe("applyPriorityLabels: a one-time PATCH", () => {
  it("patches the four labels whose text differs, and only those", () => {
    expect(labelPatches(OLD).map((p) => p.name)).toEqual(["P0", "P1", "P2", "P3"]);
    const live = OLD.map((l) => ({
      ...l,
      description: Object.values(LABELS).find((r) => r.name === l.name)?.description,
    }));
    live[1] = { name: "P1", description: "stale" };
    expect(labelPatches(live).map((p) => p.name)).toEqual(["P1"]);
  });

  it("writes through the injected patch, and a second run has nothing to write", () => {
    const state = new Map(OLD.map((l) => [l.name, l.description]));
    const run = () =>
      applyPriorityLabels({
        read: (name) => ({ name, description: state.get(name) }),
        patch: ({ name, description }) => state.set(name, description),
        log: () => undefined,
      });
    expect(run()).toHaveLength(4);
    expect(run()).toHaveLength(0);
  });

  it("a dry run reads and prints but writes nothing", () => {
    const patched: string[] = [];
    const lines: string[] = [];
    applyPriorityLabels({
      dryRun: true,
      read: (name) => ({ name, description: "old" }),
      patch: ({ name }) => patched.push(name),
      log: (l) => lines.push(l),
    });
    expect(patched).toEqual([]);
    expect(lines).toHaveLength(4);
  });
});
