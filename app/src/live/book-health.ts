/**
 * THE BOOK'S HEALTH, AS THE HEAD SAYS IT (#5493 slice 2). The server reads the book as one system
 * and serves a `health` field on `GET /api/desk/:id` (slice 1: `src/server/book-health-payload.ts`,
 * `src/observatory/book-health-view.ts`); this module is the client's mirror of that field and the
 * one plain line the account head draws from it — pure, so the words are specced without a DOM.
 *
 * The line counts the open findings by level, each level its own glyph and word, never hue alone
 * (docs/BRAND.md → Accessibility): "■ 1 gate · ◆ 2 signals". A gate stops new entries on its play
 * (once #5483 reads it); a signal never blocks. A book with nothing found says "● Balanced". A book
 * the server could not read (`available: false`) says nothing at all — "Balanced" is a claim, and
 * an unread book cannot support it.
 *
 * WHO SEES WHAT (#885): the owner is served every finding, anyone else the counts only. The line
 * reads the counts, which both are served, so it says the same words to both; it never names a
 * playbook. Which detectors fired, and the play behind each, is the Balance section's (slice 3) —
 * its half of this module is below the line: the owner's findings and per-play numbers, and the
 * few words each needs, pure so the section's ranking and wording are specced without a DOM.
 */

export type HealthLevel = "signal" | "gate";
export type HealthDetector = "looping" | "idle" | "concentrated" | "stuck" | "imbalanced";

/** Mirrors `HealthCounts` in `src/observatory/book-health-view.ts`. */
export interface HealthCounts {
  readonly signal: number;
  readonly gate: number;
  readonly byDetector: Partial<Record<HealthDetector, number>>;
}

/** What a looping play keeps hitting (`LoopKind` in `src/observatory/book-health-view.ts`): one
 *  guard's refusal reason, an open window it never enters, or a window that never opens. */
export type HealthLoop = string;

/** Mirrors `ImbalanceBand` in `src/observatory/book-health-view.ts`: an imbalance finding's measure
 *  against the play's target. Every figure is a fraction of the play's budget (0.05 = 5 points). */
export interface ImbalanceBand {
  readonly target: number;
  readonly direction: "over" | "under";
  /** `share - target`, signed. */
  readonly drift: number;
  readonly signal: number;
  readonly gate: number;
}

/** Mirrors `PlayTargetHealth` in `src/observatory/book-health-view.ts`: a play's active share read
 *  against its own target and band, present only for a play that has one. */
export interface PlayTargetHealth {
  readonly share: number;
  readonly target: number;
  readonly drift: number;
  readonly level: "inside" | HealthLevel;
  readonly signal: number;
  readonly gate: number;
}

/** Mirrors `HealthFinding` in `src/observatory/book-health-view.ts`. The sentence is the server's:
 *  it is worded once there, for the owner (names the play) or anyone else (does not). */
export interface HealthFinding {
  readonly detector: HealthDetector;
  readonly level: HealthLevel;
  /** The play behind it — the owner's copy only. */
  readonly playbookId?: string;
  /** The position or underlying it is about, when it is about one. */
  readonly symbol?: string;
  /** The measured number: a share (0–1), or a count of checks or sessions (see `findingReading`). */
  readonly reading: number;
  /** The line the reading crossed to reach this level. */
  readonly threshold: number;
  readonly loop?: HealthLoop;
  /** IMBALANCED against a play's target only (#5493 slice 4). */
  readonly band?: ImbalanceBand;
  readonly words: string;
}

/** Mirrors `PlayHealth` in `src/observatory/book-health-view.ts`: one subscription's numbers. A
 *  figure the server could not derive is absent, never 0. */
export interface PlayHealth {
  readonly playbookId: string;
  readonly mode: string;
  readonly enabled: boolean;
  /** The budget the owner set; absent = uncapped. */
  readonly allocation?: number;
  readonly committed?: number;
  readonly idle?: number;
  /** Its active share against its target and band; absent for a play with no target. */
  readonly target?: PlayTargetHealth;
  readonly openPositions: number;
  readonly oldestOpenSessions?: number;
  readonly lastEntryAt?: string;
  /** Its intents the guards refused in the last session on hand, by reason. */
  readonly refusalsLastSession: Readonly<Record<string, number>>;
}

/** Mirrors `DeskHealth` in `src/server/book-health-payload.ts`. Anyone but the owner is served
 *  `counts` alone; the owner's copy adds the findings and each play's numbers. */
export type DeskHealth =
  | { readonly available: false }
  | {
      readonly available: true;
      readonly counts: HealthCounts;
      readonly findings?: readonly HealthFinding[];
      readonly plays?: readonly PlayHealth[];
      readonly equity?: number;
      readonly uncommittedCash?: number;
      /** `uncommittedCash / equity`; null when equity is not positive. */
      readonly idleShare?: number | null;
    };

/** The line's overall state: its worst level, or nothing found. */
export type HealthLineLevel = HealthLevel | "balanced";

/** One level's count, said with its own glyph and word. */
export interface HealthLinePart {
  readonly level: HealthLevel;
  readonly glyph: string;
  readonly text: string;
}

export interface HealthLine {
  readonly level: HealthLineLevel;
  /** Gate first, then signal; empty when balanced. */
  readonly parts: readonly HealthLinePart[];
  /** The whole line as a sentence: what a screen reader and the link's name say. */
  readonly label: string;
}

/** Each level's glyph is unique on the head: the heartbeat line beside it uses ● ◐ ○ ‖ ▷ ⊘ ◇
 *  (`live/heartbeat.ts`), so a stop is a filled square and a signal a filled diamond. */
export const HEALTH_GLYPH: Record<HealthLineLevel, string> = {
  gate: "■",
  signal: "◆",
  balanced: "●",
};

const WORD: Record<HealthLevel, readonly [string, string]> = {
  gate: ["gate", "gates"],
  signal: ["signal", "signals"],
};

const count = (n: number, level: HealthLevel): string => `${n} ${WORD[level][n === 1 ? 0 : 1]}`;

/** The head's line for a book's health, or null when there is nothing true to say. */
export function healthLine(health: DeskHealth | undefined): HealthLine | null {
  if (!health?.available) return null;
  const { gate, signal } = health.counts;
  const parts: HealthLinePart[] = [];
  if (gate > 0) parts.push({ level: "gate", glyph: HEALTH_GLYPH.gate, text: count(gate, "gate") });
  if (signal > 0)
    parts.push({ level: "signal", glyph: HEALTH_GLYPH.signal, text: count(signal, "signal") });
  const first = parts[0];
  if (!first) return { level: "balanced", parts, label: "Balanced: nothing found on this book" };
  return {
    level: first.level,
    parts,
    label: `Book health: ${parts.map((p) => p.text).join(", ")}`,
  };
}

// ── The Balance section's half (#5493 slice 3) ─────────────────────────────────────────────────

/** Each detector said as the job it does, for a finding's row. */
export const DETECTOR_NAME: Record<HealthDetector, string> = {
  looping: "Looping",
  idle: "Idle cash",
  concentrated: "Concentrated",
  stuck: "Stuck",
  imbalanced: "Imbalanced",
};

/** A level as a word; its glyph is {@link HEALTH_GLYPH}. A finding shows both, never hue alone. */
export const LEVEL_WORD: Record<HealthLevel, string> = { gate: "Gate", signal: "Signal" };

/** What the section draws from the server's `health` field: three honest cases. */
export type BalanceRead =
  /** The server has not read the book (`available: false`), or is too old to serve the field. */
  | { readonly kind: "unread" }
  /** Anyone but the owner: counts by level only, no playbook to name (#885). */
  | { readonly kind: "counts" }
  /** The owner: every finding (gate first) and every play's numbers. */
  | {
      readonly kind: "owner";
      readonly findings: readonly HealthFinding[];
      readonly plays: readonly PlayHealth[];
    };

export function balanceRead(health: DeskHealth | undefined): BalanceRead {
  if (!health?.available) return { kind: "unread" };
  if (!health.findings) return { kind: "counts" };
  return { kind: "owner", findings: health.findings, plays: health.plays ?? [] };
}

const wholePct = (share: number): string => `${Math.round(share * 100)}%`;
/** A share to a tenth of a point, a trailing ".0" dropped — "75.2%", "70%". */
const tenthPct = (share: number): string => `${Math.round(share * 1000) / 10}%`;
/** Points of share, unsigned, to a tenth — "5.2", "10". */
const points = (fraction: number): string => `${Math.round(Math.abs(fraction) * 1000) / 10}`;
const sessions = (n: number): string => `${n} ${n === 1 ? "session" : "sessions"}`;

/**
 * The number behind a finding, against the line it crossed — "46% · over the 40% line", "held 5
 * sessions · gate at 5". The server's sentence says what happened; this is the measure, short
 * enough to sit under it on a phone. A looping play's reading is a count of checks (every one
 * refused) or of sessions (a window that never opened, or opened and was never entered).
 */
export function findingReading(finding: HealthFinding): string {
  const { reading, threshold, band } = finding;
  switch (finding.detector) {
    case "imbalanced":
      // Against a play's target: "75.2% · over the 70% target by 5.2 points, signal at 5". The
      // generic line is the placeholder for a play with no target.
      if (band)
        return `${tenthPct(reading)} · ${band.direction} the ${tenthPct(band.target)} target by ${points(band.drift)} points, ${finding.level} at ${points(finding.level === "gate" ? band.gate : band.signal)}`;
      return `${wholePct(reading)} · ${reading > threshold ? "over" : "under"} the ${wholePct(threshold)} line`;
    case "idle":
    case "concentrated":
      return `${wholePct(reading)} · ${reading > threshold ? "over" : "under"} the ${wholePct(threshold)} line`;
    case "stuck":
      return `held ${sessions(reading)} · ${finding.level} at ${threshold}`;
    case "looping":
      return finding.loop === "no-window" || finding.loop === "open-no-entry"
        ? `${sessions(reading)} in a row`
        : `refused on all ${reading} checks`;
  }
}

/** A play's standing against its target, in one line: "Target 70% · now 75.2% · 5.2 points over,
 *  signal at 5", or inside its band — "Target 70% · now 66.1% · inside its 5-point band". The
 *  level is always a word here (the row's flag carries the glyph), never a colour. */
export function targetLine(target: PlayTargetHealth): string {
  const head = `Target ${tenthPct(target.target)} · now ${tenthPct(target.share)}`;
  if (target.level === "inside") return `${head} · inside its ${points(target.signal)}-point band`;
  const edge = target.level === "gate" ? target.gate : target.signal;
  const way = target.drift > 0 ? "over" : "under";
  return `${head} · ${points(target.drift)} points ${way}, ${target.level} at ${points(edge)}`;
}

/** A play's idle budget as a share of its allocation, when both are known. */
export function idleShareOf(play: PlayHealth): number | undefined {
  return play.idle !== undefined && play.allocation ? play.idle / play.allocation : undefined;
}

/** A play's committed budget as a share of its allocation, held to 0–1 for a bar. */
export function committedShareOf(play: PlayHealth): number | undefined {
  if (play.committed === undefined || !play.allocation) return undefined;
  return Math.min(1, Math.max(0, play.committed / play.allocation));
}

/** The plays most idle first (AC 5: after the findings, "plays by idle share"). A play whose idle
 *  share can't be derived (uncapped, or a basket this process doesn't know) sorts after those that
 *  can, and ties fall back to the id so the order never shuffles between reads. */
export function playsByIdle(plays: readonly PlayHealth[]): PlayHealth[] {
  return [...plays].sort((a, b) => {
    const [x, y] = [idleShareOf(a), idleShareOf(b)];
    if (x !== undefined && y !== undefined && x !== y) return y - x;
    if ((x === undefined) !== (y === undefined)) return x === undefined ? 1 : -1;
    return a.playbookId.localeCompare(b.playbookId);
  });
}

/** A budget in whole dollars — "$45,000": a play's allocation is a round number the owner set, and
 *  cents on it would be noise a phone has no room for. */
export function dollars(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

/** How many intents the guards refused on a play in its last session on hand. */
export function refusedCount(play: PlayHealth): number {
  return Object.values(play.refusalsLastSession).reduce((sum, n) => sum + n, 0);
}

/** "Oct 14" — the day of a play's newest entry, on the reader's own clock. */
export function entryDay(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
