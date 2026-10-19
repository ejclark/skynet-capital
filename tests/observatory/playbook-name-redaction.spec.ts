import { withoutPlaybookNames } from "../../src/observatory/playbook-name-redaction.js";

// #4442 — a non-owner's copy keeps the bot's words with the playbook's name taken out of them.
describe("withoutPlaybookNames", () => {
  it("replaces a roster id inside free text, at any depth", () => {
    const out = withoutPlaybookNames({
      call: { why: "S1-NVDA window open (standard): fade the print" },
      outcomes: [{ reason: "CRWV-LONG-CALL exit-safety trip (standard): drawdown" }],
    });
    expect(out).toEqual({
      call: { why: "a playbook window open (standard): fade the print" },
      outcomes: [{ reason: "a playbook exit-safety trip (standard): drawdown" }],
    });
  });

  it("matches whole ids only, never a ticker or a longer token", () => {
    const text = "NVDA held; S1-NVDA2 is not a play; SAURONS neither";
    expect(withoutPlaybookNames({ text })).toEqual({ text });
  });

  it("catches an id the original payload named in a stripped key, roster or not", () => {
    const original = { playbookId: "MEMBER-PLAY-7", reason: "MEMBER-PLAY-7 window open" };
    const { playbookId: _p, ...stripped } = original;
    expect(withoutPlaybookNames(stripped, original)).toEqual({
      reason: "a playbook window open",
    });
  });

  it("cuts a stored spread's retire test, leaving the order's own falsifier (#5828)", () => {
    const invalidator =
      "NVDA's D-20→D-5 return ≤ 0 on 2 of the next 3 prints, or this spread exits below its cost";
    expect(withoutPlaybookNames({ forecast: { invalidator } })).toEqual({
      forecast: { invalidator: "this spread exits below its cost" },
    });
  });

  it("leaves numbers, booleans and nulls as they were", () => {
    const value = { qty: 3, urgent: true, note: null, at: ["2026-10-18"] };
    expect(withoutPlaybookNames(value)).toEqual(value);
  });
});
