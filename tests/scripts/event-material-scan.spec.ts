import { execFileSync } from "node:child_process";
import { closeFromChart } from "../../scripts/event-material-scan.mjs";

// The deterministic material-change probe (issue #724) — driven through the real CLI entrypoint,
// the house pattern (see deploy-lag.spec.ts): `--explain` takes the full decision state as JSON on
// stdin instead of touching the network or filesystem, so every branch of `decide()` and
// `applyScreen()` (scripts/event-material-decide.mjs) is exercised through argv/stdin, never an
// invented `.d.ts`. Exit code is the verdict: 0 = screen, 1 = material, 2 = a thrown error.
const CADENCE = {
  bands: {
    critical: [
      { minDaysOut: 21, intervalDays: 3 },
      { minDaysOut: 8, intervalDays: 2 },
      { minDaysOut: 0, intervalDays: 1 },
    ],
  },
};

const LEDGER_TEXT = [
  "# Some print — some-id",
  "",
  "**Kind:** earnings · **Date:** 2026-09-11 (confirmed, IR: x) · **Impact:** critical",
  "**Last assessed:** 2026-09-01",
  "",
  "## At a glance",
  "",
  "…",
  "",
  "## Assessment ledger",
  "",
  "| Date | Days out | New info / adjacency findings | Stance change | Next check due |",
  "|---|---|---|---|---|",
  "| 2026-09-01 | D-10 | Initial pulse. | — (stance set) | 2026-09-04 |",
  "",
  "**Rules.** Rows append only.",
  "",
].join("\n");

type Explain = {
  verdict: "screen" | "material";
  reasons: string[];
  readings: {
    symbols: Record<string, number>;
    vix: number | null;
    daysBand: string;
    adjacentIds: string[];
    screenStreak: number;
  };
  intervalDays: number;
  daysOut: number;
  ledgerText?: string;
};

const baseEvent = {
  id: "some-id",
  kind: "earnings",
  date: "2026-09-11",
  impact: "critical",
  symbols: ["NVDA"],
};

const explain = (overrides: Record<string, unknown> = {}): { verdict: number; out: Explain } => {
  const input = {
    event: baseEvent,
    today: "2026-09-04",
    cadence: CADENCE,
    ledger: { lastAssessed: "2026-09-01", probeRef: null },
    market: { symbols: { NVDA: 182.43 }, vix: 15.2 },
    adjacentIds: [],
    ...overrides,
  };
  try {
    const out = execFileSync("node", ["scripts/event-material-scan.mjs", "--explain"], {
      input: JSON.stringify(input),
      encoding: "utf8",
    });
    return { verdict: 0, out: JSON.parse(out) };
  } catch (error) {
    const e = error as { status?: number; stdout?: string };
    return { verdict: e.status ?? -1, out: JSON.parse(e.stdout ?? "{}") };
  }
};

const quietProbeRef = {
  symbols: { NVDA: 182.43 },
  vix: 15.2,
  daysBand: "critical:0+",
  adjacentIds: [],
  screenStreak: 0,
};

describe("event-material-scan decide()", () => {
  it("has no baseline to diff against on a fresh ledger — material, safe default", () => {
    const { verdict, out } = explain({ ledger: { lastAssessed: "2026-09-01", probeRef: null } });
    expect(verdict).toBe(1);
    expect(out.verdict).toBe("material");
    expect(out.reasons).toEqual(["no-reference-baseline"]);
  });

  it("screens a quiet pulse — nothing tracked moved past its threshold", () => {
    const { verdict, out } = explain({
      ledger: { lastAssessed: "2026-09-01", probeRef: quietProbeRef },
    });
    expect(verdict).toBe(0);
    expect(out.verdict).toBe("screen");
    expect(out.reasons).toEqual([]);
    expect(out.readings.screenStreak).toBe(1);
  });

  it("a price move under the 5% default threshold stays quiet", () => {
    const { out } = explain({
      ledger: { lastAssessed: "2026-09-01", probeRef: quietProbeRef },
      market: { symbols: { NVDA: 182.43 * 1.03 }, vix: 15.2 },
    });
    expect(out.verdict).toBe("screen");
  });

  it("a price move at or past the 5% default threshold is material", () => {
    const { verdict, out } = explain({
      ledger: { lastAssessed: "2026-09-01", probeRef: quietProbeRef },
      market: { symbols: { NVDA: 182.43 * 1.06 }, vix: 15.2 },
    });
    expect(verdict).toBe(1);
    expect(out.reasons.some((r) => r.startsWith("price-move:NVDA:"))).toBe(true);
  });

  it("a VIX move at or past the 3-point default threshold is material", () => {
    const { verdict, out } = explain({
      ledger: { lastAssessed: "2026-09-01", probeRef: quietProbeRef },
      market: { symbols: { NVDA: 182.43 }, vix: 18.3 },
    });
    expect(verdict).toBe(1);
    expect(out.reasons).toContain("vix-regime-change:+3.1pt");
  });

  it("a cadence days-band transition is material even with flat readings", () => {
    const { verdict, out } = explain({
      today: "2026-08-25", // D-17 -> the 8-20 band, vs. the probe-ref's recorded 0+ band
      ledger: {
        lastAssessed: "2026-09-01",
        probeRef: { ...quietProbeRef, daysBand: "critical:0+" },
      },
    });
    expect(verdict).toBe(1);
    expect(out.reasons.some((r) => r.startsWith("days-band-transition:"))).toBe(true);
  });

  it("a new adjacent calendar event since the last row is material", () => {
    const { verdict, out } = explain({
      ledger: { lastAssessed: "2026-09-01", probeRef: quietProbeRef },
      adjacentIds: ["cpi-2026-09-11"],
    });
    expect(verdict).toBe(1);
    expect(out.reasons).toContain("new-adjacent-event:cpi-2026-09-11");
  });

  it("the staleness ceiling forces a session on the 3rd consecutive pulse, quiet or not", () => {
    const { verdict, out } = explain({
      ledger: { lastAssessed: "2026-09-01", probeRef: { ...quietProbeRef, screenStreak: 2 } },
    });
    expect(verdict).toBe(1);
    expect(out.reasons).toContain("staleness-ceiling");
  });

  it("a material verdict resets the streak to 0 for the next pulse", () => {
    const { out } = explain({
      ledger: { lastAssessed: "2026-09-01", probeRef: { ...quietProbeRef, screenStreak: 2 } },
    });
    expect(out.readings.screenStreak).toBe(0);
  });
});

describe("event-material-scan applyScreen()", () => {
  it("bumps Last assessed, inserts a probe-ref block, and appends a row worded as a screen, never an assessment", () => {
    const { verdict, out } = explain({
      ledger: { lastAssessed: "2026-09-01", probeRef: quietProbeRef },
      ledgerText: LEDGER_TEXT,
    });
    expect(verdict).toBe(0);
    const text = out.ledgerText ?? "";
    expect(text).toContain("**Last assessed:** 2026-09-04");
    expect(text).toContain("<!-- probe-ref:");
    expect(text).toContain("**Deterministic screen (no Claude session).**");
    expect(text).toContain("— (screen; no assessment made)");
    expect(text).not.toMatch(/\|\s*—\s*\(screen[^)]*\).*assessment made\)[\s\S]*no change/i);
    // The original row survives untouched — append-only.
    expect(text).toContain("| 2026-09-01 | D-10 | Initial pulse. | — (stance set) | 2026-09-04 |");
  });

  it("replaces an existing probe-ref block on the next screen instead of duplicating it", () => {
    const withRef = LEDGER_TEXT.replace(
      "**Last assessed:** 2026-09-01",
      `**Last assessed:** 2026-09-01\n<!-- probe-ref: ${JSON.stringify(quietProbeRef)} -->`,
    );
    const { out } = explain({
      ledger: { lastAssessed: "2026-09-01", probeRef: quietProbeRef },
      ledgerText: withRef,
    });
    const matches = (out.ledgerText ?? "").match(/<!-- probe-ref:/g) ?? [];
    expect(matches).toHaveLength(1);
  });

  it("never applies a screen edit on a material verdict — the field is simply absent", () => {
    const { verdict, out } = explain({
      ledger: { lastAssessed: "2026-09-01", probeRef: null },
      ledgerText: LEDGER_TEXT,
    });
    expect(verdict).toBe(1);
    expect(out.ledgerText).toBeUndefined();
  });

  it("fails loud on a ledger missing the Assessment ledger table, rather than silently skip the row", () => {
    const broken = LEDGER_TEXT.replace("## Assessment ledger", "## Something else");
    const { verdict, out } = explain({
      ledger: { lastAssessed: "2026-09-01", probeRef: quietProbeRef },
      ledgerText: broken,
    });
    expect(verdict).toBe(2);
    expect((out as unknown as { error?: string }).error).toContain("Assessment ledger");
  });
});

// The price read itself (issue #1386). Imported directly rather than driven through the CLI — the
// price read is the one half `--explain` cannot reach (it is upstream of the decision state, behind
// a fetch), so it gets the other house arrangement instead: a hand-written `.d.mts` beside the
// script, exactly as envelope-scan/plan-closure-scan do. Reconstructed from the payload recorded on 2026-09-05: MU's
// 09-04 daily bar carried `close: null` while the same payload's meta already held that session's
// official print, and the old backward scan returned Wednesday's $958.16 as if it were Friday's
// $1,016.59 — a +6.10% session read as ~2.6%, under the 5% materiality threshold, silently.
const ET_OFFSET = -14_400; // EDT, the payload's own `meta.gmtoffset` in September
const sessionOpen = (month: number, day: number) => Date.UTC(2026, month - 1, day, 13, 30) / 1000; // 09:30 ET
const SESSION_LENGTH = 23_401; // 09:30 -> 16:00:01 ET, when Yahoo stamps the closing print
const MU_CLOSE_0904 = sessionOpen(9, 4) + SESSION_LENGTH;

const muChart = (
  overrides: { close?: (number | null)[]; meta?: Record<string, unknown> } = {},
): unknown => ({
  chart: {
    result: [
      {
        meta: {
          gmtoffset: ET_OFFSET,
          exchangeTimezoneName: "America/New_York",
          regularMarketPrice: 1016.59,
          regularMarketTime: MU_CLOSE_0904,
          ...overrides.meta,
        },
        timestamp: (
          [
            [8, 31],
            [9, 1],
            [9, 2],
            [9, 3],
            [9, 4],
          ] as const
        ).map(([month, day]) => sessionOpen(month, day)),
        indicators: {
          quote: [{ close: overrides.close ?? [958.73, 933.44, 956.08, 958.16, null] }],
        },
      },
    ],
  },
});

describe("event-material-scan closeFromChart()", () => {
  it("reads the latest bar's own close when the session has consolidated", () => {
    const read = closeFromChart(
      muChart({ close: [958.73, 933.44, 956.08, 958.16, 1016.59] }),
      "MU",
    );
    expect(read).toEqual({ price: 1016.59, asOf: "2026-09-04", source: "bar-close" });
  });

  it("takes the session's print from meta when its latest bar has no close yet", () => {
    const read = closeFromChart(muChart(), "MU");
    expect(read.price).toBe(1016.59);
    expect(read.asOf).toBe("2026-09-04");
    expect(read.source).toBe("meta.regularMarketPrice");
  });

  it("never falls back to an earlier day's close on a null latest bar — the 2026-09-04 defect", () => {
    expect(closeFromChart(muChart(), "MU").price).not.toBe(958.16);
  });

  it("throws rather than return an older close when meta's print predates the latest bar", () => {
    const staleMeta = muChart({ meta: { regularMarketTime: sessionOpen(9, 3) + SESSION_LENGTH } });
    expect(() => closeFromChart(staleMeta, "MU")).toThrow(/latest bar \(2026-09-04\) has no close/);
  });

  it("throws when a null latest bar has no usable meta price at all", () => {
    const noMeta = muChart({ meta: { regularMarketPrice: undefined } });
    expect(() => closeFromChart(noMeta, "MU")).toThrow(/has no close/);
  });

  it("throws on a payload carrying no bars, rather than returning nothing quietly", () => {
    expect(() => closeFromChart({ chart: { result: [] } }, "MU")).toThrow(/no usable daily bars/);
  });

  it("rounds a meta print to cents, as the bar path already did", () => {
    const read = closeFromChart(muChart({ meta: { regularMarketPrice: 1016.5949 } }), "MU");
    expect(read.price).toBe(1016.59);
  });
});
