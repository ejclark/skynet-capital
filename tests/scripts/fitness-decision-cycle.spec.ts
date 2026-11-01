import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "@rstest/core";
import {
  CONTRACTS,
  judgeDecisionCycle,
  loadStallRule,
  parseDecisionLine,
  reportActions,
  // @ts-expect-error plain .mjs script, no declarations
} from "../../scripts/fitness.mjs";
import { BOT_STALL_AFTER_MS, botAlerts, sessionAt } from "../../src/alerts/bot-watch";
import { MARKET_CLOSURES } from "../../src/domain/market-calendar";

// The decision-cycle contract, #6470 (fitness skill, rep 2). WHILE the regular session is open, the
// bots shall keep making decisions, unless a person halted them. The six older contracts cannot see
// the 10-08 class: the machine started and polling while no decision had been made for days.
//
// The judge runs on the app's own stall rule and session clock. The wiring runs the real entrypoint
// under plain node against a stub fly that records its arguments and answers only the commands the
// probe may send, with Date.now pinned from outside by a preload, so the script itself has no clock
// seam to leave behind.
//
// Grading it (the stall rule and calendar files are read at run time, so the audit must copy them):
//   node scripts/fitness-audit.mjs --bugs <file> --spec tests/scripts/fitness-decision-cycle.spec.ts \
//     --with src/alerts/bot-watch.ts --with src/domain/market-session.ts \
//     --with src/domain/market-calendar.ts --with src/domain/intl-format.ts --with fly.bots.toml \
//     --with tests/fixtures/fitness/replay-2026-10-22.json --with scripts/deploy-lag.mjs
const SCRIPT = resolve("scripts/fitness.mjs");
const REPLAY = resolve("tests/fixtures/fitness/replay-2026-10-22.json");
const FLY_TOML = resolve("fly.bots.toml");

const MIN = 60_000;
const at = (text: string) => Date.parse(text);
const iso = (ms: number) => new Date(ms).toISOString();

// 2026 session times, all read against src/domain/market-calendar.ts by the real clock.
const THE_10_08 = at("2026-10-08T18:00:00Z"); // a Thursday, 14:00 ET, the day he asked
const FEED_DIED = at("2026-10-05T19:40:00Z"); // the Monday the lesson first observed it
const MONDAY_OPEN = at("2026-11-02T14:30:00Z"); // 09:30 EST, first session after the clocks changed
const LAST_FRIDAY_CLOSE = at("2026-10-30T19:59:00Z"); // 15:59 EDT
const SATURDAY = at("2026-11-07T16:00:00Z");
const THANKSGIVING = at("2026-11-26T16:00:00Z");
const EARLY_CLOSE = at("2026-11-27T18:00:00Z"); // 13:00 EST, the day after Thanksgiving
const MIDDAY = at("2026-11-03T17:00:00Z");
const PAST_THE_TABLE = at("2028-01-17T15:00:00Z"); // MLK day, a Monday the table does not list

const rule = {
  botAlerts,
  sessionAt,
  calendarEnds: MARKET_CLOSURES[MARKET_CLOSURES.length - 1]?.date,
};
const judge = (record: { at: number; halted?: boolean } | null, now: number) =>
  judgeDecisionCycle(record && { halted: false, bytes: 300, ...record }, now, rule);

describe("decision-cycle judge", () => {
  it("fails the 10-08 shape: a record days old in the middle of a session", () => {
    const verdict = judge({ at: FEED_DIED }, THE_10_08);
    expect(verdict.status).toBe("fail");
    expect(verdict.detail).toContain("no decision cycle");
  });

  it("fails every cycle throwing: runCycle catches the throw, so no record is ever written", () => {
    // The cycle watch counts these as completed, which is why this reads the journal and not it.
    expect(judge({ at: MIDDAY - 11 * MIN }, MIDDAY).status).toBe("fail");
  });

  it("fails the bots' own clock stuck closed: it reads only the exchange's calendar", () => {
    // marketClock.isOpen() false keeps maybeEvaluate returning early and the cycle watch quiet. The
    // last record is Friday's close, and the only clock that can say otherwise is this one.
    expect(judge({ at: LAST_FRIDAY_CLOSE }, MONDAY_OPEN + 10 * MIN).status).toBe("fail");
    expect(judge({ at: LAST_FRIDAY_CLOSE }, MIDDAY).status).toBe("fail");
  });

  it("holds the stall boundary: ten minutes fails, a millisecond less passes", () => {
    expect(judge({ at: MIDDAY - BOT_STALL_AFTER_MS }, MIDDAY).status).toBe("fail");
    expect(judge({ at: MIDDAY - BOT_STALL_AFTER_MS + 1 }, MIDDAY).status).toBe("pass");
    expect(judge({ at: MIDDAY - 15_000 }, MIDDAY).status).toBe("pass");
  });

  it("takes the stall from the app's rule, not a number of its own", () => {
    const stalled = {
      dedupeKey: "stalled:fleet:1",
      data: { quietMs: 3 * MIN },
    };
    const says = (alerts: unknown[]) => ({ ...rule, botAlerts: () => alerts });
    const fresh = { at: MIDDAY - 15_000, halted: false, bytes: 1 };
    expect(judgeDecisionCycle(fresh, MIDDAY, says([stalled])).status).toBe("fail");
    const old = { at: MIDDAY - 60 * MIN, halted: false, bytes: 1 };
    // Old but not stalled by the rule is the opening window's reading, whatever the age says.
    expect(judgeDecisionCycle(old, MIDDAY, says([])).status).toBe("pass");
  });

  it("judges only the stalled alert: a breaker's alert is not a stall", () => {
    const breaker = { dedupeKey: "halted:fleet:errors:2026-11-03", data: {} };
    const says = { ...rule, botAlerts: () => [breaker] };
    const fresh = { at: MIDDAY - 15_000, halted: false, bytes: 1 };
    expect(judgeDecisionCycle(fresh, MIDDAY, says).status).toBe("pass");
  });

  it("is quiet on a Saturday, on Thanksgiving, and after an early close, however old the record", () => {
    for (const now of [SATURDAY, THANKSGIVING, EARLY_CLOSE]) {
      expect(judge({ at: FEED_DIED }, now).status).toBe("quiet");
      expect(judge(null, now).status).toBe("quiet");
    }
  });

  it("still judges the last minute before an early close", () => {
    expect(judge({ at: FEED_DIED }, EARLY_CLOSE - MIN).status).toBe("fail");
    expect(judge({ at: EARLY_CLOSE - 2 * MIN }, EARLY_CLOSE - MIN).status).toBe("pass");
  });

  it("is quiet a minute before the open and judges from it", () => {
    expect(judge({ at: LAST_FRIDAY_CLOSE }, MONDAY_OPEN - MIN).status).toBe("quiet");
    expect(judge({ at: LAST_FRIDAY_CLOSE }, MONDAY_OPEN + 10 * MIN).status).toBe("fail");
  });

  it("gives the open its ten minutes as quiet, so a stall running for days does not close at 09:35", () => {
    // A pass here would close the open issue every morning and reopen it ten minutes later.
    expect(judge({ at: LAST_FRIDAY_CLOSE }, MONDAY_OPEN + 9 * MIN).status).toBe("quiet");
    expect(judge({ at: MONDAY_OPEN - 5 * MIN }, MONDAY_OPEN + 2 * MIN).status).toBe("quiet");
    expect(judge({ at: MONDAY_OPEN + MIN }, MONDAY_OPEN + 2 * MIN).status).toBe("pass");
  });

  it("reads no record as unknown, never as a pass: botAlerts itself calls that no claim", () => {
    expect(judge(null, MIDDAY).status).toBe("unknown");
    expect(botAlerts([{ botId: "b", name: "b", records: [] }], MIDDAY)).toEqual([]);
  });

  it("cannot age a future timestamp, but forgives what two clocks differ by", () => {
    expect(judge({ at: MIDDAY + 5 * MIN + 1 }, MIDDAY).status).toBe("unknown");
    expect(judge({ at: MIDDAY + 3 * 3_600_000 }, MIDDAY).status).toBe("unknown");
    expect(judge({ at: MIDDAY + 5 * MIN }, MIDDAY).status).toBe("pass");
  });

  it("reads a fresh halted record as quiet: the loop runs, and this contract does not judge a halt", () => {
    expect(judge({ at: MIDDAY - 15_000, halted: true }, MIDDAY).status).toBe("quiet");
  });

  it("KNOWN GAP: a breaker holds the fleet, and every evaluation failing ends up there", () => {
    // After 5 failed evaluations in a row (src/autonomous/safety.ts) the errors breaker trips and each
    // cycle writes a fresh halted record until someone resets it. A fleet deciding nothing reads
    // quiet here, never pass and never fail. The contract's `gap` field says so; a breaker-clear
    // contract is the fix, and it waits on the owner's call.
    const held = judge({ at: MIDDAY - 15_000, halted: true }, MIDDAY);
    expect(held.status).not.toBe("fail");
    expect(held.status).not.toBe("pass");
    const contract = CONTRACTS.find((c: { id: string }) => c.id === "decision-cycle");
    expect(contract.gap).toContain("breaker");
  });

  it("fails a stale halted record: a real halt keeps writing, so a silent one has stopped too", () => {
    expect(judge({ at: MIDDAY - 11 * MIN, halted: true }, MIDDAY).status).toBe("fail");
  });

  it("reads a date past the calendar table as unknown, not a holiday it cannot know", () => {
    expect(judge({ at: FEED_DIED }, PAST_THE_TABLE).status).toBe("unknown");
    expect(judge(null, PAST_THE_TABLE).status).toBe("unknown");
    expect(judge({ at: at("2027-12-30T15:00:00Z") - MIN }, at("2027-12-30T15:00:00Z")).status).toBe(
      "pass",
    );
  });

  it("keeps a standing stall's detail one shape as it ages, across the hour words too", () => {
    const shape = (text: string) => text.replace(/\d+/g, "N");
    const details = [11, 60, 65, 120, 390].map(
      (m) => judge({ at: MIDDAY - m * MIN }, MIDDAY + 0).detail,
    );
    // The app's title flips between "12 min" and "1 h 5 min", which would post a comment per flip.
    expect(new Set(details.map(shape)).size).toBe(1);
  });

  it("states how long, and prints the timestamp, the flag and a byte count and nothing else", () => {
    const { detail } = judgeDecisionCycle(
      { at: MIDDAY - 20 * MIN, halted: true, bytes: 4321 },
      MIDDAY,
      rule,
    );
    expect(detail).toContain("20 min");
    expect(detail).toContain(iso(MIDDAY - 20 * MIN));
    expect(detail).toContain("halted yes");
    expect(detail).toContain("4321 bytes");
    expect(judge({ at: MIDDAY - 20 * MIN }, MIDDAY).detail).toContain("halted no");
  });

  it("passes a healthy fleet at every tick for 66 days, and is quiet exactly when closed", () => {
    let passes = 0;
    for (let now = at("2026-11-01T00:00:00Z"); now < at("2027-01-06T00:00:00Z"); now += 15 * MIN) {
      const lastCycle = now - 20_000;
      const session = sessionAt(now);
      // The one open reading that is not a pass: a tick so early that no cycle has run yet.
      const expected = session && lastCycle >= session.openAt ? "pass" : "quiet";
      expect(judge({ at: lastCycle }, now).status).toBe(expected);
      if (expected === "pass") passes += 1;
    }
    expect(passes).toBeGreaterThan(1000);
  });
});

describe("decision-cycle record parser", () => {
  it("keeps the time, a flag for the halt and the size, and drops every other field", () => {
    const line = JSON.stringify({ at: 1000, halted: "owner: on holiday", personaId: "sauron" });
    expect(parseDecisionLine(`${line}\n`)).toEqual({
      at: 1000,
      halted: true,
      bytes: Buffer.byteLength(`${line}\n`),
    });
    expect(parseDecisionLine('{"at":1000}')).toEqual({ at: 1000, halted: false, bytes: 11 });
  });

  it("counts bytes, not characters", () => {
    expect(parseDecisionLine('{"at":1000,"n":"é"}')?.bytes).toBe(20);
  });

  it("returns nothing it cannot age", () => {
    for (const bad of [
      "",
      "not json",
      "Exit code: 1",
      '{"at":1000', // a torn final line, which a crash mid-append leaves
      "null",
      "[1,2]",
      "1000",
      "{}",
      '{"at":"2026-11-02T15:00:00Z"}',
      '{"at":null}',
      '{"at":0}',
      '{"at":-5}',
    ]) {
      expect(parseDecisionLine(bad)).toBeNull();
    }
  });
});

describe("decision-cycle reporting", () => {
  const contract = CONTRACTS.find((c: { id: string }) => c.id === "decision-cycle");
  const title = "[fitness] decision-cycle";
  const issue = { number: 7, title, body: "", lastComment: "" };

  it("opens one issue on a stall", () => {
    const stalled = { ...contract, ...judge({ at: FEED_DIED }, THE_10_08) };
    expect(reportActions([stalled], [])).toMatchObject([{ kind: "open" }]);
  });

  it("leaves the issue open when the session closes: a stall at 15:50 is not healed at 16:00", () => {
    const closed = { ...contract, ...judge({ at: FEED_DIED }, SATURDAY) };
    expect(reportActions([closed], [issue])).toEqual([]);
  });

  it("closes the issue on a real pass", () => {
    const passing = { ...contract, ...judge({ at: MIDDAY - 15_000 }, MIDDAY) };
    expect(reportActions([passing], [issue])).toMatchObject([{ kind: "close", number: 7 }]);
  });

  it("neither opens nor closes on a quiet halted record", () => {
    const held = { ...contract, ...judge({ at: MIDDAY - 15_000, halted: true }, MIDDAY) };
    expect(reportActions([held], [])).toEqual([]);
    expect(reportActions([held], [issue])).toEqual([]);
  });

  it("gives a persistent unknown one quiet issue of its own source, closed by a real read", () => {
    const blind = { ...contract, ...judge(null, MIDDAY) };
    expect(reportActions([blind], [])).toMatchObject([
      { kind: "open-blind", source: "the decision journal" },
    ]);
    const blindIssue = {
      number: 8,
      title: "[fitness] cannot read the decision journal",
      body: "",
      lastComment: "",
    };
    expect(reportActions([blind], [blindIssue])).toEqual([]);
    const closed = { ...contract, ...judge(null, SATURDAY) };
    expect(reportActions([closed], [blindIssue])).toEqual([]);
    const passing = { ...contract, ...judge({ at: MIDDAY - 15_000 }, MIDDAY) };
    expect(reportActions([passing], [blindIssue])).toMatchObject([
      { kind: "close-blind", number: 8 },
    ]);
  });

  // The 10-08 shape on the clock's real tick times: the clock did not exist on 10-08, so the ticks
  // are the 10-22 to 10-25 run the older replay holds, which spans two sessions and a weekend.
  const ticks = (JSON.parse(readFileSync(REPLAY, "utf8")) as { ticks: string[] }).ticks.map(at);

  /** One contract's verdicts tick by tick through reportActions, playing GitHub's part. */
  function replay(recordAt: (tick: number) => number) {
    const verdicts = ticks.map((tick) => ({
      tick,
      r: { ...contract, ...judge({ at: recordAt(tick) }, tick) },
    }));
    const tally = { opens: 0, comments: 0, closes: 0 };
    let open: typeof issue | null = null;
    for (const { r } of verdicts) {
      const kinds = reportActions([r], open ? [open] : []).map((a: { kind: string }) => a.kind);
      tally.comments += kinds.filter((kind: string) => kind === "comment").length;
      if (kinds.includes("open")) {
        tally.opens++;
        open = { ...issue, body: `**What failed:** ${r.detail}.` };
      }
      if (kinds.includes("close")) {
        tally.closes++;
        open = null;
      }
    }
    return { ...tally, firstFail: verdicts.find((v) => v.r.status === "fail")?.tick };
  }

  it("replays a stall across two sessions and a weekend: one issue, no comments, no false close", () => {
    const stoppedAt = at("2026-10-22T16:30:00Z");
    const tally = replay((tick) => Math.min(stoppedAt, tick - 15_000));
    expect(tally).toMatchObject({ opens: 1, comments: 0, closes: 0 });
    // The first tick past stoppedAt + 10 min. Detection is the stall window plus one real tick gap.
    expect(tally.firstFail).toBe(at("2026-10-22T16:46:07Z"));
  });

  it("closes on the first real pass after the fix, one tick gap later", () => {
    const stoppedAt = at("2026-10-22T16:30:00Z");
    const fixedAt = at("2026-10-23T18:00:00Z");
    const tally = replay((tick) => (tick >= fixedAt ? tick - 15_000 : stoppedAt));
    expect(tally).toMatchObject({ opens: 1, comments: 0, closes: 1 });
  });

  it("detects every stall within ten minutes plus the clock's real gap", () => {
    const sessions = [
      [at("2026-10-22T16:27:00Z"), at("2026-10-22T19:50:00Z")],
      [at("2026-10-23T13:40:00Z"), at("2026-10-23T19:50:00Z")],
    ] as const;
    let checked = 0;
    for (const [from, to] of sessions) {
      for (let stoppedAt = from; stoppedAt < to; stoppedAt += MIN) {
        const redline = stoppedAt + BOT_STALL_AFTER_MS;
        const after = ticks.findIndex((t) => t >= redline);
        const next = ticks[after] as number;
        const previous = ticks[after - 1] as number;
        // Past the close, the next reading of this stall is the next open plus ten minutes.
        if (!sessionAt(next)) continue;
        expect(judge({ at: stoppedAt }, next).status).toBe("fail");
        expect(next - stoppedAt).toBeLessThanOrEqual(BOT_STALL_AFTER_MS + (next - previous));
        // And the tick before it did not cry stall early.
        if (previous > stoppedAt) expect(judge({ at: stoppedAt }, previous).status).toBe("pass");
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(500);
  });

  it("carries a stall from the session's last minutes into the next open", () => {
    const stoppedAt = at("2026-10-22T19:55:00Z"); // 15:55 EDT, too late for a tick to fail it today
    expect(judge({ at: stoppedAt }, at("2026-10-22T20:06:00Z")).status).toBe("quiet");
    expect(judge({ at: stoppedAt }, at("2026-10-23T13:39:59Z")).status).toBe("quiet");
    expect(judge({ at: stoppedAt }, at("2026-10-23T13:40:00Z")).status).toBe("fail");
  });
});

// ---- wiring: the real entrypoint against a stub fly -----------------------------------------------

const STUB_FLY = `#!/usr/bin/env bash
S="$STUB"; printf '%s\\n' "$*" >> "$S/fly-calls"
[[ -f "$S/fly-dead" ]] && { echo "Error: token expired" >&2; exit 1; }
case "$1 $2" in
  "machine list") cat "$S/machines" ;;
  "secrets list") echo '[{"Name":"SKYNET_ALERT_EMAIL_API_KEY"},{"Name":"SKYNET_ALERT_EMAIL_FROM"}]' ;;
  "machine exec")
    [[ "$3" == "m1" && "$5 $6 $7 $8" == "-a skynet-capital-bots --timeout 30" ]] || { echo "bad args" >&2; exit 1; }
    case "$4" in
      "cat /data/health.json") cat "$S/stamp" ;;
      "ls -t /data/audit")
        [[ -f "$S/list-refused" ]] && { cat "$S/list-refused" >&2; exit 1; }
        cat "$S/listing" ;;
      "tail -n 1 /data/audit/"*)
        [[ -f "$S/tail-refused" ]] && { cat "$S/tail-refused" >&2; exit 1; }
        [[ -f "$S/tail-hang" ]] && sleep 5
        if [[ -f "$S/tail-first" ]]; then cat "$S/tail-first"; rm "$S/tail-first"; else cat "$S/tail-\${4##*/}"; fi ;;
      *) echo "refused: $4" >&2; exit 1 ;;
    esac ;;
  *) echo "refused: $*" >&2; exit 1 ;;
esac
`;

const STUB_GH = `#!/usr/bin/env bash
S="$STUB"; printf '%s\\n' "$*" >> "$S/gh-calls"
case "$1 $2" in
  "issue list") cat "$S/issues" ;;
  "issue create") echo "https://github.com/x/y/issues/99" ;;
  api*) exit 1 ;;
esac
exit 0
`;

const started = '{"id":"m1","state":"started","config":{"env":{}}}';
const standby = '{"id":"standby1","state":"started","config":{"standbys":["m1"]}}';

type World = {
  now: number;
  record?: string;
  listing?: string;
  machines?: string;
  issues?: unknown[];
};

function world({ now, record, listing, machines, issues }: World) {
  const stub = mkdtempSync(join(tmpdir(), "fitness-cycle-"));
  writeFileSync(join(stub, "machines"), machines ?? `[${standby},${started}]`);
  writeFileSync(
    join(stub, "stamp"),
    JSON.stringify({ lastControlsPollAt: iso(now - 30_000), bridge: "armed" }),
  );
  writeFileSync(join(stub, "listing"), listing ?? "sauron.jsonl\nday-trader.jsonl\n");
  writeFileSync(join(stub, "tail-sauron.jsonl"), record ?? `{"at":${now - 15_000}}\n`);
  writeFileSync(join(stub, "issues"), JSON.stringify(issues ?? []));
  for (const [name, body] of [
    ["fly", STUB_FLY],
    ["gh", STUB_GH],
  ] as const) {
    writeFileSync(join(stub, name), body);
    chmodSync(join(stub, name), 0o755);
  }
  return stub;
}

/** The real script under plain node, with Date.now held at `now` by a preload. */
function run(stub: string, now: number, args: string[] = ["--json"], nodeFlags: string[] = []) {
  return spawnSync(
    process.execPath,
    [...nodeFlags, "--import", `data:text/javascript,Date.now=()=>${now}`, SCRIPT, ...args],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        STUB: stub,
        FLY_BIN: join(stub, "fly"),
        GH_BIN: join(stub, "gh"),
        PATH: `${stub}:${process.env.PATH}`,
        HOME: stub,
        FITNESS_RETRY_MS: "0",
        FITNESS_SPAWN_MS: "2000",
        GITHUB_ACTIONS: "true",
        GITHUB_EVENT_NAME: "schedule",
      },
    },
  );
}

const flyCalls = (stub: string) => {
  const path = join(stub, "fly-calls");
  return existsSync(path) ? readFileSync(path, "utf8") : "";
};
const ghCalls = (stub: string) => {
  const path = join(stub, "gh-calls");
  return existsSync(path) ? readFileSync(path, "utf8") : "";
};

type Result = { id: string; status: string; detail: string; reads: string };
function resultsOf(res: ReturnType<typeof run>) {
  const list = JSON.parse(
    res.stdout.slice(res.stdout.indexOf("\n[") + 1, res.stdout.lastIndexOf("\n]") + 2) ||
      res.stdout,
  ) as Result[];
  return (id: string) => {
    const r = list.find((x) => x.id === id);
    if (!r) throw new Error(`no result for ${id}: ${res.stdout}${res.stderr}`);
    return r;
  };
}
const verdict = (stub: string, now: number) => resultsOf(run(stub, now))("decision-cycle");
const output = (res: ReturnType<typeof run>) => `${res.stdout}\n${res.stderr}`;

describe("decision-cycle wiring", () => {
  it("catches the 10-08 shape that the machine and stamp contracts pass in the same run", () => {
    const stub = world({ now: THE_10_08, record: `{"at":${FEED_DIED}}\n` });
    const res = run(stub, THE_10_08);
    const r = resultsOf(res);
    expect(r("bots-running").status).toBe("pass");
    expect(r("bots-responsive").status).toBe("pass");
    expect(r("decision-cycle").status).toBe("fail");
  });

  it("loads the real stall rule and session clock in plain node", () => {
    expect(verdict(world({ now: MIDDAY }), MIDDAY).status).toBe("pass");
    // Each of these needs the real table, not a weekday check: a Thursday and a Friday afternoon.
    const stale = `{"at":${FEED_DIED}}\n`;
    expect(verdict(world({ now: THANKSGIVING, record: stale }), THANKSGIVING).status).toBe("quiet");
    expect(verdict(world({ now: EARLY_CLOSE, record: stale }), EARLY_CLOSE).status).toBe("quiet");
    expect(verdict(world({ now: EARLY_CLOSE, record: stale }), EARLY_CLOSE - MIN).status).toBe(
      "fail",
    );
    expect(verdict(world({ now: PAST_THE_TABLE, record: stale }), PAST_THE_TABLE).status).toBe(
      "unknown",
    );
  });

  it("reads the newest journal through exec, no shell, on the primary, with a deadline", () => {
    const stub = world({ now: MIDDAY });
    expect(verdict(stub, MIDDAY).status).toBe("pass");
    const fly = flyCalls(stub);
    expect(fly).toContain("machine exec m1 ls -t /data/audit -a skynet-capital-bots --timeout 30");
    expect(fly).toContain(
      "machine exec m1 tail -n 1 /data/audit/sauron.jsonl -a skynet-capital-bots --timeout 30",
    );
    expect(fly).not.toContain("exec standby1");
    expect(fly).not.toContain("day-trader.jsonl");
    expect(fly).not.toMatch(/sh -c|\||&&|;/);
  });

  it("sends production only reads: machine list, health, ls and tail", () => {
    const stub = world({ now: THE_10_08, record: `{"at":${FEED_DIED}}\n` });
    run(stub, THE_10_08);
    for (const line of flyCalls(stub).trim().split("\n")) {
      expect(line).toMatch(
        /^(machine list -a skynet-capital-bots --json|secrets list -a skynet-capital --json|machine exec m1 (cat \/data\/health\.json|ls -t \/data\/audit|tail -n 1 \/data\/audit\/sauron\.jsonl) -a skynet-capital-bots --timeout 30)$/,
      );
    }
  });

  it("reads the journal the app writes to", () => {
    expect(readFileSync(FLY_TOML, "utf8")).toContain('SKYNET_AUDIT_DIR = "/data/audit"');
  });

  it("skips a rotated archive and any name it could not pass safely, for the live file", () => {
    const stub = world({
      now: MIDDAY,
      listing: "sauron.20261103T1650Z.jsonl.gz\nweird name.jsonl\nsauron.jsonl\n",
    });
    expect(verdict(stub, MIDDAY).status).toBe("pass");
    expect(flyCalls(stub)).toContain("tail -n 1 /data/audit/sauron.jsonl");
    expect(flyCalls(stub)).not.toContain(".gz");
    expect(flyCalls(stub)).not.toContain("weird");
  });

  it("makes no journal read outside the session: Saturday, Thanksgiving and an early close", () => {
    for (const now of [SATURDAY, THANKSGIVING, EARLY_CLOSE]) {
      const stub = world({ now, record: `{"at":${FEED_DIED}}\n` });
      expect(verdict(stub, now).status).toBe("quiet");
      expect(flyCalls(stub)).not.toContain("/data/audit");
    }
  });

  it("reads no record as unknown: an empty folder, a missing one, and an empty file", () => {
    const empty = world({ now: MIDDAY, listing: "" });
    expect(verdict(empty, MIDDAY)).toMatchObject({
      status: "unknown",
      reads: "the decision journal",
    });
    expect(flyCalls(empty)).not.toContain("tail");
    // flyctl reports a remote failure as text on stdout with a clean exit.
    const missing = world({ now: MIDDAY, listing: "Exit code: 2\n" });
    expect(verdict(missing, MIDDAY).status).toBe("unknown");
    const blank = world({ now: MIDDAY, record: "\n" });
    expect(verdict(blank, MIDDAY).status).toBe("unknown");
  });

  it("reads a future timestamp through the wire as unknown", () => {
    const stub = world({ now: MIDDAY, record: `{"at":${MIDDAY + 60 * MIN}}\n` });
    expect(verdict(stub, MIDDAY).status).toBe("unknown");
  });

  it("is quiet for a fresh halted record, and never prints the owner's reason", () => {
    const reason = "OWNER-WROTE-THIS-REASON";
    const stub = world({
      now: MIDDAY,
      record: `${JSON.stringify({ at: MIDDAY - 15_000, halted: reason })}\n`,
    });
    const res = run(stub, MIDDAY);
    expect(resultsOf(res)("decision-cycle").status).toBe("quiet");
    expect(output(res)).not.toContain(reason);
  });

  it("prints only the time, the flag and the size of a stale record, in the report too", () => {
    const record = `${JSON.stringify({
      at: FEED_DIED,
      halted: "OWNER-WROTE-THIS-REASON",
      personaId: "PERSONA-NAME",
      rawIntents: [{ symbol: "SECRET-SYMBOL" }],
    })}\n`;
    const stub = world({ now: THE_10_08, record });
    const res = run(stub, THE_10_08, ["--report"]);
    const seen = `${output(res)}\n${ghCalls(stub)}`;
    expect(ghCalls(stub)).toContain("issue create --title [fitness] decision-cycle");
    for (const leak of ["OWNER-WROTE-THIS-REASON", "PERSONA-NAME", "SECRET-SYMBOL", "sauron"]) {
      expect(seen).not.toContain(leak);
    }
    expect(seen).toContain(iso(FEED_DIED));
    expect(seen).toContain("halted yes");
    expect(seen).toContain(`${Buffer.byteLength(record)} bytes`);
  });

  it('prints "unreadable" with no excerpt for a line it cannot parse, after one retry', () => {
    const torn = '{"at":1000,"rawIntents":[{"symbol":"SECRET-SYMBOL"';
    const stub = world({ now: MIDDAY, record: `${torn}\n` });
    const res = run(stub, MIDDAY);
    expect(resultsOf(res)("decision-cycle").status).toBe("unknown");
    expect(resultsOf(res)("decision-cycle").detail).toContain("unreadable");
    expect(res.stdout).toContain("unreadable");
    expect(output(res)).not.toContain("SECRET-SYMBOL");
    expect(res.status).toBe(0);
    expect(flyCalls(stub).match(/tail -n 1/g)).toHaveLength(2);
  });

  it("recovers on the retry when a torn line was only mid-append", () => {
    const stub = world({ now: MIDDAY });
    writeFileSync(join(stub, "tail-first"), '{"at":10');
    expect(verdict(stub, MIDDAY).status).toBe("pass");
  });

  it("reads a refused exec as unknown, and never prints what flyctl said about it", () => {
    for (const refusal of ["list-refused", "tail-refused"]) {
      const stub = world({ now: MIDDAY });
      writeFileSync(join(stub, refusal), "SECRET-SYMBOL leaked by stderr\n");
      const res = run(stub, MIDDAY);
      expect(resultsOf(res)("decision-cycle")).toMatchObject({
        status: "unknown",
        reads: "the decision journal",
      });
      expect(output(res)).not.toContain("SECRET-SYMBOL");
      expect(res.status).toBe(0);
    }
  });

  it("costs one contract, not the tick, when the read hangs", () => {
    const stub = world({ now: MIDDAY });
    writeFileSync(join(stub, "tail-hang"), "");
    const res = run(stub, MIDDAY);
    const r = resultsOf(res);
    expect(r("decision-cycle").status).toBe("unknown");
    expect(r("bots-running").status).toBe("pass");
  });

  it("is quiet for a machine a person halted, with no exec and without echoing the note", () => {
    const halted = `[{"id":"m1","state":"stopped","config":{"metadata":{"skynet-halt":"NOTE-FROM-OWNER"}}}]`;
    const stub = world({ now: MIDDAY, machines: halted, record: `{"at":${FEED_DIED}}\n` });
    const res = run(stub, MIDDAY);
    const r = resultsOf(res)("decision-cycle");
    expect(r.status).toBe("quiet");
    expect(r.detail).not.toContain("NOTE-FROM-OWNER");
    expect(flyCalls(stub)).not.toContain("/data/audit");
  });

  it("is quiet for a marked machine even while it runs: the mark is what a person said", () => {
    const marked = `[{"id":"m1","state":"started","config":{"metadata":{"skynet-halt":"note"}}}]`;
    const stub = world({ now: MIDDAY, machines: marked, record: `{"at":${FEED_DIED}}\n` });
    expect(verdict(stub, MIDDAY).status).toBe("quiet");
  });

  it("leaves a stopped or missing machine to bots-running: one stop, one report", () => {
    const stopped = `[{"id":"m1","state":"stopped","config":{}}]`;
    const stub = world({ now: MIDDAY, machines: stopped });
    const res = run(stub, MIDDAY);
    expect(resultsOf(res)("decision-cycle").status).toBe("quiet");
    expect(resultsOf(res)("bots-running").status).toBe("fail");
    expect(flyCalls(stub)).not.toContain("/data/audit");
    const gone = world({ now: MIDDAY, machines: `[${standby}]` });
    expect(verdict(gone, MIDDAY).status).toBe("quiet");
  });

  it("charges a Fly outage to Fly, one issue and not a second one for the journal", () => {
    const stub = world({ now: MIDDAY });
    writeFileSync(join(stub, "fly-dead"), "");
    const res = run(stub, MIDDAY);
    expect(resultsOf(res)("decision-cycle")).toMatchObject({ status: "unknown", reads: "Fly" });
    const reported = world({ now: MIDDAY });
    writeFileSync(join(reported, "fly-dead"), "");
    run(reported, MIDDAY, ["--report"]);
    expect(ghCalls(reported)).toContain("[fitness] cannot read Fly");
    expect(ghCalls(reported)).not.toContain("[fitness] cannot read the decision journal");
  });

  it("reads a reply that is not a machine list as unknown", () => {
    const stub = world({ now: MIDDAY, machines: '{"not":"a list"}' });
    const res = run(stub, MIDDAY);
    expect(resultsOf(res)("decision-cycle")).toMatchObject({ status: "unknown", reads: "Fly" });
  });

  it("reads unknown and says why on a node that cannot load the clock, with no crash and no read", () => {
    const stub = world({ now: MIDDAY, record: `{"at":${FEED_DIED}}\n` });
    const res = run(stub, MIDDAY, ["--json"], ["--no-experimental-strip-types"]);
    const r = resultsOf(res);
    expect(r("decision-cycle").status).toBe("unknown");
    expect(r("decision-cycle").detail).toContain("session clock");
    expect(res.stdout).toContain("::warning::fitness: decision-cycle");
    expect(res.status).toBe(0);
    expect(r("bots-running").status).toBe("pass");
    expect(r("bots-responsive").status).toBe("pass");
    expect(flyCalls(stub)).not.toContain("/data/audit");
  });

  it("says which node when the job's is too old to try, the clock's state until the pin lands", () => {
    expect(loadStallRule("22.11.0").why).toContain("22.11.0");
    expect(loadStallRule("20.19.2").why).toContain("24");
    expect(loadStallRule("23.99.0").why).toBeDefined();
  });

  it("opens one quiet unassigned issue for the blind clock, naming the cause", () => {
    const stub = world({ now: MIDDAY });
    run(stub, MIDDAY, ["--report"], ["--no-experimental-strip-types"]);
    const gh = ghCalls(stub);
    expect(gh).toContain("issue create --title [fitness] cannot read the decision journal");
    expect(gh).toContain("session clock");
    expect(gh).not.toContain("--assignee");
    expect(gh).not.toContain("[fitness] decision-cycle");
  });

  it("keeps quiet out of the exit code, and a stall in it", () => {
    expect(run(world({ now: SATURDAY }), SATURDAY).status).toBe(0);
    const stale = world({ now: THE_10_08, record: `{"at":${FEED_DIED}}\n` });
    expect(run(stale, THE_10_08).status).toBe(1);
  });

  it("leaves an open stall alone on a Saturday, and closes it on the next real pass", () => {
    const issue = { number: 7, title: "[fitness] decision-cycle", body: "", comments: [] };
    const weekend = world({ now: SATURDAY, issues: [issue] });
    run(weekend, SATURDAY, ["--report"]);
    expect(ghCalls(weekend)).not.toContain("issue close 7");
    const fixed = world({ now: MIDDAY, issues: [issue] });
    run(fixed, MIDDAY, ["--report"]);
    expect(ghCalls(fixed)).toContain("issue close 7");
  });

  it("runs on the clock and nowhere else", () => {
    const stub = world({ now: MIDDAY });
    const res = spawnSync(
      process.execPath,
      ["--import", `data:text/javascript,Date.now=()=>${MIDDAY}`, SCRIPT, "--json"],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          STUB: stub,
          FLY_BIN: join(stub, "fly"),
          GH_BIN: join(stub, "gh"),
          HOME: stub,
          GITHUB_ACTIONS: "",
        },
      },
    );
    expect(resultsOf(res)("decision-cycle").status).toBe("not-here");
    expect(flyCalls(stub)).toBe("");
  });

  it("declares its ending: no script fixes this, and past restarts did not", () => {
    const contract = CONTRACTS.find((c: { id: string }) => c.id === "decision-cycle");
    expect(contract).toMatchObject({
      home: "clock",
      reads: "the decision journal",
      corrector: null,
      reaches: "an issue assigned to the owner",
    });
    expect(contract.budget).toContain("restart");
    expect(contract.mustBeTrue).toContain("regular session");
    expect(contract.gap).toBeTruthy();
    expect(readFileSync(SCRIPT, "utf8")).not.toMatch(/machine.*restart|"restart"/);
  });

  it("carries the gap into the issue, so whoever reads a stall knows what it cannot see", () => {
    const stub = world({ now: THE_10_08, record: `{"at":${FEED_DIED}}\n` });
    run(stub, THE_10_08, ["--report"]);
    expect(ghCalls(stub)).toContain("**What this cannot see:**");
  });
});
