import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { recentResearchSpend } from "../../../scripts/moneypenny/circuit-breaker.mjs";
import {
  costNotice,
  costSummaryRow,
  resultEnvelopeText,
  sessionCost,
} from "../../../scripts/moneypenny/session-cost.mjs";

// THE COST METER'S READER (#2979, repaired 2026-09-17 — issue #3229).
//
// WHY THIS SPEC EXISTS. The meter shipped as `jq -r '.total_cost_usd' <file>` inside a `run:`
// block, written against a shape the file does not have: claude-code-action leaves the whole
// stream-json conversation as a JSON ARRAY, not the single result object docs/LESSONS.md quotes.
// Every read exited 5 ("Cannot index array with string"), and because the step is `if: always()`,
// a metering read failed 12 of 12 matrix legs across both runs where the job ran (35212702833,
// 35214579484) on top of research that had already succeeded.
//
// The three properties pinned here are the three things that incident actually taught:
//   1. THE REAL SHAPE parses — the stream-json array, with the result message last.
//   2. THE METER NEVER GATES — every CLI path exits 0, including missing/empty/garbage input. A
//      metering read is an observer of a job, never a gate on it.
//   3. THE NOTICE LINE IS A CONTRACT — circuit-breaker.mjs (#2946) totals spend by grepping this
//      exact line out of run logs, so the producer is fed through the real consumer here. While
//      the meter was dead that window summed to $0.00 and the dollar cap could not have tripped;
//      nothing failed, which is why only a contract test catches the next drift.
const SCRIPT = "scripts/moneypenny/session-cost.mjs";

/** The shape the action actually writes: every stream event, result message last. */
const streamJson = (result: Record<string, unknown>, transcript: unknown[] = []) =>
  JSON.stringify([
    { type: "system", subtype: "init", session_id: "abc" },
    ...transcript,
    { type: "result", subtype: "success", ...result },
  ]);

const RESULT = { is_error: false, duration_ms: 412_345, num_turns: 37, total_cost_usd: 1.2345 };

/** Runs the CLI exactly as the workflow shim does, and reports its exit status rather than
 *  throwing on one — the status is the thing under test. */
function runCli(args: string[], fileText: string | null, eventId = "nvda-2026-09-30-print") {
  const dir = mkdtempSync(join(tmpdir(), "session-cost-"));
  const file = join(dir, "claude-execution-output.json");
  if (fileText !== null) writeFileSync(file, fileText);
  const summary = join(dir, "summary.md");
  writeFileSync(summary, "");
  try {
    const run = spawnSync("node", [SCRIPT, ...args], {
      encoding: "utf8",
      env: {
        ...process.env,
        CLAUDE_EXECUTION_OUTPUT: file,
        EVENT_ID: eventId,
        GITHUB_STEP_SUMMARY: summary,
      },
    });
    return { status: run.status, stdout: run.stdout ?? "", summary };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("reading what a research session cost", () => {
  it("finds the result message inside the stream-json array the action actually writes", () => {
    // The exact input that made `jq -r '.total_cost_usd'` exit 5.
    const cost = sessionCost(streamJson(RESULT));
    expect(cost).toMatchObject({
      usd: "1.2345",
      turns: "37",
      durationMs: "412345",
      isError: "false",
      note: "",
    });
  });

  it("still reads a bare result object, the shape the broken meter was written against", () => {
    expect(sessionCost(JSON.stringify({ type: "result", ...RESULT })).usd).toBe("1.2345");
  });

  it("takes the LAST result message, so a retried session reports its terminal outcome", () => {
    const raw = JSON.stringify([
      { type: "result", subtype: "error_max_turns", is_error: true, total_cost_usd: 9.99 },
      { type: "result", subtype: "success", is_error: false, total_cost_usd: 0.5 },
    ]);
    expect(sessionCost(raw)).toMatchObject({ usd: "0.5", isError: "false" });
  });

  // `usd=0` and `usd=?` are different facts. The breaker's `usd=([\d.]+)` regex skips the second,
  // so an unreadable session counts as unknown rather than as free — a zero here would quietly
  // lower the measured spend and delay a trip.
  it("reports unknowns as ? rather than zero, on every unreadable input", () => {
    for (const raw of [null, "", "   ", "not json at all", "[]", '[{"type":"assistant"}]', "42"]) {
      expect(sessionCost(raw).usd).toBe("?");
    }
  });

  it("names why the numbers are missing instead of reporting a bare ?", () => {
    expect(sessionCost(null).note).toBe("no-file");
    expect(sessionCost("").note).toBe("empty-file");
    expect(sessionCost("{oops").note).toBe("unparseable-json");
    expect(sessionCost('[{"type":"assistant"}]').note).toContain("no-result-message");
  });
});

describe("the meter never gates the job it measures", () => {
  // The whole point of #3229: six finished research sessions were marked failed by their own
  // metering step. Every one of these inputs used to be, or could become, an exit 5.
  const cases: [string, string | null][] = [
    ["the real stream-json array", streamJson(RESULT)],
    ["no file at all", null],
    ["an empty file", ""],
    ["truncated json", '[{"type":"result","total_cost_usd":'],
    ["an array with no result message", '[{"type":"system"}]'],
    ["a json scalar", "42"],
  ];

  for (const [label, fileText] of cases) {
    it(`exits 0 on ${label}`, () => {
      expect(runCli([], fileText).status).toBe(0);
    });
  }

  it("exits 0 on the failure-diagnostic path too", () => {
    expect(runCli(["--envelope"], null).status).toBe(0);
  });

  it("still prints a line for a session that died before Claude Code ran", () => {
    const { stdout } = runCli([], null);
    expect(stdout).toContain("no execution-output.json (died before Claude Code ran)");
  });
});

describe("the notice line the spend circuit breaker parses", () => {
  // Producer → real consumer. Both sides used to be pinned only by a hand-written fixture string
  // in research-circuit-breaker.spec.ts, which is why a producer that emitted NOTHING for two days
  // broke no test.
  it("totals through recentResearchSpend exactly as written", () => {
    const log = [
      costNotice("alpha", sessionCost(streamJson({ ...RESULT, total_cost_usd: 3.25 }))),
      costNotice("beta", sessionCost(streamJson({ ...RESULT, total_cost_usd: 1.1 }))),
    ].join("\n");

    const spend = recentResearchSpend({
      windowHours: 24,
      exec: (_cmd: string, args: readonly string[]) => {
        if (args[1] === "list")
          return JSON.stringify([
            { databaseId: 1, createdAt: new Date().toISOString(), status: "completed" },
          ]);
        return log;
      },
    });

    expect(spend).toBeCloseTo(4.35, 5);
  });

  it("keeps a tiny cost in plain decimal, because the breaker's regex cannot read 1e-7", () => {
    const notice = costNotice("tiny", sessionCost(streamJson({ total_cost_usd: 1e-7 })));
    expect(notice).not.toContain("e-7");
    expect(/usd=([\d.]+)/.exec(notice)?.[1]).toBe("0.000000");
  });

  it("writes one step-summary row per leg", () => {
    const row = costSummaryRow("nvda-2026-09-30-print", sessionCost(streamJson(RESULT)));
    expect(row).toBe(
      "- `nvda-2026-09-30-print` — **$1.2345** · 37 turns · 412345ms · is_error=false",
    );
  });
});

describe("the failure diagnostic prints the envelope, never the transcript", () => {
  // The `cat`-the-whole-file step has been dumping entire stream-json conversations into the logs
  // of a PUBLIC repo since 2026-09-09, while its own comment claimed it printed "just the terminal
  // result envelope". Same wrong shape assumption, same root cause.
  it("drops the conversation and keeps the result fields", () => {
    const transcript = [
      {
        type: "assistant",
        message: { content: [{ type: "text", text: "SECRET-TRANSCRIPT-TEXT" }] },
      },
      { type: "user", message: { content: "SECRET-TOOL-RESULT" } },
    ];
    const text = resultEnvelopeText(streamJson({ ...RESULT, is_error: true }, transcript));

    expect(text).not.toContain("SECRET-TRANSCRIPT-TEXT");
    expect(text).not.toContain("SECRET-TOOL-RESULT");
    expect(text).toContain('"is_error": true');
    expect(text).toContain('"total_cost_usd": 1.2345');
  });

  it("says so plainly when there is no envelope to print", () => {
    expect(resultEnvelopeText(null)).toContain("no result envelope");
  });
});
