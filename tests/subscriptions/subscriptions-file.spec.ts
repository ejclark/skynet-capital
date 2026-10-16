import type { PlaybookSubscription } from "../../src/domain/types.js";
import { parseSubscriptionsState } from "../../src/subscriptions/subscription-state.js";
import {
  ALLOCATIONS_KEY,
  allocationsIn,
  parseAllocations,
  readsWhole,
  rewrite,
  withAllocations,
} from "../../src/subscriptions/subscriptions-file.js";

/**
 * The subscriptions file beyond its accounts (#4772, #4469 slice 3c part 1): a rewrite keeps what
 * this build could not read, and the strategy allocations ride under a key no account can take.
 */

const record = (playbookId: string, over: Record<string, unknown> = {}) => ({
  accountId: "sauron",
  playbookId,
  mode: "standard",
  capitalAllocated: 50_000,
  enabled: true,
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
  ...over,
});

const parsed = (raw: unknown) => parseSubscriptionsState(raw) ?? {};

const WHEEL = { capitalAllocated: 75_000, updatedAt: "2026-10-07T00:00:00.000Z" };

describe("parseAllocations — one record per account × strategy", () => {
  it("reads a well-formed allocation per strategy", () => {
    expect(parseAllocations({ sauron: { wheel: WHEEL, "pre-print-run-up": WHEEL } })).toEqual({
      sauron: { wheel: WHEEL, "pre-print-run-up": WHEEL },
    });
  });

  it("leaves out a strategy this build does not know, and a malformed record, never the rest", () => {
    const state = parseAllocations({
      sauron: {
        wheel: WHEEL,
        "iron-condor": WHEEL,
        "call-spread": { capitalAllocated: "5000", updatedAt: "x" },
        event: { capitalAllocated: 0, updatedAt: "x" },
        tactical: { capitalAllocated: Number.POSITIVE_INFINITY, updatedAt: "x" },
        "forced-pick": { capitalAllocated: 10 },
      },
      banker: "not a record",
      worf: { "iron-condor": WHEEL },
    });
    expect(state).toEqual({ sauron: { wheel: WHEEL } });
  });

  it("is empty for anything but a record — a missing key reads as no allocations", () => {
    for (const raw of [undefined, null, [], "x", 3]) expect(parseAllocations(raw)).toEqual({});
  });

  it("never reads an inherited key as a strategy", () => {
    expect(
      parseAllocations(
        JSON.parse('{"sauron": {"toString": {"capitalAllocated": 1, "updatedAt": "x"}}}'),
      ),
    ).toEqual({});
  });

  it("reads them off the whole file's reserved key, which the accounts parse skips", () => {
    const file = { sauron: [record("S1-NVDA")], [ALLOCATIONS_KEY]: { sauron: { wheel: WHEEL } } };
    expect(allocationsIn(file)).toEqual({ sauron: { wheel: WHEEL } });
    expect(Object.keys(parsed(file))).toEqual(["sauron"]);
  });
});

describe("rewrite — keep what this build could not read (#4772)", () => {
  it("keeps a record that does not parse, byte for byte, after the account's own, and says so", () => {
    const unread = record("S1-NVDA", { mode: "observe-v2", window: { from: "D-20" } });
    const disk = { sauron: [record("CRWV-WHEEL"), unread] };
    const state = parsed(disk);

    const { document, notes } = rewrite(state, disk);

    expect(document).toEqual({ sauron: [...(state.sauron ?? []), unread] });
    expect(notes).toEqual(["sauron: kept 1 record unchanged"]);
  });

  it("keeps an account's unread records after its last readable one is unsubscribed", () => {
    const unread = record("G1-GOOG", { mode: "observe-v2" });
    const { document } = rewrite({}, { sauron: [record("S1-NVDA"), unread] });
    expect(document).toEqual({ sauron: [unread] });
  });

  it("keeps a top-level key it does not own as is — the allocations among them", () => {
    const allocations = { sauron: { wheel: WHEEL, "iron-condor": { anything: true } } };
    const disk = { [ALLOCATIONS_KEY]: allocations, $future: [1, 2], sauron: [record("S1-NVDA")] };
    const { document, notes } = rewrite(parsed(disk), disk);
    expect(document[ALLOCATIONS_KEY]).toEqual(allocations);
    expect(document.$future).toEqual([1, 2]);
    expect(notes).toEqual([]);
  });

  it("lets a subscribe replace an unread record by playbook id, as it replaces any record", () => {
    const fresh: PlaybookSubscription = {
      ...record("S1-NVDA"),
      accountId: "sauron",
      mode: "aggressive",
    };
    const { document } = rewrite(
      { sauron: [fresh] },
      { sauron: [record("S1-NVDA", { mode: "observe-v2" })] },
    );
    expect(document).toEqual({ sauron: [fresh] });
  });

  it("says when it drops a malformed value of a field it owns from a record the state still holds", () => {
    const disk = {
      sauron: [
        record("CRWV-WHEEL", { conviction: { reason: "", checkOn: "2027-01-29" } }),
        record("S1-NVDA", { symbols: [] }),
        record("G1-GOOG"),
      ],
    };
    const state = parsed(disk);
    expect(rewrite(state, disk).notes).toEqual([
      "sauron: dropped a malformed value from 2 records",
    ]);
    // Unsubscribed, it is not a loss worth saying.
    expect(rewrite({ sauron: (state.sauron ?? []).slice(2) }, disk).notes).toEqual([]);
  });

  it("carries a conviction's sub-field a newer build added, so nothing is said or lost", () => {
    const conviction = { reason: "Eric's call", checkOn: "2027-01-29", retireTest: "1-in-3" };
    const disk = { sauron: [record("CRWV-WHEEL", { conviction })] };
    const { document, notes } = rewrite(parsed(disk), disk);
    expect(document).toEqual(disk);
    expect(notes).toEqual([]);
    expect(readsWhole(disk, parsed(disk))).toBe(true);
  });

  it("writes the state alone over a missing or unreadable file", () => {
    const state = { sauron: [record("S1-NVDA") as PlaybookSubscription] };
    expect(rewrite(state, undefined).document).toEqual(state);
    expect(rewrite(state, "torn").document).toEqual(state);
  });

  it("an account the state now holds wins over a non-array value on disk", () => {
    const state = { banker: [record("S1-NVDA", { accountId: "banker" }) as PlaybookSubscription] };
    expect(rewrite(state, { banker: "not an array" }).document).toEqual(state);
  });
});

describe("readsWhole — the seeders' bar", () => {
  it("passes a record carrying a newer build's field, now that the field survives a rewrite", () => {
    const raw = { sauron: [record("S1-NVDA", { addedByANewerBuild: true })] };
    expect(readsWhole(raw, parsed(raw))).toBe(true);
  });

  it("passes a reserved key, which no seed ever changes", () => {
    const raw = { sauron: [record("S1-NVDA")], [ALLOCATIONS_KEY]: { anything: "at all" } };
    expect(readsWhole(raw, parsed(raw))).toBe(true);
  });

  it("still fails a record that did not parse — a seed must see every record an account holds", () => {
    for (const bad of [
      record("S1-NVDA", { mode: "custom" }),
      record("S1-NVDA", { capitalAllocated: "50000" }),
    ]) {
      const raw = { sauron: [record("CRWV-WHEEL"), bad] };
      expect(readsWhole(raw, parsed(raw))).toBe(false);
    }
  });

  it("still fails an account key holding something other than records", () => {
    const raw = { sauron: [record("S1-NVDA")], banker: "not an array" };
    expect(readsWhole(raw, parsed(raw))).toBe(false);
  });
});

describe("withAllocations — the allocation write (#4469 slice 3c part 3)", () => {
  const RUN_UP = { capitalAllocated: 60_000, updatedAt: "2026-10-09T00:00:00.000Z" };

  it("lays the allocations over the file and leaves every account's records as they are", () => {
    const disk = { sauron: [record("CRWV-WHEEL")], $future: { x: 1 } };
    expect(withAllocations({ sauron: { wheel: WHEEL } }, disk)).toEqual({
      ...disk,
      [ALLOCATIONS_KEY]: { sauron: { wheel: WHEEL } },
    });
  });

  it("keeps an entry this build cannot read, and clears one it reads that is gone", () => {
    const disk = {
      [ALLOCATIONS_KEY]: {
        sauron: { wheel: WHEEL, "iron-condor": WHEEL, "call-spread": { capitalAllocated: "x" } },
        banker: "not a record",
      },
    };
    expect(withAllocations({ sauron: { "pre-print-run-up": RUN_UP } }, disk)).toEqual({
      [ALLOCATIONS_KEY]: {
        sauron: {
          "iron-condor": WHEEL,
          "call-spread": { capitalAllocated: "x" },
          "pre-print-run-up": RUN_UP,
        },
        banker: "not a record",
      },
    });
  });

  it("drops the key once nothing is left in it", () => {
    expect(
      withAllocations(
        {},
        { sauron: [record("S1-NVDA")], [ALLOCATIONS_KEY]: { sauron: { wheel: WHEEL } } },
      ),
    ).toEqual({ sauron: [record("S1-NVDA")] });
  });

  it("round-trips through allocationsIn", () => {
    const file = withAllocations({ sauron: { wheel: WHEEL } }, undefined);
    expect(allocationsIn(file)).toEqual({ sauron: { wheel: WHEEL } });
  });
});
