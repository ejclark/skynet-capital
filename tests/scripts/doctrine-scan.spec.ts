import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "@rstest/core";
import { appendLedgerRow, decide, parseLedgerRows } from "../../scripts/doctrine-decide.mjs";

// doctrine-scan.mjs / doctrine-decide.mjs (issue #2287, PR 8) — the bot-trading learning loop's
// eye. Driven three ways, the same house pattern as event-material-scan.spec.ts: pure decide()
// directly, the real CLI's --explain (stdin JSON, no fs/network), and the real CLI's --due/
// --candidate/--validate against a fixture dossiers directory (no network either — dependency-free
// by contract).

const LEDGER_HEADING = "## Adaptation ledger";
const TABLE_HEADER = "| Date | Change | Why | Evidence | Next check |";
const SEP = "|---|---|---|---|---|";

function dossier(rows: string[]): string {
  return [`# BOTS-SAURON`, "", LEDGER_HEADING, "", TABLE_HEADER, SEP, ...rows, ""].join("\n");
}

describe("parseLedgerRows", () => {
  it("reads every dated row under the Adaptation ledger heading", () => {
    const md = dossier(["| 2026-09-22 | Dossier created | seed | n/a | 2026-10-22 |"]);
    expect(parseLedgerRows(md)).toEqual([
      {
        date: "2026-09-22",
        change: "Dossier created",
        why: "seed",
        evidence: "n/a",
        nextCheck: "2026-10-22",
      },
    ]);
  });

  it("returns [] when the heading is missing", () => {
    expect(parseLedgerRows("# BOTS-SAURON\n\nno ledger here\n")).toEqual([]);
  });

  it("skips a row whose Next check cell isn't a bare date, without guessing", () => {
    const md = dossier(["| 2026-09-22 | Dossier created | seed | n/a | tbd |"]);
    expect(parseLedgerRows(md)[0]?.nextCheck).toBeNull();
  });
});

describe("decide", () => {
  it("is never-scored when there are no ledger rows yet", () => {
    expect(decide({ today: "2026-09-22", rows: [] })).toEqual({
      due: true,
      reason: "never-scored",
      nextDueDate: null,
    });
  });

  it("is not due while the last row's Next check is still in the future", () => {
    const rows = [
      { date: "2026-09-22", change: "c", why: "w", evidence: "e", nextCheck: "2026-10-22" },
    ];
    const out = decide({ today: "2026-09-23", rows });
    expect(out).toEqual({ due: false, reason: null, nextDueDate: "2026-10-22" });
  });

  it("is past-score-by-unscored once the last row's Next check has arrived", () => {
    const rows = [
      { date: "2026-08-01", change: "c", why: "w", evidence: "e", nextCheck: "2026-09-20" },
    ];
    const out = decide({ today: "2026-09-22", rows });
    expect(out).toEqual({ due: true, reason: "past-score-by-unscored", nextDueDate: "2026-09-20" });
  });

  it("falls back to the default review cadence when a row names no Next check", () => {
    const rows = [{ date: "2026-08-01", change: "c", why: "w", evidence: "e", nextCheck: null }];
    const out = decide({ today: "2026-09-22", rows }); // 52 days later — past the 30-day default
    expect(out.due).toBe(true);
    expect(out.reason).toBe("scoring-interval-elapsed");
  });

  it("only ever looks at the LAST row — an earlier row's due date never re-fires", () => {
    const rows = [
      { date: "2026-01-01", change: "old", why: "w", evidence: "e", nextCheck: "2026-01-08" },
      { date: "2026-09-22", change: "new", why: "w", evidence: "e", nextCheck: "2026-10-22" },
    ];
    expect(decide({ today: "2026-09-23", rows }).due).toBe(false);
  });
});

describe("appendLedgerRow", () => {
  it("appends after the last existing row, never editing one in place", () => {
    const md = dossier(["| 2026-09-22 | first | w | e | 2026-10-22 |"]);
    const out = appendLedgerRow(md, {
      date: "2026-10-22",
      change: "second",
      why: "w2",
      evidence: "e2",
      nextCheck: "2026-11-22",
    });
    const rows = parseLedgerRows(out);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.change).toBe("first"); // untouched
    expect(rows[1]?.change).toBe("second");
  });

  it("throws rather than silently no-op'ing when the heading is missing", () => {
    expect(() =>
      appendLedgerRow("# BOTS-SAURON\n", {
        date: "2026-09-22",
        change: "c",
        why: "w",
        evidence: "e",
      }),
    ).toThrow();
  });
});

// --explain: the real CLI, full state on stdin, no fs/network — exit code carries the verdict.
const explain = (state: Record<string, unknown>): { code: number; out: unknown } => {
  try {
    const stdout = execFileSync("node", ["scripts/doctrine-scan.mjs", "--explain"], {
      input: JSON.stringify(state),
      encoding: "utf8",
    });
    return { code: 0, out: JSON.parse(stdout) };
  } catch (error) {
    const e = error as { status: number; stdout: string };
    return { code: e.status, out: JSON.parse(e.stdout) };
  }
};

describe("doctrine-scan.mjs --explain", () => {
  it("exits 0 (due) on never-scored", () => {
    const { code, out } = explain({ today: "2026-09-22", rows: [] });
    expect(code).toBe(0);
    expect(out).toMatchObject({ due: true, reason: "never-scored" });
  });

  it("exits 1 (not due) while the ledger's last row isn't due yet", () => {
    const { code, out } = explain({
      today: "2026-09-22",
      rows: [{ date: "2026-09-22", change: "c", why: "w", evidence: "e", nextCheck: "2026-10-22" }],
    });
    expect(code).toBe(1);
    expect(out).toMatchObject({ due: false });
  });
});

// --due / --candidate / --validate against a real fixture directory — no network, dependency-free.
describe("doctrine-scan.mjs CLI, against a fixture dossiers directory", () => {
  const run = (dir: string, ...flags: string[]) =>
    execFileSync(
      "node",
      ["scripts/doctrine-scan.mjs", `--dossiers-dir=${dir}`, "--today=2026-09-22", ...flags],
      {
        encoding: "utf8",
      },
    );

  it("reports [] from --due when every dossier's ledger is fresh", () => {
    const dir = mkdtempSync(join(tmpdir(), "doctrine-scan-"));
    try {
      writeFileSync(
        join(dir, "BOTS-SAURON.md"),
        dossier(["| 2026-09-22 | seeded | w | e | 2026-10-22 |"]),
      );
      expect(JSON.parse(run(dir, "--due"))).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("names a due dossier via --candidate once its Next check has passed", () => {
    const dir = mkdtempSync(join(tmpdir(), "doctrine-scan-"));
    try {
      writeFileSync(
        join(dir, "BOTS-SAURON.md"),
        dossier(["| 2026-08-01 | seeded | w | e | 2026-09-01 |"]),
      );
      const candidate = JSON.parse(run(dir, "--candidate"));
      expect(candidate).toMatchObject({
        persona: "sauron",
        due: true,
        reason: "past-score-by-unscored",
      });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("passes --validate on a well-named dossier and is a clean no-op on an empty directory", () => {
    const dir = mkdtempSync(join(tmpdir(), "doctrine-scan-"));
    try {
      writeFileSync(
        join(dir, "BOTS-SAURON.md"),
        dossier(["| 2026-09-22 | seeded | w | e | 2026-10-22 |"]),
      );
      expect(() => run(dir, "--validate")).not.toThrow();

      const emptyDir = mkdtempSync(join(tmpdir(), "doctrine-scan-empty-"));
      try {
        expect(JSON.parse(run(emptyDir, "--due"))).toEqual([]);
      } finally {
        rmSync(emptyDir, { recursive: true, force: true });
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
