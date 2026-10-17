import {
  knownSymbols,
  type StudyLedgerEntry,
  withStudies,
} from "../../src/playbooks/claim-studies.js";
import {
  type RunnerDeps,
  runClaimStudies,
  type StudyRunRequest,
} from "../../src/playbooks/claim-study-runner.js";
import type { Conviction, ConvictionClaim } from "../../src/playbooks/conviction-record.js";
import { AI_DIP_2026_10 } from "../../src/playbooks/conviction-seeds.js";

/**
 * #5482 slice 3 — running a conviction's claims once, through the research budget. The instruments
 * are stubbed, so these pin the three guarantees without a network: a claim is studied ONCE per data
 * date, a pass is BOUNDED by the dial's cap, and a failed or unreadable run INVENTS nothing.
 */

const claim = (statement: string, over: Partial<ConvictionClaim> = {}): ConvictionClaim => ({
  tag: "underrated",
  statement,
  bucket: "tested",
  evidence: "Cited elsewhere.",
  falsifier: "Proven wrong by 2026-12-01.",
  ...over,
});

const FLOOR = "CRWV's floor is probably $48–$52: more pullback first.";
const RECOVERY = "CRWV: back above today's price in 3 to 6 months.";
const PREMIUM = "CRWV premiums are rich after the drop.";
const RUN_UP = "NVDA runs up into its print.";
const UNMEASURED = "Hold through earnings: print moves run larger than priced.";
const WORLDVIEW = "In the long run, AI adopters win.";

const view = (claims: ConvictionClaim[]): Conviction => ({
  id: "test-view",
  owner: "Eric",
  statedOn: "2026-10-16",
  checkOn: "2027-01-29",
  claims,
  steers: ["CRWV-WHEEL"],
});

/** What cycle-phase writes, enough for the floor and recovery judges. */
const cycleOutput = [
  {
    today: {
      date: "2026-10-16",
      close: 64.72,
      putExpiry: "2026-11-06",
      options: { asOf: "2026-10-16 14:13:57" },
    },
    headline: {
      sample: "pooled",
      level: "exact",
      episodes: 43,
      clusters: 22,
      further: { p25: -0.3, p50: -0.17, p75: -0.076 },
      furtherScaled: { p25: -0.54, p50: -0.28, p75: -0.13 },
      toLow: [0, 8, 23, 49, 58],
      backToEntry: [1, 13, 43, ">126", ">126"],
      entryIn63: 0.67,
      highIn126: 0.35,
      rungs: [],
    },
  },
];
const fitOutput = {
  symbol: "CRWV",
  iv30: 0.93,
  fit: { verdict: "stand aside", rank: 0.63, gap: -0.006, confidence: "low" },
};
const runUpReport = [
  "[RUN-UP] close D-20 -> close D (held into, but not through, the print) | non-earnings baseline +4.26%",
  "  era                n    mean%     med%     win%     p10%     p90%  excess%",
  "  2023-2026         15     9.16     7.73      100     1.78    19.17     4.90",
  "",
].join("\n");

interface Harness {
  deps: RunnerDeps;
  requests: StudyRunRequest[];
  setDate: (date: string) => void;
}

function harness(outputs: Record<string, unknown> = {}): Harness {
  let date = "2026-10-16";
  const requests: StudyRunRequest[] = [];
  const all: Record<string, unknown> = {
    "premium-fit": fitOutput,
    "cycle-phase": cycleOutput,
    "earnings-cycle": runUpReport,
    ...outputs,
  };
  return {
    requests,
    setDate: (d) => {
      date = d;
    },
    deps: {
      dataDate: () => Promise.resolve(date),
      execute: (request) => {
        requests.push(request);
        const output = all[request.instrument];
        if (output instanceof Error) return Promise.reject(output);
        // The CLI lifts the chain's quote time out of cycle-phase's reading; the stub does the same.
        const dataAsOf = request.instrument === "cycle-phase" ? "2026-10-16 14:13:57" : undefined;
        return Promise.resolve({ output, ...(dataAsOf ? { dataAsOf } : {}) });
      },
    },
  };
}

const opts = (cap: number) => ({ cap, universe: knownSymbols(), contextSymbol: "CRWV" });

/** The conviction as the store would hold it after a pass: the entries attached to its claims. */
const after = (c: Conviction, entries: readonly StudyLedgerEntry[]) => withStudies(c, entries);

describe("one pass over a conviction", () => {
  it("runs each instrument once per symbol, however many claims read it, and judges every claim", async () => {
    const h = harness();
    const result = await runClaimStudies(
      view([claim(FLOOR), claim(RECOVERY), claim(PREMIUM)]),
      h.deps,
      opts(6),
    );
    expect(h.requests).toEqual([
      { instrument: "cycle-phase", symbol: "CRWV", dataDate: "2026-10-16" },
      { instrument: "premium-fit", symbol: "CRWV", dataDate: "2026-10-16" },
    ]);
    expect(result.budget).toEqual({ cap: 6, used: 2, deferred: 0 });
    expect(result.entries.map((e) => e.study.disposition)).toEqual([
      "studied",
      "studied",
      "studied",
    ]);
    const floor = result.entries[0]?.study;
    expect(floor?.disposition === "studied" && floor.dataAsOf).toBe("2026-10-16 14:13:57");
  });

  it("costs no run for an offer or an untestable label, and writes them at size zero", async () => {
    const h = harness();
    const result = await runClaimStudies(
      view([
        claim(UNMEASURED, { bucket: "forward", scoreBy: "2026-11-17" }),
        claim(WORLDVIEW, { bucket: "untestable" }),
      ]),
      h.deps,
      opts(0),
    );
    expect(h.requests).toEqual([]);
    expect(result.budget.used).toBe(0);
    expect(result.entries.map((e) => e.study)).toMatchObject([
      { disposition: "offer", size: 0, forwardTest: { scoreBy: "2026-11-17" } },
      { disposition: "untestable", size: 0 },
    ]);
  });
});

describe("once: a claim is not re-run for a data date it already has a verdict for", () => {
  it("a second pass on the same day starts nothing and changes nothing", async () => {
    const h = harness();
    const first = await runClaimStudies(view([claim(FLOOR), claim(RUN_UP)]), h.deps, opts(6));
    expect(h.requests).toHaveLength(2);

    const second = await runClaimStudies(
      after(view([claim(FLOOR), claim(RUN_UP)]), first.entries),
      h.deps,
      opts(6),
    );
    expect(h.requests).toHaveLength(2); // no new run
    expect(second.runs.map((r) => r.outcome)).toEqual(["fresh", "fresh"]);
    expect(second.budget.used).toBe(0);
    expect(second.entries).toEqual(first.entries);
  });

  it("re-runs when the data date has moved on, and replaces the verdict", async () => {
    const h = harness();
    const c = view([claim(FLOOR)]);
    const first = await runClaimStudies(c, h.deps, opts(6));
    h.setDate("2026-10-19");
    const second = await runClaimStudies(after(c, first.entries), h.deps, opts(6));
    expect(h.requests).toHaveLength(2);
    const s = second.entries[0]?.study;
    expect(s?.disposition === "studied" && s.dataDate).toBe("2026-10-19");
  });

  it("re-runs only the claims that went stale when a run is shared with fresh ones", async () => {
    const h = harness();
    const first = await runClaimStudies(view([claim(FLOOR)]), h.deps, opts(6));
    // The record gains a second claim on the same instrument and symbol; the first is still fresh.
    const grown = after(view([claim(FLOOR), claim(RECOVERY)]), first.entries);
    const second = await runClaimStudies(grown, h.deps, opts(6));
    expect(h.requests).toHaveLength(2);
    expect(second.entries).toHaveLength(2);
    expect(second.entries[0]).toEqual(first.entries[0]); // untouched, byte for byte
  });

  it("treats a re-read claim as new: the old verdict does not carry to the new sentence", async () => {
    const h = harness();
    const first = await runClaimStudies(view([claim(FLOOR)]), h.deps, opts(6));
    const reread = after(view([claim(`${FLOOR} (re-read)`)]), first.entries);
    expect(reread.claims[0]?.study).toBeUndefined();
    await runClaimStudies(reread, h.deps, opts(6));
    expect(h.requests).toHaveLength(2);
  });
});

describe("bounded: a pass starts at most the dial's number of runs", () => {
  const claims = () => [claim(PREMIUM), claim(FLOOR), claim(RUN_UP)];

  it("defers the runs past the cap, in claim order, and keeps their claims unstudied", async () => {
    const h = harness();
    const result = await runClaimStudies(view(claims()), h.deps, opts(2));
    expect(h.requests.map((r) => r.instrument)).toEqual(["premium-fit", "cycle-phase"]);
    expect(result.runs.map((r) => r.outcome)).toEqual(["ran", "ran", "deferred"]);
    expect(result.budget).toEqual({ cap: 2, used: 2, deferred: 1 });
    expect(result.entries.map((e) => e.study.disposition)).toEqual(["studied", "studied"]);
  });

  it("picks the deferred run up on the next pass, and only that one", async () => {
    const h = harness();
    const first = await runClaimStudies(view(claims()), h.deps, opts(2));
    const second = await runClaimStudies(after(view(claims()), first.entries), h.deps, opts(2));
    expect(h.requests.map((r) => r.instrument)).toEqual([
      "premium-fit",
      "cycle-phase",
      "earnings-cycle",
    ]);
    expect(second.runs.map((r) => r.outcome)).toEqual(["fresh", "fresh", "ran"]);
    expect(second.entries).toHaveLength(3);
  });

  it("starts nothing at a cap of zero (halt), and says so", async () => {
    const h = harness();
    const result = await runClaimStudies(view(claims()), h.deps, opts(0));
    expect(h.requests).toEqual([]);
    expect(result.runs.map((r) => r.outcome)).toEqual(["deferred", "deferred", "deferred"]);
    expect(result.entries).toEqual([]);
  });

  it("refuses a cap that is not a whole number of runs, instead of reading it as unlimited", async () => {
    const h = harness();
    for (const cap of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      await expect(runClaimStudies(view(claims()), h.deps, opts(cap))).rejects.toThrow(
        /whole number of runs/,
      );
    }
    expect(h.requests).toEqual([]);
  });

  it("charges a planned (dry) run to the cap but executes nothing", async () => {
    const h = harness();
    const result = await runClaimStudies(view(claims()), h.deps, { ...opts(2), dry: true });
    expect(h.requests).toEqual([]);
    expect(result.runs.map((r) => r.outcome)).toEqual(["planned", "planned", "deferred"]);
    expect(result.entries).toEqual([]);
  });
});

describe("nothing invented", () => {
  it("leaves the claims unstudied when the instrument throws, and still charges the run", async () => {
    const h = harness({ "cycle-phase": new Error("Yahoo 429") });
    const result = await runClaimStudies(view([claim(FLOOR), claim(RUN_UP)]), h.deps, opts(6));
    expect(result.runs[0]).toMatchObject({ outcome: "failed", error: "Yahoo 429" });
    expect(result.entries.map((e) => e.study.disposition)).toEqual(["studied"]);
    expect(result.budget.used).toBe(2);
  });

  it("leaves a claim unstudied when its judge cannot read the output, naming the claim", async () => {
    const h = harness({ "earnings-cycle": "a report in a format nobody expected" });
    const result = await runClaimStudies(view([claim(RUN_UP)]), h.deps, opts(6));
    expect(result.runs[0]).toMatchObject({
      outcome: "failed",
      error: "output not readable for claim 1",
    });
    expect(result.entries).toEqual([]);
  });

  it("keeps an earlier study when a later run fails, dated by its own data date", async () => {
    const h = harness();
    const c = view([claim(FLOOR)]);
    const first = await runClaimStudies(c, h.deps, opts(6));
    const failing = harness({ "cycle-phase": new Error("down") });
    failing.setDate("2026-10-19");
    const second = await runClaimStudies(after(c, first.entries), failing.deps, opts(6));
    const kept = second.entries[0]?.study;
    expect(kept?.disposition === "studied" && kept.dataDate).toBe("2026-10-16");
  });

  it("reports a data-date failure without spending a run", async () => {
    const h = harness();
    const deps: RunnerDeps = {
      ...h.deps,
      dataDate: () => Promise.reject(new Error("no price history")),
    };
    const result = await runClaimStudies(view([claim(FLOOR)]), deps, opts(6));
    expect(result.runs[0]).toMatchObject({ outcome: "failed", dataDate: null });
    expect(result.budget.used).toBe(0);
  });
});

describe("the seeded AI-dip conviction through a pass", () => {
  it("is already studied for its data date: a pass starts no run", async () => {
    const h = harness();
    const studied = AI_DIP_2026_10.claims
      .map((c) => c.study)
      .find((s) => s?.disposition === "studied");
    h.setDate(studied?.disposition === "studied" ? studied.dataDate : "");
    const result = await runClaimStudies(AI_DIP_2026_10, h.deps, opts(6));
    expect(h.requests).toEqual([]);
    expect(result.runs.map((r) => `${r.instrument}/${r.symbol}:${r.outcome}`)).toEqual([
      "premium-fit/CRWV:fresh",
      "cycle-phase/CRWV:fresh",
      "earnings-cycle/NVDA:fresh",
    ]);
    expect(result.entries.map((e) => e.study)).toEqual(AI_DIP_2026_10.claims.map((c) => c.study));
  });
});
