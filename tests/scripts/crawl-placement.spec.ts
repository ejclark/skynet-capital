import { describe, expect, it } from "@rstest/core";
import type { Name } from "../../scripts/crawl/cohesion-plan.mjs";
import {
  groupsOf,
  homesOfRoutes,
  newCollisions,
  placementRows,
  render,
  type Screen,
  SHELL,
  type Snapshot,
  UNPLACED,
} from "../../scripts/crawl/placement.mjs";

// The placement check's pure core (#8005 slice 2), driven over fixture snapshots — the shape
// cohesion.mjs's memberFacing() reads from a tree. Done when: WHEN a branch adds a member-facing
// route, section, nav label or dock entry, the check SHALL name the IA group it extends or flag it
// as homeless.

const screen = (key: string, home?: string, path: string | null = null): Screen => ({
  key,
  path,
  home,
  verdict: "keep",
});
const name = (raw: string, place: string, home?: string, source = "section label"): Name => ({
  word: raw.toLowerCase(),
  raw,
  place,
  level: "screen",
  home,
  source,
});

const BASE: Snapshot = {
  screens: [
    screen("/trade ?section=ticket", "workbench", "/trade"),
    screen("/leaderboard", "league", "/leaderboard"),
  ],
  names: [
    name("Ticket", "/trade ?section=ticket", "workbench"),
    { ...name("Leaderboard", "/leaderboard", "league", "Moneypenny's place name"), level: "page" },
  ],
};

const withAdded = (screens: Screen[], names: Name[]): Snapshot => ({
  screens: [...BASE.screens, ...screens],
  names: [...BASE.names, ...names],
});

describe("a new screen", () => {
  it("names the IA group its triage home extends, with the section's own label folded in", () => {
    const head = withAdded(
      [screen("/trade ?section=scanner", "workbench", "/trade")],
      [name("Scanner", "/trade ?section=scanner", "workbench")],
    );
    expect(placementRows(BASE, head)).toEqual([
      {
        kind: "screen",
        what: "/trade ?section=scanner",
        home: "workbench",
        status: "extends",
        words: ["Scanner"],
      },
    ]);
  });

  it("flags a screen whose triage row names no home as homeless", () => {
    const head = withAdded([screen("/trade ?section=notes", undefined, "/trade")], []);
    expect(placementRows(BASE, head)[0]?.status).toBe("homeless");
  });

  it("flags a screen with no triage row at all as unjudged", () => {
    const head = withAdded([{ key: "/lab", path: "/lab" }], []);
    expect(placementRows(BASE, head)[0]?.status).toBe("unjudged");
  });

  it("reads a signed-out page as outside the model, not homeless", () => {
    const head = withAdded([screen("server /invite", "pre-auth")], []);
    expect(placementRows(BASE, head)[0]?.status).toBe("pre-auth");
  });

  it("ignores a screen triage retires or redirects — nobody sees it", () => {
    const head = withAdded(
      [{ ...screen("/old", undefined, "/old"), verdict: "redirect-only" }],
      [],
    );
    expect(placementRows(BASE, head)).toEqual([]);
  });

  it("says nothing about a screen the base already had (standing debt never re-fires)", () => {
    const base = withAdded([screen("/saved-positions", undefined, "/saved-positions")], []);
    expect(placementRows(base, base)).toEqual([]);
  });
});

describe("a new name — a nav label, a door, a dock entry", () => {
  it("places a new word for an existing place in that place's group", () => {
    const head = withAdded([], [name("Scores", "/leaderboard", "league", "app/src/x.tsx:4")]);
    const rows = placementRows(BASE, head).filter((r) => r.kind === "name");
    expect(rows).toEqual([
      {
        kind: "name",
        what: "Scores",
        place: "/leaderboard",
        source: "app/src/x.tsx:4",
        home: "league",
        status: "extends",
      },
    ]);
  });

  it("flags a door to a place with no IA home", () => {
    const head = withAdded([], [name("Saved", "/saved-positions", undefined, "app/src/y.tsx:9")]);
    expect(placementRows(BASE, head)[0]?.status).toBe("homeless");
  });

  it("counts one word for one place once, however many doors carry it", () => {
    const door = name("Scores", "/leaderboard", "league", "app/src/a.tsx:1");
    const head = withAdded([], [door, { ...door, source: "app/src/b.tsx:2" }]);
    expect(placementRows(BASE, head).filter((r) => r.kind === "name")).toHaveLength(1);
  });

  it("does not re-judge a door the base already had that only moved lines", () => {
    const moved = { ...BASE.names[0], source: "app/src/moved.tsx:99" } as Name;
    expect(placementRows(BASE, { ...BASE, names: [moved, ...BASE.names.slice(1)] })).toEqual([]);
  });
});

describe("a new part", () => {
  const head = (s: Screen[] = []) => withAdded(s, []);

  it("names the groups of the nearest routes' screens", () => {
    const rows = placementRows(BASE, head(), {
      parts: [
        { file: "app/src/shell/scan.tsx", status: "placed", via: "trade.tsx", routes: ["/trade"] },
      ],
    });
    expect(rows[0]).toMatchObject({ kind: "part", status: "extends", homes: ["workbench"] });
  });

  it("names the shell for a part the root frame mounts", () => {
    expect(homesOfRoutes([SHELL], BASE.screens)).toEqual(["shell"]);
  });

  it("flags a part the census would count homeless", () => {
    const rows = placementRows(BASE, head(), {
      parts: [{ file: "app/src/shell/tag.tsx", status: "homeless" }],
    });
    expect(rows[0]?.status).toBe("homeless");
    expect(UNPLACED.has("homeless")).toBe(true);
  });

  it("flags a cited part whose routes' screens have no home", () => {
    const rows = placementRows(BASE, head([screen("/lab", undefined, "/lab")]), {
      parts: [{ file: "app/src/shell/lab.tsx", status: "placed", via: "x.tsx", routes: ["/lab"] }],
    });
    expect(rows.find((r) => r.kind === "part")?.status).toBe("unreached");
  });

  it("notes a part no route reaches without asking for a placement", () => {
    const rows = placementRows(BASE, head(), {
      parts: [{ file: "app/src/shell/orphan.tsx", status: "not mounted" }],
    });
    expect(rows[0]?.status).toBe("not mounted");
    expect(UNPLACED.has("not mounted")).toBe(false);
  });
});

describe("a new label collision (census row 1)", () => {
  it("flags a word that now names places in a second IA group", () => {
    const head = [...BASE.names, name("Ticket", "/leaderboard", "league")];
    expect(newCollisions(BASE.names, head)).toEqual([
      { kind: "collision", what: "ticket", homes: ["league", "workbench"], status: "collides" },
    ]);
  });

  it("flags a second word for one place", () => {
    const head = [
      ...BASE.names,
      { ...name("Standings", "/leaderboard", "league", "her place name"), level: "page" as const },
    ];
    expect(newCollisions(BASE.names, head)).toEqual([
      {
        kind: "collision",
        what: "/leaderboard",
        words: ["leaderboard", "standings"],
        status: "collides",
      },
    ]);
  });

  it("stays quiet on a collision the base already had", () => {
    const both = [...BASE.names, name("Ticket", "/leaderboard", "league")];
    expect(newCollisions(both, both)).toEqual([]);
  });
});

describe("the report", () => {
  const IA = [
    "### 5.3 The name on the workbench — the quote, the chart",
    "### 5.7 The league — everyone's standing",
  ].join("\n");

  it("reads §5's group names from their headings", () => {
    expect(groupsOf(IA).get("workbench")).toEqual({
      num: "5.3",
      name: "The name on the workbench",
    });
  });

  it("names the group beside each placed addition and marks the ones to place", () => {
    const rows = placementRows(
      BASE,
      withAdded(
        [
          screen("/trade ?section=scanner", "workbench", "/trade"),
          screen("/lab", undefined, "/lab"),
        ],
        [],
      ),
    );
    const out = render(rows, { groups: groupsOf(IA), base: "abc123", census: null });
    expect(out).toContain("2 member-facing addition(s) against abc123: 1 placed · 1 to place");
    expect(out).toContain("✓ screen    /trade ?section=scanner → The name on the workbench (§5.3)");
    expect(out).toContain("▲ screen    /lab → homeless");
    expect(out).toContain("place it:");
  });

  it("reports the census's homeless count against its budget — the ratchet", () => {
    const out = render([], { census: { now: 12, budget: 11 }, base: "abc123" });
    expect(out).toContain("▲ census    homeless features 12 (budget 11)");
  });

  it("says so plainly when the branch adds nothing a member sees", () => {
    expect(render([], { base: "abc123" })).toBe(
      "placement (#8005 slice 2): no member-facing additions against abc123",
    );
  });
});
