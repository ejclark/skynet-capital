import { describe, expect, it } from "@rstest/core";
import { readAllPages } from "../../scripts/incident-runs.mjs";

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
