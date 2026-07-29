import { timezoneForHuman } from "../../src/participants/timezones.js";

describe("timezoneForHuman", () => {
  it("resolves a known slug to its IANA timezone", () => {
    expect(timezoneForHuman("ERIC")).toBe("America/Chicago");
    expect(timezoneForHuman("NATHAN")).toBe("America/Los_Angeles");
    expect(timezoneForHuman("NARAYAN")).toBe("America/Phoenix");
  });

  it("is case-insensitive", () => {
    expect(timezoneForHuman("eric")).toBe("America/Chicago");
    expect(timezoneForHuman("Bruce")).toBe("America/Chicago");
  });

  it("falls back to the first name token when the full slug is unknown", () => {
    // e.g. SKYNET_HUMAN_ERIC_CLARK -> slug "ERIC_CLARK" -> first token "ERIC"
    expect(timezoneForHuman("ERIC_CLARK")).toBe("America/Chicago");
    expect(timezoneForHuman("narayan_thompson")).toBe("America/Phoenix");
  });

  it("returns undefined for a slug with no matching human or first token", () => {
    expect(timezoneForHuman("UNKNOWN_PERSON")).toBeUndefined();
    expect(timezoneForHuman("XYZ")).toBeUndefined();
  });

  it("returns undefined for an empty string", () => {
    expect(timezoneForHuman("")).toBeUndefined();
  });
});
