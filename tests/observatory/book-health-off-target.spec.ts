import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { PlaybookVerdict } from "../../src/domain/types.js";
import { detectOffTarget } from "../../src/observatory/book-health-imbalance.js";
import {
  BOOK_HEALTH_THRESHOLDS,
  type BookReading,
  type PlayHealth,
  type PlayTargetHealth,
} from "../../src/observatory/book-health-view.js";
import { aPortfolio } from "../support/builders.js";

/**
 * `detectOffTarget` read directly (#5493 slice 4). The view-level spec
 * (`book-health-imbalance.spec.ts`) drives it through a whole book; this one hands it the plays and
 * the passes themselves, so the rules that are hard to reach through a book — which pass's
 * verdicts count, when a shut window is mentioned, what a play with nothing to read yields —
 * are each pinned on their own.
 *
 * The play ids here are deliberately not house playbooks: an unknown id is named by itself, so the
 * wording asserts exactly what the detector did with it.
 */

const reading = (ownerView: boolean): BookReading => ({
  portfolio: aPortfolio(),
  book: { cash: 0, cashByUnderlying: new Map(), sharesByUnderlying: new Map() },
  equity: 100_000,
  uncommittedCash: 0,
  quotes: {},
  asOf: "2026-11-02T15:00:00.000Z",
  thresholds: BOOK_HEALTH_THRESHOLDS,
  ownerView,
});

const band = (share: number, over: Partial<PlayTargetHealth> = {}): PlayTargetHealth => {
  const target = over.target ?? 0.7;
  const signal = over.signal ?? 0.05;
  const gate = over.gate ?? 0.1;
  const drift = share - target;
  const level = Math.abs(drift) > gate ? "gate" : Math.abs(drift) > signal ? "signal" : "inside";
  return { share, target, drift, level, signal, gate, ...over };
};

const play = (
  playbookId: string,
  target: PlayTargetHealth | undefined,
  over: Partial<PlayHealth> = {},
): PlayHealth => ({
  playbookId,
  mode: "standard",
  enabled: true,
  allocation: 50_000,
  ...(target ? { target } : {}),
  openPositions: 0,
  refusalsLastSession: {},
  ...over,
});

const pass = (at: string, verdicts?: readonly PlaybookVerdict[]): DecisionRecord => ({
  at: Date.parse(at),
  personaId: "sauron",
  mode: "live",
  rawIntents: [],
  guardedIntents: [],
  outcomes: [],
  ...(verdicts ? { playbookVerdicts: verdicts } : {}),
});
const shutVerdict = (playbookId: string): PlaybookVerdict => ({
  playbookId,
  mode: "standard",
  state: "no-window",
});

describe("when there is nothing to read", () => {
  it("yields no findings for no plays", () => {
    expect(detectOffTarget([], [], reading(true))).toEqual([]);
  });

  it("yields none for a play with no target — the placeholder detector owns that play", () => {
    expect(detectOffTarget([play("my-play", undefined)], [], reading(true))).toEqual([]);
  });

  it("yields none for a play with a target but no budget, rather than reading against a zero", () => {
    const uncapped = play("my-play", band(0.9), { allocation: undefined });
    expect(detectOffTarget([uncapped], [], reading(true))).toEqual([]);
  });

  it("yields none for a play inside its band", () => {
    expect(detectOffTarget([play("my-play", band(0.72))], [], reading(true))).toEqual([]);
  });
});

describe("when a play is past its band", () => {
  it("reports a signal over its target with the reading, the line it crossed and the band", () => {
    const [found] = detectOffTarget([play("my-play", band(0.754))], [], reading(true));
    expect(found).toMatchObject({
      detector: "imbalanced",
      level: "signal",
      playbookId: "my-play",
      reading: 0.754,
      band: { target: 0.7, direction: "over", signal: 0.05, gate: 0.1 },
    });
    expect(found?.threshold).toBeCloseTo(0.75, 9);
    expect(found?.band?.drift).toBeCloseTo(0.054, 9);
  });

  it("words it to a tenth of a point, in the owner's dollars, as a heads-up", () => {
    const [found] = detectOffTarget([play("my-play", band(0.754))], [], reading(true));
    expect(found?.words).toBe(
      "My-play has 75.4% of its $50,000 budget deployed against a 70% target: " +
        "5.4 points over, past its signal at 5. A heads-up; capital keeps flowing.",
    );
  });

  it("reports a gate past the second edge, measured from the gate's own line", () => {
    const [found] = detectOffTarget([play("my-play", band(0.55))], [], reading(true));
    expect(found).toMatchObject({ level: "gate", reading: 0.55, band: { direction: "under" } });
    expect(found?.threshold).toBeCloseTo(0.6, 9);
    expect(found?.words).toContain("15 points under, past its gate at 10.");
    expect(found?.words).toContain("That is the stronger level; nothing is blocked yet.");
    expect(found?.words).not.toContain("capital keeps flowing");
  });

  it("measures the line from a play's own band, not the house default", () => {
    const narrow = band(0.6, { target: 0.5, signal: 0.02, gate: 0.04 });
    const [found] = detectOffTarget([play("my-play", narrow)], [], reading(true));
    expect(found?.level).toBe("gate");
    expect(found?.threshold).toBeCloseTo(0.54, 9);
    expect(found?.words).toContain("10 points over, past its gate at 4.");
  });

  it("reports one finding per play out of band, in the order given, skipping the rest", () => {
    const found = detectOffTarget(
      [
        play("first-play", band(0.8)),
        play("quiet-play", band(0.7)),
        play("third-play", band(0.62)),
      ],
      [],
      reading(true),
    );
    expect(found.map((f) => [f.playbookId, f.level])).toEqual([
      ["first-play", "gate"],
      ["third-play", "signal"],
    ]);
  });
});

describe("when the reader is not the owner (#885)", () => {
  it("names neither the play nor its dollars", () => {
    const [found] = detectOffTarget([play("my-play", band(0.8))], [], reading(false));
    expect(found?.words).toMatch(/^One of this account's playbooks has 80% of its budget deployed/);
    expect(found?.words).not.toContain("my-play");
    expect(found?.words).not.toContain("$");
  });
});

describe("when the window is shut", () => {
  const thin = play("my-play", band(0.55));

  it("says so for a play reading thin whose newest verdicts show no window", () => {
    const records = [pass("2026-11-02T14:59:00Z", [shutVerdict("my-play")])];
    const [found] = detectOffTarget([thin], records, reading(true));
    expect(found?.words).toContain("Its window is shut right now. ");
  });

  it("does not change the level for it", () => {
    const records = [pass("2026-11-02T14:59:00Z", [shutVerdict("my-play")])];
    const [shut] = detectOffTarget([thin], records, reading(true));
    const [open] = detectOffTarget([thin], [], reading(true));
    expect(shut?.level).toBe(open?.level);
    expect(shut?.reading).toBe(open?.reading);
  });

  it("stays quiet about it for a play over its target, which a shut window does not explain", () => {
    const records = [pass("2026-11-02T14:59:00Z", [shutVerdict("my-play")])];
    const [found] = detectOffTarget([play("my-play", band(0.85))], records, reading(true));
    expect(found?.words).not.toContain("window");
  });

  it("stays quiet when only another play's window is shut", () => {
    const records = [pass("2026-11-02T14:59:00Z", [shutVerdict("other-play")])];
    const [found] = detectOffTarget([thin], records, reading(true));
    expect(found?.words).not.toContain("window");
  });

  it("stays quiet when the play's own verdict is anything but no-window", () => {
    const verdicts: PlaybookVerdict[] = [
      { playbookId: "my-play", mode: "standard", state: "flat" },
    ];
    const [found] = detectOffTarget(
      [thin],
      [pass("2026-11-02T14:59:00Z", verdicts)],
      reading(true),
    );
    expect(found?.words).not.toContain("window");
  });

  it("reads only the newest pass that carried verdicts, so a window that has since opened is not called shut", () => {
    const records = [
      pass("2026-11-02T14:59:45Z", [{ playbookId: "my-play", mode: "standard", state: "long" }]),
      pass("2026-11-02T14:59:30Z", [shutVerdict("my-play")]),
    ];
    const [found] = detectOffTarget([thin], records, reading(true));
    expect(found?.words).not.toContain("window");
  });

  it("looks past a newer pass that carried no verdicts at all to the one that did", () => {
    const records = [
      pass("2026-11-02T14:59:45Z"),
      pass("2026-11-02T14:59:30Z", [shutVerdict("my-play")]),
    ];
    const [found] = detectOffTarget([thin], records, reading(true));
    expect(found?.words).toContain("Its window is shut right now.");
  });

  it("does not reach back past a newest pass that said nothing was consulted", () => {
    const records = [
      pass("2026-11-02T14:59:45Z", []),
      pass("2026-11-02T14:59:30Z", [shutVerdict("my-play")]),
    ];
    const [found] = detectOffTarget([thin], records, reading(true));
    expect(found?.words).not.toContain("window");
  });
});
