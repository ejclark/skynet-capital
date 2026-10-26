import type { DecisionRecord } from "../autonomous/decision-record.js";
import { capitalized, playName } from "./book-health-detectors.js";
import type { BookReading, HealthFinding, PlayHealth } from "./book-health-view.js";
import { latestVerdictPass } from "./bot-heartbeat-view.js";
import { formatCurrency } from "./render-atoms.js";

/**
 * IMBALANCED AGAINST A PLAY'S TARGET (#5493 slice 4; #5483 criterion 13). A play with a target
 * carries a weight, a lean range and a band; its active share is read against them by the very
 * reading the bot's observer logs from (`play-reading.ts`), so this view and the observer name one
 * level for one book. Past the band's first edge is a SIGNAL (capital keeps flowing), past the
 * second a GATE (the stronger level). Neither blocks anything yet: #5483's gate reads no finding
 * today, and the wording says so rather than let "gate" imply a stop that does not exist.
 *
 * The level is the observer's, unconditionally; a window that is shut can't change it. What the
 * words add is why a play reads thin when it is, so the finding does not look like a fault.
 *
 * A play with NO target is not here: it keeps the placeholder in `book-health-detectors.ts`
 * (`detectImbalanced`), and a play with a target never gets both. Nothing in this file is a 0 for
 * an absent figure.
 */

const round1 = (n: number): number => Math.round(n * 10) / 10;
/** "75.4%" / "70%": a share to a tenth of a point, dropping a trailing ".0". */
const tenthPct = (share: number): string => `${round1(share * 100)}%`;
/** Points of share, unsigned: "5.4" / "10". */
const pts = (fraction: number): string => `${round1(Math.abs(fraction) * 100)}`;

export function detectOffTarget(
  plays: readonly PlayHealth[],
  records: readonly DecisionRecord[],
  reading: BookReading,
): HealthFinding[] {
  const verdicts = latestVerdictPass(records)?.verdicts ?? [];
  return plays.flatMap((play): HealthFinding[] => {
    const { target, allocation } = play;
    if (!(target && allocation !== undefined) || target.level === "inside") return [];
    const gate = target.level === "gate";
    const edge = gate ? target.gate : target.signal;
    const direction = target.drift > 0 ? "over" : "under";
    const name = capitalized(playName(play.playbookId, reading.ownerView));
    const budget = reading.ownerView ? `its ${formatCurrency(allocation)} budget` : "its budget";
    const shut =
      direction === "under" &&
      verdicts.some((v) => v.playbookId === play.playbookId && v.state === "no-window");
    const tail = gate
      ? "That is the stronger level; nothing is blocked yet."
      : "A heads-up; capital keeps flowing.";
    return [
      {
        detector: "imbalanced",
        level: gate ? "gate" : "signal",
        playbookId: play.playbookId,
        reading: target.share,
        threshold: direction === "over" ? target.target + edge : target.target - edge,
        band: {
          target: target.target,
          direction,
          drift: target.drift,
          signal: target.signal,
          gate: target.gate,
        },
        words:
          `${name} has ${tenthPct(target.share)} of ${budget} deployed against a ${tenthPct(target.target)} target: ` +
          `${pts(target.drift)} points ${direction}, past its ${gate ? "gate" : "signal"} at ${pts(edge)}. ` +
          `${shut ? "Its window is shut right now. " : ""}${tail}`,
      },
    ];
  });
}
