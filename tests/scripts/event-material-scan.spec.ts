import { execFileSync } from "node:child_process";

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
