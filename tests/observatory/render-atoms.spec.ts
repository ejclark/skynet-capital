import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import {
  chip,
  formatActivityTime,
  formatCurrency,
  formatSigned,
  formatTimestamp,
  pct,
  plClass,
  profileHref,
  tile,
  tzAbbrev,
} from "../../src/observatory/render-atoms.js";

const snapshot = (overrides: Partial<ParticipantSnapshot> = {}): ParticipantSnapshot => ({
  id: "p1",
  displayName: "Test",
  kind: "human",
  cash: 0,
  equity: 0,
  positions: [],
  ...overrides,
});

describe("formatCurrency", () => {
  it("renders a positive value with a leading dollar sign and grouping", () => {
    expect(formatCurrency(1234)).toBe("$1,234");
  });

  it("renders a negative value with a leading minus before the dollar sign", () => {
    expect(formatCurrency(-1234)).toBe("-$1,234");
  });

  it("renders zero without a sign", () => {
    expect(formatCurrency(0)).toBe("$0");
  });

  it("rounds fractional values to the nearest whole dollar", () => {
    expect(formatCurrency(99.6)).toBe("$100");
    expect(formatCurrency(99.4)).toBe("$99");
  });

  it("handles very large values with full grouping", () => {
    expect(formatCurrency(1_000_000_000)).toBe("$1,000,000,000");
  });
});

describe("formatSigned", () => {
  it("prefixes a positive value with a plus sign", () => {
    expect(formatSigned(500)).toBe("+$500");
  });

  it("prefixes a negative value with the currency's own minus (no double sign)", () => {
    expect(formatSigned(-500)).toBe("-$500");
  });

  it("prefixes zero with a plus sign (treated as non-negative)", () => {
    expect(formatSigned(0)).toBe("+$0");
  });
});

describe("plClass", () => {
  it("classifies a positive value as pos", () => {
    expect(plClass(1)).toBe("pos");
  });

  it("classifies a negative value as neg", () => {
    expect(plClass(-1)).toBe("neg");
  });

  it("classifies zero as flat", () => {
    expect(plClass(0)).toBe("flat");
  });
});

describe("pct", () => {
  it("prefixes a positive percentage with a plus sign and two decimals", () => {
    expect(pct(3.4)).toBe("+3.40%");
  });

  it("keeps the minus sign for a negative percentage", () => {
    expect(pct(-3.4)).toBe("-3.40%");
  });

  it("prefixes zero with a plus sign", () => {
    expect(pct(0)).toBe("+0.00%");
  });
});

describe("formatTimestamp", () => {
  it("renders an ISO timestamp truncated to the minute, suffixed with UTC", () => {
    expect(formatTimestamp("2026-07-29T14:05:30.000Z")).toBe("2026-07-29 14:05 UTC");
  });

  it("returns the original string unchanged when it cannot be parsed as a date", () => {
    expect(formatTimestamp("not-a-date")).toBe("not-a-date");
  });
});

describe("tzAbbrev", () => {
  it("defaults to UTC when no timezone is given", () => {
    expect(tzAbbrev(undefined)).toBe("UTC");
  });

  it("resolves a valid IANA timezone to its short abbreviation", () => {
    const result = tzAbbrev("America/New_York");
    expect(result).toMatch(/^[A-Za-z]{2,5}$/);
  });

  it("falls back to the raw timezone string when it isn't recognized", () => {
    expect(tzAbbrev("Not/A_Zone")).toBe("Not/A_Zone");
  });
});

describe("formatActivityTime", () => {
  it("returns the original string unchanged when the timestamp cannot be parsed", () => {
    expect(formatActivityTime("not-a-date")).toBe("not-a-date");
  });

  it("formats a valid ISO timestamp in UTC when no timezone is given", () => {
    const result = formatActivityTime("2026-07-29T14:05:00.000Z");
    expect(result).toContain("Jul");
    expect(result).toContain("29");
  });

  it("formats using the supplied timezone", () => {
    const result = formatActivityTime("2026-07-29T14:05:00.000Z", "America/New_York");
    expect(result).toContain("Jul");
  });

  it("falls back to the raw string when the timezone is invalid", () => {
    expect(formatActivityTime("2026-07-29T14:05:00.000Z", "Not/A_Zone")).toBe(
      "2026-07-29T14:05:00.000Z",
    );
  });
});

describe("chip", () => {
  it("renders a HUMAN chip for a human participant", () => {
    expect(chip(snapshot({ kind: "human" }))).toBe('<span class="chip chip-human">HUMAN</span>');
  });

  it("renders a bot chip with the persona id when present", () => {
    expect(chip(snapshot({ kind: "bot", personaId: "sauron" }))).toBe(
      '<span class="chip chip-bot">BOT · sauron</span>',
    );
  });

  it("falls back to the literal 'bot' label when a bot has no persona id", () => {
    expect(chip(snapshot({ kind: "bot" }))).toBe('<span class="chip chip-bot">BOT · bot</span>');
  });

  it("escapes HTML-significant characters in the persona id", () => {
    expect(chip(snapshot({ kind: "bot", personaId: "<script>" }))).toContain("&lt;script&gt;");
  });
});

describe("profileHref", () => {
  it("builds a URL-encoded profile link for a participant id", () => {
    expect(profileHref("alice")).toBe("/u/alice");
  });

  it("percent-encodes characters that aren't URL-safe", () => {
    expect(profileHref("a b/c")).toBe("/u/a%20b%2Fc");
  });
});

describe("tile", () => {
  it("renders a labelled stat tile with the given label and value", () => {
    const html = tile("Equity", "$1,000");
    expect(html).toContain('<span class="tile-label">Equity</span>');
    expect(html).toContain('<span class="tile-num num">$1,000</span>');
  });

  it("adds the tile-lead class when opts.lead is set", () => {
    expect(tile("Equity", "$1,000", { lead: true })).toContain('class="tile tile-lead"');
  });

  it("omits the tile-lead class by default", () => {
    const html = tile("Equity", "$1,000");
    expect(html).toContain('class="tile"');
    expect(html).not.toContain("tile-lead");
  });

  it("appends the extra class to the tile-num span when opts.cls is set", () => {
    expect(tile("P/L", "+$50", { cls: "pos" })).toContain('class="tile-num num pos"');
  });
});
