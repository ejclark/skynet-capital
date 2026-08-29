import {
  describeLifecycleShapes,
  describeValue,
  renderLifecycleShapes,
} from "../../src/trading/option-lifecycle-shape.js";

/**
 * The publishability invariant is the load-bearing one here (#837): this repo is public, so the
 * report a member pastes into an issue must answer "which field carries side" WITHOUT echoing what
 * that member trades. Every "never leaks" case below is that boundary, not style.
 */
describe("describeValue", () => {
  it("prints side enums verbatim — the literal buy/sell IS the finding", () => {
    expect(describeValue("buy")).toBe('"buy"');
    expect(describeValue("sell")).toBe('"sell"');
    expect(describeValue("OPTRD")).toBe('"OPTRD"');
  });

  it("never leaks a ticker, an OCC symbol, or a traded quantity", () => {
    expect(describeValue("AAPL")).toBe("<string:ticker>");
    expect(describeValue("MSFT260918P00420000")).toBe("<string:occ-symbol>");
    expect(describeValue("100")).toBe("<string:numeric>");
    expect(describeValue("-12.5")).toBe("<string:numeric>");
    expect(describeValue(4200.5)).toBe("<number>");
  });

  it("never leaks an unrecognized string's contents, only its length", () => {
    expect(describeValue("assignment of a written put")).toBe("<string:len-27>");
  });

  it("classifies the identifier and timestamp shapes the activity feed keys on", () => {
    expect(describeValue("2f2a1b3c-4d5e-6f70-8192-a3b4c5d6e7f8")).toBe("<string:uuid>");
    expect(describeValue("2026-08-29T14:30:00Z")).toBe("<string:timestamp>");
    expect(describeValue("2026-08-29")).toBe("<string:timestamp>");
  });

  it("describes the non-string shapes without asserting a value", () => {
    expect(describeValue(null)).toBe("<null>");
    expect(describeValue(true)).toBe("<boolean>");
    expect(describeValue("")).toBe("<string:empty>");
    expect(describeValue([1, 2])).toBe("<array:2>");
    expect(describeValue({ a: 1 })).toBe("<object>");
    expect(describeValue(Number.NaN)).toBe("<number:non-finite>");
  });
});

describe("describeLifecycleShapes", () => {
  const optrd = {
    id: "2f2a1b3c-4d5e-6f70-8192-a3b4c5d6e7f8",
    activity_type: "OPTRD",
    transaction_time: "2026-08-29T14:30:00Z",
    symbol: "AAPL",
    qty: "100",
    price: "232.50",
    side: "buy",
  };

  it("groups by activity_type and counts rows", () => {
    const reports = describeLifecycleShapes([
      optrd,
      { ...optrd, id: "b", side: "sell" },
      { id: "c", activity_type: "OPEXP", date: "2026-08-29", symbol: "AAPL", qty: "1" },
    ]);
    expect(reports.map((report) => [report.activityType, report.rows])).toEqual([
      ["OPTRD", 2],
      ["OPEXP", 1],
    ]);
  });

  it("reports every shape a field took, so a side field is visible as buy AND sell", () => {
    const [report] = describeLifecycleShapes([optrd, { ...optrd, id: "b", side: "sell" }]);
    const side = report?.fields.find((field) => field.name === "side");
    expect(side).toEqual({ name: "side", present: 2, shapes: ['"buy"', '"sell"'] });
  });

  it("counts presence, so a field only some rows carry reads as a partial", () => {
    const { side: _omitted, ...noSide } = optrd;
    const [report] = describeLifecycleShapes([optrd, { ...noSide, id: "b" }]);
    expect(report?.fields.find((field) => field.name === "side")?.present).toBe(1);
    expect(report?.fields.find((field) => field.name === "id")?.present).toBe(2);
  });

  it("reports an undefined value as absent rather than as a field the broker sent", () => {
    const [report] = describeLifecycleShapes([{ activity_type: "OPTRD", side: undefined }]);
    expect(report?.fields.map((field) => field.name)).toEqual(["activity_type"]);
  });

  it("surfaces keys the app does not model, which is the whole point of a capture", () => {
    const [report] = describeLifecycleShapes([{ ...optrd, leaves_qty: "0", cum_qty: "100" }]);
    expect(report?.fields.map((field) => field.name)).toContain("leaves_qty");
    expect(report?.fields.map((field) => field.name)).toContain("cum_qty");
  });

  it("buckets a row with no usable activity_type rather than dropping it", () => {
    const reports = describeLifecycleShapes([{ id: "a" }, { activity_type: "  " }]);
    expect(reports).toHaveLength(1);
    expect(reports[0]?.activityType).toBe("<untyped>");
    expect(reports[0]?.rows).toBe(2);
  });

  it("returns nothing for no rows — an empty capture claims nothing", () => {
    expect(describeLifecycleShapes([])).toEqual([]);
  });
});

describe("renderLifecycleShapes", () => {
  it("renders a paste-ready block naming the field that carries side", () => {
    const text = renderLifecycleShapes(
      describeLifecycleShapes([
        { id: "a", activity_type: "OPTRD", symbol: "AAPL", qty: "100", side: "buy" },
      ]),
    );
    expect(text).toContain("OPTRD — 1 row(s)");
    expect(text).toMatch(/side\s+1\/1\s+"buy"/);
    expect(text).not.toContain("AAPL");
    expect(text).not.toContain("100");
  });

  it("says so plainly when the broker returned nothing", () => {
    expect(renderLifecycleShapes([])).toBe(
      "No option lifecycle activities were returned by the broker.",
    );
  });
});
