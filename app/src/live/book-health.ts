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
 * playbook. Which detectors fired, and the play behind each, is the Balance section's (slice 3).
 */

export type HealthLevel = "signal" | "gate";
export type HealthDetector = "looping" | "idle" | "concentrated" | "stuck" | "imbalanced";

/** Mirrors `HealthCounts` in `src/observatory/book-health-view.ts`. */
export interface HealthCounts {
  readonly signal: number;
  readonly gate: number;
  readonly byDetector: Partial<Record<HealthDetector, number>>;
}

/** Mirrors `DeskHealth` in `src/server/book-health-payload.ts`, keeping only what the client
 *  reads: the owner's copy also carries `findings` and `plays`, which the Balance section will. */
export type DeskHealth =
  | { readonly available: false }
  | { readonly available: true; readonly counts: HealthCounts };

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
