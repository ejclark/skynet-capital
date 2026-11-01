import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "@rstest/core";
// @ts-expect-error plain .mjs script, no declarations
import { EYES } from "../../scripts/cleanup-next.mjs";

// The sort over what the clean-up scans print, driven through the real entrypoint via `--explain`.
// Each output below is the shape that scan printed on 2026-11-01, trimmed.
type Row = { script: string; target: string; moves: number; priceM: number; openPr: number | null };
type Report = {
  rows: Row[];
  unreadable: { script: string; why: string }[];
  openPrsUnchecked: string | null;
};

const swaps = (file: string, n: number) =>
  Array.from({ length: n }, (_, i) => ({
    where: `${file}:${i + 1}`,
    prop: "gap",
    literal: "8px",
    token: "--space-2",
  }));

const outputs = {
  "css-literal-scan": {
    findings: {
      equalsToken: [...swaps("app/src/styles/a.css", 3), ...swaps("app/src/styles/b.css", 45)],
    },
  },
  "dead-scan": {
    candidate: { target: "src/x.ts", exports: ["a"], types: ["B", "C"] },
    app: { candidate: { target: "app/src/y.ts", exports: [], types: ["D"] } },
  },
  "dupe-scan": {
    candidate: { name: "dollars", files: ["src/d1.ts", "src/d2.ts"], copies: 5 },
    runnerUp: null,
  },
  "spec-gap-scan": { candidate: { file: "src/s.ts" }, runnerUp: null },
  "doc-rot-scan": {
    candidate: { file: "docs/IA.md", findings: ["dead-line: a", "dead-line: b", "dead-line: c"] },
    runnerUp: { file: "docs/quiet.md", findings: ["dead-ref: z"] },
  },
  "forward-test-id-scan": { id: "FT-25", count: 3 },
  "arch-scan": { candidate: { file: "scripts/big.js" }, runnerUp: null },
  "dep-graph-scan": { candidate: { from: "src/p.ts", to: "src/q.ts" } },
  "clone-scan": {
    candidate: { a: "autonomous/c.ts:1-9", b: "scripts/e.ts:1-9" },
    app: { candidate: { a: "app/src/f.tsx:1-9", b: "app/src/g.tsx:1-9" } },
  },
};

const run = (state: unknown, ...flags: string[]) =>
  spawnSync("node", ["scripts/cleanup-next.mjs", "--explain", ...flags], {
    input: JSON.stringify(state),
    encoding: "utf8",
  });
const report = (state: unknown): Report => JSON.parse(run(state, "--json").stdout);
const targets = (r: Report) => r.rows.map((row) => row.target);

describe("cleanup-next: the order", () => {
  const r = report({ outputs, openPrFiles: { "docs/IA.md": 6001 } });

  it("puts work a script does for 0 tokens first, the largest file leading", () => {
    expect(targets(r).slice(0, 2)).toEqual(["app/src/styles/b.css", "app/src/styles/a.css"]);
  });

  it("then ranks by units removed per million tokens, highest first", () => {
    const paid = r.rows.filter((row) => row.priceM > 0 && !row.openPr);
    const perM = paid.map((row) => row.moves / row.priceM);
    expect(perM).toEqual([...perM].sort((a, b) => b - a));
    expect(perM.length).toBeGreaterThan(5);
  });

  it("puts a rep whose file an open PR touches last, and names the PR", () => {
    expect(r.rows.at(-1)).toMatchObject({ target: "docs/IA.md", openPr: 6001 });
    // Without the collision the same rep outranks most of the list, so the move is the check's doing.
    const clear = report({ outputs, openPrFiles: {} });
    expect(targets(clear).indexOf("docs/IA.md")).toBeLessThan(5);
  });

  it("matches a clone's src-relative path against the repo path an open PR reports", () => {
    const hit = report({ outputs, openPrFiles: { "src/autonomous/c.ts": 7 } });
    expect(hit.rows.at(-1)?.openPr).toBe(7);
  });

  it("counts each scan's units, not one per row", () => {
    const moves = Object.fromEntries(r.rows.map((row) => [row.target, row.moves]));
    expect(moves).toMatchObject({
      "app/src/styles/b.css": 45,
      "src/x.ts": 3,
      "dollars ×5": 4,
      "docs/IA.md": 3,
      "FT-25": 2,
    });
  });
});

describe("cleanup-next: says what it could not read", () => {
  it("names a scan that gave no output and still ranks the rest", () => {
    const r = report({ outputs: { ...outputs, "dead-scan": undefined }, openPrFiles: {} });
    expect(r.unreadable.map((u) => u.script)).toEqual(["dead-scan"]);
    expect(targets(r)).toContain("docs/IA.md");
  });

  it("names a scan whose output changed shape, rather than reading it as nothing to do", () => {
    const r = report({ outputs: { ...outputs, "spec-gap-scan": { next: {} } }, openPrFiles: {} });
    expect(r.unreadable.map((u) => u.script)).toEqual(["spec-gap-scan"]);
  });

  it("does not call a scan with nothing to do unreadable", () => {
    const clean = report({
      outputs: {
        ...outputs,
        "arch-scan": { candidate: null, runnerUp: null },
        // This scan prints a bare null when no id is duplicated.
        "forward-test-id-scan": null,
      },
      openPrFiles: {},
    });
    expect(clean.unreadable).toEqual([]);
    expect(targets(clean)).not.toContain("scripts/big.js");
    expect(targets(clean)).not.toContain("FT-25");
  });

  it("says the open PRs went unchecked instead of implying no collisions", () => {
    const r = run({ outputs });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("Open PRs not checked");
    expect(report({ outputs }).openPrsUnchecked).not.toBeNull();
    expect(report({ outputs, openPrFiles: {} }).openPrsUnchecked).toBeNull();
  });

  it("exits 1 when it could read no scan at all, since an empty list would read as all clear", () => {
    const r = run({ outputs: {}, openPrFiles: {} });
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("Could not read");
  });
});

describe("cleanup-next: wiring", () => {
  const eyes: { script: string; flag?: string }[] = EYES;
  it.each(eyes)("$script takes the flag this reads", ({ script, flag = "--candidate" }) => {
    expect(readFileSync(`scripts/${script}.mjs`, "utf8")).toContain(`"${flag}"`);
  });
});
