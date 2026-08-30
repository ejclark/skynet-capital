import { findSmells } from "../../scripts/test-quality-scan.mjs";

// Advisory implementation-testing smell detector (Eric, 2026-08-30: tests as acceptance criteria —
// docs/ENGINEERING.md already forbids asserting on private fields or call counts; this catches
// regression into that pattern rather than gating it, since a real boundary can be a legitimate
// exception a script can't judge). Pure pattern-matching only; git-diff wiring is untested here,
// same split as plan-closure-scan.spec.ts.
describe("test-quality-scan: findSmells", () => {
  it("flags a call-count assertion", () => {
    const hits = findSmells("expect(fn).toHaveBeenCalledTimes(2);");
    expect(hits).toHaveLength(1);
    expect(hits[0]?.reason).toContain("call COUNT");
  });

  it("flags a call-arguments assertion", () => {
    const hits = findSmells('expect(fn).toHaveBeenCalledWith("x");');
    expect(hits).toHaveLength(1);
    expect(hits[0]?.reason).toContain("HOW a collaborator was called");
  });

  it("flags direct mock.calls access", () => {
    const hits = findSmells("const args = fn.mock.calls[0];");
    expect(hits).toHaveLength(1);
  });

  it("flags vi.spyOn and jest.spyOn", () => {
    expect(findSmells('vi.spyOn(obj, "method");')).toHaveLength(1);
    expect(findSmells('jest.spyOn(obj, "method");')).toHaveLength(1);
  });

  it("reports the correct line number for a hit past line one", () => {
    const hits = findSmells("const a = 1;\nconst b = 2;\nexpect(fn).toHaveBeenCalledTimes(1);");
    expect(hits[0]?.line).toBe(3);
  });

  it("stays silent on an ordinary behavioral assertion", () => {
    const hits = findSmells('expect(intents[0]).toMatchObject({ symbol: "SPY", side: "buy" });');
    expect(hits).toEqual([]);
  });

  it("stays silent on the empty string", () => {
    expect(findSmells("")).toEqual([]);
  });
});
