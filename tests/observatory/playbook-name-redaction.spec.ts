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

  it("leaves numbers, booleans and nulls as they were", () => {
    const value = { qty: 3, urgent: true, note: null, at: ["2026-10-18"] };
    expect(withoutPlaybookNames(value)).toEqual(value);
  });

  it("cuts a stored wheel order's retire rule out of an invalidator, and only an invalidator (#5043)", () => {
    const call =
      "CRWV settles below the shares' $82.10 on 2026-11-20 — the call expires and the shares are " +
      "underwater; the play retires if its net P/L is below 0 on 2027-01-29";
    const put =
      "CRWV settles below $80 on 2026-11-06 — the wheel buys 100 shares at $80; the play retires if its net P/L is below 0";
    expect(
      withoutPlaybookNames({
        forecast: { invalidator: call },
        reasoning: { invalidator: put, reason: "the play retires if the reason says so" },
      }),
    ).toEqual({
      forecast: {
        invalidator:
          "CRWV settles below the shares' $82.10 on 2026-11-20 — the call expires and the shares are underwater",
      },
      reasoning: {
        invalidator: "CRWV settles below $80 on 2026-11-06 — the bot buys 100 shares at $80",
        reason: "the play retires if the reason says so",
      },
    });
  });
});
