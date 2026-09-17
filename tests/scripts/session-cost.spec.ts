import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { recentResearchSpend } from "../../scripts/moneypenny/circuit-breaker.mjs";

// THE COST METER (#2979), after run 35212702833 turned it red on all six matrix legs (issue #3215).
//
// Driven through the real entrypoint the way every script spec here works. The meter used to be
// inline jq reading the execution-output file as an OBJECT; the action writes an ARRAY of every
// stream-json message (`JSON.stringify(messages)`), so `jq -r '.total_cost_usd'` exited 5 and
// `bash -e` failed a job whose research session had SUCCEEDED.
//
// What these specs pin, in order of what each one costs when it breaks:
//   - the ARRAY shape is read correctly — the actual regression;
//   - exit 0 on EVERY input, including the broken ones — a meter must never be a gate;
//   - the emitted line still parses in the spend circuit breaker's own parser (the breaker is run
//     here for real, over this meter's real output). That coupling is why the bug was expensive
//     rather than merely loud: no line meant $0 spend, and a $0 total cannot trip a dollar ceiling.
const RESULT = {
  type: "result",
  subtype: "success",
  is_error: false,
  duration_ms: 556_373,
  num_turns: 47,
  total_cost_usd: 4.2317,
  session_id: "abc",
};

/** The file as claude-code-action actually writes it: init, the transcript, then one result. */
const streamFile = (result: unknown = RESULT) =>
  JSON.stringify([
    { type: "system", subtype: "init", session_id: "abc" },
    { type: "assistant", message: { content: [{ type: "text", text: "researching" }] } },
    { type: "user", message: { content: [{ type: "tool_result", content: "ok" }] } },
    ...(result ? [result] : []),
  ]);

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "session-cost-"));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

/** Runs the meter exactly as the workflow shim does. Returns stdout, the summary file's contents,
 *  and the exit status — the status matters as much as the text. */
function meter(payload: string | null, { id = "fomc-2026-09-16", args = [] as string[] } = {}) {
  const file = join(dir, "claude-execution-output.json");
  if (payload !== null) writeFileSync(file, payload);
  const summary = join(dir, "summary.md");
  writeFileSync(summary, "");
  let status = 0;
  let stdout = "";
  try {
    stdout = execFileSync("node", ["scripts/session-cost.mjs", ...args], {
      encoding: "utf8",
      env: {
        ...process.env,
        EVENT_ID: id,
        RESULT_FILE: file,
        GITHUB_STEP_SUMMARY: summary,
      },
    });
  } catch (err) {
    status = (err as { status: number }).status;
    stdout = (err as { stdout: string }).stdout ?? "";
  }
  return { stdout: stdout.trim(), summary: readFileSync(summary, "utf8").trim(), status };
}

describe("session cost meter — the array shape", () => {
  it("reads total_cost_usd out of the stream-json ARRAY (the run 35212702833 regression)", () => {
    const { stdout, status } = meter(streamFile());
    expect(status).toBe(0);
    expect(stdout).toBe(
      "::notice::cost — event=fomc-2026-09-16 usd=4.2317 turns=47 duration_ms=556373 is_error=false",
    );
  });

  it("writes the per-leg step-summary row", () => {
    expect(meter(streamFile()).summary).toBe(
      "- `fomc-2026-09-16` — **$4.2317** · 47 turns · 556373ms · is_error=false",
    );
  });

  it("takes the LAST result message when a session emitted more than one", () => {
    const payload = JSON.stringify([
      { type: "system", subtype: "init" },
      { ...RESULT, total_cost_usd: 1.5 },
      { ...RESULT, total_cost_usd: 9.75, num_turns: 91 },
    ]);
    expect(meter(payload).stdout).toContain("usd=9.75 turns=91");
  });

  it("still reads a bare result OBJECT — the `--output-format json` shape", () => {
    // The action could write either shape tomorrow; neither may cost a job.
    expect(meter(JSON.stringify(RESULT)).stdout).toContain("usd=4.2317");
  });

  it("reports an errored session honestly rather than hiding it", () => {
    const payload = streamFile({ ...RESULT, is_error: true, subtype: "error_max_turns" });
    expect(meter(payload).stdout).toContain("is_error=true");
  });
});

describe("session cost meter — a meter is never a gate", () => {
  it.each([
    ["a missing file", null, "no execution-output.json"],
    ["malformed JSON", "{not json", "unreadable result envelope"],
    ["an array with no result message", streamFile(null), "no result message"],
    ["a JSON scalar", "42", "unreadable result envelope"],
    ["an empty file", "", "unreadable result envelope"],
  ])("exits 0 and says why on %s", (_case, payload, expected) => {
    const { status, stdout, summary } = meter(payload as string | null);
    expect(status).toBe(0); // `if: always()` + `bash -e`: any non-zero here fails a green job.
    expect(stdout).toContain(expected);
    expect(summary).toContain(expected);
  });

  it("names fields it cannot find as `?` instead of inventing a zero", () => {
    // `usd=0` would be a LIE the circuit breaker would happily add to its running total.
    const { stdout, status } = meter(streamFile({ type: "result" }));
    expect(status).toBe(0);
    expect(stdout).toContain("usd=? turns=? duration_ms=? is_error=?");
  });
});

describe("session cost meter — the spend circuit breaker reads what this writes", () => {
  it("emits a line the breaker's own parser totals (#2946's dollar ceiling)", () => {
    const log = [meter(streamFile()).stdout, meter(streamFile(), { id: "cpi-2026-09-10" }).stdout]
      .map((line) => `2026-09-17T11:02:59Z research\t${line}`)
      .join("\n");
    const spend = recentResearchSpend({
      windowHours: 24,
      exec: (_cmd: string, args: readonly string[]) =>
        args[1] === "list"
          ? JSON.stringify([
              { databaseId: 35212702833, createdAt: new Date().toISOString(), status: "completed" },
            ])
          : log,
    });
    expect(spend).toBeCloseTo(8.4634, 4);
  });

  it("contributes nothing — never a bogus $0 — when the cost is unknown", () => {
    const log = `2026-09-17T11:02:59Z research\t${meter(null).stdout}`;
    const spend = recentResearchSpend({
      windowHours: 24,
      exec: (_cmd: string, args: readonly string[]) =>
        args[1] === "list"
          ? JSON.stringify([
              { databaseId: 1, createdAt: new Date().toISOString(), status: "completed" },
            ])
          : log,
    });
    expect(spend).toBe(0);
  });
});

describe("session cost meter — the failure dump is the envelope, not the transcript", () => {
  it("prints only the result message with --dump", () => {
    const { stdout, status } = meter(streamFile(), { args: ["--dump"] });
    expect(status).toBe(0);
    expect(JSON.parse(stdout)).toEqual(RESULT);
    // The whole point: the conversation the action's security note is about stays out of the log.
    expect(stdout).not.toContain("researching");
  });

  it("explains itself instead of printing nothing when there is no envelope", () => {
    expect(meter(null, { args: ["--dump"] }).stdout).toBe(
      "(no execution-output.json (died before Claude Code ran))",
    );
  });
});
