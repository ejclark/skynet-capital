import { cachedDateTimeFormat, formatDateTime } from "../../src/domain/intl-format.js";

/**
 * One formatter per shape (#4613; the why is in src/domain/intl-format.ts). These specs pin the two
 * halves of the contract: the same shape is the same formatter, and the text is exactly what the
 * per-call form printed.
 */

const DAY = { month: "short", day: "numeric", timeZone: "UTC" } as const;
const NY_CLOCK = {
  timeZone: "America/New_York",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
} as const;

describe("cachedDateTimeFormat", () => {
  it("hands back the same formatter for the same locale and options", () => {
    const first = cachedDateTimeFormat("en-US", { ...DAY });
    expect(cachedDateTimeFormat("en-US", { ...DAY })).toBe(first);
    expect(cachedDateTimeFormat("en-GB", { ...DAY })).not.toBe(first);
    expect(cachedDateTimeFormat("en-US", { ...DAY, timeZone: "Asia/Tokyo" })).not.toBe(first);
  });

  it("formats exactly as a freshly built formatter does", () => {
    const at = new Date("2026-11-01T05:30:00.000Z");
    const options = { timeZone: "America/New_York", weekday: "short", hour: "2-digit" } as const;
    expect(cachedDateTimeFormat("en-US", options).format(at)).toBe(
      new Intl.DateTimeFormat("en-US", options).format(at),
    );
  });

  it("throws where the constructor throws — an unknown zone — and remembers nothing", () => {
    expect(() => cachedDateTimeFormat("en-US", { timeZone: "Mars/Olympus_Mons" })).toThrow(
      RangeError,
    );
    expect(() => cachedDateTimeFormat("en-US", { timeZone: "Mars/Olympus_Mons" })).toThrow(
      RangeError,
    );
  });

  it("builds a shape once however many rows it formats", () => {
    const Real = Intl.DateTimeFormat;
    let built = 0;
    // Counting constructions IS the behaviour here: each one is native memory the heap can't see.
    Intl.DateTimeFormat = class extends Real {
      constructor(...args: ConstructorParameters<typeof Real>) {
        super(...args);
        built += 1;
      }
    } as typeof Real;
    try {
      for (let i = 0; i < 1000; i++)
        cachedDateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "numeric" });
    } finally {
      Intl.DateTimeFormat = Real;
    }
    expect(built).toBeLessThanOrEqual(1);
  });
});

describe("formatDateTime — toLocale*String's text through a cached formatter", () => {
  it("prints what toLocaleDateString printed, across a year of hours", () => {
    for (let t = Date.parse("2026-01-01T00:00:00Z"); t < Date.parse("2027-01-01Z"); t += 3_600_000)
      expect(formatDateTime(new Date(t), "en-US", DAY)).toBe(
        new Date(t).toLocaleDateString("en-US", DAY),
      );
  });

  it("prints what toLocaleString printed in New York time, both DST changes included", () => {
    for (const iso of [
      "2026-03-08T06:59:59.000Z",
      "2026-03-08T07:00:00.000Z",
      "2026-11-01T05:30:00.000Z",
      "2026-11-01T06:30:00.000Z",
      "2026-12-31T23:59:59.000Z",
    ])
      expect(formatDateTime(new Date(iso), "en-US", NY_CLOCK)).toBe(
        new Date(iso).toLocaleString("en-US", { timeZone: "America/New_York" }),
      );
  });

  it("answers an invalid date with the same 'Invalid Date' toLocale*String gives, never a throw", () => {
    expect(formatDateTime(new Date("nope"), "en-US", DAY)).toBe(
      new Date("nope").toLocaleDateString("en-US", DAY),
    );
  });
});
