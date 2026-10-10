import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "@rstest/core";
import {
  clockArg,
  DEFAULT_CLOCK,
  declaredClock,
  memberClock,
  ownerOf,
  parseClock,
  roundClock,
} from "../../scripts/study/clock.mjs";

// A study world runs on the member's clock — their zone and language, from their member file, else
// the owner's — so the times the page formats itself read as the member's own screen shows them
// (#5009: the first full round's worlds ran every member on a zone the owner does not keep).

const MEMBERS = join(import.meta.dirname, "../../docs/members");
const file = (clock?: string, title = "# A member — someone") =>
  [
    title,
    "## 1. Who",
    "- Clock: **Europe/Paris** · fr-FR — a line outside §2 is never read",
    "## 2. What they own",
    ...(clock ? [`- Clock: ${clock} — the zone their phone shows`] : ["- A fixture account."]),
    "## 3. What they are trying to do",
  ].join("\n");

describe("declaredClock — a member file's §2 names the clock", () => {
  it("reads the zone and the language", () => {
    expect(declaredClock(file("**Asia/Tokyo** · ja-JP"))).toEqual({
      timeZone: "Asia/Tokyo",
      locale: "ja-JP",
    });
  });
  it("is null when §2 names none, even if another section does", () => {
    expect(declaredClock(file())).toBeNull();
  });
  it("refuses a zone the runtime does not know", () => {
    expect(() => declaredClock(file("**Mars/Olympus_Mons** · en-US"))).toThrow(/not a known/);
  });
});

describe("the owner's clock", () => {
  it("is the owner's own file's, and DEFAULT_CLOCK says the same", () => {
    const owner = ownerOf(MEMBERS);
    expect(declaredClock(readFileSync(join(MEMBERS, `${owner}.md`), "utf8"))).toEqual({
      ...DEFAULT_CLOCK,
    });
  });
  it("is every member's who names none of their own", () => {
    expect(memberClock("first-timer", MEMBERS)).toEqual({ ...DEFAULT_CLOCK });
  });
});

describe("parseClock — the --clock flag", () => {
  it("defaults to the owner's clock and US English", () => {
    expect(parseClock(undefined)).toBe(DEFAULT_CLOCK);
    expect(parseClock("Europe/London")).toEqual({ timeZone: "Europe/London", locale: "en-US" });
    expect(parseClock("Europe/London,en-GB")).toEqual({
      timeZone: "Europe/London",
      locale: "en-GB",
    });
  });
  it("round-trips through clockArg and refuses nonsense", () => {
    expect(parseClock(clockArg(DEFAULT_CLOCK))).toEqual({ ...DEFAULT_CLOCK });
    expect(() => parseClock("Nowhere/Land")).toThrow(/--clock/);
  });
});

describe("roundClock — one round, one clock", () => {
  const dir = mkdtempSync(join(tmpdir(), "study-clock-"));
  writeFileSync(join(dir, "boss.md"), file("**America/Chicago** · en-US", "# Boss — the owner"));
  writeFileSync(join(dir, "plain.md"), file());
  writeFileSync(join(dir, "abroad.md"), file("**Europe/London** · en-GB"));

  it("finds the owner by the title that says so", () => {
    expect(ownerOf(dir)).toBe("boss");
  });
  it("takes the members' shared clock", () => {
    expect(roundClock(["boss", "plain", "plain"], dir)).toEqual({
      timeZone: "America/Chicago",
      locale: "en-US",
    });
  });
  it("refuses members who keep different clocks, naming them", () => {
    expect(() => roundClock(["boss", "abroad"], dir)).toThrow(/abroad Europe\/London,en-GB/);
  });
});
