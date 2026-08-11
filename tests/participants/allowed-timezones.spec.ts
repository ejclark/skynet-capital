import { ALLOWED_TIMEZONES, isAllowedTimezone } from "../../src/participants/allowed-timezones.js";

describe("isAllowedTimezone", () => {
  it("accepts every offered value", () => {
    for (const { value } of ALLOWED_TIMEZONES) {
      expect(isAllowedTimezone(value)).toBe(true);
    }
  });

  it("rejects a typo'd or non-IANA string", () => {
    expect(isAllowedTimezone("Amercia/Chicago")).toBe(false);
    expect(isAllowedTimezone("not-a-timezone")).toBe(false);
    expect(isAllowedTimezone("")).toBe(false);
  });

  it("is case-sensitive to the canonical IANA spelling", () => {
    expect(isAllowedTimezone("america/chicago")).toBe(false);
  });
});
