import { callMix, classifyCall, hubEvents } from "../../src/live/call-mix";

// The honest sentiment tell (#1704 slice 3): authored calls sorted by their opening words.
describe("classifyCall", () => {
  it("sorts the corpus's common openings into the four classes", () => {
    expect(classifyCall("**Stand aside** — nothing here is ours to hold")).toBe("stand-aside");
    expect(classifyCall("No AVGO position; the print is scored")).toBe("stand-aside");
    expect(classifyCall("Never size a US position to a non-Fed central bank")).toBe("stand-aside");
    expect(classifyCall("Watch the 04:00 ET release window")).toBe("watch");
    expect(classifyCall("Buy protection, not direction")).toBe("act");
    expect(classifyCall("Accumulate small into the 09-29 print")).toBe("act");
    expect(classifyCall("Do not read the open as the verdict until the opex leg is checked")).toBe(
      "stand-aside",
    );
    expect(classifyCall("XPV stays live event risk, not a thesis")).toBe("conditional");
  });
});

describe("callMix / hubEvents", () => {
  it("counts every class, zeros included", () => {
    expect(callMix(["Stand aside", "Watch CPI", "Stand aside"])).toEqual({
      "stand-aside": 2,
      watch: 1,
      act: 0,
      conditional: 0,
    });
  });

  it("ranks the events most ledgers name as adjacent, one vote per ledger", () => {
    const hubs = hubEvents([
      ["cpi-2026-09-11", "fomc-2026-09-16", "cpi-2026-09-11"],
      ["cpi-2026-09-11"],
      ["fomc-2026-09-16", "opex-2026-09-18"],
    ]);
    expect(hubs).toEqual([
      { id: "cpi-2026-09-11", count: 2 },
      { id: "fomc-2026-09-16", count: 2 },
      { id: "opex-2026-09-18", count: 1 },
    ]);
    expect(hubEvents([["a"], ["b"], ["c"]], 2)).toHaveLength(2);
  });
});
