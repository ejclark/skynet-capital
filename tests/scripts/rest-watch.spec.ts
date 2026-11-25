import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "@rstest/core";
import {
  bucketOf,
  FALSIFIER_MINUTE,
  formatVerdict,
  judge,
  readLog,
  toSample,
} from "../../scripts/rest-watch.mjs";

// #8289's falsifier — "wrong if, in the first surge hour after slice 1 merges, REST still reaches
// 0 before minute 45 of its window" — was a reading nobody was scheduled to take. These specs pin
// how a minute-by-minute log of `gh api rate_limit` answers it, window by window, and that the
// App's own bucket (#6319) never stands in for the personal allowance.

const WATCH = resolve("scripts/rest-watch.mjs");
const RESET = 1_795_647_600; // a window that opened 3600s earlier
const OPENED_MS = (RESET - 3600) * 1000;

function at(minute: number, remaining: number, bucket = "user", reset = RESET) {
  return toSample(
    { resources: { core: { limit: 5000, used: 5000 - remaining, remaining, reset } } },
    bucket as "user",
    new Date(OPENED_MS + minute * 60_000 + (reset - RESET) * 1000),
  );
}

describe("rest watch: the falsifier, read from samples", () => {
  it("calls a window wrong when REST reads 0 before minute 45", () => {
    const r = judge([at(1, 4000), at(20, 900), at(31, 0), at(50, 0)]);
    expect(r.verdict).toBe("wrong");
    expect(r.windows[0]).toMatchObject({ emptyAt: 31, verdict: "wrong", peakUsed: 5000 });
    expect(formatVerdict(r).split("\n")[0]).toMatch(/WRONG.*minute 31/);
  });

  it("holds a window that ran dry only at or after minute 45, or never, once seen past it", () => {
    expect(judge([at(2, 3000), at(FALSIFIER_MINUTE, 0)]).verdict).toBe("held");
    expect(judge([at(2, 3000), at(46, 120), at(59, 40)]).windows[0]).toMatchObject({
      emptyAt: null,
      verdict: "held",
      seen: [2, 59],
    });
  });

  it("says unread, not held, when no sample reached minute 45 and none read 0", () => {
    const r = judge([at(3, 4000), at(30, 1200)]);
    expect(r.verdict).toBe("unread");
    expect(formatVerdict(r).split("\n")[0]).toMatch(/not read yet/);
  });

  it("one wrong window outweighs held ones; windows are keyed by their reset", () => {
    const later = RESET + 3600;
    const r = judge([at(50, 100), at(10, 0, "user", later)]);
    expect(r.windows.map((w) => w.verdict)).toEqual(["held", "wrong"]);
    expect(r.verdict).toBe("wrong");
  });

  it("leaves the App's bucket out unless asked, and counts what it left out", () => {
    const appDry = [at(5, 0, "app"), at(6, 0, "app")];
    const r = judge(appDry);
    expect(r).toMatchObject({ verdict: "unread", otherBuckets: 2, windows: [] });
    expect(formatVerdict(r)).toMatch(/2 sample\(s\) from another bucket left out/);
    expect(judge(appDry, { bucket: "app" }).verdict).toBe("wrong");
  });

  it("tells an App token from a person's by GET /user's answer", () => {
    expect(bucketOf({ status: 0, stdout: '{"login":"someone"}' })).toBe("user");
    expect(
      bucketOf({ status: 1, stderr: "gh: Resource not accessible by integration (HTTP 403)" }),
    ).toBe("app");
    expect(bucketOf({ status: 1, stderr: "gh: Bad credentials (HTTP 401)" })).toBe("unknown");
  });

  it("skips a half-written log line rather than failing the verdict", () => {
    const text = `${JSON.stringify(at(50, 10))}\n{"at":"2026-11-2\n`;
    expect(readLog(text)).toHaveLength(1);
  });
});

describe("rest watch: the command", () => {
  it("samples rate_limit into the log, then reads a verdict from it with its exit code", () => {
    const dir = mkdtempSync(join(tmpdir(), "rest-watch-spec-"));
    const gh = join(dir, "gh");
    const calls = join(dir, "calls");
    // A window long gone, so the sample (taken now) lands past minute 45 whatever the clock says.
    const OLD = 1_700_000_000;
    const body = JSON.stringify({
      resources: {
        core: { limit: 5000, used: 4100, remaining: 900, reset: OLD },
        graphql: { limit: 5000, used: 9, remaining: 4991, reset: OLD },
      },
    });
    writeFileSync(
      gh,
      `#!/usr/bin/env bash
echo "$*" >> ${JSON.stringify(calls)}
if [ "$2" = "user" ]; then echo '{"login":"someone"}'; exit 0; fi
echo '${body}'
`,
      { mode: 0o755 },
    );
    const log = join(dir, "watch.jsonl");
    const env = { ...process.env, GH_BIN: gh };

    const sample = spawnSync(process.execPath, [WATCH, "sample", "--log", log], {
      encoding: "utf8",
      env,
    });
    expect(sample.status).toBe(0);
    expect(sample.stdout).toMatch(/user {2}REST 900\/5000 left/);
    // One identity read and one free rate_limit read: nothing else is called.
    expect(readFileSync(calls, "utf8").trim().split("\n")).toEqual(["api user", "api rate_limit"]);
    const [logged] = readLog(readFileSync(log, "utf8"));
    expect(logged).toMatchObject({ bucket: "user", core: { remaining: 900, reset: OLD } });

    const verdict = spawnSync(process.execPath, [WATCH, "verdict", "--log", log], {
      encoding: "utf8",
      env,
    });
    expect(verdict.status).toBe(0);
    expect(verdict.stdout).toMatch(/^#8289 falsifier: held/);

    const missing = spawnSync(
      process.execPath,
      [WATCH, "verdict", "--log", join(dir, "none.jsonl")],
      { encoding: "utf8", env },
    );
    expect(missing.status).toBe(3);
  });
});
