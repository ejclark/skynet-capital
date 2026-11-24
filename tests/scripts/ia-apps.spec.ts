import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "@rstest/core";
import { parseConcepts, sectionOf, tableRows } from "../../scripts/crawl/cohesion-plan.mjs";

// The phone-of-apps IA (docs/IA.md §8.4, #8247): one app per concept. §2f's App cell names exactly
// one home for every concept, and §8.4's route table names every route file exactly once — so a
// later move that adds a concept or a route without placing it fails here, not in review.

const APPS = [
  "Game Master",
  "Desk",
  "Journal",
  "Cast",
  "Scoreboard",
  "Garage",
  "Film Room",
  "Home",
  "Settings",
  "before sign-in",
  "retired",
];

/** The one app a §2f App cell names, or why it names none: zero, two, or a name off the list. */
function appOf(cell: string): { app: string } | { error: string } {
  const named = cell
    .split(/\s*(?:·|,|\/|\band\b)\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (named.length === 0) return { error: "names no app" };
  if (named.length > 1) return { error: `names ${named.length} apps: ${named.join(", ")}` };
  const app = named[0] ?? "";
  return APPS.includes(app) ? { app } : { error: `"${app}" is not an app` };
}

const ia = readFileSync("docs/IA.md", "utf8");
const twoF = sectionOf(ia, "### 2f.");
const header = twoF.split("\n").find((l) => l.startsWith("| Concept |")) ?? "";
const columns = header
  .replace(/^\||\|$/g, "")
  .split("|")
  .map((c) => c.trim());

describe("the App cell's rule", () => {
  it("takes one app from the list", () => {
    expect(appOf(" Desk ")).toEqual({ app: "Desk" });
    expect(appOf("before sign-in")).toEqual({ app: "before sign-in" });
  });

  it("refuses no app, two apps, and a name off the list", () => {
    expect(appOf("")).toEqual({ error: "names no app" });
    expect(appOf("Desk · Scoreboard")).toMatchObject({ error: expect.stringContaining("2 apps") });
    expect(appOf("Desk and Garage")).toMatchObject({ error: expect.stringContaining("2 apps") });
    expect(appOf("R&D")).toEqual({ error: '"R&D" is not an app' });
  });
});

describe("docs/IA.md §2f: every concept has one app", () => {
  it("places the App column just before Held on, so the census still reads the last cell", () => {
    expect(columns.at(-1)).toBe("Held on");
    expect(columns.at(-2)).toMatch(/^App\b/);
  });

  it("names exactly one listed app on every row", () => {
    const at = columns.length - 2;
    const rows = tableRows(twoF);
    expect(rows.length).toBeGreaterThan(0);
    const wrong = rows
      .map((cells) => ({ concept: cells[0], got: appOf(cells[at] ?? "") }))
      .filter((r) => "error" in r.got);
    expect(wrong).toEqual([]);
  });

  it("still parses for the cohesion census, every concept with its screens", () => {
    const concepts = parseConcepts(ia);
    expect(concepts.length).toBe(tableRows(twoF).length);
    expect(concepts.filter((c) => c.screens.length === 0).map((c) => c.id)).toEqual([]);
  });
});

describe("docs/IA.md §8.4: every route file is mapped once", () => {
  const routeTable = tableRows(
    sectionOf(ia, "### 8.4")
      .split("\n")
      .reduce<{ on: boolean; out: string[] }>(
        (acc, l) => {
          if (l.startsWith("| Today | File | App | Moves at |")) acc.on = true;
          else if (acc.on && !l.startsWith("|")) acc.on = false;
          if (acc.on) acc.out.push(l);
          return acc;
        },
        { on: false, out: [] },
      )
      .out.join("\n"),
  );

  it("names each route file, shell part and server page in exactly one row, with an app", () => {
    const expected = [
      ...readdirSync("app/src/routes").filter((f) => f.endsWith(".tsx") && f !== "__root.tsx"),
      "shell dock",
      "shell home tower",
      "shell status line",
      "server /login",
      "server /welcome",
      "server /tower",
      "server /research/<slug>",
    ].sort();
    const named = routeTable.flatMap((cells) =>
      [...(cells[1] ?? "").matchAll(/`([^`]+)`/g)].map((m) => m[1]),
    );
    expect([...named].sort()).toEqual(expected);
    expect(routeTable.filter((cells) => !cells[2]).map((cells) => cells[0])).toEqual([]);
  });
});
