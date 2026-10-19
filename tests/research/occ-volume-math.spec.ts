import { parseVolume, surgeRatio } from "../../scripts/research/occ-volume-math.mjs";

/** Candidate 1's volume input (#4808 slice 3). The rows are the OCC's real format, verified live 2026-10-18. */

const CSV = [
  "quantity,underlying,symbol,actype,porc,exchange,actdate",
  "50160,NVDA,2NVDA,C,C,CBOE,10/16/2026,",
  "3635,NVDA,2NVDA,F,C,CBOE,10/16/2026,",
  "50014,NVDA,2NVDA,C,P,CBOE,10/16/2026,",
  "2000,C,1C,C,P,PHLX,10/16/2026",
  "not a row",
  "",
].join("\n");

describe("parseVolume", () => {
  it("sums calls and puts per underlying across account types and exchanges", () => {
    const volume = parseVolume(CSV);
    expect(volume.get("NVDA")).toEqual({ call: 53795, put: 50014, total: 103809 });
    expect(volume.get("C")).toEqual({ call: 0, put: 2000, total: 2000 });
  });

  it("skips the header and lines that are not rows", () => {
    expect([...parseVolume(CSV).keys()].sort()).toEqual(["C", "NVDA"]);
    expect(parseVolume("").size).toBe(0);
  });
});

describe("surgeRatio", () => {
  const flat = Array(20).fill(1000);

  it("is today over the trailing mean of the last 20 sessions only", () => {
    expect(surgeRatio(3000, flat)).toBe(3);
    expect(surgeRatio(3000, [9e9, ...flat])).toBe(3);
  });

  it("is undefined until there is a full baseline, and for a baseline of nothing", () => {
    expect(surgeRatio(3000, flat.slice(1))).toBeUndefined();
    expect(surgeRatio(3000, Array(20).fill(0))).toBeUndefined();
  });
});
