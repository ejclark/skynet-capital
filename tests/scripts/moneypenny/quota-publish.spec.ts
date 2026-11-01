import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { describe, expect, it } from "@rstest/core";
import { withReading } from "../../../scripts/moneypenny/pace-reading.mjs";
import {
  publishReading,
  type Reading,
  readingFromExecutionOutput,
} from "../../../scripts/moneypenny/quota.mjs";

// THE LANES PUBLISH THE READING (2026-11-01, #6470's study). The fixture is a real leg's stream
// (2026-10-26, five_hour 0.99, seven_day 0.42) with its turns cut to one. `--publish-from` is the
// one writing mode: it writes the reading into #4153's body under the marker and nothing else, and
// writes nothing at all when the file carries no `seven_day` window.
const at = (iso: string) => Date.parse(iso);
const FIXTURE = "tests/fixtures/quota/execution-output-2026-10-26.json";

describe("the reading a lane's result file carries", () => {
  const fixture = readFileSync(FIXTURE, "utf8");
  const NOW = at("2026-10-26T14:25:00Z");

  it("reads the newest seven_day window as a percent, with its reset, dated by the caller's clock", () => {
    expect(readingFromExecutionOutput(fixture, { at: NOW })).toEqual({
      used: 42,
      at: NOW,
      resetsAt: 1793077200 * 1000,
    });
  });

  it("reads JSON lines too, and a stream with no limit event as no reading", () => {
    const lines = (JSON.parse(fixture) as unknown[]).map((m) => JSON.stringify(m)).join("\n");
    expect(readingFromExecutionOutput(lines, { at: NOW })?.used).toBe(42);
    expect(readingFromExecutionOutput('[{"type":"result","is_error":false}]')).toBeNull();
    expect(readingFromExecutionOutput("not json at all")).toBeNull();
    expect(readingFromExecutionOutput("")).toBeNull();
  });

  it("ignores a limit event that carries only the five_hour window", () => {
    const fiveHourOnly = JSON.stringify([
      {
        type: "rate_limit_event",
        rate_limit_info: { unifiedWindows: { five_hour: { utilization: 0.5, resetsAt: 1 } } },
      },
    ]);
    expect(readingFromExecutionOutput(fiveHourOnly)).toBeNull();
  });
});

describe("publishing the reading onto the dial's issue", () => {
  const reading: Reading = {
    used: 42,
    at: at("2026-10-26T14:25:00Z"),
    resetsAt: at("2026-10-27T05:00:00Z"),
  };
  const deps = (body: string) => {
    const writes: string[] = [];
    return {
      writes,
      issue: 4153,
      source: "lane:build-events",
      read: () => ({ body }),
      write: (b: string) => {
        writes.push(b);
      },
    };
  };

  it("writes the marker into a body that has none, keeping the rest of the body", () => {
    const d = deps("Work mode.\n\nThe dial.");
    const r = publishReading(reading, d);
    expect(r.wrote).toBe(true);
    expect(d.writes).toHaveLength(1);
    expect(d.writes[0]).toContain("The dial.");
    expect(d.writes[0]).toContain('"used":42');
    expect(d.writes[0]).toContain('"source":"lane:build-events"');
  });

  it("replaces an older reading, and never a fresher one", () => {
    const older = deps(withReading("x", { ...reading, at: reading.at - 60_000, source: "s" }));
    expect(publishReading(reading, older).wrote).toBe(true);
    const fresher = deps(withReading("x", { ...reading, at: reading.at + 60_000, source: "s" }));
    const r = publishReading(reading, fresher);
    expect(r.wrote).toBe(false);
    expect(r.why).toContain("already holds");
    expect(fresher.writes).toEqual([]);
  });

  it("writes nothing for no reading", () => {
    const d = deps("x");
    expect(publishReading(null, d).wrote).toBe(false);
    expect(d.writes).toEqual([]);
  });

  // Wiring: the real CLI against a fake `gh` and `curl` first on PATH. One GET of the issue, one
  // PATCH with the body in a file (never on argv), and no other write of any kind.
  it("over the real CLI, GETs the issue once and PATCHes its body once, with the marker", () => {
    const dir = mkdtempSync(join(tmpdir(), "quota-publish-"));
    try {
      const log = join(dir, "calls.log");
      const sent = join(dir, "sent.md");
      writeFileSync(
        join(dir, "issue.json"),
        JSON.stringify({ title: "t", body: "The dial.", labels: [] }),
      );
      writeFileSync(
        join(dir, "curl"),
        `#!/bin/sh\necho "curl $*" >> "${log}"\ncat "${join(dir, "issue.json")}"\n`,
      );
      writeFileSync(
        join(dir, "gh"),
        `#!/bin/sh\necho "gh $*" >> "${log}"\nfor a in "$@"; do case "$a" in body=@*) cp "\${a#body=@}" "${sent}";; esac; done\n`,
      );
      chmodSync(join(dir, "curl"), 0o755);
      chmodSync(join(dir, "gh"), 0o755);
      const out = execFileSync(
        process.execPath,
        ["scripts/moneypenny/quota.mjs", "--publish-from", FIXTURE, "--source", "lane:build-plan"],
        {
          encoding: "utf8",
          env: { ...process.env, PATH: `${dir}${delimiter}${process.env.PATH}` },
        },
      );
      expect(out).toContain("now carries 42% used (lane:build-plan)");
      const calls = readFileSync(log, "utf8").trim().split("\n");
      expect(calls.filter((c) => c.startsWith("curl "))).toHaveLength(1);
      expect(calls.filter((c) => c.startsWith("gh "))).toEqual([
        expect.stringMatching(
          /^gh api -X PATCH repos\/\{owner\}\/\{repo\}\/issues\/4153 -F body=@/,
        ),
      ]);
      expect(readFileSync(sent, "utf8")).toContain('<!-- pace-reading {"used":42');
      expect(readFileSync(sent, "utf8")).toContain("The dial.");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("over the real CLI, a file with no reading writes nothing and exits 0", () => {
    const dir = mkdtempSync(join(tmpdir(), "quota-publish-"));
    try {
      const log = join(dir, "calls.log");
      const file = join(dir, "out.json");
      writeFileSync(file, '[{"type":"result","is_error":true}]');
      for (const bin of ["curl", "gh"]) {
        writeFileSync(join(dir, bin), `#!/bin/sh\necho "${bin} $*" >> "${log}"\n`);
        chmodSync(join(dir, bin), 0o755);
      }
      const out = execFileSync(
        process.execPath,
        ["scripts/moneypenny/quota.mjs", "--publish-from", file],
        {
          encoding: "utf8",
          env: { ...process.env, PATH: `${dir}${delimiter}${process.env.PATH}` },
        },
      );
      expect(out).toContain("wrote nothing");
      expect(existsSync(log)).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
