import {
  appendFileSync,
  copyFileSync,
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "@rstest/core";
import { gradeArgs, loadRound } from "../../scripts/study/grade.mjs";
import { gradeRound } from "../../scripts/study/grade-round.mjs";
import {
  groupByRoot,
  ledgerRows,
  parseRoot,
  readPlacings,
  rooterText,
  rootsProblems,
} from "../../scripts/study/ia-roots.mjs";
import { buildReadout, readoutArgs } from "../../scripts/study/readout.mjs";
import {
  ROOT_RANKING,
  severityRank,
  structuralSection,
} from "../../scripts/study/readout-core.mjs";
import { runRoot } from "../../scripts/study/root.mjs";

// A readout groups a round's structural problems by IA root (#8005): a row of docs/IA.md §10 or a
// new root an aware rooter names after grading, the top ten roots ranked and the rest folded, so
// the owner reads roots, never rows (scripts/study/ia-roots.mjs, root.mjs, readout.mjs).

const LEDGER = [
  "## 10. Upstream problems",
  "",
  "| # | Root, and where it sits | Screens | Why | Workaround | Status |",
  "|---|---|---|---|---|---|",
  "| U1 | **One history, three homes** — the feed and two lists (§5.1) | a, b | c | none | **ready for an overhaul plan** (3 screens) |",
  "| U2 | **Derived numbers on a log** — totals on feeds | a | c | none | waiting (1 screen) |",
  "",
  "## 11. Next",
  "| U9 | **Not a ledger row** | | | | |",
].join("\n");
const ROWS = ledgerRows(LEDGER);

describe("the ledger rows", () => {
  it("reads the §10 table only: id, the bold root, the status", () => {
    expect(ROWS).toEqual([
      {
        id: "U1",
        root: "One history, three homes",
        status: "ready for an overhaul plan (3 screens)",
      },
      { id: "U2", root: "Derived numbers on a log", status: "waiting (1 screen)" },
    ]);
  });

  it("reads the real IA ledger", () => {
    const rows = ledgerRows(readFileSync(join(import.meta.dirname, "../../docs/IA.md"), "utf8"));
    expect(rows.length).toBeGreaterThanOrEqual(17);
    expect(rows[0]).toMatchObject({ id: "U1", root: "One history, three homes" });
  });
});

describe("a placing", () => {
  it("is a §10 row id or a named new root, nothing else", () => {
    expect(parseRoot("U3")).toEqual({ kind: "ledger", id: "U3" });
    expect(parseRoot("new: two features share one name")).toEqual({
      kind: "new",
      name: "two features share one name",
    });
    expect(parseRoot("the nav")).toBeNull();
  });

  it("refuses a roots.json that places a stranger or names a row the ledger lacks", () => {
    const ids = new Set(["F-1", "F-2"]);
    expect(rootsProblems({ "F-1": "U1", "F-2": "new: x" }, { rows: ROWS, ids })).toEqual([]);
    expect(rootsProblems({ "F-9": "U1", "F-1": "U7", "F-2": "nav" }, { rows: ROWS, ids })).toEqual([
      "roots.json places F-9, which is not a finding of this round",
      "F-1: U7 is not a §10 row",
      'F-2: "nav" is neither a §10 row id (U1…) nor "new: <the root>"',
    ]);
  });
});

const item = (id: string, severity: string, extra: Record<string, unknown> = {}) => ({
  ids: [id],
  finding: { id, what: `Problem ${id}`, severity, frames: [] as string[] },
  severity,
  also: 0,
  members: 1,
  frames: [] as string[],
  ...extra,
});

describe("grouping by root", () => {
  it("ranks roots by their worst problem, then reports, then members; unplaced last", () => {
    const items = [
      item("A", "moderate"),
      item("B", "high"),
      item("C", "moderate", { also: 3 }),
      item("D", "low"),
      item("E", "critical"),
    ];
    const roots = { A: "U1", B: "new: Two Playbooks", C: "new: two playbooks", D: "U2" };
    const groups = groupByRoot(items, { roots, rows: ROWS, rank: severityRank });
    expect(groups.map((g) => [g.kind, g.title, g.items.map((s) => s.finding.id)])).toEqual([
      ["new", "Two Playbooks", ["B", "C"]],
      ["ledger", "U1 — One history, three homes", ["A"]],
      ["ledger", "U2 — Derived numbers on a log", ["D"]],
      ["unplaced", "", ["E"]],
    ]);
    // One root named twice in two cases is one root; its reports add up.
    expect(groups[0]?.reports).toBe(5);
  });

  it("places a group by any of its findings, the lead's first", () => {
    const groups = groupByRoot([item("A", "low", { ids: ["A", "A2"] })], {
      roots: { A2: "U2" },
      rows: ROWS,
      rank: severityRank,
    });
    expect(groups[0]?.title).toBe("U2 — Derived numbers on a log");
  });
});

describe("the by-root section", () => {
  const items = Array.from({ length: 12 }, (_, i) => item(`R${i + 1}`, i < 3 ? "high" : "low"));
  const roots = Object.fromEntries(items.map((s, i) => [s.finding.id, `new: root ${i + 1}`]));
  const groups = groupByRoot(items, { roots, rows: ROWS, rank: severityRank });
  const md = structuralSection({
    structural: items,
    grade: { structural: {} },
    rootGroups: groups,
  }).join("\n");

  it("opens on how roots are ranked, and shows ten roots in full", () => {
    expect(md.startsWith(ROOT_RANKING)).toBe(true);
    expect(md).toContain("### 1. New root: root 1");
    expect(md).toContain("### 10. New root: root 10");
    expect(md).not.toContain("### 11.");
  });

  it("folds every other root, text only", () => {
    const fold = md.slice(md.indexOf("<details>"));
    expect(fold).toContain("The other 2 roots, ranked the same way, text only");
    expect(fold).toContain("- **New root: root 11** (1 problem): Problem R11");
  });
});

describe("the rooter's run", () => {
  it("asks once more for what a call left out, and hands new names to the next chunk", async () => {
    const leads = ["F-1", "F-2", "F-3"].map((id) => ({ id, what: `w ${id}` }));
    const texts: string[] = [];
    const answers = [
      { placings: [{ finding: "F-1", root: "new: two homes for one list", why: "" }] },
      { placings: [{ finding: "F-2", root: "U1", why: "" }] },
      { placings: [{ finding: "F-3", root: "U7", why: "" }] },
      { placings: [] },
    ];
    const result = await runRoot({
      leads,
      rows: ROWS,
      size: 2,
      call: (t) => {
        texts.push(t);
        return Promise.resolve(answers[texts.length - 1]);
      },
    });
    expect(result.roots).toEqual({ "F-1": "new: two homes for one list", "F-2": "U1" });
    // U7 is no §10 row, so F-3 is asked again, and still left out: never guessed.
    expect(result.left).toEqual(["F-3"]);
    expect(texts[1]).toContain("F-2 —");
    expect(texts[1]).not.toContain("F-1 —");
    expect(texts[2]).toContain('"new: two homes for one list"');
  });

  it("shows the rooter the rows and the findings, never a class or a key", () => {
    const text = rooterText({
      rows: ROWS,
      named: [],
      findings: [{ id: "F-1", what: "w", surface: { route: "/app", viewport: "phone" } }],
    });
    expect(text).toContain("U1 — One history, three homes — ready for an overhaul plan");
    expect(text).toContain("F-1 — /app @phone — w");
    expect(
      readPlacings(
        { placings: [{ finding: "F-x", root: "U1" }] },
        { asked: new Set(["F-1"]), rows: ROWS },
      ),
    ).toEqual({
      placed: {},
      skipped: ["F-1"],
    });
  });
});

describe("buildReadout — a round placed under its roots", () => {
  const FIX = join(import.meta.dirname, "../fixtures/study-grade");
  const round = join(mkdtempSync(join(tmpdir(), "study-roots-round-")), "round");
  cpSync(join(FIX, "round"), round, { recursive: true });
  mkdirSync(join(round, "extra"));
  const frame = join(
    FIX,
    "round/5-sessions/commuter/made-up-house/desktop/t1/run-1/frames/000.jpg",
  );
  const ids = Array.from({ length: 12 }, (_, i) => `G${i + 1}`);
  const lines = ids.map((id, i) => {
    copyFileSync(frame, join(round, "extra", `${id.toLowerCase()}.jpg`));
    return {
      id,
      class: "experts",
      expert: 1,
      level: "structural",
      severity: i < 2 ? "high" : "moderate",
      what: `Grouped problem ${i + 1}`,
      evidence: [`extra/${id.toLowerCase()}.jpg`],
    };
  });
  appendFileSync(
    join(round, "findings.jsonl"),
    `${lines.map((l) => JSON.stringify(l)).join("\n")}\n`,
  );
  // G1 and G2 share a row; every other one is a root of its own, so there are eleven roots.
  const roots = Object.fromEntries(ids.map((id, i) => [id, i < 2 ? "U1" : `new: root of ${id}`]));
  writeFileSync(join(round, "roots.json"), JSON.stringify(roots));
  const grade = gradeRound(
    loadRound(
      gradeArgs([
        "--sealed",
        join(FIX, "sealed"),
        "--round",
        round,
        "--struck",
        join(FIX, "round/struck.json"),
        "--negative",
        join(FIX, "negative"),
        "--positive",
        join(FIX, "positive"),
      ]),
    ),
  );
  grade.structural.groups = Object.fromEntries(ids.map((id) => [id, [id]]));
  const unmatched = { voice: null, gold: null, score: 0, disputed: false, verdict: "unmatched" };
  grade.findings.push(
    ...lines.map(({ id, level }) => ({
      ...unmatched,
      id,
      level,
      class: "experts",
      expert: 1,
      member: null,
    })),
  );
  const root = mkdtempSync(join(tmpdir(), "study-roots-"));
  writeFileSync(join(root, "grade.json"), JSON.stringify(grade));
  const ia = join(root, "IA.md");
  writeFileSync(ia, LEDGER);
  const { markdown, shots } = buildReadout(
    readoutArgs([
      "--grade",
      join(root, "grade.json"),
      "--round",
      round,
      "--study",
      "made-up-house",
      "--next-area",
      "the kitchen",
      "--cost",
      "about 90 short sessions",
      "--root",
      root,
      "--ia",
      ia,
    ]),
  );

  it("heads the section with the ledger row its two problems share", () => {
    expect(markdown).toContain(ROOT_RANKING);
    expect(markdown).toContain(
      "### 1. U1 — One history, three homes · on the ledger: ready for an overhaul plan (3 screens)",
    );
    expect(markdown).toMatch(/### 1\.[\s\S]*?Grouped problem 1[\s\S]*?- \*\*Grouped problem 2\*\*/);
  });

  it("copies one frame per shown root, never for a folded one or a second problem", () => {
    const evidence = readdirSync(shots).filter((f) => f.startsWith("extra-"));
    expect(evidence).toHaveLength(10);
    expect(evidence).not.toContain("extra-g2.jpg");
    expect(markdown).toContain("The other 1 root, ranked the same way, text only");
  });

  it("refuses a roots.json that names a row the ledger lacks", () => {
    writeFileSync(join(round, "roots.json"), JSON.stringify({ G1: "U42" }));
    expect(() =>
      buildReadout(
        readoutArgs([
          "--grade",
          join(root, "grade.json"),
          "--round",
          round,
          "--study",
          "made-up-house",
          "--next-area",
          "x",
          "--cost",
          "y",
          "--root",
          root,
          "--ia",
          ia,
        ]),
      ),
    ).toThrow(/U42 is not a §10 row/);
  });
});
