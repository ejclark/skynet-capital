import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "@rstest/core";

// #5955: Eric's one paste to revive the stopped bots machine. Driven end to end against a stub
// `fly` first on PATH (no network, no Fly account): the stub keeps the machine's state in a file,
// records every call, and plays one of three scenarios. The stakes the specs pin: a deliberate halt
// is NEVER started, a crash loop never reads as OK, and nothing a token-shaped env var holds is
// ever echoed.
const SCRIPT = resolve("scripts/bots-revive.sh");
const TOKEN = "fo1_SECRET_TOKEN_MUST_NOT_LEAK";

// Scenario files under $STUB: state (stopped|started), scenario (revive|crash|halt|noauth),
// logs (what `fly logs -n` returns), pid (the stamp's pid, bumped per read in a crash loop).
const STUB_FLY = `#!/usr/bin/env bash
S="$STUB"; echo "$*" >> "$S/calls"
scenario=$(cat "$S/scenario"); state=$(cat "$S/state")
case "$1 $2" in
  "auth whoami") [[ $scenario == noauth ]] && exit 1; echo eric@example.test ;;
  "machine list")
    meta='{}'; [[ $scenario == halt ]] && meta='{"skynet-halt":"eric paused 10-26"}'
    cat <<JSON
[{"id":"standby1","state":"stopped","config":{"standbys":["8749d4c072d908"],"env":{}}},
 {"id":"8749d4c072d908","state":"$state","config":{"env":{"GIT_SHA":"0123456789abcdef"},"metadata":$meta},
  "events":[{"type":"exit","status":"stopped","source":"flyd","timestamp":1,
             "request":{"exit_event":{"exit_code":$([[ $scenario == crash ]] && echo 134 || echo 0),"oom_killed":false,"requested_stop":$([[ $scenario == crash ]] && echo false || echo true)}}}]}]
JSON
    ;;
  "machine status") echo "Machine ID: $3"; echo "State: $state" ;;
  "machine start") echo started > "$S/state"; date -u +%Y-%m-%dT%H:%M:%S.123Z > "$S/booted"; echo "$3 has been started" ;;
  "machine exec")
    [[ $state == started ]] || exit 1
    pid=$(cat "$S/pid"); [[ $scenario == crash ]] && echo $((pid + 1)) > "$S/pid"
    echo "{\\"gitSha\\":\\"0123456789abcdef\\",\\"pid\\":$pid,\\"bootedAt\\":\\"$(cat "$S/booted")\\",\\"bridge\\":\\"armed\\",\\"updatedAt\\":\\"x\\"}"
    ;;
  "logs -a") cat "$S/logs" ;;
  *) echo "stub fly: unhandled $*" >&2; exit 2 ;;
esac
`;

const OOM_LOGS = [
  "2026-10-26T15:00:01Z app[8749d4c072d908] ord [info] Autonomous trading started [live] — bots: Sauron",
  "2026-10-26T15:00:06Z app[8749d4c072d908] ord [info] FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory",
  "2026-10-26T15:00:06Z app[8749d4c072d908] ord [info] INFO Main child exited normally with code: 134",
  "2026-10-26T15:00:07Z app[8749d4c072d908] ord [info] INFO Starting init (commit: 1234)",
].join("\n");
const QUIET_LOGS = [
  "2026-10-26T15:00:01Z runner[8749d4c072d908] ord [info] Pulling container image",
  "2026-10-26T15:00:02Z runner[8749d4c072d908] ord [info] Configuring firecracker",
].join("\n");

function run(scenario: "revive" | "crash" | "halt" | "noauth", logs = QUIET_LOGS) {
  const dir = mkdtempSync(join(tmpdir(), "bots-revive-"));
  const bin = join(dir, "bin");
  spawnSync("mkdir", ["-p", bin]);
  writeFileSync(join(bin, "fly"), STUB_FLY);
  chmodSync(join(bin, "fly"), 0o755);
  writeFileSync(join(dir, "scenario"), scenario);
  writeFileSync(join(dir, "state"), "stopped");
  writeFileSync(join(dir, "logs"), logs);
  writeFileSync(join(dir, "pid"), "42");
  writeFileSync(join(dir, "booted"), "2020-01-01T00:00:00.000Z"); // the stale stamp on the volume
  writeFileSync(join(dir, "calls"), "");
  const res = spawnSync("bash", [SCRIPT], {
    encoding: "utf8",
    env: {
      PATH: `${bin}:${process.env.PATH ?? ""}`,
      STUB: dir,
      FLY_API_TOKEN: TOKEN,
      BOTS_HOLD_SECS: "0",
      BOTS_POLL_SECS: "0",
      BOTS_START_WAIT_SECS: "0",
    },
  });
  const out = `${res.stdout}${res.stderr}`;
  const lines = res.stdout.trim().split("\n");
  return {
    status: res.status,
    out,
    last: lines[lines.length - 1] ?? "",
    calls: readFileSync(join(dir, "calls"), "utf8"),
  };
}

describe("bots-revive.sh", () => {
  it("starts a stopped primary, holds it, and pastes back OK with the sha and boot time", () => {
    const r = run("revive");
    expect(r.last).toMatch(/^BOTS-REVIVE: OK 0123456789ab started \d{4}-\d\d-\d\dT[\d:.]+Z$/);
    expect(r.status).toBe(0);
    expect(r.calls).toContain("machine start 8749d4c072d908 -a skynet-capital-bots");
    expect(r.calls).not.toContain("machine start standby1"); // the standby is never touched
    // The hold check read the stamp twice — a one-shot read would miss a crash loop.
    expect(r.calls.match(/machine exec/g)?.length).toBeGreaterThanOrEqual(2);
    expect(r.out).toContain("verdict: stopped on request");
  });

  it("calls a crash loop a CRASH, names the signature and prints the telling lines", () => {
    const r = run("crash", OOM_LOGS);
    expect(r.last).toBe("BOTS-REVIVE: CRASH heap-oom");
    expect(r.status).toBe(1);
    expect(r.out).toContain("verdict: crash — heap-oom");
    expect(r.out).toContain("JavaScript heap out of memory");
    expect(r.out).toContain("changed or unreadable (restart)");
  });

  it("leaves a machine marked as a deliberate halt stopped and says so", () => {
    const r = run("halt");
    expect(r.last).toBe("BOTS-REVIVE: HALTED-DELIBERATELY eric paused 10-26");
    expect(r.status).toBe(3);
    expect(r.calls).not.toContain("machine start");
  });

  it("stops at NO-AUTH before touching the machine when fly is not logged in", () => {
    const r = run("noauth");
    expect(r.last).toBe("BOTS-REVIVE: NO-AUTH");
    expect(r.calls.trim()).toBe("auth whoami");
  });

  it("never prints the token, in any scenario", () => {
    for (const s of ["revive", "crash", "halt", "noauth"] as const) {
      expect(run(s, OOM_LOGS).out).not.toContain(TOKEN);
    }
  });
});
