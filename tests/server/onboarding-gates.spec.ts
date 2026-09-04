import {
  atLeagueStartingLine,
  formatUsd,
  LEAGUE_STARTING_EQUITY_USD,
  refuseCredentials,
  refuseOffStartingLine,
} from "../../src/server/onboarding-gates.js";

describe("onboarding gates", () => {
  describe("refuseCredentials", () => {
    it("requires both halves of the pair", () => {
      expect(refuseCredentials("", "s")?.error).toContain("Both");
      expect(refuseCredentials("PK-k", " ")?.error).toContain("Both");
    });

    it("names a live key as such — the fix is the Paper toggle, not a retry", () => {
      const refusal = refuseCredentials("AK-live", "s");
      expect(refusal?.error).toContain("start with PK");
      expect(refusal?.reason).toBeUndefined();
    });

    it("passes a paper key pair, whatever the casing or surrounding whitespace", () => {
      expect(refuseCredentials("  pk-lower ", "s")).toBeUndefined();
      expect(refuseCredentials("PKABCDEF", "secret")).toBeUndefined();
    });
  });

  describe("the starting line", () => {
    it("is $1,000,000 to the cent", () => {
      expect(LEAGUE_STARTING_EQUITY_USD).toBe(1_000_000);
      expect(atLeagueStartingLine(1_000_000)).toBe(true);
      expect(atLeagueStartingLine(Number("1000000.00"))).toBe(true);
      expect(atLeagueStartingLine(1_000_000.01)).toBe(false);
      expect(atLeagueStartingLine(999_999.99)).toBe(false);
    });

    it("refuses Alpaca's default $100,000 with the number found and the number required", () => {
      const refusal = refuseOffStartingLine(100_000);
      expect(refusal).toEqual({
        ok: false,
        reason: "balance",
        found: 100_000,
        error: expect.stringContaining("$100,000.00"),
      });
      expect(refusal?.error).toContain("$1,000,000.00");
    });

    it("lets the starting line through", () => {
      expect(refuseOffStartingLine(1_000_000)).toBeUndefined();
    });
  });

  it("formats dollars with cents and thousands separators", () => {
    expect(formatUsd(1_000_000)).toBe("$1,000,000.00");
    expect(formatUsd(98_765.4)).toBe("$98,765.40");
  });
});
