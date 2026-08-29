import { EMAIL } from "../../src/server/invite-form.js";

/** The guest list's email shape gate — deliberately loose (format only, no domain checking). */
describe("EMAIL", () => {
  it("accepts an ordinary address", () => {
    expect(EMAIL.test("ann@example.com")).toBe(true);
  });

  it("rejects anything missing an @ or a domain dot", () => {
    expect(EMAIL.test("not-an-email")).toBe(false);
    expect(EMAIL.test("ann@example")).toBe(false);
    expect(EMAIL.test("@example.com")).toBe(false);
  });

  it("rejects whitespace inside either half", () => {
    expect(EMAIL.test("ann smith@example.com")).toBe(false);
  });
});
