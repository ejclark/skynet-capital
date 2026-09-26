import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// The duel-log hook records fan-out, fan-in and intent events for eval mining. Its contract is that
// it never blocks the session — exit 0 whatever happens. Honest degradation (#3769 row 1) keeps
// that contract but refuses the quiet half of it: an event that could not be recorded is named.
const SCRIPT = fileURLToPath(new URL("../../scripts/duel-log.mjs", import.meta.url));

function hook(kind: string, input: string, cwd: string) {
  return spawnSync("node", [SCRIPT, kind], { cwd, input, encoding: "utf8" });
}

describe("duel-log hook", () => {
  let dir = "";
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "duel-log-"));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("appends one event and says nothing when the payload is readable", () => {
    const res = hook("intent", JSON.stringify({ session_id: "s1", prompt: "hello" }), dir);
    expect(res.status).toBe(0);
    expect(res.stderr).toBe("");
    const line = JSON.parse(readFileSync(join(dir, "data/duel-log.jsonl"), "utf8").trim());
    expect(line).toMatchObject({ kind: "intent", session: "s1", prompt: "hello" });
  });

  it("still exits 0 on a malformed payload, but names the dropped event", () => {
    const res = hook("fanout", "not json", dir);
    expect(res.status).toBe(0);
    expect(res.stderr).toContain("· duel-log: dropped fanout event");
    expect(existsSync(join(dir, "data/duel-log.jsonl"))).toBe(false);
  });

  it("names the drop when the log cannot be written", () => {
    // `data` as a plain file makes the mkdir/append fail.
    writeFileSync(join(dir, "data"), "");
    const res = hook("intent", JSON.stringify({ prompt: "x" }), dir);
    expect(res.status).toBe(0);
    expect(res.stderr).toContain("· duel-log: dropped intent event");
  });
});
