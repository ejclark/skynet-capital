import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "@rstest/core";

// THE PUBLIC LOG (2026-11-01, found in passing by #6470's study). The research lane's "surface the
// swallowed result" step printed `claude-execution-output.json` whole into a failed leg's run log.
// That file is the SDK's full streamed message array, so a public repo's Actions log carried every
// assistant turn of the failed session — exactly what the step's own comment said it would not do.
//
// The workflow is text CI cannot run, so its shape is pinned by reading the YAML, the way
// tests/arch/workflows.spec.ts reads it: the step must filter with jq to the `result` and
// `rate_limit_event` messages, and nothing in the file may `cat` that path.
const WORKFLOW = ".github/workflows/moneypenny-events.yml";
const RESULT_FILE = "claude-execution-output.json";

/** The one step's `run:` block, by its name. */
function stepBody(text: string, name: string): string {
  const at = text.indexOf(`name: ${name}`);
  expect(at, `${WORKFLOW} must still carry the step "${name}"`).toBeGreaterThan(-1);
  const rest = text.slice(at);
  const next = rest.indexOf("\n      - ", 1);
  return next === -1 ? rest : rest.slice(0, next);
}

describe("the swallowed-result step prints the envelope, never the transcript", () => {
  const text = readFileSync(WORKFLOW, "utf8");
  const step = stepBody(text, "Surface the swallowed Claude result on failure");

  it("filters the file with jq to result and rate_limit_event messages", () => {
    expect(step).toContain("jq");
    expect(step).toContain('.type == "result"');
    expect(step).toContain('.type == "rate_limit_event"');
  });

  it("never cats the execution output anywhere in the workflow", () => {
    const cats = text.split("\n").filter((l) => /\bcat\b/.test(l) && l.includes(RESULT_FILE));
    expect(cats).toEqual([]);
  });

  // The filter is a jq program inside YAML; run the exact text against a message array of the
  // SDK's shape, so the step is proven to drop an assistant turn, not just to mention jq.
  it("drops an assistant turn and keeps the result and the limit event, on the real jq program", () => {
    const program = /jq -c '([^']+)'/.exec(step)?.[1];
    expect(program, "the step must call jq with a single-quoted program").toBeTruthy();
    const dir = mkdtempSync(join(tmpdir(), "lane-log-"));
    const file = join(dir, RESULT_FILE);
    writeFileSync(
      file,
      JSON.stringify([
        { type: "system", subtype: "init", session_id: "s" },
        { type: "assistant", message: { content: [{ type: "text", text: "SECRET TRANSCRIPT" }] } },
        {
          type: "rate_limit_event",
          rate_limit_info: { unifiedWindows: { seven_day: { utilization: 0.42 } } },
        },
        { type: "result", is_error: true, total_cost_usd: 1.5, num_turns: 3 },
      ]),
    );
    try {
      const out = execFileSync("jq", ["-c", program as string, file], { encoding: "utf8" });
      expect(out).not.toContain("SECRET TRANSCRIPT");
      expect(out).toContain('"type":"result"');
      expect(out).toContain('"type":"rate_limit_event"');
      expect(out.trim().split("\n")).toHaveLength(2);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
