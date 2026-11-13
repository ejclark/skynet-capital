import { describe, expect, it } from "@rstest/core";
import { LABELS, PRIORITY_LABELS } from "../../../scripts/moneypenny/labels.mjs";
import {
  priorityFieldOptions,
  priorityFieldUpdate,
} from "../../../scripts/moneypenny/projects.mjs";
import { ensurePriorityDescriptions } from "../../../scripts/moneypenny/projects-reconcile.mjs";
import { createBoardContext } from "../../../scripts/moneypenny/projects-sync.mjs";

// #6871 §12b — EARS: EACH P label description SHALL be at most 100 characters and equal its Priority
// option description. WHEN a Priority option's description differs, THE sweep SHALL rewrite the list
// in place with every id kept, so no card changes lane; a refused write SHALL NOT fail the sweep.

const byName = (name: string) => Object.values(LABELS).find((l) => l.name === name);
const live = (descriptions: Record<string, string>) =>
  ["P0", "P1", "P2", "P3"].map((name, i) => ({
    id: `O${i}`,
    name,
    color: "RED",
    description: descriptions[name] ?? "",
  }));
const current = live(
  Object.fromEntries(priorityFieldOptions().map((o) => [o.name, o.description])),
);

describe("priorityFieldOptions: the board's lane text is the labels' text", () => {
  it("equals each P label's description, within GitHub's 100-character cap", () => {
    const options = priorityFieldOptions();
    expect(options.map((o) => o.name)).toEqual(PRIORITY_LABELS);
    for (const o of options) {
      expect(o.description).toBe(byName(o.name)?.description);
      expect(o.description.length).toBeGreaterThan(0);
      expect(o.description.length).toBeLessThanOrEqual(100);
    }
  });
});

describe("priorityFieldUpdate: restyle in place, never strip a card's lane", () => {
  it("is null when every option already reads right", () => {
    expect(priorityFieldUpdate(current)).toBeNull();
  });

  it("rewrites a stale description with every id and colour kept", () => {
    const stale = current.map((o) => (o.name === "P1" ? { ...o, description: "old" } : o));
    const out = priorityFieldUpdate(stale);
    expect(out?.map((o) => o.id)).toEqual(["O0", "O1", "O2", "O3"]);
    expect(out?.find((o) => o.name === "P1")?.description).toBe(byName("P1")?.description);
    expect(out?.every((o) => o.color === "RED")).toBe(true);
  });

  it("keeps an option nobody names (a hand-made lane) instead of removing it", () => {
    const withExtra = [
      ...current.map((o) => ({ ...o, description: "old" })),
      { id: "OX", name: "P9", color: "BLUE", description: "mine" },
    ];
    const out = priorityFieldUpdate(withExtra);
    expect(out?.at(-1)).toEqual({ id: "OX", name: "P9", color: "BLUE", description: "mine" });
  });

  it("adds a missing option with no id", () => {
    const out = priorityFieldUpdate(current.slice(0, 3));
    expect(out?.find((o) => o.name === "P3")).toEqual({
      name: "P3",
      color: "GRAY",
      description: byName("P3")?.description,
    });
  });
});

describe("ensurePriorityDescriptions: fail-open, in place", () => {
  const boardWith = (options: unknown[] | null) =>
    createBoardContext({
      readItems: () => ({ items: [], totalCount: 0 }),
      readFields: () => (options ? [{ id: "F_pri", name: "Priority", options }] : []) as never,
      readProject: () => ({ id: "PVT_1", number: 2 }),
    });

  it("writes nothing when the lanes already read right, or the field is missing", () => {
    const fail = () => {
      throw new Error("no write");
    };
    ensurePriorityDescriptions({ board: boardWith(current), write: fail, log: () => undefined });
    ensurePriorityDescriptions({ board: boardWith(null), write: fail, log: () => undefined });
  });

  it("writes the drifted list to the field, and only says it would on a dry run", () => {
    const stale = current.map((o) => ({ ...o, description: "old" }));
    const writes: [string, unknown][] = [];
    const lines: string[] = [];
    ensurePriorityDescriptions({
      board: boardWith(stale),
      write: (id: string, o: unknown) => writes.push([id, o]),
      dryRun: true,
      log: (l: string) => lines.push(l),
    });
    expect(writes).toEqual([]);
    expect(lines.join("\n")).toContain("would rewrite");
    ensurePriorityDescriptions({
      board: boardWith(stale),
      write: (id: string, o: unknown) => writes.push([id, o]),
      log: () => undefined,
    });
    expect(writes).toHaveLength(1);
    expect(writes[0]?.[0]).toBe("F_pri");
  });

  it("logs a warning and goes on when GitHub refuses the write", () => {
    const lines: string[] = [];
    ensurePriorityDescriptions({
      board: boardWith(current.map((o) => ({ ...o, description: "old" }))),
      write: () => {
        throw new Error("Resource not accessible");
      },
      log: (l: string) => lines.push(l),
    });
    expect(lines.join("\n")).toContain("::warning title=Priority descriptions not written");
  });

  it("rethrows an exhausted quota, as everywhere in the sweep", () => {
    expect(() =>
      ensurePriorityDescriptions({
        board: boardWith(current.map((o) => ({ ...o, description: "old" }))),
        write: () => {
          throw new Error("GraphQL: API rate limit exceeded");
        },
        log: () => undefined,
      }),
    ).toThrow();
  });
});
