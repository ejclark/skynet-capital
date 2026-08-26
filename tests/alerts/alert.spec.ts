import {
  type Alert,
  alertFingerprint,
  matchesFilter,
  priorityRank,
  sortAlerts,
} from "../../src/alerts/alert.js";

const alert = (over: Partial<Alert> = {}): Alert => ({
  id: "a1",
  at: 1_000,
  source: "price",
  priority: "warning",
  title: "NVDA through its stop",
  symbol: "NVDA",
  ...over,
});

describe("priorityRank", () => {
  it("ranks critical louder than warning, and warning louder than info", () => {
    expect(priorityRank("critical")).toBeLessThan(priorityRank("warning"));
    expect(priorityRank("warning")).toBeLessThan(priorityRank("info"));
  });
});

describe("matchesFilter", () => {
  it("matches everything when no filter is given", () => {
    expect(matchesFilter(alert())).toBe(true);
  });

  it("matches everything for an empty filter — the firehose is opt-in, not the default", () => {
    expect(matchesFilter(alert(), {})).toBe(true);
  });

  it.each([
    ["critical passes a critical floor", "critical", "critical", true],
    ["warning fails a critical floor", "warning", "critical", false],
    ["critical passes a warning floor", "critical", "warning", true],
    ["info fails a warning floor", "info", "warning", false],
    ["info passes an info floor", "info", "info", true],
  ] as const)("%s", (_label, priority, minPriority, expected) => {
    expect(matchesFilter(alert({ priority }), { minPriority })).toBe(expected);
  });

  it("keeps only the named sources", () => {
    expect(matchesFilter(alert({ source: "calendar" }), { sources: ["calendar"] })).toBe(true);
    expect(matchesFilter(alert({ source: "price" }), { sources: ["calendar"] })).toBe(false);
  });

  it("keeps only the named symbols", () => {
    expect(matchesFilter(alert({ symbol: "NVDA" }), { symbols: ["NVDA", "AMD"] })).toBe(true);
    expect(matchesFilter(alert({ symbol: "SPY" }), { symbols: ["NVDA", "AMD"] })).toBe(false);
  });

  it("never matches a symbol filter when the alert is not about a symbol", () => {
    expect(matchesFilter(alert({ symbol: undefined }), { symbols: ["NVDA"] })).toBe(false);
  });

  it("requires every present clause to match", () => {
    const subject = alert({ source: "price", priority: "info", symbol: "NVDA" });
    expect(matchesFilter(subject, { sources: ["price"], symbols: ["NVDA"] })).toBe(true);
    expect(
      matchesFilter(subject, { sources: ["price"], symbols: ["NVDA"], minPriority: "warning" }),
    ).toBe(false);
  });
});

describe("alertFingerprint", () => {
  it("is the same for two emissions of the same condition with different ids", () => {
    expect(alertFingerprint(alert({ id: "a1", at: 1 }))).toBe(
      alertFingerprint(alert({ id: "a2", at: 99_999 })),
    );
  });

  it("uses dedupeKey over the title, so a changing headline stays one alert", () => {
    const first = alert({ title: "NVDA -3.1% on the day", dedupeKey: "nvda-drawdown" });
    const later = alert({ title: "NVDA -4.4% on the day", dedupeKey: "nvda-drawdown" });
    expect(alertFingerprint(first)).toBe(alertFingerprint(later));
  });

  it("separates alerts whose titles differ when no dedupeKey is given", () => {
    expect(alertFingerprint(alert({ title: "one" }))).not.toBe(
      alertFingerprint(alert({ title: "two" })),
    );
  });

  it("treats an escalation as a new alert, so a louder repeat is seen again", () => {
    expect(alertFingerprint(alert({ priority: "info" }))).not.toBe(
      alertFingerprint(alert({ priority: "critical" })),
    );
  });

  it("separates the same headline about different symbols", () => {
    expect(alertFingerprint(alert({ symbol: "NVDA" }))).not.toBe(
      alertFingerprint(alert({ symbol: "AMD" })),
    );
  });

  it("separates a symbol-less alert from one about a symbol", () => {
    expect(alertFingerprint(alert({ symbol: undefined }))).not.toBe(
      alertFingerprint(alert({ symbol: "NVDA" })),
    );
  });

  it("separates the same headline from different producers", () => {
    expect(alertFingerprint(alert({ source: "price" }))).not.toBe(
      alertFingerprint(alert({ source: "news-sentiment" })),
    );
  });

  it("cannot be forged by a title that looks like an encoded fingerprint", () => {
    const forged = alert({ source: "price", title: '","calendar","critical","x' });
    expect(alertFingerprint(forged)).not.toBe(
      alertFingerprint(alert({ source: "calendar", priority: "critical", title: "x" })),
    );
  });
});

describe("sortAlerts", () => {
  it("puts the loudest first, then the newest, then breaks ties by id", () => {
    const sorted = sortAlerts([
      alert({ id: "info-new", priority: "info", at: 500 }),
      alert({ id: "warn-old", priority: "warning", at: 100 }),
      alert({ id: "crit-b", priority: "critical", at: 300 }),
      alert({ id: "crit-a", priority: "critical", at: 300 }),
      alert({ id: "warn-new", priority: "warning", at: 400 }),
    ]);
    expect(sorted.map((a) => a.id)).toEqual([
      "crit-a",
      "crit-b",
      "warn-new",
      "warn-old",
      "info-new",
    ]);
  });

  it("leaves the input untouched", () => {
    const input = [alert({ id: "b", priority: "info" }), alert({ id: "a", priority: "critical" })];
    sortAlerts(input);
    expect(input.map((a) => a.id)).toEqual(["b", "a"]);
  });

  it("returns an empty list for an empty input — no alerts is a real answer", () => {
    expect(sortAlerts([])).toEqual([]);
  });
});
