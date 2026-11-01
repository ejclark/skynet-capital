import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "@rstest/core";
import { closedWithOpenSlices, renderReport } from "../../scripts/last-slice-scan.mjs";

// The registry's "Only the last slice closes" row (#4056) asks whether a parent stays open while a
// sub-issue is open. Its check was done by hand, and the 2026-10-31 reading found three closed
// plans with open sub-issues that nobody had noticed. WHEN `npm run plans:last-slice` runs, the
// system SHALL list every closed plan whose sub-issue count says a slice is still open, with the
// open slices named, and exit 0 either way — a report, never a gate.

const plan = (number: number, total: number, completed: number, extra = {}) => ({
  number,
  title: `plan ${number}`,
  state: "closed",
  closed_at: "2026-10-01T00:00:00Z",
  labels: [{ name: "plan" }],
  sub_issues_summary: { total, completed, percent_completed: 0 },
  ...extra,
});

describe("closedWithOpenSlices", () => {
  it("keeps a closed plan whose sub-issues are not all completed", () => {
    expect(closedWithOpenSlices([plan(3811, 4, 3), plan(3527, 2, 2), plan(1, 0, 0)])).toEqual([
      { number: 3811, title: "plan 3811", closedAt: "2026-10-01", open: 1, total: 4 },
    ]);
  });

  it("ignores pull requests and open issues the list may carry", () => {
    const rows = closedWithOpenSlices([
      plan(2, 3, 1, { pull_request: { url: "x" } }),
      plan(3, 3, 1, { state: "open" }),
    ]);
    expect(rows).toEqual([]);
  });

  it("renders the open slices beside each plan, or says the rule held", () => {
    const rows = closedWithOpenSlices([plan(3811, 4, 3)]);
    const md = renderReport(rows, { 3811: [4316] });
    expect(md).toContain("| #3811 | plan 3811 | 2026-10-01 | 1 of 4 | #4316 |");
    expect(renderReport([], {})).toContain("0 closed plans with an open sub-issue");
  });

  it("keeps a title with a pipe in one cell", () => {
    const rows = closedWithOpenSlices([plan(5, 2, 1, { title: "a | b" })]);
    expect(renderReport(rows, {})).toContain("| #5 | a \\| b | 2026-10-01 | 1 of 2 | — |");
  });
});

describe("the CLI, against a stub GitHub", () => {
  const STUB_CURL = `#!/usr/bin/env bash
url="\${@: -1}"
echo "$url" >> "$STUB/calls"
case "$url" in
*/issues?state=closed*labels=plan*) cat "$STUB/closed.json" ;;
*/issues/3811/sub_issues*) echo '[{"number":4316,"state":"open"},{"number":4300,"state":"closed"}]' ;;
*) echo '[]' ;;
esac
`;

  it("lists the closed plan with an open slice and reads sub-issues only for it", () => {
    const dir = mkdtempSync(join(tmpdir(), "last-slice-"));
    try {
      writeFileSync(join(dir, "curl"), STUB_CURL, { mode: 0o755 });
      writeFileSync(join(dir, "closed.json"), JSON.stringify([plan(3811, 4, 3), plan(3527, 2, 2)]));
      writeFileSync(join(dir, "calls"), "");
      const out = execFileSync("node", ["scripts/last-slice-scan.mjs"], {
        encoding: "utf8",
        stdio: "pipe",
        env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, STUB: dir, GH_TOKEN: "stub" },
      });
      expect(out).toContain("| #3811 | plan 3811 | 2026-10-01 | 1 of 4 | #4316 |");
      expect(out).not.toContain("#3527");
      const calls = readFileSync(join(dir, "calls"), "utf8");
      expect(calls).toContain("issues/3811/sub_issues");
      expect(calls).not.toContain("issues/3527/sub_issues");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
