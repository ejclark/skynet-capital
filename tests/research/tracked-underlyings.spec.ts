import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import { UPCOMING_PRINTS } from "../../src/domain/earnings-calendar.js";
import { G1_GOOG, S1_NVDA } from "../../src/playbooks/registry.js";
import { trackedUnderlyings } from "../../src/research/tracked-underlyings.js";

const print = (symbol: string, date = "2026-09-01"): EarningsPrint => ({
  symbol,
  date,
  status: "estimate",
  source: "spec fixture",
});

describe("trackedUnderlyings", () => {
  it("unions the earnings calendar with the playbook roster", () => {
    expect(trackedUnderlyings([print("MU")], ["NVDA"])).toEqual(["MU", "NVDA"]);
  });

  it("dedupes a symbol that is both a print name and a playbook name", () => {
    expect(trackedUnderlyings([print("NVDA"), print("NVDA", "2026-11-20")], ["NVDA"])).toEqual([
      "NVDA",
    ]);
  });

  it("sorts, so a tick report and any rendering are deterministic", () => {
    expect(trackedUnderlyings([print("MU"), print("AAPL"), print("GOOG")], [])).toEqual([
      "AAPL",
      "GOOG",
      "MU",
    ]);
  });

  it("keeps a symbol whose print has already passed — its IV series must not get a hole", () => {
    expect(trackedUnderlyings([print("NVDA", "2020-01-01")], [])).toEqual(["NVDA"]);
  });

  it("defaults to the real calendar plus the real playbook underlyings", () => {
    const tracked = trackedUnderlyings();
    for (const symbol of UPCOMING_PRINTS.map((p) => p.symbol)) {
      expect(tracked).toContain(symbol);
    }
    expect(tracked).toContain(S1_NVDA.symbol);
    expect(tracked).toContain(G1_GOOG.symbol);
  });

  it("tracks a defensible starting set, not every tradable underlying", () => {
    // The whole point of deriving from two known lists: the set stays small enough that a chain
    // read per name per tick is affordable forever.
    expect(trackedUnderlyings().length).toBeLessThanOrEqual(25);
  });
});
