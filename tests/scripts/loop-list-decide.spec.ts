import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "@rstest/core";
import { overdueLoops, parseLoopList } from "../../scripts/loop-list-decide.mjs";

// #4060 (slice 2 of #3955): WHEN the digest runs and a loop row's `Next check` date has passed
// unscored, the system SHALL list that row as overdue. Driven two ways: the pure parser/decision,
// and the real `doctrine-scan.mjs --due` the secretary-digest Routine already calls.

const list = (rows: string[]) =>
  [
    "# Learning loops",
    "",
    "## Loops running now",
    "",
    "| Loop | The question | Owning issue | State | Next check |",
    "|---|---|---|---|---|",
    ...rows,
    "",
    "## Something after",
    "",
    "| Loop | Next check |",
    "|---|---|",
    "| not-a-loop | 2020-01-01 |",
    "",
  ].join("\n");

describe("parseLoopList", () => {
  it("reads rows by header name and stops at the next section", () => {
    const rows = parseLoopList(
      list(["| Scorecard | right calls? | #4061 | **running** | **2026-10-06** — score it |"]),
    );
    expect(rows).toEqual([
      { loop: "Scorecard", issue: "#4061", state: "running", nextCheck: "2026-10-06" },
    ]);
  });

  it("returns null when the doc has no list yet — distinct from an empty list", () => {
    expect(parseLoopList("# Learning loops\n")).toBeNull();
    expect(parseLoopList(list([]))).toEqual([]);
  });

  it("throws rather than guessing when the table lacks a Next check column", () => {
    const md = "## Loops running now\n\n| Loop | State |\n|---|---|\n| a | running |\n";
    expect(() => parseLoopList(md)).toThrow(/Next check/);
  });
});

describe("overdueLoops", () => {
  const row = (state: string, nextCheck: string | null) => ({
    loop: "l",
    issue: "#1",
    state,
    nextCheck,
  });

  it("flags a live row on or after its Next check date", () => {
    expect(overdueLoops({ today: "2026-10-06", rows: [row("running", "2026-10-06")] })).toEqual([
      {
        ...row("running", "2026-10-06"),
        due: true,
        reason: "loop-check-overdue",
        nextDueDate: "2026-10-06",
      },
    ]);
    expect(
      overdueLoops({ today: "2026-10-07", rows: [row("scaling", "2026-10-06")] }),
    ).toHaveLength(1);
  });

  it("leaves a future date, an ended loop, and a non-date cell alone", () => {
    const rows = [
      row("running", "2026-10-07"),
      row("killed", "2026-01-01"),
      row("pivoted (#3300)", "2026-01-01"),
      row("running", null),
    ];
    expect(overdueLoops({ today: "2026-10-06", rows })).toEqual([]);
  });

  it("treats a missing list as nothing overdue", () => {
    expect(overdueLoops({ today: "2026-10-06", rows: null })).toEqual([]);
  });
});

describe("doctrine-scan.mjs --due carries overdue loop checks", () => {
  const scan = (loopsMd: string | null, today: string) => {
    const dir = mkdtempSync(join(tmpdir(), "loop-list-"));
    const dossiers = join(dir, "dossiers");
    execFileSync("mkdir", [dossiers]);
    const loopsFile = join(dir, "LEARNING-LOOP.md");
    if (loopsMd !== null) writeFileSync(loopsFile, loopsMd);
    try {
      return execFileSync(
        "node",
        [
          "scripts/doctrine-scan.mjs",
          `--dossiers-dir=${dossiers}`,
          `--loops-file=${loopsFile}`,
          `--today=${today}`,
          "--due",
        ],
        { encoding: "utf8", stdio: "pipe" },
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  };

  it("lists a passed, unscored row as overdue, tagged with its source", () => {
    const md = list([
      "| Scorecard | right calls? | #4061 | running | 2026-10-06 |",
      "| Later | ? | #4062 | running | 2026-11-01 |",
    ]);
    expect(JSON.parse(scan(md, "2026-10-08"))).toEqual([
      {
        source: "loop-list",
        loop: "Scorecard",
        issue: "#4061",
        state: "running",
        nextCheck: "2026-10-06",
        due: true,
        reason: "loop-check-overdue",
        nextDueDate: "2026-10-06",
      },
    ]);
  });

  it("exits 2 when the loop-list file is missing — UNKNOWN, never nothing due", () => {
    let code = 0;
    try {
      scan(null, "2026-10-08");
    } catch (error) {
      code = (error as { status: number }).status;
    }
    expect(code).toBe(2);
  });
});
