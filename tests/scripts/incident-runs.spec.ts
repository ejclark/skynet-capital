import { describe, expect, it } from "@rstest/core";
import {
  agedOutCandidates,
  firstRealUnlearned,
  readAllPages,
  windowRanges,
} from "../../scripts/incident-runs.mjs";

// #4242: the incident scan read one 50-run page and called it the 14-day window — 499 failed runs
// existed, and a 76-run outage never showed up. These pin the paging that replaced it.
const page = (total: number, ids: number[]) => ({
  total_count: total,
  workflow_runs: ids.map((id) => ({ id })),
});
const range = (from: number, n: number) => Array.from({ length: n }, (_, i) => from + i);

describe("readAllPages", () => {
  it("WHEN the window spans several pages, reads every one of them", async () => {
    const seen: number[] = [];
    const out = await readAllPages(
      (p: number) => {
        seen.push(p);
        return page(250, range((p - 1) * 100, p === 3 ? 50 : 100));
      },
      { perPage: 100 },
    );
    expect(seen).toEqual([1, 2, 3]);
    expect(out.runs).toHaveLength(250);
    expect(out.truncated).toBe(false);
  });

  it("stops after one request when the first page already holds the whole window", async () => {
    let calls = 0;
    const out = await readAllPages(() => {
      calls++;
      return page(3, [1, 2, 3]);
    });
    expect(calls).toBe(1);
    expect(out).toMatchObject({ total: 3, truncated: false });
  });

  it("IF the window outgrows the page cap, says it is truncated instead of passing as whole", async () => {
    const out = await readAllPages((p: number) => page(499, range(p * 10, 10)), {
      perPage: 10,
      maxPages: 2,
    });
    expect(out.runs).toHaveLength(20);
    expect(out).toMatchObject({ total: 499, truncated: true });
  });

  it("treats an empty window as complete", async () => {
    const out = await readAllPages(() => ({}));
    expect(out).toEqual({ runs: [], total: 0, truncated: false });
  });
});

// #5728: the count fell 18 → 14 overnight with no lesson written — four incidents simply turned
// 15 days old. WHEN an unlearned incident leaves the window, the scan SHALL report it as aged-out.
describe("the aged-out band", () => {
  const now = Date.parse("2026-10-18T12:00:00Z");

  it("reads the window's own length again, just before it, with no day in both or neither", () => {
    expect(windowRanges(14, now)).toEqual({
      since: "2026-10-04",
      window: ">=2026-10-04",
      agedOut: "2026-09-20..2026-10-03",
    });
  });

  const run = (sha: string, id: number) => ({ sha, id });

  it("names each unlearned sha once, newest run first", () => {
    const out = agedOutCandidates([run("aaaaaaa", 3), run("aaaaaaa", 2), run("bbbbbbb", 1)]);
    expect(out).toEqual([run("aaaaaaa", 3), run("bbbbbbb", 1)]);
  });

  it("leaves out a sha the window already reports and one the ledger names", () => {
    const out = agedOutCandidates([run("aaaaaaa", 3), run("bbbbbbb", 2), run("ccccccc", 1)], {
      windowShas: new Set(["aaaaaaa"]),
      isLearned: (sha) => sha === "bbbbbbb",
    });
    expect(out).toEqual([run("ccccccc", 1)]);
  });
});

// #8289: `ship.sh open` ran the full report on every PR, one jobs read per failed run (267 REST
// calls on 2026-11-25). WHEN the ship path asks for the verdict, the scan SHALL stop at the first
// budget + 1 real unlearned incidents, newest first, and never check a learned sha.
describe("the brief read", () => {
  const run = (sha: string, id: number) => ({ sha, id });
  const runs = [
    run("aaaaaaa", 9),
    run("aaaaaaa", 8),
    run("bbbbbbb", 7),
    run("ccccccc", 6),
    run("ddddddd", 5),
  ];

  it("stops at the first real unlearned incident when the budget is 0", async () => {
    const asked: number[] = [];
    const out = await firstRealUnlearned(runs, {
      isLearned: (sha: string) => sha === "aaaaaaa",
      isPhantom: (id: number) => {
        asked.push(id);
        return Promise.resolve(false);
      },
      need: 1,
    });
    expect(asked).toEqual([7]);
    expect(out).toEqual({ real: [run("bbbbbbb", 7)], unlearnedShas: 3, checked: 1 });
  });

  it("passes a zero-job phantom by and keeps looking", async () => {
    const out = await firstRealUnlearned(runs, {
      isLearned: () => false,
      isPhantom: async (id: number) => id === 9,
      need: 1,
    });
    expect(out.real).toEqual([run("bbbbbbb", 7)]);
    expect(out.checked).toBe(2);
  });

  it("IF fewer real incidents exist than it needs, checks every unlearned sha so the count is exact", async () => {
    const out = await firstRealUnlearned(runs, {
      isLearned: () => false,
      isPhantom: async (id: number) => id !== 6,
      need: 2,
    });
    expect(out).toEqual({ real: [run("ccccccc", 6)], unlearnedShas: 4, checked: 4 });
  });
});
