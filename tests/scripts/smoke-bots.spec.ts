import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "@rstest/core";

// scripts/smoke-bots.sh driven end to end against a stub `flyctl` on PATH, so the real bash, the
// real jq filters and the real exit codes are what is under test.
//
// PROVENANCE (#6004, #5955): the only green bots smoke in 72h (run 40152435829, 2026-10-25) passed
// a boot that OOM'd ~5s later — the script exited 0 the first moment both checks held and never
// looked again. Each case below is one way a boot can read healthy once and not stay up.
//
// The stub serves `<kind>.<n>` on the n-th call of that kind (list | exec | logs), else `<kind>`,
// else fails — so a spec scripts the exact sequence of reads. With a pass on attempt 1 the calls
// run: list 1 (machine_ok), list 2 + exec 1 (health_stamped), [logs 1 when the stamp fails],
// then the hold's first read (list 3, exec 2) and second read (list 4, exec 3).
const STUB = `#!/usr/bin/env bash
case "$1" in
  machine) kind="$2" ;;
  logs) kind=logs ;;
  *) exit 2 ;;
esac
n=$(( $(cat "$STUB_DIR/$kind.n" 2>/dev/null || echo 0) + 1 ))
echo "$n" > "$STUB_DIR/$kind.n"
for f in "$STUB_DIR/$kind.$n" "$STUB_DIR/$kind"; do
  [[ -e "$f" ]] && { cat "$f"; exit 0; }
done
exit 1
`;

const SHA = "abc1234";
const MARKER = "[controls] bridge armed — controls fetched";

const machine = (over: { state?: string; sha?: string; id?: string; lastEvent?: number } = {}) =>
  JSON.stringify([
    {
      id: over.id ?? "m1",
      state: over.state ?? "started",
      config: { env: { GIT_SHA: over.sha ?? SHA } },
      events: [{ type: "start", status: "started", timestamp: over.lastEvent ?? 1000 }],
    },
    // a standby never counts as the primary
    { id: "s1", state: "stopped", config: { env: { GIT_SHA: SHA }, standbys: ["m1"] }, events: [] },
  ]);

const stamp = (over: Partial<Record<string, unknown>> = {}) =>
  JSON.stringify({
    gitSha: SHA,
    pid: 42,
    bootedAt: "2026-10-26T10:00:00.000Z",
    bridge: "armed",
    lastControlsPollAt: "2026-10-26T10:00:01.000Z",
    restored: null,
    updatedAt: "2026-10-26T10:00:01.000Z",
    ...over,
  });

const dirs: string[] = [];
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

function smoke(files: Record<string, string>, env: Record<string, string> = {}) {
  const dir = mkdtempSync(join(tmpdir(), "smoke-bots-"));
  dirs.push(dir);
  writeFileSync(join(dir, "flyctl"), STUB);
  chmodSync(join(dir, "flyctl"), 0o755);
  for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, name), body);
  const run = spawnSync("bash", ["scripts/smoke-bots.sh", "skynet-capital-bots", SHA], {
    encoding: "utf8",
    env: {
      ...process.env,
      PATH: `${dir}:${process.env.PATH}`,
      STUB_DIR: dir,
      SMOKE_ATTEMPTS: "2",
      SMOKE_SLEEP: "0",
      SMOKE_HOLD: "0",
      ...env,
    },
  });
  return { code: run.status, out: run.stdout, err: run.stderr };
}

describe("smoke-bots.sh — a pass must hold, not just happen once", () => {
  it("passes a boot whose same process is still up after the hold", () => {
    const r = smoke({ list: machine(), exec: stamp() });
    expect(r.err).toBe("");
    expect(r.code).toBe(0);
    expect(r.out).toContain("PASS");
    expect(r.out).toContain("same process held");
  });

  it("fails a boot that restarts inside the machine during the hold (the #6004 OOM)", () => {
    const r = smoke({
      list: machine(),
      exec: stamp(),
      "exec.3": stamp({ pid: 77, bootedAt: "2026-10-26T10:00:06.000Z" }),
    });
    expect(r.code).toBe(1);
    expect(r.err).toContain("did not hold");
    expect(r.err).toContain("the process restarted");
  });

  it("fails a crash-looping machine even though it reads `started` on both reads", () => {
    const r = smoke({
      list: machine(),
      "list.4": machine({ lastEvent: 2000 }),
      exec: stamp(),
      "exec.3": "",
    });
    expect(r.code).toBe(1);
    expect(r.err).toContain("new event during the hold");
  });

  it("fails when the primary stops during the hold", () => {
    const r = smoke({ list: machine(), "list.4": machine({ state: "stopped" }), exec: stamp() });
    expect(r.code).toBe(1);
    expect(r.err).toContain("no longer started");
  });

  it("fails when the stamp goes unreadable during the hold", () => {
    const r = smoke({ list: machine(), exec: stamp(), "exec.3": "not json" });
    expect(r.code).toBe(1);
    expect(r.err).toContain("went unreadable");
  });

  it("routes the log-search fallback pass through the same hold — stable boot passes", () => {
    const r = smoke({ list: machine(), logs: MARKER });
    expect(r.code).toBe(0);
    expect(r.out).toContain("PASS");
  });

  it("routes the log-search fallback pass through the same hold — a restart fails", () => {
    const r = smoke({ list: machine(), "list.4": machine({ lastEvent: 2000 }), logs: MARKER });
    expect(r.code).toBe(1);
    expect(r.err).toContain("new event during the hold");
  });

  it("requires the stamp to advance only when a controls poll was due inside the hold", () => {
    const due = { SMOKE_HOLD: "1", SMOKE_POLL_SECONDS: "0" };
    const stale = smoke({ list: machine(), exec: stamp() }, due);
    expect(stale.code).toBe(1);
    expect(stale.err).toContain("no controls poll landed");

    const moved = stamp({
      updatedAt: "2026-10-26T10:00:31.000Z",
      lastControlsPollAt: "2026-10-26T10:00:31.000Z",
    });
    const live = smoke({ list: machine(), exec: stamp(), "exec.3": moved }, due);
    expect(live.err).toBe("");
    expect(live.code).toBe(0);
  });

  it("still fails a boot whose bridge never arms, naming the bridge", () => {
    const r = smoke({ list: machine(), exec: stamp({ bridge: "unreachable" }) });
    expect(r.code).toBe(1);
    expect(r.err).toContain("controls bridge never armed");
  });

  it("still fails a primary that never starts on the expected commit", () => {
    const r = smoke({ list: machine({ sha: "old0000" }), exec: stamp() });
    expect(r.code).toBe(1);
    expect(r.err).toContain("machine never reached started");
  });
});
