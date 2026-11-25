import { execFileSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  gateAdmission,
  markedAtOf,
  pullQueue,
  recountAfterMark,
  SETTLE_MS,
  seatOf,
} from "../../../scripts/moneypenny/admission.mjs";
import { startsFrom, WITHDRAWN_MS } from "../../../scripts/moneypenny/retry-hold-outage.mjs";
import { issue, mode } from "../../support/admission-fixtures.js";

// #7316 — THE CAP HOLDS WHEN MANY ISSUES ARE MADE READY AT ONCE. On 2026-11-10 a clear-path pass
// readied 22 issues 2 s apart, every claim read the in-flight count before the others had marked,
// and 9 builds started against a surge cap of 6. The fix is mark → re-read → withdraw
// (`recountAfterMark`, admission.mjs). These specs drive the REAL `gateAdmission` and
// `recountAfterMark` against a simulated GitHub: one in-flight set, one events log per issue, one
// clock. The settle wait is the simulator's hook — while one claim waits, others may run, which is
// how the specs produce interleavings. No `gh`, no network, except the last suite, which runs the
// real claim lane under a fake `gh` to prove the withdrawal is wired.

type Row = ReturnType<typeof issue>;

const IN_PROGRESS = { name: "in-progress" };
const quiet = () => undefined;
const stamp = (ms: number) => new Date(Math.floor(ms / 1000) * 1000).toISOString();

/** A seeded PRNG (mulberry32), so a red interleaving replays exactly. */
const prng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** The simulated repo: who carries `in-progress`, each issue's label events, and the clock. */
function world(cap: number, established: Row[] = []) {
  const inFlight = new Map<number, Row>();
  const events = new Map<
    number,
    { event: string; label: { name: string }; created_at: string }[]
  >();
  let clock = Date.parse("2026-11-10T04:19:00Z");
  const log = (n: number, event: string) => {
    const list = events.get(n) ?? [];
    list.push({ event, label: IN_PROGRESS, created_at: stamp(clock) });
    events.set(n, list);
  };
  for (const row of established) {
    clock -= 3_600_000; // marked an hour or more before the burst
    log(row.number, "labeled");
    inFlight.set(row.number, row);
  }
  clock = Date.parse("2026-11-10T04:19:00Z");
  const notes: [number, string][] = [];
  return {
    inFlight,
    notes,
    tick: (ms: number) => {
      clock += ms;
    },
    mark: (row: Row) => {
      inFlight.set(row.number, row);
      log(row.number, "labeled");
    },
    unmark: (row: Row) => {
      inFlight.delete(row.number);
      log(row.number, "unlabeled");
    },
    deps: (settle: (ms: number) => unknown = quiet) => ({
      readMode: () => ({ ...mode("surge", cap), until: null, reason: "x" }),
      readInFlight: () => [...inFlight.values()],
      readEvents: (n: number) => events.get(n) ?? [],
      readPlans: () => [],
      comments: () => [],
      comment: (n: number, body: string) => notes.push([n, body]),
      log: quiet,
      settle,
    }),
  };
}

type World = ReturnType<typeof world>;

/** One claim's recount after its mark, withdrawing the way `keepSeat` (index.mjs) does. */
const recount = (w: World, row: Row, settle?: (ms: number) => unknown) => {
  const seat = recountAfterMark(row, w.deps(settle));
  if (!seat.keep) w.unmark(row);
  return seat;
};

const racers = (from: number, count: number, labels: (n: number) => string[] = () => []) =>
  Array.from({ length: count }, (_, k) => issue(from + k, `surface ${from + k}`, labels(from + k)));

describe("ten claims at once against a cap of 6", () => {
  it("admits exactly 6, and they are the 6 highest in the pull order", () => {
    const w = world(6);
    // Bugs pull ahead of plain work (rank.mjs): give the top of the order to the later numbers, so
    // a pass that kept "whoever recounted first" or "lowest number" would fail.
    const rows = racers(6700, 10, (n) => (n >= 6704 ? ["bug"] : []));
    // The race: every claim reads the count before any has marked, so the gate admits all ten…
    const gated = rows.map((r) => gateAdmission(r, w.deps()));
    expect(gated.every((g) => g.admit)).toBe(true);
    // …then all ten mark in the same second, then each recounts.
    for (const r of rows) w.mark(r);
    const kept = rows.filter((r) => recount(w, r).keep);
    expect(kept).toHaveLength(6);
    expect(w.inFlight.size).toBe(6);
    expect(kept.map((r) => r.number)).toEqual(
      pullQueue(rows.map((r) => ({ ...r, labels: [...r.labels, { name: "ready" }] })))
        .slice(0, 6)
        .map((r) => r.number)
        .sort((a, b) => a - b),
    );
  });

  it("leaves each withdrawn issue one queue note naming the count, and ready untouched", () => {
    const w = world(6);
    const rows = racers(6700, 10);
    for (const r of rows) w.mark(r);
    for (const r of rows) recount(w, r);
    expect(w.notes).toHaveLength(4);
    expect(w.notes[0]?.[1]).toContain("⏸ **Not started yet** — queued: 9 of 6 in flight.");
  });

  it("counts builds already running: 2 established + 10 racing against 6 admits 4 racers", () => {
    const established = racers(100, 2);
    const w = world(6, established);
    const rows = racers(6700, 10);
    for (const r of rows) w.mark(r);
    const kept = rows.filter((r) => recount(w, r).keep);
    expect(kept.map((r) => r.number)).toEqual([6700, 6701, 6702, 6703]);
    expect([...w.inFlight.keys()].slice(0, 2)).toEqual([100, 101]); // never displaced
  });

  // The interleavings: claims start at random, and while one waits out SETTLE_MS any number of
  // others may mark and decide. 200 seeds; every one must end at the cap and never above it.
  it.each(Array.from({ length: 200 }, (_, seed) => seed))(
    "never ends above the cap, nor below it, on interleaving seed %i",
    (seed) => {
      const rand = prng(seed);
      const established = Math.floor(rand() * 4);
      const w = world(6, racers(100, established));
      const queue = racers(6700, 10, () => (rand() < 0.3 ? ["bug"] : [])).sort(() => rand() - 0.5);
      // A build starts the moment its claim keeps the seat, so this count is the one the dial caps.
      // A mark alone may overshoot for a moment; a build never may.
      const builds = new Set<number>();
      let most = 0;
      const decide = (row: Row, settle: (ms: number) => unknown) => {
        if (recount(w, row, settle).keep) builds.add(row.number);
        most = Math.max(most, established + builds.size);
      };
      const run = (row: Row) => {
        w.mark(row);
        decide(row, (ms) => {
          w.tick(ms);
          while (queue.length && rand() < 0.5) run(queue.shift() as Row);
        });
        w.tick(Math.floor(rand() * 1500));
      };
      // A burst first: some claims mark in the same second before any of them recounts.
      const burst = queue.splice(0, Math.floor(rand() * queue.length));
      for (const r of burst) w.mark(r);
      for (const r of burst) decide(r, (ms) => w.tick(ms));
      while (queue.length) run(queue.shift() as Row);
      expect(most).toBeLessThanOrEqual(6);
      expect(established + builds.size).toBe(6); // and no seat is left empty by over-withdrawing
      expect(w.inFlight.size).toBe(6);
    },
  );
});

describe("recountAfterMark — the claim's own count", () => {
  it("keeps a lone claim at once: no wait, no events read", () => {
    const w = world(6);
    const me = issue(7316, "admission gate");
    w.mark(me);
    const waits: number[] = [];
    const reads: number[] = [];
    const seat = recountAfterMark(me, {
      ...w.deps((ms) => waits.push(ms)),
      readEvents: (n: number) => {
        reads.push(n);
        return [];
      },
    });
    expect(seat).toEqual({ keep: true, reason: "the only build in flight" });
    expect(waits).toEqual([]);
    expect(reads).toEqual([]);
  });

  it("waits SETTLE_MS once when another build is in flight, and reads no events under the cap", () => {
    const w = world(6, racers(100, 2));
    const me = issue(7316, "admission gate");
    w.mark(me);
    const waits: number[] = [];
    const seat = recountAfterMark(me, {
      ...w.deps((ms) => waits.push(ms)),
      readEvents: () => {
        throw new Error("read only past the cap");
      },
    });
    expect(waits).toEqual([SETTLE_MS]);
    expect(seat).toEqual({ keep: true, reason: "3 of 6 in flight" });
  });

  it("withdraws when the in-flight list cannot be re-read (fails closed, like the gate)", () => {
    const seat = recountAfterMark(issue(7316, "x"), {
      readInFlight: () => {
        throw new Error("HTTP 502");
      },
      comments: () => [],
      comment: quiet,
      log: quiet,
    });
    expect(seat).toEqual({
      keep: false,
      reason: "queued: the in-flight list could not be re-read",
    });
  });

  it("a later mark yields to an earlier one, whatever the pull order", () => {
    // #6692 was refused while #6693, readied 2 s later, was admitted: a claim that marked first and
    // saw room has already started, so a later rival higher in the order must not also stay.
    const w = world(1);
    const early = issue(6693, "a");
    const late = issue(6692, "b", ["bug"]);
    w.mark(early);
    expect(recount(w, early).keep).toBe(true); // lone: nothing else in flight yet
    w.tick(3000);
    w.mark(late);
    expect(recount(w, late)).toEqual({
      keep: false,
      reason: "queued: 1 of 1 in flight",
    });
  });
});

describe("seatOf — who holds a seat", () => {
  const at = (pairs: [number, string][]) =>
    new Map(pairs.map(([n, iso]) => [n, Date.parse(iso)] as [number, number]));

  it("between two marks in the same second, the higher in the pull order takes the last seat", () => {
    const plain = issue(6692, "a");
    const bug = issue(6693, "b", ["bug"]);
    const held = issue(100, "c");
    const markedAt = at([
      [100, "2026-11-10T03:00:00Z"],
      [6692, "2026-11-10T04:19:35.200Z"],
      [6693, "2026-11-10T04:19:35.900Z"],
    ]);
    const inFlight = [held, plain, bug];
    const m = mode("surge", 2);
    expect(seatOf({ issue: bug, inFlight, mode: m, markedAt }).seated).toBe(true);
    expect(seatOf({ issue: plain, inFlight, mode: m, markedAt }).seated).toBe(false);
  });

  it("gives one fast-track card the seat over the cap, and only one", () => {
    const full = racers(100, 6);
    const first = issue(7001, "x", ["fast-track"]);
    const second = issue(7002, "y", ["fast-track"]);
    const markedAt = at([
      ...full.map((r) => [r.number, "2026-11-10T03:00:00Z"] as [number, string]),
      [7001, "2026-11-10T04:19:35Z"],
      [7002, "2026-11-10T04:19:35Z"],
    ]);
    const inFlight = [...full, first, second];
    const m = mode("surge", 6);
    expect(seatOf({ issue: first, inFlight, mode: m, markedAt }).seated).toBe(true);
    expect(seatOf({ issue: second, inFlight, mode: m, markedAt })).toMatchObject({
      seated: false,
      urgent: 7001,
    });
  });

  it("fails closed: another issue's unknown mark ranks first, this issue's own ranks last", () => {
    const me = issue(9, "x");
    const other = issue(1, "y");
    const m = mode("surge", 1);
    expect(seatOf({ issue: me, inFlight: [other], mode: m, markedAt: new Map() }).seated).toBe(
      false,
    );
    const mine = new Map([[9, Date.parse("2026-11-10T04:00:00Z")]]);
    expect(seatOf({ issue: me, inFlight: [other], mode: m, markedAt: mine }).seated).toBe(false);
  });

  it("markedAtOf reads the latest `in-progress` mark and ignores other labels", () => {
    expect(
      markedAtOf([
        { event: "labeled", label: { name: "in-progress" }, created_at: "2026-11-10T01:00:00Z" },
        { event: "labeled", label: { name: "ready" }, created_at: "2026-11-10T05:00:00Z" },
        { event: "labeled", label: { name: "in-progress" }, created_at: "2026-11-10T02:00:00Z" },
      ]),
    ).toBe(Date.parse("2026-11-10T02:00:00Z"));
    expect(markedAtOf([])).toBeNull();
  });
});

describe("a withdrawal is not a build start (the retry limit, #6470)", () => {
  const ev = (event: string, iso: string) => ({
    event,
    label: { name: "in-progress" },
    created_at: iso,
  });

  it("drops a mark taken back off within WITHDRAWN_MS, and keeps one a real build released", () => {
    const quick = new Date(Date.parse("2026-11-10T04:19:35Z") + WITHDRAWN_MS - 1000).toISOString();
    expect(
      startsFrom(
        [
          ev("labeled", "2026-11-10T04:19:35Z"),
          ev("unlabeled", quick),
          ev("labeled", "2026-11-10T05:00:00Z"),
          ev("unlabeled", "2026-11-10T05:25:00Z"),
        ],
        0,
      ),
    ).toEqual([Date.parse("2026-11-10T05:00:00Z")]);
  });
});

// The wiring, under a fake `gh` (in-progress.spec.ts's pattern): the real feedback claim, a full
// in-flight list whose marks are an hour old, and this issue's own mark just now. The claim must
// take the label and the lease back off, and hand the build no `number=`.
describe("claimFeedback — a claim past the cap gives its seat back", () => {
  let dir: string;
  let log: string;
  let out: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "admission-race-"));
    log = join(dir, "gh.log");
    out = join(dir, "output");
    writeFileSync(out, "");
    const row = (n: number) =>
      `{\\"number\\":${n},\\"body\\":\\"\\",\\"labels\\":[{\\"name\\":\\"in-progress\\"}]}`;
    // `--jq` prints one event object a line, as readComments' read does.
    const mark = (iso: string) =>
      `{\\"event\\":\\"labeled\\",\\"label\\":{\\"name\\":\\"in-progress\\"},\\"created_at\\":\\"${iso}\\"}`;
    const old = mark("2026-11-10T03:00:00Z");
    const now = mark("2026-11-10T04:19:35Z");
    // The platter read goes through curl and fails open: stub it, so nothing reaches the network.
    const curl = join(dir, "curl");
    writeFileSync(curl, "#!/bin/sh\nexit 22\n");
    chmodSync(curl, 0o755);
    const fake = join(dir, "gh");
    writeFileSync(
      fake,
      [
        "#!/bin/sh",
        `printf '%s\\n' "$*" >> "${log}"`,
        // Before the mark the in-flight list holds 2 of 3 (the gate admits); after it, 3 others.
        `marked() { grep -q -- '--add-label in-progress' "${log}"; }`,
        'case "$*" in',
        "  *git/ref/tags/*) exit 1 ;;",
        `  *git/tags*) echo '{"sha":"stamp"}' ;;`,
        "  *comments?per_page=100*) ;;",
        `  *"api repos/{owner}/{repo}/issues/4153 "*) echo '{"labels":[{"name":"work-mode:normal"}]}' ;;`,
        `  *labels=in-progress*) if marked; then echo "[${row(1)},${row(2)},${row(3)},${row(4242)}]"; else echo "[${row(1)},${row(2)}]"; fi ;;`,
        `  *issues/4242/events*) echo "${now}" ;;`,
        `  *issues/*/events*) echo "${old}" ;;`,
        `  *"api repos/{owner}/{repo}/issues/"[0-9]*) echo '{"number":4242,"labels":[{"name":"ready"}]}' ;;`,
        "  *) echo '{}' ;;",
        "esac",
        "",
      ].join("\n"),
    );
    chmodSync(fake, 0o755);
  });

  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("removes in-progress, deletes the lease, and writes no number=", () => {
    const stdout = execFileSync(
      "node",
      [
        "-e",
        `import("./scripts/moneypenny/index.mjs").then((m) => { const r = m.claimFeedback({ payload: { issue: { number: 4242, body: "", labels: [{ name: "feedback" }, { name: "ready" }] } } }, 0, "abc"); console.log(JSON.stringify(r)); })`,
      ],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, GITHUB_OUTPUT: out },
      },
    );
    const calls = readFileSync(log, "utf8").trim().split("\n");
    expect(calls).toContain("issue edit 4242 --add-label in-progress");
    expect(calls).toContain("issue edit 4242 --remove-label in-progress");
    expect(calls).toContain("api -X DELETE repos/{owner}/{repo}/git/refs/tags/claim/feedback-4242");
    expect(calls.some((c) => c.includes("--remove-label ready"))).toBe(false);
    expect(readFileSync(out, "utf8")).not.toContain("number=");
    expect(stdout.trim().split("\n").at(-1)).toBe(
      JSON.stringify({ claimed: false, reason: "queued: 3 of 3 in flight" }),
    );
  }, 20_000);
});
