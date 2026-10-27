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

// Scenario files under $STUB: state (stopped|started), scenario (revive|crash|silentcrash|halt|
// noauth), logs (what `fly logs -n` returns), pid (the stamp's pid, bumped per read in a crash
// loop), bridge (the stamp's bridge field). silentcrash is #6281's window: the process dies and Fly
// restarts it, but the new one has not stamped yet, so every read returns the dead one's stamp
// unchanged — only Fly's own events (a later exit, appended after the first read) show the restart.
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
             "request":{"exit_event":{"exit_code":$([[ $scenario == crash ]] && echo 134 || echo 0),"oom_killed":false,"requested_stop":$([[ $scenario == crash ]] && echo false || echo true)}}}$(cat "$S/events" 2>/dev/null)]}]
JSON
    ;;
  "machine status") echo "Machine ID: $3"; echo "State: $state" ;;
  "machine start") echo started > "$S/state"; date -u +%Y-%m-%dT%H:%M:%S.123Z > "$S/booted"; echo "$3 has been started" ;;
  "machine exec")
    [[ $state == started ]] || exit 1
    pid=$(cat "$S/pid"); [[ $scenario == crash ]] && echo $((pid + 1)) > "$S/pid"
    [[ $scenario == silentcrash ]] && echo ',{"type":"exit","status":"stopped","source":"flyd","timestamp":2,"request":{"exit_event":{"exit_code":1}}},{"type":"start","status":"started","source":"flyd","timestamp":3}' > "$S/events"
    echo "{\\"gitSha\\":\\"0123456789abcdef\\",\\"pid\\":$pid,\\"bootedAt\\":\\"$(cat "$S/booted")\\",\\"bridge\\":\\"$(cat "$S/bridge")\\",\\"updatedAt\\":\\"x\\"}"
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
const BOOT_ERROR_LOGS = [
  "2026-10-27T01:38:30Z app[8749d4c072d908] ord [info] [controls] bridge armed — controls fetched",
  "2026-10-27T01:38:40Z app[8749d4c072d908] ord [info] Autonomous trading failed: Error: boom",
].join("\n");
const STALE_ARMED_LOGS = [
  "2026-10-21T14:00:01Z app[8749d4c072d908] ord [info] [controls] bridge armed — controls fetched",
  "2026-10-27T01:38:31Z app[8749d4c072d908] ord [warn] [controls] bridge configured but UNREACHABLE",
].join("\n");

function run(
  scenario: "revive" | "crash" | "silentcrash" | "halt" | "noauth",
  logs = QUIET_LOGS,
  bridge = "armed",
) {
  const dir = mkdtempSync(join(tmpdir(), "bots-revive-"));
  const bin = join(dir, "bin");
  spawnSync("mkdir", ["-p", bin]);
  writeFileSync(join(bin, "fly"), STUB_FLY);
  chmodSync(join(bin, "fly"), 0o755);
  writeFileSync(join(dir, "scenario"), scenario);
  writeFileSync(join(dir, "state"), "stopped");
  writeFileSync(join(dir, "logs"), logs);
  writeFileSync(join(dir, "pid"), "42");
  writeFileSync(join(dir, "bridge"), bridge);
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

  // #6281: the dead process's stamp sits on the volume until the restarted one writes, so two
  // identical reads can straddle a crash. Fly's own exit/start events are what catch it.
  it("calls a restart between the two reads a CRASH even when the stamp never changed", () => {
    const r = run("silentcrash", BOOT_ERROR_LOGS);
    expect(r.last).toBe("BOTS-REVIVE: CRASH boot-error");
    expect(r.status).toBe(1);
    expect(r.out).toContain("stamp steady, Fly recorded a restart during the hold");
  });

  // #6281: a quiet process keeps an OLD boot's "armed" line inside `fly logs -n`; the fresh stamp
  // is the only witness for this process, so it alone decides.
  it("pastes back UNARMED when the fresh stamp says unreachable, whatever old logs say", () => {
    const r = run("revive", STALE_ARMED_LOGS, "unreachable");
    expect(r.last).toMatch(/^BOTS-REVIVE: UNARMED 0123456789ab started /);
    expect(r.status).toBe(5);
    expect(r.out).toContain("controls bridge is unreachable");
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
