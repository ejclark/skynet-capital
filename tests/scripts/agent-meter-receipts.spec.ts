import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "@rstest/core";
import {
  auditedInWindow,
  auditReceiptRow,
  branchReceipts,
  mergeReceipts,
  // @ts-expect-error plain .mjs script, no declarations
} from "../../scripts/agent-meter/defects.mjs";

// #6683. The audit's receipt lived only on the session's own disk, so every cloud audit's receipt
// went with its container and the defect rate read unknown. The receipt now also goes to the
// data/pr-review branch, and the meter reads both. These pin the criteria from #6683: a receipt
// written in one session counts in another, a row is counted once, and no receipt stays unknown.

type Row = { at: string; prs: number[]; confirmed: number };
const b64 = (rows: Row[]) =>
  Buffer.from(rows.map((r) => JSON.stringify(r)).join("\n")).toString("base64");
const SINCE = Date.parse("2026-11-03T00:00:00Z");
const UNTIL = Date.parse("2026-11-05T23:00:00Z");
const ON_BRANCH: Row = { at: "2026-11-04T10:00:00.000Z", prs: [6801, 6802], confirmed: 1 };

/** The meter's `rest`: `gh api` paths in, parsed JSON out. */
const fakeRest = (files: Record<string, Row[]>) => {
  const calls: string[] = [];
  return {
    calls,
    api(path: string) {
      calls.push(path);
      if (path.includes("/contents/audit?ref="))
        return Object.keys(files).map((p) => ({ path: p, name: p.split("/")[1] }));
      const hit = Object.keys(files).find((p) => path.includes(`/contents/${p}?ref=`));
      if (!hit) throw new Error("gh api: 404");
      return { content: b64(files[hit] ?? []) };
    },
  };
};

describe("a receipt on the ledger branch", () => {
  it("counts in a session that never had the local file", () => {
    const rest = fakeRest({
      "audit/2026-11-04.jsonl": [ON_BRANCH],
      "audit/2026-10-01.jsonl": [{ ...ON_BRANCH, at: "2026-10-01T00:00:00Z" }],
    });
    const rows = branchReceipts(rest, SINCE, UNTIL);
    expect(rows).toEqual([ON_BRANCH]);
    expect(auditedInWindow(mergeReceipts([], rows), SINCE, UNTIL)).toEqual({ audits: 1, prs: 2 });
    // One listing, then only the day inside the window: an old day file costs no read.
    expect(rest.calls.filter((c) => c.includes("2026-10-01"))).toEqual([]);
  });

  it("reads as no receipt when the branch cannot be read, so the window stays unknown, never zero", () => {
    const rest = {
      api: () => {
        throw new Error("gh api: 404 Not Found");
      },
    };
    expect(branchReceipts(rest, SINCE, UNTIL)).toEqual([]);
    expect(auditedInWindow(mergeReceipts([], []), SINCE, UNTIL)).toBeNull();
  });

  it("counts the row written to both places once, and two audits as two", () => {
    const other = { ...ON_BRANCH, at: "2026-11-05T10:00:00.000Z", prs: [6803] };
    expect(mergeReceipts([ON_BRANCH], [ON_BRANCH, other])).toEqual([ON_BRANCH, other]);
    expect(mergeReceipts([{ prs: [1] }])).toEqual([]);
  });

  it("builds one row for both copies, keeping the time it is given", () => {
    expect(auditReceiptRow({ prs: "6801,x,6802", confirmed: "1", at: ON_BRANCH.at })).toEqual(
      ON_BRANCH,
    );
    expect(() => auditReceiptRow({ prs: "", confirmed: "1" })).toThrow(/--prs/);
  });
});

describe("npm run meter -- --audit-receipt", () => {
  const run = (dir: string, ...args: string[]) =>
    spawnSync(
      process.execPath,
      [
        "scripts/agent-meter.mjs",
        "--audit-receipt",
        "--prs",
        "6801,6802",
        "--confirmed",
        "1",
        ...args,
      ],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        // A curl and a gh that refuse, so a spec never writes to the real branch.
        env: {
          ...process.env,
          AGENT_RUNS_DIR: join(dir, "runs"),
          GH_TOKEN: "fake",
          PATH: `${join(dir, "bin")}:${process.env.PATH}`,
        },
        timeout: 60000,
      },
    );
  const withBin = (fn: (dir: string) => void) => {
    const dir = mkdtempSync(join(tmpdir(), "agent-meter-receipt-branch-"));
    try {
      mkdirSync(join(dir, "bin"));
      for (const tool of ["curl", "gh"]) {
        writeFileSync(
          join(dir, "bin", tool),
          "#!/bin/bash\necho 'curl: (22) The requested URL returned error: 403' >&2\nexit 22\n",
        );
        chmodSync(join(dir, "bin", tool), 0o755);
      }
      fn(dir);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  };

  it("with --local-only, writes the local row and touches no branch", () => {
    withBin((dir) => {
      const res = run(dir, "--local-only");
      expect(res.status).toBe(0);
      expect(res.stdout).toMatch(/recorded 2 PR\(s\) audited/);
      expect(res.stdout).not.toMatch(/data\/pr-review/);
      expect(
        JSON.parse(readFileSync(join(dir, "runs", "post-merge-audit.jsonl"), "utf8")),
      ).toMatchObject({ prs: [6801, 6802], confirmed: 1 });
    });
  });

  it("goes red, saying the local row is kept, when the branch write fails", () => {
    withBin((dir) => {
      const res = run(dir);
      expect(res.status).toBe(1);
      expect(res.stderr).toMatch(/recorded 2 PR\(s\) audited .*, but NOT on data\/pr-review/);
      expect(existsSync(join(dir, "runs", "post-merge-audit.jsonl"))).toBe(true);
    });
  });
});
