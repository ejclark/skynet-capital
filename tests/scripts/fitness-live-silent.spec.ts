import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { describe, expect, it } from "@rstest/core";
// @ts-expect-error plain .mjs script, no declarations (the same as fitness.spec.ts)
import { judgeLiveSilent, parseTally } from "../../scripts/fitness.mjs";
import {
  journalsOf,
  TALLY_SESSIONS,
  tallyJournals,
  tallyLine,
} from "../../scripts/journal-tally.mjs";

// #6954 slice 1: WHILE a bot is effectively live, IF five market sessions pass with proposed
// orders, no order placed and no refusal reason, THEN the health check SHALL fail. The tally runs
// on the bots machine (scripts/journal-tally.mjs) and prints ids and counts; the judge and the
// probe live in scripts/fitness.mjs as the `live-bots-place` contract.
//
// Graded 2026-11-07 on a blind list (evals-expert, spec unseen): 13 of 14 caught first time; the
// survivor (stopping at five days drops the split half of the fifth) and one blind state (a day
// past the calendar table) are seeded below, and the list now scores 14 of 14. It is
// tests/scripts/fixtures/fitness-heldout-bugs-3.json, a regression list now, so the next score
// needs a fresh blind pass. Grading it:
//   node scripts/fitness-audit.mjs --bugs <file> --spec tests/scripts/fitness-live-silent.spec.ts \
//     --with src/alerts/bot-watch.ts --with src/domain/market-session.ts \
//     --with src/domain/market-calendar.ts --with src/domain/intl-format.ts \
//     --with scripts/deploy-lag.mjs --with scripts/bot-relevant.mjs --with scripts/fitness-rungs.mjs \
//     --with scripts/journal-tally.mjs --with scripts/journal-tally.d.mts \
//     --with .dockerignore --with Dockerfile

const SCRIPT = resolve("scripts/fitness.mjs");
const TALLY = resolve("scripts/journal-tally.mjs");
const DAY = 24 * 60 * 60_000;
// Thursday 2026-11-05, 12:00 in New York: the session is open.
const MIDDAY = Date.parse("2026-11-05T17:00:00Z");
// The same day at 17:00 in New York: closed, so the contract reads.
const EVENING = Date.parse("2026-11-05T22:00:00Z");
const SATURDAY = Date.parse("2026-11-07T15:00:00Z");

/** One journal line, as AutonomousTrader writes it, reduced to the fields the tally reads. */
const record = (at: number, over: Record<string, unknown> = {}) =>
  JSON.stringify({
    at,
    personaId: "sauron",
    mode: "live",
    rawIntents: [{ symbol: "NVDA" }],
    guardedIntents: [{ symbol: "NVDA" }],
    outcomes: [{ action: "observed" }],
    ...over,
  });

/** `n` New York session days ending the day before `nowMs`, newest first, as the tally prints. */
const days = (nowMs: number, n: number, counts = { proposed: 3, placed: 0, explained: 0 }) =>
  Array.from({ length: n }, (_, i) => ({
    day: new Date(nowMs - (i + 1) * DAY).toISOString().slice(0, 10),
    ...counts,
  }));

describe("journal-tally: one line", () => {
  it("counts a live record's proposals, placements and reasons", () => {
    const line = record(Date.parse("2026-11-05T15:00:00Z"), {
      rawIntents: [{}, {}, {}, {}],
      outcomes: [{ action: "placed" }, { action: "rejected" }, { action: "cooldown-skipped" }],
      refusals: [{ rule: "subscribed-only" }],
    });
    expect(tallyLine(line)).toEqual({ day: "2026-11-05", proposed: 4, placed: 1, explained: 3 });
  });

  it("counts an observed outcome under a live record as neither placed nor explained", () => {
    expect(tallyLine(record(Date.parse("2026-11-05T15:00:00Z")))).toMatchObject({
      proposed: 1,
      placed: 0,
      explained: 0,
    });
  });

  it("skips a watching bot's record: the paper-orders row reports why it watches", () => {
    expect(tallyLine(record(Date.parse("2026-11-05T15:00:00Z"), { mode: "observe" }))).toBeNull();
  });

  it("files a record under its New York day, not its UTC one", () => {
    // 01:30 UTC on the 6th is 20:30 on the 5th in New York.
    expect(tallyLine(record(Date.parse("2026-11-06T01:30:00Z")))?.day).toBe("2026-11-05");
  });

  it("drops a torn line, a record with no time, and anything that is not a record", () => {
    expect(tallyLine('{"at":17,"mode":"li')).toBeNull();
    expect(tallyLine(JSON.stringify({ mode: "live" }))).toBeNull();
    expect(tallyLine("null")).toBeNull();
    expect(tallyLine(JSON.stringify({ at: -1, mode: "live" }))).toBeNull();
  });

  it("reads a halted record as nothing proposed", () => {
    const halted = record(Date.parse("2026-11-05T15:00:00Z"), {
      halted: "breaker",
      rawIntents: [],
      outcomes: [],
    });
    expect(tallyLine(halted)).toMatchObject({ proposed: 0, placed: 0, explained: 0 });
  });
});

describe("journal-tally: which files", () => {
  const NAMES = [
    "sauron.jsonl",
    "sauron.2026-10-01T10-00-00-000Z.jsonl.gz",
    "sauron.2026-10-20T10-00-00-000Z.jsonl.gz",
    "sauron.2026-10-20T10-00-00-000Z.jsonl",
    "sauron-x.jsonl",
    "sauron-x.2026-10-21T10-00-00-000Z.jsonl.gz",
    "beta-scout.jsonl",
  ];

  it("reads the active file first, then archives newest first, a plain twin dropped", () => {
    expect(journalsOf(NAMES, "sauron")).toEqual([
      "sauron.jsonl",
      "sauron.2026-10-20T10-00-00-000Z.jsonl.gz",
      "sauron.2026-10-01T10-00-00-000Z.jsonl.gz",
    ]);
  });

  it("keeps a plain archive whose gzip has not landed", () => {
    expect(journalsOf(["a.jsonl", "a.2026-10-20T10-00-00-000Z.jsonl"], "a")).toEqual([
      "a.jsonl",
      "a.2026-10-20T10-00-00-000Z.jsonl",
    ]);
  });

  it("never mixes in another bot whose id starts the same", () => {
    expect(journalsOf(NAMES, "sauron").some((n) => n.startsWith("sauron-x"))).toBe(false);
  });
});

describe("journal-tally: a folder", () => {
  const at = (day: string, hour = 15) => Date.parse(`${day}T${hour}:00:00Z`);
  const folder = (files: Record<string, string | Buffer>) => {
    const dir = mkdtempSync(join(tmpdir(), "tally-"));
    for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, name), body);
    return dir;
  };

  it("tallies each bot's last five live days, newest first, and leaves the scouts out", async () => {
    const lines = [
      "2026-10-29",
      "2026-10-30",
      "2026-11-02",
      "2026-11-03",
      "2026-11-04",
      "2026-11-05",
    ]
      .map((d) => record(at(d)))
      .join("\n");
    const dir = folder({
      "sauron.jsonl": `${lines}\n`,
      "beta-scout.jsonl": `${record(at("2026-11-05"), { personaId: "beta-scout" })}\n`,
    });
    const tally = await tallyJournals(dir);
    expect(tally.tally).toBe(1);
    expect(tally.bots.map((b) => b.id)).toEqual(["sauron"]);
    expect(tally.bots[0]?.sessions.map((s) => s.day)).toEqual([
      "2026-11-05",
      "2026-11-04",
      "2026-11-03",
      "2026-11-02",
      "2026-10-30",
    ]);
    expect(tally.bots[0]?.sessions).toHaveLength(TALLY_SESSIONS);
  });

  it("reads into an archive when the active file holds fewer than five days, and sums a day split across them", async () => {
    const older = ["2026-10-29", "2026-10-30", "2026-11-02", "2026-11-03"].map((d) =>
      record(at(d)),
    );
    const dir = folder({
      "sauron.2026-11-03T20-00-00-000Z.jsonl.gz": gzipSync(`${older.join("\n")}\n`),
      "sauron.jsonl": `${record(at("2026-11-03", 20), { outcomes: [{ action: "placed" }] })}\n${record(at("2026-11-04"))}\n`,
    });
    const [bot] = (await tallyJournals(dir)).bots;
    expect(bot?.sessions.map((s) => s.day)).toEqual([
      "2026-11-04",
      "2026-11-03",
      "2026-11-02",
      "2026-10-30",
      "2026-10-29",
    ]);
    expect(bot?.sessions[1]).toMatchObject({ proposed: 2, placed: 1 });
  });

  it("reads on past five days when the fifth may be split: its other half can hold the placed order", async () => {
    // Five days in the active file, the oldest of them begun in the archive, where it placed.
    const five = ["2026-10-30", "2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05"];
    const dir = folder({
      "sauron.2026-10-30T16-00-00-000Z.jsonl.gz": gzipSync(
        `${record(at("2026-10-30", 14), { outcomes: [{ action: "placed" }] })}\n`,
      ),
      "sauron.jsonl": `${five.map((d) => record(at(d))).join("\n")}\n`,
    });
    const [bot] = (await tallyJournals(dir)).bots;
    expect(bot?.sessions.at(-1)).toEqual({
      day: "2026-10-30",
      proposed: 2,
      placed: 1,
      explained: 0,
    });
  });

  it("stops reading archives once a sixth day proves the fifth whole", async () => {
    const six = [
      "2026-10-29",
      "2026-10-30",
      "2026-11-02",
      "2026-11-03",
      "2026-11-04",
      "2026-11-05",
    ];
    const dir = folder({
      // Older than everything, and not gzip: reading it would throw.
      "sauron.2026-01-01T00-00-00-000Z.jsonl.gz": "not gzip",
      "sauron.jsonl": `${six.map((d) => record(at(d))).join("\n")}\n`,
    });
    const [bot] = (await tallyJournals(dir)).bots;
    expect(bot?.sessions).toHaveLength(5);
  });

  it("leaves out a bot with no live day at all", async () => {
    const dir = folder({ "banker.jsonl": `${record(at("2026-11-05"), { mode: "observe" })}\n` });
    expect((await tallyJournals(dir)).bots).toEqual([]);
  });

  it("prints only ids, days and counts from the command line, and fails loudly on a missing folder", () => {
    const secret = record(at("2026-11-05"), { halted: "suspended by owner: personal reason" });
    const dir = folder({ "sauron.jsonl": `${secret}\n` });
    const res = spawnSync(process.execPath, [TALLY, dir], { encoding: "utf8" });
    expect(res.status).toBe(0);
    expect(JSON.parse(res.stdout)).toEqual({
      tally: 1,
      bots: [
        {
          id: "sauron",
          sessions: [{ day: "2026-11-05", proposed: 1, placed: 0, explained: 0 }],
        },
      ],
    });
    expect(res.stdout).not.toContain("personal reason");
    expect(res.stdout).not.toContain("NVDA");
    const missing = spawnSync(process.execPath, [TALLY, join(dir, "nope")], { encoding: "utf8" });
    expect(missing.status).toBe(1);
    expect(missing.stderr).not.toContain(dir);
  });
});

describe("live-bots-place: the tally parser", () => {
  const good = { tally: 1, bots: [{ id: "sauron", sessions: days(EVENING, 5) }] };

  it("keeps ids, days and counts and nothing else", () => {
    const extra = {
      ...good,
      note: "x",
      bots: [{ ...good.bots[0], symbol: "NVDA", sessions: [{ ...days(EVENING, 1)[0], why: "y" }] }],
    };
    expect(parseTally(JSON.stringify(extra))).toEqual({
      bots: [{ id: "sauron", sessions: days(EVENING, 1) }],
    });
  });

  it("refuses anything short of the exact shape", () => {
    for (const bad of [
      "",
      "Exit code: 1",
      "{}",
      JSON.stringify({ tally: 2, bots: [] }),
      JSON.stringify({ tally: 1, bots: [{ id: "a b", sessions: [] }] }),
      JSON.stringify({ tally: 1, bots: [{ id: "sauron" }] }),
      JSON.stringify({
        tally: 1,
        bots: [{ id: "sauron", sessions: [{ day: "11/05", placed: 0 }] }],
      }),
      JSON.stringify({
        tally: 1,
        bots: [
          {
            id: "sauron",
            sessions: [{ day: "2026-11-05", proposed: -1, placed: 0, explained: 0 }],
          },
        ],
      }),
      JSON.stringify({
        tally: 1,
        bots: [
          {
            id: "sauron",
            sessions: [{ day: "2026-11-05", proposed: 1.5, placed: 0, explained: 0 }],
          },
        ],
      }),
    ]) {
      expect(parseTally(bad)).toBeNull();
    }
  });
});

describe("live-bots-place: the judge", () => {
  const tally = (...bots: { id: string; sessions: ReturnType<typeof days> }[]) => ({ bots });

  it("fails a bot that proposed over five sessions, placed none and recorded no reason", () => {
    const verdict = judgeLiveSilent(tally({ id: "sauron", sessions: days(EVENING, 5) }), EVENING);
    expect(verdict.status).toBe("fail");
    expect(verdict.detail).toBe(
      "over five sessions placing paper orders, sauron (15 proposed) placed none and recorded no reason",
    );
  });

  it("passes the bot once one session placed an order", () => {
    const sessions = days(EVENING, 5);
    sessions[4] = { ...sessions[4], placed: 1 } as (typeof sessions)[number];
    expect(judgeLiveSilent(tally({ id: "sauron", sessions }), EVENING).status).toBe("pass");
  });

  it("passes the bot once one session recorded a reason: the subscribed-only guard says why", () => {
    const sessions = days(EVENING, 5);
    sessions[2] = { ...sessions[2], explained: 1 } as (typeof sessions)[number];
    expect(judgeLiveSilent(tally({ id: "sauron", sessions }), EVENING).status).toBe("pass");
  });

  it("names only the silent bot when another one places", () => {
    const verdict = judgeLiveSilent(
      tally(
        { id: "banker", sessions: days(EVENING, 5, { proposed: 2, placed: 1, explained: 0 }) },
        { id: "sauron", sessions: days(EVENING, 5) },
      ),
      EVENING,
    );
    expect(verdict.status).toBe("fail");
    expect(verdict.detail).toContain("sauron (15 proposed)");
    expect(verdict.detail).not.toContain("banker");
  });

  it("does not judge four sessions: the fifth is the line", () => {
    expect(judgeLiveSilent(tally({ id: "sauron", sessions: days(EVENING, 4) }), EVENING)).toEqual({
      status: "quiet",
      detail: "no bot has five recent sessions placing paper orders",
    });
  });

  it("does not judge a bot whose newest live session is more than ten days old", () => {
    // days() starts the day before its anchor: the newest session here is 11 days back, then 9.
    const old = days(EVENING - 10 * DAY, 5);
    expect(judgeLiveSilent(tally({ id: "sauron", sessions: old }), EVENING).status).toBe("quiet");
    const recent = days(EVENING - 8 * DAY, 5);
    expect(judgeLiveSilent(tally({ id: "sauron", sessions: recent }), EVENING).status).toBe("fail");
  });

  it("reads no bot placing paper orders as quiet, never a pass", () => {
    expect(judgeLiveSilent(tally(), EVENING).status).toBe("quiet");
  });

  it("reads an unreadable tally as unknown, never a pass", () => {
    expect(judgeLiveSilent(null, EVENING).status).toBe("unknown");
  });

  it("KNOWN GAP: a bot that proposes nothing for five sessions passes", () => {
    const quietTrigger = days(EVENING, 5, { proposed: 0, placed: 0, explained: 0 });
    expect(judgeLiveSilent(tally({ id: "sauron", sessions: quietTrigger }), EVENING).status).toBe(
      "pass",
    );
  });

  it("KNOWN GAP: one reason in five sessions passes however many proposals went unexplained", () => {
    const sessions = days(EVENING, 5, { proposed: 500, placed: 0, explained: 0 });
    sessions[0] = { ...sessions[0], explained: 1 } as (typeof sessions)[number];
    expect(judgeLiveSilent(tally({ id: "sauron", sessions }), EVENING).status).toBe("pass");
  });
});

// ---- wiring: the real entrypoint against a stub fly that records its arguments ------------------

const STUB_FLY = `#!/usr/bin/env bash
S="$STUB"; printf '%s\\n' "$*" >> "$S/fly-calls"
case "$1 $2" in
  "machine list") cat "$S/machines" ;;
  "secrets list") echo '[{"Name":"SKYNET_ALERT_EMAIL_API_KEY"},{"Name":"SKYNET_ALERT_EMAIL_FROM"}]' ;;
  "machine exec")
    [[ "$3" == "m1" && "$5 $6 $7 $8" == "-a skynet-capital-bots --timeout 30" ]] || { echo "bad args" >&2; exit 1; }
    case "$4" in
      "cat /data/health.json") echo '{"bridge":"armed"}' ;;
      "node /app/scripts/journal-tally.mjs /data/audit") cat "$S/tally" ;;
      "ls -t /data/audit") echo sauron.jsonl ;;
      "tail -n 2 /data/audit/sauron.jsonl") echo '{"at":1}' ;;
      *) echo "refused: $4" >&2; exit 1 ;;
    esac ;;
  *) echo "refused: $*" >&2; exit 1 ;;
esac
`;
const STUB_GH = `#!/usr/bin/env bash
case "$1 $2" in
  "issue list") echo '[]' ;;
  api*) exit 1 ;;
esac
exit 0
`;
const STARTED = '{"id":"m1","state":"started","config":{"env":{}}}';
const STANDBY = '{"id":"standby1","state":"started","config":{"standbys":["m1"]}}';

function world(tallyText: string, machines = `[${STANDBY},${STARTED}]`) {
  const stub = mkdtempSync(join(tmpdir(), "fitness-silent-"));
  writeFileSync(join(stub, "machines"), machines);
  writeFileSync(join(stub, "tally"), tallyText);
  for (const [name, body] of [
    ["fly", STUB_FLY],
    ["gh", STUB_GH],
  ] as const) {
    writeFileSync(join(stub, name), body);
    chmodSync(join(stub, name), 0o755);
  }
  return stub;
}

/** The real script under plain node, with Date.now held at `now`; the live-bots-place result. */
function verdictAt(stub: string, now: number) {
  const res = spawnSync(
    process.execPath,
    ["--import", `data:text/javascript,Date.now=()=>${now}`, SCRIPT, "--json"],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        STUB: stub,
        FLY_BIN: join(stub, "fly"),
        GH_BIN: join(stub, "gh"),
        HOME: stub,
        FITNESS_RETRY_MS: "0",
        FITNESS_SPAWN_MS: "2000",
        GITHUB_ACTIONS: "true",
        GITHUB_EVENT_NAME: "schedule",
      },
    },
  );
  const list = JSON.parse(
    res.stdout.slice(res.stdout.indexOf("\n[") + 1, res.stdout.lastIndexOf("\n]") + 2) ||
      res.stdout,
  ) as { id: string; status: string; detail: string; reads?: string }[];
  const found = list.find((r) => r.id === "live-bots-place");
  if (!found) throw new Error(`no live-bots-place result: ${res.stdout}${res.stderr}`);
  return found;
}
const flyCalls = (stub: string) => {
  const path = join(stub, "fly-calls");
  return existsSync(path) ? readFileSync(path, "utf8") : "";
};
const silentTally = (now: number) =>
  JSON.stringify({ tally: 1, bots: [{ id: "sauron", sessions: days(now, 5) }] });

describe("live-bots-place wiring", () => {
  it("fails a silent bot after the close, reading the tally on the primary with no shell", () => {
    const stub = world(silentTally(EVENING));
    expect(verdictAt(stub, EVENING)).toMatchObject({
      status: "fail",
      detail:
        "over five sessions placing paper orders, sauron (15 proposed) placed none and recorded no reason",
    });
    const fly = flyCalls(stub);
    expect(fly).toContain(
      "machine exec m1 node /app/scripts/journal-tally.mjs /data/audit -a skynet-capital-bots --timeout 30",
    );
    expect(fly).not.toContain("exec standby1");
    expect(fly).not.toMatch(/sh -c|\||&&|;/);
  });

  it("reads on a weekend too", () => {
    expect(verdictAt(world(silentTally(SATURDAY)), SATURDAY).status).toBe("fail");
  });

  it("is quiet in the session and never runs the tally there", () => {
    const stub = world(silentTally(MIDDAY));
    expect(verdictAt(stub, MIDDAY)).toMatchObject({
      status: "quiet",
      detail: "judged after the close, so the read never slows a trading cycle",
    });
    expect(flyCalls(stub)).not.toContain("journal-tally");
  });

  it("reads a tally it does not know as unknown on the journal, never a pass", () => {
    expect(verdictAt(world("Exit code: 1\n"), EVENING)).toMatchObject({
      status: "unknown",
      reads: "the decision journal",
    });
    expect(verdictAt(world('{"tally":1,"bots":"x"}'), EVENING).status).toBe("unknown");
  });

  it("leaves a stopped machine to bots-running", () => {
    const stopped = '{"id":"m1","state":"stopped","config":{"env":{}}}';
    const stub = world(silentTally(EVENING), `[${STANDBY},${stopped}]`);
    expect(verdictAt(stub, EVENING)).toMatchObject({
      status: "quiet",
      detail: "machine is stopped: bots-running reports this",
    });
    expect(flyCalls(stub)).not.toContain("journal-tally");
  });

  it("reads a day past the exchange calendar as unknown, not a closed market it can judge", () => {
    // The calendar table ends in 2027; a holiday it cannot know reads as an open market.
    const past = Date.parse("2028-03-04T15:00:00Z");
    const stub = world(silentTally(past));
    expect(verdictAt(stub, past)).toMatchObject({
      status: "unknown",
      detail: "the exchange calendar table ends before today",
    });
    expect(flyCalls(stub)).not.toContain("journal-tally");
  });

  it("charges an unreadable machine list to Fly, not the journal", () => {
    expect(verdictAt(world(silentTally(EVENING), "nope"), EVENING)).toMatchObject({
      status: "unknown",
      reads: "Fly",
    });
  });

  it("runs a tally that ships in the bots image: scripts/ is not docker-ignored", () => {
    const ignored = readFileSync(resolve(".dockerignore"), "utf8").split("\n");
    expect(ignored).not.toContain("scripts");
    expect(readFileSync(resolve("Dockerfile"), "utf8")).toContain("WORKDIR /app");
  });
});
