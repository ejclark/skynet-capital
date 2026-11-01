import {
  MAX_STARTS_PER_DAY,
  retryHold,
  retryHoldReason,
  runCli,
} from "../../../scripts/moneypenny/admission.mjs";
import { type ClaimCtx, claimNext, peekNext } from "../../../scripts/moneypenny/index.mjs";
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
