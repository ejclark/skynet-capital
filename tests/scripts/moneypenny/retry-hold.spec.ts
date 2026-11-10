import { readFileSync } from "node:fs";
import {
  MAX_STARTS_PER_DAY,
  retryHold,
  retryHoldReason,
  runCli,
} from "../../../scripts/moneypenny/admission.mjs";
import { type ClaimCtx, claimNext, peekNext } from "../../../scripts/moneypenny/index.mjs";
import {
  OUTAGE_DAY_CAP,
  OUTAGE_PEER_READS,
} from "../../../scripts/moneypenny/retry-hold-outage.mjs";
import {
  issue,
  mode,
  noContinuation,
  noOpenPlans,
  noOpenPrs,
} from "../../support/admission-fixtures.js";

// A failed build frees its slot, the freed slot wakes the sweep, and the sweep picks the same issue:
// #4621 started every 3 minutes for 38 minutes on 2026-10-27, and a clock wake could reach 96 a day.

const DAY = "2026-10-27";
const NOW = Date.parse(`${DAY}T05:30:00Z`);
const started = (at: string, label = "in-progress") => ({
  event: "labeled",
  label: { name: label },
  created_at: at,
});
/** `in-progress` going on three times this morning, as #4621's did. */
const threeStarts = [
  started(`${DAY}T04:57:13Z`),
  started(`${DAY}T05:00:11Z`),
  started(`${DAY}T05:03:10Z`),
];
const mergedPr = (n: number, at: string) => ({
  merged_at: at,
  title: "feat: a slice",
  body: `Part of #${n}`,
  head: { ref: `plan/${n}` },
});
const CLOSED_PRS = "pulls?state=closed&sort=updated&direction=desc&per_page=100";

/** A fake GitHub for the REST seam, recording every call: `issues/<n>/events` and the closed PRs. */
const fakeGitHub = (events: Record<number, unknown[]> = {}, closed: unknown[] = []) => {
  const calls: string[] = [];
  return {
    calls,
    readAll: (path: string) => {
      calls.push(path);
      return events[Number(/^issues\/(\d+)\/events$/.exec(path)?.[1])] ?? [];
    },
    read: (path: string) => {
      calls.push(path);
      return path === CLOSED_PRS ? closed : [];
    },
  };
};

describe("retryHoldReason — how many times today, and nothing merged", () => {
  it("refuses at three starts today", () => {
    expect(MAX_STARTS_PER_DAY).toBe(3);
    expect(retryHoldReason({ events: threeStarts, now: NOW })).toContain("3 builds started today");
  });

  it("two starts are still allowed", () => {
    expect(retryHoldReason({ events: threeStarts.slice(1), now: NOW })).toBeNull();
  });

  it("yesterday's starts do not count: the limit lasts the rest of the day, no longer", () => {
    expect(retryHoldReason({ events: threeStarts, now: NOW + 24 * 36e5 })).toBeNull();
  });

  it("a merged PR since then means the builds worked: only starts after it count", () => {
    const mergedMs = Date.parse(`${DAY}T05:02:00Z`);
    expect(retryHoldReason({ events: threeStarts, mergedMs, now: NOW })).toBeNull();
  });

  it("counts only in-progress going on, not coming off and not another label", () => {
    const events = [
      ...threeStarts.slice(1),
      { ...started(`${DAY}T05:01:00Z`), event: "unlabeled" },
      started(`${DAY}T05:02:00Z`, "ready"),
    ];
    expect(retryHoldReason({ events, now: NOW })).toBeNull();
  });
});

describe("retryHold — the read behind it", () => {
  it("a read that fails holds nothing, and says so: a stalled queue is worse than one retry", () => {
    const log: string[] = [];
    const hold = retryHold({
      now: NOW,
      log: (l) => log.push(l),
      readAll: () => {
        throw new Error("502");
      },
    });
    expect(hold(issue(7, "a", ["ready"]))).toBeNull();
    expect(log.join()).toContain("could not be read");
  });

  it("costs one read for a healthy pick, and the merged-PR list once however many are refused", () => {
    const gh = fakeGitHub({ 1: threeStarts.slice(1), 2: threeStarts, 3: threeStarts });
    const hold = retryHold({ now: NOW, readAll: gh.readAll, read: gh.read });
    expect(hold(issue(1, "a", ["ready"]))).toBeNull();
    expect(gh.calls).toEqual(["issues/1/events"]);
    expect(hold(issue(2, "b", ["ready"]))).toContain("3 builds");
    expect(hold(issue(3, "c", ["ready"]))).toContain("3 builds");
    expect(gh.calls).toEqual(["issues/1/events", "issues/2/events", CLOSED_PRS, "issues/3/events"]);
  });

  it("a merged PR that names another issue resets nothing", () => {
    const gh = fakeGitHub({ 2: threeStarts }, [mergedPr(9, `${DAY}T05:10:00Z`)]);
    expect(
      retryHold({ now: NOW, readAll: gh.readAll, read: gh.read })(issue(2, "b", ["ready"])),
    ).toContain("3 builds");
  });
});

// THE WIRING. These drive claimNext and peekNext with their DEFAULT hold: a spec that injected
// `readHold` would stay green with the limit unplugged from the sweep.
describe("the sweep, with its default hold", () => {
  const failing = issue(4621, "failing", ["ready", "feedback"]);
  // A higher number sorts behind #4621, so being claimed means #4621 was stepped past.
  const next = issue(4700, "next", ["ready", "feedback"]);
  const setup = (gh: ReturnType<typeof fakeGitHub>, ready = [failing, next]) => {
    const tried: number[] = [];
    const claim = (ctx: ClaimCtx) => {
      const n = ctx.payload?.issue?.number ?? -1;
      tried.push(n);
      return { claimed: true, reason: "claimed", number: n };
    };
    return {
      tried,
      deps: {
        readMode: () => ({ ...mode("normal"), until: null, reason: "set to normal" }),
        readReady: () => ready,
        readInFlight: () => [],
        readPrIssues: noOpenPrs,
        readPlans: noOpenPlans,
        claims: { plan: claim, feedback: claim },
        continuation: noContinuation,
        holdReads: { readAll: gh.readAll, read: gh.read },
      },
    };
  };

  it("claimNext refuses the failed issue after 3 starts and picks the next admissible one", () => {
    const { deps, tried } = setup(fakeGitHub({ 4621: threeStarts }));
    expect(claimNext(NOW, "abc", deps)).toMatchObject({ claimed: true, number: 4700 });
    expect(tried).toEqual([4700]);
  });

  it("claimNext still claims it with two starts on the record", () => {
    const { deps, tried } = setup(fakeGitHub({ 4621: threeStarts.slice(1) }));
    claimNext(NOW, "abc", deps);
    expect(tried).toEqual([4621]);
  });

  it("claimNext takes it again once a PR naming it has merged since those starts", () => {
    const gh = fakeGitHub({ 4621: threeStarts }, [mergedPr(4621, `${DAY}T05:10:00Z`)]);
    const { deps, tried } = setup(gh);
    claimNext(NOW, "abc", deps);
    expect(tried).toEqual([4621]);
  });

  it("peekNext sees the same refusal, so a wake dispatches no run for it", () => {
    // peekNext reads the clock itself, so these starts sit at the top of today's UTC date.
    const today = new Date().toISOString().slice(0, 10);
    const three = [1, 2, 3].map((s) => started(`${today}T00:00:0${s}Z`));
    expect(peekNext(setup(fakeGitHub({ 4621: three }), [failing]).deps)).toBeNull();
    // Two starts name it, so the null above came from the count and not from the fixture.
    const two = setup(fakeGitHub({ 4621: three.slice(1) }), [failing]).deps;
    expect(peekNext(two)?.number).toBe(4621);
  });

  it("one REST read on a healthy tick (#6319: the App's bucket ran out once)", () => {
    const gh = fakeGitHub({ 4621: threeStarts.slice(1) });
    claimNext(NOW, "abc", setup(gh).deps);
    expect(gh.calls).toEqual(["issues/4621/events"]);
  });

  it("no REST read at all when nothing is admissible", () => {
    const gh = fakeGitHub();
    const halted = { ...setup(gh).deps, readMode: () => ({ ...mode("halt"), until: null }) };
    claimNext(NOW, "abc", halted as Parameters<typeof claimNext>[2]);
    expect(gh.calls).toEqual([]);
  });
});

// A build that dies for a reason nothing to do with the issue charges the issue anyway, so an outage
// used to walk down the queue and leave the healthy top of it barred until midnight, with only a log
// line to show for it. Replayed through the real claimNext at #4621's pace: every start 3 minutes on.
describe("a lane-wide failure, against one issue's failing build", () => {
  const T0 = Date.parse(`${DAY}T05:00:00Z`);
  const minutes = (m: number) => T0 + m * 60_000;
  const iso = (ms: number) => new Date(ms).toISOString();

  /** A queue ranked #101 first, a fake GitHub that grows as builds start, and a run that records. */
  const lane = (numbers = [101, 102, 103, 104, 105, 106, 107, 108]) => {
    const events: Record<number, unknown[]> = {};
    const comments: Record<number, { body: string }[]> = {};
    const closed: unknown[] = [];
    const reads: string[] = [];
    const posted: string[][] = [];
    const ready = numbers.map((n) => issue(n, `surface ${n}`, ["ready", "feedback"]));
    const claim = (ctx: ClaimCtx) => {
      const n = ctx.payload?.issue?.number ?? -1;
      return { claimed: true, reason: "claimed", number: n };
    };
    const deps = (extra = {}) => ({
      readMode: () => ({ ...mode("normal"), until: null, reason: "set to normal" }),
      readReady: () => ready,
      readInFlight: () => [],
      readPrIssues: noOpenPrs,
      readPlans: noOpenPlans,
      claims: { plan: claim, feedback: claim },
      continuation: noContinuation,
      holdReads: {
        readAll: (path: string) => {
          reads.push(path);
          const n = Number(/^issues\/(\d+)\//.exec(path)?.[1]);
          return path.endsWith("/comments") ? (comments[n] ?? []) : (events[n] ?? []);
        },
        read: (path: string) => (path === CLOSED_PRS ? closed : []),
        run: (_cmd: string, args: string[]) => {
          posted.push(args);
          if (args[1] === "comment") {
            const n = Number(args[2]);
            comments[n] = [...(comments[n] ?? []), { body: args.at(-1) ?? "" }];
          }
          return "";
        },
        ...extra,
      },
    });
    /** One tick at `at`: what the sweep picks; `dies` charges it a start, as a real claim does. */
    const tick = (at: number, dies = true, extra = {}) => {
      const out = claimNext(at, "abc", deps(extra)) as { number?: number };
      if (dies && out.number) {
        events[out.number] = [...(events[out.number] ?? []), started(iso(at))];
      }
      return out.number;
    };
    const land = (n: number, at: number) => closed.push(mergedPr(n, iso(at)));
    return { tick, land, reads, posted, comments, deps, events };
  };

  /** The audit's replay: 18 starts, one every 3 minutes, every build dying. */
  const outage = (l: ReturnType<typeof lane>) => {
    const picks: (number | undefined)[] = [];
    for (let i = 0; i < 18; i++) picks.push(l.tick(minutes(i * 3)));
    return picks;
  };

  it("after an outage the top of the queue is first again, not the first issue nobody charged", () => {
    const l = lane();
    outage(l);
    // The audit's assertion, once the hour has passed: it read #107 here and #101 waited for midnight.
    expect(l.tick(minutes(70), false)).toBe(101);
  });

  it("a lower issue that builds first does not turn the outage into #101's own fault", () => {
    const l = lane();
    outage(l);
    expect(l.tick(minutes(55), false)).toBe(107);
    l.land(107, minutes(60));
    expect(l.tick(minutes(70), false)).toBe(101);
  });

  it("one issue failing alone stays barred until midnight, however long the lane is quiet", () => {
    const l = lane();
    for (const m of [0, 3, 6]) l.tick(minutes(m));
    // #102 starts once and is still building: a single start is no evidence about the lane.
    expect(l.tick(minutes(9))).toBe(102);
    expect(l.tick(minutes(300), false)).toBe(102);
  });

  it("two issues failing with a lane build landing between them are two issues, not an outage", () => {
    const l = lane();
    for (const m of [0, 3, 6]) l.tick(minutes(m));
    l.land(999, minutes(8));
    for (const m of [9, 12, 15]) expect(l.tick(minutes(m))).toBe(102);
    expect(l.tick(minutes(300), false)).toBe(103);
  });

  it("a PR on a session's own branch says nothing about whether the lane can build", () => {
    const l = lane();
    for (const m of [0, 3, 6]) l.tick(minutes(m));
    for (const m of [9, 12, 15]) l.tick(minutes(m));
    // Merged in the middle of the failing stretch, but off a live session's branch.
    const notLane = { ...mergedPr(999, iso(minutes(8))), head: { ref: "fix/by-hand" } };
    expect(l.tick(minutes(300), false, { read: () => [notLane] })).toBe(101);
  });

  it("the retries an outage earns are bounded, so two bad issues cannot stall the queue all day", () => {
    const l = lane([101, 102, 103]);
    for (let i = 0; i < 6; i++) l.tick(minutes(i * 3)); // #101 and #102 charged, three each
    let at = 70;
    const picks: (number | undefined)[] = [];
    for (let i = 0; i < 30; i++) {
      picks.push(l.tick(minutes(at)));
      at += 61;
      if (at > 18 * 60) break;
    }
    const startsOf101 = l.events[101]?.length ?? 0;
    expect(startsOf101).toBeLessThanOrEqual(OUTAGE_DAY_CAP);
    expect(picks).toContain(103);
    expect(OUTAGE_DAY_CAP).toBe(MAX_STARTS_PER_DAY * 3);
  });

  it("costs no peer read until the hour has passed: a fresh bar is decided by its own events", () => {
    const l = lane();
    for (const m of [0, 3, 6]) l.tick(minutes(m));
    l.reads.length = 0;
    l.tick(minutes(10), false);
    expect(l.reads.filter((p) => p.endsWith("/events"))).toEqual([
      "issues/101/events",
      "issues/102/events",
    ]);
  });

  it("reads a bounded number of peers however long the queue is", () => {
    const l = lane(Array.from({ length: 40 }, (_, i) => 101 + i));
    for (const m of [0, 3, 6]) l.tick(minutes(m));
    l.reads.length = 0;
    l.tick(minutes(120), false);
    expect(l.reads.filter((p) => p.endsWith("/events")).length).toBeLessThanOrEqual(
      OUTAGE_PEER_READS + 2,
    );
  });

  describe("saying so on the issue", () => {
    it("the sweep writes one note on a barred issue, naming why and how to start it sooner", () => {
      const l = lane();
      for (const m of [0, 3, 6]) l.tick(minutes(m));
      l.tick(minutes(9), false);
      const notes = l.posted.filter((a) => a[1] === "comment" && a[2] === "101");
      expect(notes).toHaveLength(1);
      const body = notes[0]?.at(-1) ?? "";
      expect(body).toContain("3 builds started today");
      expect(body).toContain("`ready`");
      expect(body).toContain("Generated by");
    });

    it("says it once a UTC day, not once a tick", () => {
      const l = lane();
      for (const m of [0, 3, 6, 9, 12, 15]) l.tick(minutes(m));
      expect(l.posted.filter((a) => a[1] === "comment" && a[2] === "101")).toHaveLength(1);
      l.tick(minutes(24 * 60 + 1), false);
      expect(l.posted.filter((a) => a[1] === "comment" && a[2] === "101")).toHaveLength(1);
    });

    it("a note that cannot be written never frees the hold", () => {
      const l = lane();
      for (const m of [0, 3, 6]) l.tick(minutes(m));
      const refuse = () => {
        throw new Error("HTTP 403");
      };
      expect(l.tick(minutes(9), false, { run: refuse })).toBe(102);
    });

    it("the dry run writes nothing, and the real sweep's default is the one that writes", () => {
      // peekNext's hold takes no writer; claimNext's default is what production runs, so its wiring
      // is pinned at the source, the way the audit executors are.
      const src = readFileSync("scripts/moneypenny/index.mjs", "utf8");
      expect(src).toContain("holdReads = { run: sh }");
      expect(src).toContain("sweepHold({ now: nowMs, ...holdReads })");
      expect(src).toMatch(/holdReads = \{\},\s*\n\s*\/\/ The same holds as the claim/);
    });
  });
});

describe("the admission CLI", () => {
  const setup = () => {
    const out: string[] = [];
    const io = {
      readMode: () => ({ ...mode("normal"), until: null, reason: "x" }),
      readInFlight: () => [],
      readReady: () => [
        issue(4621, "a", ["ready", "feedback"]),
        issue(4700, "b", ["ready", "feedback"]),
      ],
      readIssue: (n: number) => issue(n, "a", ["ready", "feedback"]),
      readPlans: () => [],
      readHold: () => null,
      readRetry: (i: { number?: number }) => (i.number === 4621 ? "3 builds started today" : null),
      print: (l: string) => out.push(l),
      printErr: () => undefined,
    };
    return { io, json: () => JSON.parse(out[0] ?? "null") };
  };

  it("--next mirrors the sweep and steps past it", () => {
    const s = setup();
    expect(runCli(["--next"], s.io)).toBe(0);
    expect(s.json()).toMatchObject({ number: 4700, admit: true });
  });

  it("--check is a live session asking, which is not the retrying lane: it stays admitted", () => {
    const s = setup();
    expect(runCli(["--check", "4621"], s.io)).toBe(0);
    expect(s.json()).toMatchObject({ number: 4621, admit: true });
  });
});
