import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "@rstest/core";

// #5955. Driven against stub `fly` and `gh`: a stopped machine starts unless a person marked the
// stop, and a machine that keeps dying stops being restarted. The live machine is never stopped to
// test this, so these specs are the proof of the stopped path until a real stop occurs.
const SCRIPT = resolve("scripts/bots-start-stopped.sh");

const STUB_FLY = `#!/usr/bin/env bash
S="$STUB"; echo "$*" >> "$S/fly-calls"
case "$1 $2" in
  "machine list")
    cat <<JSON
[{"id":"standby1","state":"stopped","config":{"standbys":["m1"]}},
 {"id":"m1","state":"$(cat "$S/state")","config":{"metadata":$(cat "$S/meta")},
  "events":[{"type":"exit","timestamp":5,"request":{"exit_event":{"exit_code":137,"oom_killed":true}}}]}]
JSON
    ;;
  "machine start")
    [[ -f "$S/refuse" ]] && exit 1
    [[ -f "$S/never" ]] || echo started > "$S/state" ;;
  "logs -a") printf 'member@example.test rejected\nheap out of memory\n' ;;
esac
`;

const STUB_GH = `#!/usr/bin/env bash
S="$STUB"; echo "$*" >> "$S/gh-calls"
case "$1 $2" in
  "issue list") [[ -f "$S/issue" ]] && cat "$S/issue" ;;
  "issue view") cat "$S/recent" ;;
esac
exit 0
`;

function fixture(state: string, meta = "{}") {
  const stub = mkdtempSync(join(tmpdir(), "bots-start-"));
  writeFileSync(join(stub, "state"), state);
  writeFileSync(join(stub, "meta"), meta);
  for (const [name, body] of [
    ["fly", STUB_FLY],
    ["gh", STUB_GH],
  ] as const) {
    writeFileSync(join(stub, name), body);
    chmodSync(join(stub, name), 0o755);
  }
  return stub;
}

function run(stub: string, ...args: string[]) {
  return spawnSync("bash", [SCRIPT, "bots-app", ...args], {
    encoding: "utf8",
    env: {
      ...process.env,
      STUB: stub,
      FLY_BIN: join(stub, "fly"),
      GH_BIN: join(stub, "gh"),
      BOTS_START_WAIT_SECS: "1",
      BOTS_POLL_SECS: "1",
    },
  });
}

const flyCalls = (stub: string) => readFileSync(join(stub, "fly-calls"), "utf8");
const ghCalls = (stub: string) =>
  existsSync(join(stub, "gh-calls")) ? readFileSync(join(stub, "gh-calls"), "utf8") : "";

describe("bots-start-stopped", () => {
  it("starts a stopped primary, never the standby", () => {
    const stub = fixture("stopped");
    expect(run(stub).status).toBe(0);
    expect(flyCalls(stub)).toContain("machine start m1");
    expect(flyCalls(stub)).not.toContain("machine start standby1");
    expect(readFileSync(join(stub, "state"), "utf8").trim()).toBe("started");
  });

  it("leaves a running machine alone", () => {
    const stub = fixture("started");
    expect(run(stub).status).toBe(0);
    expect(flyCalls(stub)).not.toContain("machine start");
  });

  it("always respects a stop a person marked", () => {
    const stub = fixture("stopped", '{"skynet-halt":"eric paused"}');
    const res = run(stub, "--report");
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("deliberately halted");
    expect(flyCalls(stub)).not.toContain("machine start");
    expect(ghCalls(stub)).toBe("");
  });

  it("fails when fly refuses, so a release cannot read green over a dead fleet", () => {
    const stub = fixture("stopped");
    writeFileSync(join(stub, "refuse"), "");
    expect(run(stub).status).toBe(1);
  });

  it("fails when the machine never reaches started", () => {
    const stub = fixture("stopped");
    writeFileSync(join(stub, "never"), "");
    expect(run(stub).status).toBe(1);
  });

  it("files the exit record and a named cause, never a log line, because this repo is public", () => {
    const stub = fixture("stopped");
    expect(run(stub, "--report").status).toBe(0);
    const calls = ghCalls(stub);
    expect(calls).toContain("issue create");
    expect(calls).toContain("oom_killed");
    expect(calls).toContain("heap-oom");
    expect(calls).not.toContain("member@example.test");
    expect(calls).not.toContain("heap out of memory");
    expect(flyCalls(stub)).toContain("machine start m1");
  });

  it("comments on the open issue instead of filing another", () => {
    const stub = fixture("stopped");
    writeFileSync(join(stub, "issue"), "42");
    writeFileSync(join(stub, "recent"), "1");
    expect(run(stub, "--report").status).toBe(0);
    expect(ghCalls(stub)).toContain("issue comment 42");
    expect(ghCalls(stub)).not.toContain("issue create");
  });

  it("stops restarting a machine that keeps dying", () => {
    const stub = fixture("stopped");
    writeFileSync(join(stub, "issue"), "42");
    writeFileSync(join(stub, "recent"), "3");
    const res = run(stub, "--report");
    expect(res.status).toBe(3);
    expect(res.stdout).toContain("budget spent");
    expect(flyCalls(stub)).not.toContain("machine start");
  });

  it("does not spend the budget or file anything on a deploy", () => {
    const stub = fixture("stopped");
    writeFileSync(join(stub, "issue"), "42");
    writeFileSync(join(stub, "recent"), "9");
    expect(run(stub).status).toBe(0);
    expect(ghCalls(stub)).toBe("");
  });
});
